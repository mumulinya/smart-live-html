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
    </div>
    </div>
    
    <!-- Mask -->
    <div class="type-dropdown-mask" v-if="activeFilterTab" @click="activeFilterTab=''"></div>

    <!-- Search Suggestion Panel Removed -->

    <!-- Shop List -->
    <div class="shop-list-content" @scroll="onScroll" v-loading="isLoading">
       <div v-if="shops.length > 0">
          <div class="shop-box" v-for="s in shops" :key="s.id" @click="toDetail(s.id)">
             <div class="shop-img"><img :src="s.images || '/imgs/default-shop.jpg'" alt=""></div>
             <div class="shop-info">
                <div class="shop-title shop-item" v-html="s.name"></div>
                <div class="shop-rate shop-item">
                   <el-rate disabled :model-value="s.score/10" text-color="#F63" show-score></el-rate>
                   <span>{{s.comments}}条</span>
                </div>
                <div class="shop-area shop-item">
                   <span>{{s.area}}</span>
                   <span v-if="s.distance">{{s.distance < 1000 ? s.distance.toFixed(1) + 'm' : (s.distance/1000).toFixed(1) + 'km'}}</span>
                </div>
                <div class="shop-avg shop-item">￥{{s.avgPrice}}/人</div>
                <div class="shop-address shop-item">
                   <i class="el-icon-map-location"></i>
                   <span>{{s.address || '暂无详细地址'}}</span>
                </div>
             </div>
          </div>
          <div class="no-more" v-if="noMore && !isSearchMode">没有更多了</div>
       </div>
       <div v-else-if="!isLoading && isSearchMode && hasSearched" class="custom-empty-state">
           <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiByeD0iOCIgZmlsbD0iI0Y4RjlGQSIvPgo8cGF0aCBkPSJNNDAgNDJMMzIgMzRMMzQgMzJMNDAgMzhMNDYgMzJMNDggMzRMNDAgNDJaIiBmaWxsPSIjQzBDNEY0Ii8+CjxwYXRoIGQ9Ik00MCA0MkwzMiAzNEwzNCAzMkw0MCAzOEw0NiAzMkw0OCAzNEw0MCA0MloiIGZpbGw9IiNDMEM0RjQiLz4KPC9zdmc+Cg==">
           <p>未找到相关店铺</p>
           <span class="sub-text">换个关键词试试吧</span>
       </div>
       <div v-else-if="!isLoading && !isSearchMode" class="custom-empty-state">
           <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiByeD0iOCIgZmlsbD0iI0Y4RjlGQSIvPgo8cGF0aCBkPSJNNDAgNDJMMzIgMzRMMzQgMzJMNDAgMzhMNDYgMzJMNDggMzRMNDAgNDJaIiBmaWxsPSIjQzBDNEY0Ii8+CjxwYXRoIGQ9Ik00MCA0MkwzMiAzNEwzNCAzMkw0MCAzOEw0NiAzMkw0OCAzNEw0MCA0MloiIGZpbGw9IiNDMEM0RjQiLz4KPC9zdmc+Cg==">
           <p>暂无相关店铺</p>
       </div>
    </div>
    
  </div>
</template>

<script>
import { getShopTypes, getShopList } from '@/api/shop';
import { getHotSearch, getSearchHistory, addSearchHistory, clearSearchHistory, searchShops } from '@/api/search';
import { locationUtil } from '@/utils/location';
import { getCurrentUser } from '@/api/user'; // Need userId for history

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
       
       shops: [],
       isLoading: false,
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
       }
    }
  },
  created() {
     this.typeName = this.$route.query.name || '';
     this.params.typeId = this.$route.query.type || 0;
     
     this.loadTypes();
     this.initLocation();
     this.loadUser();
  },
  methods: {
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
        const token = sessionStorage.getItem("token");
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
           
           // Init selected type from route
           const routeTypeId = parseInt(this.$route.query.type || 0);
           this.selectedTypeId = routeTypeId;
        }).catch(err => {
           console.error("Failed to load shop types", err);
           this.shopTypeList = [{ id: 0, name: '全部分类' }];
        });
     },
     getShopTypeName(id) {
         if(!id) return '全部分类';
         const t = this.shopTypeList.find(i => i.id === id);
         return t ? t.name : '全部分类';
     },
     toggleFilterTab(tab) {
         this.activeFilterTab = this.activeFilterTab === tab ? '' : tab;
     },
     selectShopType(id) {
         this.selectedTypeId = id;
         // Update title
         this.typeName = this.getShopTypeName(id);
         this.activeFilterTab = '';
         this.doSearch();
     },
     selectDistance(d) {
         this.selectedDistance = d.label === '全部' ? null : d.label;
         this.activeFilterTab = '';
         this.doSearch();
     },
     selectScore(s) {
         this.selectedScore = s.label === '全部' ? null : s.label;
         this.activeFilterTab = '';
         this.doSearch();
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
     doSearch() {
         const hasFilters = this.selectedTypeId || this.selectedDistance || this.selectedScore;
         if (!this.searchText.trim() && !hasFilters) return;
         this.isLoading = true;
         this.shops = [];
         this.noMore = false;
         this.hasSearched = true;
         
         
         // History saving removed
         
         
         // Construct filters and params matching Search module (Index.vue)
         const filters = {};
         if (this.selectedTypeId) filters.typeId = this.selectedTypeId;
         
         if (this.selectedScore) {
            const s = this.scoreOptions.find(o => o.label === this.selectedScore);
            if (s) filters.minScore = s.value;
         }
         
         const searchParams = {
             keyword: this.searchText,
             filters,
             page: 1,
             size: 100, 
             lat: this.params.y,
             lon: this.params.x,
             distance: this.selectedDistance 
                       ? (this.distanceOptions.find(o => o.label === this.selectedDistance)?.value || "all") 
                       : "all"
         };
         
         searchShops(searchParams).then(res => {
             let list = [];
             if (Array.isArray(res)) list = res;
             else if (res && Array.isArray(res.list)) list = res.list;
             else if (res && res.data && Array.isArray(res.data.list)) list = res.data.list;
             
             // Process images
             list.forEach(s => {
                 if(s.images) s.images = this.$fileURL + s.images.split(',')[0];
             });
             this.shops = list;
             
             if (this.shops.length === 0) {
                 this.$message.info('暂无相关店铺');
             }
         }).finally(() => {
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
        }
        if (this.isLoading || this.noMore) return;
        
        this.isLoading = true;
        
        getShopList(this.params).then(res => {
           let list = [];
           if (Array.isArray(res)) list = res;
           else if (res && Array.isArray(res.data)) list = res.data;
           else if (res && Array.isArray(res.list)) list = res.list;
           else if (res && res.data && Array.isArray(res.data.records)) list = res.data.records;
           
           if (!list || list.length === 0) {
              this.noMore = true;
           } else {
              list.forEach(s => {
                  if(s.images) s.images = this.$fileURL + s.images.split(',')[0];
              });
              this.shops = this.shops.concat(list);
              this.params.current++;
           }
        }).finally(() => this.isLoading = false);
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
        // If in search mode, maybe no infinite scroll for name search (yet) 
        // as searchShopsByName api is simple list usually.
        if (this.isSearchMode && this.hasSearched) return; 
        
        const { scrollTop, clientHeight, scrollHeight } = e.target;
        if (scrollTop + clientHeight >= scrollHeight - 50) {
           this.queryShops();
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
.header-title { flex: 1; text-align: center; font-size: 18px; font-weight: 500; color: #333; margin-right: 30px; /* Balance back btn */ }

.header-search-input { flex: 1; margin: 0 10px; position: relative; display: flex; align-items: center; }
.header-search-input input { width: 100%; height: 32px; background: #f5f5f5; border: none; border-radius: 16px; padding: 0 30px; font-size: 14px; outline: none; }
.input-icon { position: absolute; left: 10px; color: #999; font-size: 14px; }
.clear-icon { position: absolute; right: 10px; color: #ccc; font-size: 14px; cursor: pointer; }

.header-actions { min-width: 40px; display: flex; justify-content: center; }
.header-search-btn { font-size: 14px; color: #333; cursor: pointer; white-space: nowrap; }
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
.shop-list-content { flex: 1; overflow-y: auto; padding: 8px 10px; }
.shop-box { display: flex; padding: 10px 12px; background-color: #fff; border-radius: 8px; margin-bottom: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
.shop-img { width: 88px; height: 88px; border-radius: 6px; overflow: hidden; margin-right: 12px; flex-shrink: 0; border: 1px solid #f2f2f2; }
.shop-img img { width: 100%; height: 100%; object-fit: cover; }
.shop-info { flex: 1; display: flex; flex-direction: column; justify-content: space-between; padding: 2px 0; }
.shop-item { margin-bottom: 3px; } /* Tighter items */
.shop-title { font-size: 16px; font-weight: bold; color: #333; }
.shop-rate { display: flex; align-items: center; font-size: 12px; color: #666; }
.shop-rate span { margin-left: 5px; }
.shop-area { display: flex; justify-content: space-between; font-size: 12px; color: #999; }
.shop-avg { font-size: 12px; color: #333; }
.shop-address { font-size: 12px; color: #999; display: flex; align-items: center; }
.shop-address i { margin-right: 2px; }

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

/* Filter Dropdown Content */
.filter-content {
  position: absolute;
  top: 100%; /* Relative to filter-wrapper */
  left: 0;
  right: 0;
  background: white;
  max-height: 0;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  border-radius: 0 0 12px 12px;
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
