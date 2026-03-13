<template>
  <div class="shop-list-page">
    <div class="header">
      <div class="header-back-btn" @click="goBack"><i class="el-icon-arrow-left"></i></div>
      
      <div class="header-title" v-if="!isSearchMode">{{typeName || '店铺列表'}}</div>
      <div class="header-search-input" v-else>
         <i class="el-icon-search input-icon"></i>
         <input v-model="searchText" placeholder="输入商户名、地点..." @keyup.enter="doSearch" ref="searchInput">
         <i class="el-icon-close clear-icon" v-if="searchText" @click="searchText=''"></i>
      </div>
      
      <div class="header-actions">
        <div class="header-search-btn" @click="handleSearchAction">
           <span v-if="isSearchMode">{{ searchText ? '搜索' : '取消' }}</span>
           <i class="el-icon-search" v-else></i>
        </div>
      </div>
    </div>

    <!-- Sort Bar (Always show) -->
    <div class="filter-wrapper">
    <!-- Filter Bar (Meituan Style) -->
    <div class="meituan-filter-bar">
         <!-- Shop Type -->
         <div class="filter-item" :class="{active: activeFilterTab==='type'}" @click="toggleFilterTab('type')">
             <div class="filter-text">{{selectedTypeId ? getShopTypeName(selectedTypeId) : '全部分类'}} <i class="el-icon-arrow-down"></i></div>
         </div>
         <!-- Distance -->
         <div class="filter-item" :class="{active: activeFilterTab==='distance'}" @click="toggleFilterTab('distance')">
             <div class="filter-text">{{selectedDistance || '距离'}} <i class="el-icon-arrow-down"></i></div>
         </div>
         <!-- Score -->
         <div class="filter-item" :class="{active: activeFilterTab==='score'}" @click="toggleFilterTab('score')">
             <div class="filter-text">{{selectedScore || '评分'}} <i class="el-icon-arrow-down"></i></div>
         </div>
         <!-- Sort -->
         <div class="filter-item" :class="{active: activeFilterTab==='sort'}" @click="toggleFilterTab('sort')">
             <div class="filter-text">{{selectedSort ? getSortLabel(selectedSort) : '智能排序'}} <i class="el-icon-arrow-down"></i></div>
         </div>
    </div>
    
    <!-- Filter Dropdowns -->
    <div class="filter-content" :class="{show: !!activeFilterTab}">
         <!-- Shop Type -->
         <div v-if="activeFilterTab==='type'" class="shop-type-panel">
            <div class="shop-type-grid">
               <div class="shop-type-item" :class="{active: selectedTypeId===t.id}" v-for="t in shopTypeList" :key="t.id" @click="selectShopType(t.id)">{{t.name}}</div>
            </div>
         </div>
         <!-- Distance -->
         <div v-if="activeFilterTab==='distance'" class="distance-panel">
             <div class="distance-options">
                 <div class="distance-option" :class="{active: selectedDistance===d.label}" v-for="d in distanceOptions" :key="d.value" @click="selectDistance(d)">{{d.label}}</div>
             </div>
         </div>
         <!-- Score -->
         <div v-if="activeFilterTab==='score'" class="score-panel">
             <div class="score-options">
                 <div class="score-option" :class="{active: selectedScore===s.label}" v-for="s in scoreOptions" :key="s.value" @click="selectScore(s)">{{s.label}}</div>
             </div>
         </div>
         <!-- Sort -->
         <div v-if="activeFilterTab==='sort'" class="score-panel">
             <div class="score-options">
                 <div class="score-option" :class="{active: selectedSort===s.value}" v-for="s in sortOptions" :key="s.value" @click="selectSort(s)">{{s.label}}</div>
             </div>
         </div>
    </div>
    </div>
    
    <div class="status-filter-strip">
      <div class="status-filter-group">
        <div class="status-filter-title">业务状态</div>
        <div class="biz-status-filter-row">
          <button
            v-for="option in businessStatusOptions"
            :key="`shop-status-${option.value}`"
            type="button"
            class="biz-status-filter-chip"
            :class="{ 'is-active': selectedBusinessStatus === option.value }"
            @click="selectBusinessStatus(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
      </div>
      <div class="status-filter-group">
        <div class="status-filter-title">审核状态</div>
        <div class="biz-status-filter-row">
          <button
            v-for="option in auditStatusOptions"
            :key="`shop-audit-${option.value}`"
            type="button"
            class="biz-status-filter-chip"
            :class="{ 'is-active': selectedAuditStatus === option.value }"
            @click="selectAuditStatus(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- Search Suggestion Panel Removed -->

    <!-- Shop List -->
    <div class="shop-list-content" ref="shopListContainer" @scroll.passive="onScroll" v-loading="isLoading">
       <div v-if="shops.length > 0">
          <div class="shop-card" v-for="s in shops" :key="s.id" @click="toDetail(s.id)">
              <!-- Image with Fallback -->
              <div class="shop-card-img">
                  <img :src="s.shopLogo || s.images" v-if="(s.shopLogo || s.images) && !s.imageError" :class="{ 'is-loaded': s.imgLoaded }" loading="lazy" decoding="async" @error="s.imageError = true" @load="s.imgLoaded = true" alt="">
                  <div class="img-skeleton" v-if="(s.shopLogo || s.images) && !s.imageError && !s.imgLoaded"></div>
                  <div class="img-placeholder" v-if="!(s.shopLogo || s.images) || s.imageError">
                      <i class="el-icon-goods"></i>
                  </div>
              </div>
              <!-- Info -->
              <div class="shop-card-info">
                 <!-- Row 1: Title -->
                 <div class="shop-card-title" v-html="s.name"></div>
                 <div v-if="getShopDisplayStatusMeta(s).visible" class="shop-card-status-row">
                    <span :class="['biz-status-chip', getStatusToneClass(getShopDisplayStatusMeta(s).tone)]">
                      {{ getShopDisplayStatusMeta(s).text }}
                    </span>
                 </div>
                 <!-- Row 2: Rating + Price -->
                 <div class="shop-card-stats">
                    <van-rate :model-value="Number(s.score || 0) / 10" readonly allow-half color="#F63" void-icon="star" void-color="#eee" size="12px" />
                    <span class="stats-score">{{ formatScore(s.score) }}</span>
                    <span class="stats-comments">{{ s.comments || 0 }}条</span>
                    <span class="stats-price" v-if="s.avgPrice">￥{{ s.avgPrice }}/人</span>
                 </div>
                 <!-- Row 3: Location + Distance -->
                 <div class="shop-card-location">
                    <span class="location-text">{{s.area || '未知区域'}} <span v-if="getShopTypeName(s.typeId)">| {{getShopTypeName(s.typeId)}}</span></span>
                    <span class="location-distance" v-if="s.distance">{{ formatDistance(s.distance) }}</span>
                 </div>
                 <!-- Row 4: Tags -->
                 <div class="shop-card-tags">
                    <span class="tag">可预约</span>
                    <span class="tag">有停车位</span>
                 </div>
              </div>
           </div>
          <div v-if="loadError" class="load-error-retry" @click="queryShops(false)" style="text-align: center; padding: 15px; color: #999; cursor: pointer;">
             加载失败，点击重试 <i class="el-icon-refresh"></i>
          </div>
          <div class="no-more" v-if="noMore && !isSearchMode && !loadError">没有更多了</div>
       </div>
       <div v-else-if="!isLoading && isSearchMode && hasSearched" class="custom-empty-state">
           <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXw9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiByeD0iOCIgZmlsbD0iI0Y4RjlGQSIvPgo8cGF0aCBkPSJNNDAgNDJMMzIgMzRMMzQgMzJMNDAgMzhMNDYgMzJMNDggMzRMNDAgNDJaIiBmaWxsPSIjQzBDNEY0Ii8+CjxwYXRoIGQ9Ik00MCA0MkwzMiAzNEwzNCAzMkw0MCAzOEw0NiAzMkw0OCAzNEw0MCA0MloiIGZpbGw9IiNDMEM0RjQiLz4KPC9zdmc+Cg==">
           <p>未找到相关店铺</p>
           <span class="sub-text">换个关键词试试吧</span>
       </div>
       <div v-else-if="!isLoading && !isSearchMode" class="custom-empty-state">
           <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiByeD0iOCIgZmlsbD0iI0Y4RjlGQSIvPgo8cGF0aCBkPSJNNDAgNDJMMzIgMzRMMzQgMzJMNDAgMzhMNDYgMzJMNDggMzRMNDAgNDJaIiBmaWxsPSIjQzBDNEY0Ii8+CjxwYXRoIGQ9Ik00MCA0MkwzMiAzNEwzNCAzMkw0MCAzOEw0NiAzMkw0OCAzNEw0MCA0MloiIGZpbGw9IiNDMEM0RjQiLz4KPC9zdmc+Cg==">
           <p>暂无相关店铺</p>
       </div>
       <div ref="shopLoadSentinel" class="io-sentinel" aria-hidden="true"></div>
    </div>
    
  </div>
</template>

<script>
import { getShopTypes } from '@/api/shop';
import { searchShops } from '@/api/search';
import { locationUtil } from '@/utils/location';
import { getCurrentUser } from '@/api/user'; // Need userId for history
import { throttle } from '@/utils/throttle';
import { debounce } from '@/utils/debounce';
import {
  getAuditStatusMeta,
  getAuditStatusOptions,
  getBusinessStatusMeta,
  getBusinessStatusOptions,
  getSingleDisplayStatusMeta,
  getStatusToneClass
} from '@/utils/contentStatus';

export default {
  name: 'ShopList',
  data() {
    return {
       typeName: '',
       shopTypeList: [],
       // Filter State
       activeFilterTab: '',
       selectedTypeId: 0,
       selectedDistance: null,
       selectedScore: null,
       selectedSort: 'hot',
       selectedBusinessStatus: 'all',
       selectedAuditStatus: 'all',
       
       // Options
       distanceOptions: [
         { label: "1km以内", value: "1km" },
         { label: "3km以内", value: "3km" },
         { label: "5km以内", value: "5km" },
         { label: "10km以内", value: "10km" },
         { label: "全部", value: "" },
       ],
       scoreOptions: [
         { label: "4.5分以上", value: 45 },
         { label: "4.0分以上", value: 40 },
         { label: "3.5分以上", value: 35 },
         { label: "全部", value: 0 },
       ],
       sortOptions: [
         { label: "智能排序", value: "hot" },
         { label: "距离优先", value: "distance" },
         { label: "好评优先", value: "score" },
         { label: "低价优先", value: "price" }
       ],
       
       businessStatusOptions: getBusinessStatusOptions('shop', { includeAll: true, allLabel: '全部业务状态' }),
       auditStatusOptions: getAuditStatusOptions({ includeAll: true, allLabel: '全部审核状态' }),
       shops: [],
       isLoading: false,
       loadError: false,
       noMore: false,
       showLocationStatus: false,
       
       // Search
       isSearchMode: false,
       searchText: '',
       hasSearched: false,
       searchHistory: [],
       hotSearch: [],
       loginUser: {},
       
       params: {
          typeId: 0,
          current: 1,
          sortBy: '',
          x: 120.149993,
          y: 30.334229
       },
       shopListObserver: null,
       shopRequestToken: 0,
       searchDebouncedRunner: null,
       savedScrollTop: 0
     }
  },
  created() {
     this.onScroll = throttle(this.onScroll, 120);
     this.searchDebouncedRunner = debounce(() => this.doSearch(), 180);

     this.syncStateFromRouteQuery();

     this.loadTypes();
     this.loadUser();
      this.initLocation();
  },
  mounted() {
     this.$nextTick(() => {
        this.setupShopSentinelObserver();
        this.restoreScrollPosition();
     });
  },
  activated() {
     this.$nextTick(() => {
        this.setupShopSentinelObserver();
        this.restoreScrollPosition();
     });
  },
  deactivated() {
     this.captureScrollPosition();
     this.destroyShopSentinelObserver();
  },
  beforeRouteLeave(to, from, next) {
     this.captureScrollPosition();
     next();
  },
  beforeUnmount() {
     this.captureScrollPosition();
     this.destroyShopSentinelObserver();
     if (typeof this.onScroll?.cancel === 'function') {
        this.onScroll.cancel();
     }
     if (typeof this.searchDebouncedRunner?.cancel === 'function') {
        this.searchDebouncedRunner.cancel();
     }
  },
  methods: {
     captureScrollPosition() {
         const container = this.$refs.shopListContainer;
         if (!container) return;
         const top = Number(container.scrollTop);
         if (Number.isFinite(top) && top >= 0) {
            this.savedScrollTop = top;
         }
     },
     restoreScrollPosition() {
         const container = this.$refs.shopListContainer;
         if (!container) return;
         const targetTop = Number(this.savedScrollTop);
         if (!Number.isFinite(targetTop) || targetTop < 0) return;

         const apply = () => {
            container.scrollTop = targetTop;
         };

         // Apply repeatedly to avoid late layout changes (images/skeleton) pulling it back to top.
         apply();
         if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(() => {
               apply();
               requestAnimationFrame(() => {
                  apply();
               });
            });
         }
     },
      syncStateFromRouteQuery() {
          const q = this.$route.query || {};
          this.typeName = q.name || '';
          this.params.typeId = parseInt(q.type || 0);
          this.selectedTypeId = this.params.typeId;
          this.selectedDistance = q.distance || null;
          this.selectedScore = q.score || null;
          this.selectedSort = q.sort || 'hot';
          this.selectedBusinessStatus = q.status || 'all';
          this.selectedAuditStatus = q.auditStatus || 'all';
      },
      triggerSearch(immediate = false) {
         if (immediate) {
            if (typeof this.searchDebouncedRunner?.cancel === 'function') {
               this.searchDebouncedRunner.cancel();
            }
            this.doSearch();
            return;
         }
         if (typeof this.searchDebouncedRunner === 'function') {
            this.searchDebouncedRunner();
            return;
         }
         this.doSearch();
     },
     goBack() {
        if(this.isSearchMode) {
            // Exit search mode cleanly
            this.isSearchMode = false;
            this.searchText = '';
            this.shops = []; 
            this.hasSearched = false;
            this.queryShops(true);
        } else {
            this.$router.go(-1);
        }
     },
     loadUser() {
        // Try get user for history
        const token = localStorage.getItem("token");
        if(token) {
           getCurrentUser().then(res => {
               this.loginUser = res || {};
           });
        }
     },
     loadTypes() {
        getShopTypes().then(res => {
           // Screenshot confirmed res.data is the array
           const list = (res && res.data) || [];
           this.shopTypeList = [{ id: 0, name: '全部分类' }, ...list];
           
           // Sync route type only when this is a fresh enter (not one-time restore).
           const routeTypeId = parseInt(this.$route.query.type || 0);
           this.selectedTypeId = routeTypeId;
         }).catch(err => {
            console.error("Failed to load shop types", err);
            this.shopTypeList = [{ id: 0, name: 'All' }];
         });
     },
     getShopTypeName(id) {
         if(!id) return '全部分类';
         const t = this.shopTypeList.find(i => i.id === id);
         if (t) return t.name;
         // Fallback: use route query name if type list is not ready.
         if (id === this.selectedTypeId && this.typeName) return this.typeName;
         return '全部分类';
     },
     toggleFilterTab(tab) {
         this.activeFilterTab = this.activeFilterTab === tab ? '' : tab;
     },
     selectShopType(id) {
         this.selectedTypeId = id;
         // Update title
         this.typeName = this.getShopTypeName(id);
         this.activeFilterTab = '';
         this.updateRouteQuery();
         this.triggerSearch();
     },
     selectDistance(d) {
         this.selectedDistance = d.label === '全部' ? null : d.label;
         this.activeFilterTab = '';
         this.updateRouteQuery();
         this.triggerSearch();
     },
     selectSort(s) {
         this.selectedSort = s.value;
         this.activeFilterTab = '';
         this.updateRouteQuery();
         this.triggerSearch();
     },
     selectBusinessStatus(value) {
         if (this.selectedBusinessStatus === value) return;
         this.selectedBusinessStatus = value;
         this.updateRouteQuery();
         this.triggerSearch(true);
     },
     selectAuditStatus(value) {
         if (this.selectedAuditStatus === value) return;
         this.selectedAuditStatus = value;
         this.updateRouteQuery();
         this.triggerSearch(true);
     },
     getStatusToneClass,
     getShopDisplayStatusMeta(item) {
         return getSingleDisplayStatusMeta('shop', item?.status, item?.auditStatus);
     },
     getSortLabel(val) {
         const option = this.sortOptions.find(o => o.value === val);
         return option ? option.label : '智能排序';
     },
     updateRouteQuery() {
        // Remove 'name' from query as we rely on typeId to determine title
        // Or update it to match current selection
         const query = {
             ...this.$route.query,
             type: this.selectedTypeId || undefined,
             distance: this.selectedDistance || undefined,
             score: this.selectedScore || undefined,
             sort: this.selectedSort !== 'hot' ? this.selectedSort : undefined,
             status: this.selectedBusinessStatus !== 'all' ? this.selectedBusinessStatus : undefined,
             auditStatus: this.selectedAuditStatus !== 'all' ? this.selectedAuditStatus : undefined
         };

        // Update name param if type is selected
        if (this.selectedTypeId) {
            query.name = this.getShopTypeName(this.selectedTypeId);
        } else {
            delete query.name;
        }

        this.$router.replace({ query });
     },
     sortAndQuery(sortBy) {
        // Deprecated, keeping structure if needed but logic is replaced
     },
     toDetail(id) {
        this.$router.push({ path: '/shop/detail', query: { id }});
     },
     
     // Search Logic
     handleSearchAction() {
        if (this.isSearchMode) {
            if (this.searchText) {
                this.doSearch();
            } else {
                // Cancel
                this.isSearchMode = false;
                this.searchText = '';
                this.shops = []; 
                this.hasSearched = false;
                this.queryShops(true);
            }
        } else {
            // Enter search mode
            this.isSearchMode = true;
            this.doSearch();
            this.$nextTick(() => {
                if(this.$refs.searchInput) this.$refs.searchInput.focus();
            });
        }
     },
     /* History logic removed */
     quickSearch(txt) {
         this.searchText = txt;
         this.doSearch();
     },
     formatScore(score) {
        const numeric = Number(score);
        if (!Number.isFinite(numeric) || numeric <= 0) return '0.0';
        return (numeric / 10).toFixed(1);
     },
     formatDistance(distance) {
        const numeric = Number(distance);
        if (!Number.isFinite(numeric) || numeric <= 0) return '';
        return numeric < 1000 ? `${numeric.toFixed(0)}m` : `${(numeric / 1000).toFixed(1)}km`;
     },
     resolveDistanceValue(label) {
        if (!label) return 'all';
        const matched = this.distanceOptions.find((option) => option.label === label);
        if (matched) return matched.value || 'all';
        if (label === '全部' || label === 'All') return 'all';
        return 'all';
     },
     loadMoreShops() {
        if (this.isSearchMode && this.hasSearched) return;
        if (this.isLoading || this.noMore || this.loadError) return;
        this.queryShops();
     },
     setupShopSentinelObserver() {
        this.destroyShopSentinelObserver();
        if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
        const sentinel = this.$refs.shopLoadSentinel;
        const root = this.$refs.shopListContainer;
        if (!sentinel || !root) return;
        this.shopListObserver = new IntersectionObserver((entries) => {
           if (entries.some((entry) => entry.isIntersecting)) {
              this.loadMoreShops();
           }
        }, {
           root,
           rootMargin: '0px 0px 140px 0px',
           threshold: 0
        });
        this.shopListObserver.observe(sentinel);
     },
     destroyShopSentinelObserver() {
        if (this.shopListObserver && typeof this.shopListObserver.disconnect === 'function') {
           this.shopListObserver.disconnect();
        }
        this.shopListObserver = null;
     },
     doSearch() {
         if (typeof this.searchDebouncedRunner?.cancel === 'function') {
             this.searchDebouncedRunner.cancel();
         }
         const hasFilters = this.selectedTypeId || this.selectedDistance || this.selectedScore || this.selectedBusinessStatus !== 'all' || this.selectedAuditStatus !== 'all';
         if (!this.searchText.trim() && !hasFilters) return;

         const requestToken = ++this.shopRequestToken;
         const isStale = () => requestToken !== this.shopRequestToken;

         this.isLoading = true;
         this.loadError = false;
         this.shops = [];
         this.noMore = false;
         this.loadError = false;
         this.loadError = false;
         this.hasSearched = true;

         const filters = {};
         if (this.selectedTypeId) filters.typeId = this.selectedTypeId;
         if (this.selectedBusinessStatus !== 'all') filters.status = Number(this.selectedBusinessStatus);
         if (this.selectedAuditStatus !== 'all') filters.auditStatus = Number(this.selectedAuditStatus);

         

         if (this.selectedScore) {
            const s = this.scoreOptions.find(o => o.label === this.selectedScore);
            if (s) filters.minScore = s.value;
         }

         const searchParams = {
             keyword: this.searchText,
             filters,
             page: 1,
             size: 20,
             lat: this.params.y,
             lon: this.params.x,
             distance: this.resolveDistanceValue(this.selectedDistance),
             sortBy: this.selectedSort
         };

         searchShops(searchParams).then(res => {
             if (isStale()) return;
             let list = [];
             if (Array.isArray(res)) list = res;
             else if (res && Array.isArray(res.list)) list = res.list;
             else if (res && res.data && Array.isArray(res.data.list)) list = res.data.list;

             list.forEach(s => {
                 if (s.shopLogo && !s.shopLogo.startsWith('http')) {
                     s.shopLogo = this.$fileURL + s.shopLogo.split(',')[0];
                 }
                 if (s.images && !s.images.startsWith('http')) {
                     s.images = this.$fileURL + s.images.split(',')[0];
                 }
                 s.imgLoaded = false;
                 s.imageError = false;
             });
             this.shops = list;

             if (this.shops.length === 0) {
                 this.$message.info('暂无相关店铺');
             }
         }).catch((err) => {
             if (isStale()) return;
             console.error('search shops failed', err);
             this.$message.error('店铺加载失败，请稍后重试');
         }).finally(() => {
             if (isStale()) return;
             this.isLoading = false;
         });
     },

     queryShops(reset = false) {
        if (this.isSearchMode) {
             this.doSearch();
             return;
        }

        if (reset) {
           this.shops = [];
           this.params.current = 1;
           this.noMore = false;
           this.loadError = false;
           this.loadError = false;
        }
        if (this.isLoading || this.noMore || this.loadError) return;

        const requestToken = ++this.shopRequestToken;
        const isStale = () => requestToken !== this.shopRequestToken;

        this.isLoading = true;

         const filters = {};
         if (this.selectedTypeId) filters.typeId = this.selectedTypeId;
         if (this.selectedBusinessStatus !== 'all') filters.status = Number(this.selectedBusinessStatus);
         if (this.selectedAuditStatus !== 'all') filters.auditStatus = Number(this.selectedAuditStatus);

        const searchPayload = {
           keyword: '',
           filters,
           page: this.params.current,
           size: 10,
           lat: this.params.y,
           lon: this.params.x,
           distance: this.resolveDistanceValue(this.selectedDistance),
           sortBy: this.selectedSort
        };

        searchShops(searchPayload).then(res => {
           if (isStale()) return;
           let list = [];
           if (Array.isArray(res)) list = res;
           else if (res && Array.isArray(res.list)) list = res.list;
           else if (res && res.data && Array.isArray(res.data.list)) list = res.data.list;
           else if (res && Array.isArray(res.data)) list = res.data;

           if (!list || list.length === 0) {
              this.noMore = true;
           } else {
              list.forEach(s => {
                  if (s.shopLogo && !s.shopLogo.startsWith('http')) {
                      s.shopLogo = this.$fileURL + s.shopLogo.split(',')[0];
                  }
                  if (s.images && !s.images.startsWith('http')) {
                      s.images = (this.$fileURL || '') + s.images.split(',')[0];
                  }
                  s.imgLoaded = false;
                  s.imageError = false;
              });
              this.shops = this.shops.concat(list);
              this.params.current++;
           }
        }).catch((err) => {
           if (isStale()) return;
           console.error('query shops failed', err);
           this.$message.error('店铺列表加载失败，请稍后重试');
        }).finally(() => {
           if (isStale()) return;
           this.isLoading = false;
        });
     },
     initLocation(force = false) {
        locationUtil.getLocation(force).then(loc => {
           this.params.x = loc.x;
           this.params.y = loc.y;
           this.queryShops(true);
        }).catch(err => {
           console.error(err);
           this.queryShops(true);
        });
     },
     onScroll(e) {
        if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
           this.savedScrollTop = e.target.scrollTop;
           return;
        }
        const { scrollTop, clientHeight, scrollHeight } = e.target;
        this.savedScrollTop = scrollTop;
        if (scrollTop + clientHeight >= scrollHeight - 50) {
           this.loadMoreShops();
        }
     }
  }
}
</script>

<style scoped>
.shop-list-page { height: 100vh; overflow: hidden; display: flex; flex-direction: column; background: #f5f5f5; }

/* Header */
.header {
  position: relative;
  height: 50px;
  background-color: #fff;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  padding: 0 10px;
}
.header-back-btn { width: 30px; font-size: 20px; cursor: pointer; color: #333; display: flex; align-items: center; justify-content: center; }
.header-title { position: absolute; left: 50%; transform: translateX(-50%); font-size: 18px; font-weight: 500; color: #333; pointer-events: none; white-space: nowrap; }

.header-search-input { flex: 1; margin: 0 10px; position: relative; display: flex; align-items: center; }
.header-search-input input { width: 100%; height: 32px; background: #f5f5f5; border: none; border-radius: 16px; padding: 0 30px; font-size: 14px; outline: none; }
.input-icon { position: absolute; left: 10px; color: #999; font-size: 14px; }
.clear-icon { position: absolute; right: 10px; color: #ccc; font-size: 14px; cursor: pointer; }

.header-actions { min-width: 50px; display: flex; justify-content: flex-end; padding-right: 12px; }
.header-search-btn { font-size: 15px; color: #333; cursor: pointer; white-space: nowrap; padding: 0 5px; }
.header-search-btn i { font-size: 20px; }

/* Sort Bar */
.sort-bar {
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 40px;
  background-color: #fff;
  border-bottom: 1px solid #e0e0e0;
  z-index: 10;
}
.sort-item { font-size: 14px; color: #666; cursor: pointer; display: flex; align-items: center; }

/* Search Panel */
.search-panel { flex: 1; background: white; padding: 15px; overflow-y: auto; z-index: 20; position: absolute; top: 50px; left: 0; right: 0; bottom: 0; }
.panel-title { font-size: 14px; color: #999; margin-bottom: 10px; display: flex; justify-content: space-between; }
.tag-list { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 20px; }
.tag { padding: 6px 12px; background: #f5f5f5; border-radius: 16px; font-size: 12px; color: #333; cursor: pointer; }
.tag.hot { color: #ff6600; background: #fff8f5; }

/* Shop List Layout */
.shop-list-page { display: flex; flex-direction: column; height: 100vh; background-color: #fff; }
.shop-list-content { flex: 1; overflow-y: auto; padding: 0; background: #f5f5f5; }
.io-sentinel { width: 100%; height: 1px; }

/* Shop Card - Meituan/Yelp Style */
.shop-card {
    display: flex;
    padding: 14px 12px;
    background: white;
    border-bottom: 1px solid #f0f0f0;
}
.shop-card:active {
    background: #fafafa;
}

/* Image Container */
.shop-card-img {
    position: relative;
    width: 88px;
    height: 88px;
    border-radius: 8px;
    overflow: hidden;
    flex-shrink: 0;
    margin-right: 12px;
    background: #f5f5f5;
}
.shop-card-img img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.shop-card-img .img-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #e9e9e9;
    color: #bbb;
    font-size: 28px;
}

/* Info Column */
.shop-card-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-width: 0;
}
.shop-card-status-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
}

/* Title Row */
.shop-card-title {
    font-size: 16px;
    font-weight: 600;
    color: #333;
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* Stats Row (Rating + Price) */
.shop-card-stats {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 4px;
}
.stats-score {
    font-size: 13px;
    font-weight: 600;
    color: #ff6633;
}
.stats-comments {
    font-size: 12px;
    color: #999;
    margin-left: 2px;
}
.stats-price {
    font-size: 13px;
    font-weight: 600;
    color: #333;
    margin-left: auto; /* Push to right */
}

/* Location Row */
.shop-card-location {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 4px;
}
.location-text {
    font-size: 12px;
    color: #999;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.location-distance {
    font-size: 12px;
    color: #999;
    flex-shrink: 0;
    margin-left: 8px;
}

/* Tags Row */
.shop-card-tags {
    display: flex;
    gap: 6px;
    margin-top: 6px;
}
.shop-card-tags .tag {
    font-size: 10px;
    color: #ff9500;
    background: #fff8f0;
    padding: 2px 6px;
    border-radius: 3px;
    border: 1px solid #ffe0c0;
}

.no-more { text-align: center; color: #999; padding: 10px; font-size: 12px; }
.custom-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 50px;
  width: 100%;
}
.custom-empty-state img {
  width: 100px;
  height: 100px;
  margin-bottom: 20px;
}
.custom-empty-state p {
  font-size: 15px;
  color: #666;
  margin-bottom: 8px;
}
.custom-empty-state .sub-text {
  font-size: 12px;
  color: #999;
}

.custom-empty-state .sub-text {
  font-size: 12px;
  color: #999;
}

/* Meituan Style Filter Bar */
.meituan-filter-bar {
  display: flex;
  background: white;
  border-bottom: 1px solid #f0f0f0;
  padding: 4px 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}
.filter-item {
    flex: 1;
    text-align: center;
    padding: 12px 0;
    font-size: 13px;
    color: #666;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}
.filter-item.active { color: #F63; }
.filter-text i { margin-left: 4px; font-size: 12px; }

.filter-wrapper { position: relative; z-index: 100; }
.status-filter-strip {
  background: #fff;
  padding: 10px 12px 12px;
  margin-bottom: 8px;
}
.status-filter-group + .status-filter-group {
  margin-top: 10px;
}
.status-filter-title {
  margin-bottom: 8px;
  font-size: 12px;
  color: #999;
}

/* Filter Dropdown Content */
.filter-content {
  position: relative;
  /* Relative to filter-wrapper */
  left: 0;
  background: white;
  max-height: 0;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);
  z-index: 99;
}
.filter-content.show {
  max-height: 400px;
  overflow-y: auto;
}

.shop-type-panel, .distance-panel, .score-panel { padding: 15px; }
.shop-type-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.shop-type-item {
    padding: 8px 0;
    background: #f5f5f5;
    text-align: center;
    border-radius: 4px;
    font-size: 12px;
    color: #333;
    cursor: pointer;
}
.shop-type-item.active { background: #fff0eb; color: #F63; }

.distance-option, .score-option {
    padding: 12px 0;
    border-bottom: 1px solid #f9f9f9;
    font-size: 14px;
    color: #333;
    cursor: pointer;
}
.distance-option.active, .score-option.active { color: #F63; }

/* Mask */
.type-dropdown-mask { position: fixed; top: 90px; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 90; }

</style>
