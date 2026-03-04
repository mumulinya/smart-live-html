<template>
  <div class="home-container">
    <transition name="van-fade">
      <div v-if="isLoading" class="global-loading-overlay">
        <div class="loading-content-box">
          <van-loading type="spinner" color="#ff2442" size="36px" />
          <div class="loading-text">正在加载...</div>
        </div>
      </div>
    </transition>

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
        <span>请输入商户名称、地点</span>
      </div>
      <div class="header-icon" @click="toPage(5)"><img src="@/assets/ai-avatar.jpg" alt="" style="width: 38px;
      height: 38px;
      box-shadow: 0 0 3px 2px rgba(0, 0, 0, 0.1);
      border-radius: 50%;"></div>
    </div>

    <div class="type-list">
      <div class="type-pager" ref="typePager" @scroll.passive="onTypePagerScroll">
        <div class="type-page" v-for="(page, pageIndex) in featuredTypePages" :key="'type-page-' + pageIndex">
          <button
            class="type-box"
            v-for="t in page"
            :key="t.id"
            type="button"
            @click="toShopList(t.id, t.name)"
          >
            <div class="type-view">
              <img :src="getTypeIconSrc(t.icon)" :alt="t.name" @error="handleTypeIconError" />
            </div>
            <div class="type-text">{{ t.name }}</div>
          </button>
        </div>
      </div>
      <div class="type-page-indicators" v-if="featuredTypePages.length > 1">
        <span
          class="type-page-dot"
          v-for="(_, pageIndex) in featuredTypePages"
          :key="'type-dot-' + pageIndex"
          :class="{ active: activeTypePage === pageIndex }"
        ></span>
      </div>
    </div>

    <div class="home-deal-panel">
      <div class="deal-section">
        <div class="deal-tabs">
          <button
            class="deal-tab-item"
            @click="goDealZone('normal')"
          >
            <div class="deal-tab-main">
              <span class="deal-tab-title">优惠专区</span>
              <span class="deal-tab-desc">代金券 / 团购</span>
            </div>
            <div class="deal-tab-ornament">
              <Present class="deal-tab-icon" />
            </div>
          </button>
          <button
            class="deal-tab-item seckill"
            @click="goDealZone('seckill')"
          >
            <div class="deal-tab-main">
              <span class="deal-tab-title">秒杀专区</span>
              <span class="deal-tab-desc">限时低价</span>
            </div>
            <div class="deal-tab-ornament">
              <Lightning class="deal-tab-icon" />
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- 横向滑动推荐区 -->
    <div class="top-shops-panel" v-if="topShops.length > 0">
      <div class="panel-header-rank">
        <div class="rank-tabs-group">
          <!-- 团购 -->
          <div class="rank-tab-item" :class="{ active: activeHotTab === 'groupBuy' }" @click="switchHotTab('groupBuy')">
            <span v-if="activeHotTab === 'groupBuy'">🔥 本地团购榜</span>
            <span v-else>本地团购</span>
          </div>
          <span class="rank-tab-divider">|</span>
          <!-- 店铺 -->
          <div class="rank-tab-item" :class="{ active: activeHotTab === 'shop' }" @click="switchHotTab('shop')">
            <span v-if="activeHotTab === 'shop'">🔥 本地必吃榜</span>
            <span v-else>必吃好店</span>
          </div>
          <span class="rank-tab-divider">|</span>
          <!-- 优惠券 -->
          <div class="rank-tab-item" :class="{ active: activeHotTab === 'voucher' }" @click="switchHotTab('voucher')">
            <span v-if="activeHotTab === 'voucher'">🔥 抢手好券榜</span>
            <span v-else>抢手好券</span>
          </div>
        </div>
        <div class="panel-more" @click="goToTopList">查看完整榜单 <i class="el-icon-arrow-right"></i></div>
      </div>
      <div class="scroll-view-wrapper">
        <div class="shop-card" v-for="(shop, idx) in topShops" :key="shop.id" @click="toHotDetail(shop)">
          <div class="shop-img-box">
             <img :src="shop.displayImg" v-if="shop.displayImg && !shop.imgError" @error="shop.imgError = true" @load="shop.imgLoaded = true" :class="{'is-loaded': shop.imgLoaded}" alt="">
             <div class="img-fallback" v-else><i class="el-icon-goods"></i></div>
             <div class="heat-tag">🔥 {{ formatTopScore(shop.hotScore) }}</div>
          </div>
          <div class="shop-name-trunc">
            <span v-if="shop.activityType === 1" class="seckill-tag" style="background: linear-gradient(135deg, #ff416c, #ff4b2b); color: white; font-size: 10px; padding: 1px 4px; border-radius: 3px; margin-right: 4px; vertical-align: middle;">秒杀</span>
            {{ shop.name || shop.title }}
          </div>
          <!-- 店铺显示人均和距离，券展示价格 -->
          <div class="shop-desc-trunc" v-if="activeHotTab === 'shop'">
            {{ shop.avgPrice ? '人均 ￥' + shop.avgPrice : '' }}{{ shop.avgPrice && shop.distance ? ' | ' : '' }}{{ shop.distance ? formatTopDistance(shop.distance) : '' }}
          </div>
          <div class="shop-desc-price" v-else>
            <span class="price-symbol">￥</span><span class="price-now">{{ formatPrice(shop.price || shop.payValue) }}</span>
            <span class="price-old" v-if="shop.originalPrice || shop.actualValue">￥{{ formatPrice(shop.originalPrice || shop.actualValue) }}</span>
          </div>
        </div>
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
                      <img
                        v-show="!b.imgError"
                        :class="{ 'is-loaded': b.imgLoaded }"
                        :src="b.img"
                        :alt="b.title"
                        :loading="getImageLoading(index)"
                        :fetchpriority="index < 2 ? 'high' : 'auto'"
                        decoding="async"
                        @error="handleImageError($event, b)"
                        @load="handleImageLoad($event, b)"
                      >
                      <div class="img-skeleton" v-if="!b.imgError && !b.imgLoaded"></div>
                      <div class="img-placeholder" v-if="b.imgError">图片加载失败</div>
                    </div>
                   <div class="blog-content">
                     <div class="blog-title">{{ b.title || '无标题' }}</div>
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
                      <img
                        v-show="!b.imgError"
                        :class="{ 'is-loaded': b.imgLoaded }"
                        :src="b.img"
                        :alt="b.title"
                        :loading="getImageLoading(index)"
                        :fetchpriority="index < 2 ? 'high' : 'auto'"
                        decoding="async"
                        @error="handleImageError($event, b)"
                        @load="handleImageLoad($event, b)"
                      >
                      <div class="img-skeleton" v-if="!b.imgError && !b.imgLoaded"></div>
                      <div class="img-placeholder" v-if="b.imgError">图片加载失败</div>
                    </div>
                   <div class="blog-content">
                     <div class="blog-title">{{ b.title || '无标题' }}</div>
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
                      <img
                        v-show="!b.imgError"
                        :class="{ 'is-loaded': b.imgLoaded }"
                        :src="b.img"
                        :alt="b.title"
                        :loading="getImageLoading(index)"
                        :fetchpriority="index < 2 ? 'high' : 'auto'"
                        decoding="async"
                        @error="handleImageError($event, b)"
                        @load="handleImageLoad($event, b)"
                      >
                      <div class="img-skeleton" v-if="!b.imgError && !b.imgLoaded"></div>
                      <div class="img-placeholder" v-if="b.imgError">图片加载失败</div>
                    </div>
                   <div class="blog-content">
                     <div class="blog-title">{{ b.title || '无标题' }}</div>
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
        
        <template #nav-bottom>
          <div class="tabs-nav-bottom-shell">
            <div class="nav-drop-btn nav-right" @click="showMoreCategories = !showMoreCategories">
              <i class="el-icon-arrow-down" :class="{ rotate: showMoreCategories }"></i>
            </div>
            <transition name="dropdown-expand">
              <div class="home-dropdown-content" v-if="showMoreCategories">
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
            </transition>
          </div>
        </template>
    </van-tabs>

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
import { getHotBlogs, getBlogsByCategory } from "@/api/blog";
import { likeBlog, getFeedList } from "@/api/interaction";
import { getShopTypes, getHotRank } from "@/api/shop";
import { getProductHotRank } from "@/api/product";
import { locationUtil } from "@/utils/location";
import FootBar from '@/components/FootBar.vue';
import { Lightning, Present } from '@element-plus/icons-vue';

export default {
  name: 'HomeIndex',
  components: {
    FootBar,
    Lightning,
    Present
  },
  data() {
    return {
      isReachBottom: false,
      types: [],
      activeTypePage: 0,
      
      activeHotTab: 'shop', // 'shop', 'voucher', 'groupBuy'
      
      topShops: [],
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
      currentCity: '佛山',
      userLocation: {
        x: 113.121416,
        y: 23.021548,
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
      hotCities: ['佛山', '上海', '北京', '深圳', '广州', '成都', '南京', '武汉', '西安'],
      cityCoordinates: {
        '佛山': { x: 113.121416, y: 23.021548 },
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

      pendingCategoryId: null, // Add this to track pending tab restore
      scrollPositions: {}, // Save scroll position per category
      
      categoryPageSize: 8 // default 8 for mobile (2 rows of 4)
    }
  },
  computed: {
    featuredTypePages() {
      const pageSize = this.categoryPageSize; 
      const list = Array.isArray(this.types) ? this.types : [];
      const pages = [];

      for (let i = 0; i < list.length; i += pageSize) {
        pages.push(list.slice(i, i + pageSize));
      }

      return pages;
    },
    visibleCategories() {
      return this.categories;
    }
  },
  created() {
    this.queryTypes();
    this.initLocation();

    // Restore active tab from route query parameter
    let savedCategory = this.$route.query.tab;

    // Safety check: if saved as 'follow' but no token, switch to hot
    if (savedCategory === 'follow' && !this.token) {
        savedCategory = 'hot';
    }

    if (savedCategory) {
      if (savedCategory === 'follow') {
        this.activeCategory = 'follow';
        this.queryFollowedFeeds();
      } else if (savedCategory === 'hot') {
        this.activeCategory = 'hot';
        this.queryHotBlogsScroll();
      } else {
        // It's a dynamic category ID.
        // We cannot set activeCategory yet because types are not loaded.
        // If we set it now, van-tabs will reset it to first tab because ID not found in items.
        this.pendingCategoryId = savedCategory;
        // Do NOT load default data here, wait for types.
      }
    } else {
      // Default to hot for all users
      this.activeCategory = 'hot';
      this.queryHotBlogsScroll();
    }
  },
  activated() {
    // Check if token changed (User logged in or out)
    const newToken = localStorage.getItem("token") || '';
    if (this.token !== newToken) {
        this.token = newToken;
        
        // Reset data
        this.blogs = [];
        this.followBlogs = [];
        this.current = 1;
        this.followParams = { offset: 0, minTime: 0 };
        this.noMoreData = false;
        this.noMoreFollowData = false;
        this.isLoading = false;
        
        // If logged out and currently on 'follow', switch to 'hot'
        if (!this.token && this.activeCategory === 'follow') {
            this.activeCategory = 'hot';
        }
        
        // Refresh current category
        if (this.activeCategory === 'follow') {
            this.queryFollowedFeeds();
        } else if (this.activeCategory === 'hot') {
            this.queryHotBlogsScroll();
        } else {
            this.queryBlogsByCategory(this.activeCategory);
        }
    }

    const tab = this.$route.query.tab;
    if (tab && tab !== this.activeCategory) {
        // Check validity
        let isValid = (tab === 'follow' && this.token) || tab === 'hot';
        if (!isValid && this.categories.some(c => c.id === tab)) isValid = true;

        if (isValid) {
            this.activeCategory = tab;
            // Reload data for the new tab
            if (tab === 'follow') this.queryFollowedFeeds();
            else if (tab === 'hot') this.queryHotBlogsScroll();
            else this.queryBlogsByCategory(tab);
        }
    }

    // Restore scroll position
    this.$nextTick(() => {
       const activePos = this.scrollPositions[this.activeCategory] || 0;
       if (this.$el) {
           const containers = this.$el.querySelectorAll('.blog-list-content');
           containers.forEach(el => {
               // The active van-tab content is usually the one without display: none
               if (el.parentElement && el.parentElement.style.display !== 'none') {
                   el.scrollTop = activePos;
               }
           });
       }
    });
  },
  mounted() {
    this.calculateCategorySize();
    window.addEventListener('resize', this.calculateCategorySize);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.calculateCategorySize);
  },

  methods: {
    calculateCategorySize() {
      const width = document.documentElement.clientWidth || window.innerWidth;
      const totalLen = this.types && this.types.length > 0 ? this.types.length : 10;
      
      // On wide screens (web/tablet), show all of them at once without swiping.
      // Mobile keeps it at 8 for standard swiping.
      if (width >= 768) {
         this.categoryPageSize = Math.max(totalLen, 10);
      } else {
         this.categoryPageSize = 8;
      }
    },
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
    toDetail(id) {
      this.$router.push({ path: '/shop/detail', query: { id } });
    },
    toHotDetail(item) {
      if (this.activeHotTab === 'shop') {
        this.$router.push({ path: '/shop/detail', query: { id: item.id } });
      } else {
        // handle voucher / groupBuy
        this.$router.push({ path: '/product/detail', query: { id: item.id } });
      }
    },
    switchHotTab(tab) {
      if (this.activeHotTab === tab) return;
      this.activeHotTab = tab;
      this.loadTopShops();
    },
    goToTopList() {
      if (this.activeHotTab === 'shop') {
        this.$router.push('/shop/top');
      } else {
        // Product top list (creates soon)
        this.$router.push({ path: '/product/top', query: { type: this.activeHotTab } });
      }
    },
    formatPrice(value) {
      const num = Number(value);
      if (!Number.isFinite(num)) return '0.00';
      if (Number.isInteger(num)) return String(num);
      return num.toFixed(2).replace(/\.?0+$/, '');
    },
    loadTopShops() {
      if (this.activeHotTab === 'shop') {
        getHotRank({
          current: 1,
          x: this.userLocation.x,
          y: this.userLocation.y
        }).then(res => {
          let list = [];
          if (Array.isArray(res)) list = res;
          else if (res && Array.isArray(res.list)) list = res.list;
          else if (res && res.data && Array.isArray(res.data.list)) list = res.data.list;
          else if (res && Array.isArray(res.data)) list = res.data;

          list = list.slice(0, 10);
          this.processShopImages(list);
          this.topShops = list;
        }).catch(err => {
          console.error('加载Top店铺失败', err);
        });
      } else {
        let category = this.activeHotTab === 'voucher' ? 1 : 2;
        getProductHotRank({
          current: 1,
          size: 10,
          category: category
        }).then(res => {
          let list = [];
          if (Array.isArray(res)) list = res;
          else if (res && Array.isArray(res.list)) list = res.list;
          else if (res && res.data && Array.isArray(res.data.list)) list = res.data.list;
          else if (res && Array.isArray(res.data)) list = res.data;

          list = list.slice(0, 10);
          this.processShopImages(list);
          this.topShops = list;
        }).catch(err => {
          console.error('加载Top商品失败', err);
        });
      }
    },
    processShopImages(list) {
      list.forEach(s => {
        let img = s.shopLogo || s.images || '';
        if (img && !img.startsWith('http')) {
          img = (this.$fileURL || '') + img.split(',')[0];
        } else if (img) {
          img = img.split(',')[0];
        }
        s.displayImg = img;
        s.imgLoaded = false;
        s.imgError = false;
      });
    },
    formatTopScore(hotScore) {
      const n = Number(hotScore);
      if (!Number.isFinite(n) || n <= 0) return '0.0';
      return n.toFixed(1);
    },
    formatTopDistance(distance) {
      const n = Number(distance);
      if (!Number.isFinite(n) || n <= 0) return '';
      return n < 1000 ? `${n.toFixed(0)}m` : `${(n / 1000).toFixed(1)}km`;
    },
    getTypeIconSrc(icon) {
      if (!icon) return '/imgs/types/ms.png';

      const normalized = String(icon).trim();
      if (!normalized) return '/imgs/types/ms.png';

      if (normalized.startsWith('http')) return normalized;
      if (normalized.startsWith('/imgs/')) return normalized;
      if (normalized.startsWith('/types/')) return '/imgs' + normalized;
      if (normalized.startsWith('types/')) return '/imgs/' + normalized;
      if (normalized.startsWith('/')) return normalized;
      return '/imgs/' + normalized;
    },
    handleTypeIconError(event) {
      event.target.src = '/imgs/types/ms.png';
    },
    onTypePagerScroll(event) {
      const pager = event?.target;
      if (!pager) return;

      const pageWidth = pager.clientWidth || 1;
      const maxPage = Math.max(0, this.featuredTypePages.length - 1);
      const currentPage = Math.min(maxPage, Math.max(0, Math.round(pager.scrollLeft / pageWidth)));

      if (currentPage !== this.activeTypePage) {
        this.activeTypePage = currentPage;
      }
    },
    toBlogDetail(b) {
      this.$router.push({
        path: '/blog/detail',
        query: { id: b.id }
      });
    },
    goDealZone(zone) {
      const isSeckill = zone === 'seckill';
      this.$router.push({
        path: '/deal/list',
        query: {
          zone: isSeckill ? 'seckill' : 'normal',
          type: isSeckill ? 1 : 0
        }
      });
    },
    handleImageError(event, blog) {
      blog.imgError = true;
      blog.imgLoaded = false;
      // event.target.style.display = 'none'; // Vue way: usign v-if in template
    },
    handleImageLoad(event, blog) {
      blog.imgError = false;
      blog.imgLoaded = true;
    },
    getImageLoading(index) {
      return index < 6 ? 'eager' : 'lazy';
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

         const list = Array.isArray(data) ? data.slice() : [];
         list.sort((a, b) => {
           const sa = Number(a?.sort ?? Number.MAX_SAFE_INTEGER);
           const sb = Number(b?.sort ?? Number.MAX_SAFE_INTEGER);
           return sa - sb;
         });

         this.types = list;
         this.calculateCategorySize();
         this.categories = this.generateCategoriesFromTypes(this.types);

         this.$nextTick(() => {
             this.activeTypePage = 0;
             const pager = this.$refs.typePager;
             if (pager && typeof pager.scrollTo === 'function') {
               pager.scrollTo({ left: 0, behavior: 'auto' });
             }

             // Resume pending category if any
             if (this.pendingCategoryId) {
                 // Check if pending ID exists in loaded categories
                 const exists = this.categories.some(c => c.id === this.pendingCategoryId);
                 if (exists) {
                     this.activeCategory = this.pendingCategoryId;
                     this.queryBlogsByCategory(this.pendingCategoryId);
                 } else {
                     // Fallback if ID invalid
                     this.activeCategory = this.token ? 'follow' : 'hot';
                     if (this.activeCategory === 'follow') this.queryFollowedFeeds();
                     else this.queryHotBlogsScroll();
                 }
                 this.pendingCategoryId = null;
             }
         });

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
       if (this.isLoading || this.noMoreData) return;
       this.isLoading = true;
       getHotBlogs({ current: this.current, status: 0 })
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
               b.imgLoaded = false;
               
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
    queryBlogsByCategory(categoryId) {
        if (this.isLoading || this.noMoreData) return; // Allow first load
        this.isLoading = true;
        
        const apiCall = categoryId === 'hot' ? getHotBlogs({ current: this.current, status: 0 }) : getBlogsByCategory(categoryId, this.current);
        
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
                b.imgLoaded = false;
                
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
        if (this.isLoading || this.noMoreFollowData) return;
        this.isLoading = true;
        
        // Use time/offset based pagination for feeds
        const lastId = this.followParams.minTime || new Date().getTime();
        
        // feedType 1 represents "User/Note" (Followed users' notes)
        getFeedList({ feedType: 1, offset: this.followParams.offset, lastId })
          .then((res) => {
             // Handle response structure (data vs records vs direct list)
             const data = res.data || res || {};
             let list = [];
             
             if (Array.isArray(data)) {
                 list = data;
             } else if (Array.isArray(data.list)) {
                 list = data.list;
             }
             
            if (!list || list.length === 0) {
              this.noMoreFollowData = true;
            } else {
               const mappedList = list.map(rawItem => {
                const detail = rawItem?.data && typeof rawItem.data === 'object' && !Array.isArray(rawItem.data) ? rawItem.data : null;
                const item = detail ? { ...rawItem, ...detail } : { ...rawItem };
                
                // Map API fields to Component expected fields
                // Component expects: img, title, icon, name, liked, id (blogId)
                
                // Map 'cover' to 'img'
                let firstImg = '';
                // Check 'cover' first, then 'images', then 'img'
                const rawImg = item.cover || (item.images ? (Array.isArray(item.images) ? item.images[0] : item.images.split(',')[0]) : '') || item.img;
                
                if (rawImg) {
                     if (rawImg.startsWith('http')) {
                         firstImg = rawImg;
                     } else {
                         firstImg = this.$fileURL + rawImg;
                     }
                }
                item.img = firstImg;

                // Map 'userAvatar' to 'icon'
                // Check 'userAvatar' first, then 'icon'
                const rawIcon = item.userAvatar || item.icon;
                if (rawIcon) {
                     if (rawIcon.startsWith('http')) {
                         item.icon = rawIcon;
                     } else {
                         item.icon = this.$fileURL + rawIcon;
                     }
                } else {
                    item.icon = '';
                }

                if (item.shopLogo) {
                    if (!item.shopLogo.startsWith('http')) {
                        item.shopLogo = this.$fileURL + item.shopLogo;
                    }
                }

                // Map 'userName' to 'name'
                // Check 'userName' first, then 'nickName', then 'name'
                item.name = item.userName || item.nickName || item.name || '匿名用户';
                item.liked = item.likes || item.liked || 0;
                item.isLike = item.isLike || false;
                item.title = item.title || '';
                
                // Important: map targetId to id for navigation (fallback to id)
                item.id = item.targetId || item.id;
                
                item.imgLoaded = false;
                item.imgError = false;

                item.imgError = !item.img;
                item.imgLoaded = false;
                return item;
              });
              this.followBlogs = this.followBlogs.concat(mappedList);
              
              // precise updating for next scroll
              this.followParams.minTime = data.minTime || 0;
              this.followParams.offset = data.offset || 0;

              // Stop if no minTime returned (fix for infinite loop)
              if (!data.minTime) {
                  this.noMoreFollowData = true;
              }
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
            this.loadTopShops();
         });
       },
       updateLocationState(loc) {
            this.userLocation = loc;
            if(loc.region && loc.region.city) {
               this.currentCity = typeof loc.region.city === 'string' ? loc.region.city : loc.region.province;
               // Clean up city suffix
               this.currentCity = this.currentCity.replace('市', '');
            } else if (loc.region && loc.region.province) {
               this.currentCity = loc.region.province.replace('省', '').replace('市', '');
            }
            this.loadTopShops();
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
         this.showMoreCategories = false;
         // 保存 tab 状态到路由查询参数
         this.$router.replace({ query: { ...this.$route.query, tab: name } });
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
         this.scrollPositions[this.activeCategory] = scrollTop;
         
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
         this.locationStatusText = '正在定位...';
         
         locationUtil.getLocation(true).then(loc => {
           this.updateLocationState(loc);
           this.locationSuccess = true;
           
           // Explicitly ensure it's saved (redundant but safe)
           locationUtil.saveLocation(loc);
           
           this.locationStatusText = '定位成功：' + this.currentCity;
           setTimeout(() => this.showLocationStatus = false, 1500);
         }).catch(err => {
           this.locationError = true;
           this.locationStatusText = '定位失败，请手动选择';
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
         this.locationStatusText = '已切换到 ' + city;
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
  background: linear-gradient(96deg, #ff9c00 0%, #ff6633 100%);
  padding: 10px 15px;
  display: flex;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
  height: 50px;
  border-radius: 0 0 16px 16px;
  box-shadow: 0 8px 16px rgba(255, 114, 56, 0.24);
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

.type-list {
  margin: 10px 10px 0;
  padding: 12px 10px 10px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 16px rgba(15, 23, 42, 0.06);
}

.type-pager {
  display: flex;
  width: 100%;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-x;
  scrollbar-width: none;
}

.type-pager::-webkit-scrollbar {
  display: none;
}

.type-page {
  flex: 0 0 100%;
  width: 100%;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  justify-items: center; /* keep icons centered in their column track */
  justify-content: space-between; /* spread the 4 column tracks across the full width */
  align-items: center;
  gap: 16px 0;
  scroll-snap-align: start;
}

@media screen and (min-width: 768px) {
  .type-page {
    grid-template-columns: repeat(10, minmax(0, 1fr)); /* Desktop can afford all 10 per row */
    gap: 20px 0;
  }
}
.type-box {
  border: none;
  background: transparent;
  margin: 0;
  padding: 0;
  width: 100%;
  max-width: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
  min-width: 0;
  cursor: pointer;
}

.type-box:active {
  transform: scale(0.97);
}

.type-view {
  width: 54px;
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  box-shadow: none;
  padding: 0;
}

.type-view img {
  width: 54px;
  height: 54px;
  object-fit: contain;
}

.type-text {
  width: 100%;
  margin: 0;
  text-align: center;
  font-size: 13px;
  line-height: 1.25;
  font-weight: 500;
  color: #263238;
  white-space: normal;
  word-break: keep-all;
  overflow: hidden;
  text-overflow: clip;
}

.type-page-indicators {
  display: flex;
  justify-content: center;
  gap: 6px;
  padding-top: 8px;
}

.type-page-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: #d7d9dd;
  transition: all 0.2s ease;
}

.type-page-dot.active {
  width: 14px;
  background: #ff7a45;
}

/* Home deal zone */
.home-deal-panel {
  padding: 6px 10px 4px;
  background: #f8f9fa;
}

.deal-section {
  background: #fff;
  border-radius: 14px;
  padding: 10px;
  margin-bottom: 10px;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.06);
}

.deal-tabs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin: 0;
}

.deal-tab-item {
  border: 1px solid rgba(255, 157, 99, 0.38);
  background: linear-gradient(130deg, #fff4e8 0%, #ffe3cd 55%, #ffd9bc 100%);
  color: #ff6d3d;
  border-radius: 13px;
  line-height: 1.2;
  padding: 11px 10px;
  text-align: left;
  cursor: pointer;
  transition: transform 0.2s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 72px;
  position: relative;
  overflow: hidden;
}

.deal-tab-item::before {
  content: '';
  position: absolute;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  right: -22px;
  top: -28px;
  background: rgba(255, 255, 255, 0.34);
}

.deal-tab-item.seckill {
  border-color: rgba(255, 119, 165, 0.36);
  background: linear-gradient(130deg, #ffeef4 0%, #ffdbe8 58%, #ffcde0 100%);
  color: #ff3b5c;
}

.deal-tab-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  position: relative;
  z-index: 1;
}

.deal-tab-title {
  font-size: 15px;
  font-weight: 700;
  color: inherit;
}

.deal-tab-desc {
  font-size: 12px;
  color: #9c4a2a;
  font-weight: 500;
  opacity: 1;
}

.deal-tab-item.seckill .deal-tab-desc {
  color: #9f365d;
}

.deal-tab-ornament {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.42);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
  position: relative;
  z-index: 1;
}

.deal-tab-item.seckill .deal-tab-ornament {
  background: rgba(255, 255, 255, 0.48);
}

.deal-tab-icon {
  width: 18px;
  height: 18px;
  color: rgba(159, 74, 42, 0.9);
}

.deal-tab-item.seckill .deal-tab-icon {
  color: rgba(159, 54, 93, 0.92);
}

.deal-tab-item:active {
  transform: scale(0.98);
}
/* Tabs + category tags */
:deep(.van-tabs__line) {
  height: 3px;
  border-radius: 3px;
  background: linear-gradient(90deg, #ff9c00 0%, #ff6633 100%);
}

:deep(.van-tab) {
  color: #666;
  font-size: 14px;
  font-weight: 500;
}

:deep(.van-tab--active) {
  color: #ff6633;
  font-weight: 600;
}

:deep(.van-tabs__nav) {
  background: #fff;
}

:deep(.van-tabs__nav--line.van-tabs__nav--complete) {
  padding-right: 48px;
}

.tabs-nav-bottom-shell {
  position: relative;
}

.home-dropdown-content {
  background: #fff;
  padding: 8px 10px 12px;
  border-top: 1px solid #f2f3f5;
  box-shadow: inset 0 1px 0 rgba(0, 0, 0, 0.02);
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  overflow-y: auto;
  max-height: 180px;
  padding-right: 2px;
}

.grid-item {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 36px;
  padding: 0 10px;
  background: #f7f8fa;
  border: 1px solid transparent;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: all 0.2s ease;
}

.grid-item:active {
  transform: scale(0.98);
}

.grid-item.active {
  background: linear-gradient(90deg, #ff9c00 0%, #ff6633 100%);
  border-color: transparent;
  color: #fff;
  box-shadow: 0 4px 10px rgba(255, 102, 51, 0.28);
}

.modal-header i {
  cursor: pointer;
  font-size: 18px;
  color: #999;
}

/* Blog List Content (Inside van-tab) */
.blog-list-content {
  height: calc(100vh - 200px); /* Adjust based on header + type-list + tabs */
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 10px 70px;
  background: #f5f5f5;
}

/* Category More Button in nav-right slot */
.nav-drop-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  cursor: pointer;
  color: #ff6633;
  font-size: 14px;
  z-index: 12;
}
.nav-drop-btn.nav-right {
  position: absolute;
  right: 0;
  top: -44px;
  background: #fff;
}
.nav-drop-btn.nav-right::before {
  content: '';
  position: absolute;
  left: -14px;
  top: 0;
  width: 14px;
  height: 44px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0), #fff);
  pointer-events: none;
}
.nav-drop-btn i {
  transition: transform 0.3s;
}
.nav-drop-btn i.rotate {
  transform: rotate(180deg);
}

.dropdown-expand-enter-active,
.dropdown-expand-leave-active {
  transition: max-height 0.22s ease, opacity 0.2s ease, padding 0.2s ease;
  overflow: hidden;
}

.dropdown-expand-enter-from,
.dropdown-expand-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.dropdown-expand-enter-to,
.dropdown-expand-leave-from {
  max-height: 220px;
  opacity: 1;
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
  position: relative;
  width: 100%;
  height: auto; /* Variable height */
  min-height: 120px;
  overflow: hidden;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.blog-img img {
  width: 100%;
  height: auto;
  display: block;
  object-fit: cover;
  opacity: 0;
  transform: scale(1.015);
  transition: opacity 220ms ease, transform 420ms ease;
}

.blog-img img.is-loaded {
  opacity: 1;
  transform: scale(1);
}

.img-skeleton {
  position: absolute;
  inset: 0;
  background: linear-gradient(100deg, #f3f4f6 30%, #ebeef2 45%, #f3f4f6 60%);
  background-size: 300% 100%;
  animation: blogImgShimmer 1.25s linear infinite;
  pointer-events: none;
}

@keyframes blogImgShimmer {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: 0 0;
  }
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
  font-size: 15px; /* Increased from 14px */
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
  width: 20px; /* Increased from 18px */
  height: 20px; /* Increased from 18px */
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
  font-size: 12px; /* Increased from 11px */
  color: #666;
  flex: 1;
}

.blog-liked {
  display: flex;
  align-items: center;
  font-size: 12px;
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

/* ============ 全局加载特效 ============ */
.global-loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  /* 杞诲井鐏板簳姣涚幓鐠冩晥鏋?*/
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-content-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  padding: 24px 32px;
  border-radius: 16px;
  /* 品牌化轻弹动效 */
  animation: boxPopUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
}

@keyframes boxPopUp {
  0% { transform: scale(0.85); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.loading-text {
  margin-top: 12px;
  font-size: 14px;
  color: #666;
  font-weight: 500;
  letter-spacing: 1px;
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

/* Top 10 Shops Panel */
.top-shops-panel {
  background: #fff;
  margin: 12px 10px;
  border-radius: 16px;
  padding: 16px 0;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
}
.top-shops-panel .panel-header-rank {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 0 12px 12px;
}

/* Tabs merged into header */
.rank-tabs-group {
  display: flex;
  align-items: baseline;
  gap: 0;
  flex: 1;
  min-width: 0;
  overflow: hidden;
}
.rank-tab-item {
  font-size: 12px;
  color: #999;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}
.rank-tab-item.active {
  font-size: 15px;
  font-weight: 800;
  color: #333;
}
.rank-tab-divider {
  color: #eee;
  margin: 0 6px;
  font-size: 10px;
  user-select: none;
  flex-shrink: 0;
}

.top-shops-panel .panel-more {
  font-size: 12px;
  color: #999;
  display: flex;
  align-items: center;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
}

.scroll-view-wrapper {
  display: flex;
  overflow-x: auto;
  gap: 12px;
  padding: 0 16px;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none; /* Firefox */
}
.scroll-view-wrapper::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
}
.scroll-view-wrapper .shop-card {
  flex-shrink: 0;
  width: 140px;
  display: flex;
  flex-direction: column;
}
.scroll-view-wrapper .shop-img-box {
  width: 140px;
  height: 100px;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
  margin-bottom: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.scroll-view-wrapper .shop-img-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.scroll-view-wrapper .heat-tag {
  position: absolute;
  top: 6px;
  left: 6px;
  background: linear-gradient(135deg, #ff4b2b, #ff416c);
  color: #fff;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 6px 0 6px 0;
  font-weight: 800;
  box-shadow: 0 2px 4px rgba(255, 65, 108, 0.4);
  letter-spacing: 0.5px;
}
.scroll-view-wrapper .shop-name-trunc {
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
}
.scroll-view-wrapper .shop-desc-trunc {
  font-size: 11px;
  color: #95a5a6;
  margin-top: 4px;
}
.scroll-view-wrapper .shop-desc-price {
  margin-top: 4px;
  display: flex;
  align-items: baseline;
  gap: 4px;
}
.scroll-view-wrapper .price-symbol {
  font-size: 10px;
  color: #ff416c;
  font-weight: 600;
}
.scroll-view-wrapper .price-now {
  font-size: 16px;
  color: #ff416c;
  font-weight: 700;
  font-family: Arial, sans-serif;
  letter-spacing: -0.5px;
}
.scroll-view-wrapper .price-old {
  font-size: 11px;
  color: #b2bec3;
  text-decoration: line-through;
  margin-left: 2px;
}
.scroll-view-wrapper .img-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eee;
  color: #ccc;
  font-size: 24px;
}
</style>
