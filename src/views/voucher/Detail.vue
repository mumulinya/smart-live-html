<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showToast, showConfirmDialog } from 'vant';
import { getVoucherDetail, buyVoucherAPI, seckillVoucherAPI } from '@/api/shop'; 
import { toggleStar, likeComment, getComments } from '@/api/interaction';
import { getReviewList, addReview, removeReview } from '@/api/reviews';
import { getCurrentUser } from '@/api/user';
import { fileURL } from '@/utils/request';
import PageLayout from '@/components/PageLayout/PageLayout.vue';
import '@/assets/css/blog-detail.css';

const route = useRoute();
const router = useRouter();

const info = ref({});
const user = ref({});

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
        return `领取/购买后 ${validDays} 天内有效`;
    }
});

const isSeckill = computed(() => info.value.type === 1);

const isSeckillStarted = computed(() => {
    if(!info.value.beginTime) return false;
    return new Date(info.value.beginTime).getTime() <= Date.now();
});
const isSeckillEnded = computed(() => {
    if(!info.value.endTime) return false;
    return new Date(info.value.endTime).getTime() <= Date.now();
});

const remainingEndTime = computed(() => {
    if(!info.value.endTime) return 0;
    return new Date(info.value.endTime).getTime() - Date.now();
});

const formatSeckillRange = (v) => {
    if(!v.beginTime || !v.endTime) return '';
    const format = (str) => {
        const d = new Date(str);
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const h = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        return `${m}.${day} ${h}:${min}`;
    };
    return `${format(v.beginTime)} - ${format(v.endTime)}`;
};

const loadData = async () => {
    const id = route.query.id;
    if(!id) return;
    try {
        const res = await getVoucherDetail(id);
        const data = res.data || res;
        if(data) {
            info.value = data;
            if (data.isStar !== undefined) {
               info.value.isCollected = data.isStar;
            } else if (data.isStared !== undefined) {
               info.value.isCollected = data.isStared;
            } else {
               info.value.isCollected = false;
            }
        }
    } catch (e) {
        console.error(e);
        showToast('加载失败');
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

const handleBuy = async () => {
    if(!localStorage.getItem('token')) return router.push('/user/login');
    
    try {
        const api = isSeckill.value ? seckillVoucherAPI : buyVoucherAPI;
        if(isSeckill.value) {
            if(!isSeckillStarted.value) return showToast('抢购未开始');
            if(isSeckillEnded.value) return showToast('抢购已结束');
            if(info.value.stock < 1) return showToast('已抢光');
        }
        
        const res = await api(info.value.id);
        const orderId = typeof res === 'object' ? (res.data || res.orderId || res) : res;

        showToast('抢购成功');
        
        if (orderId) {
            setTimeout(() => {
                router.push(`/order/detail?id=${orderId}`);
            }, 500);
        } else {
            loadData(); 
        }
    } catch (e) {
        console.error(e);
        const msg = e.msg || e.message || '抢购失败';
        // Handle specific error codes if known, e.g. "Duplicate purchase"
        if(msg.includes('库存') || msg.includes('stock')) {
           showToast('手慢了，已抢光');
        } else {
           showToast(msg);
        }
    }
};

const handleBtnClick = () => {
    handleBuy();
};

const openShopList = () => {
    // Just a placeholder for now, usually scrolls to shop list or opens a popup
    // For now we scroll to bottom if needed?
    // Or just no-op as the shop list is already visible below
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
        const res = await getReviewList({ sourceType: 4, sourceId: info.value.id, current: 1, size: 20 });
        let list = [];
        if (Array.isArray(res)) list = res;
        else if (res && Array.isArray(res.data)) list = res.data;
        else if (res && res.data && Array.isArray(res.data.records)) list = res.data.records;
        else if (res && res.data && Array.isArray(res.data.list)) list = res.data.list;
        
        comments.value = list.map(c => ({
            ...c,
            userIcon: (c.userIcon || c.icon) ? ((c.userIcon || c.icon).startsWith('http') ? (c.userIcon || c.icon) : fileURL + ((c.userIcon || c.icon).startsWith('/') ? '' : '/') + (c.userIcon || c.icon)) : '',
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
    
    const data = {
        content: commentText.value,
        rating: commentRating.value,
        type: 4, // Voucher
        sourceId: info.value.id,
        userId: user.value.id,
        images: ''
    };
    
    // For replies, we still use addComment from interaction API
    // For new reviews, we use addReview
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
        const res = await getReviewList({ sourceType: 4, sourceId: info.value.id, current: allCommentsPage.value, size: 10 });
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
                userIcon: (c.userIcon || c.icon) ? ((c.userIcon || c.icon).startsWith('http') ? (c.userIcon || c.icon) : fileURL + ((c.userIcon || c.icon).startsWith('/') ? '' : '/') + (c.userIcon || c.icon)) : '',
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

const onPopupScroll = (e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.target;
    if(scrollTop + clientHeight >= scrollHeight - 50) {
        loadAllComments();
    }
};

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

const writeCommentFromPopup = () => {
    if(!user.value.id) return router.push('/user/login');
    replyToComment.value = null;
    replyRootId.value = null;
    commentText.value = '';
    showCommentPublish.value = true;
};

onMounted(async () => {
    await loadData();
    await queryUser();
    if(info.value.id) {
        loadComments();
    }
});
</script>

<template>
  <PageLayout :loading="false" skeleton-type="detail" class="voucher-detail-page">
    <van-nav-bar title="代金券详情" left-arrow @click-left="$router.back()" fixed placeholder z-index="99" />

    <!-- Main Card -->
    <div class="main-card">
       <div class="price-row">
          <span class="currency">¥</span>
          <span class="amount">{{ info.payValue }}</span>
          <span class="original">¥{{ info.actualValue }}</span>
       </div>
       <div class="card-title">
          {{ info.title || (info.actualValue + '元代金券') }}
          <span class="tag-seckill" v-if="isSeckill">秒杀</span>
          <span class="tag-return">随时退</span>
       </div>
       
       <!-- Countdown Bar -->
       <div class="countdown-bar" v-if="isSeckill && !isSeckillEnded">
           <span class="lightning-icon">⚡</span>
           <span>倒计时: </span>
           <van-count-down :time="remainingEndTime" format="DD天HH小时mm分钟" class="custom-countdown" />
       </div>
    </div>

    <!-- Validity Time Range -->
    <div class="validity-range-bar" v-if="isSeckill">
        {{ formatSeckillRange(info) }}
    </div>

    <!-- Info Cells -->
    <div class="info-group">
        <div class="info-cell is-link" @click="openShopList">
            <div class="cell-icon icon-shop">
                <i class="el-icon-s-shop"></i>
            </div>
            <div class="cell-content">
                <div class="cell-title">适用门店</div>
                <div class="cell-sub">3家门店可用</div>
            </div>
            <i class="el-icon-arrow-right cell-arrow"></i>
        </div>
        
        <div class="info-cell">
            <div class="cell-icon icon-time">
                <i class="el-icon-time"></i>
            </div>
            <div class="cell-content">
                <div class="cell-title">有效期</div>
                <div class="cell-sub">{{ validityTextSimple }}</div>
            </div>
        </div>
    </div>

    <!-- Rules -->
    <div class="section-card">
        <div class="section-header">使用规则</div>
        <div class="rules-content">
             <div v-if="validRules.length === 0">无规则喔呵呵呵呵</div>
             <div v-else v-for="(rule, i) in validRules" :key="i">{{rule}}</div>
        </div>
    </div>

    <!-- Applicable Shops List -->
    <div class="section-card">
        <div class="section-header">适用门店列表</div>
        <div class="shop-list-group">
            <!-- Mock Data for Display as requested by UI design -->
            <div class="shop-item" @click="goToShop(info.shopId)">
                <div class="shop-name">{{ info.shopName || '家味道家常菜馆' }}</div>
                <div class="shop-addr"><i class="el-icon-location-outline"></i> {{ info.shopAddress || '佛山市禅城区张槎街道' }}</div>
                <i class="el-icon-arrow-right shop-arrow"></i>
            </div>
            <div class="shop-item" v-for="i in 2" :key="i">
                <div class="shop-name">{{ i===1?'蜀香坊川菜':'坤坤蜀味轩' }}</div>
                <div class="shop-addr"><i class="el-icon-location-outline"></i> 佛山市禅城区张槎街道</div>
                 <i class="el-icon-arrow-right shop-arrow"></i>
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
            <div class="review-popup-body" @scroll="onPopupScroll">
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
                
                <div v-if="allCommentsLoading" class="loading-more">加载中...</div>
                <div v-if="allCommentsNoMore && allComments.length > 0" class="no-more-reviews">没有更多评价了</div>
            </div>
            <!-- Bottom Input Bar in Popup -->
            <div class="popup-bottom-bar" @click="writeCommentFromPopup">
                <div class="popup-input-placeholder">发条评价，和大家一起讨论</div>
                <el-button type="primary" size="small" round>发布</el-button>
            </div>
        </div>
    </div>

    <!-- Bottom Bar -->
    <div class="bottom-bar-fixed">
        <div class="bar-icon-col" @click="goToShop(info.shopId)">
            <i class="el-icon-s-shop"></i>
            <span>店铺</span>
        </div>
        <div class="bar-icon-col" @click="handleCollect">
            <i :class="info.isCollected ? 'el-icon-star-on' : 'el-icon-star-off'" :style="{color: info.isCollected ? '#ff5000' : '#333'}"></i>
            <span>收藏</span>
        </div>
        <div class="bar-btn-wrapper">
            <button class="buy-btn" @click="handleBtnClick">
                🔥 立即抢购
            </button>
        </div>
    </div>

  </PageLayout>
</template>

<style scoped>
.voucher-detail-page {
    min-height: 100vh;
    background: #f7f8fa;
    padding-bottom: 80px;
    padding-top: 10px; 
}

/* Main Card */
.main-card {
    margin: 10px 16px;
    background: linear-gradient(180deg, #FFF5F2 0%, #FFF 100%);
    border-radius: 12px;
    padding: 24px 16px 16px;
    text-align: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.02);
}
.price-row {
    color: #E60012;
    display: flex;
    justify-content: center;
    align-items: baseline;
    margin-bottom: 12px;
}
.currency { font-size: 20px; font-weight: bold; margin-right: 2px; }
.amount { font-size: 48px; font-weight: bold; line-height: 1; }
.original { 
    text-decoration: line-through; 
    color: #999; 
    font-size: 16px; 
    margin-left: 8px; 
    font-weight: normal; 
}

.card-title {
    font-size: 18px;
    font-weight: bold;
    color: #333;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-bottom: 20px;
}
.tag-seckill {
    background: linear-gradient(90deg, #FF8E53, #FF6B8B);
    color: white;
    font-size: 11px;
    padding: 1px 6px;
    border-radius: 4px;
    font-weight: normal;
}
.tag-return {
    border: 1px solid #409EFF;
    color: #409EFF;
    font-size: 11px;
    padding: 0 6px;
    border-radius: 4px;
    font-weight: normal;
    background: #F0F9FF;
}

.countdown-bar {
    background: #FFE4E1; /* Light Pink */
    border-radius: 8px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #D32F2F; /* Red */
    font-weight: bold;
    font-size: 14px;
    gap: 6px;
}
.custom-countdown {
    color: #D32F2F;
    font-weight: bold;
    font-size: 14px;
}

/* Validity Range Bar */
.validity-range-bar {
    margin: 0 16px 12px;
    background: #FFF0F5;
    color: #D32F2F;
    padding: 12px 16px;
    border-radius: 8px;
    font-weight: bold;
    font-size: 14px;
}

/* Info Group */
.info-group {
    background: white;
    border-radius: 12px;
    margin: 0 16px 12px;
    overflow: hidden;
}
.info-cell {
    display: flex;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid #f5f5f5;
}
.info-cell:last-child { border-bottom: none; }
.cell-icon {
    width: 32px; height: 32px;
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    margin-right: 12px;
    color: white;
    font-size: 18px;
}
.icon-shop { background: #409EFF; }
.icon-time { background: #00C853; }
.cell-content { flex: 1; }
.cell-title { font-size: 15px; color: #333; font-weight: 600; margin-bottom: 4px; }
.cell-sub { font-size: 12px; color: #666; }
.cell-arrow { color: #ccc; }

/* Section Card */
.section-card {
    background: white;
    border-radius: 12px;
    margin: 0 16px 12px;
    padding: 16px;
}
.section-header {
    font-size: 16px;
    font-weight: bold;
    color: #333;
    margin-bottom: 16px;
}
.rules-content {
    font-size: 14px;
    color: #666;
    line-height: 1.6;
}

.shop-list-group {
    display: flex;
    flex-direction: column;
}
.shop-item {
    position: relative;
    padding: 12px 0;
    border-bottom: 1px solid #f9f9f9;
}
.shop-item:last-child { border-bottom: none; }
.shop-name { font-size: 15px; color: #333; margin-bottom: 4px; }
.shop-addr { font-size: 12px; color: #999; }
.shop-arrow { position: absolute; right: 0; top: 50%; transform: translateY(-50%); color: #ccc; }

/* Bottom Bar */
.bottom-bar-fixed {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    background: white;
    height: 60px;
    display: flex;
    align-items: center;
    padding: 0 16px;
    box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
    z-index: 100;
}
.bar-icon-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    color: #333;
    width: 50px;
    margin-right: 8px;
}
.bar-icon-col i { font-size: 20px; margin-bottom: 2px; }
.bar-btn-wrapper { flex: 1; }
.buy-btn {
    width: 100%;
    height: 44px;
    background: linear-gradient(90deg, #FF5000 0%, #FF8E53 100%);
    border-radius: 22px;
    border: none;
    color: white;
    font-size: 16px;
    font-weight: 600;
    display: flex; align-items: center; justify-content: center;
}

/* Comments Section Styles */
.comments-section {
    margin-bottom: 12px;
}
.comments-section .count {
    color: #999;
    font-weight: normal;
}
.empty-comments {
    padding: 30px 0;
    text-align: center;
}
.empty-comments .empty-text {
    color: #999;
    font-size: 14px;
}
.view-all {
    text-align: center;
    color: #666;
    font-size: 14px;
    padding: 12px 0 4px;
    cursor: pointer;
}
.view-all i {
    font-size: 12px;
    margin-left: 4px;
}
.comment-rating {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 4px 0;
}
.comment-rating .score {
    color: #ff9900;
    font-size: 12px;
}
.pop-rating-inline {
    display: flex;
    align-items: center;
}
</style>
