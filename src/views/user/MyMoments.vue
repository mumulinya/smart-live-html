<template>
  <div class="my-moments-page">
    <van-nav-bar title="我的动态" left-arrow @click-left="$router.back()" fixed placeholder />
    
    <!-- Filter Bar -->
    <div class="filter-bar sticky-top">
       <div class="filter-item" :class="{active: activeFilter === 'ALL'}" @click="changeFilter('ALL')">全部</div>
       <div class="filter-item" :class="{active: activeFilter === 'BLOG'}" @click="changeFilter('BLOG')">👤 关注的人</div>
       <div class="filter-item" :class="{active: activeFilter === 'SHOP_NEW'}" @click="changeFilter('SHOP_NEW')">🏠 店铺上新</div>
       <div class="filter-item" :class="{active: activeFilter === 'RESTOCK'}" @click="changeFilter('RESTOCK')">🔔 降价/补货</div>
    </div>

    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list v-model:loading="loading" :finished="finished" finished-text="没有更多动态了" @load="onLoad" :immediate-check="false">
        
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
                <div class="time">{{ formatTime(item.publishTime) }}</div>
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
  
          <!-- Type B: Voucher Card (Shop New / Restock / Price Drop etc.) -->
          <div 
            v-else-if="item.dataType === 'SHOP_NEW' || item.dataType === 'RESTOCK' || item.dataType === 'VOUCHER'" 
            class="card voucher-card" 
            :class="getCardBgClass(item)"
            @click="toVoucher(item)"
          >
             <div class="card-header">
                <div class="header-left">
                    <van-icon name="shop-o" class="shop-icon" />
                    <div class="header-info">
                        <span class="name">{{ item.shopName || '店铺' }}</span>
                        <span class="action-text">{{ getActionLabel(item.subType || item.action) }}</span>
                    </div>
                </div>
                
                <div class="header-right" style="display: flex; flex-direction: column; align-items: flex-end;">
                    <div class="time" style="margin-bottom: 4px;">{{ formatTime(item.publishTime) }}</div>
                    <!-- Action 标签 -->
                    <div 
                      v-if="getEventConfig(item.subType || item.action).label" 
                      class="action-tag"
                      :style="getActionTagStyle(item.subType || item.action)"
                    >
                      {{ getEventConfig(item.subType || item.action).label }}
                    </div>
                </div>
             </div>
             <div class="voucher-preview">
                <div class="voucher-info">
                   <div class="price-row">
                       <span class="price">¥{{ item.price || item.payValue }}</span>
                       <span class="orig-price" v-if="item.originalPrice || item.actualValue">¥{{ item.originalPrice || item.actualValue }}</span>
                   </div>
                   <div class="title-row">
                       <van-tag plain :type="item.type === 0 || item.type === 1 ? 'primary' : 'success'" class="product-tag">
                            {{ item.type === 0 || item.type === 1 ? '代金券' : '团购' }}
                       </van-tag>
                       <span class="title">{{ item.voucherName || item.title }}</span>
                   </div>
                   
                   <!-- Seckill Time Bar -->
                   <div v-if="item.type === 1 && item.beginTime && item.endTime" class="seckill-time-bar">
                       <van-icon name="clock-o" class="time-icon" />
                       {{ formatSeckillTime(item.beginTime) }} - {{ formatSeckillTime(item.endTime) }}
                   </div>
                </div>
                <!-- 动态按钮 -->
                <button 
                  class="action-btn"
                  :class="{ disabled: getButtonState(item).disabled }"
                  :style="getButtonStyle(item)"
                  :disabled="getButtonState(item).disabled"
                  @click.stop="handleVoucherAction(item)"
                >
                  {{ getButtonState(item).text }}
                </button>
             </div>
          </div>
  
        </div>
      </van-list>
    </van-pull-refresh>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { getFeedList } from '@/api/interaction';
import { fileURL } from '@/utils/request';
import { getActionConfig, getButtonState, getEventConfig } from '@/config/feedStatus';

const router = useRouter();
const list = ref([]);
const loading = ref(false);
const finished = ref(false);
const refreshing = ref(false);
const activeFilter = ref('ALL');

const scrollParams = ref({
    lastId: 0,
    offset: 0
});

const feedTypeMap = {
  'ALL': 0,
  'BLOG': 1,
  'SHOP_NEW': 2,
  'RESTOCK': 3
};

// Directly return the list, filtering is done by backend
const filteredList = computed(() => list.value);

const isRequesting = ref(false);

const onLoad = async () => {
    // Prevent duplicate requests using a separate flag
    if (isRequesting.value) {
        return;
    }
    
    // Guard: if finished, don't load
    if (finished.value) {
        loading.value = false;
        return;
    }

    isRequesting.value = true;
    loading.value = true;

    try {
        const type = feedTypeMap[activeFilter.value];
        const lastId = scrollParams.value.lastId || new Date().getTime();
        const res = await getFeedList({
            feedType: type,
            lastId: lastId,
            offset: scrollParams.value.offset
        });

        // Handle refresh state
        if (refreshing.value) {
            list.value = [];
            refreshing.value = false;
        }

        // Handle different API response formats
        // Format 1: { data: { list: [], minTime: long, offset: int } }
        // Format 2: { data: [] } - direct array
        // Format 3: [] - direct array response
        let data = res.data || res || {};
        let newItems = [];
        let minTime = null;
        let offset = 0;
        
        if (Array.isArray(data)) {
            // Format 2 or 3: data is directly an array
            newItems = data;
        } else if (data.list && Array.isArray(data.list)) {
            // Format 1: data contains list property
            newItems = data.list;
            minTime = data.minTime;
            offset = data.offset || 0;
        } else if (data.records && Array.isArray(data.records)) {
            // PageResult format
            newItems = data.records;
        } else {
            // Unknown format, try to use data as-is if it looks like an array
            newItems = [];
        }

        // Finish if no more data
        if (newItems.length === 0) {
            loading.value = false;
            finished.value = true;
            return;
        }
        
        // Store minTime for pagination
        const pageSize = 5;

        // Simple mapping if backend doesn't return dataType string (Optional safeguard)
        const mappedItems = newItems.map(item => {
            // Map fields to match template expectations
            // Template uses: userAvatar, userName, time, cover, title, likes, comments
            // API returns: icon, name, createTime, images, title, liked, comments

            item.userAvatar = item.userAvatar || item.icon || '/imgs/icons/default-icon.png';
            if (item.userAvatar && !item.userAvatar.startsWith('http') && !item.userAvatar.startsWith('/imgs')) {
                item.userAvatar = fileURL + item.userAvatar;
            }

            item.userName = item.userName || item.name || '匿名用户';
            item.time = item.time || item.createTime || '';
            
            // Map cover image
            let rawImg = item.cover || item.img;
            if (!rawImg && item.images) {
                rawImg = item.images.split(',')[0];
            }
            
            if (rawImg) {
                 if (rawImg.startsWith('http')) {
                     item.cover = rawImg;
                 } else {
                     item.cover = fileURL + rawImg;
                 }
            } else {
                 item.cover = '';
            }

            item.likes = item.likes || item.liked || 0;
            item.comments = item.comments || 0;

            // Ensure dataType is present and uppercase (API may return lowercase like 'blog')
            if (item.dataType) {
                // Convert lowercase dataType to uppercase for template matching
                const typeMap = {
                    'blog': 'BLOG',
                    'shop_new': 'SHOP_NEW',
                    'restock': 'RESTOCK',
                    'voucher': 'SHOP_NEW'  // voucher type maps to SHOP_NEW or RESTOCK based on action
                };
                
                // Handle voucher type with action field
                if (item.dataType.toLowerCase() === 'voucher') {
                    if (item.action === 'restock') {
                        item.dataType = 'RESTOCK';
                    } else {
                        // 'new' or other actions default to SHOP_NEW
                        item.dataType = 'SHOP_NEW';
                    }
                } else {
                    item.dataType = typeMap[item.dataType.toLowerCase()] || item.dataType.toUpperCase();
                }
            } else {
                // If dataType is missing, infer from other fields
                if (item.title || item.content) {
                     item.dataType = 'BLOG';
                } else if (item.type === 1) {
                     item.dataType = 'BLOG';
                } else if (item.type === 2) { 
                     item.dataType = 'SHOP_NEW';
                } else if (item.type === 3) {
                     item.dataType = 'RESTOCK';
                } else {
                     // Fallback check based on identifying fields
                     if (item.voucherName || item.payValue) item.dataType = 'SHOP_NEW';
                     else item.dataType = 'BLOG'; // Default to BLOG
                }
            }

            // Map voucher/deal fields for SHOP_NEW and RESTOCK templates
            if (item.dataType === 'SHOP_NEW' || item.dataType === 'RESTOCK') {
                item.price = item.price || item.payValue;
                item.originalPrice = item.originalPrice || item.actualValue;
                item.voucherName = item.voucherName || item.title;
                // productType: 0 = 团购, 1 = 代金券 (based on API's type field)
                // Template expects: productType === 1 ? '代金券' : '团购'
                // API type: 0 = 代金券, 1 = 秒杀券, etc.
                // Need to map: if type === 0 or no type, it's 代金券 (set productType = 1)
                if (item.productType === undefined) {
                    // API type 0 = 代金券, type 1 = 秒杀券 (also a voucher type)
                    item.productType = (item.type === 0 || item.type === 1) ? 1 : 0;
                }
            }

            return item;
        });

        list.value.push(...mappedItems);

        // Update scroll params for next load
        // Check if there's more data based on minTime or item count
        if (minTime && minTime > 0) {
            scrollParams.value.lastId = minTime;
            scrollParams.value.offset = offset;
        }
        
        // If we received less than pageSize items, we've reached the end
        if (newItems.length < pageSize) {
            finished.value = true;
        }

        loading.value = false;
        isRequesting.value = false;

    } catch (error) {
        console.error('Failed to load feed:', error);
        loading.value = false;
        isRequesting.value = false;
        finished.value = true;
    }
};

const onRefresh = () => {
  finished.value = false;
  refreshing.value = true;
  // Reset Params
  scrollParams.value = { lastId: 0, offset: 0 };
  onLoad();
};

const isFilterChanging = ref(false);

const changeFilter = async (newFilter) => {
    if (activeFilter.value === newFilter) return;
    if (isFilterChanging.value) return; // Prevent rapid filter changes
    
    activeFilter.value = newFilter;
    isFilterChanging.value = true;

    // Reset List and Params
    list.value = [];
    scrollParams.value = { lastId: 0, offset: 0 };
    finished.value = false;
    loading.value = false; // Reset loading so onLoad can proceed

    // Manually trigger load once
    await onLoad();
    
    isFilterChanging.value = false;
};

// Update filter bar click methods to use changeFilter
const setFilter = (val) => changeFilter(val);

const toBlog = (item) => {
    router.push(`/blog/detail?id=${item.targetId || item.id}`);
};

const toVoucher = (item) => {
    router.push(`/voucher/detail?id=${item.targetId || item.id}`);
};

// Action 标签文案映射
const actionLabelMap = {
    'price_drop': '降价了',
    'restock': '补货了',
    'start': '开抢了',
    'soon_end': '即将结束',
    'reshelf': '重新上架',
    'new': '上新了'
};

const getActionLabel = (eventType) => {
    return actionLabelMap[eventType] || '有新动态';
};

// 获取 action 标签样式
const getActionTagStyle = (eventType) => {
    const config = getEventConfig(eventType);
    return {
        color: config.color,
        backgroundColor: config.labelBg,
        borderColor: config.color
    };
};

// 获取卡片背景色 class
const getCardBgClass = (item) => {
    const eventType = item.subType || item.action;
    const config = getEventConfig(eventType);
    return config.bg || 'bg-white';
};

// 获取按钮样式
const getButtonStyle = (item) => {
    const state = getButtonState(item);
    if (state.disabled) {
        return {
            color: state.color,
            backgroundColor: state.bgColor,
            borderColor: state.bgColor
        };
    }
    return {
        color: '#FFFFFF',
        backgroundColor: state.bgColor,
        borderColor: state.bgColor
    };
};

// 处理代金券按钮点击
const handleVoucherAction = (item) => {
    const state = getButtonState(item);
    if (state.disabled) return;
    toVoucher(item);
};

const formatTime = (timeStr) => {
    if (!timeStr) return '';
    // Fix iOS date parsing issue
    const date = new Date(timeStr.replace(/-/g, '/'));
    const now = new Date();
    const diff = now - date;
    
    // Convert to seconds
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) {
        return '刚刚';
    }
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
        return `${minutes}分钟前`;
    }
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
        return `${hours}小时前`;
    }
    
    const days = Math.floor(hours / 24);
    if (days < 30) {
        return `${days}天前`;
    }
    
    // If older than 30 days, show full date
    return timeStr.split(' ')[0]; // Show YYYY-MM-DD
};

// Format Seckill Time: MM.dd HH:mm
const formatSeckillTime = (timeStr) => {
    if (!timeStr) return '';
    try {
        const date = new Date(timeStr.replace(/-/g, '/'));
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${month}.${day} ${hours}:${minutes}`;
    } catch (e) {
        return timeStr;
    }
};

// Initial load since immediate-check is false
onLoad();
</script>

<style scoped>
.my-moments-page {
    min-height: 100vh;
    background: #f7f8fa;
}

/* Card Background Classes - Enhanced Premium Styles */

/* 1. Strong Alerts - Red Theme (Price Drop, Restock, Start) */
.bg-red {
    background: linear-gradient(to bottom, #fff5f5, #fff0f0) !important;
    box-shadow: 0 4px 12px rgba(238, 10, 36, 0.1);
    border-radius: 12px !important;
    border: none !important;
    overflow: hidden;
}

/* 2. Medium Alerts - Orange Theme (Soon End, Reshelf) */
.bg-orange {
    background: linear-gradient(to bottom, #fffef5, #fffbe8) !important;
    box-shadow: 0 4px 12px rgba(255, 151, 106, 0.12);
    border-radius: 12px !important;
    border: none !important;
    overflow: hidden;
}

/* 3. Normal - White Theme (New) */
.bg-white {
    background-color: #ffffff !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    border-radius: 12px !important;
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
    font-size: 15px;
    font-weight: 600;
    color: #333;
    margin-right: 6px;
}
.header-info .action {
    font-size: 12px;
    color: #999;
}
/* Highlighted Action Text for alerts */
.header-info .action-text {
    font-size: 12px;
    font-weight: 500;
    color: #ee0a24;
}
.time { font-size: 11px; color: #ccc; flex-shrink: 0; margin-left: auto; }

/* Action Tag */
.action-tag {
    font-size: 11px;
    font-weight: 500;
    padding: 4px 10px;
    border-radius: 12px;
    border: 1px solid;
    white-space: nowrap;
    flex-shrink: 0;
}

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
    font-size: 24px;
    font-weight: 700;
    color: #ee0a24;
    line-height: 1;
}
.orig-price {
    font-size: 13px;
    color: #999;
    text-decoration: line-through;
}
.voucher-info .title-row {
   display: flex;
   align-items: center;
   margin-top: 6px;
}
.voucher-info .title {
    font-size: 14px;
    font-weight: 500;
    color: #333;
}
/* Seckill Time Bar */
.seckill-time-bar {
    display: inline-flex;
    align-items: center;
    background-color: #fff0f0;
    color: #ee0a24;
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 4px;
    margin-top: 6px;
    font-weight: 500;
}
.time-icon {
    margin-right: 4px;
    font-size: 11px;
    position: relative;
    top: -0.5px;
}

/* Action Button */
.action-btn {
    padding: 8px 16px;
    font-size: 12px;
    font-weight: 500;
    border-radius: 16px;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
    flex-shrink: 0;
}

.action-btn:not(.disabled):active {
    opacity: 0.85;
    transform: scale(0.96);
}

.action-btn.disabled {
    cursor: not-allowed;
    background-color: #f5f5f5 !important;
    color: #ccc !important;
    opacity: 1;
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
