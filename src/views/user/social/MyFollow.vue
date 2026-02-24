<template>
  <PageLayout :loading="pageLoading" skeleton-type="list" class="my-follow-page">
    <van-nav-bar title="我的关注" left-arrow @click-left="$router.back()" fixed placeholder z-index="1001" />
    
    <van-tabs
      ref="tabsRef"
      v-model:active="activeTab"
      sticky
      :offset-top="46"
      color="#ff2442"
      :ellipsis="false"
      swipeable
      animated
    >
      <van-tab title="用户" />
      <van-tab title="店铺" />
      <van-tab title="商品" />
    </van-tabs>

    <div
      class="list-container"
      @touchstart.passive="onTouchStart"
      @touchmove.passive="onTouchMove"
      @touchend="onTouchEnd"
    >
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="onLoad"
      >
        <!-- User List (Tab 0) -->
        <template v-if="activeTab === 0">
           <div class="user-row" v-for="item in list" :key="item.id">
              <div style="position: relative; width: 40px; height: 40px; margin-right: 12px; flex-shrink: 0;">
                  <van-image round width="40" height="40" :src="item.icon" class="user-avatar-img" :class="{ 'is-loaded': item.imgLoaded }" @load="item.imgLoaded = true" @error="item.imgError = true" style="margin-right: 0;" />
                  <div class="img-skeleton" style="width: 40px; height: 40px; border-radius: 50%; top: 0; left: 0;" v-if="!item.imgError && !item.imgLoaded"></div>
              </div>
              <div class="user-info-box">
                 <div class="user-name">{{ item.name || item.nickName }}</div>
                 <div class="user-bio">{{ item.introduce || item.content || '暂无简介' }}</div>
              </div>
              <van-button size="small" round color="#eee" class="followed-btn">已关注</van-button>
           </div>
        </template>

         <!-- Shop List (Tab 1) -->
         <template v-if="activeTab === 1">
            <div class="shop-item" v-for="item in list" :key="item.id" @click="toShopDetail(item)">
               <div class="shop-img-box">
                   <img :src="item.shopLogo || item.images || item.image || '/imgs/default-shop.png'" :class="{ 'is-loaded': item.imgLoaded }" class="shop-cover" @error="item.imgError = true; $event.target.src='/imgs/default-shop.png'" @load="item.imgLoaded = true">
                   <div class="img-skeleton" v-if="!item.imgError && !item.imgLoaded"></div>
               </div>
               <div class="shop-main">
                   <div class="shop-title">{{ item.name }}</div>
                   <div class="shop-rating-row">
                       <van-rate 
                           :model-value="item.score / 10" 
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
         </template>
        
        <!-- Goods List (Tab 2) - Merged Voucher & Group -->
        <template v-if="activeTab === 2">
           <div v-if="list.length === 0 && !loading" class="empty-placeholder">暂无关注商品</div>
           <div v-else class="list-content">
               <template v-for="item in list" :key="item.id">
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

                   <!-- Category 2: Group (or others) -->
                   <div v-else class="shop-item" @click="toShopDetail(item)">
                      <div class="shop-img-box">
                           <img :src="item.image" :class="{ 'is-loaded': item.imgLoaded }" class="shop-cover" @error="item.imgError = true" @load="item.imgLoaded = true">
                           <div class="img-skeleton" v-if="!item.imgError && !item.imgLoaded"></div>
                      </div>
                      <div class="shop-main">
                         <div class="shop-title">{{ item.name }}</div>
                         <div class="shop-rating-row">
                             <span class="shop-score-val" style="color:#ff5000; font-size: 16px;">¥{{ item.price }}</span>
                             <span class="orig-price" style="text-decoration: line-through; color:#999; margin-left: 5px; font-size:12px">¥{{ item.originalPrice }}</span>
                         </div>
                      </div>
                   </div>
               </template>
           </div>
        </template>
      </van-list>
    </div>
  </PageLayout>
</template>

<script setup>
defineOptions({
  name: 'MyFollow'
});

import { ref, watch, onMounted, onActivated, onBeforeUnmount, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { getFollows } from '@/api/interaction';
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
const touchStartX = ref(0);
const touchStartY = ref(0);
const touchEndX = ref(0);
const touchEndY = ref(0);
const swipeThreshold = 60;
const maxVerticalTravel = 50;

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

const onTouchStart = (e) => {
    const touch = e.touches?.[0];
    if (!touch) return;
    touchStartX.value = touch.clientX;
    touchStartY.value = touch.clientY;
    touchEndX.value = touch.clientX;
    touchEndY.value = touch.clientY;
};

const onTouchMove = (e) => {
    const touch = e.touches?.[0];
    if (!touch) return;
    touchEndX.value = touch.clientX;
    touchEndY.value = touch.clientY;
};

const onTouchEnd = () => {
    const deltaX = touchEndX.value - touchStartX.value;
    const deltaY = Math.abs(touchEndY.value - touchStartY.value);

    if (deltaY > maxVerticalTravel) return;
    if (Math.abs(deltaX) < swipeThreshold) return;

    if (deltaX < 0 && activeTab.value < 2) {
        activeTab.value += 1;
    } else if (deltaX > 0 && activeTab.value > 0) {
        activeTab.value -= 1;
    }
};

const toShopDetail = (item) => {
    router.push(`/shop/detail?id=${item.id}`);
};

const toProductDetail = (item) => {
  router.push(`/product/detail?id=${item.id}`);
};

// Map tab to sourceType: User(1), Shop(2), Goods(4)
const getSourceType = (index) => {
    switch(index) {
        case 0: return 1;
        case 1: return 2;
        case 2: return 4;
        default: return 1;
    }
}

// ...

const processItem = (item) => {
    return {
        ...item,
        icon: (item.icon && !item.icon.startsWith('http')) ? fileURL + item.icon : item.icon,
        image: (item.image && !item.image.startsWith('http')) ? fileURL + item.image : item.image,
        userAvatar: (item.userAvatar && !item.userAvatar.startsWith('http')) ? fileURL + item.userAvatar : item.userAvatar,
        shopLogo: (item.shopLogo && !item.shopLogo.startsWith('http')) ? fileURL + item.shopLogo.split(',')[0] : (item.shopLogo ? item.shopLogo.split(',')[0] : null),
        images: (item.images && !item.images.startsWith('http')) ? fileURL + item.images.split(',')[0] : (item.images ? item.images.split(',')[0] : null),
        imgLoaded: false,
        imgError: false
    };
};

const onLoad = async () => {
   if (!userId.value) return;

   try {
       loading.value = true;
       const params = {
           userId: userId.value,
           sourceType: getSourceType(activeTab.value),
           current: current.value,
           size: size
       };
       /*
       if (activeTab.value === 2) {
           params.productType = 1;
       } else if (activeTab.value === 3) {
           params.productType = 2;
       }
       */
       
       const res = await getFollows(params);

       let rawList = res.data || res || [];
       if (rawList.records) rawList = rawList.records; // Handle PageResult
       
       const newData = Array.isArray(rawList) ? rawList.map(processItem) : [];
       
       if (current.value === 1) {
           list.value = newData;
       } else {
           list.value.push(...newData);
       }
       
       loading.value = false;
       if (newData.length < size) {
           finished.value = true;
       } else {
           current.value++;
       }
       pageLoading.value = false;
   } catch (error) {
       console.error(error);
       loading.value = false;
       pageLoading.value = false;
       finished.value = true; // Stop on error to avoid loop
   }
};

const initUser = () => {
    const userStr = localStorage.getItem('userInfo');
    if (userStr) {
        const u = JSON.parse(userStr);
        userId.value = u.id;
        onLoad();
    } else {
        getCurrentUser().then(res => {
           const u = res.data || res;
           if (u && u.id) {
               userId.value = u.id;
               localStorage.setItem('userInfo', JSON.stringify(u));
               onLoad();
           }
        }).catch(() => {
            pageLoading.value = false;
        });
    }
};

const formatScore = (score) => {
    if(!score) return '0.0';
    return (score / 10).toFixed(1);
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
    toProductDetail(item);
};

watch(activeTab, () => {
    if (initialized.value) {
        // 保存 tab 状态到路由查询参数
        router.replace({ query: { ...route.query, tab: activeTab.value } });
        list.value = [];
        current.value = 1;
        finished.value = false;
        loading.value = true;
        onLoad();
    }
    refreshTabs();
});

watch(loading, (val) => {
    if (!val) {
        refreshTabs();
    }
});

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
</script>

<style scoped>
.my-follow-page { min-height: 100vh; background: #f7f8fa; }
.list-container { padding: 10px; }

/* User Row Style */
.user-row {
    display: flex;
    align-items: center;
    background: white;
    padding: 12px 15px;
    border-radius: 8px;
    margin-bottom: 10px;
}
.user-avatar-img {
    margin-right: 12px;
    border: 1px solid #f0f0f0;
}
.user-info-box {
    flex: 1;
    overflow: hidden;
}
.user-name {
    font-size: 15px;
    font-weight: 600;
    color: #333;
    margin-bottom: 4px;
}
.user-bio {
    font-size: 12px;
    color: #999;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.followed-btn {
    color: #999 !important;
    font-size: 12px;
    height: 28px;
    padding: 0 12px;
}

/* Shop Item Style (From MyStar) */
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
    color: #ff5000;
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
    color: #c9a35e;
    border: 0.5px solid #e6dcb9;
    padding: 1px 4px;
    border-radius: 2px;
    margin-right: 6px;
}
.shop-side {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
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
</style>
