<template>
  <div class="home-container">
    <div class="loading-mask" :class="{ hidden: !isLoading }">
      <div class="loading-spinner"></div>
      <div class="loading-text">正在加载首页数据</div>
      <div class="loading-subtext">请稍候...</div>
    </div>

    <div class="location-status" v-if="showLocationStatus">
      <div class="status-icon">
         <i class="el-icon-loading" v-if="locationLoading"></i>
         <i class="el-icon-check" v-else-if="locationSuccess" style="color: #67C23A"></i>
         <i class="el-icon-warning" v-else-if="locationError" style="color: #F56C6C"></i>
      </div>
      <div class="status-text">{{ locationStatusText }}</div>
    </div>

    <div class="search-bar">
      <div class="city-btn" @click="showLocationModal = true">
        <i class="el-icon-location" style="margin-right: 5px;"></i>
        {{ currentCity || '定位中...' }}
      </div>
      <div class="search-input" @click="toSearchPage">
        <i class="el-icon-search"></i>
        <span>请输入商户名、地点</span>
      </div>
      <div class="header-icon" @click="toPage(5)"><img src="@/assets/ai-avatar.jpg" alt="" style="width: 38px;
      height: 38px;
      box-shadow: 0 0 3px 2px rgba(0, 0, 0, 0.1);
      border-radius: 50%;"></div>
    </div>

    <div class="type-list">
      <div class="type-box" v-for="t in types" :key="t.id" @click="toShopList(t.id, t.name)">
        <div class="type-view"><img :src="'/imgs/' + t.icon" alt=""></div>
        <div class="type-text">{{t.name}}</div>
      </div>
    </div>

    <!-- Van Tabs with Swipeable -->
    <van-tabs v-model:active="activeCategory" swipeable animated sticky offset-top="50px" color="#ff6633" title-active-color="#ff6633" :ellipsis="false" @change="onTabChange">
        <!-- Follow Tab (First) -->
        <van-tab title="关注" name="follow" v-if="token">
            <div class="blog-list-content" @scroll="onScroll">
               <div class="empty-state" v-if="followBlogs.length === 0 && !isLoading">
                 <div class="empty-icon"><i class="el-icon-user"></i></div>
                 <p>暂无关注动态</p>
                 <p style="font-size: 12px; color: #c0c4cc;">关注更多用户，查看他们的最新动态</p>
               </div>

               <div class="waterfall-container">
                 <div class="blog-box" v-for="(b, index) in followBlogs" :key="'follow-'+index">
                   <div class="blog-img" @click="toBlogDetail(b)">
                     <img v-show="!b.imgError" :src="b.img" :alt="b.title" @error="handleImageError($event, b)" @load="handleImageLoad($event, b)">
                     <div class="img-placeholder" v-if="b.imgError">图片加载失败</div>
                   </div>
                   <div class="blog-content">
                     <div class="blog-title">{{b.title || '无标题'}}</div>
                     <div class="blog-foot">
                       <div class="blog-user-icon">
                         <img :src="b.icon || '/imgs/icons/default-icon.png'" alt="用户头像" @error="handleAvatarError($event)">
                       </div>
                       <div class="blog-user-name">{{b.name || '匿名用户'}}</div>
                       <div class="blog-liked" @click.stop="addLike(b)">
                         <svg viewBox="0 0 24 24" width="14" height="14">
                           <path :fill="b.isLike ? '#ff2442' : '#999'" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                         </svg>
                         {{b.liked || 0}}
                       </div>
                     </div>
                   </div>
                 </div>
               </div>

               <div class="scroll-tip" v-if="followBlogs.length > 0">
                 <i class="el-icon-loading" v-if="isLoading"></i>
                 <span v-if="isLoading">加载中...</span>
                 <span v-else-if="noMoreFollowData">已加载全部动态</span>
               </div>
            </div>
        </van-tab>
        
        <!-- Hot Tab -->
        <van-tab title="热门" name="hot">
            <div class="blog-list-content" @scroll="onScroll">
               <div class="empty-state" v-if="blogs.length === 0 && !isLoading">
                 <div class="empty-icon"><i class="el-icon-document-remove"></i></div>
                 <p>暂无博客内容</p>
                 <p style="font-size: 12px; color: #c0c4cc;">快去发布第一篇博客吧</p>
               </div>

               <div class="waterfall-container">
                 <div class="blog-box" v-for="(b, index) in blogs" :key="index">
                   <div class="blog-img" @click="toBlogDetail(b)">
                     <img v-show="!b.imgError" :src="b.img" :alt="b.title" @error="handleImageError($event, b)" @load="handleImageLoad($event, b)">
                     <div class="img-placeholder" v-if="b.imgError">图片加载失败</div>
                   </div>
                   <div class="blog-content">
                     <div class="blog-title">{{b.title || '无标题'}}</div>
                     <div class="blog-foot">
                       <div class="blog-user-icon">
                         <img :src="b.icon || '/imgs/icons/default-icon.png'" alt="用户头像" @error="handleAvatarError($event)">
                       </div>
                       <div class="blog-user-name">{{b.name || '匿名用户'}}</div>
                       <div class="blog-liked" @click.stop="addLike(b)">
                         <svg viewBox="0 0 24 24" width="14" height="14">
                           <path :fill="b.isLike ? '#ff2442' : '#999'" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                         </svg>
                         {{b.liked || 0}}
                       </div>
                     </div>
                   </div>
                 </div>
               </div>

               <div class="scroll-tip" v-if="blogs.length > 0">
                 <i class="el-icon-loading" v-if="isLoading"></i>
                 <span v-if="isLoading">加载中...</span>
                 <span v-else-if="noMoreData">已加载全部数据</span>
               </div>
            </div>
        </van-tab>
        
        <!-- Dynamic Category Tabs -->
        <van-tab v-for="cat in categories" :key="cat.id" :title="cat.name" :name="cat.id">
            <div class="blog-list-content" @scroll="onScroll">
               <div class="empty-state" v-if="blogs.length === 0 && !isLoading">
                 <div class="empty-icon"><i class="el-icon-document-remove"></i></div>
                 <p>暂无博客内容</p>
               </div>

               <div class="waterfall-container">
                 <div class="blog-box" v-for="(b, index) in blogs" :key="index">
                   <div class="blog-img" @click="toBlogDetail(b)">
                     <img v-show="!b.imgError" :src="b.img" :alt="b.title" @error="handleImageError($event, b)" @load="handleImageLoad($event, b)">
                     <div class="img-placeholder" v-if="b.imgError">图片加载失败</div>
                   </div>
                   <div class="blog-content">
                     <div class="blog-title">{{b.title || '无标题'}}</div>
                     <div class="blog-foot">
                       <div class="blog-user-icon">
                         <img :src="b.icon || '/imgs/icons/default-icon.png'" alt="用户头像" @error="handleAvatarError($event)">
                       </div>
                       <div class="blog-user-name">{{b.name || '匿名用户'}}</div>
                       <div class="blog-liked" @click.stop="addLike(b)">
                         <svg viewBox="0 0 24 24" width="14" height="14">
                           <path :fill="b.isLike ? '#ff2442' : '#999'" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                         </svg>
                         {{b.liked || 0}}
                       </div>
                     </div>
                   </div>
                 </div>
               </div>

               <div class="scroll-tip" v-if="blogs.length > 0">
                 <i class="el-icon-loading" v-if="isLoading"></i>
                 <span v-if="isLoading">加载中...</span>
                 <span v-else-if="noMoreData">已加载全部数据</span>
               </div>
            </div>
        </van-tab>
        
        <!-- Dropdown Button in nav-left slot -->
        <template #nav-left>
            <div class="nav-drop-btn nav-left" @click="showMoreCategories = !showMoreCategories">
                <i class="el-icon-arrow-down" :class="{ rotate: showMoreCategories }"></i>
            </div>
        </template>
    </van-tabs>
    
    <!-- Dropdown Content (outside tabs, but overlays) -->
    <div class="home-dropdown-content" v-if="showMoreCategories" :style="{ zIndex: 2002 }">
        <div class="category-grid">
          <div class="grid-item" v-if="token" :class="{ active: activeCategory === 'follow' }" @click="selectCategoryFromModal('follow')">关注</div>
          <div class="grid-item" :class="{ active: activeCategory === 'hot' }" @click="selectCategoryFromModal('hot')">热门</div>
          <div
                  class="grid-item"
                  v-for="c in categories"
                  :key="c.id"
                  :class="{ active: activeCategory === c.id }"
                  @click="selectCategoryFromModal(c.id)"
          >
            {{ c.name }}
          </div>
        </div>
    </div>
    
    <!-- Mask -->
    <div class="home-dropdown-mask" v-if="showMoreCategories" @click="showMoreCategories = false"></div>

    <!-- Category Modal Removed (Replaced by Dropdown) -->

    <!-- Location Selection Modal -->
    <div class="all-categories-modal" v-if="showLocationModal" @click.self="showLocationModal = false">
      <div class="modal-content location-modal">
        <div class="modal-header">
          <span>选择位置</span>
          <i class="el-icon-close" @click="showLocationModal = false"></i>
        </div>
        <div class="location-actions">
           <div class="current-location-btn" @click="reGetLocation">
              <i class="el-icon-aim"></i> 点击重新定位
           </div>
        </div>
        <div class="city-list-title">热门城市</div>
        <div class="city-grid">
           <div class="city-item" v-for="city in hotCities" :key="city" @click="selectCity(city)">{{city}}</div>
        </div>
      </div>
    </div>

    <div class="footer-container">
      <foot-bar :active-btn="1"></foot-bar>
    </div>
  </div>
</template>

<script>
import { locationUtil } from '@/utils/location';
// import request, { fileURL, util } from '@/utils/request';
import { getShopTypes } from '@/api/shop';
import { getHotBlogs, getBlogsByCategory, getFollowedFeeds } from '@/api/blog';
import { likeBlog } from '@/api/interaction';
import FootBar from '@/components/FootBar.vue';

export default {
  name: 'HomeIndex',
  components: {
    FootBar
  },
  data() {
    return {
      isReachBottom: false,
      types: [],
      blogs: [],
      current: 1,
      isLoading: false,
      noMoreData: false,
      followBlogs: [],
      followParams: {
        offset: 0,
        minTime: 0
      },
      noMoreFollowData: false,
      categories: [],
      activeCategory: 'follow',
      locationLoading: false,
      locationError: false,
      locationSuccess: false,
      usingCachedLocation: false,
      showLocationStatus: false,
      currentCity: '杭州',
      userLocation: {
        x: 120.149993,
        y: 30.334229,
        region: {}
      },
      isRequesting: false,
      pageLoading: true,
      dataLoadedCount: 0,
      totalDataToLoad: 3,
      isActiveLocation: false,
      token: localStorage.getItem("token") || '',
      showMoreCategories: false,
      showLocationModal: false,
      hotCities: ['杭州','上海','北京','深圳','广州','成都','南京','武汉','西安'],
      cityCoordinates: {
        '杭州': { x: 120.15507, y: 30.274085 },
        '上海': { x: 121.473701, y: 31.230416 },
        '北京': { x: 116.407526, y: 39.90403 },
        '深圳': { x: 114.057868, y: 22.543099 },
        '广州': { x: 113.264434, y: 23.129162 },
        '成都': { x: 104.066541, y: 30.572269 },
        '南京': { x: 118.796877, y: 32.060255 },
        '武汉': { x: 114.305393, y: 30.593099 },
        '西安': { x: 108.93984, y: 34.34127 }
      },
      locationStatusText: '',
      
      // Swipe logic
      startX: 0,
      startY: 0,
       isSwiping: false,
      swipeThreshold: 80,
      maxVerticalTravel: 50,
    }
  },
  computed: {
    visibleCategories() {
      return this.categories;
    }
  },
  created() {
    this.queryTypes();
    this.initLocation();
    
    // Restore active tab from session storage
    let savedCategory = sessionStorage.getItem('home_active_category');
    
    // Safety check: if saved as 'follow' but no token, switch to hot
    if (savedCategory === 'follow' && !this.token) {
        savedCategory = 'hot';
    }

    if (savedCategory) {
      // Small delay to ensure tabs are mounted if needed, though activeCategory binding should handle it
      this.activeCategory = savedCategory;
      if (savedCategory === 'follow') {
        this.queryFollowedFeeds();
      } else if (savedCategory === 'hot') {
        this.queryHotBlogsScroll();
      } else {
        this.queryBlogsByCategory(savedCategory);
      }
    } else {
      // Default to follow if logged in, else hot
      this.activeCategory = this.token ? 'follow' : 'hot';
      if (this.activeCategory === 'follow') {
        this.queryFollowedFeeds(); 
      } else {
        this.queryHotBlogsScroll();
      }
    }
  },

  methods: {
    toSearchPage() {
      this.$router.push("/search");
    },
    toPage(i) {
       // Only for AI assistant now (i=5)
       if(i===5) {
         this.$router.push("/ai");
       }
    },
    toShopList(id, name) {
      this.$router.push({
        path: '/shop/list',
        query: { type: id, name: name }
      });
    },
    toBlogDetail(b) {
      this.$router.push({
        path: '/blog/detail',
        query: { id: b.id }
      });
    },
    handleImageError(event, blog) {
      blog.imgError = true;
      // event.target.style.display = 'none'; // Vue way: usign v-if in template
    },
    handleImageLoad(event, blog) {
      blog.imgError = false;
    },
    handleAvatarError(event) {
      event.target.src = '/imgs/icons/default-icon.png';
    },
    // ... API methods
    queryTypes() {
      getShopTypes().then(res => {
         // Fix: Handle wrapped response
         let data = res;
         if (res && res.data) data = res.data;
         else if (res && Array.isArray(res)) data = res;
         
         this.types = data || [];
         this.categories = this.generateCategoriesFromTypes(this.types);
         this.onDataLoaded();
      }).catch(err => {
         console.error(err);
         this.onDataLoaded();
      });
    },
    generateCategoriesFromTypes(types) {
      const categories = [];
      if (types && types.length > 0) {
        types.forEach(type => {
          categories.push({
            id: type.id.toString(),
            name: type.name
          });
        });
      }
      return categories;
    },
    queryHotBlogsScroll() {
       this.queryBlogsByCategory('hot');
    },
    queryBlogsByCategory(categoryId) {
        if (this.isLoading && this.current > 1) return; // Allow first load
        if (this.isRequesting) return;

        this.isLoading = true;
        this.isRequesting = true;
        
        const apiCall = categoryId === 'hot' ? getHotBlogs({ current: this.current }) : getBlogsByCategory(categoryId, this.current);
        
        apiCall
          .then((res) => {
             // Handle paginated or list response
             let list = [];
             if (Array.isArray(res)) {
                list = res;
             } else if (res && Array.isArray(res.records)) {
                list = res.records;
             } else if (res && Array.isArray(res.data)) {
                 // In case it's nested
                 list = res.data;
             }
             
            if (!list || list.length === 0) {
              this.noMoreData = true;
            } else {
               list.forEach(b => {
                b.img = b.images ? (this.$fileURL + b.images.split(",")[0]) : '';
                b.icon = b.icon ? (this.$fileURL + b.icon) : '';
                // If no image URL, set error true immediately so placeholder shows
                b.imgError = !b.img;
                
               if (!b.liked) b.liked = 0; // Ensure liked count exists
              });
              this.blogs = this.blogs.concat(list);
              this.current++;
            }
          })
          .catch(err => {
            console.error('博客请求错误:', err);
          })
          .finally(() => {
            this.isLoading = false;
            this.isReachBottom = false;
            this.isRequesting = false;
            this.onDataLoaded();
          });
    },
    queryFollowedFeeds() {
        if (this.isLoading && this.followParams.offset > 0) return;
        if (this.isRequesting) return;

        this.isLoading = true;
        this.isRequesting = true;
        
        // Use time/offset based pagination for feeds
        const lastId = this.followParams.minTime || new Date().getTime();
        getFollowedFeeds({ offset: this.followParams.offset, lastId })
          .then((res) => {
             // Handle response structure (data vs records vs direct list)
             const data = res.data || res || {};
             let list = [];
             
             if (Array.isArray(data)) {
                 list = data;
             } else if (Array.isArray(data.list)) {
                 list = data.list;
             } else if (Array.isArray(data.records)) {
                 list = data.records;
             }
             
            if (!list || list.length === 0) {
              this.noMoreFollowData = true;
            } else {
               list.forEach(b => {
                // Handle images (string or array)
                let firstImg = '';
                if (b.images) {
                    if (Array.isArray(b.images)) {
                        firstImg = b.images[0];
                    } else if (typeof b.images === 'string') {
                        firstImg = b.images.split(",")[0];
                    }
                }
                
                // Process image URL (add prefix if not full url)
                if (firstImg && !firstImg.startsWith('http')) {
                    b.img = this.$fileURL + firstImg;
                } else {
                    b.img = firstImg || '';
                }

                // Handle icon
                if (b.icon && !b.icon.startsWith('http')) {
                    b.icon = this.$fileURL + b.icon;
                }

                b.imgError = !b.img;
                if (!b.liked) b.liked = 0;
              });
              this.followBlogs = this.followBlogs.concat(list);
              
              // precise updating for next scroll
              this.followParams.minTime = data.minTime || new Date().getTime();
              this.followParams.offset = data.offset || 0;
            }
          })
          .catch(err => {
            console.error('关注动态请求错误:', err);
          })
          .finally(() => {
            this.isLoading = false;
            this.isRequesting = false;
            this.onDataLoaded();
          });
    },
      onDataLoaded() {
         this.dataLoadedCount++;
         if (this.dataLoadedCount >= this.totalDataToLoad) {
           setTimeout(() => {
             this.pageLoading = false;
           }, 500);
         }
       },
       initLocation() {
         // Initial silent location
         locationUtil.getLocation().then(loc => {
            this.updateLocationState(loc);
         }).catch(err => {
            console.error(err);
            this.currentCity = '杭州';
         });
       },
       updateLocationState(loc) {
            this.userLocation = loc;
            if(loc.region && loc.region.city) {
               this.currentCity = typeof loc.region.city === 'string' ? loc.region.city : loc.region.province;
               // Clean up city name (remove '市')
               this.currentCity = this.currentCity.replace('市','');
            } else if (loc.region && loc.region.province) {
               this.currentCity = loc.region.province.replace('省','').replace('市','');
            }
       },
       switchCategory(categoryId) {
         if (this.activeCategory === categoryId) return;
 
         this.activeCategory = categoryId;
         sessionStorage.setItem('home_active_category', categoryId);
         
         if (categoryId === 'follow') {
           this.followBlogs = [];
           this.followParams = { offset: 0, minTime: 0 };
           this.noMoreFollowData = false;
           this.queryFollowedFeeds();
         } else if (categoryId === 'hot') {
           this.blogs = [];
           this.current = 1;
           this.noMoreData = false;
           this.queryHotBlogsScroll();
         } else {
           this.blogs = [];
           this.current = 1;
           this.noMoreData = false;
           this.queryBlogsByCategory(categoryId);
         }
       },
       onTabChange(name) {
         sessionStorage.setItem('home_active_category', name);
         // Force reload data for new category (van-tabs already updated v-model)
         if (name === 'follow') {
           this.followBlogs = [];
           this.followParams = { offset: 0, minTime: 0 };
           this.noMoreFollowData = false;
           this.queryFollowedFeeds();
        } else if (name === 'hot') {
          this.blogs = [];
          this.current = 1;
          this.noMoreData = false;
          this.queryHotBlogsScroll();
        } else {
          this.blogs = [];
          this.current = 1;
          this.noMoreData = false;
          this.queryBlogsByCategory(name);
        }
      },
      selectCategoryFromModal(categoryId) {
        this.showMoreCategories = false;
        this.switchCategory(categoryId);
      },
      onScroll(e) {
         // Infinite scroll logic
         const { scrollTop, scrollHeight, clientHeight } = e.target;
         if (scrollHeight - scrollTop - clientHeight < 50 && !this.isLoading) {
             if (this.activeCategory === 'follow') {
               if (!this.noMoreFollowData) this.queryFollowedFeeds();
             } else if (this.activeCategory === 'hot') {
               if (!this.noMoreData) this.queryHotBlogsScroll();
             } else {
               if (!this.noMoreData) this.queryBlogsByCategory(this.activeCategory);
             }
         }
      },
      addLike(b) {
         if (!this.token) {
            this.$router.push('/user/login');
            return;
         }
         
         const originalLike = b.isLike;
         const originalCount = b.liked;
         
         // Optimistic
         b.isLike = !b.isLike;
         b.liked = b.isLike ? (b.liked + 1) : (b.liked - 1);
         
         likeBlog({ sourceType: 3, sourceId: b.id }).catch(() => {
            // Revert
            b.isLike = originalLike;
            b.liked = originalCount;
            this.$message.error('操作失败');
         });
      },
      reGetLocation() {
         this.showLocationModal = false;
         this.showLocationStatus = true;
         this.locationLoading = true;
         this.locationSuccess = false;
         this.locationError = false;
         this.locationStatusText = "正在定位...";
         
         locationUtil.getLocation(true).then(loc => {
           this.updateLocationState(loc);
           this.locationSuccess = true;
           
           // Explicitly ensure it's saved (redundant but safe)
           locationUtil.saveLocation(loc);
           
           this.locationStatusText = "定位成功：" + this.currentCity;
           setTimeout(() => this.showLocationStatus = false, 1500);
         }).catch(err => {
           this.locationError = true;
           this.locationStatusText = "定位失败，请手动选择";
           setTimeout(() => {
              this.showLocationStatus = false;
              this.showLocationModal = true; // Re-open modal on fail
           }, 1500);
         }).finally(() => {
            this.locationLoading = false;
         });
      },
      selectCity(city) {
         this.showLocationModal = false;
         
         // Fix: Persist manual selection
         // Use mocked coordinates or default to Hangzhou if missing
         const coords = this.cityCoordinates[city] || { x: 120.15507, y: 30.274085 };
         
         const newLoc = {
            x: coords.x,
            y: coords.y,
            region: {
              province: city + '市', // Simple approximation
              city: city + '市',
              district: '',
              township: '',
              fullAddress: city
            }
         };
         
         locationUtil.saveLocation(newLoc);
         this.updateLocationState(newLoc);
         
         // Use centered overlay instead of $message
         this.locationSuccess = true;
         this.locationError = false;
         this.locationStatusText = "已切换到 " + city;
         this.showLocationStatus = true;
         setTimeout(() => {
            this.showLocationStatus = false;
         }, 1500);
      },
      handleTouchStart(){},
      handleTouchMove(){},
      handleTouchEnd(){}
  }
}
</script>

<style scoped>
.el-input__inner {
  border-radius: 20px;
}
/* Header Styles */
.search-bar {
  background: linear-gradient(90deg, #ff9c00, #f63);
  padding: 10px 15px;
  display: flex;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
  height: 50px;
}
.city-btn {
  color: white;
  font-size: 14px;
  font-weight: 500;
  margin-right: 15px;
  display: flex;
  align-items: center;
  cursor: pointer;
}
.search-input {
  flex: 1;
  background: white;
  height: 32px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  padding: 0 10px;
  font-size: 13px;
  color: #999;
  cursor: pointer;
}
.search-input i {
  margin-right: 6px;
  font-size: 14px;
  color: #999;
}
.header-icon {
  margin-left: 15px;
  display: flex;
  align-items: center;
}
/* Extracted from index.html CSS */
.category-nav {
  display: flex;
  align-items: center;
  padding: 12px 0;
  background: white;
  border-bottom: 1px solid #f0f0f0;
  position: relative;
}

.category-tabs {
  display: flex;
  overflow-x: auto;
  flex: 1;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  margin-right: 0;
  padding: 0 5px 0 15px;
  scroll-behavior: smooth;
}

.category-tabs::-webkit-scrollbar {
  display: none;
}

.category-tab {
  flex-shrink: 0;
  padding: 8px 12px;
  margin-right: 15px;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  border: none;
  background: none;
}

.category-tab:last-child {
  margin-right: 0;
}

.category-tab.active {
  color: #409EFF;
  font-weight: 500;
  font-size: 15px;
}

.category-tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 2px;
  background: #409EFF;
  border-radius: 1px;
}

.category-more-btn {
  flex-shrink: 0;
  width: 40px;
  height: 100%;
  padding: 0 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #666;
  font-size: 16px;
  border-left: 1px solid #f0f0f0;
  box-shadow: -5px 0 8px -5px rgba(0, 0, 0, 0.1);
  position: sticky;
  right: 0;
  background: white;
  z-index: 10;
}

/* Dropdown Styling */
.category-nav {
  position: relative; /* Ensure dropdown is relative to nav */
}

.home-dropdown-content {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  padding: 10px;
  z-index: 2002;
  border-top: 1px solid #f0f0f0;
}

.home-dropdown-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 2000;
}

.el-icon-arrow-down.rotate {
    transform: rotate(180deg);
    transition: transform 0.3s;
}

/* Modal styles removed/replaced above */
/* Recycled .category-grid and .grid-item styles match Shop List now */

.category-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  max-height: 300px;
  overflow-y: auto;
}

.modal-header i {
  cursor: pointer;
  font-size: 18px;
  color: #999;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  overflow-y: auto;
  max-height: calc(100% - 40px);
}

.grid-item {
  text-align: center;
  padding: 8px 0;
  background: #f5f5f5;
  border-radius: 4px;
  font-size: 12px;
  color: #333;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.grid-item.active {
  background: #fff0eb;
  color: #F63;
}

/* Blog List Content (Inside van-tab) */
.blog-list-content {
  height: calc(100vh - 200px); /* Adjust based on header + type-list + tabs */
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 10px 70px;
  background: #f5f5f5;
}

/* Category More Button in nav-left slot */
.nav-drop-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  cursor: pointer;
  color: #666;
  font-size: 14px;
  position: relative;
  z-index: 10;
}
.nav-drop-btn.nav-left {
  box-shadow: 6px 0 10px 2px rgba(255,255,255,1);
}
.nav-drop-btn i {
  transition: transform 0.3s;
}
.nav-drop-btn i.rotate {
  transform: rotate(180deg);
}

/* Dropdown Content (Positioned below tabs) */
.home-dropdown-content {
  position: fixed;
  top: 156px; /* Below tabs */
  left: 0;
  right: 0;
  background: white;
  padding: 10px;
  z-index: 2002;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.blog-list {
  height: calc(100vh - 240px);
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 10px 70px;
  margin-bottom: 0;
}

.waterfall-container {
  column-count: 2;
  column-gap: 10px;
}

.blog-box {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); /* Revert to user preferred shadow or keep consistent */
  display: flex;
  flex-direction: column;
  height: auto;
  break-inside: avoid; /* Prevent column break */
  margin-bottom: 10px; /* Space between items in column */
}

.blog-img {
  width: 100%;
  height: auto; /* Variable height */
  overflow: hidden;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.blog-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.img-placeholder {
  width: 100%;
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
  font-size: 14px;
  background: #f5f5f5;
}

.blog-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 6px 10px 8px;
}

.blog-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  line-height: 1.4;
  margin-bottom: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.blog-foot {
  display: flex;
  align-items: center;
  margin-top: auto;
}

.blog-user-icon {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 5px;
  background: #f0f0f0;
}

.blog-user-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.blog-user-name {
  font-size: 11px;
  color: #666;
  flex: 1;
}

.blog-liked {
  display: flex;
  align-items: center;
  font-size: 11px;
  color: #909399;
  cursor: pointer;
}

.scroll-tip {
  text-align: center;
  padding: 12px 0;
  color: #909399;
  font-size: 12px;
  grid-column: 1 / -1;
}

.loading-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.95);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  transition: opacity 0.3s ease;
}

.loading-mask.hidden {
  opacity: 0;
  pointer-events: none;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #409EFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

.loading-text {
  font-size: 16px;
  color: #666;
  text-align: center;
}

.loading-subtext {
  font-size: 14px;
  color: #999;
  margin-top: 8px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.location-status {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0,0,0,0.7);
  color: white;
  border-radius: 8px;
  padding: 20px 30px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 160px;
}

.status-icon { font-size: 32px; margin-bottom: 10px; }
.status-text { font-size: 16px; }

/* Location Modal specific */
.all-categories-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  background: white;
  width: 80%;
  max-width: 400px;
  border-radius: 12px;
  padding: 20px;
  max-height: 70vh;
  overflow-y: auto;
  position: relative;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  font-size: 16px;
  font-weight: bold;
}

.location-modal { height: auto !important; max-height: 80vh !important; }
.location-actions { padding: 10px 0; border-bottom: 1px solid #f5f5f5; margin-bottom: 15px; }
.current-location-btn { 
   color: #409EFF; font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center;
   padding: 10px; background: #ecf5ff; border-radius: 4px;
}
.current-location-btn i { margin-right: 6px; font-size: 18px; }
.city-list-title { font-size: 14px; color: #999; margin-bottom: 10px; }
.city-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.city-item { 
   text-align: center; padding: 10px 0; background: #f8f8f8; border-radius: 4px; font-size: 14px; color: #333; cursor: pointer;
}
.city-item:active { background: #e0e0e0; }

.footer-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: white;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  height: 60px;
}

.home-container {
  min-height: 100vh;
  padding-bottom: 60px;
  position: relative;
  background: #f8f9fa;
}

@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .home-container {
    padding-bottom: calc(60px + env(safe-area-inset-bottom));
  }

  .footer-container {
    height: calc(60px + env(safe-area-inset-bottom));
    padding-bottom: env(safe-area-inset-bottom);
  }

  .blog-list {
    padding-bottom: calc(70px + env(safe-area-inset-bottom));
  }
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #909399;
  grid-column: 1 / -1;
}

.empty-icon {
  font-size: 60px;
  color: #ddd;
  margin-bottom: 20px;
}
</style>
