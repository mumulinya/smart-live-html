<template>
  <div class="search-page" @scroll="onScroll">
    <!-- Header -->
    <div class="search-header">
      <div class="back-btn" @click="goBack">
          <i class="el-icon-arrow-left"></i>
      </div>
      <div class="custom-search-bar">
        <!-- Input -->
        <div class="simple-input-container">
           <input
             class="native-search-input"
             v-model="keyword"
             placeholder="输入商户名、地点或菜品"
             @keyup.enter="doSearch(false)"
           />
           <i class="el-icon-circle-close clear-icon" v-if="keyword" @click="keyword=''"></i>
        </div>
        
        <!-- Inner Search Button -->
        <div class="search-btn-inner" @click="doSearch(false)">搜索</div>
      </div>
    </div>

    <!-- Location Status (Integrated style) -->

    <!-- History & Hot Search (Show when NOT searched) -->
    <div v-if="!hasSearched" class="initial-area">
       <div class="search-history" v-if="searchHistory.length > 0">
          <div class="history-title">
             <span>历史搜索</span>
             <span @click="clearHistory" style="cursor: pointer;">清除</span>
          </div>
          <div class="history-tags">
             <div class="history-tag" v-for="item in searchHistory" :key="item" @click="searchFromHistory(item)">{{item}}</div>
          </div>
       </div>

       <div class="hot-search">
          <div class="hot-title">热门搜索</div>
          <div class="hot-tags">
             <div class="hot-tag" :class="{hot: index < 3}" v-for="(item, index) in hotSearch" :key="item" @click="searchFromHistory(item)">
               {{item}}
             </div>
          </div>
       </div>
    </div>

    <!-- Main Content (Show WHEN searched) -->
    <div v-else>
        <!-- Filter Tabs -->
        <div class="search-filters">
            <div class="filter-tab" :class="{active: activeTab==='shop'}" @click="changeTab('shop')">商铺</div>
            <div class="filter-tab" :class="{active: activeTab==='voucher'}" @click="changeTab('voucher')">代金券</div>
            <div class="filter-tab" :class="{active: activeTab==='blog'}" @click="changeTab('blog')">笔记</div>
            <div class="filter-tab" :class="{active: activeTab==='user'}" @click="changeTab('user')">用户</div>
        </div>

        <!-- Detail Filter Bars (Shop & Voucher) -->
        <div class="category-filter-area">
             <!-- Shop Filters -->
             <div v-if="activeTab === 'shop'" class="meituan-filter-bar">
                  <div class="filter-item" :class="{active: activeFilterTab==='type'}" @click="toggleFilterTab('type')">
                     <div class="filter-text">{{selectedShopType ? getShopTypeName(selectedShopType) : '分类'}} <i class="el-icon-arrow-down"></i></div>
                  </div>
                  <div class="filter-item" :class="{active: activeFilterTab==='distance'}" @click="toggleFilterTab('distance')">
                     <div class="filter-text">{{selectedDistance || '距离'}} <i class="el-icon-arrow-down"></i></div>
                  </div>
                  <div class="filter-item" :class="{active: activeFilterTab==='score'}" @click="toggleFilterTab('score')">
                     <div class="filter-text">{{selectedScore || '评分'}} <i class="el-icon-arrow-down"></i></div>
                  </div>
             </div>
             
             <!-- Voucher Filters -->
             <div v-if="activeTab === 'voucher'" class="meituan-filter-bar">
                 <div class="filter-item" :class="{active: activeFilterTab==='vType'}" @click="toggleFilterTab('vType')">
                     <div class="filter-text">{{selectedVoucherType !== null ? getVoucherTypeName(selectedVoucherType) : '类型'}} <i class="el-icon-arrow-down"></i></div>
                  </div>
                  <div class="filter-item" :class="{active: activeFilterTab==='status'}" @click="toggleFilterTab('status')">
                     <div class="filter-text">{{selectedStatus ? getStatusName(selectedStatus) : '状态'}} <i class="el-icon-arrow-down"></i></div>
                  </div>
                  <div class="filter-item" :class="{active: activeFilterTab==='vShopType'}" @click="toggleFilterTab('vShopType')">
                     <div class="filter-text">{{selectedVoucherShopType ? getShopTypeName(selectedVoucherShopType) : '分类'}} <i class="el-icon-arrow-down"></i></div>
                  </div>
             </div>
             
             <!-- Blog Filters -->
             <div v-if="activeTab === 'blog'" class="meituan-filter-bar">
                  <div class="filter-item" :class="{active: activeFilterTab==='blogType'}" @click="toggleFilterTab('blogType')">
                     <div class="filter-text">{{selectedBlogType ? getShopTypeName(selectedBlogType) : '全部类型'}} <i class="el-icon-arrow-down"></i></div>
                  </div>
             </div>

              <!-- Filter Dropdowns -->
              <div class="filter-content" :class="{show: !!activeFilterTab}">
                  <!-- Shop Type -->
                  <div v-if="activeFilterTab==='type'" class="shop-type-panel">
                     <div class="shop-type-grid">
                        <div class="shop-type-item" :class="{active: selectedShopType===type.id}" v-for="type in shopTypes" :key="type.id" @click="selectShopType(type.id)">{{type.name}}</div>
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
                  <!-- Voucher Type -->
                  <div v-if="activeFilterTab==='vType'" class="score-panel">
                     <div class="score-options">
                         <div class="score-option" :class="{active: selectedVoucherType===t.value}" v-for="t in voucherTypeOptions" :key="t.value" @click="selectVoucherType(t)">{{t.label}}</div>
                     </div>
                  </div>
                  <!-- Voucher Status -->
                  <div v-if="activeFilterTab==='status'" class="score-panel">
                     <div class="score-options">
                         <div class="score-option" :class="{active: selectedStatus===s.value}" v-for="s in statusOptions" :key="s.value" @click="selectStatus(s)">{{s.label}}</div>
                     </div>
                  </div>
                  <!-- Voucher Shop Type -->
                  <div v-if="activeFilterTab==='vShopType'" class="shop-type-panel">
                     <div class="shop-type-grid">
                        <div class="shop-type-item" :class="{active: selectedVoucherShopType===type.id}" v-for="type in shopTypes" :key="type.id" @click="selectVoucherShopType(type.id)">{{type.name}}</div>
                     </div>
                  </div>
                  <!-- Blog Type -->
                  <div v-if="activeFilterTab==='blogType'" class="shop-type-panel">
                     <div class="shop-type-grid">
                        <div class="shop-type-item" :class="{active: selectedBlogType===type.id}" v-for="type in shopTypes" :key="type.id" @click="selectBlogType(type.id)">{{type.name}}</div>
                     </div>
                  </div>

              </div>

              <!-- Selected Tags -->
              <div class="selected-filters" v-if="hasSelectedFilters">
                  <!-- Shop Tags -->
                  <template v-if="activeTab==='shop'">
                      <div class="selected-filter-tag" v-if="selectedShopType">{{getShopTypeName(selectedShopType)}} <span class="close" @click="selectShopType(selectedShopType)">×</span></div>
                      <div class="selected-filter-tag" v-if="selectedDistance">{{selectedDistance}} <span class="close" @click="selectedDistance=null;doSearch()">×</span></div>
                      <div class="selected-filter-tag" v-if="selectedScore">{{selectedScore}} <span class="close" @click="selectedScore=null;doSearch()">×</span></div>
                  </template>
                  <!-- Voucher Tags -->
                  <template v-if="activeTab==='voucher'">
                      <div class="selected-filter-tag" v-if="selectedVoucherType">{{getVoucherTypeName(selectedVoucherType)}} <span class="close" @click="selectedVoucherType=null;doSearch()">×</span></div>
                  </template>
                  
                  <div class="clear-all" @click="clearAllFilters">清除全部</div>
              </div>
        </div>

        <!-- Results -->
        <div class="search-results">
            <div v-if="isLoading" class="loading-box">
               <i class="el-icon-loading"></i> 加载中...
            </div>
            
            <div v-else>
               <!-- Shop Results -->
               <div v-if="activeTab === 'shop'">
                  <div v-if="shopList.length===0" class="empty-result">
                      <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiByeD0iOCIgZmlsbD0iI0Y4RjlGQSIvPgo8cGF0aCBkPSJNNDAgNDJMMzIgMzRMMzQgMzJMNDAgMzhMNDYgMzJMNDggMzRMNDAgNDJaIiBmaWxsPSIjQzBDNEY0Ii8+CjxwYXRoIGQ9Ik00MCA0MkwzMiAzNEwzNCAzMkw0MCAzOEw0NiAzMkw0OCAzNEw0MCA0MloiIGZpbGw9IiNDMEM0RjQiLz4KPC9zdmc+Cg==">
                      <p>暂无相关商铺</p>
                      <span class="sub-text">换个关键词试试吧</span>
                  </div>
                  <div class="shop-box" v-for="shop in shopList" :key="shop.id" @click="toShopDetail(shop)">
                     <div class="shop-img"><img :src="shop.images || '/imgs/default-shop.jpg'" alt=""></div>
                     <div class="shop-info">
                        <div class="shop-title" v-html="shop.name"></div>
                        <div class="shop-rate">
                           <el-rate disabled :model-value="shop.score/10" text-color="#F63" :size="12"></el-rate>
                           <span class="shop-avg">{{shop.score}}分</span>
                           <span class="shop-comments">{{shop.comments}}条</span>
                        </div>
                        <div class="shop-area">
                           <span v-html="shop.area || '未知区域'"></span>
                           <span v-if="shop.distance">{{formatDistance(shop.distance)}}</span>
                        </div>
                        <div class="shop-avg" v-if="shop.avgPrice">￥{{shop.avgPrice}}/人</div>
                        <div class="shop-address" v-if="shop.address">
                           <i class="el-icon-map-location"></i>
                           <span v-html="shop.address"></span>
                        </div>
                     </div>
                  </div>
               </div>

               <!-- Voucher Results -->
               <div v-if="activeTab === 'voucher'">
                   <div v-if="voucherList.length===0" class="empty-result">
                      <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiByeD0iOCIgZmlsbD0iI0Y4RjlGQSIvPgo8cGF0aCBkPSJNNDAgNDJMMzIgMzRMMzQgMzJMNDAgMzhMNDYgMzJMNDggMzRMNDAgNDJaIiBmaWxsPSIjQzBDNEY0Ii8+CjxwYXRoIGQ9Ik00MCA0MkwzMiAzNEwzNCAzMkw0MCAzOEw0NiAzMkw0OCAzNEw0MCA0MloiIGZpbGw9IiNDMEM0RjQiLz4KPC9zdmc+Cg==">
                      <p>暂无相关代金券</p>
                      <span class="sub-text">换个关键词试试吧</span>
                   </div>
                   
                   <!-- Seckill Vouchers -->
                   <div v-if="seckillVouchers.length > 0" class="seckill-wrapper">
                       <div class="voucher-category-title seckill">限时秒杀券</div>
                       <div class="voucher-box" v-for="v in seckillVouchers" :key="v.id" @click="toShopDetail(v)">
                           <div class="seckill-badge">秒杀</div>
                           <div class="voucher-left">
                               <div class="voucher-title" v-html="v.title"></div>
                               <div class="voucher-shop" v-if="v.shopId">
                                   适用商铺: <span class="voucher-shop-name">{{v.shopName || '家味道家常菜馆'}}</span>
                               </div>
                               <div class="voucher-subtitle" v-html="v.subTitle || '周一至周五均可使用'"></div>
                               <div class="voucher-price">
                                 <div class="p-symbol">￥</div><div class="p-val">{{v.payValue}}</div>
                                 <span class="p-disc">{{(v.payValue/v.actualValue*10).toFixed(1)}}折</span>
                               </div>
                           </div>
                           <div class="voucher-right">
                               <div class="seckill-layout">
                                   <button class="voucher-btn seckill-btn" @click.stop="doSeckill(v)" :class="{disabled: isNotBegin(v) || v.stock < 1}" >{{ isNotBegin(v) ? '待开始' : (v.stock < 1 ? '已抢光' : '限时抢购') }}</button>
                                   <div class="seckill-stock">剩余 {{v.stock}} 张</div>
                                   <div class="seckill-time" v-if="v.beginTime && v.endTime">{{formatDateHeader(v.beginTime)}}~{{formatDateHeader(v.endTime)}}</div>
                               </div>
                           </div>
                       </div>
                   </div>

                   <!-- Normal Vouchers -->
                   <div v-if="normalVouchers.length > 0">
                       <div class="voucher-category-title normal">普通代金券</div>
                       <div class="voucher-box" v-for="v in normalVouchers" :key="v.id" @click="toShopDetail(v)">
                           <div class="voucher-left">
                               <div class="voucher-title" v-html="v.title"></div>
                               <div class="voucher-subtitle" v-html="v.subTitle"></div>
                               <div class="voucher-price">
                                 <div class="p-symbol">￥</div><div class="p-val">{{v.payValue}}</div>
                                 <span class="p-disc">{{(v.payValue/v.actualValue*10).toFixed(1)}}折</span>
                               </div>
                           </div>
                           <div class="voucher-right">
                               <button class="voucher-btn" @click.stop="doBuy(v)">抢购</button>
                           </div>
                       </div>
                   </div>
               </div>

               <!-- Blog Results -->
               <div v-if="activeTab === 'blog'">
                   <div v-if="blogList.length===0" class="empty-result">
                      <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiByeD0iOCIgZmlsbD0iI0Y4RjlGQSIvPgo8cGF0aCBkPSJNNDAgNDJMMzIgMzRMMzQgMzJMNDAgMzhMNDYgMzJMNDggMzRMNDAgNDJaIiBmaWxsPSIjQzBDNEY0Ii8+CjxwYXRoIGQ9Ik00MCA0MkwzMiAzNEwzNCAzMkw0MCAzOEw0NiAzMkw0OCAzNEw0MCA0MloiIGZpbGw9IiNDMEM0RjQiLz4KPC9zdmc+Cg==">
                      <p>暂无相关笔记</p>
                      <span class="sub-text">换个关键词试试吧</span>
                   </div>
                   <div v-else class="blog-list-grid">
                      <div v-for="b in blogList" :key="b.id" class="blog-card" @click="toBlogDetail(b)">
                         <div class="blog-card-image">
                            <!-- Fixed height image container -->
                            <img :src="b.images || '/imgs/default-blog.png'" alt="" v-if="b.images">
                            <div v-else class="no-img-placeholder"><i class="el-icon-picture"></i></div>
                         </div>
                         <div class="blog-card-content">
                             <div class="blog-card-title" v-html="b.title || '无标题'"></div>
                             <div class="blog-card-footer">
                                <div class="blog-card-user" @click.stop="toUser(b)">
                                    <img :src="b.icon || '/imgs/icons/default-icon.png'">
                                    <span class="name" v-html="b.nickName || b.name"></span>
                                </div>
                                <div class="blog-card-like" @click.stop="addLike(b)">
                                    <svg t="1646634642977" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2187" width="14" height="14">
                                      <path d="M160 944c0 8.8-7.2 16-16 16h-32c-26.5 0-48-21.5-48-48V528c0-26.5 21.5-48 48-48h32c8.8 0 16 7.2 16 16v448zM96 416c-53 0-96 43-96 96v416c0 53 43 96 96 96h96c17.7 0 32-14.3 32-32V448c0-17.7-14.3-32-32-32H96zM505.6 64c16.2 0 26.4 8.7 31 13.9 4.6 5.2 12.1 16.3 10.3 32.4l-23.5 203.4c-4.9 42.2 8.6 84.6 36.8 116.4 28.3 31.7 68.9 49.9 111.4 49.9h271.2c6.6 0 10.8 3.3 13.2 6.1s5 7.5 4 14l-48 303.4c-6.9 43.6-29.1 83.4-62.7 112C815.8 944.2 773 960 728.9 960h-317c-33.1 0-59.9-26.8-59.9-59.9v-455c0-6.1 1.7-12 5-17.1 69.5-109 106.4-234.2 107-364h41.6z m0-64h-44.9C427.2 0 400 27.2 400 60.7c0 127.1-39.1 251.2-112 355.3v484.1c0 68.4 55.5 123.9 123.9 123.9h317c122.7 0 227.2-89.3 246.3-210.5l47.9-303.4c7.8-49.4-30.4-94.1-80.4-94.1H671.6c-50.9 0-90.5-44.4-84.6-95l23.5-203.4C617.7 55 568.7 0 505.6 0z" p-id="2188" :fill="b.isLike ? '#ff6633' : '#82848a'"></path>
                                    </svg>
                                    {{b.liked || 0}}
                                </div>
                             </div>
                         </div>
                      </div>
                   </div>
               </div>

               <!-- User Results -->
               <div v-if="activeTab === 'user'">
                    <div v-if="userList.length===0" class="empty-result">
                      <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiByeD0iOCIgZmlsbD0iI0Y4RjlGQSIvPgo8cGF0aCBkPSJNNDAgNDJMMzIgMzRMMzQgMzJMNDAgMzhMNDYgMzJMNDggMzRMNDAgNDJaIiBmaWxsPSIjQzBDNEY0Ii8+CjxwYXRoIGQ9Ik00MCA0MkwzMiAzNEwzNCAzMkw0MCAzOEw0NiAzMkw0OCAzNEw0MCA0MloiIGZpbGw9IiNDMEM0RjQiLz4KPC9zdmc+Cg==">
                      <p>暂无相关用户</p>
                       <span class="sub-text">换个关键词试试吧</span>
                    </div>
                   <div v-for="u in userList" :key="u.id" class="user-box" @click="toUser(u)">
                       <div class="user-avatar"><img :src="u.icon || '/imgs/icons/default-icon.png'"></div>
                       <div class="user-info">
                            <div class="user-name" v-html="u.nickName || '未命名'"></div>
                            <div class="user-desc">{{u.introduce || '这个人很懒，什么都没写'}}</div>
                       </div>
                       <button class="follow-btn" :class="{'following': u.isFollow}" @click.stop="toggleFollow(u)" v-if="user && u.id !== user.id">
                           {{u.isFollow ? '已关注' : '关注'}}
                       </button>
                   </div>
               </div>
            </div>
        </div>
    </div>
  </div>
</template>

<script>
import { getShopTypes } from "@/api/shop";
import {
  searchShops,
  searchBlogs,
  searchUsers,
  searchVouchers,
  getHotSearch,
  getSearchHistory,
  addSearchHistory,
  clearSearchHistory,
} from "@/api/search";
import { buyVoucherAPI, seckillVoucherAPI } from '@/api/shop';
import { likeBlog } from '@/api/interaction';
import { followUserBoolean } from "@/api/interaction";
import { getCurrentUser } from "@/api/user";
import { locationUtil } from '@/utils/location';

export default {
  name: "SearchIndex",
  data() {
    return {
      keyword: "",
      activeTab: "shop",
      
      // Data Lists
      shopList: [],
      blogList: [],
      userList: [],
      voucherList: [],
      
      isLoading: false,
      locationLoading: false,
      locationSuccess: false,
      locationError: false,
      showLocationStatus: false,
      user: {},
      userLocation: null,

      // History & Hot
      hasSearched: false,
      searchHistory: [],
      hotSearch: ["火锅", "奶茶", "咖啡", "日料", "烧烤", "甜品", "自助餐", "川菜", "美食探店"],

      // Filters
      activeFilterTab: "", // 'type', 'distance', 'score', 'vType', 'status', 'vShopType'
      shopTypes: [],
      
      // Filter State
      selectedShopType: null,
      selectedDistance: null,
      selectedScore: null,
      
      selectedVoucherType: null,
      selectedStatus: null,
      selectedVoucherShopType: null,
      
      selectedBlogType: null,

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
      voucherTypeOptions: [
         { label: "普通券", value: 0 },
         { label: "秒杀券", value: 1 },
         { label: "全部", value: null } 
      ],
      statusOptions: [
        { label: "上架", value: 1 },
        { label: "下架", value: 2 },
        { label: "过期", value: 3 },
        { label: "全部", value: null }
      ],

      page: 1,
      loadingMore: false,
      noMore: false,
    };
  },
  // ...
  computed: {
    locationStatusText() {
      if (this.locationLoading) return "正在定位...";
      if (this.locationSuccess) return "定位成功";
      if (this.locationError) return "定位失败";
      return "";
    },
    hasSelectedFilters() {
      return (
        this.selectedShopType ||
        this.selectedDistance ||
        this.selectedScore ||
        this.selectedVoucherType ||
        this.selectedBlogType
      );
    },
    seckillVouchers() {
        return this.voucherList.filter(v => v.type == 1);
    },
    normalVouchers() {
        return this.voucherList.filter(v => v.type != 1); // Show all non-seckill as normal
    },
  },
  created() {
    this.checkLogin();
    this.loadShopTypes();
    this.reGetLocation();
    this.loadHotSearch();
  },
  mounted() {
    // window.addEventListener('scroll', this.onScroll);
  },
  beforeUnmount() {
    // window.removeEventListener('scroll', this.onScroll);
  },
  methods: {
    checkLogin() {
      getCurrentUser()
        .then((res) => {
          this.user = res || {};
          this.loadHistory();
        })
        .catch(() => {
          this.loadHistory();
        });
    },
    loadHistory() {
      if (this.user.id) {
        getSearchHistory({ userId: this.user.id }).then((res) => {
          this.searchHistory = res.data || [];
        });
      } else {
        const h = localStorage.getItem("searchHistory");
        if (h) this.searchHistory = JSON.parse(h);
      }
    },
    loadHotSearch() {
      getHotSearch().then((res) => {
        if (res.data && res.data.length > 0) {
           this.hotSearch = res.data;
        }
      }).catch(e => {
        console.warn("Using default hot search");
      });
    },
    saveHistory(kw) {
      if (!kw) return;
      let set = new Set(this.searchHistory);
      set.delete(kw);
      const arr = [kw, ...set].slice(0, 10);
      this.searchHistory = arr;

      if (this.user.id) {
        addSearchHistory({ userId: this.user.id, keyword: kw });
      } else {
        localStorage.setItem("searchHistory", JSON.stringify(arr));
      }
    },
    clearHistory() {
      if (this.user.id) {
        clearSearchHistory({ userId: this.user.id }).then(() => {
          this.searchHistory = [];
        });
      } else {
        this.searchHistory = [];
        localStorage.removeItem("searchHistory");
      }
    },
    searchFromHistory(kw) {
      this.keyword = kw;
      this.doSearch();
    },
    loadShopTypes() {
      getShopTypes().then((res) => {
         let data = res;
         if (res && res.data) data = res.data;
         this.shopTypes = data || [];
      });
    },
    getShopTypeName(id) {
      const t = this.shopTypes.find((t) => t.id === id);
      return t ? t.name : "";
    },
    getVoucherTypeName(val) {
        const t = this.voucherTypeOptions.find(t => t.value === val);
        return t ? t.label : "";
    },

    // Filter Logic
    toggleFilterTab(tab) {
      this.activeFilterTab = this.activeFilterTab === tab ? "" : tab;
    },
    selectShopType(id) {
      this.selectedShopType = this.selectedShopType === id ? null : id;
      this.activeFilterTab = "";
      this.doSearch();
    },
    selectDistance(d) {
      this.selectedDistance = d.label === "全部" ? null : d.label;
      this.activeFilterTab = "";
      this.doSearch();
    },
    selectScore(s) {
      this.selectedScore = s.label === "全部" ? null : s.label;
      this.activeFilterTab = "";
      this.doSearch();
    },
    selectVoucherType(t) {
        this.selectedVoucherType = t.label === "全部" ? null : t.value;
        this.activeFilterTab = "";
        this.doSearch();
    },
    clearAllFilters() {
      this.selectedShopType = null;
      this.selectedDistance = null;
      this.selectedScore = null;
      this.selectedScore = null;
      this.selectedVoucherType = null;
      this.selectedBlogType = null;
      this.doSearch();
    },
    changeTab(tab) {
        this.activeTab = tab;
        this.doSearch();
    },
    getStatusName(val) {
        const s = this.statusOptions.find(o => o.value === val);
        return s ? s.label : "";
    },
    selectStatus(s) {
        this.selectedStatus = s.label === "全部" ? null : s.value;
        this.activeFilterTab = "";
        this.doSearch();
    },
    selectVoucherShopType(id) {
        this.selectedVoucherShopType = id;
        this.activeFilterTab = "";
        this.doSearch();
    },
    selectBlogType(id) {
        this.selectedBlogType = this.selectedBlogType === id ? null : id;
        this.activeFilterTab = "";
        this.doSearch();
    },
    // Main Search
    doSearch(isLoadMore = false) {
       // if (!this.keyword && !this.hasSelectedFilters) { ... }
      if (this.keyword && !isLoadMore) this.saveHistory(this.keyword);
      
      if (!isLoadMore) {
          this.hasSearched = true;
          this.isLoading = true;
          this.page = 1;
          this.noMore = false;
          // Clear only if new search
          this.shopList = [];
          this.blogList = [];
          this.userList = [];
          this.voucherList = [];
      } else {
          this.loadingMore = true;
          this.page++;
      }

      const promises = [];
      const pageParams = { page: this.page, size: 10 };

        // SHOP
        if (this.activeTab === "shop") {
          const filters = {};
          if (this.selectedShopType) filters.typeId = this.selectedShopType;
          if (this.selectedScore) {
            const s = this.scoreOptions.find((o) => o.label === this.selectedScore);
            if (s) filters.minScore = s.value;
          }
           // Remove distance from filters object as it is passed at top level
  
          const data = {
            keyword: this.keyword,
            filters,
            ...pageParams,
            // Match search.html params
            lat: this.userLocation ? this.userLocation.y : undefined,
            lon: this.userLocation ? this.userLocation.x : undefined,
            // Default to 'all' if no selection
            distance: this.selectedDistance 
                      ? (this.distanceOptions.find(o => o.label === this.selectedDistance)?.value || "all") 
                      : "all"
          };
          

          promises.push(
            searchShops(data).then((res) => {
              let list = [];
              if (Array.isArray(res)) list = res;
              else if (res && Array.isArray(res.list)) list = res.list;
              else if (res && res.data && Array.isArray(res.data.list)) list = res.data.list;

              list.forEach((s) => {
                if (s.images) s.images = this.$fileURL + s.images.split(",")[0];
              });
              
              if(isLoadMore) {
                  this.shopList = [...this.shopList, ...list];
              } else {
                  this.shopList = list;
                  this.isLoading = false;
              }
              this.loadingMore = false;
              if (list.length < 10) this.noMore = true;
            }).catch(() => {
                this.isLoading = false;
                this.loadingMore = false;
            })
          );
        }


        
        // VOUCHER
        if (this.activeTab === "voucher") {
             const filters = {};
             if(this.selectedVoucherShopType) filters.shopTypeId = this.selectedVoucherShopType;
             if(this.selectedVoucherType !== null) filters.type = this.selectedVoucherType; // 0 or 1
             if(this.selectedStatus !== null) filters.status = this.selectedStatus;
             
             const data = {
                 ...pageParams,
                 keyword: this.keyword,
                 lat: this.userLocation ? this.userLocation.y : undefined,
                 lon: this.userLocation ? this.userLocation.x : undefined,
                 filters
             };
             // Note: API for searchVouchers might differ, check if it accepts filters obj or flat.
             // Assuming similar structure or flattening if needed.
             // Actually backend might expect flat params for some. But standard pattern is object.
             
             promises.push(
               searchVouchers(data).then(res => {
                   let list = [];
                  if(Array.isArray(res)) list = res;
                  else if(res && Array.isArray(res.list)) list = res.list;
                  else if(res && Array.isArray(res.data)) list = res.data;
                  else if(res && res.data && Array.isArray(res.data.list)) list = res.data.list;
                  else if(res && res.data && Array.isArray(res.data.records)) list = res.data.records;
                  else if(res && res.data && res.data.data && Array.isArray(res.data.data.list)) list = res.data.data.list;
                  else if(res && res.data && res.data.data && Array.isArray(res.data.data.records)) list = res.data.data.records;
                  
                  this.voucherList = list || [];
                  this.isLoading = false;
               }).catch(() => this.isLoading = false)
             );
        }
        
      // BLOG
      if (this.activeTab === "blog") {
        const filters = {};
        if (this.selectedBlogType) {
           filters.typeId = this.selectedBlogType;
        }
        
        const params = {
           keyword: this.keyword, 
           filters,
           ...pageParams 
        };

        promises.push(
          searchBlogs(params).then((res) => {
            let list = [];
            if (Array.isArray(res)) list = res;
            else if (res && Array.isArray(res.list)) list = res.list;
            else if (res && res.data && Array.isArray(res.data.list)) list = res.data.list;

            list.forEach((b) => {
              // 1. Clean Title (handle Highlight tags escaping)
              if (b.title) {
                 // If title contains &lt;span, unescape it
                 b.title = b.title.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');
              }

              // 2. Process Images
              let img = b.images;
              // If images is raw HTML (highlighted), strip tags
              if (img && (img.indexOf('<') > -1 || img.indexOf('&lt;') > -1)) {
                 img = img.replace(/<[^>]+>/g, "").replace(/&lt;[^&]+&gt;/g, "");
              }

              if (img) {
                 b.images = img.split(",")[0];
                 if (b.images && !b.images.startsWith("http")) b.images = this.$fileURL + b.images;
              } else if (b.content) {
                 // Fallback: extract first image from content
                 const match = b.content.match(/<img[^>]+src="([^">]+)"/);
                 if (match) {
                    let src = match[1];
                    if (src && !src.startsWith("http")) src = this.$fileURL + src;
                    b.images = src;
                 }
              }

              if (b.icon) b.icon = this.$fileURL + b.icon;
            });
            if(isLoadMore) {
                this.blogList = [...this.blogList, ...list];
            } else {
                this.blogList = list;
                this.isLoading = false;
            }
            this.loadingMore = false;
            if (list.length < 10) this.noMore = true;
          }).catch(() => {
              this.isLoading = false;
              this.loadingMore = false;
          })
        );
      }

      // USER
      if (this.activeTab === "user") {
        promises.push(
          searchUsers({ keyword: this.keyword, ...pageParams }).then((res) => {
            let list = [];
            if (Array.isArray(res)) list = res;
            else if (res && Array.isArray(res.list)) list = res.list;
            else if (res && res.data && Array.isArray(res.data.list)) list = res.data.list;

            list.forEach((u) => {
              if (u.icon) u.icon = this.$fileURL + u.icon;
            });
            if(isLoadMore) {
                this.userList = [...this.userList, ...list];
            } else {
                this.userList = list;
                this.isLoading = false;
            }
            this.loadingMore = false;
            if (list.length < 10) this.noMore = true;
          }).catch(() => {
              this.isLoading = false;
              this.loadingMore = false;
          })
        );
      }

      // VOUCHER
      if (this.activeTab === "voucher") {
        const filters = {};
        if(this.selectedVoucherType !== null) filters.type = this.selectedVoucherType;
        if(this.selectedStatus !== null) filters.status = this.selectedStatus;
        if(this.selectedVoucherShopType !== null) filters.shopTypeId = this.selectedVoucherShopType;
        
        promises.push(
          searchVouchers({ keyword: this.keyword, filters, ...pageParams }).then((res) => {
             let list = [];
             if (Array.isArray(res)) list = res;
             else if (res && Array.isArray(res.list)) list = res.list;
             else if (res && res.data && Array.isArray(res.data.list)) list = res.data.list;
             if(isLoadMore) {
                 this.voucherList = [...this.voucherList, ...list];
             } else {
                 this.voucherList = list || [];
                 this.isLoading = false;
             }
             this.loadingMore = false;
             if ((list || []).length < 10) this.noMore = true;
          }).catch(() => {
              this.isLoading = false;
              this.loadingMore = false;
          })
        );
      }

      Promise.all(promises).finally(() => {
        setTimeout(() => {
            this.isLoading = false;
        }, 300);
      });
    },
    onScroll(e) {
       const el = e.target;

       if(this.loadingMore || this.noMore || !this.hasSearched || this.isLoading) return;

       if (el.scrollTop + el.clientHeight >= el.scrollHeight - 100) {
           this.doSearch(true);
       }
    },

    // Voucher Helpers
    isNotBegin(v) {
         if(!v.beginTime) return false;
         return new Date(v.beginTime).getTime() > new Date().getTime();
    },
    isEnd(v) {
         if(!v.endTime) return false;
         return new Date(v.endTime).getTime() < new Date().getTime();
    },
    doBuy(v) {
         if(!localStorage.getItem("token")) {
             this.$message.warning("请先登录");
             setTimeout(() => {
                location.href = "/login.html";
             }, 200);
             return;
         }
         
         buyVoucherAPI(v.id).then(res => {
             this.$message.success("抢购成功，订单ID: " + (res.data || res));
         }).catch(err => {
             this.$message.error(err.message || '抢购失败');
         });
    },
    doSeckill(v) {
         if(!localStorage.getItem("token")) {
             this.$message.warning("请先登录");
             setTimeout(() => {
                location.href = "/login.html";
             }, 200);
             return;
         }
         if(this.isNotBegin(v)) return this.$message.warning("抢购未开始");
         if(this.isEnd(v)) return this.$message.warning("抢购已结束");
         if(v.stock < 1) return this.$message.warning("已抢光");
         
         seckillVoucherAPI(v.id).then(res => {
             this.$message.success("秒杀成功，订单ID: " + (res.data || res));
             v.stock--; 
         }).catch(err => {
             this.$message.error(err.message || '抢购失败');
         });
    },

    goBack() {
      this.$router.go(-1);
    },
    reGetLocation() {
      this.locationLoading = true;
      locationUtil.getLocation().then(loc => {
         this.userLocation = loc;
         this.locationSuccess = true;
      }).catch(() => {
         this.locationError = true;
      }).finally(() => {
         this.locationLoading = false;
      });
    },
    toShopDetail(shop) {
      this.$router.push({ path: "/shop/detail", query: { id: shop.id } });
    },
    toShopDetail(shop) {
       // Handle both Shop object and Voucher object (which has shopId)
       const id = shop.shopId || shop.id;
       if(id) {
           this.$router.push("/shop/detail?id=" + id);
       }
    },
    toBlogDetail(b) {
      this.$router.push({
        path: "/blog/detail",
        query: { id: b.id },
      });
    },
    toUser(u) {
      if(this.user && u.id === this.user.id) {
         this.$router.push('/info');
      } else {
         this.$router.push(`/user-info/${u.id}`);
      }
    },
    addLike(b) {
       if (!localStorage.getItem("token")) {
           this.$message.warning("请先登录");
           setTimeout(() => {
              location.href = '/login.html';
           }, 1000);
           return;
       }
       
       const originalLike = b.isLike;
       const originalCount = b.liked;
       
       b.isLike = !b.isLike;
       b.liked = b.isLike ? (b.liked + 1) : (b.liked - 1);
       
       likeBlog({ sourceType: 3, sourceId: b.id }).catch(() => {
           b.isLike = originalLike;
           b.liked = originalCount;
           this.$message.error('操作失败');
       });
    },
    formatDateHeader(dateStr) {
      if(!dateStr) return '';
      // Format 2024-01-01T12:00:00 to "01月01日 12:00"
      const date = new Date(dateStr);
      const m = (date.getMonth() + 1).toString().padStart(2, '0');
      const d = date.getDate().toString().padStart(2, '0');
      const h = date.getHours().toString().padStart(2, '0');
      const min = date.getMinutes().toString().padStart(2, '0');
      return `${m}月${d}日 ${h}:${min}`;
    },
    formatDistance(d) {
      if (!d) return "";
      if (d < 1000) return d + "m";
      return (d / 1000).toFixed(1) + "km";
    },
    toggleFollow(u) {
      if(!this.user.id) {
          this.$message.warning("请先登录");
          setTimeout(() => {
             this.$router.push('/user/login');
          }, 1000);
          return;
      }
      const newStatus = !u.isFollow;
      followUserBoolean(u.id, newStatus).then(() => {
        u.isFollow = newStatus;
        this.$message.success(newStatus ? '关注成功' : '已取消关注');
      });
    },
  },
};
</script>

<style scoped>
.search-page {
  background: #f5f5f5;
  height: 100vh;
  overflow-y: auto;
}
.search-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: white;
  padding: 10px 15px;
  display: flex;
  align-items: center;
  gap: 12px;
  gap: 12px;
  gap: 0; /* Handled by children */
  box-shadow: none;
  border-bottom: 1px solid #f5f5f5;
}
.back-btn {
  height: 44px;
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  color: #f63;
  cursor: pointer;
  margin-right: 2px;
}
/* Custom AI Search Bar */
.custom-search-bar {
  flex: 1;
  display: flex;
  align-items: center;
  height: 44px; /* Taller pill */
  border: 1px solid #ff9c00; /* Orange border */
  border-radius: 22px;
  background: white;
  padding: 0 4px 0 12px;
  position: relative;
  box-shadow: 0 2px 8px rgba(255, 102, 51, 0.05);
}
.simple-input-container {
  flex: 1;
  display: flex;
  align-items: center;
  position: relative;
}
.native-search-input {
  width: 100%;
  border: none;
  background: transparent;
  padding: 0;
  height: 40px;
  line-height: 40px;
  font-size: 14px;
  color: #333;
  outline: none;
}
.native-search-input::placeholder {
  color: #bbb;
}
.clear-icon {
  position: absolute;
  right: 0;
  font-size: 16px;
  color: #ccc;
  cursor: pointer;
  padding: 10px;
}
.search-btn-inner {
  background: linear-gradient(90deg, #ff9c00, #f63);
  color: white;
  border-radius: 18px;
  padding: 0 24px;
  height: 36px;
  line-height: 36px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(255, 102, 51, 0.2);
  transition: transform 0.2s;
}
.search-btn-inner:active {
  transform: scale(0.95);
}
.cancel-text-btn {
  font-size: 15px;
  color: #666;
  margin-left: 4px;
  cursor: pointer;
  padding: 8px 4px;
}

/* Filter Tabs */
.search-filters {
  display: flex;
  background: white;
  padding: 0 15px;
  border-bottom: 1px solid #f5f5f5;
  justify-content: space-between;
}
.filter-tab {
   flex: 1;
   text-align: center;
   font-size: 15px;
   color: #666;
   padding: 12px 0;
   font-weight: 500;
   position: relative;
   transition: color 0.3s;
}
.filter-tab.active {
   color: #333;
   font-weight: bold;
   font-size: 16px;
}
.filter-tab.active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 20px;
    height: 3px;
    background: linear-gradient(90deg, #ff9c00, #f63);
    border-radius: 2px;
}

/* Meituan Style Filter Bar */
.category-filter-area { position: relative; z-index: 90; }
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
}
.filter-item.active { color: #F63; }
.filter-text i { margin-left: 4px; font-size: 12px; }

/* Filter Dropdown Content */
.filter-content {
  position: absolute;
  top: 100%;
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
}
.shop-type-item.active { background: #fff0eb; color: #F63; }

.distance-option, .score-option {
    padding: 12px 0;
    border-bottom: 1px solid #f9f9f9;
    font-size: 14px;
    color: #333;
}
.distance-option.active, .score-option.active { color: #F63; }

/* Selected Filter Tags */
.selected-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    padding: 10px 15px;
    background: #fff;
    border-bottom: 1px solid #eee;
}
.selected-filter-tag {
    background: #fff0eb;
    color: #F63;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 12px;
    display: flex;
    align-items: center;
}
.selected-filter-tag .close { margin-left: 5px; font-size: 14px; cursor: pointer; }
.clear-all { margin-left: auto; color: #999; font-size: 12px; display: flex; align-items: center; }

/* Results */
.search-results {
  padding: 8px 10px; /* Reduced from 12px */
}
.shop-box {
  background: white;
  border-radius: 8px; /* Reduced from 12px for tighter feel */
  padding: 10px; /* Reduced from 12px */
  display: flex;
  margin-bottom: 8px; /* Reduced from 12px */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: transform 0.2s, box-shadow 0.2s;
}
.shop-box:active {
  transform: scale(0.98);
}
.shop-img {
  width: 88px;
  height: 88px;
  border-radius: 8px;
  overflow: hidden;
  margin-right: 12px;
  flex-shrink: 0;
  border: 1px solid #f2f2f2;
}
.shop-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.shop-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 2px 0;
}
.shop-title {
  font-weight: 700;
  font-size: 16px;
  color: #333;
  line-height: 1.3;
}
.shop-rate {
  display: flex;
  align-items: center;
  font-size: 11px;
  color: #666;
  margin: 6px 0;
}
.shop-avg {
  margin-left: 6px;
  color: #f63;
  font-weight: 600;
}
.shop-comments {
  margin-left: auto; /* Push to right */
  color: #999;
}
.shop-area {
  font-size: 12px;
  color: #999;
  display: flex;
  justify-content: space-between; /* Area left, Distance right */
}
.shop-avg-price {
  font-size: 12px;
  color: #666;
  margin-top: 2px;
}
.shop-address {
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
  margin-top: 4px;
}
.shop-address i {
  margin-right: 4px;
}

/* Voucher Box */
.voucher-box {
  background: white;
  padding: 15px;
  border-radius: 12px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
}
.voucher-box::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 6px;
  background: linear-gradient(180deg, #ff9c00 0%, #f63 100%);
}
.voucher-box::after {
  content: "";
  position: absolute;
  left: -6px;
  top: 50%;
  transform: translateY(-50%);
  width: 12px;
  height: 12px;
  background: white;
  border-radius: 50%;
  box-shadow: inset 1px 0 2px rgba(0, 0, 0, 0.1);
}
.voucher-left {
  flex: 1;
  margin-left: 15px;
}
.voucher-title {
  font-weight: 700;
  font-size: 15px;
  color: #333;
}
.voucher-sub {
  font-size: 11px;
  color: #999;
  margin: 6px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
/* Voucher Box */
.voucher-box {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  margin-bottom: 8px; /* Reduced from 12px */
  display: flex;
  align-items: center;
  padding: 10px; /* Reduced from 12px/15px */
  position: relative;
  border-left: 4px solid #F56C6C;
}
/* Seckill box distinct style */
.seckill-wrapper .voucher-box {
    background: #fffbf0;
    border-left: 4px solid #E6A23C;
}

.voucher-left {
  flex: 1;
  padding: 0 10px;
}
.voucher-title {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin-bottom: 6px;
}
/* Seckill title red */
.seckill-wrapper .voucher-title {
    color: #F56C6C;
}

.voucher-shop {
  font-size: 12px;
  color: #909399;
  margin-bottom: 5px;
  display: flex;
  align-items: center;
}
.voucher-shop-name {
    color: #409EFF;
    margin-left: 4px;
    font-weight: 500;
}
.voucher-subtitle {
  font-size: 12px;
  color: #909399;
  margin-bottom: 5px;
}
.voucher-price {
  display: flex;
  align-items: center;
  gap: 8px;
}
.p-symbol { font-size: 12px; color: #F56C6C; font-weight: bold; }
.p-val { font-size: 18px; font-weight: bold; color: #F56C6C; }
.p-disc {
  font-size: 11px;
  color: #F56C6C;
  background: rgba(245, 108, 108, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}

.voucher-right {
  flex-shrink: 0;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* Seckill Badge */
.seckill-badge {
    position: absolute;
    top: 0;
    right: 0;
    background: #F56C6C;
    color: white;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 0 0 0 4px;
}

.seckill-layout {
    display: flex;
    flex-direction: column;
    align-items: center;
}
.seckill-stock {
    font-size: 10px;
    color: #F56C6C;
    margin-top: 4px;
}
.seckill-time {
    font-size: 10px;
    color: #E6A23C;
    background: #fdf6ec;
    padding: 2px 8px;
    border-radius: 10px;
    margin-top: 6px;
}

/* Buttons */
.voucher-btn {
  padding: 6px 16px;
  background: #F56C6C;
  color: white;
  border: none;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(245, 108, 108, 0.2);
}
.seckill-btn {
    background: linear-gradient(135deg, #e6a23c 0%, #f56c6c 100%);
    box-shadow: 0 2px 6px rgba(230, 162, 60, 0.3);
    padding: 6px 20px;
}

/* History */
.initial-area {
  background: white;
  margin-top: 10px;
  min-height: calc(100vh - 60px);
  border-radius: 16px 16px 0 0;
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.02);
}
.search-history,
.hot-search {
  padding: 24px 20px;
}
.history-title,
.hot-title {
  display: flex;
  justify-content: space-between;
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}
.history-tags,
.hot-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.history-tag,
.hot-tag {
  padding: 8px 16px;
  background: #f7f8fa;
  border-radius: 20px;
  font-size: 13px;
  color: #333;
  transition: all 0.2s;
}
.history-tag:active,
.hot-tag:active {
  background: #ebedf0;
}
.hot-tag.hot {
  color: #f63;
  background: #fff0eb;
  font-weight: 500;
}
/* User Box */
.user-box {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  margin-bottom: 8px; /* Reduced from 12px */
  display: flex;
  align-items: center;
  padding: 10px; /* Reduced from 15px */
  transition: all 0.3s;
}
.user-box:active {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}
.user-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 15px;
  flex-shrink: 0;
}
.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.user-info {
  flex: 1;
  min-width: 0;
}
.user-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 5px;
}
.user-desc {
  font-size: 13px;
  color: #909399;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.follow-btn {
  padding: 7px 18px;
  border: 1px solid #409EFF;
  border-radius: 18px;
  color: #409EFF;
  font-size: 13px;
  background: white;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 500;
  margin-left: 10px;
}
.follow-btn.following {
  background: #f0f0f0;
  color: #999;
  border-color: #f0f0f0;
}

/* Blog Styles Update */
.blog-content {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}
.blog-foot {
  display: flex;
  align-items: center;
  margin-top: 6px;
}
.blog-user {
    display: flex;
    align-items: center;
    flex: 1;
}
.blog-user img {
    border-radius: 50%;
}
.user-icon {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  margin-right: 5px;
}
.user-name {
    font-size: 11px;
    color: #666;
}
.blog-liked {
    font-size: 11px;
    color: #999;
    display: flex;
    align-items: center;
    gap: 4px;
}

/* Blog Grid Layout - Optimized Spacing */
.blog-list-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  padding: 0; /* Remove padding here, rely on parent search-results padding (8px) or set small */
}
.blog-card {
  background: white;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  display: flex; /* Flex column for equal height if needed */
  flex-direction: column;
}
.blog-card-image {
  width: 100%;
  height: 140px; /* Fixed height match Home */
  background: #f8f9fa; /* Placeholder bg */
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.blog-card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.no-img-placeholder {
    color: #eee;
    font-size: 24px;
}
.blog-card-content {
  padding: 8px 6px;
  flex: 1;
  display: flex;
  flex-direction: column;
}
.blog-card-title {
  font-size: 14px;
  color: #333;
  line-height: 1.4;
  margin-bottom: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-weight: 500;
}
.blog-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
}
.blog-card-user {
  display: flex;
  align-items: center;
  max-width: 70%;
}
.blog-card-user img {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  margin-right: 4px;
  flex-shrink: 0;
}
.blog-card-user .name {
  font-size: 11px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.blog-card-like {
  font-size: 11px;
  color: #999;
  display: flex;
  align-items: center;
}
.blog-card-like i {
  margin-right: 2px;
}

/* Empty Result */
.empty-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: #999;
}
.empty-result img {
  width: 100px;
  height: 100px;
  margin-bottom: 20px;
  opacity: 0.8;
}
.empty-result p {
  font-size: 15px;
  color: #666;
  margin-bottom: 5px;
}
.empty-result .sub-text {
  font-size: 12px;
  color: #ccc;
}
</style>
