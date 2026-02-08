<template>
  <div class="search-page">
    <!-- Navbar with Search -->
    <div class="search-header">
      <div class="back-icon" @click="$router.go(-1)">
        <van-icon name="arrow-left" size="24" color="#333" />
      </div>
      <van-search
        v-model="keyword"
        show-action
        :placeholder="searchPlaceholder"
        shape="round"
        class="custom-search"
        @search="onSearch"
        @clear="onClear"
      >
        <template #action>
          <div @click="onSearch" class="search-btn">搜索</div>
        </template>
      </van-search>
    </div>

    <!-- Search History (Shown when no keyword and not searching) -->
    <div class="search-history" v-if="!keyword && historyList.length > 0">
       <div class="history-header">
          <span>历史搜索</span>
          <van-icon name="delete-o" @click="clearHistory" />
       </div>
       <div class="history-tags">
          <span v-for="(item, index) in historyList" :key="index" class="history-tag" @click="fillSearch(item)">
             {{ item }}
          </span>
       </div>
    </div>

    <!-- Search Scopes Level 1 -->
    <div class="scope-selection">
       <div class="scope-tabs">
          <div class="scope-tab" :class="{active: activeScope === 'blog'}" @click="changeScope('blog')">
             <span>笔记</span>
             <div class="indicator" v-if="activeScope === 'blog'"></div>
          </div>
          <div class="scope-tab" :class="{active: activeScope === 'shop'}" @click="changeScope('shop')">
             <span>店铺</span>
             <div class="indicator" v-if="activeScope === 'shop'"></div>
          </div>
          <div class="scope-tab" :class="{active: activeScope === 'voucher'}" @click="changeScope('voucher')">
             <span>代金券</span>
             <div class="indicator" v-if="activeScope === 'voucher'"></div>
          </div>
       </div>

      <!-- Search Scopes Level 2 -->
      <div class="sub-scope-list">
        <!-- Blog Sub-Scopes -->
        <template v-if="activeScope === 'blog'">
            <div class="sub-scope-item" :class="{ active: activeSubScope === 'like' }" @click="changeSubScope('like')">
                <van-icon name="like-o" /> 喜欢
            </div>
            <div class="sub-scope-item" :class="{ active: activeSubScope === 'collection' }" @click="changeSubScope('collection')">
                <van-icon name="star-o" /> 收藏
            </div>
             <div class="sub-scope-item" :class="{ active: activeSubScope === 'works' }" @click="changeSubScope('works')">
                <van-icon name="user-o" /> 作品
            </div>
        </template>
        
        <!-- Shop Sub-Scopes -->
        <template v-if="activeScope === 'shop'">
             <div class="sub-scope-item" :class="{ active: activeSubScope === 'follow' }" @click="changeSubScope('follow')">
                 <van-icon name="friends-o" /> 关注
            </div>
            <div class="sub-scope-item" :class="{ active: activeSubScope === 'collection' }" @click="changeSubScope('collection')">
                 <van-icon name="star-o" /> 收藏
            </div>
        </template>

        <!-- Voucher Sub-Scopes -->
        <template v-if="activeScope === 'voucher'">
             <div class="sub-scope-item" :class="{ active: activeSubScope === 'collection' }" @click="changeSubScope('collection')">
                 <van-icon name="star-o" /> 收藏
            </div>
            <div class="sub-scope-item" :class="{ active: activeSubScope === 'follow' }" @click="changeSubScope('follow')">
                 <van-icon name="friends-o" /> 关注
            </div>
        </template>
      </div>
    </div>

    <!-- Results Area -->
    <div class="search-results" v-if="hasSearched">
        <van-list
            v-model:loading="loading"
            :finished="finished"
            finished-text="没有更多了"
            @load="onLoad"
        >
            <!-- Blog Results -->
            <div v-if="activeScope === 'blog'" class="blog-list">
                <div class="waterfall-container">
                     <div class="waterfall-column" v-for="(col, i) in [0, 1]" :key="i">
                        <div class="waterfall-item" v-for="b in results.filter((_, index) => index % 2 === i)" :key="b.id" @click="toBlogDetail(b)">
                            <div class="card-img-box">
                                <img :src="getFirstImage(b.images)" class="work-cover" loading="lazy">
                            </div>
                            <div class="card-info">
                                <div class="card-title" v-html="b.title"></div>
                                <div class="card-bottom">
                                    <div class="card-user">
                                        <img :src="b.icon || b.userAvatar || '/imgs/icons/default-icon.png'" class="card-avatar">
                                        <span class="card-name" v-html="b.nickName || b.name"></span>
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
            </div>

            <!-- Shop Results -->
            <div v-if="activeScope === 'shop'" class="shop-list">
                <div v-for="item in results" :key="item.id" class="shop-item" @click="toShopDetail(item)">
                    <div class="shop-img-box">
                        <img :src="getImage(item.images || item.image)" class="shop-cover">
                    </div>
                    <div class="shop-main">
                        <div class="shop-title" v-html="item.name"></div>
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
                        <div class="shop-distance">1.5km</div>
                    </div>
                </div>
            </div>

            <!-- Voucher Results -->
            <div v-if="activeScope === 'voucher'" class="voucher-list">
                 <div v-for="item in results" :key="item.id" class="voucher-card-v2" @click="toVoucherDetail(item)">
                    <!-- Header Section -->
                    <div class="voucher-header-section">
                        <!-- Seckill Header -->
                        <template v-if="item.type === 1">
                            <div class="voucher-big-title">
                                <span class="amount-highlight seckill-color">{{ item.actualValue }}</span>元代金券
                                <span class="seckill-tag"><van-icon name="clock-o" size="10" />限时抢</span>
                            </div>
                            <div class="shop-name-row">适用商铺：<span v-html="item.shopName || '通用'"></span></div>
                            <div class="time-row" v-if="item.beginTime && item.endTime">
                                <van-icon name="clock-o" size="12" color="#FF2442" />
                                <span>{{ formatSeckillTimeRange(item.beginTime, item.endTime) }}</span>
                            </div>
                        </template>
                        <!-- Normal Header -->
                        <template v-else>
                            <div class="voucher-big-title">
                                <span class="amount-highlight">{{ item.actualValue }}</span>元代金券
                            </div>
                            <div class="shop-name-row normal">适用商铺：<span v-html="item.shopName || '通用'"></span></div>
                            <div class="voucher-rule" v-if="item.subTitle" v-html="item.subTitle"></div>
                            <div class="time-row normal" v-else-if="item.subTitle">
                                <van-icon name="clock-o" size="12" color="#FF9000" />
                                <span>{{ item.subTitle }}</span>
                            </div>
                        </template>
                        <div class="validity-row" v-if="getValidityText(item)">{{ getValidityText(item) }}</div>
                    </div>
                    
                    <!-- Price Section -->
                    <div class="voucher-price-section" :class="{ seckill: item.type === 1 }">
                        <div class="price-main">
                            <div class="price-row">
                                <span class="currency">¥</span>
                                <span class="price-value">{{ item.payValue }}</span>
                                <span class="orig-price">¥{{ item.actualValue }}</span>
                                <span class="discount-badge" v-if="item.actualValue">
                                    {{ ((item.payValue / item.actualValue) * 10).toFixed(1) }}折
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
                        <div class="action-btn" :class="getButtonState(item).class">
                            {{ getButtonState(item).text === 'opening' ? '开抢提醒' : getButtonState(item).text }}
                        </div>
                    </div>
                 </div>
            </div>
        </van-list>
        
        <div v-if="results.length === 0 && !loading" class="empty-result">
            <img src="https://img01.yzcdn.cn/vant/empty-image-search.png" />
            <p>暂无搜索结果</p>
        </div>
    </div>
  </div>
</template>

<script>
import { searchUser, addSearchHistory, getSearchHistory, clearSearchHistory } from '@/api/userSearch';

export default {
  name: 'UserSearch',
  data() {
    return {
      keyword: '',
      activeScope: 'blog', // blog, shop, voucher
      activeSubScope: 'like', // like, collection, works, follow
      historyList: [],
      results: [],
      loading: false,
      finished: false,
      hasSearched: false,
      current: 1,
      userId: null,
      $fileURL: 'http://localhost:8080/api/common/download?name='
    };
  },
  computed: {
      searchPlaceholder() {
          if(!this.keyword) {
              return `搜索你${this.getSubScopeName()}的${this.getScopeName()}`;
          }
          return '搜索...';
      }
  },
  created() {
     const user = JSON.parse(localStorage.getItem("userInfo") || '{}');
     this.userId = user.id;

     // Initialize defaults
     this.activeSubScope = 'like';

     // Fetch History from API
     if(this.userId) {
         this.loadHistory();
     }

     // Restore from URL
     const q = this.$route.query;
     if (q.scope) this.activeScope = q.scope;
     if (q.subScope) this.activeSubScope = q.subScope;
     if (q.k) {
         this.keyword = q.k;
         this.onSearch();
     }
  },
  activated() {
     const q = this.$route.query;
     if (q.scope && q.scope !== this.activeScope) {
         this.changeScope(q.scope);
     }
     if (q.k !== undefined && q.k !== this.keyword) {
         this.keyword = q.k;
         this.onSearch();
     }
  },
  methods: {
    getScopeName() {
        const map = { blog: '笔记', shop: '店铺', voucher: '代金券' };
        return map[this.activeScope];
    },
    getSubScopeName() {
         const map = { like: '赞过', collection: '收藏', works: '发布', follow: '关注' };
         return map[this.activeSubScope] || '';
    },
    loadHistory() {
        getSearchHistory({ userId: this.userId }).then(res => {
            // API result wrapper handled by request? usually res.data or res
            let list = res.data || res || [];
            this.historyList = list;
        }).catch(() => {});
    },
    clearHistory() {
        clearSearchHistory({ userId: this.userId }).then(() => {
            this.historyList = [];
        });
    },
    fillSearch(kw) {
        this.keyword = kw;
        this.onSearch();
    },
    onClear() {
        this.results = [];
        this.hasSearched = false;
        this.finished = false;
    },
    changeScope(scope) {
        if(this.activeScope === scope) return;
        this.activeScope = scope;

        // Reset SubScope to default for the new scope
        if(scope === 'blog') this.activeSubScope = 'like';
        else if(scope === 'shop') this.activeSubScope = 'collection'; // Default for shop
        else if(scope === 'voucher') this.activeSubScope = 'collection';

        // Sync URL
        this.$router.replace({
            query: {
                ...this.$route.query,
                scope: this.activeScope,
                subScope: this.activeSubScope
            }
        });

        if(this.keyword) {
            this.onSearch();
        }
    },
    changeSubScope(sub) {
        if(this.activeSubScope === sub) return;
        this.activeSubScope = sub;

        // Sync URL
        this.$router.replace({
            query: {
                ...this.$route.query,
                subScope: this.activeSubScope
            }
        });

        if(this.keyword) {
            this.onSearch();
        }
    },
    onSearch() {
        if(!this.keyword.trim()) return;

        // Sync URL keyword
        this.$router.replace({
            query: {
                ...this.$route.query,
                k: this.keyword
            }
        });

        this.results = [];
        this.current = 1;
        this.finished = false;
        this.hasSearched = true;
        this.loading = true;

        // Add History
        if(this.userId) {
            addSearchHistory({ userId: this.userId, keyword: this.keyword }).then(() => {
                this.loadHistory(); // Refresh history
            });
        }

        this.onLoad();
    },
    onLoad() {
        if(!this.keyword) {
            this.loading = false;
            return;
        }

        let sourceType = 3;
        let actionType = 'like';

        // Map Scope to SourceType
        if (this.activeScope === 'blog') sourceType = 3;
        else if (this.activeScope === 'shop') sourceType = 2;
        else if (this.activeScope === 'voucher') sourceType = 4;

        // Map SubScope to ActionType
        if (this.activeSubScope === 'like') actionType = 'like';
        else if (this.activeSubScope === 'collection') actionType = 'star';
        else if (this.activeSubScope === 'works') actionType = 'publish';
        else if (this.activeSubScope === 'follow') actionType = 'follow';

        const params = {
            keyword: this.keyword,
            sourceType,
            actionType,
            page: this.current,
            size: 10,
            userId: this.userId
        };

        searchUser(params).then(this.handleResponse).catch(this.handleError);
    },
    handleResponse(res) {
        let list = [];
        // Extract list from various response structures
        // Backend returns: ResponseEntity.ok(SearchResult.success(result));
        // result = { total, list/records, ... } or just list
        // Let's assume standard response handling wrapper unwraps 'data'
        // So res might be the SearchResult object or the map

        const data = res.data || res;

        if(Array.isArray(data)) list = data;
        else if(data && Array.isArray(data.records)) list = data.records;
        else if(data && Array.isArray(data.list)) list = data.list;

        if(!list || list.length === 0) {
            this.finished = true;
        } else {
            this.results = [...this.results, ...list.map(this.processItem)];
            this.current++;
            if(list.length < 10) this.finished = true;
        }
        this.loading = false;
    },
    handleError(err) {
        this.finished = true;
        this.loading = false;
    },
    processItem(item) {
        let newItem = { ...item };
        // Highlight logic could happen here if backend doesn't do it.
        // User said "Backend returns highlighted data". So we trust backend for highlighting.
        
        if(this.activeScope === 'blog') {
             if(newItem.icon && !newItem.icon.startsWith('http')) newItem.icon = this.getImage(newItem.icon);
             if(typeof newItem.images === 'string') newItem.images = newItem.images.split(',');
        }
        return newItem;
    },
    getImage(img) {
        if (!img) return '/imgs/icons/default-icon.png';
        let url = img;
        if(Array.isArray(img)) url = img[0];
        if (url.startsWith('http')) return url;
        return this.$fileURL + url;
    },
    getFirstImage(images) {
        if (!images) return '';
        let img = images;
        if (Array.isArray(images)) img = images.length > 0 ? images[0] : '';
        else if(typeof images === 'string') img = images.split(',')[0];
        return this.getImage(img);
    },
    // --- Helper Methods for New UI ---
    formatScore(score) {
        if(!score) return '0.0';
        return (score / 10).toFixed(1);
    },
    getValidityText(v) {
        if (v.validityType === 1) {
            const start = v.useStartTime?.split(' ')[0] || '';
            const end = v.useEndTime?.split(' ')[0] || '';
            return `${start} 至 ${end} 有效`;
        } else if (v.validityType === 2) {
            return `领取/购买后 ${v.validDays} 天内有效`;
        }
        return '';
    },
    formatSeckillTimeRange(begin, end) {
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
    },
    getSoldPercent(item) {
        const sold = item.sold || 0;
        const stock = item.stock || 0;
        const total = sold + stock;
        if (total === 0) return 0;
        return Math.round((sold / total) * 100);
    },
    isSeckill(item) { return item.type === 1; },
    isSeckillStarted(item) {
        if(!item.beginTime) return false;
        return new Date(item.beginTime).getTime() <= Date.now();
    },
    isSeckillEnded(item) {
        if(!item.endTime) return false;
        return new Date(item.endTime).getTime() <= Date.now();
    },
    getButtonState(item) {
        if (this.isSeckill(item)) {
            if (item.stock <= 0) {
                return { text: '已抢光', class: 'btn-gray' };
            }
            if (this.isSeckillStarted(item) && !this.isSeckillEnded(item)) {
                 return { text: '去抢购', class: 'btn-red' };
            }
            if (this.isSeckillEnded(item)) {
                 return { text: '已结束', class: 'btn-gray' };
            }
            // Not started
            return { text: 'opening', class: 'btn-orange' }; // Simplified text or '开抢提醒'
        } else {
            return { text: '去抢购', class: 'btn-red' };
        }
    },
    
    // --- Navigation & processing ---
    toBlogDetail(b) {
        this.$router.push({ path: '/blog/detail', query: { id: b.id } });
    },
    toShopDetail(s) {
        this.$router.push('/shop/detail?id=' + s.id);
    },
    toVoucherDetail(v) {
        this.$router.push({ path: '/voucher/detail', query: { id: v.id } });
    }
  }
}
</script>

<style scoped>
.search-page {
  min-height: 100vh;
  background-color: #fff;
}
.search-header {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  background: #fff;
  position: sticky;
  top: 0;
  z-index: 10;
}
.back-icon {
  margin-right: 10px;
}
.custom-search {
  flex: 1;
  padding: 0; 
  background: #f7f8fa;
}
.search-btn {
  color: #333;
  font-weight: 500;
  font-size: 15px;
  padding: 0 10px;
}

.scope-selection {
  padding: 0 15px 15px;
}

/* Tabs Level 1 */
.scope-tabs {
  display: flex;
  justify-content: space-around;
  padding-bottom: 10px;
  border-bottom: 1px solid #f5f5f5;
  margin-bottom: 15px;
}
.scope-tab {
  padding: 10px 0;
  font-size: 15px;
  color: #666;
  position: relative;
  font-weight: 500;
}
.scope-tab.active {
  color: #333;
  font-weight: bold;
}
.indicator {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 3px;
  background: #ff2442;
  border-radius: 2px;
}

/* Sub Scope Level 2 */
.sub-scope-list {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.sub-scope-item {
  padding: 6px 16px;
  background: #fff;
  border: 1px solid #ebedf0; /* Default border */
  border-radius: 4px; /* Rectangular as per screenshot ish */
  font-size: 13px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 4px;
}
.sub-scope-item.active {
    background: #fff; /* White bg */
    border-color: #ff2442; /* Red border */
    color: #ff2442;
}

.search-history {
    padding: 10px 15px 0;
}
.history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
    font-weight: bold;
    margin-bottom: 12px;
}
.history-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}
.history-tag {
    padding: 6px 12px;
    background: #f5f5f5;
    border-radius: 16px;
    font-size: 12px;
    color: #666;
}

.search-results {
    padding: 15px;
    background: #f9f9f9;
    min-height: calc(100vh - 150px);
}
.waterfall-container {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
}
.waterfall-column {
    width: 48%;
    display: flex;
    flex-direction: column;
    gap: 10px;
}
.waterfall-item {
    background: #fff;
    border-radius: 6px;
    overflow: hidden;
    box-shadow: 0 1px 6px rgba(0,0,0,0.05);
}
.card-img-box img {
    width: 100%;
    display: block;
}
.card-info {
    padding: 8px;
}
.card-title {
    font-size: 14px;
    color: #333;
    margin-bottom: 6px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
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
}

/* Shop List Styles (Detailed) */
.shop-item {
    display: flex;
    padding: 15px;
    background: #fff;
    margin-bottom: 10px;
    border-radius: 8px; /* Maintain radius for search results */
    box-shadow: 0 1px 4px rgba(0,0,0,0.05); /* Slight shadow for search list */
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

/* Voucher List Styles (Card V2) */
.voucher-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.voucher-card-v2 {
    border-radius: 12px;
    overflow: hidden;
    background: #fff;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    margin-bottom: 10px;
}

/* Header Section */
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

/* Colors */
.voucher-big-title .amount-highlight.seckill-color {
    color: #FF2442;
}
.shop-name-row.normal {
    color: #FF9000;
}
.time-row.normal {
    color: #FF9000;
}

/* Footer Section */
.voucher-price-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background: linear-gradient(90deg, #FFA940 0%, #FFB86C 100%);
    color: #fff;
}
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

.empty-result {
    text-align: center;
    padding: 40px 0;
    color: #999;
    font-size: 14px;
}
.empty-result img {
    width: 120px;
    margin-bottom: 10px;
}
</style>
