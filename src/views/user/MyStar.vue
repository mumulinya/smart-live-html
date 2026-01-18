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
                         <div class="shop-title">{{ item.shopName || 'Unknown Shop' }}</div>
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
                                    <span class="card-name">{{ b.userName || 'Unknown' }}</span>
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
                 <div v-for="item in list" :key="item.id" class="simple-item" @click="toVoucherDetail(item)">
                    {{ item.title || 'Unknown Voucher' }}
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
