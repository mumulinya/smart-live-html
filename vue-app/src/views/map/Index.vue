<template>
  <div class="map-page">
    <div class="header">
      <div class="header-back-btn" @click="goBack">
        <i class="el-icon-arrow-left"></i>
      </div>
      <div class="header-title">地图找店</div>
      <div class="header-actions">
         <div class="header-location" @click="reGetLocation"><i class="el-icon-aim"></i></div>
      </div>
    </div>

    <!-- Map Container -->
    <div class="map-wrapper">
       <div class="map-container" id="amap-container"></div>

       <!-- Search Bar Overlay -->
       <div class="search-overlay">
          <div class="search-box">
             <i class="el-icon-search"></i>
             <input v-model="keyword" placeholder="搜索附近商家..." @keyup.enter="doSearch"/>
          </div>
          <div class="filter-btn" @click="showFilters = !showFilters" :class="{active: showFilters}">
             <i class="el-icon-menu"></i>
          </div>
       </div>

       <!-- Category Filter Overlay -->
       <transition name="slide-down">
         <div class="filter-panel" v-if="showFilters">
            <div class="filter-grid">
               <div class="filter-item" 
                    v-for="t in types" 
                    :key="t.id" 
                    :class="{active: currentTypeId === t.id}"
                    @click="selectType(t)">
                  <img :src="'/imgs/' + t.icon" class="filter-icon" />
                  <span>{{t.name}}</span>
               </div>
            </div>
         </div>
       </transition>

       <!-- Shop List Bottom Sheet -->
       <div class="shop-sheet" :class="{ expanded: isSheetExpanded }">
          <div class="sheet-handle" @click="toggleSheet"></div>
          <div class="shop-list" @scroll="onListScroll">
             <div class="empty-tip" v-if="shops.length === 0 && !isLoading">
                附近暂无商家
             </div>
             <div class="shop-card" 
                  v-for="s in shops" 
                  :key="s.id" 
                  @click="focusShop(s)"
                  :class="{ active: currentShopId === s.id }">
                <div class="shop-img">
                   <img :src="s.images || '/imgs/default-shop.jpg'" />
                </div>
                <div class="shop-info">
                   <div class="shop-name">{{s.name}}</div>
                   <div class="shop-meta">
                      <el-rate disabled :model-value="s.score/10" text-color="#F63" :max="5" score-template="{value}"></el-rate>
                      <span class="score-text">{{s.score}}分</span>
                   </div>
                   <div class="shop-extra">
                      <span class="price">￥{{s.avgPrice}}/人</span>
                      <span class="distance" v-if="s.distance">
                        <i class="el-icon-location-outline"></i>
                        {{ formatDistance(s.distance) }}
                      </span>
                   </div>
                </div>
                <div class="nav-btn" @click.stop="toDetail(s.id)">
                   详情
                </div>
             </div>
             <div class="loading-more" v-if="isLoading">
                <i class="el-icon-loading"></i> 加载中...
             </div>
          </div>
       </div>

    </div>
    
    <!-- Footer nav -->
    <div class="footer-container">
      <foot-bar :active-btn="2"></foot-bar>
    </div>
  </div>
</template>

<script>
import FootBar from '@/components/FootBar.vue';
import { locationUtil } from '@/utils/location';
import { getShopTypes, getShopList } from '@/api/shop';

export default {
  name: 'MapIndex',
  components: { FootBar },
  data() {
    return {
       map: null,
       zoom: 15,
       center: [120.149993, 30.334229],
       keyword: '',
       types: [],
       shops: [],
       currentTypeId: null,
       showFilters: false,
       isSheetExpanded: false,
       isLoading: false,
       currentShopId: null,
       markers: [],
       userMarker: null,
       page: 1,
       searchTimer: null,
       isMarkerClick: false,
       suppressSearch: false
    }
  },
  computed: {
     fileURL() {
        return this.$fileURL || ''; // Fallback
     }
  },
  mounted() {
     this.loadTypes();
     this.initMap();
  },
  methods: {
    goBack() {
      this.$router.go(-1);
    },
    toDetail(id) {
       this.$router.push({path: '/shop/detail', query: { id }});
    },
    formatDistance(d) {
       if(!d) return '';
       return d < 1000 ? d.toFixed(0) + 'm' : (d/1000).toFixed(1) + 'km';
    },
    toggleSheet() {
       this.isSheetExpanded = !this.isSheetExpanded;
    },
    selectType(t) {
        this.currentTypeId = t.id;
        this.showFilters = false;
        // Search immediately
        if (this.map) {
            this.doSearch(true);
        }
    },
    loadTypes() {
       getShopTypes().then(res => {
          let data = res;
          if (res && res.data) data = res.data;
          this.types = data || [];
          
          // Default to 'Food' (美食) if no type selected
          if (!this.currentTypeId) {
             const food = this.types.find(t => t.name.includes('美食'));
             if (food) {
                this.currentTypeId = food.id;
                // If map is already ready, refresh search
                if (this.map) this.doSearch(true);
             }
          }
       });
    },
    initMap() {
       const query = this.$route.query;
       // If URL has specific center (from ShopDetail), use it
       if (query.center) {
          const [x, y] = query.center.split(',');
          this.center = [parseFloat(x), parseFloat(y)];
          if (query.shopId) {
             this.currentShopId = parseInt(query.shopId);
          }
          this.renderMap();
       } else {
          // Otherwise auto locate
          locationUtil.getLocation().then(loc => {
             if(loc) this.center = [loc.x, loc.y];
             this.renderMap();
          }).catch(() => {
             this.renderMap();
          });
       }
    },
    reGetLocation() {
       locationUtil.getLocation().then(loc => {
           if(loc) {
               this.center = [loc.x, loc.y];
               this.map.setCenter(this.center);
               this.map.setZoom(16);
               this.updateUserMarker();
               this.doSearch(true);
           }
       });
    },
    renderMap() {
       if(window.AMap) {
          this.map = new window.AMap.Map('amap-container', {
             zoom: this.zoom,
             center: this.center,
             mapStyle: 'amap://styles/whitesmoke',
             zoomEnable: true,
             scrollWheel: true,
             touchZoom: true,
             doubleClickZoom: true,
             resizeEnable: true
          });
          
          // Add controls
          window.AMap.plugin(['AMap.ToolBar', 'AMap.Scale'], () => {
             this.map.addControl(new window.AMap.ToolBar({
                 position: 'RT', // Right Top
                 offset: new window.AMap.Pixel(10, 120)
             }));
             this.map.addControl(new window.AMap.Scale());
          });
          
          this.updateUserMarker();
          
          // Load shops (will use currentTypeId if set by loadTypes)
          this.doSearch();
          
          // Map events
          this.map.on('click', () => {
             if (this.isMarkerClick) {
                 this.isMarkerClick = false;
                 return;
             }
             this.showFilters = false;
             this.currentShopId = null;
             this.renderShopMarkers(); // Reset styles
          });
          
          
          this.map.on('moveend', () => {
             const center = this.map.getCenter();
             this.center = [center.lng, center.lat];
             this.debouncedSearch();
          });
          
          this.map.on('zoomend', () => {
             this.debouncedSearch();
          });
       } else {
          setTimeout(this.renderMap, 500);
       }
    },
    updateUserMarker() {
       if(!this.map) return;
       if(this.userMarker) this.userMarker.setMap(null);
       
       this.userMarker = new window.AMap.Marker({
           position: this.center,
           map: this.map,
           content: '<div class="user-marker-pulse"></div>',
           offset: new window.AMap.Pixel(-10, -10)
       });
    },
    debouncedSearch() {
       if(this.suppressSearch) return;
       if(this.searchTimer) clearTimeout(this.searchTimer);
       this.searchTimer = setTimeout(() => {
          this.doSearch(true);
       }, 500);
    },
    doSearch(reset = true) {
       if(reset) {
          this.page = 1;
          // Don't clear immediately to avoid flash
          // this.shops = [];
       }
       
       this.isLoading = true;
       const params = {
          current: this.page,
          typeId: this.currentTypeId || 0,
          x: this.center[0],
          y: this.center[1],
          sortBy: 'distance' 
       };
       
       getShopList(params).then(res => {
          let list = [];
          if (Array.isArray(res)) list = res;
          else if (res && Array.isArray(res.data)) list = res.data;
          
          list.forEach(s => {
             if(s.images) s.images = (this.fileURL || '') + s.images.split(',')[0];
          });
          
          if (reset) {
              this.shops = list;
          } else {
              this.shops = this.shops.concat(list);
          }
          this.renderShopMarkers();
       }).finally(() => {
          this.isLoading = false;
       });
    },
    renderShopMarkers() {
       if(!this.map) return;
       // Clear old markers
       this.map.remove(this.markers);
       this.markers = [];
       
       this.shops.forEach(shop => {
          if(!shop.x || !shop.y) return;
          
          const isActive = this.currentShopId === shop.id;
          let markerContent = '';
          
          if(isActive) {
             markerContent = `
               <div class="custom-marker active-card">
                  <div class="info-window-card">
                     <div class="info-cover" style="background-image: url('${shop.images || '/imgs/default-shop.jpg'}')"></div>
                     <div class="info-detail">
                        <div class="info-title">${shop.name}</div>
                        <div class="info-score">评分:${shop.score}</div>
                     </div>
                     <div class="info-arrow"><i class="el-icon-arrow-right"></i></div>
                  </div>
                  <div class="marker-triangle"></div>
               </div>
             `;
          } else {
             markerContent = `
               <div class="custom-marker">
                  <div class="marker-dot"></div>
                  <div class="marker-label">${shop.name}</div>
               </div>
             `;
          }
          
          const marker = new window.AMap.Marker({
             position: [shop.x, shop.y],
             content: markerContent,
             offset: isActive ? new window.AMap.Pixel(-100, -80) : new window.AMap.Pixel(-15, -30),
             map: this.map,
             zIndex: isActive ? 999 : 100
          });
          
          marker.on('click', () => {
             this.isMarkerClick = true; // Prevent map click from clearing
             if (this.currentShopId === shop.id) {
                 this.toDetail(shop.id);
             } else {
                 this.focusShop(shop);
             }
          });
          
          this.markers.push(marker);
       });
    },
    focusShop(shop) {
       this.suppressSearch = true; // Lock search
       this.currentShopId = shop.id;
       this.map.setCenter([shop.x, shop.y]);
       this.map.setZoom(16);
       
       // Re-render markers to update active state style
       this.renderShopMarkers();
       
       // Unlock after animation/delay
       setTimeout(() => {
           this.suppressSearch = false;
       }, 1000);
    },
    onListScroll(e) {
       // simple infinite scroll
       const { scrollTop, clientHeight, scrollHeight } = e.target;
       if (scrollHeight - scrollTop - clientHeight < 50 && !this.isLoading) {
           this.page++;
           this.doSearch(false);
       }
    }
  }
}
</script>

<style scoped>
.map-page { position: relative; height: 100vh; display: flex; flex-direction: column; overflow: hidden; }
.header { height: 50px; display: flex; align-items: center; justify-content: space-between; padding: 0 15px; background: white; border-bottom: 1px solid #eee; z-index: 200; position: relative; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
.header-title { font-size: 16px; font-weight: 600; }
.header-location { color: #409EFF; font-size: 18px; cursor: pointer; }

.map-wrapper { flex: 1; position: relative; overflow: hidden; }
.map-container { width: 100%; height: 100%; }
.footer-container { height: 60px; z-index: 200; background: white; }

/* Search Overlay */
.search-overlay {
   position: absolute;
   top: 15px;
   left: 15px;
   right: 15px;
   display: flex;
   gap: 10px;
   z-index: 100;
}
.search-box {
   flex: 1;
   background: white;
   height: 44px;
   border-radius: 8px;
   box-shadow: 0 2px 8px rgba(0,0,0,0.1);
   display: flex;
   align-items: center;
   padding: 0 12px;
}
.search-box i { color: #999; font-size: 16px; margin-right: 8px; }
.search-box input {
   border: none;
   outline: none;
   flex: 1;
   font-size: 14px;
   color: #333;
}
.filter-btn {
   width: 44px;
   height: 44px;
   background: white;
   border-radius: 8px;
   box-shadow: 0 2px 8px rgba(0,0,0,0.1);
   display: flex;
   align-items: center;
   justify-content: center;
   font-size: 20px;
   color: #666;
   cursor: pointer;
   transition: all 0.3s;
}
.filter-btn.active { color: #409EFF; background: #ecf5ff; }

/* Filter Panel */
.filter-panel {
   position: absolute;
   top: 70px;
   left: 0;
   right: 0;
   background: white;
   padding: 15px;
   z-index: 99;
   border-radius: 0 0 15px 15px;
   box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.filter-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
.filter-item { display: flex; flex-direction: column; align-items: center; font-size: 12px; color: #666; cursor: pointer; }
.filter-icon { width: 32px; height: 32px; margin-bottom: 5px; }
.filter-item.active { color: #409EFF; font-weight: 500; }
.filter-item.active .filter-icon { transform: scale(1.1); }

/* Slide Transition */
.slide-down-enter-active, .slide-down-leave-active { transition: all 0.3s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-20px); }

/* Shop Bottom Sheet */
.shop-sheet {
   position: absolute;
   bottom: 10px;
   left: 10px;
   right: 10px;
   height: 180px; /* Collapsed height */
   background: white;
   border-radius: 12px;
   box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
   z-index: 100;
   display: flex;
   flex-direction: column;
   transition: height 0.3s ease;
}
.shop-sheet.expanded { height: 70%; }
.sheet-handle {
   height: 20px;
   display: flex;
   justify-content: center;
   align-items: center;
   cursor: grab;
}
.sheet-handle::after {
   content: '';
   width: 40px;
   height: 4px;
   background: #ddd;
   border-radius: 2px;
}
.shop-list {
   flex: 1;
   overflow-y: auto;
   padding: 0 10px 10px;
}
.empty-tip { text-align: center; color: #999; margin-top: 30px; font-size: 14px; }

/* Shop Card */
.shop-card {
   display: flex;
   padding: 12px;
   border-radius: 8px;
   background: #fff;
   transition: all 0.2s;
   border-bottom: 1px solid #f5f5f5;
   cursor: pointer;
}
.shop-card.active { background: #f0f9eb; }
.shop-img { width: 80px; height: 80px; border-radius: 6px; overflow: hidden; margin-right: 12px; flex-shrink: 0; }
.shop-img img { width: 100%; height: 100%; object-fit: cover; }
.shop-info { flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
.shop-name { font-size: 15px; font-weight: 600; color: #333; margin-bottom: 4px; }
.shop-meta { display: flex; align-items: center; font-size: 12px; }
.score-text { color: #f63; margin-left: 5px; font-weight: bold; }
.shop-extra { display: flex; justify-content: space-between; margin-top: 6px; font-size: 12px; color: #999; }
.nav-btn {
   align-self: center;
   padding: 6px 12px;
   background: #409EFF;
   color: white;
   font-size: 12px;
   border-radius: 15px;
   margin-left: 10px;
   cursor: pointer;
}

/* Markers */
:deep(.user-marker-pulse) {
   width: 20px;
   height: 20px;
   background: #409EFF;
   border-radius: 50%;
   border: 3px solid white;
   box-shadow: 0 0 10px rgba(64,158,255,0.5);
   animation: pulse 2s infinite;
}
@keyframes pulse {
   0% { box-shadow: 0 0 0 0 rgba(64,158,255,0.4); }
   70% { box-shadow: 0 0 0 15px rgba(64,158,255,0); }
   100% { box-shadow: 0 0 0 0 rgba(64,158,255,0); }
}

:deep(.custom-marker) {
   display: flex;
   flex-direction: column;
   align-items: center;
   transform: translate(0, 0);
   transition: all 0.3s;
}
:deep(.custom-marker.active) { transform: scale(1.1) translateY(-5px); z-index: 999; }
:deep(.marker-dot) {
   width: 12px;
   height: 12px;
   background: #F56C6C;
   border: 2px solid white;
   border-radius: 50%;
   box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}
:deep(.custom-marker.active .marker-dot) { background: #409EFF; width: 16px; height: 16px; }
:deep(.marker-label) {
   background: white;
   padding: 2px 6px;
   border-radius: 4px;
   box-shadow: 0 1px 3px rgba(0,0,0,0.2);
   font-size: 10px;
   margin-top: 4px;
   white-space: nowrap;
   color: #333;
}
:deep(.custom-marker.active-card) { transform: none; display: flex; flex-direction: column; align-items: center; }
:deep(.info-window-card) {
   width: 200px;
   height: 60px;
   background: white;
   border-radius: 6px;
   box-shadow: 0 2px 10px rgba(0,0,0,0.2);
   display: flex;
   align-items: center;
   padding: 5px;
   position: relative;
}
:deep(.info-cover) { width: 50px; height: 50px; background-size: cover; background-position: center; border-radius: 4px; flex-shrink: 0; }
:deep(.info-detail) { flex: 1; padding: 0 8px; display: flex; flex-direction: column; justify-content: center; overflow: hidden; }
:deep(.info-title) { font-size: 14px; font-weight: bold; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
:deep(.info-score) { font-size: 11px; color: #F63; margin-top: 2px; }
:deep(.info-arrow) { color: #ccc; font-size: 14px; }
:deep(.marker-triangle) {
   width: 0; 
   height: 0; 
   border-left: 8px solid transparent;
   border-right: 8px solid transparent;
   border-top: 8px solid white;
   margin-top: -1px;
}
</style>
