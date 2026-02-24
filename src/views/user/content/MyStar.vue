<script setup>
defineOptions({
  name: 'MyStar'
});
import { ref, watch, onMounted, onActivated, onBeforeUnmount, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { starList } from '@/api/interaction';
import { getCurrentUser } from '@/api/user';
import { fileURL } from '@/utils/request';
import PageLayout from '@/components/PageLayout/PageLayout.vue';

const router = useRouter();
const route = useRoute();
const activeTab = ref(0);
const list = ref([]);
const pageLoading = ref(true);
const loading = ref(false);
const finished = ref(false);
const current = ref(1);
const size = 10;
const userId = ref(null);
const initialized = ref(false);
const tabsRef = ref(null);

const refreshTabs = () => {
    const doResize = () => tabsRef.value?.resize?.();
    nextTick(() => {
        doResize();
        requestAnimationFrame(doResize);
        setTimeout(doResize, 120);
    });
};

const handleWindowResize = () => {
    refreshTabs();
};

const onClickLeft = () => history.back();

// Map tab index to API sourceType
const getSourceType = (index) => {
  switch (index) {
    case 0: return 2; // Shop
    case 1: return 3; // Blog/Note
    case 2: return 4; // Goods (Voucher + Group)
    default: return 2;
  }
};

const fetchCurrentUser = async () => {
    try {
        const res = await getCurrentUser();
        // Assuming res.data or res contains the user object
        const user = res.data || res; 
        if(user && user.id) {
            userId.value = user.id;
            // Optionally update localStorage
            localStorage.setItem('userInfo', JSON.stringify(user));
            onLoad();
        }
    } catch (e) {
        console.error('Fetch user failed:', e);
        pageLoading.value = false;
    }
};

const initUser = async () => {
    try {
        const infoStr = localStorage.getItem('userInfo');
        console.log('UserInfo Str:', infoStr);
        if(infoStr) {
             const info = JSON.parse(infoStr);
             if(info.id) {
                 userId.value = info.id;
                 console.log('User ID from local:', userId.value);
                 onLoad();
                 return;
             }
        }
    } catch (e) {
        console.error('Init user error:', e);
    }
    // Fallback if no local user or parse error
    await fetchCurrentUser();
};

const onLoad = async () => {
  if(!userId.value) {
      console.log('No user ID found');
      return;
  }
  
  try {
    const params = {
      userId: userId.value,
      sourceType: getSourceType(activeTab.value),
      current: current.value,
      size: size
    };

    // removed productType logic as we now merge them
    
    console.log('Fetching Collection:', params);
    
    loading.value = true; // Ensure loading is true before fetch
    const res = await starList(params);
    console.log('Collection API Res:', res);
    
    // Robust parsing matching Info.vue logic
    let rawList = res.data || res || [];
    if(rawList.records) rawList = rawList.records;
    
    const newItems = Array.isArray(rawList) ? rawList.map(processItem) : [];
    
    if(current.value === 1) {
        list.value = newItems;
    } else {
        list.value.push(...newItems);
    }
    
    loading.value = false;

    if (newItems.length < size) {
      finished.value = true;
    } else {
      current.value++;
    }
  } catch (error) {
    console.error('Fetch error:', error);
    loading.value = false;
    pageLoading.value = false;
    finished.value = true;
    return;
  }
  pageLoading.value = false;
};

const handleTabChange = () => {
    // 保存 tab 状态到路由查询参数
    router.replace({ query: { ...route.query, tab: activeTab.value } });
    list.value = [];
    current.value = 1;
    finished.value = false;
    loading.value = true; // Set loading initially
    onLoad();
};

const getFirstImage = (images) => {
    if(!images) return '/imgs/icons/default-icon.png';
    const arr = String(images).split(',');
    let url = arr[0];
    if (url && !url.startsWith('http')) {
        return fileURL + url;
    }
    return url;
};
const getFirstShopImage = (images) => {
    if(!images) return '/imgs/default-shop.png';
    const arr = String(images).split(',');
    let url = arr[0];
    if (url && !url.startsWith('http') && !url.startsWith('/imgs')) {
        return fileURL + url;
    }
    return url;
};
const handleImgError = (e) => {
    e.target.src = '/imgs/icons/default-icon.png';
};
const toBlogDetail = (b) => {
    router.push({ path: '/blog/detail', query: { id: b.sourceId || b.id } }); // Try sourceId if available, else id
};

const processItem = (item) => {
    let avatar = item.userAvatar || item.icon; // Fallback or different field names
    if (avatar && !avatar.startsWith('http')) {
        avatar = fileURL + avatar;
    }
    return {
        ...item,
        userAvatar: avatar,
        imgLoaded: false,
        imgError: false
    };
};

const formatScore = (score) => {
    if(!score) return '0.0';
    return (score / 10).toFixed(1);
};

const getRate = (score) => {
    if(!score) return 0;
    return score / 10;
};

const toShopDetail = (item) => {
    router.push({ path: '/shop/detail', query: { id: item.id || item.sourceId } });
};

const toProductDetail = (item) => {
    router.push({ path: '/product/detail', query: { id: item.sourceId || item.id } });
};

const getValidityText = (v) => {
    if (v.validityType === 1) {
    const start = v.useStartTime?.split(' ')[0] || '';
    const end = v.useEndTime?.split(' ')[0] || '';
    return `${start} 至 ${end} 有效`;
    } else if (v.validityType === 2) {
    return `领取/购买后 ${v.validDays} 天内有效`;
    }
    return '';
};

const formatSeckillTimeRange = (begin, end) => {
    if (!begin || !end) return '';
    const format = (str) => {
        const d = new Date(String(str).replace(/-/g, '/'));
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const h = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        return `${m}.${day} ${h}:${min}`;
    };
    return `${format(begin)} - ${format(end)}`;
};

const getSoldPercent = (item) => {
    const sold = item.sold || 0;
    const stock = item.stock || 0;
    const total = sold + stock;
    if (total === 0) return 0;
    return Math.round((sold / total) * 100);
};

const isSeckill = (item) => item.activityType === 1;

const isSeckillStarted = (item) => {
    if(!item.beginTime) return false;
    return new Date(item.beginTime).getTime() <= Date.now();
};
const isSeckillEnded = (item) => {
    if(!item.endTme && !item.endTime) return false;
    const end = item.endTime || item.endTme; // Handle typo in API if any
    return new Date(end).getTime() <= Date.now();
};

const getButtonState = (item) => {
    if (isSeckill(item)) {
        if (item.stock <= 0) {
            return { text: '已抢光', class: 'btn-gray', action: 'none' };
        }
        if (isSeckillStarted(item) && !isSeckillEnded(item)) {
             return { text: '去抢购', class: 'btn-red', action: 'buy' };
        }
        if (isSeckillEnded(item)) {
             return { text: '已结束', class: 'btn-gray', action: 'none' };
        }
        // Not started
        return { text: '开抢提醒', class: 'btn-orange', action: 'remind' };
    } else {
        return { text: '去抢购', class: 'btn-red', action: 'buy' };
    }
};

const handleBtnClick = (item) => {
    const state = getButtonState(item);
    if (state.action === 'buy') {
        toProductDetail(item);
    } else if (state.action === 'remind') {
        // Simple navigate for now, or implement remind logic (need api)
        // User asked to "follow voucher detail page button settings" meaning Styles mostly?
        // Logic-wise, executing Remind needs similar methods.
        // For list view, jumping to detail is safer.
        toProductDetail(item);
    } else {
        toProductDetail(item);
    }
};



onMounted(() => {
    // 从路由查询参数恢复 tab 状态
    const tabFromQuery = route.query.tab;
    if (tabFromQuery !== undefined) {
        activeTab.value = parseInt(tabFromQuery) || 0;
    }
    initialized.value = true;
    initUser();
    refreshTabs();
    window.addEventListener('resize', handleWindowResize);
});

// 使用 onActivated 处理 keep-alive 缓存的情况
onActivated(() => {
    const tabFromQuery = route.query.tab;
    if (tabFromQuery !== undefined && parseInt(tabFromQuery) !== activeTab.value) {
        activeTab.value = parseInt(tabFromQuery) || 0;
    }
    refreshTabs();
});

onBeforeUnmount(() => {
    window.removeEventListener('resize', handleWindowResize);
});

watch(activeTab, () => {
    if (initialized.value) {
        handleTabChange();
    }
    refreshTabs();
});

watch(loading, (val) => {
    if (!val) {
        refreshTabs();
    }
});
</script>

<template>
  <PageLayout :loading="pageLoading" skeleton-type="list" class="my-star-page">
    <van-nav-bar
      title="我的收藏"
      left-arrow
      fixed
      placeholder
      z-index="1001"
      @click-left="onClickLeft"
    />

    <van-tabs ref="tabsRef" v-model:active="activeTab" sticky :offset-top="46" animated swipeable color="#ff2442" :ellipsis="false">
      <van-tab title="店铺">
         <van-list
            v-model:loading="loading"
            :finished="finished"
            finished-text="没有更多了"
            @load="onLoad"
         >
             <div v-if="list.length === 0 && !loading" class="empty-placeholder">暂无收藏店铺</div>
             <div v-else class="list-content">
                <div v-for="item in list" :key="item.id" class="shop-item" @click="toShopDetail(item)">
                    <div class="shop-img-box">
                         <img :src="getFirstShopImage(item.shopLogo || item.images || item.image)" :class="{ 'is-loaded': item.imgLoaded }" class="shop-cover" loading="lazy" @error="item.imgError = true; $event.target.src='/imgs/default-shop.png'" @load="item.imgLoaded = true">
                         <div class="img-skeleton" v-if="!item.imgError && !item.imgLoaded"></div>
                    </div>
                    <div class="shop-main">
                         <div class="shop-title">{{ item.name || 'Unknown Shop' }}</div>
                         <div class="shop-rating-row">
                             <van-rate 
                                :model-value="getRate(item.score)" 
                                readonly 
                                allow-half 
                                color="#ff9900" 
                                void-icon="star"
                                void-color="#eee"
                                size="12px"
                             />
                             <span class="shop-score-val">{{ formatScore(item.score) }}</span>
                             <span class="shop-comment-count">{{ item.comments || 0 }}条</span>
                         </div>
                         <div class="shop-meta-row">
                             <span class="shop-area-text">{{ item.area || '未知区域' }} | 美食</span>
                         </div>
                         <div class="shop-tags-row">
                             <span class="shop-tag">可预约</span>
                             <span class="shop-tag">有停车位</span>
                         </div>
                    </div>
                    <div class="shop-side">
                         <div class="shop-price">¥{{ item.avgPrice || '0' }}/人</div>
                         <div class="shop-distance">{{ item.distance ? (item.distance/1000).toFixed(1) + 'km' : '' }}</div>
                    </div>
                </div>
             </div>
         </van-list>
      </van-tab>

      <van-tab title="笔记">
         <van-list
            v-model:loading="loading"
            :finished="finished"
            finished-text="没有更多了"
            @load="onLoad"
         >
            <div v-if="list.length === 0 && !loading" class="empty-placeholder">暂无收藏笔记</div>
            <div v-else class="waterfall-container">
                 <div class="waterfall-column" v-for="(col, i) in [0, 1]" :key="i">
                    <!-- Note: In real waterfall, we should separate list into colArrays. Here simply using odd/even index -->
                    <div class="waterfall-item" v-for="b in list.filter((_, index) => index % 2 === i)" :key="b.id" @click="toBlogDetail(b)">
                        <div class="card-img-box">
                            <img :src="getFirstImage(b.images)" :class="{ 'is-loaded': b.imgLoaded }" class="work-cover" loading="lazy" @error="b.imgError = true; handleImgError($event)" @load="b.imgLoaded = true">
                            <div class="img-skeleton" v-if="!b.imgError && !b.imgLoaded"></div>
                            <div class="img-placeholder" v-if="b.imgError">图片加载失败</div>
                        </div>
                        <div class="card-info">
                            <div class="card-title">{{ b.title }}</div>
                            <div class="card-bottom">
                                <div class="card-user">
                                    <img :src="b.userAvatar || '/imgs/icons/default-icon.png'" class="card-avatar">
                                    <span class="card-name">{{ b.name || 'Unknown' }}</span>
                                </div>
                                <div class="card-likes">
                                    <van-icon name="like-o" v-if="!b.isLike" color="#999" />
                                    <van-icon name="like" v-else color="#ff2442" />
                                    {{ b.liked || 0 }}
                                </div>
                            </div>
                        </div>
                    </div>
                 </div>
            </div>
         </van-list>
      </van-tab>

      <van-tab title="商品">
         <van-list
            v-model:loading="loading"
            :finished="finished"
            finished-text="没有更多了"
            @load="onLoad"
         >
            <div v-if="list.length === 0 && !loading" class="empty-placeholder">暂无收藏商品</div>
            <div v-else class="list-content">
                 <div v-for="item in list" :key="item.id">
                     <!-- Category 1: Voucher -->
                     <div v-if="item.category == 1" class="voucher-card-v2" @click="toProductDetail(item)">
                         <!-- 顶部信息区 (白色背景) -->
                        <div class="voucher-header-section">
                            <!-- 秒杀券顶部 -->
                            <template v-if="item.activityType === 1">
                                <div class="voucher-big-title">
                                    <span class="amount-highlight seckill-color">{{ item.originalPrice }}</span>元
                                    <span class="seckill-tag"><van-icon name="clock-o" size="10" />限时抢</span>
                                </div>
                                <div class="shop-name-row">适用商铺：{{ item.shopName || '通用' }}</div>
                                <div class="time-row" v-if="item.beginTime && item.endTime">
                                    <van-icon name="clock-o" size="12" color="#FF2442" />
                                    <span>{{ formatSeckillTimeRange(item.beginTime, item.endTime) }}</span>
                                </div>
                            </template>
                            <!-- 普通券顶部 -->
                            <template v-else>
                                <div class="voucher-big-title">
                                    <span class="amount-highlight">{{ item.originalPrice }}</span>元
                                </div>
                                <div class="shop-name-row normal">适用商铺：{{ item.shopName || '通用' }}</div>
                                <div class="voucher-rule" v-if="item.subTitle">{{ item.subTitle }}</div>
                                <div class="time-row normal" v-if="item.subTitle">
                                    <van-icon name="clock-o" size="12" color="#FF9000" />
                                    <span>{{ item.subTitle }}</span>
                                </div>
                            </template>
                            <div class="validity-row" v-if="getValidityText(item)">{{ getValidityText(item) }}</div>
                        </div>
                        
                        <!-- 底部价格区 (渐变背景) -->
                        <div class="voucher-price-section" :class="{ seckill: item.activityType === 1 }">
                            <div class="price-main">
                                <div class="price-row">
                                    <span class="currency">¥</span>
                                    <span class="price-value">{{ item.price }}</span>
                                    <span class="orig-price">¥{{ item.originalPrice }}</span>
                                    <span class="discount-badge" v-if="item.originalPrice">
                                        {{ ((item.price / item.originalPrice) * 10).toFixed(1) }}折
                                    </span>
                                </div>
                                <div class="progress-row">
                                    <span class="sold-text">已售{{ getSoldPercent(item) }}%</span>
                                    <div class="progress-bar">
                                        <div class="progress-fill" :style="{ width: getSoldPercent(item) + '%' }"></div>
                                    </div>
                                    <span class="stock-text">剩{{ item.stock || 0 }}张</span>
                                </div>
                            </div>
                            <div class="action-btn" :class="getButtonState(item).class" @click.stop="handleBtnClick(item)">
                                {{ getButtonState(item).text }}
                            </div>
                        </div>
                     </div>
                     <!-- Category 2: Group -->
                     <div v-else class="simple-item" @click="toProductDetail(item)">
                        {{ item.title || 'Unknown Group Deal' }}
                     </div>
                 </div>
            </div>
         </van-list>
      </van-tab>
    </van-tabs>
  </PageLayout>
</template>

<style scoped>
.my-star-page {
  min-height: 100vh;
  background-color: #f7f8fa;
}
.empty-placeholder {
  padding: 40px;
  text-align: center;
  color: #999;
  font-size: 14px;
}
.shop-item {
    display: flex;
    padding: 15px;
    background: #fff;
    margin-bottom: 0; /* List style usually continuous */
    border-bottom: 1px solid #f5f5f5;
}
.shop-img-box {
    position: relative;
    width: 80px;
    height: 80px;
    margin-right: 12px;
    border-radius: 4px;
    overflow: hidden;
    flex-shrink: 0;
    background: #f0f0f0;
}
.shop-cover {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.shop-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
    padding-right: 5px;
}
.shop-title {
    font-size: 16px;
    font-weight: bold;
    color: #333;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 4px;
}
.shop-rating-row {
    display: flex;
    align-items: center;
    margin-bottom: 4px;
}
.shop-score-val {
    font-size: 14px;
    color: #ff5000; /* More reddish orange per screenshot */
    font-weight: bold;
    margin: 0 6px;
}
.shop-comment-count {
    font-size: 12px;
    color: #999;
}
.shop-meta-row {
    font-size: 12px;
    color: #666;
    margin-bottom: 4px;
}
.shop-tags-row {
    display: flex;
    flex-wrap: wrap;
}
.shop-tag {
    font-size: 10px;
    color: #c9a35e; /* Gold-ish color */
    border: 0.5px solid #e6dcb9;
    padding: 1px 4px;
    border-radius: 2px;
    margin-right: 6px;
}
.shop-side {
    display: flex;
    flex-direction: column;
    justify-content: flex-start; /* Align top mostly */
    align-items: flex-end;
    padding-top: 4px;
    min-width: 70px;
}
.shop-price {
    font-size: 15px;
    color: #333;
    font-weight: 500;
    margin-bottom: 6px;
}
.shop-distance {
    font-size: 12px;
    color: #999;
}
.waterfall-container {
    display: flex;
    justify-content: space-between;
    padding: 10px;
}
.waterfall-column {
    width: 49%;
    display: flex;
    flex-direction: column;
}
.waterfall-item {
    background: #fff;
    border-radius: 8px;
    margin-bottom: 10px;
    overflow: hidden;
    break-inside: avoid;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05); /* Optional shadow */
}
.waterfall-item:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.card-img-box {
    position: relative;
}

/* ===== New Voucher Card V2 Styles ===== */
.voucher-card-v2 {
    margin: 12px;
    border-radius: 12px;
    overflow: hidden;
    background: #fff;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

/* 顶部白色信息区 */
.voucher-header-section {
    padding: 14px 16px;
    background: #fff;
}
.shop-name-row {
    font-size: 13px;
    color: #FF5A5F;
    margin-bottom: 6px;
}
.time-row {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #FF5A5F;
    margin-bottom: 4px;
}
.voucher-big-title {
    font-size: 16px;
    color: #333;
    font-weight: 500;
    margin-bottom: 8px;
}
.voucher-big-title .amount-highlight {
    font-size: 24px;
    font-weight: 700;
    color: #FF6600;
}
.voucher-big-title .seckill-tag {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    font-size: 11px;
    color: #FF5A5F;
    border: 1px solid #FF5A5F;
    border-radius: 10px;
    padding: 2px 8px;
    margin-left: 8px;
    font-weight: 500;
}
.voucher-rule {
    font-size: 13px;
    color: #666;
    margin-bottom: 4px;
}
.validity-row {
    font-size: 12px;
    color: #999;
    margin-top: 4px;
}

/* 秒杀券颜色 */
.voucher-big-title .amount-highlight.seckill-color {
    color: #FF2442;
}
.shop-name-row.normal {
    color: #FF9000;
}
.time-row.normal {
    color: #FF9000;
}

/* 底部价格区 - 橙色渐变 (普通券) */
.voucher-price-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background: linear-gradient(90deg, #FFA940 0%, #FFB86C 100%);
    color: #fff;
}

/* 底部价格区 - 粉色渐变 (秒杀券) */
.voucher-price-section.seckill {
    background: linear-gradient(90deg, #FF6B8A 0%, #FFAB91 100%);
}

.price-main {
    flex: 1;
}
.price-row {
    display: flex;
    align-items: baseline;
    margin-bottom: 10px;
}
.price-row .currency {
    font-size: 16px;
    font-weight: 600;
}
.price-row .price-value {
    font-size: 36px;
    font-weight: 700;
    font-family: 'DIN Alternate', sans-serif;
    line-height: 1;
}
.price-row .orig-price {
    font-size: 14px;
    text-decoration: line-through;
    margin-left: 8px;
    opacity: 0.8;
}
.price-row .discount-badge {
    background: rgba(255,255,255,0.25);
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 4px;
    margin-left: 8px;
}

.progress-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
}
.sold-text {
    white-space: nowrap;
}
.progress-bar {
    flex: 1;
    max-width: 120px;
    height: 6px;
    background: rgba(255,255,255,0.35);
    border-radius: 3px;
    overflow: hidden;
}
.progress-fill {
    height: 100%;
    background: #fff;
    border-radius: 3px;
}
.stock-text {
    white-space: nowrap;
}

.action-btn {
    padding: 10px 18px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    text-align: center;
    min-width: 80px;
    flex-shrink: 0;
}
.action-btn.btn-red {
    background: #fff;
    color: #FF5A5F;
}
.action-btn.btn-orange {
    background: rgba(255,255,255,0.9);
    color: #FF9000;
}
.action-btn.btn-gray {
    background: rgba(255,255,255,0.5);
    color: #999;
}

.card-img-box {
    width: 100%;
    position: relative;
    /* Min height to avoid collapse? */
}
.work-cover {
    width: 100%;
    display: block;
    border-radius: 8px 8px 0 0;
}
.card-info {
    padding: 8px;
}
.card-title {
    font-size: 14px;
    color: #333;
    line-height: 1.4;
    margin-bottom: 8px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2; /* Standard property */
    -webkit-box-orient: vertical;
    overflow: hidden;
}
.card-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    color: #999;
}
.card-user {
    display: flex;
    align-items: center;
}
.card-avatar {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    margin-right: 4px;
    object-fit: cover;
}
.card-name {
    max-width: 80px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.card-likes {
    display: flex;
    align-items: center;
}
</style>
