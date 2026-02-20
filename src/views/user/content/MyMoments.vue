<template>
  <div class="my-moments-page">
    <van-nav-bar title="我的动态" left-arrow @click-left="$router.back()" fixed placeholder />
    
    <!-- Filter Bar - Premium Sticky Tab -->
    <div class="filter-bar sticky-top">
       <div class="filter-scroll-wrap">
         <div class="filter-item" :class="{active: activeFilter === 'ALL'}" @click="changeFilter('ALL')">全部</div>
         <div class="filter-item" :class="{active: activeFilter === 'BLOG'}" @click="changeFilter('BLOG')">关注的人</div>
         <div class="filter-item" :class="{active: activeFilter === 'SHOP_NEW'}" @click="changeFilter('SHOP_NEW')">店铺更新</div>
         <div class="filter-item" :class="{active: activeFilter === 'RESTOCK'}" @click="changeFilter('RESTOCK')">昨价补偿</div>
       </div>
    </div>

    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list 
        v-model:loading="loading" 
        :finished="finished" 
        finished-text="没有更多动态了" 
        @load="onLoad" 
        :immediate-check="false"
        class="feed-list"
      >
        <feed-item 
          v-for="item in filteredList" 
          :key="item.id || item._uid" 
          :item="item" 
          @click="handleItemClick"
          @action="handleItemAction"
        />
      </van-list>
    </van-pull-refresh>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { getFeedList } from '@/api/interaction';
import { fileURL } from '@/utils/request';
import FeedItem from '@/components/FeedItem.vue';

const router = useRouter();
const route = useRoute();
const list = ref([]);
const loading = ref(false);
const finished = ref(false);
const refreshing = ref(false);
const activeFilter = ref('ALL');
const initialized = ref(false);

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

        // Normalize and map feed data for UI:
        // supports both old flat payload and new payload with detail in `item.data`.
        const mappedItems = newItems.map((rawItem, index) => {
            const detail = rawItem?.data && typeof rawItem.data === 'object' && !Array.isArray(rawItem.data)
                ? rawItem.data
                : null;
            const sourcePublishTime =
                rawItem?.publishTime ||
                rawItem?.createTime ||
                detail?.publishTime ||
                detail?.createTime ||
                '';
            const item = detail ? { ...rawItem, ...detail } : { ...rawItem };

            // Keep outer time fields when nested `data` has null/empty time.
            item.publishTime = item.publishTime || sourcePublishTime;
            item.createTime = item.createTime || rawItem?.createTime || detail?.createTime || '';

            // Keep unique render key even when multiple events point to one same voucher/blog id.
            if (!item._uid) {
                item._uid = rawItem.id || `${item.dataType || 'feed'}-${item.publishTime || item.time || ''}-${index}`;
            }

            // Map fields to match template expectations
            item.userAvatar = item.userAvatar || item.icon || '/imgs/icons/default-icon.png';
            if (item.userAvatar && !item.userAvatar.startsWith('http') && !item.userAvatar.startsWith('/imgs')) {
                item.userAvatar = fileURL + item.userAvatar;
            }

            if (item.shopLogo && !item.shopLogo.startsWith('http')) {
                item.shopLogo = fileURL + item.shopLogo;
            }

            item.userName = item.userName || item.name || '匿名用户';
            item.time = item.time || item.publishTime || item.createTime || sourcePublishTime || '';
            
            // Map cover image
            let rawImg = item.cover || item.img;
            if (!rawImg && item.images) {
                rawImg = Array.isArray(item.images) ? item.images[0] : item.images.split(',')[0];
            }
            if (!rawImg && item.shopImages) {
                rawImg = Array.isArray(item.shopImages) ? item.shopImages[0] : item.shopImages.split(',')[0];
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
                    blog: 'BLOG',
                    shop_new: 'SHOP_NEW',
                    restock: 'RESTOCK',
                    voucher: 'SHOP_NEW'  // voucher type maps to SHOP_NEW or RESTOCK based on action
                };
                
                // Handle voucher type with action field
                if (String(item.dataType).toLowerCase() === 'voucher') {
                    if (item.action === 'restock') {
                        item.dataType = 'RESTOCK';
                    } else {
                        // 'new' or other actions default to SHOP_NEW
                        item.dataType = 'SHOP_NEW';
                    }
                } else {
                    item.dataType = typeMap[String(item.dataType).toLowerCase()] || String(item.dataType).toUpperCase();
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
                // Ensure price is decimal
                if (item.price === undefined && item.payValue !== undefined) {
                     item.price = (item.payValue / 100).toFixed(2);
                }
                if (item.originalPrice === undefined && item.actualValue !== undefined) {
                     item.originalPrice = (item.actualValue / 100).toFixed(2);
                }
                
                item.voucherName = item.voucherName || item.name || item.title;
                
                // Keep activityType if present, or map from type if it was product type (but item.type here is FeedType often)
                // We rely on detail object having activityType
                
                if (item.productType === undefined) {
                    // API type 0 = 代金券, type 1 = 秒杀券 (also a voucher type)
                    // If activityType is 1, it is Seckill (Voucher)
                    // Check if we can distinguish "Group Deal" vs "Voucher"
                    // Usually Group Deal has distinct structure or type
                    item.productType = 1; // Default to Voucher for now as per previous logic
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

    // 保存 filter 状态到路由查询参数
    router.replace({ query: { ...route.query, filter: newFilter } });

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
    router.push(`/product/detail?id=${item.targetId || item.id}`);
};

const handleItemClick = (item) => {
    if (item.dataType === 'BLOG') {
        toBlog(item);
    } else {
        toVoucher(item);
    }
};

const handleItemAction = (item) => {
    toVoucher(item);
};

// Format Seckill Time: MM.dd HH:mm

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
onMounted(() => {
    // 从路由查询参数恢复 filter 状态
    const filterFromQuery = route.query.filter;
    if (filterFromQuery && ['ALL', 'BLOG', 'SHOP_NEW', 'RESTOCK'].includes(filterFromQuery)) {
        activeFilter.value = filterFromQuery;
    }
    initialized.value = true;
    onLoad();
});
</script>

<style scoped>
.my-moments-page {
    min-height: 100vh;
    background: #f7f8fa;
}

.feed-list {
    padding: 12px 12px 40px;
}

/* Premium Filter Bar */
.filter-bar {
    position: sticky;
    top: 46px; /* Below navbar */
    z-index: 99;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(0,0,0,0.05);
}

.filter-scroll-wrap {
    display: flex;
    overflow-x: auto;
    padding: 12px 16px;
    gap: 12px;
    /* Hide scrollbar */
    scrollbar-width: none;
    -ms-overflow-style: none;
}
.filter-scroll-wrap::-webkit-scrollbar { 
    display: none; 
}

.filter-item {
    font-size: 14px;
    color: #666;
    padding: 6px 16px;
    background: #f5f5f5;
    border-radius: 20px;
    white-space: nowrap;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    font-weight: 500;
}

.filter-item.active {
    color: #fff;
    background: linear-gradient(135deg, #FF6B6B 0%, #EE0A24 100%);
    box-shadow: 0 4px 12px rgba(238, 10, 36, 0.3);
    font-weight: 600;
    transform: scale(1.05);
}

.filter-item:active {
    transform: scale(0.95);
}
</style>
