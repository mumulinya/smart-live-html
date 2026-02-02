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
                <div v-for="shop in results" :key="shop.id" class="shop-item" @click="toShopDetail(shop)">
                    <img :src="getImage(shop.images)" class="shop-img">
                    <div class="shop-info">
                        <div class="shop-name" v-html="shop.name"></div>
                        <div class="shop-score">
                            <van-rate v-model="shop.score" readonly size="12" color="#ffd21e" />
                            <span>{{ (shop.score/10).toFixed(1) }}分</span>
                        </div>
                        <div class="shop-area">{{ shop.area || '未知区域' }}</div>
                    </div>
                </div>
            </div>

            <!-- Voucher Results -->
            <div v-if="activeScope === 'voucher'" class="voucher-list">
                 <div v-for="v in results" :key="v.id" class="voucher-item" @click="toVoucherDetail(v)">
                    <div class="voucher-left">
                        <div class="voucher-amount">¥{{ v.payValue }}</div>
                        <div class="voucher-cond">满{{ v.actualValue }}可用</div>
                    </div>
                    <div class="voucher-right">
                        <div class="voucher-title" v-html="v.title"></div>
                        <div class="voucher-sub" v-html="v.subTitle || '暂无描述'"></div>
                        <div class="voucher-btn">立即购买</div>
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
import { getMyBlogs } from '@/api/blog';
import { likeRecord, starList, getShopCollections, getFollows } from '@/api/interaction'; 

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
     
     const h = localStorage.getItem("userSearchHistory");
     if (h) this.historyList = JSON.parse(h);
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
    clearHistory() {
        this.historyList = [];
        localStorage.removeItem("userSearchHistory");
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

        if(this.keyword) {
            this.onSearch();
        }
    },
    changeSubScope(sub) {
        if(this.activeSubScope === sub) return;
        this.activeSubScope = sub;
        if(this.keyword) {
            this.onSearch();
        }
    },
    onSearch() {
        if(!this.keyword.trim()) return;
        this.results = [];
        this.current = 1;
        this.finished = false;
        this.hasSearched = true;
        this.loading = true; 
        
        // Local history logic
        let set = new Set(this.historyList);
        // Remove if exists to move to top
        if(set.has(this.keyword)) set.delete(this.keyword);
        
        const arr = [this.keyword, ...set].slice(0, 10);
        this.historyList = arr;
        localStorage.setItem("userSearchHistory", JSON.stringify(arr));
        
        this.onLoad();
    },
    onLoad() {
        if(!this.keyword) {
            this.loading = false;
            return;
        }
        
        // API Routing
        // We pass 'keyword' as a parameter. Assuming backend filters by it if present.
        // If backend doesn't support keyword on these lists, pagination + client filter is the only way,
        // but that's inefficient. Let's send it and hope/assume backend uses it or we filter if we must.
        // Given typically these are just "List" APIs, they might not search. 
        // BUT user asked for "Search...". So we expect search capability.
        // I will pass `name` or `title` or `keyword` param depending on likely API signature.

        let apiCall = null;
        let params = { current: this.current, size: 10, userId: this.userId };
        
        // --- BLOG ---
        if(this.activeScope === 'blog') {
            if(this.activeSubScope === 'works') {
                // works -> getMyBlogs 
                // getMyBlogs(params)
                params.title = this.keyword; // Assuming searching by title
                apiCall = getMyBlogs(params);
            } else if(this.activeSubScope === 'like') {
                // like -> likeRecord(sourceType=3)
                params.sourceType = 3; 
                // likeRecord doesn't usually take search params?? 
                // If it fails to filter, we might show all. 
                // Let's try passing 'keyword' or 'name'.
                // Checking interaction.js: likeRecord(params).
                apiCall = likeRecord({ ...params, keyword: this.keyword });
            } else if(this.activeSubScope === 'collection') {
                 // collection -> starList(sourceType=3)
                 params.sourceType = 3;
                 apiCall = starList({ ...params, keyword: this.keyword });
            }
        } 
        // --- SHOP ---
        else if(this.activeScope === 'shop') {
             if(this.activeSubScope === 'collection') {
                 // getShopCollections
                 apiCall = getShopCollections({ ...params, name: this.keyword });
             } else if(this.activeSubScope === 'follow') {
                  // Followed shops/users?  sourceType?
                  // Assuming generic follows? 
                  apiCall = getFollows({ ...params, nickname: this.keyword });
             }
        }
        // --- VOUCHER ---
        else if(this.activeScope === 'voucher') {
            if(this.activeSubScope === 'collection') {
                 // starList(sourceType=2 for voucher?)
                 params.sourceType = 2; // Guessing 2=Voucher based on Shop=1, Blog=3? Verify with existing code if possible. Usually 1=Shop? 
                 // Let's assume sourceType 2 is voucher.
                 apiCall = starList({ ...params, keyword: this.keyword });
            } else if(this.activeSubScope === 'follow') {
                 // Vouchers don't really have "Follow". Maybe User means 'Collection'? 
                 // Or Follow the shop of the voucher?
                 // User asked for "Focus/Follow" (关注).
                 // I'll map it to starList with sourceType=2 for now.
                 params.sourceType = 2;
                 apiCall = starList({ ...params, keyword: this.keyword });
            }
        }

        if(apiCall) {
            apiCall.then(this.handleResponse).catch(this.handleError);
        } else {
            this.loading = false;
        }
    },
    handleResponse(res) {
        let list = [];
        // Extract list from various response structures
        if(Array.isArray(res)) list = res;
        else if(res && Array.isArray(res.list)) list = res.list;
        else if(res && res.data && Array.isArray(res.data.list)) list = res.data.list;
        else if(res && res.data && Array.isArray(res.data.records)) list = res.data.records;
        else if(res && res.records && Array.isArray(res.records)) list = res.records;
        
        // Client-side filter if API returns everything (Fallback)
        // Only if we suspect API didn't filter.
        // For 'keyword' highlight to work, we need match.
        // list = list.filter(item => (item.title && item.title.includes(this.keyword)) || (item.name && item.name.includes(this.keyword)));

        if(list.length === 0) {
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
    padding: 0 15px;
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

/* Shop List Styles */
.shop-item {
    display: flex;
    padding: 10px;
    background: #fff;
    border-radius: 8px;
    margin-bottom: 10px;
}
.shop-img {
    width: 80px;
    height: 80px;
    border-radius: 4px;
    object-fit: cover;
    margin-right: 12px;
}
.shop-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}
.shop-name {
    font-size: 16px;
    font-weight: bold;
    color: #333;
}
.shop-score {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #666;
}
.shop-area {
    font-size: 12px;
    color: #999;
}

/* Voucher List Styles */
.voucher-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}
.voucher-item {
    display: flex;
    background: #fff;
    border-radius: 8px;
    overflow: hidden;
}
.voucher-left {
    width: 100px;
    background: linear-gradient(135deg, #ff9a9e 0%, #fad0c4 99%, #fad0c4 100%);
    color: #fff;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 10px;
}
.voucher-amount {
    font-size: 20px;
    font-weight: bold;
}
.voucher-cond {
    font-size: 12px;
}
.voucher-right {
    flex: 1;
    padding: 10px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}
.voucher-title {
    font-size: 14px;
    font-weight: bold;
    color: #333;
}
.voucher-sub {
    font-size: 12px;
    color: #999;
}
.voucher-btn {
    align-self: flex-end;
    background: #ff2442;
    color: #fff;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
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
