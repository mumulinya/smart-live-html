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
          <div class="shop-card" v-for="s in shops" :key="s.id" @click="toDetail(s.id)">
              <!-- Image with Fallback -->
              <div class="shop-card-img">
                  <img :src="s.images" v-if="s.images && !s.imageError" @error="s.imageError = true" alt="">
                  <div class="img-placeholder" v-else>
                      <i class="el-icon-goods"></i>
                  </div>
              </div>
              <!-- Info -->
              <div class="shop-card-info">
                 <!-- Row 1: Title -->
                 <div class="shop-card-title" v-html="s.name"></div>
                 <!-- Row 2: Rating + Price -->
                 <div class="shop-card-stats">
                    <el-rate disabled :model-value="s.score/10" text-color="#F63" :size="12"></el-rate>
                    <span class="stats-score">{{(s.score/10).toFixed(1)}}</span>
                    <span class="stats-comments">{{s.comments || 0}}条</span>
                    <span class="stats-price" v-if="s.avgPrice">￥{{s.avgPrice}}/人</span>
                 </div>
                 <!-- Row 3: Location + Distance -->
                 <div class="shop-card-location">
                    <span class="location-text">{{s.area || '未知区域'}} <span v-if="getShopTypeName(s.typeId)">| {{getShopTypeName(s.typeId)}}</span></span>
                    <span class="location-distance" v-if="s.distance">{{s.distance < 1000 ? s.distance.toFixed(0) + 'm' : (s.distance/1000).toFixed(1) + 'km'}}</span>
                 </div>
                 <!-- Row 4: Tags -->
                 <div class="shop-card-tags">
                    <span class="tag">可预约</span>
                    <span class="tag">有停车位</span>
                 </div>
              </div>
           </div>
          <div class="no-more" v-if="noMore && !isSearchMode">没有更多了</div>
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
    </div>
    
  </div>
</template>

<script>
import { getShopTypes } from '@/api/shop';
import { searchShops } from '@/api/search';
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
     this.params.typeId = parseInt(this.$route.query.type || 0);
     this.selectedTypeId = this.params.typeId; // 同步选中状态

     // Restore filters from Route
     if (this.$route.query.distance) {
         this.selectedDistance = this.$route.query.distance;
     }
     if (this.$route.query.score) {
         this.selectedScore = this.$route.query.score;
     }

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
         this.updateRouteQuery();
         this.doSearch();
     },
     selectDistance(d) {
         this.selectedDistance = d.label === '全部' ? null : d.label;
         this.activeFilterTab = '';
         this.updateRouteQuery();
         this.doSearch();
     },
     selectScore(s) {
         this.selectedScore = s.label === '全部' ? null : s.label;
         this.activeFilterTab = '';
         this.updateRouteQuery();
         this.doSearch();
     },
     updateRouteQuery() {
        // Remove 'name' from query as we rely on typeId to determine title
        // Or update it to match current selection
        const query = {
            ...this.$route.query,
            type: this.selectedTypeId || undefined,
            distance: this.selectedDistance || undefined,
            score: this.selectedScore || undefined
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
        
        // Construct payload for searchShops
        const filters = {};
        if (this.params.typeId) filters.typeId = this.params.typeId;
        
        const searchPayload = {
           keyword: '', // Empty for default list
           filters,
           page: this.params.current,
           size: 10,
           lat: this.params.y,
           lon: this.params.x,
           distance: "all" // Default distance scope
        };

        searchShops(searchPayload).then(res => {
           let list = [];
           if (Array.isArray(res)) list = res;
           else if (res && Array.isArray(res.list)) list = res.list;
           else if (res && res.data && Array.isArray(res.data.list)) list = res.data.list;
           else if (res && Array.isArray(res.data)) list = res.data;
           
           if (!list || list.length === 0) {
              this.noMore = true;
           } else {
              list.forEach(s => {
                  if(s.images) s.images = (this.$fileURL || '') + s.images.split(',')[0];
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
.shop-list-content { flex: 1; overflow-y: auto; padding: 0; background: #f5f5f5; }

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
