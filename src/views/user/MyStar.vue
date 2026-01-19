<script setup>
import { ref, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { starList } from '@/api/interaction';
import { getCurrentUser } from '@/api/user';
import { fileURL } from '@/utils/request';

const router = useRouter();
const activeTab = ref(0);
const list = ref([]);
const loading = ref(false);
const finished = ref(false);
const current = ref(1);
const size = 10;
const userId = ref(null);

const onClickLeft = () => history.back();

// Map tab index to API sourceType
const getSourceType = (index) => {
  switch (index) {
    case 0: return 2; // Shop
    case 1: return 3; // Blog/Note
    case 2: return 4; // Voucher
    case 3: return 5; // Group Deal
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
    finished.value = true;
  }
};

const handleTabChange = () => {
    list.value = [];
    current.value = 1;
    finished.value = false;
    loading.value = true; // Set loading initially
    onLoad();
};

const getFirstImage = (images) => {
    if(!images) return '/imgs/icons/default-icon.png';
    const arr = images.split(',');
    let url = arr[0];
    if (url && !url.startsWith('http')) {
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
        userAvatar: avatar
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

const toVoucherDetail = (item) => {
    router.push({ path: '/voucher/detail', query: { id: item.sourceId || item.id } });
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

const isSeckill = (item) => item.type === 1;

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
        toVoucherDetail(item);
    } else if (state.action === 'remind') {
        // Simple navigate for now, or implement remind logic (need api)
        // User asked to "follow voucher detail page button settings" meaning Styles mostly?
        // Logic-wise, executing Remind needs similar methods.
        // For list view, jumping to detail is safer.
        toVoucherDetail(item);
    } else {
        toVoucherDetail(item);
    }
};



onMounted(() => {
    initUser();
});

watch(activeTab, () => {
  handleTabChange();
});
</script>

<template>
  <div class="my-star-page">
    <van-nav-bar
      title="我的收藏"
      left-arrow
      fixed
      placeholder
      @click-left="onClickLeft"
    />

    <van-tabs v-model:active="activeTab" sticky animated swipeable color="#ff2442">
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
                         <img :src="getFirstImage(item.image)" class="shop-cover" loading="lazy" @error="handleImgError">
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
                         <div class="shop-distance">1.5km</div> <!-- Mock distance -->
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
                            <img :src="getFirstImage(b.images)" class="work-cover" loading="lazy" @error="handleImgError">
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

      <van-tab title="代金券">
         <van-list
            v-model:loading="loading"
            :finished="finished"
            finished-text="没有更多了"
            @load="onLoad"
         >
            <div v-if="list.length === 0 && !loading" class="empty-placeholder">暂无收藏代金券</div>
            <div v-else class="list-content">
                 <div v-for="item in list" :key="item.id" class="voucher-item" @click="toVoucherDetail(item)">
                    <!-- Left: Icon -->
                     <div class="ticket-stub" :class="{seckill: item.type === 1}">
                        <div class="ticket-val">¥{{item.payValue}}</div>
                        <div class="ticket-type">{{ item.type === 1 ? '秒杀券' : '代金券' }}</div>
                     </div>
                     <!-- Middle: Info -->
                     <div class="voucher-info">
                        <div class="voucher-title">{{item.title}}</div>
                        <div class="voucher-sub">{{item.subTitle}}</div>
                        <div class="voucher-date-info" v-if="getValidityText(item)">{{ getValidityText(item) }}</div>
                        
                        <!-- Normal Voucher Meta -->
                        <div class="voucher-meta" v-if="item.type !== 1">
                           <span class="current-price">¥{{item.payValue}}</span>
                           <span class="orig-price" v-if="item.actualValue">¥{{item.actualValue}}</span>
                           <span class="discount-tag" v-if="item.actualValue">{{((item.payValue*10)/(item.actualValue||1)).toFixed(1)}}折</span>
                        </div>
                        <!-- Seckill Meta -->
                        <div class="seckill-meta" v-else>
                           <div class="seckill-price-row">
                              <span class="current-price text-red">¥{{item.payValue}}</span>
                              <span class="orig-price">¥{{item.actualValue}}</span>
                           </div>
                           <div class="seckill-progress">
                              <div class="progress-txt">剩余 {{item.stock}} 张</div>
                           </div>
                        </div>
                     </div>
                     <!-- Right: Button -->
                     <div class="voucher-action">
                         <div class="buy-btn" :class="getButtonState(item).class" @click.stop="handleBtnClick(item)">
                            {{ getButtonState(item).text }}
                         </div>
                     </div>
                 </div>
            </div>
         </van-list>
      </van-tab>

      <van-tab title="团购">
         <van-list
            v-model:loading="loading"
            :finished="finished"
            finished-text="没有更多了"
            @load="onLoad"
         >
            <div v-if="list.length === 0 && !loading" class="empty-placeholder">暂无收藏团购</div>
            <div v-else class="list-content">
                 <div v-for="item in list" :key="item.id" class="simple-item" @click="toVoucherDetail(item)">
                    {{ item.title || 'Unknown Group Deal' }}
                 </div>
            </div>
         </van-list>
      </van-tab>
    </van-tabs>
  </div>
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

/* Voucher Styles */
.voucher-item { display: flex; margin: 12px 12px 0; background: #FFFBF5; border: 1px solid #FFE5D2; border-radius: 8px; overflow: hidden; position: relative; }
.voucher-item::before, .voucher-item::after { content: ''; position: absolute; width: 10px; height: 10px; background: #f7f8fa; border-radius: 50%; top: 50%; border: 1px solid #FFE5D2; }
.voucher-item::before { left: -6px; margin-top: -5px; clip-path: polygon(50% 0, 100% 0, 100% 100%, 50% 100%); }
.voucher-item::after { right: -6px; margin-top: -5px; clip-path: polygon(0 0, 50% 0, 50% 100%, 0 100%); }

.ticket-stub { width: 75px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #FFF5F0; border-right: 1px dashed #FFCAB0; color: #FF4400; flex-shrink: 0;}
.ticket-stub.seckill { background: #FF4400; color: white; border-right: 1px dashed rgba(255,255,255,0.3); }

.ticket-val { font-size: 20px; font-weight: bold; }
.ticket-type { font-size: 11px; margin-top: 4px; }

.voucher-info { flex: 1; padding: 10px 12px; display: flex; flex-direction: column; justify-content: center; min-width: 0; }
.voucher-title { font-weight: 600; font-size: 14px; color: #333; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.voucher-sub { font-size: 11px; color: #999; margin: 4px 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.voucher-date-info { font-size: 10px; color: #999; margin-bottom: 4px; }

.voucher-meta { display: flex; align-items: baseline; gap: 6px; }
.current-price { color: #FF4400; font-weight: bold; font-size: 16px; }
.orig-price { text-decoration: line-through; color: #999; font-size: 11px; }
.discount-tag { border: 1px solid #FF4400; color: #FF4400; font-size: 10px; padding: 0 4px; border-radius: 2px; transform: scale(0.9); transform-origin: left center;}

.seckill-meta { margin-top: 4px; }
.seckill-price-row { display: flex; align-items: baseline; gap: 6px; margin-bottom: 2px; }
.text-red { color: #FF4400; }
.seckill-progress { font-size: 10px; color: #FF4400; background: #FFE5D2; display: inline-block; padding: 1px 8px; border-radius: 8px; }

.voucher-action { width: 80px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding-right: 10px; flex-shrink: 0;}
.buy-btn { 
    padding: 5px 12px; 
    border-radius: 14px; 
    font-size: 12px; 
    cursor: pointer; 
    text-align: center;
    min-width: 70px;
}
.btn-red { background: #FF4400; color: white; }
.btn-orange { background: #ff976a; color: white; }
.btn-gray { background: #ccc; color: white; }

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
