<template>
  <PageLayout :loading="pageLoading" skeleton-type="list" class="search-page" @scroll="onScroll">
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
             :placeholder="searchPlaceholder"
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

       <div class="hot-search" v-if="hotSearch.length > 0">
          <div class="hot-title">热门搜索</div>
          <div class="hot-tags">
             <div class="hot-tag" :class="{hot: index < 3}" v-for="(item, index) in hotSearch" :key="item" @click="searchFromHistory(item)">
               {{item}}
             </div>
          </div>
       </div>
    </div>

    <!-- Main Content (Show WHEN searched) -->
    <div
      v-else
      class="search-main-content"
      @touchstart.capture.passive="onTouchStart"
      @touchmove.capture.passive="onTouchMove"
      @touchend.capture="onTouchEnd"
    >
        <van-tabs v-model:active="activeTab" swipeable type="line" animated sticky offset-top="54px" color="#ff6633" title-active-color="#ff6633" :ellipsis="false" @change="onTabChange">
            
            <!-- SHOP TAB -->
            <van-tab title="店铺" name="shop">
                <div class="tab-content">
                    <!-- Shop Filter Bar -->
                    <div class="filter-wrapper">
                        <div class="meituan-filter-bar">
                        <div class="filter-item" :class="{active: activeFilterTab==='type'}" @click="toggleFilterTab('type')">
                            <div class="filter-text">{{selectedShopType ? getShopTypeName(selectedShopType) : '分类'}} <i class="el-icon-arrow-down"></i></div>
                        </div>
                        <div class="filter-item" :class="{active: activeFilterTab==='distance'}" @click="toggleFilterTab('distance')">
                            <div class="filter-text">{{selectedDistance || '距离'}} <i class="el-icon-arrow-down"></i></div>
                        </div>
                        <div class="filter-item" :class="{active: activeFilterTab==='score'}" @click="toggleFilterTab('score')">
                            <div class="filter-text">{{selectedScore || '评分'}} <i class="el-icon-arrow-down"></i></div>
                        </div>
                         <div class="filter-item" :class="{active: activeFilterTab==='sort'}" @click="toggleFilterTab('sort')">
                             <div class="filter-text">{{selectedSort ? getSortLabel(selectedSort) : '智能排序'}} <i class="el-icon-arrow-down"></i></div>
                         </div>
                    </div>
                    
                                        <div class="filter-content" :class="{show: ['type','distance','score','sort'].includes(activeFilterTab)}">
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
               <!-- Sort -->
               <div v-if="activeFilterTab==='sort'" class="score-panel">
                  <div class="score-options">
                     <div class="score-option" :class="{active: selectedSort===s.value}" v-for="s in sortOptions" :key="s.value" @click="selectSort(s)">{{s.label}}</div>
                  </div>
               </div>
                    </div>
                    </div>
                    <!-- Selected Tags -->
                    <div class="selected-filters" v-if="selectedShopType || selectedDistance || selectedScore || (selectedSort && selectedSort !== 'hot')">
                          <div class="selected-filter-tag" v-if="selectedShopType">{{getShopTypeName(selectedShopType)}} <span class="close" @click="selectShopType(selectedShopType)">×</span></div>
                          <div class="selected-filter-tag" v-if="selectedDistance">{{selectedDistance}} <span class="close" @click="selectedDistance=null;triggerSearch()">×</span></div>
                          <div class="selected-filter-tag" v-if="selectedScore">{{selectedScore}} <span class="close" @click="selectedScore=null;triggerSearch()">×</span></div>
                           <div class="selected-filter-tag" v-if="selectedSort && selectedSort !== 'hot'">{{getSortLabel(selectedSort)}} <span class="close" @click="selectedSort='hot';triggerSearch()">×</span></div>
                          <div class="clear-all" @click="clearAllFilters">清除全部</div>
                    </div>

                    <!-- Shop Results -->
                    <div v-if="isLoading" class="loading-box"><i class="el-icon-loading"></i> 加载中...</div>
                    <div v-else>
                        <div v-if="shopList.length===0" class="empty-result">
                            <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiByeD0iOCIgZmlsbD0iI0Y4RjlGQSIvPgo8cGF0aCBkPSJNNDAgNDJMMzIgMzRMMzQgMzJMNDAgMzhMNDYgMzJMNDggMzRMNDAgNDJaIiBmaWxsPSIjQzBDNEY0Ii8+CjxwYXRoIGQ9Ik00MCA0MkwzMiAzNEwzNCAzMkw0MCAzOEw0NiAzMkw0OCAzNEw0MCA0MloiIGZpbGw9IiNDMEM0RjQiLz4KPC9zdmc+Cg==">
                            <p>暂无相关店铺</p>
                            <span class="sub-text">换个关键词试试吧</span>
                        </div>
                        <div class="shop-box" v-for="shop in shopList" :key="shop.id" @click="toShopDetail(shop)">
                            <div class="shop-img">
                                <img :src="shop.images || '/imgs/default-shop.jpg'" :class="{ 'is-loaded': shop.imgLoaded }" loading="lazy" decoding="async" @error="handleImgError($event, shop)" @load="shop.imgLoaded=true" alt="" />
                                <div class="img-skeleton" v-if="!shop.imgError && !shop.imgLoaded"></div>
                            </div>
                            <div class="shop-info">
                                <div class="shop-title" v-html="shop.name"></div>
                                <div class="shop-rate">
                                    <el-rate disabled :model-value="shop.score/10" text-color="#F63" :size="12"></el-rate>
                                    <span class="shop-score">{{(shop.score/10).toFixed(1)}}分</span>
                                    <span class="shop-price" v-if="shop.avgPrice">￥{{ shop.avgPrice }}/人</span>
                                </div>
                                <div class="shop-area">
                                    <span class="area-text">{{shop.area || '未知区域'}} <span v-if="getShopTypeName(shop.typeId)">| {{getShopTypeName(shop.typeId)}}</span></span>
                                    <span class="distance-text" v-if="shop.distance">{{formatDistance(shop.distance)}}</span>
                                </div>
                                <div class="shop-comments" v-if="shop.comments">
                                    <span>{{shop.comments}}条评价</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </van-tab>
            <!-- VOUCHER TAB -->
            <van-tab title="代金券" name="voucher">
                 <div class="tab-content">
                      <!-- Product Filter Bar (Reused) -->
                      <div class="filter-wrapper">
                        <div class="meituan-filter-bar">
                          <div class="filter-item" :class="{active: activeFilterTab==='pType'}" @click="toggleFilterTab('pType')">
                              <div class="filter-text">{{selectedProductType !== null ? getProductTypeName(selectedProductType) : '类型'}} <i class="el-icon-arrow-down"></i></div>
                           </div>
                           <div class="filter-item" :class="{active: activeFilterTab==='status'}" @click="toggleFilterTab('status')">
                              <div class="filter-text">{{ selectedStatus ? getStatusName(selectedStatus) : '状态' }} <i class="el-icon-arrow-down"></i></div>
                           </div>
                           <div class="filter-item" :class="{active: activeFilterTab==='pShopType'}" @click="toggleFilterTab('pShopType')">
                              <div class="filter-text">{{selectedProductShopType ? getShopTypeName(selectedProductShopType) : '分类'}} <i class="el-icon-arrow-down"></i></div>
                           </div>
                      </div>
                      
                                          <div class="filter-content" :class="{show: ['pType','status','pShopType'].includes(activeFilterTab)}">
              <!-- Voucher Type -->
              <div v-if="activeFilterTab==='pType'" class="score-panel">
                 <div class="score-options">
                     <div class="score-option" :class="{active: selectedProductType===t.value}" v-for="t in productTypeOptions" :key="t.value" @click="selectProductType(t)">{{t.label}}</div>
                 </div>
              </div>
              <!-- Product Status -->
              <div v-if="activeFilterTab==='status'" class="score-panel">
                 <div class="score-options">
                     <div class="score-option" :class="{active: selectedStatus===s.value}" v-for="s in statusOptions" :key="s.value" @click="selectStatus(s)">{{s.label}}</div>
                 </div>
              </div>
              <!-- Product Shop Type -->
              <div v-if="activeFilterTab==='pShopType'" class="shop-type-panel">
                 <div class="shop-type-grid">
                     <div class="shop-type-item" :class="{active: selectedProductShopType===type.id}" v-for="type in shopTypes" :key="type.id" @click="selectProductShopType(type.id)">{{type.name}}</div>
                 </div>
              </div>
                    </div>
                    </div>
                    <!-- Selected Tags -->
                     <div class="selected-filters" v-if="selectedProductType !== null || selectedStatus || selectedProductShopType">
                           <div class="selected-filter-tag" v-if="selectedProductType !== null">{{getProductTypeName(selectedProductType)}} <span class="close" @click="selectedProductType=null;triggerSearch()">×</span></div>
                           <div class="selected-filter-tag" v-if="selectedStatus">{{getStatusName(selectedStatus)}} <span class="close" @click="selectedStatus=null;triggerSearch()">×</span></div>
                           <div class="selected-filter-tag" v-if="selectedProductShopType">{{getShopTypeName(selectedProductShopType)}} <span class="close" @click="selectedProductShopType=null;triggerSearch()">×</span></div>
                           <div class="clear-all" @click="clearAllFilters">清除全部</div>
                     </div>
                      
                      <!-- Voucher Results -->
                      <div v-if="isLoading" class="loading-box"><i class="el-icon-loading"></i> 加载中...</div>
                      <div v-else>
                          <div v-if="productList.length===0" class="empty-result">
                             <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiByeD0iOCIgZmlsbD0iI0Y4RjlGQSIvPgo8cGF0aCBkPSJNNDAgNDJMMzIgMzRMMzQgMzJMNDAgMzhMNDYgMzJMNDggMzRMNDAgNDJaIiBmaWxsPSIjQzBDNEY0Ii8+CjxwYXRoIGQ9Ik00MCA0MkwzMiAzNEwzNCAzMkw0MCAzOEw0NiAzMkw0OCAzNEw0MCA0MloiIGZpbGw9IiNDMEM0RjQiLz4KPC9zdmc+Cg==">
                             <p>暂无相关代金券</p>
                             <span class="sub-text">换个关键词试试吧</span>
                          </div>
                          
                          <!-- Seckill Products -->
                          <div v-if="seckillProducts.length > 0" class="seckill-wrapper">
                              <div class="voucher-category-title seckill">限时秒杀</div>
                              <DealCard
                                v-for="v in seckillProducts"
                                :key="v.id"
                                :item="v"
                                biz="voucher"
                                :is-seckill="true"
                                @click="toProductDetail"
                                @action="doSeckill"
                              />
                          </div>
                    
                          <!-- Normal Products -->
                          <div v-if="normalProducts.length > 0">
                              <div class="voucher-category-title normal">特惠代金券</div>
                              <DealCard
                                v-for="v in normalProducts"
                                :key="v.id"
                                :item="v"
                                biz="voucher"
                                :is-seckill="false"
                                @click="toProductDetail"
                                @action="doBuy"
                              />
                          </div>
                      </div>
                  </div>
            </van-tab>

            <!-- GROUP TAB -->
            <van-tab title="团购" name="group">
                 <div class="tab-content">
                      <!-- Product Filter Bar (Reused or Simplified) -->
                      <div class="filter-wrapper">
                        <div class="meituan-filter-bar">
                           <div class="filter-item" :class="{active: activeFilterTab==='status'}" @click="toggleFilterTab('status')">
                              <div class="filter-text">{{ selectedStatus ? getStatusName(selectedStatus) : '状态' }} <i class="el-icon-arrow-down"></i></div>
                           </div>
                           <div class="filter-item" :class="{active: activeFilterTab==='pShopType'}" @click="toggleFilterTab('pShopType')">
                              <div class="filter-text">{{selectedProductShopType ? getShopTypeName(selectedProductShopType) : '分类'}} <i class="el-icon-arrow-down"></i></div>
                           </div>
                      </div>
                      
                      </div>
                    <!-- Selected Tags -->
                     <div class="selected-filters" v-if="selectedStatus || selectedProductShopType">
                           <div class="selected-filter-tag" v-if="selectedStatus">{{getStatusName(selectedStatus)}} <span class="close" @click="selectedStatus=null;triggerSearch()">×</span></div>
                           <div class="selected-filter-tag" v-if="selectedProductShopType">{{getShopTypeName(selectedProductShopType)}} <span class="close" @click="selectedProductShopType=null;triggerSearch()">×</span></div>
                           <div class="clear-all" @click="clearAllFilters">清除全部</div>
                     </div>
                      
                      <!-- Group Results -->
                      <div v-if="isLoading" class="loading-box"><i class="el-icon-loading"></i> 加载中...</div>
                      <div v-else>
                          <div v-if="productList.length===0" class="empty-result">
                             <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiByeD0iOCIgZmlsbD0iI0Y4RjlGQSIvPgo8cGF0aCBkPSJNNDAgNDJMMzIgMzRMMzQgMzJMNDAgMzhMNDYgMzJMNDggMzRMNDAgNDJaIiBmaWxsPSIjQzBDNEY0Ii8+CjxwYXRoIGQ9Ik00MCA0MkwzMiAzNEwzNCAzMkw0MCAzOEw0NiAzMkw0OCAzNEw0MCA0MloiIGZpbGw9IiNDMEM0RjQiLz4KPC9zdmc+Cg==">
                             <p>暂无相关团购</p>
                             <span class="sub-text">换个关键词试试吧</span>
                          </div>
                      
                          <DealCard
                            v-for="v in productList"
                            :key="v.id"
                            :item="v"
                            biz="group"
                            :is-seckill="v.activityType === 1"
                            @click="toProductDetail"
                            @action="toProductDetail"
                          />
                      </div>
                  </div>
            </van-tab>

            <!-- BLOG TAB -->
            <van-tab title="笔记" name="blog">
                <div class="tab-content">
                    <!-- Blog Filters -->
                     <div class="filter-wrapper">
                        <div class="meituan-filter-bar">
                          <div class="filter-item" :class="{active: activeFilterTab==='blogType'}" @click="toggleFilterTab('blogType')">
                             <div class="filter-text">{{selectedBlogType ? getShopTypeName(selectedBlogType) : '全部类型'}} <i class="el-icon-arrow-down"></i></div>
                          </div>
                     </div>
                     
                                          <div class="filter-content" :class="{show: activeFilterTab==='blogType'}">
              <!-- Blog Type -->
              <div v-if="activeFilterTab==='blogType'" class="shop-type-panel">
                 <div class="shop-type-grid">
                    <div class="shop-type-item" :class="{active: selectedBlogType===type.id}" v-for="type in shopTypes" :key="type.id" @click="selectBlogType(type.id)">{{type.name}}</div>
                 </div>
              </div>
                    </div>
                    </div>
                    <!-- Selected Tags -->
                    <div class="selected-filters" v-if="selectedBlogType">
                          <div class="selected-filter-tag">{{getShopTypeName(selectedBlogType)}} <span class="close" @click="selectBlogType(selectedBlogType)">×</span></div>
                          <div class="clear-all" @click="clearAllFilters">清除全部</div>
                    </div>

                    <!-- Blog Results -->
                    <div v-if="isLoading" class="loading-box"><i class="el-icon-loading"></i> 加载中...</div>
                     <div v-else>
                        <div v-if="blogList.length===0" class="empty-result">
                           <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiByeD0iOCIgZmlsbD0iI0Y4RjlGQSIvPgo8cGF0aCBkPSJNNDAgNDJMMzIgMzRMMzQgMzJMNDAgMzhMNDYgMzJMNDggMzRMNDAgNDJaIiBmaWxsPSIjQzBDNEY0Ii8+CjxwYXRoIGQ9Ik00MCA0MkwzMiAzNEwzNCAzMkw0MCAzOEw0NiAzMkw0OCAzNEw0MCA0MloiIGZpbGw9IiNDMEM0RjQiLz4KPC9zdmc+Cg==">
                           <p>暂无相关笔记</p>
                           <span class="sub-text">换个关键词试试吧</span>
                        </div>
                        <div v-else class="waterfall-container">
                           <div v-for="b in blogList" :key="b.id" class="waterfall-item" @click="toBlogDetail(b)">
                              <div class="xhs-card-image">
                                 <img :src="b.images" v-show="!b.imageError" v-if="b.images" :class="{ 'is-loaded': b.imgLoaded }" loading="lazy" decoding="async" @error="handleImgError($event, b, 'imageError')" @load="b.imgLoaded=true" />
                                 <div class="img-placeholder" v-if="!b.images || b.imageError">
                                     图片加载失败
                                 </div>
                                 <div class="img-skeleton" v-if="b.images && !b.imageError && !b.imgLoaded"></div>
                              </div>
                              <div class="xhs-card-content">
                                 <div class="xhs-card-title" v-html="b.title || '无标题'"></div>
                                 <div class="xhs-card-footer">
                                    <div class="xhs-card-author" @click.stop="toUser(b)">
                                       <img :src="b.icon || '/imgs/icons/default-icon.png'" :class="{ 'is-loaded': b.iconLoaded }" loading="lazy" decoding="async" @error="handleImgError($event, b, 'iconError', '/imgs/icons/default-icon.png')" @load="b.iconLoaded=true" />
                                       <span v-html="b.nickName || b.name || '用户'"></span>
                                    </div>
                                    <div class="xhs-card-like" @click.stop="addLike(b)">
                                       <svg viewBox="0 0 24 24" width="14" height="14" style="margin-right: 2px;">
                                         <path :fill="b.isLike ? '#ff2442' : '#999'" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                                       </svg>
                                       <span>{{b.liked || 0}}</span>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </div>
                    </div>
                </div>
            </van-tab>

            <!-- USER TAB -->
            <van-tab title="用户" name="user">
                <div class="tab-content">
                    <div v-if="isLoading" class="loading-box"><i class="el-icon-loading"></i> 加载中...</div>
                    <div v-else class="user-list-container">
                         <div v-if="userList.length===0" class="empty-result">
                           <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiByeD0iOCIgZmlsbD0iI0Y4RjlGQSIvPgo8cGF0aCBkPSJNNDAgNDJMMzIgMzRMMzQgMzJMNDAgMzhMNDYgMzJMNDggMzRMNDAgNDJaIiBmaWxsPSIjQzBDNEY0Ii8+CjxwYXRoIGQ9Ik00MCA0MkwzMiAzNEwzNCAzMkw0MCAzOEw0NiAzMkw0OCAzNEw0MCA0MloiIGZpbGw9IiNDMEM0RjQiLz4KPC9zdmc+Cg==">
                           <p>暂无相关用户</p>
                            <span class="sub-text">换个关键词试试吧</span>
                         </div>
                        <div v-for="u in userList" :key="u.id" class="user-item" @click="toUser(u)">
                            <div class="user-avatar">
                               <img :src="u.icon || '/imgs/icons/default-icon.png'" :class="{ 'is-loaded': u.imgLoaded }" loading="lazy" decoding="async" @error="handleImgError($event, u)" @load="u.imgLoaded=true" />
                               <div class="img-skeleton" v-if="!u.imgError && !u.imgLoaded" style="border-radius: 50%;"></div>
                            </div>
                            <div class="user-info">
                                 <div class="user-name" v-html="u.nickName || '未命名'"></div>
                            </div>
                            <button class="follow-btn" :class="{'following': u.isFollow}" @click.stop="toggleFollow(u)" v-if="user && u.id !== user.id">
                                {{ u.isFollow ? '已关注' : '关注' }}
                            </button>
                        </div>
                    </div>
                </div>
            </van-tab>

        </van-tabs>
        <div ref="searchLoadSentinel" class="io-sentinel" aria-hidden="true"></div>
    </div>
  </PageLayout>
</template>

<script>
import { getShopTypes } from "@/api/shop";
import { likeBlog } from '@/api/interaction';
import { followUserBoolean } from "@/api/interaction";
import { getCurrentUser } from "@/api/user";
import { locationUtil } from '@/utils/location';
import {
  searchShops,
  searchBlogs,
  searchUsers,
  searchProducts,
  getHotSearch,
  getSearchHistory,
  addSearchHistory,
  clearSearchHistory,
  recordSearch,
} from "@/api/search";
import { throttle } from '@/utils/throttle';
import { debounce } from '@/utils/debounce';


import DealCard from '@/components/DealCard.vue';
import PageLayout from '@/components/PageLayout/PageLayout.vue';

export default {
  name: "SearchIndex",
  components: { PageLayout, DealCard },
  data() {
    return {
      keyword: "",
      activeTab: "shop",
      
      // Data Lists
      shopList: [],
      blogList: [],
      userList: [],
      productList: [],
      
      pageLoading: true,
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
      hotSearch: [],

      // Filters
      activeFilterTab: "", // 'type', 'distance', 'score', 'pType', 'status', 'pShopType'
      shopTypes: [],
      
      // Filter State
      selectedShopType: null,
      selectedDistance: null,
      selectedScore: null,
      selectedSort: 'hot',
      
      selectedProductType: null,
      selectedStatus: null,
      selectedProductShopType: null,
      
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
      sortOptions: [
        { label: "智能排序", value: "hot" },
        { label: "距离优先", value: "distance" },
        { label: "好评优先", value: "score" },
        { label: "低价优先", value: "price" }
      ],
      productTypeOptions: [
         { label: "普通", value: 0 },
         { label: "秒杀", value: 1 },
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
      tabOrder: ["shop", "voucher", "group", "blog", "user"],
      touchStartX: 0,
      touchStartY: 0,
      touchEndX: 0,
      touchEndY: 0,
      swipeThreshold: 24,
      maxVerticalTravel: 120,
      searchListObserver: null,
      searchRequestToken: 0,
      searchDebouncedRunner: null
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
        (this.selectedSort && this.selectedSort !== 'hot') ||
        this.selectedProductType ||
        this.selectedBlogType
      );
    },
    seckillProducts() {
        return this.productList.filter(v => v.activityType == 1);
    },
    normalProducts() {
        return this.productList.filter(v => v.activityType != 1);
    },
    searchPlaceholder() {
        const placeholders = {
          shop: '搜索店铺名称...',
          voucher: '搜索代金券...',
          group: '搜索团购...',
          blog: '搜索笔记...',
          user: '搜索用户...'
        };
        return placeholders[this.activeTab] || '输入商户名、地点或菜品';
    },
  },
  created() {
    this.onScroll = throttle(this.onScroll, 120);
    this.searchDebouncedRunner = debounce(() => this.doSearch(false), 180);
    this.checkLogin();
    this.loadShopTypes();
    this.reGetLocation();
    this.loadHotSearch();

    // Restore state from URL
    const q = this.$route.query;
    if (q.k) this.keyword = q.k;
    if (q.tab) this.activeTab = q.tab;

    // Restore Shop Filters
    if (q.st) this.selectedShopType = Number(q.st);
    if (q.sd) this.selectedDistance = q.sd;
    if (q.ss) this.selectedScore = q.ss;
    if (q.sort) this.selectedSort = q.sort;

    // Restore Product Filters
    if (q.vt !== undefined) this.selectedProductType = Number(q.vt);
    if (q.vs !== undefined) this.selectedStatus = Number(q.vs);
    if (q.vst) this.selectedProductShopType = Number(q.vst);

    // Restore Blog Filters
    if (q.bt) this.selectedBlogType = Number(q.bt);

    // If state restored, trigger search
    const shouldAutoSearch = this.keyword || this.hasSelectedFilters || this.activeTab !== 'shop';
    if (shouldAutoSearch) {
        this.doSearch();
    } else {
        this.pageLoading = false;
    }
  },
  activated() {
    // Keep-alive hook: sync tab from URL if changed (e.g. deep link)
    const tab = this.$route.query.tab;
    if (tab && tab !== this.activeTab && ['shop', 'voucher', 'group', 'blog', 'user'].includes(tab)) {
        this.activeTab = tab;
        this.doSearch();
    }

    // Sync keyword if changed
    const k = this.$route.query.k;
    if (k !== undefined && k !== this.keyword) {
        this.keyword = k;
        this.doSearch();
    }
    this.$nextTick(() => {
      this.setupSearchSentinelObserver();
    });
  },
  mounted() {
    this.$nextTick(() => {
      this.setupSearchSentinelObserver();
    });
    // window.addEventListener('scroll', this.onScroll);
  },
  deactivated() {
    this.destroySearchSentinelObserver();
    if (typeof this.onScroll?.cancel === 'function') {
      this.onScroll.cancel();
    }
    if (typeof this.searchDebouncedRunner?.cancel === 'function') {
      this.searchDebouncedRunner.cancel();
    }
  },
  beforeUnmount() {
    this.destroySearchSentinelObserver();
    if (typeof this.onScroll?.cancel === 'function') {
      this.onScroll.cancel();
    }
    if (typeof this.searchDebouncedRunner?.cancel === 'function') {
      this.searchDebouncedRunner.cancel();
    }
    // window.removeEventListener('scroll', this.onScroll);
  },
  methods: {
    triggerSearch(immediate = false) {
      if (immediate) {
        if (typeof this.searchDebouncedRunner?.cancel === 'function') {
          this.searchDebouncedRunner.cancel();
        }
        this.doSearch(false);
        return;
      }
      if (typeof this.searchDebouncedRunner === 'function') {
        this.searchDebouncedRunner();
        return;
      }
      this.doSearch(false);
    },
    loadMoreSearchResults() {
      if (this.loadingMore || this.noMore || !this.hasSearched || this.isLoading) return;
      this.doSearch(true);
    },
    setupSearchSentinelObserver() {
      this.destroySearchSentinelObserver();
      if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
      const sentinel = this.$refs.searchLoadSentinel;
      if (!sentinel) return;
      const root = this.$el && this.$el.classList && this.$el.classList.contains('search-page')
        ? this.$el
        : null;
      this.searchListObserver = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          this.loadMoreSearchResults();
        }
      }, {
        root,
        rootMargin: '0px 0px 180px 0px',
        threshold: 0
      });
      this.searchListObserver.observe(sentinel);
    },
    destroySearchSentinelObserver() {
      if (this.searchListObserver && typeof this.searchListObserver.disconnect === 'function') {
        this.searchListObserver.disconnect();
      }
      this.searchListObserver = null;
    },
    onTouchStart(e) {
      const touch = e.touches && e.touches[0];
      if (!touch) return;
      this.touchStartX = touch.clientX;
      this.touchStartY = touch.clientY;
      this.touchEndX = touch.clientX;
      this.touchEndY = touch.clientY;
    },
    onTouchMove(e) {
      const touch = e.touches && e.touches[0];
      if (!touch) return;
      this.touchEndX = touch.clientX;
      this.touchEndY = touch.clientY;
    },
    onTouchEnd(e) {
      const touch = e.changedTouches && e.changedTouches[0];
      if (touch) {
        this.touchEndX = touch.clientX;
        this.touchEndY = touch.clientY;
      }

      const deltaX = this.touchEndX - this.touchStartX;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(this.touchEndY - this.touchStartY);
      if (absY > this.maxVerticalTravel) return;
      if (absX < this.swipeThreshold) return;
      if (absX <= absY * 1.05) return;

      const currentIndex = this.tabOrder.indexOf(this.activeTab);
      if (currentIndex < 0) return;

      if (deltaX < 0 && currentIndex < this.tabOrder.length - 1) {
        this.activeTab = this.tabOrder[currentIndex + 1];
      } else if (deltaX > 0 && currentIndex > 0) {
        this.activeTab = this.tabOrder[currentIndex - 1];
      }
    },
    checkLogin() {
      const token = localStorage.getItem("token");
      if (token) {
        getCurrentUser()
          .then((res) => {
            let u = res.data || res;
            if(u && u.data) u = u.data;
            this.user = u || {};
            this.loadHistory();
          })
          .catch(() => {
            this.loadHistory();
          });
      } else {
        this.loadHistory();
      }
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
    getSortLabel(val) {
      if (!val || val === 'hot') return '智能排序';
      const f = this.sortOptions.find((o) => o.value === val);
      return f ? f.label : '智能排序';
    },
    getShopTypeName(id) {
      const t = this.shopTypes.find((t) => t.id === id);
      return t ? t.name : "";
    },
    formatSeckillTime(v) {
        if(!v.beginTime || !v.endTime) return '';
        const format = (str) => {
            const d = new Date(str);
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const h = String(d.getHours()).padStart(2, '0');
            const min = String(d.getMinutes()).padStart(2, '0');
            return `${m}.${day} ${h}:${min}`;
        };
        return `${format(v.beginTime)} - ${format(v.endTime)}`;
    },
    getProductTypeName(val) {
        const t = this.productTypeOptions.find(t => t.value === val);
        return t ? t.label : "";
    },
    getValidityText(v) {
        if (v.validityType === 1 && v.useStartTime && v.useEndTime) {
            const start = v.useStartTime.split(' ')[0] || '';
            const end = v.useEndTime.split(' ')[0] || '';
            return `${start} 至 ${end} 有效`;
        } else if (v.validityType === 2 && v.validDays) {
            return `领取/购买后 ${v.validDays} 天内有效`;
        }
        // Fallback: Use beginTime/endTime if validity fields are missing
        if (v.beginTime && v.endTime) {
             const start = String(v.beginTime).split(' ')[0];
             const end = String(v.endTime).split(' ')[0];
             return `${start} 至 ${end} 有效`;
        }
        return '';
    },

    // Filter Logic
    toggleFilterTab(tab) {
      this.activeFilterTab = this.activeFilterTab === tab ? "" : tab;
    },
    selectShopType(id) {
      this.selectedShopType = this.selectedShopType === id ? null : id;
      this.activeFilterTab = "";
      this.triggerSearch();
    },
    selectDistance(d) {
      this.selectedDistance = d.label === "全部" ? null : d.label;
      this.activeFilterTab = "";
      this.triggerSearch();
    },
    selectScore(s) {
      this.selectedScore = s.label === "全部" ? null : s.label;
      this.activeFilterTab = "";
      this.triggerSearch();
    },
    selectSort(s) {
      this.selectedSort = s.value;
      this.activeFilterTab = "";
      this.triggerSearch();
    },
    selectProductType(t) {
        this.selectedProductType = t.label === "全部" ? null : t.value;
        this.activeFilterTab = "";
        this.triggerSearch();
    },
    clearAllFilters() {
      this.selectedShopType = null;
      this.selectedDistance = null;
      this.selectedScore = null;
      this.selectedSort = 'hot';
      this.selectedScore = null;
      this.selectedProductType = null;
      this.selectedBlogType = null;
      this.triggerSearch();
    },
    changeTab(tab) {
        this.activeTab = tab;
        this.triggerSearch();
    },
    onTabChange(name) {
        // activeTab is already updated by v-model
        this.activeFilterTab = ""; // Close filters
        this.triggerSearch();
        this.$nextTick(() => {
          this.setupSearchSentinelObserver();
        });
    },
    getStatusName(val) {
        const s = this.statusOptions.find(o => o.value === val);
        return s ? s.label : "";
    },
    selectStatus(s) {
        this.selectedStatus = s.label === "全部" ? null : s.value;
        this.activeFilterTab = "";
        this.triggerSearch();
    },
    selectProductShopType(id) {
        this.selectedProductShopType = id;
        this.activeFilterTab = "";
        this.triggerSearch();
    },
    selectBlogType(id) {
        this.selectedBlogType = this.selectedBlogType === id ? null : id;
        this.activeFilterTab = "";
        this.triggerSearch();
    },
    // Main Search
    doSearch(isLoadMore = false) {
      if (!isLoadMore && typeof this.searchDebouncedRunner?.cancel === 'function') {
        this.searchDebouncedRunner.cancel();
      }
      if (isLoadMore && (this.loadingMore || this.noMore || this.isLoading || !this.hasSearched)) {
        return;
      }

      const requestToken = ++this.searchRequestToken;
      const requestTab = this.activeTab;
      const targetPage = isLoadMore ? this.page + 1 : 1;

      if (!isLoadMore) {
        // Update URL with current state
        const query = {
          k: this.keyword || undefined,
          tab: requestTab,
          st: this.selectedShopType || undefined,
          sd: this.selectedDistance || undefined,
          ss: this.selectedScore || undefined,
          sort: this.selectedSort !== 'hot' ? this.selectedSort : undefined,
          vt: this.selectedProductType !== null ? this.selectedProductType : undefined,
          vs: this.selectedStatus !== null ? this.selectedStatus : undefined,
          vst: this.selectedProductShopType || undefined,
          bt: this.selectedBlogType || undefined
        };
        this.$router.replace({ query }).catch(() => {});
      }

      if (this.keyword && !isLoadMore) {
        this.saveHistory(this.keyword);
        recordSearch(this.keyword);
      }

      if (!isLoadMore) {
        this.hasSearched = true;
        this.isLoading = true;
        this.page = 1;
        this.noMore = false;
        this.shopList = [];
        this.blogList = [];
        this.userList = [];
        this.productList = [];
      } else {
        this.loadingMore = true;
      }

      const pageParams = { page: targetPage, size: 10 };
      const isStale = () => requestToken !== this.searchRequestToken || requestTab !== this.activeTab;

      const extractList = (res) => {
        if (Array.isArray(res)) return res;
        if (res && Array.isArray(res.list)) return res.list;
        if (res && Array.isArray(res.data)) return res.data;
        if (res && res.data && Array.isArray(res.data.list)) return res.data.list;
        if (res && res.data && Array.isArray(res.data.records)) return res.data.records;
        if (res && res.data && res.data.data && Array.isArray(res.data.data.list)) return res.data.data.list;
        if (res && res.data && res.data.data && Array.isArray(res.data.data.records)) return res.data.data.records;
        return [];
      };

      const applyList = (key, list) => {
        if (isStale()) return;
        const safeList = Array.isArray(list) ? list : [];
        if (isLoadMore) {
          this[key] = [...this[key], ...safeList];
        } else {
          this[key] = safeList;
        }
        this.noMore = safeList.length < 10;
        this.page = targetPage;
      };

      let requestPromise = Promise.resolve();

      if (requestTab === "shop") {
        const filters = {};
        if (this.selectedShopType) filters.typeId = this.selectedShopType;
        if (this.selectedScore) {
          const score = this.scoreOptions.find((o) => o.label === this.selectedScore);
          if (score) filters.minScore = score.value;
        }


        const data = {
          keyword: this.keyword,
          filters,
          ...pageParams,
          lat: this.userLocation ? this.userLocation.y : undefined,
          lon: this.userLocation ? this.userLocation.x : undefined,
          distance: this.selectedDistance
            ? (this.distanceOptions.find(o => o.label === this.selectedDistance)?.value || "all")
            : "all",
          sortBy: this.selectedSort !== 'hot' ? this.selectedSort : undefined
        };

        requestPromise = searchShops(data).then((res) => {
          if (isStale()) return;
          const list = extractList(res);
          list.forEach((item) => {
            item.imgLoaded = false;
            item.imgError = false;
            const rawImg = item.shopLogo || item.images;
            if (!rawImg) return;
            if (rawImg.startsWith('http')) {
              item.images = rawImg;
            } else {
              item.images = this.$fileURL + rawImg.split(",")[0];
            }
          });
          applyList('shopList', list);
        });
      } else if (requestTab === "product" || requestTab === "voucher" || requestTab === "group") {
        const filters = {};
        if (requestTab === "group") filters.category = 2; // 2 for group
        if (requestTab === "voucher") filters.category = 1; // 1 for voucher
        if (this.selectedProductShopType) filters.shopTypeId = this.selectedProductShopType;
        if (this.selectedProductType !== null) filters.activityType = this.selectedProductType;
        if (this.selectedStatus !== null) filters.status = this.selectedStatus;

        const data = {
          ...pageParams,
          keyword: this.keyword,
          lat: this.userLocation ? this.userLocation.y : undefined,
          lon: this.userLocation ? this.userLocation.x : undefined,
          filters
        };

        requestPromise = searchProducts(data).then((res) => {
          if (isStale()) return;
          const list = extractList(res);
          list.forEach((item) => {
             item.imgLoaded = false;
             item.imgError = false;
             const rawImg = item.coverImg || item.shopLogo || item.images || item.image;
             if (rawImg && typeof rawImg === 'string') {
                 if (rawImg.startsWith('http')) {
                     item.images = rawImg;
                 } else {
                     item.images = this.$fileURL + rawImg.split(",")[0];
                 }
             }
          });
          applyList('productList', list);
        });
      } else if (requestTab === "blog") {
        const filters = {};
        if (this.selectedBlogType) {
          filters.typeId = this.selectedBlogType;
        }
        const params = { keyword: this.keyword, filters, ...pageParams };

        requestPromise = searchBlogs(params).then((res) => {
          if (isStale()) return;
          const list = extractList(res);
          list.forEach((blog) => {
            blog.imgLoaded = false;
            blog.imgError = false;
            blog.iconLoaded = false;
            blog.iconError = false;
            if (blog.title) {
              blog.title = blog.title.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');
            }

            let img = blog.images;
            if (img && (img.indexOf('<') > -1 || img.indexOf('&lt;') > -1)) {
              img = img.replace(/<[^>]+>/g, "").replace(/&lt;[^&]+&gt;/g, "");
            }

            if (img) {
              blog.images = img.split(",")[0];
              if (blog.images && !blog.images.startsWith("http")) blog.images = this.$fileURL + blog.images;
            } else if (blog.content) {
              const match = blog.content.match(/<img[^>]+src="([^">]+)"/);
              if (match) {
                let src = match[1];
                if (src && !src.startsWith("http")) src = this.$fileURL + src;
                blog.images = src;
              }
            }

            if (blog.icon) blog.icon = this.$fileURL + blog.icon;
          });
          applyList('blogList', list);
        });
      } else if (requestTab === "user") {
        requestPromise = searchUsers({ keyword: this.keyword, ...pageParams }).then((res) => {
          if (isStale()) return;
          const list = extractList(res);
          list.forEach((user) => {
            user.imgLoaded = false;
            user.imgError = false;
            if (user.icon) user.icon = this.$fileURL + user.icon;
          });
          applyList('userList', list);
        });
      }

      requestPromise
        .catch((err) => {
          if (isStale()) return;
          console.error('搜索请求错误:', err);
        })
        .finally(() => {
          if (isStale()) return;
          this.isLoading = false;
          this.pageLoading = false;
          this.loadingMore = false;
          this.$nextTick(() => {
            this.setupSearchSentinelObserver();
          });
        });
    },
    onScroll(e) {
       const el = e.target;

       if (el.scrollTop + el.clientHeight >= el.scrollHeight - 100) {
           this.loadMoreSearchResults();
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
         this.$router.push(`/product/detail?id=${v.id}`);
    },
    doSeckill(v) {
         this.$router.push(`/product/detail?id=${v.id}`);
    },

    resetToSearchHome() {
      if (typeof this.searchDebouncedRunner?.cancel === 'function') {
        this.searchDebouncedRunner.cancel();
      }
      this.keyword = "";
      this.activeTab = "shop";
      this.activeFilterTab = "";
      this.destroySearchSentinelObserver();

      this.selectedShopType = null;
      this.selectedDistance = null;
      this.selectedScore = null;
      this.selectedProductType = null;
      this.selectedStatus = null;
      this.selectedProductShopType = null;
      this.selectedBlogType = null;

      this.hasSearched = false;
      this.isLoading = false;
      this.loadingMore = false;
      this.noMore = false;
      this.page = 1;

      this.shopList = [];
      this.blogList = [];
      this.userList = [];
      this.productList = [];

      this.$router.replace({ path: this.$route.path, query: {} }).catch(() => {});
    },

    goBack() {
      const hasActiveSearchState = this.hasSearched
        || !!this.keyword
        || this.activeTab !== "shop"
        || this.hasSelectedFilters
        || this.selectedStatus !== null
        || this.selectedProductShopType !== null;

      if (hasActiveSearchState) {
        this.resetToSearchHome();
        return;
      }
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
    toProductDetail(v) {
      this.$router.push({ path: "/product/detail", query: { id: v.id } });
    },
    toBlogDetail(b) {
      this.$router.push({
        path: "/blog/detail",
        query: { id: b.id },
      });
    },
    toUser(u) {
      if(this.user && u.id === this.user.id) {
         this.$router.push('/user/profile');
      } else {
         this.$router.push(`/user/profile/${u.id}`);
      }
    },
    handleImgError(e, obj, errorFlag = 'imgError', fallbackSrc = '/imgs/icons/default-icon.png') {
        if (e && e.target) {
            e.target.src = fallbackSrc;
        }
        if (obj) {
            obj[errorFlag] = true;
        }
    },
    addLike(b) {
       if (!localStorage.getItem("token")) {
           this.$message.warning("请先登录");
           setTimeout(() => {
               this.$router.push({
                 path: '/user/login',
                 query: { redirect: this.$route.fullPath }
               }).catch(() => {});
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
    isNotBegin(v) {
      if (!v.beginTime) return false;
      return new Date() < new Date(v.beginTime);
    },
    getStockPercent(v) {
      if (!v.stock || !v.totalStock) return 20;
      const percent = Math.round((v.stock / (v.totalStock || 100)) * 100);
      return Math.max(5, Math.min(95, percent));
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
.io-sentinel {
  width: 100%;
  height: 1px;
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
.filter-wrapper { position: relative; z-index: 100; }

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
  position: relative;
  width: 90px;
  height: 90px;
  border-radius: 8px;
  overflow: hidden;
  margin-right: 12px;
  flex-shrink: 0;
  background: #f5f5f5;
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
  justify-content: center;
  min-width: 0;
}
.shop-title {
  font-weight: 600;
  font-size: 15px;
  color: #333;
  line-height: 1.4;
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.shop-rate {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #666;
  margin-bottom: 6px;
  gap: 6px;
}
.shop-score {
  color: #ff6633;
  font-weight: 600;
}
.shop-price {
  color: #333;
  font-weight: 500;
  margin-left: auto;
}
.shop-area {
  font-size: 12px;
  color: #999;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.area-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 70%;
}
.distance-text {
  color: #999;
  flex-shrink: 0;
}
.shop-comments {
  font-size: 11px;
  color: #bbb;
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

/* Flash Sale Card (Seckill) */
.flash-sale-card {
  background: white;
  border-radius: 12px;
  margin-bottom: 12px;
  padding: 15px;
  position: relative;
  box-shadow: 0 4px 16px rgba(245, 108, 108, 0.15);
  border: 1px solid rgba(245, 108, 108, 0.1);
}
.flash-badge {
  position: absolute;
  top: 0;
  right: 0;
  background: linear-gradient(135deg, #f56c6c 0%, #e25555 100%);
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 0 12px 0 12px;
}
.flash-content {
  display: flex;
  flex-direction: column;
}
.flash-header {
  margin-bottom: 12px;
}
.flash-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
  padding-right: 50px;
}
.flash-shop {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}
.flash-shop .shop-label {
  color: #999;
  margin-right: 4px;
  flex-shrink: 0;
}
.flash-shop .shop-name {
  color: #409EFF;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 180px;
}
.flash-subtitle {
  font-size: 12px;
  color: #999;
}
.flash-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px dashed #f0f0f0;
}
.flash-price-section {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.flash-price {
  display: flex;
  align-items: baseline;
}
.flash-price .price-symbol {
  font-size: 16px;
  font-weight: 600;
  color: #f56c6c;
}
.flash-price .price-value {
  font-size: 32px;
  font-weight: 700;
  color: #f56c6c;
  line-height: 1;
}
.price-original {
  display: flex;
  align-items: center;
  gap: 4px;
}
.price-original .original-value {
  font-size: 12px;
  color: #bbb;
  text-decoration: line-through;
}
.price-original .discount-tag {
  font-size: 10px;
  color: #f56c6c;
  background: rgba(245, 108, 108, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}
.flash-action {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}
.progress-wrapper {
  text-align: right;
}
.progress-bar {
  width: 80px;
  height: 6px;
  background: #f5f5f5;
  border-radius: 3px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #f56c6c, #e25555);
  border-radius: 3px;
  transition: width 0.3s;
}
.progress-text {
  font-size: 10px;
  color: #f56c6c;
  margin-top: 2px;
}
.flash-btn {
  padding: 8px 20px;
  background: linear-gradient(135deg, #f56c6c 0%, #e25555 100%);
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(245, 108, 108, 0.4);
}
.flash-btn:active {
  transform: scale(0.98);
}
.flash-btn.disabled {
  background: #ccc;
  box-shadow: none;
  cursor: not-allowed;
}

/* Normal Voucher Card - Clean White Style */
.normal-voucher-card {
  display: flex;
  align-items: center;
  background: white;
  border-radius: 12px;
  margin-bottom: 12px;
  padding: 15px;
  border: 1px solid #f0f0f0;
}
.normal-price-section {
  flex-shrink: 0;
  text-align: center;
  padding-right: 15px;
  border-right: 1px dashed #eee;
}
.normal-price {
  display: flex;
  align-items: baseline;
  justify-content: center;
}
.normal-price .price-symbol {
  font-size: 14px;
  font-weight: 600;
  color: #ff9500;
}
.normal-price .price-value {
  font-size: 28px;
  font-weight: 700;
  color: #ff9500;
  line-height: 1;
}
.normal-discount {
  font-size: 11px;
  color: #ff9500;
  background: rgba(255, 149, 0, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
  margin-top: 4px;
  display: inline-block;
}
.normal-info {
  flex: 1;
  padding: 0 15px;
  min-width: 0;
}
.normal-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.normal-subtitle {
  font-size: 12px;
  color: #999;
}
.normal-action {
  flex-shrink: 0;
}
.normal-btn {
  padding: 8px 20px;
  background: white;
  color: #ff9500;
  border: 1px solid #ff9500;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.normal-btn:active {
  background: #ff9500;
  color: white;
}

/* Ticket Style Voucher Cards */
.voucher-ticket {
  display: flex;
  align-items: stretch;
  background: white;
  border-radius: 10px;
  margin-bottom: 12px;
  position: relative;
  overflow: visible;
  border: 1px solid #f0f0f0;
}
.voucher-ticket.normal .ticket-left {
  background: linear-gradient(135deg, #ff9500 0%, #f63 100%);
}
.seckill-wrapper .voucher-ticket .ticket-left {
  background: linear-gradient(135deg, #e6a23c 0%, #f56c6c 100%);
}

/* Left Value Section */
.ticket-left {
  width: 90px;
  flex-shrink: 0;
  background: linear-gradient(135deg, #ff9500 0%, #f63 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 15px 10px;
  border-radius: 10px 0 0 10px;
  position: relative;
}
.ticket-price {
  display: flex;
  align-items: baseline;
  color: white;
}
.price-symbol {
  font-size: 14px;
  font-weight: 500;
}
.price-value {
  font-size: 32px;
  font-weight: 700;
  line-height: 1;
}
.ticket-discount {
  color: rgba(255, 255, 255, 0.9);
  font-size: 12px;
  margin-top: 4px;
}

/* Punch Hole Divider */
.ticket-divider {
  width: 16px;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  background: white;
  margin-left: -8px;
  margin-right: -8px;
  z-index: 1;
}
.punch-hole {
  width: 16px;
  height: 16px;
  background: #f5f5f5;
  border-radius: 50%;
}
.punch-hole.top { margin-top: -8px; }
.punch-hole.bottom { margin-bottom: -8px; }
.dashed-line {
  flex: 1;
  width: 1px;
  background: repeating-linear-gradient(
    to bottom,
    #ddd 0,
    #ddd 4px,
    transparent 4px,
    transparent 8px
  );
}

/* Right Info Section */
.ticket-right {
  flex: 1;
  padding: 12px 15px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}
.ticket-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ticket-shop {
  font-size: 12px;
  color: #999;
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}
.ticket-shop i {
  font-size: 12px;
  margin-right: 4px;
  color: #bbb;
}
.ticket-shop .shop-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 150px;
}
.ticket-subtitle {
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
}
.ticket-action {
  display: flex;
  align-items: center;
  gap: 10px;
}
.ticket-btn {
  padding: 6px 18px;
  background: linear-gradient(135deg, #ff9500 0%, #f63 100%);
  color: white;
  border: none;
  border-radius: 18px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}
.ticket-btn.seckill {
  background: linear-gradient(135deg, #e6a23c 0%, #f56c6c 100%);
}
.ticket-btn.disabled {
  background: #ccc;
  cursor: not-allowed;
}
.ticket-stock {
  font-size: 11px;
  color: #F56C6C;
}

/* Ticket Badge */
.ticket-badge {
  position: absolute;
  top: 0;
  right: 0;
  background: #F56C6C;
  color: white;
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 0 10px 0 8px;
  font-weight: 500;
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

/* Xiaohongshu Style Waterfall */
.waterfall-container {
  column-count: 2;
  column-gap: 10px;
  padding: 10px 12px;
}
.waterfall-item {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  break-inside: avoid;
  margin-bottom: 10px;
}
.waterfall-item:active {
  transform: scale(0.98);
}
.xhs-card-image {
  width: 100%;
  position: relative;
  /* Removed fixed aspect ratio for adaptive height */
}
.xhs-card-image img {
  width: 100%;
  height: auto; /* Allow auto height */
  display: block;
}
.xhs-card-image .img-placeholder {
  width: 100%;
  height: 150px; /* Fixed height for error placeholder */
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  color: #c0c4cc;
  font-size: 14px;
}
.xhs-card-content {
  padding: 10px;
}
.xhs-card-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 8px;
}
.xhs-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.xhs-card-author {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  flex: 1;
}
.xhs-card-author img {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}
.xhs-card-author span {
  font-size: 12px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.xhs-card-like {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  cursor: pointer;
}
.xhs-card-like span {
  font-size: 12px;
  color: #999;
}

/* Old Blog Grid (kept for compatibility) */
.blog-list-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  padding: 0;
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

/* User List - Social App Style */
.user-list-container {
  background: white;
}
.user-item {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  background: white;
  border-bottom: 1px solid #f5f5f5;
}
.user-item:active {
  background: #fafafa;
}
.user-item .user-avatar {
  position: relative;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  margin-right: 12px;
  background: #f5f5f5;
}
.user-item .user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.user-item .user-info {
  flex: 1;
  min-width: 0;
}
.user-item .user-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.user-item .user-desc {
  font-size: 13px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.follow-btn {
  padding: 6px 16px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  flex-shrink: 0;
  border: none;
  background: linear-gradient(135deg, #ff9500 0%, #f63 100%);
  color: white;
}
.follow-btn:active {
  transform: scale(0.98);
}
.follow-btn.following {
  background: #f5f5f5;
  color: #999;
}



/* ===== Voucher Card V2 Styles ===== */
.voucher-card-v2 {
    background: #fff;
    border-radius: 12px;
    margin-bottom: 12px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.voucher-category-title {
    font-size: 16px;
    font-weight: 800;
    margin: 16px 12px 8px;
    letter-spacing: 0.5px;
}

.voucher-category-title.seckill {
    color: #D9001B; /* 鲜艳的红色 */
}

.voucher-category-title.normal {
    color: #333333;
    margin-top: 24px;
}

.voucher-card-header {
    padding: 14px 16px 10px;
}

.voucher-title-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
}

.voucher-title {
    font-size: 17px;
    font-weight: 600;
    color: #333;
}

.voucher-flash-tag {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    background: linear-gradient(135deg, #ff6b6b, #ff2d55);
    color: #fff;
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 10px;
    font-weight: 500;
}

.voucher-shops {
    font-size: 13px;
    color: #666;
    margin-bottom: 4px;
}

.voucher-shops .shop-label {
    color: #999;
}

.voucher-shops .shop-names {
    color: #333;
}

.voucher-time, .voucher-usage-time {
    font-size: 12px;
    color: #ff5000;
    display: flex;
    align-items: center;
    gap: 4px;
}

.voucher-subtitle {
    font-size: 13px;
    color: #999;
    margin-bottom: 4px;
}

.voucher-card-body {
    padding: 16px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    border-radius: 12px;
    margin: 0 10px 10px;
}

.voucher-card-body.gradient-pink {
    background: linear-gradient(135deg, #ff6b9d 0%, #ff8a9d 50%, #ffb5c5 100%);
}

.voucher-card-body.gradient-orange {
    background: linear-gradient(135deg, #ff9500 0%, #ffb347 50%, #ffc980 100%);
}

.voucher-price-section {
    flex: 1;
}

.voucher-current-price {
    display: flex;
    align-items: baseline;
    color: #fff;
    margin-bottom: 4px;
}

.voucher-current-price .price-symbol {
    font-size: 16px;
    font-weight: 500;
}

.voucher-current-price .price-value {
    font-size: 42px;
    font-weight: 700;
    line-height: 1;
}

.voucher-original-info {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
}

.voucher-original-info .original-price {
    font-size: 14px;
    color: rgba(255,255,255,0.8);
    text-decoration: line-through;
}

.voucher-original-info .discount-badge {
    background: rgba(255,255,255,0.25);
    color: #fff;
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 500;
}

.voucher-sold-info {
    font-size: 12px;
    color: rgba(255,255,255,0.9);
    margin-bottom: 6px;
}

.voucher-progress-bar {
    width: 70%;
    height: 6px;
    background: rgba(255,255,255,0.3);
    border-radius: 3px;
    overflow: hidden;
}

.voucher-progress-bar .progress-fill {
    height: 100%;
    background: rgba(255,255,255,0.9);
    border-radius: 3px;
    transition: width 0.3s ease;
}

.voucher-action-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
}

.voucher-buy-btn {
    background: #fff;
    color: #ff5000;
    border: none;
    padding: 10px 20px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    transition: transform 0.2s, box-shadow 0.2s;
}

.voucher-buy-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.voucher-buy-btn:active {
    transform: scale(0.98);
}

.voucher-buy-btn:disabled {
    background: rgba(255,255,255,0.6);
    color: #999;
    cursor: not-allowed;
}

.voucher-stock {
    font-size: 12px;
    color: rgba(255,255,255,0.9);
}

.voucher-validity {
    font-size: 12px;
    color: #666;
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 4px;
}
.voucher-validity i {
    color: #ff5000;
}

.voucher-title-row {
    align-items: flex-start; /* Ensure alignment if title wraps */
}

.voucher-card-v2 .voucher-title {
    font-size: 16px;
    font-weight: 700;
    color: #333;
    line-height: 1.4;
}

.voucher-flash-tag {
    margin-left: 6px;
    vertical-align: middle;
    display: inline-flex;
}

.voucher-buy-btn.pink-text {
    color: #ff3d7f;
}

.voucher-buy-btn:disabled {
    color: #999 !important;
}
</style>



