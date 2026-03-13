<script setup>
defineOptions({
  name: 'ProductDetail'
});
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showToast, showConfirmDialog } from 'vant';
import { getProductDetail, buyProductAPI, seckillProductAPI, getShopsByIds } from '@/api/shop'; 
import { checkOrderCreateStatus } from '@/api/order';
import { toggleStar, likeComment, getComments, followUser } from '@/api/interaction';
import { getReviewList, addReview, removeReview } from '@/api/reviews';
import { getCurrentUser } from '@/api/user';
import { fileURL } from '@/utils/request';
import { throttle } from '@/utils/throttle';
import PageLayout from '@/components/PageLayout/PageLayout.vue';
import '@/assets/css/blog-detail.css';
import anonymousAvatar from '@/assets/images/anonymous.png';

const route = useRoute();
const router = useRouter();

const info = ref({});
const user = ref({});
const applicableShops = ref([]);

// Comments
const comments = ref([]);
const commentsLoading = ref(false);

// Comment Publish Modal
const showCommentPublish = ref(false);
const commentText = ref('');
const commentRating = ref(5);
const replyToComment = ref(null);
const replyRootId = ref(null);

// All Comments Popup
const showReviewPopup = ref(false);
const allComments = ref([]);
const allCommentsPage = ref(1);
const allCommentsLoading = ref(false);
const allCommentsNoMore = ref(false);

const validRules = computed(() => {
    if(!info.value.rules) return [];
    if(typeof info.value.rules === 'string') return [info.value.rules];
    return info.value.rules;
});

const validityTextSimple = computed(() => {
    const { validityType, useStartTime, useEndTime, validDays } = info.value;
    if (validityType === 1) {
        return `${useStartTime?.split(' ')[0] || ''} 至 ${useEndTime?.split(' ')[0] || ''}`;
    } else {
        return `购买后 ${validDays || 0} 天内有效`;
    }
});

const isSeckill = computed(() => info.value.activityType === 1);

const formatSeckillRange = (v) => {
    if(!v.beginTime || !v.endTime) return '';
    const format = (str) => {
        const d = new Date(str);
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${m}月${day}日`;
    };
    return `活动时间：${format(v.beginTime)} - ${format(v.endTime)}`;
};

const currTime = ref(Date.now());
let timer = null;

onMounted(() => {
    // Start a timer for countdown
    timer = setInterval(() => {
        currTime.value = Date.now();
    }, 1000);
});
onUnmounted(() => {
    if (timer) clearInterval(timer);
});

const isSeckillStarted = computed(() => {
    if(!info.value.beginTime) return false;
    return new Date(info.value.beginTime).getTime() <= currTime.value;
});
const isSeckillEnded = computed(() => {
    if(!info.value.endTime) return false;
    return new Date(info.value.endTime).getTime() <= currTime.value;
});

const remainingEndTimeStr = computed(() => {
    if(!info.value.endTime) return '';
    const diff = new Date(info.value.endTime).getTime() - currTime.value;
    if (diff <= 0) return '00:00:00';
    
    let totalSeconds = Math.floor(diff / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    
    const h = String(hours).padStart(2, '0');
    const m = String(mins).padStart(2, '0');
    const s = String(secs).padStart(2, '0');
    return `${h}:${m}:${s}`;
});

const getErrorMessage = (err, fallback = '抢购失败') => {
    if (!err) return fallback;
    if (typeof err === 'string') return err;
    if (typeof err.msg === 'string' && err.msg) return err.msg;
    if (typeof err.message === 'string' && err.message) return err.message;
    const responseData = err.response?.data;
    if (typeof responseData === 'string' && responseData) return responseData;
    return responseData?.errorMsg || responseData?.message || fallback;
};

const loadData = async () => {
    const id = route.query.id;
    if(!id) return;
    try {
        const res = await getProductDetail(id);
        const data = res.data || res;
        if(data) {
            info.value = data;
            
            // Format images array
            let rawImages = data.images || data.image || data.coverImg;
            if (rawImages) {
                let imgArr = typeof rawImages === 'string' ? rawImages.split(',') : (Array.isArray(rawImages) ? rawImages : [rawImages]);
                info.value.imageList = imgArr.filter(x => x).map(img => img.startsWith('http') ? img : fileURL + (img.startsWith('/') ? '' : '/') + img);
            } else {
                info.value.imageList = [];
            }
            
            // No division needed for new API
            
            if (data.isStar !== undefined) {
               info.value.isCollected = data.isStar;
            } else if (data.isStared !== undefined) {
               info.value.isCollected = data.isStared;
            } else {
               info.value.isCollected = false;
            }
            
            // Map isFollow
            if (data.isFollow !== undefined) {
                info.value.isFollow = data.isFollow;
            } else {
                info.value.isFollow = false;
            }

            // Fetch applicable shops
            if (data.shopId) {
                fetchApplicableShops(data.shopId);
            }
        }
    } catch (e) {
        console.error(e);
        showToast('加载失败');
    }
};

const fetchApplicableShops = async (ids) => {
    try {
        const res = await getShopsByIds(ids);
        applicableShops.value = res.data || res || [];
    } catch (e) {
        console.error('Failed to fetch applicable shops', e);
    }
};

const handleCollect = async () => {
  if(!localStorage.getItem('token')) return router.push('/user/login');
  
  const newState = !info.value.isCollected;
  info.value.isCollected = newState;
  
  try {
      await toggleStar({ sourceId: info.value.id, sourceType: 4, isStar: newState });
      showToast(newState ? '收藏成功' : '取消收藏');
  } catch (e) {
      info.value.isCollected = !newState; 
      showToast('操作失败');
  }
};

const handleFollow = async () => {
    if(!localStorage.getItem('token')) return router.push('/user/login');
    
    const newState = !info.value.isFollow;
    // Optimistic update
    info.value.isFollow = newState;
    
    try {
        await followUser({ sourceId: info.value.id, sourceType: 4, isFollow: newState }); 
        showToast(newState ? '关注成功，开抢将会提醒您' : '已取消提醒');
    } catch (e) {
        info.value.isFollow = !newState;
        showToast('操作失败');
        console.error(e);
    }
};

const pollOrderStatus = (orderId) => {
    return new Promise((resolve, reject) => {
        const toast = showToast({
            message: '正在创建订单...',
            forbidClick: true,
            duration: 0
        });
        
        let count = 0;
        const maxCount = 20;

        const check = () => {
            count++;
            checkOrderCreateStatus(orderId).then(res => {
                const payload = res?.data || {};
                let status = payload.data;
                // Handle wrapped response { code: 200, data: 'SUCCESS' }
                if (status && typeof status === 'object' && status.data) {
                     status = status.data;
                }

                if (status === 'SUCCESS' || status === '1' || status === true) {
                    toast.close();
                    resolve(orderId);
                } else if (status === 'FAILED' || status === '2' || status === false) {
                    toast.close();
                    reject(new Error(payload.errorMsg || payload.message || '下单失败'));
                } else {
                    if (count >= maxCount) {
                        toast.close();
                        reject(new Error('创建订单超时，请稍后在订单列表查看'));
                    } else {
                        setTimeout(check, 500);
                    }
                }
            }).catch(err => {
                toast.close();
                reject(new Error(getErrorMessage(err, '下单失败')));
            });
        };
        check();
    });
};

const handleBuy = async () => {
    if(!localStorage.getItem('token')) return router.push('/user/login');
    
    try {
        const api = isSeckill.value ? seckillProductAPI : buyProductAPI;
        if(isSeckill.value) {
            if(!isSeckillStarted.value) return showToast('抢购未开始');
            if(isSeckillEnded.value) return showToast('抢购已结束');
            if(info.value.stock < 1) return showToast('已抢光');
        }
        
        const res = await api(info.value.id);
        const orderId = typeof res === 'object' ? (res.data || res.orderId || res) : res;

        if (orderId) {
            try {
                await pollOrderStatus(orderId);
                showToast('抢购成功');
                // Navigate to Detail
                router.push('/order/detail?id=' + orderId);
            } catch (pollErr) {
                 showToast(getErrorMessage(pollErr, '抢购失败'));
            }
        } else {
            showToast('抢购失败');
        }
    } catch (e) {
        console.error(e);
        const msg = getErrorMessage(e, '抢购失败');
        if(msg.includes('库存') || msg.includes('stock')) {
           showToast('手慢了，已抢光');
        } else {
           showToast(msg);
        }
    }
};

const btnStatus = computed(() => {
    // 2. Normal Product Logic
    return {
        text: '¥' + (info.value.price || '') + ' 立即抢购',
        disabled: false,
        type: 'buy',
        action: handleBuy
    };
});

const seckillRightBtn = computed(() => {
    if (isSeckillEnded.value) {
        return { text: '已结束', disabled: true, action: () => {} };
    }
    if (!isSeckillStarted.value) {
        return { text: '未开始', disabled: true, action: () => {} };
    }
    if (info.value.stock < 1) {
        return { text: '已抢完', disabled: true, action: () => {} };
    }
    return { text: '🔥 立即抢购', disabled: false, action: handleBuy };
});

const openShopList = () => {
    const el = document.querySelector('.shop-list-group');
    if(el) el.scrollIntoView({ behavior: 'smooth' });
};

const goToShop = (id) => {
    if(id) router.push(`/shop/detail?id=${id}`);
};

// --- Comment Methods ---
const queryUser = async () => {
    try {
        const res = await getCurrentUser();
        let u = res.data || res;
        if(u && u.data) u = u.data;
        user.value = u || {};
        if(user.value.icon) user.value.icon = fileURL + user.value.icon;
    } catch(e) {
        console.error('Failed to fetch user', e);
    }
};

const loadComments = async () => {
    if(commentsLoading.value) return;
    commentsLoading.value = true;
    try {
        const res = await getReviewList({ sourceType: 4, sourceId: info.value.id, current: 1, size: 20, status: 1 });
        let list = [];
        if (Array.isArray(res)) list = res;
        else if (res && Array.isArray(res.data)) list = res.data;
        else if (res && res.data && Array.isArray(res.data.records)) list = res.data.records;
        else if (res && res.data && Array.isArray(res.data.list)) list = res.data.list;
        
        comments.value = list.map(c => ({
            ...c,
            userIcon: (c.userIcon || c.icon) ? ((c.userIcon || c.icon).startsWith('http') ? (c.userIcon || c.icon) : fileURL + ((c.userIcon || c.icon).startsWith('/') ? '' : '/') + (c.userIcon || c.icon)) : anonymousAvatar,
            images: c.images ? c.images.split(',').filter(x=>x).map(i => i.startsWith('http') ? i : fileURL + (i.startsWith('/') ? '' : '/') + i) : [],
            rating: c.score || c.rating || 5,
            isLike: c.isLike || false,
            liked: c.liked || 0,
            comments: c.replyCount || c.comments || c.childCount || 0,
            showReplies: false,
            replies: [],
            replyPage: 1
        }));
    } catch(e) {
        console.error('Failed to load comments', e);
    } finally {
        commentsLoading.value = false;
    }
};

const handleCommentLike = async (c) => {
    if(!user.value.id) return router.push('/user/login');
    const oldState = c.isLike;
    c.isLike = !c.isLike;
    c.liked = c.isLike ? (c.liked || 0) + 1 : (c.liked || 1) - 1;
    try {
        await likeComment(c.id);
    } catch(e) {
        c.isLike = oldState;
        c.liked = c.isLike ? (c.liked || 0) + 1 : (c.liked || 1) - 1;
    }
};

const handleCommentReply = (c, rootId) => {
    if(!user.value.id) return router.push('/user/login');
    replyToComment.value = c;
    replyRootId.value = rootId || null;
    commentText.value = '';
    showCommentPublish.value = true;
};

const handleCommentDelete = async (c) => {
    try {
        await showConfirmDialog({
            title: '提示',
            message: '确定删除该评论吗？',
            confirmButtonText: '确认',
            cancelButtonText: '取消',
        });
        await removeReview(c.id);
        showToast('删除成功');
        loadComments();
    } catch(e) {
        // Cancelled or error
    }
};

const toggleReplies = (comment) => {
    if (!comment.showReplies) {
        comment.showReplies = true;
        if (!comment.replies || comment.replies.length === 0) {
            comment.replyPage = 1;
            fetchReplies(comment);
        }
    } else {
        if (comment.replies.length < comment.comments) {
            comment.replyPage = (comment.replyPage || 1) + 1;
            fetchReplies(comment);
        } else {
            comment.showReplies = false;
        }
    }
};

const fetchReplies = async (comment) => {
    try {
        const res = await getComments({
            sourceId: comment.id,
            sourceType: 7,
            current: comment.replyPage || 1,
            size: 10
        });
        let list = [];
        if (Array.isArray(res)) list = res;
        else if (res && Array.isArray(res.data)) list = res.data;
        else if (res && res.data && Array.isArray(res.data.records)) list = res.data.records;
        
        const newReplies = list.map(r => ({
            ...r,
            userIcon: (r.userIcon || r.icon) ? ((r.userIcon || r.icon).startsWith('http') ? (r.userIcon || r.icon) : fileURL + ((r.userIcon || r.icon).startsWith('/') ? '' : '/') + (r.userIcon || r.icon)) : '',
            images: r.images ? r.images.split(',').filter(x=>x).map(i => i.startsWith('http') ? i : fileURL + (i.startsWith('/') ? '' : '/') + i) : [],
            liked: r.liked || 0,
            isLike: r.isLike || false
        }));
        
        if (comment.replyPage === 1) {
            comment.replies = newReplies;
        } else {
            comment.replies = [...comment.replies, ...newReplies];
        }
        
        if (res && res.data && res.data.total) {
            comment.comments = res.data.total;
        }
        if (list.length < 10 && comment.replies.length < comment.comments) {
            comment.comments = comment.replies.length;
        }
    } catch(e) {
        console.error('Failed to fetch replies', e);
    }
};

const closeCommentModal = () => {
    showCommentPublish.value = false;
    commentText.value = '';
    replyToComment.value = null;
    replyRootId.value = null;
    commentRating.value = 5;
};

const publishComment = async () => {
    if(!user.value.id) return router.push('/user/login');
    if(!commentText.value.trim()) return showToast('请输入内容');
    
    // For products/vouchers, sourceId is the product id
    const data = {
        content: commentText.value,
        rating: commentRating.value,
        type: 4, // Product/Voucher. Assuming 4 is still valid for Product as it evolved from Voucher.
        sourceId: info.value.id,
        userId: user.value.id,
        images: ''
    };
    
    if (replyToComment.value) {
        // Import addComment for replies
        const { addComment } = await import('@/api/interaction');
        const replyData = {
            content: commentText.value,
            sourceId: replyToComment.value.id,
            userId: user.value.id,
            parentId: 0,
            answerId: 0,
            images: ''
        };
        if (replyRootId.value) {
            // Level 2: Reply to Comment (Sub-reply)
            replyData.sourceType = 5;
            replyData.answerId = replyToComment.value.id;
            replyData.parentId = replyRootId.value;
        } else {
            // Level 1: Comment on Review
            replyData.sourceType = 7;
        }
        await addComment(replyData);
    } else {
        await addReview(data);
    }
    
    try {
        showToast('发布成功');
        closeCommentModal();
        loadComments();
    } catch(e) {
        showToast('发布失败');
    }
};

const viewAllComments = () => {
    showReviewPopup.value = true;
    allComments.value = [];
    allCommentsPage.value = 1;
    allCommentsNoMore.value = false;
    loadAllComments();
};

const loadAllComments = async () => {
    if(allCommentsLoading.value || allCommentsNoMore.value) return;
    allCommentsLoading.value = true;
    try {
        const res = await getReviewList({ sourceType: 4, sourceId: info.value.id, current: allCommentsPage.value, size: 10, status: 1 });
        let list = [];
        if (Array.isArray(res)) list = res;
        else if (res && Array.isArray(res.data)) list = res.data;
        else if (res && res.data && Array.isArray(res.data.records)) list = res.data.records;
        else if (res && res.data && Array.isArray(res.data.list)) list = res.data.list;
        
        if(!list || list.length === 0) {
            allCommentsNoMore.value = true;
        } else {
            const newItems = list.map(c => ({
                ...c,
                userIcon: (c.userIcon || c.icon) ? ((c.userIcon || c.icon).startsWith('http') ? (c.userIcon || c.icon) : fileURL + ((c.userIcon || c.icon).startsWith('/') ? '' : '/') + (c.userIcon || c.icon)) : anonymousAvatar,
                images: c.images ? c.images.split(',').filter(x=>x).map(i => i.startsWith('http') ? i : fileURL + (i.startsWith('/') ? '' : '/') + i) : [],
                rating: c.score || c.rating || 5,
                isLike: c.isLike || false,
                liked: c.liked || 0,
                comments: c.replyCount || c.comments || c.childCount || 0,
                showReplies: false,
                replies: [],
                replyPage: 1
            }));
            allComments.value = [...allComments.value, ...newItems];
            if(list.length < 10) {
                allCommentsNoMore.value = true;
            } else {
                allCommentsPage.value++;
            }
        }
    } catch(e) {
        console.error('Failed to load all comments', e);
    } finally {
        allCommentsLoading.value = false;
    }
};

const onPopupScroll = throttle((e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.target;
    if(scrollTop + clientHeight >= scrollHeight - 50) {
        loadAllComments();
    }
}, 120);

const formatDate = (time) => {
    if(!time) return '';
    const d = new Date(time);
    const now = new Date();
    const diff = (now - d) / 1000;
    if(diff < 60) return '刚刚';
    if(diff < 3600) return Math.floor(diff / 60) + '分钟前';
    if(diff < 86400) return Math.floor(diff / 3600) + '小时前';
    if(diff < 86400 * 30) return Math.floor(diff / 86400) + '天前';
    return `${d.getMonth()+1}月${d.getDate()}日`;
};

const toUserDetail = (userId) => {
    if(!userId) return;
    if(user.value && String(user.value.id) === String(userId)) {
        router.push('/user/profile');
    } else {
        router.push(`/user/profile/${userId}`);
    }
};

const toReviewDetail = (comment) => {
    if (!comment || !comment.id) return;
    router.push({
        name: 'ReviewDetail',
        query: { id: comment.id }
    });
};

onMounted(async () => {
    await loadData();
    await queryUser();
    if(info.value.id) {
        loadComments();
    }
});

onUnmounted(() => {
    if (typeof onPopupScroll?.cancel === 'function') {
        onPopupScroll.cancel();
    }
});
</script>

<template>
  <PageLayout :loading="false" skeleton-type="detail" class="voucher-detail-page">
    <van-nav-bar title="商品详情" left-arrow @click-left="$router.back()" fixed placeholder z-index="99" />

    <!-- Image Banner (16:9) -->
    <div class="product-banner" v-if="info.imageList && info.imageList.length > 0">
        <van-swipe class="banner-swipe" :autoplay="3000" indicator-color="white">
            <van-swipe-item v-for="(img, idx) in info.imageList" :key="idx">
                <img :src="img" class="banner-img" />
            </van-swipe-item>
        </van-swipe>
    </div>

    <!-- Main Card -->
    <div class="main-card">
       <div class="price-row">
          <span class="currency">¥</span>
          <span class="amount">{{ info.price }}</span>
          <span class="discount-tag" v-if="info.originalPrice && info.price < info.originalPrice">{{ (info.price / info.originalPrice * 10).toFixed(1).replace('.0', '') }}折</span>
          <span class="original" v-if="info.originalPrice">¥{{ info.originalPrice }}</span>
       </div>
       <div class="card-title">
          {{ info.name || '商品详情' }}
          <span class="tag-seckill" v-if="isSeckill">秒杀</span>
          <span class="tag-return">随时退</span>
       </div>
       
       <!-- Countdown Bar -->
       <div class="countdown-bar" v-if="isSeckill && isSeckillStarted && !isSeckillEnded">
           <span class="lightning-icon">⚡</span>
           <span>倒计时: </span>
           <span class="custom-countdown">{{ remainingEndTimeStr }}</span>
       </div>
    </div>

    <!-- Validity Time Range -->
    <div class="validity-range-bar" v-if="isSeckill">
        <div class="v-main"><span class="v-label">秒杀时段：</span>{{ formatSeckillRange(info).replace('活动时间：', '') }}</div>
        <div class="v-hint">温馨提示：仅在此活动时间段内，可按展示的秒杀价购买</div>
    </div>

    <!-- Info Cells -->
    <div class="info-group">
        <div class="info-cell is-link" @click="openShopList">
            <div class="cell-icon icon-shop">
                <i class="el-icon-s-shop"></i>
            </div>
            <div class="cell-content">
                <div class="cell-title">适用门店</div>
                <div class="cell-sub">{{ applicableShops.length }}家门店可用</div>
            </div>
            <i class="el-icon-arrow-right cell-arrow"></i>
        </div>
        
        <div class="info-cell">
            <div class="cell-icon icon-time">
                <i class="el-icon-time"></i>
            </div>
            <div class="cell-content">
                <div class="cell-title">商品有效期</div>
                <div class="cell-sub">抢购成功后：{{ validityTextSimple.replace('购买后 ', '') }}</div>
            </div>
        </div>
    </div>

    <!-- Rules -->
    <div class="section-card">
        <div class="section-header">使用规则</div>
        <div class="rules-content">
             <div v-if="validRules.length === 0">暂无详细规则</div>
             <div v-else v-for="(rule, i) in validRules" :key="i">{{rule}}</div>
        </div>
    </div>

    <!-- Applicable Shops List -->
    <div class="section-card">
        <div class="section-header">适用门店列表</div>
        <div class="shop-list-group">
            <div class="shop-item" v-for="shop in applicableShops" :key="shop.id" @click="goToShop(shop.id)">
                <div class="shop-name">{{ shop.name }}</div>
                <div class="shop-addr">
                    <i class="el-icon-location-outline"></i> 
                    <span class="addr-text">{{ shop.address }}</span>
                </div>
                <i class="el-icon-arrow-right shop-arrow"></i>
            </div>
            <div v-if="applicableShops.length === 0" class="empty-shops">
                暂无门店信息
            </div>
        </div>
    </div>

    <!-- Comments Section -->
    <div class="section-card comments-section">
        <div class="section-header">网友评价 <span class="count">({{comments.length || 0}})</span></div>
        
        <div class="empty-comments" v-if="comments.length === 0">
            <div class="empty-text">暂无评价，快来抢沙发～</div>
        </div>
        
        <div class="comment-box" v-for="c in comments.slice(0, 3)" :key="c.id">
            <div class="comment-icon" @click.stop="toUserDetail(c.userId)">
                <img :src="c.userIcon || '/imgs/icons/default-icon.png'">
            </div>
            <div class="comment-info">
                <div class="comment-user" @click.stop="toUserDetail(c.userId)">
                    {{c.nickName || '匿名用户'}} <span>Lv{{c.userLevel || 1}}</span>
                </div>
                <div class="comment-rating">
                    <el-rate :model-value="c.rating" disabled size="small"></el-rate>
                    <span class="score">{{c.rating}}分</span>
                </div>
                <div class="comment-content" @click="toReviewDetail(c)">{{c.content}}</div>
                <div class="comment-images" v-if="c.images && c.images.length">
                    <img v-for="(img, idx) in c.images" :key="idx" :src="img">
                </div>
                <div class="comment-stats">
                    <div class="comment-interactions">
                        <span class="comment-time">{{formatDate(c.createTime)}}</span>
                        <div class="comment-actions">
                            <div class="c-action-btn" @click.stop="handleCommentLike(c)">
                                <svg viewBox="0 0 24 24" width="16" height="16">
                                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" :fill="c.isLike ? '#ff2442' : '#999'"></path>
                                </svg>
                                {{c.liked || 0}}
                            </div>
                            <div class="c-action-btn" @click.stop="handleCommentReply(c)">
                                <i class="el-icon-chat-dot-square"></i>
                            </div>
                            <div class="c-action-btn delete-btn" v-if="user && user.id === c.userId" @click.stop="handleCommentDelete(c)">
                                <i class="el-icon-delete"></i>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Replies -->
                    <div class="comment-replies" v-if="c.comments > 0">
                        <div class="reply-expand" v-if="!c.showReplies" @click.stop="toggleReplies(c)">
                            展开{{c.comments}}条回复 <i class="el-icon-arrow-down"></i>
                        </div>
                        
                        <template v-if="c.showReplies">
                            <div class="reply-item" v-for="r in c.replies" :key="r.id">
                                <div class="reply-avatar" @click.stop="toUserDetail(r.userId)">
                                    <img :src="r.userIcon || '/imgs/icons/default-icon.png'" alt="">
                                </div>
                                <div class="reply-main">
                                    <div class="reply-header">
                                        <span class="reply-user" @click.stop="toUserDetail(r.userId)">{{r.nickName || '匿名用户'}}</span>
                                    </div>
                                    <div class="reply-content">
                                        <span v-if="r.replyToName" class="reply-target">回复 @{{r.replyToName}}</span>
                                        {{r.content}}
                                    </div>
                                    <div class="reply-actions">
                                        <span class="reply-time" style="margin-right: 10px;">{{formatDate(r.createTime)}}</span>
                                        <div class="c-action-btn" @click.stop="handleCommentLike(r)">
                                            <svg viewBox="0 0 24 24" width="16" height="16">
                                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" :fill="r.isLike ? '#ff2442' : '#999'"></path>
                                            </svg>
                                            <span v-if="r.liked > 0">{{r.liked}}</span>
                                        </div>
                                        <div class="c-action-btn" @click.stop="handleCommentReply(r, c.id)">
                                            <i class="el-icon-chat-dot-square"></i>
                                        </div>
                                        <div class="c-action-btn delete-btn" v-if="user && user.id === r.userId" @click.stop="handleCommentDelete(r)">
                                            <i class="el-icon-delete"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="reply-expand" v-if="c.replies.length > 0" @click.stop="toggleReplies(c)">
                                <template v-if="c.replies.length < Number(c.comments)">
                                    展开更多回复 <i class="el-icon-arrow-down"></i>
                                </template>
                                <template v-else>
                                    收起回复 <i class="el-icon-arrow-up"></i>
                                </template>
                            </div>
                        </template>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="view-all" v-if="comments.length > 0" @click="viewAllComments">
            查看全部{{comments.length}}条评价 <i class="el-icon-arrow-right"></i>
        </div>
    </div>

    <!-- Comment Publish Modal -->
    <div class="comment-pop-overlay" v-if="showCommentPublish" @click="closeCommentModal">
        <div class="comment-pop-box" @click.stop>
            <div class="pop-header">
                <span class="pop-title">{{ replyToComment ? ('回复 @' + replyToComment.nickName) : '发表评价' }}</span>
                <i class="el-icon-close pop-close" @click="closeCommentModal"></i>
            </div>
            <div class="pop-textarea">
                <textarea 
                    v-model="commentText" 
                    placeholder="分享你的使用体验..." 
                    :maxlength="500"
                    rows="3"
                ></textarea>
            </div>
            <div class="pop-toolbar">
                <div class="pop-toolbar-left">
                    <div class="pop-rating-inline" v-if="!replyToComment">
                        <el-rate v-model="commentRating" :colors="['#99A9BF', '#F7BA2A', '#FF9900']"></el-rate>
                    </div>
                </div>
                <el-button type="primary" size="small" :disabled="!commentText.trim()" @click="publishComment">发送</el-button>
            </div>
        </div>
    </div>

    <!-- All Comments Popup -->
    <div class="review-popup-overlay" v-if="showReviewPopup" @click="showReviewPopup = false">
        <div class="review-popup-sheet" @click.stop>
            <div class="review-popup-header">
                <span class="review-popup-title">全部评价 ({{comments.length || 0}})</span>
                <i class="el-icon-close review-popup-close" @click="showReviewPopup = false"></i>
            </div>
            <div class="review-popup-body" @scroll.passive="onPopupScroll">
                <div v-if="allComments.length === 0 && !allCommentsLoading" class="empty-reviews">
                    <i class="el-icon-chat-round"></i>
                    <p>暂无评价</p>
                </div>
                
                <div class="comment-box" v-for="c in allComments" :key="c.id">
                    <div class="comment-icon" @click.stop="toUserDetail(c.userId)">
                        <img :src="c.userIcon || '/imgs/icons/default-icon.png'">
                    </div>
                    <div class="comment-info">
                        <div class="comment-user" @click.stop="toUserDetail(c.userId)">
                            {{c.nickName || '匿名用户'}} <span>Lv{{c.userLevel || 1}}</span>
                        </div>
                        <div class="comment-rating">
                            <el-rate :model-value="c.rating" disabled size="small"></el-rate>
                            <span class="score">{{c.rating}}分</span>
                        </div>
                        <div class="comment-content" @click="toReviewDetail(c)">{{c.content}}</div>
                        <div class="comment-images" v-if="c.images && c.images.length">
                            <img v-for="(img, idx) in c.images" :key="idx" :src="img">
                        </div>
                        <div class="comment-interactions">
                            <span class="comment-time">{{formatDate(c.createTime)}}</span>
                            <div class="comment-actions">
                                <div class="c-action-btn" @click.stop="handleCommentLike(c)">
                                    <svg viewBox="0 0 24 24" width="16" height="16">
                                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" :fill="c.isLike ? '#ff2442' : '#999'"></path>
                                    </svg>
                                    {{c.liked || 0}}
                                </div>
                                <div class="c-action-btn" @click.stop="handleCommentReply(c)">
                                    <i class="el-icon-chat-dot-square"></i>
                                </div>
                                <div class="c-action-btn delete-btn" v-if="user && user.id === c.userId" @click.stop="handleCommentDelete(c)">
                                    <i class="el-icon-delete"></i>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Replies in Popup -->
                        <div class="comment-replies" v-if="c.comments > 0">
                            <div class="reply-expand" v-if="!c.showReplies" @click.stop="toggleReplies(c)">
                                展开{{c.comments}}条回复 <i class="el-icon-arrow-down"></i>
                            </div>
                            
                            <template v-if="c.showReplies">
                                <div class="reply-item" v-for="r in c.replies" :key="r.id">
                                    <div class="reply-avatar" @click.stop="toUserDetail(r.userId)">
                                        <img :src="r.userIcon || '/imgs/icons/default-icon.png'" alt="">
                                    </div>
                                    <div class="reply-main">
                                        <div class="reply-header">
                                            <span class="reply-user" @click.stop="toUserDetail(r.userId)">{{r.nickName || '匿名用户'}}</span>
                                        </div>
                                        <div class="reply-content">
                                            <span v-if="r.replyToName" class="reply-target">回复 @{{r.replyToName}}</span>
                                            {{r.content}}
                                        </div>
                                        <div class="reply-actions">
                                            <span class="reply-time" style="margin-right: 10px;">{{formatDate(r.createTime)}}</span>
                                            <div class="c-action-btn" @click.stop="handleCommentLike(r)">
                                                <svg viewBox="0 0 24 24" width="16" height="16">
                                                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" :fill="r.isLike ? '#ff2442' : '#999'"></path>
                                                </svg>
                                                <span v-if="r.liked > 0">{{r.liked}}</span>
                                            </div>
                                            <div class="c-action-btn" @click.stop="handleCommentReply(r, c.id)">
                                                <i class="el-icon-chat-dot-square"></i>
                                            </div>
                                            <div class="c-action-btn delete-btn" v-if="user && user.id === r.userId" @click.stop="handleCommentDelete(r)">
                                                <i class="el-icon-delete"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="reply-expand" v-if="c.replies.length > 0" @click.stop="toggleReplies(c)">
                                    <template v-if="c.replies.length < Number(c.comments)">
                                        展开更多回复 <i class="el-icon-arrow-down"></i>
                                    </template>
                                    <template v-else>
                                        收起回复 <i class="el-icon-arrow-up"></i>
                                    </template>
                                </div>
                            </template>
                        </div>
                    </div>
                </div>
                 <div class="loading-more" v-if="allCommentsLoading">加载中...</div>
                 <div class="no-more" v-if="allCommentsNoMore">没有更多了</div>
            </div>
        </div>
    </div>

    <!-- Buy Bar -->
    <div class="buy-action-bar">
        <div class="action-icons">
             <div class="icon-btn" @click="openShopList">
                 <i class="el-icon-s-shop"></i>
                 <span>店铺</span>
             </div>
             <div class="icon-btn" @click="handleCollect">
                 <i class="el-icon-star-on" :style="{color: info.isCollected?'#ff9900':'#333'}"></i>
                 <span>{{info.isCollected?'已收藏':'收藏'}}</span>
             </div>
        </div>
        <div class="action-btn-group">
            <div v-if="isSeckill" style="display: flex; gap: 8px;">
                 <van-button 
                     :type="info.isFollow ? 'primary' : 'warning'" 
                     :plain="!info.isFollow"
                     style="width: 50%;"
                     round 
                     @click="handleFollow"
                 >
                     {{ info.isFollow ? '已关注提醒' : '关注提醒' }}
                 </van-button>
                 <van-button 
                     type="danger" 
                     style="width: 50%;"
                     round 
                     :disabled="seckillRightBtn.disabled"
                     @click="seckillRightBtn.action"
                 >
                     {{ seckillRightBtn.text }}
                 </van-button>
            </div>
            <van-button 
                v-else
                :type="btnStatus.type === 'collect' ? 'warning' : 'danger'" 
                block 
                round 
                :disabled="btnStatus.disabled"
                @click="btnStatus.action"
            >
                {{ btnStatus.text }}
            </van-button>
        </div>
    </div>
  </PageLayout>
</template>

<style scoped>
.voucher-detail-page {
    background: #f8f9fa;
    min-height: 100vh;
    padding-bottom: 80px;
}

.product-banner {
    width: 100%;
    aspect-ratio: 16 / 9;
    background: #f0f0f0;
    overflow: hidden;
}

.banner-swipe {
    width: 100%;
    height: 100%;
}

.banner-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.main-card {
    background: #fff;
    margin: -16px 12px 12px;
    padding: 20px 16px;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.05);
    position: relative;
    z-index: 2;
}
.product-detail-status {
    margin: 0 12px 12px;
    padding: 0;
}

.price-row {
    display: flex;
    align-items: baseline;
    margin-bottom: 12px;
}

.currency {
    font-size: 18px;
    color: #ff4d4f;
    font-weight: 600;
}

.amount {
    font-size: 32px;
    color: #ff4d4f;
    font-weight: 700;
    margin: 0 4px;
}

.discount-tag {
    background: #ff4d4f;
    color: #fff;
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 4px;
    margin-left: 8px;
    vertical-align: bottom;
}

.original {
    font-size: 14px;
    color: #666;
    text-decoration: line-through;
    text-decoration-color: #666;
    margin-left: 8px;
}

.card-title {
    font-size: 18px;
    font-weight: 600;
    color: #333;
    line-height: 1.4;
    margin-bottom: 12px;
}

.tag-seckill {
    background: linear-gradient(90deg, #ff4d4f, #ff7875);
    color: #fff;
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 4px;
    margin-left: 8px;
    vertical-align: middle;
}

.tag-return {
    border: 1px solid #52c41a;
    color: #52c41a;
    font-size: 11px;
    padding: 1px 6px;
    border-radius: 4px;
    margin-left: 8px;
    vertical-align: middle;
}

.countdown-bar {
    background: #fff1f0;
    border-radius: 12px;
    padding: 10px 16px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #ff4d4f;
}

.lightning-icon {
    font-size: 16px;
}

.custom-countdown {
    color: #ff4d4f;
    font-weight: 600;
}

.validity-range-bar {
    background: #fff;
    margin: 0 12px 12px;
    padding: 12px 16px;
    border-radius: 12px;
    font-size: 13px;
    color: #666;
}

.v-main {
    font-weight: 500;
    color: #333;
    margin-bottom: 4px;
}

.v-label {
    color: #ff4d4f;
    font-weight: 600;
}

.v-hint {
    font-size: 11px;
    color: #999;
}

.info-group {
    background: #fff;
    margin: 12px;
    border-radius: 16px;
    overflow: hidden;
}

.info-cell {
    display: flex;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid #f0f0f0;
}

.info-cell:last-child {
    border-bottom: none;
}

.info-cell.is-link:active {
    background: #f5f5f5;
}

.cell-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 12px;
    font-size: 20px;
}

.icon-shop { background: #e6f7ff; color: #1890ff; }
.icon-time { background: #f6ffed; color: #52c41a; }

.cell-content {
    flex: 1;
}

.cell-title {
    font-size: 15px;
    font-weight: 600;
    color: #333;
}

.cell-sub {
    font-size: 12px;
    color: #999;
    margin-top: 2px;
}

.cell-arrow {
    color: #ccc;
    font-size: 14px;
}

.section-card {
    background: #fff;
    margin: 12px;
    padding: 20px 16px;
    border-radius: 16px;
}

.section-header {
    font-size: 16px;
    font-weight: 700;
    color: #333;
    margin-bottom: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.rules-content {
    font-size: 14px;
    color: #666;
    line-height: 1.8;
}

.shop-list-group {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.shop-item {
    padding: 16px;
    background: #fff;
    border-radius: 12px;
    position: relative;
    border: 1px solid #f0f0f0;
}

.shop-name {
    font-size: 16px;
    font-weight: bold;
    color: #333;
    margin-bottom: 8px;
    padding-right: 20px;
}

.shop-addr {
    font-size: 13px;
    color: #999;
    display: flex;
    align-items: flex-start;
    gap: 4px;
    line-height: 1.4;
    padding-right: 20px;
}

.addr-text {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

.shop-arrow {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #ccc;
}

.empty-shops {
    padding: 20px;
    text-align: center;
    color: #999;
    font-size: 14px;
}

.comments-section .count {
    font-weight: normal;
    color: #999;
}

.comment-box {
    display: flex;
    gap: 12px;
    margin-bottom: 24px;
}

.comment-icon img {
    width: 44px;
    height: 44px;
    border-radius: 22px;
    object-fit: cover;
}

.comment-info {
    flex: 1;
}

.comment-user {
    font-size: 14px;
    font-weight: 600;
    color: #333;
    margin-bottom: 4px;
}

.comment-user span {
    font-size: 10px;
    background: #fff7e6;
    color: #ffa940;
    padding: 1px 6px;
    border-radius: 4px;
    margin-left: 6px;
}

.comment-rating {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
}

.score {
    font-size: 12px;
    color: #ff9900;
    font-weight: 600;
}

.comment-content {
    font-size: 14px;
    color: #333;
    line-height: 1.6;
    margin-bottom: 10px;
}

.comment-images {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 10px;
}

.comment-images img {
    width: 80px;
    height: 80px;
    border-radius: 8px;
    object-fit: cover;
}

.comment-interactions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    color: #999;
}

.comment-actions {
    display: flex;
    gap: 16px;
}

.c-action-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
}

.delete-btn { color: #ff7875; }

.view-all {
    text-align: center;
    padding: 16px 0 0;
    color: #666;
    font-size: 14px;
    border-top: 1px solid #f0f0f0;
}

.buy-action-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 70px;
    background: #fff;
    display: flex;
    align-items: center;
    padding: 0 16px;
    padding-bottom: env(safe-area-inset-bottom);
    box-shadow: 0 -4px 10px rgba(0,0,0,0.05);
    z-index: 100;
}

.action-icons {
    display: flex;
    gap: 20px;
    margin-right: 20px;
}

.icon-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    font-size: 10px;
    color: #666;
}

.icon-btn i {
    font-size: 22px;
}

.action-btn-group {
    flex: 1;
}

.comment-pop-overlay {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.6);
    z-index: 1000;
    display: flex; align-items: flex-end;
}

.comment-pop-box {
    width: 100%; background: #fff;
    border-radius: 20px 20px 0 0;
    padding: 20px;
}
</style>
