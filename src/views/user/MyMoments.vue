<template>
  <div class="my-moments-page">
    <van-nav-bar title="我的动态" left-arrow @click-left="$router.back()" fixed placeholder />
    
    <!-- Filter Bar -->
    <div class="filter-bar sticky-top">
       <div class="filter-item" :class="{active: activeFilter === 'ALL'}" @click="activeFilter = 'ALL'">全部</div>
       <div class="filter-item" :class="{active: activeFilter === 'BLOG'}" @click="activeFilter = 'BLOG'">👤 关注的人</div>
       <div class="filter-item" :class="{active: activeFilter === 'SHOP_NEW'}" @click="activeFilter = 'SHOP_NEW'">🏠 店铺上新</div>
       <div class="filter-item" :class="{active: activeFilter === 'RESTOCK'}" @click="activeFilter = 'RESTOCK'">🔔 降价/补货</div>
    </div>

    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list v-model:loading="loading" :finished="finished" finished-text="没有更多动态了" @load="onLoad">
        
        <div v-for="item in filteredList" :key="item.id" class="moment-item">
          
          <!-- Type A: User Blog -->
          <div v-if="item.dataType === 'BLOG'" class="card blog-card" @click="toBlog(item)">
             <div class="card-header">
                <div class="header-left">
                    <van-image round width="32" height="32" :src="item.userAvatar" class="avatar" />
                    <div class="header-info">
                        <span class="name">{{ item.userName }}</span>
                        <span class="action">发布了笔记</span>
                    </div>
                </div>
                <div class="time">{{ item.time }}</div>
             </div>
             <div class="blog-content">
               <van-image width="60" height="60" :src="item.cover" radius="4" class="blog-cover" />
               <div class="blog-text">{{ item.title }}</div>
             </div>
             <div class="social-footer">
                <div class="social-item"><van-icon name="like-o" /> {{ item.likes || 0 }}</div>
                <div class="social-item"><van-icon name="chat-o" /> {{ item.comments || 0 }}</div>
             </div>
          </div>
  
          <!-- Type B: Shop New Arrival -->
          <div v-else-if="item.dataType === 'SHOP_NEW'" class="card shop-card" @click="toVoucher(item)">
             <div class="card-header">
                <div class="header-left">
                    <van-icon name="shop-o" class="shop-icon" /> 
                    <div class="header-info">
                        <span class="name">{{ item.shopName }}</span>
                        <span class="action">上新了</span>
                    </div>
                </div>
                <div class="time">{{ item.time }}</div>
             </div>
             <div class="voucher-preview">
                <div class="voucher-info">
                   <div class="price-row">
                       <span class="price">¥{{ item.price }}</span>
                       <span class="orig-price" v-if="item.originalPrice">¥{{ item.originalPrice }}</span>
                   </div>
                   <div class="title-row">
                       <van-tag plain :type="item.productType === 1 ? 'primary' : 'success'" class="product-tag">
                            {{ item.productType === 1 ? '代金券' : '团购' }}
                       </van-tag>
                       <span class="title">{{ item.voucherName }}</span>
                   </div>
                </div>
                <van-tag plain type="danger" v-if="item.tags">{{ item.tags }}</van-tag>
             </div>
          </div>
  
          <!-- Type C: Restock Alert -->
          <div v-else-if="item.dataType === 'RESTOCK'" class="card alert-card" @click="toVoucher(item)">
             <div class="alert-left">
                <div class="alert-info">
                    <van-icon name="volume-o" color="#ed6a0c" size="18" class="alert-icon" />
                    <span class="alert-text">
                        您关注的
                        <van-tag plain :type="item.productType === 1 ? 'primary' : 'success'" class="product-tag inline-tag">
                            {{ item.productType === 1 ? '代金券' : '团购' }}
                        </van-tag>
                        <b>{{ item.voucherName }}</b> 已补货，快去抢！
                    </span>
                </div>
                <div class="time">{{ item.time }}</div>
             </div>
             <van-button size="small" type="danger" round class="buy-btn" @click.stop="toVoucher(item)">去抢购</van-button>
          </div>
  
        </div>
      </van-list>
    </van-pull-refresh>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const list = ref([]);
const loading = ref(false);
const finished = ref(false);
const refreshing = ref(false);
const activeFilter = ref('ALL');

const filteredList = computed(() => {
    if (activeFilter.value === 'ALL') return list.value;
    // 'SHOP' filter might include RESTOCK if desired, but user separated them in request.
    // User Request: Users (BLOG), Shops (SHOP_NEW), Alerts (RESTOCK).
    // The filter values I set in template match the dataType exactly or groupings.
    return list.value.filter(item => item.dataType === activeFilter.value);
});

const mockData = [
    {
        id: 1,
        dataType: 'BLOG',
        userAvatar: '/imgs/icons/default-icon.png',
        userName: 'FoodieJen',
        cover: '/imgs/blogs/1.jpg',
        title: 'Tried this amazing sushi place downtown! Highly recommended.',
        time: '10分钟前',
        likes: 12,
        comments: 3,
        targetId: 101 
    },
    {
        id: 2,
        dataType: 'SHOP_NEW',
        productType: 2, // Group Deal
        shopName: 'Tasty Burger',
        voucherName: 'Double Cheeseburger Combo',
        price: '29.9',
        originalPrice: '50.0',
        tags: 'Limited Time',
        time: '1小时前',
        targetId: 202
    },
    {
        id: 3,
        dataType: 'RESTOCK',
        productType: 1, // Voucher
        voucherName: 'Weekend Buffet 50% Off',
        time: '2小时前',
        targetId: 303
    },
    {
        id: 4,
        dataType: 'BLOG',
        userAvatar: '/imgs/icons/default-icon.png',
        userName: 'TravelMike',
        cover: '/imgs/blogs/2.jpg',
        title: 'Hidden gem in the old town.',
        time: '3小时前',
        likes: 45,
        comments: 8,
        targetId: 102
    },
    {
        id: 5,
        dataType: 'SHOP_NEW',
        productType: 1, // Voucher
        shopName: 'Coffee House',
        voucherName: 'Latte Buy 1 Get 1 Free',
        price: '18.0',
        originalPrice: '36.0',
        tags: 'Member Only',
        time: '5小时前',
        targetId: 205
    }
];

const onLoad = () => {
  setTimeout(() => {
    if (refreshing.value) {
      list.value = [];
      refreshing.value = false;
    }
    
    const newData = list.value.length >= 20 ? [] : mockData; 
    list.value.push(...newData);
    
    loading.value = false;
    
    if (list.value.length >= 20) {
      finished.value = true;
    }
  }, 1000);
};

const onRefresh = () => {
  finished.value = false;
  loading.value = true;
  onLoad();
};

const toBlog = (item) => {
    router.push(`/blog/detail?id=${item.targetId}`);
};

const toVoucher = (item) => {
    router.push(`/voucher/detail?id=${item.targetId}`);
};
</script>

<style scoped>
.my-moments-page {
    min-height: 100vh;
    background: #f7f8fa;
}

/* Filter Bar */
.filter-bar {
    display: flex;
    overflow-x: auto;
    background: white;
    padding: 10px 15px;
    white-space: nowrap;
    border-bottom: 1px solid #f5f5f5;
    position: sticky;
    top: 46px; /* Below navbar */
    z-index: 10;
}
/* Hide scrollbar */
.filter-bar::-webkit-scrollbar { display: none; }
.filter-item {
    padding: 6px 14px;
    background: #f5f5f5;
    border-radius: 16px;
    font-size: 13px;
    color: #666;
    margin-right: 10px;
    transition: all 0.2s;
}
.filter-item.active {
    background: #ffece6;
    color: #ff2442;
    font-weight: 500;
}

.moment-item {
    margin: 12px;
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}

.card {
    padding: 15px;
}

/* Card Header Common */
.card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start; /* Align top in case of multi-line */
    margin-bottom: 10px;
}
.header-left {
    display: flex;
    align-items: center;
}
.avatar { margin-right: 8px; border: 1px solid #f0f0f0; }
.shop-icon { 
    margin-right: 8px; 
    font-size: 20px; 
    color: #ff5000; 
    width: 32px; 
    height: 32px; 
    display: flex; 
    align-items: center; 
    justify-content: center;
    background: #FFF5F0;
    border-radius: 50%;
}
.header-info {
    display: flex;
    flex-direction: row; 
    align-items: center;
}
.header-info .name {
    font-size: 14px;
    font-weight: bold;
    color: #333;
    margin-right: 6px;
}
.header-info .action {
    font-size: 12px;
    color: #999;
}
.time { font-size: 11px; color: #ccc; flex-shrink: 0; margin-left: auto; }

/* Tag Fix */
.product-tag {
    flex-shrink: 0;
    margin-right: 4px;
    white-space: nowrap;
}
.inline-tag {
    display: inline-flex;
    margin: 0 4px;
    vertical-align: middle;
}

/* Blog Card */
.blog-content {
    display: flex;
    background: #f9f9f9;
    padding: 8px;
    border-radius: 4px;
    margin-bottom: 10px;
}
.blog-cover { flex-shrink: 0; margin-right: 10px; }
.blog-text {
    flex: 1;
    font-size: 14px;
    color: #333;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
.social-footer {
    display: flex;
    border-top: 1px solid #f5f5f5;
    padding-top: 10px;
}
.social-item {
    margin-right: 20px;
    font-size: 12px;
    color: #666;
    display: flex;
    align-items: center;
    gap: 4px;
}

/* Shop Card */
.voucher-preview {
    background: #FFFBF5;
    border: 1px solid #FFE5D2;
    border-radius: 6px;
    padding: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.voucher-info {
    flex: 1;
    margin-right: 10px;
}
.price-row {
    display: flex;
    align-items: baseline;
    gap: 6px;
}
.voucher-info .price {
    font-size: 18px;
    font-weight: bold;
    color: #FF4400;
}
.orig-price {
    font-size: 12px;
    color: #999;
    text-decoration: line-through;
}
.voucher-info .title-row {
   display: flex;
   align-items: center;
   margin-top: 4px;
}
.voucher-info .title {
    font-size: 14px;
    font-weight: 500;
    color: #333;
}

/* Restock Alert Card */
.alert-card {
    background-color: #fffbe8; 
    display: flex; 
    justify-content: space-between; 
    align-items: center;
    border: 1px solid #ffe58f; 
}
.alert-left {
    flex: 1;
    margin-right: 10px;
}
.alert-info {
    display: flex;
    align-items: flex-start;
    font-size: 13px;
    color: #592d00;
    line-height: 1.4;
}
.alert-icon {
    margin-right: 6px;
    margin-top: 2px;
    flex-shrink: 0;
}
.buy-btn {
    flex-shrink: 0;
}
</style>
