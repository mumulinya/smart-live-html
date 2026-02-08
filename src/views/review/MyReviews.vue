<template>
  <PageLayout :show-navbar="false" class="gray-bg">
      <!-- Custom Header -->
      <div class="custom-header">
           <div class="header-left" @click="$router.go(-1)">
               <van-icon name="arrow-left" size="20" color="#333"/>
           </div>
           <div class="header-center">
               <span class="header-tab" :class="{active: activeHeaderTab === 'pending'}" @click="switchTab('pending')">待评价</span>
               <span class="header-tab" :class="{active: activeHeaderTab === 'reviewed'}" @click="switchTab('reviewed')">已评价</span>
           </div>
           <div class="header-right" @click="$router.push('/drafts')">
               <van-icon name="notes-o" size="18" />
               <span class="drafts-text">草稿箱({{ draftsCount }})</span>
           </div>
      </div>

     <!-- Tab Content -->
     <!-- Wait Review Tab -->
     <div v-show="activeHeaderTab === 'pending'" class="tab-content">
         <WaitReviewList />
     </div>

     <!-- Reviewed Tab -->
     <div v-show="activeHeaderTab === 'reviewed'" class="tab-content scroll-wrapper">
       <!-- Filter -->
       <div class="review-filter-row">
           <div class="filter-left" @click="showSortSheet = true">
               {{ currentSortLabel }} <i class="el-icon-caret-bottom"></i>
           </div>
           <div class="filter-right">全部评价共{{reviews.length}}条</div>
       </div>

       <!-- Review List -->
       <div class="review-list">
           <van-list
               v-model:loading="loading"
               :finished="finished"
               finished-text="没有更多了"
               :immediate-check="false"
               @load="loadReviews"
           >
               <div class="review-card" v-for="r in reviews" :key="r.id" @click="toReviewDetail(r)">
                    <!-- Header -->
                    <div class="rc-header">
                        <!-- Order Review Header -->
                        <template v-if="r.reviewType === 'order'">
                             <span class="type-tag order">
                                <van-icon name="bag-o" style="margin-right: 4px; font-size: 15px;" />
                                订单评价 {{ r.orderId ? '#' + (r.orderId.length > 6 ? r.orderId.slice(-6) : r.orderId) : '' }}
                            </span>
                        </template>
                         <!-- Shop Review Header -->
                        <template v-else>
                            <span class="type-tag shop">
                                <van-icon name="shop-o" style="margin-right: 4px; font-size: 15px;" />
                                店铺评价 {{ r.shopName }}
                            </span>
                        </template>
                        <span class="rc-date">{{r.date}}</span>
                    </div>

                   <div class="rc-body">
                        <!-- Main Title -->
                       <div class="rc-shop-name-row">{{r.shopName}}</div>
                       
                        <!-- Rating -->
                       <div class="rc-rating-row">
                           <van-rate v-model="r.rating" readonly size="14" color="#ff9900" void-icon="star" void-color="#eee" />
                           <span class="rc-rating-tag"><span class="emoji">😲</span> 超预期</span>
                       </div>
                       
                       <!-- Content -->
                       <div class="rc-content" v-if="r.content">
                           <div class="rc-text-body" :class="{'collapsed': !r.expanded}">
                               {{ r.content }}
                           </div>
                           <div class="rc-full-text" v-if="r.content.length > 50" @click.stop="r.expanded = !r.expanded">
                               {{ r.expanded ? '收起' : '全文' }}
                           </div>
                       </div>
                       
                       <!-- Images -->
                       <div class="rc-images" v-if="r.images && r.images.length">
                           <img v-for="(img, idx) in r.images" :key="idx" :src="img" class="rc-img">
                       </div>
                        
                       <!-- Footer -->
                       <div class="rc-footer-new">
                           <div class="rc-actions" style="margin-left: auto;">
                               <div class="action-btn">
                                   <svg viewBox="0 0 24 24" width="16" height="16">
                                       <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" :fill="r.liked ? '#ff2442' : '#999'"></path>
                                   </svg>
                                   {{r.likeCount || 0}}
                               </div>
                               <div class="action-btn">
                                   <van-icon name="ellipsis" size="16" />
                               </div>
                           </div>
                       </div>
                   </div>
               </div>
           </van-list>
       </div>
       <!-- Sort Popup -->
       <van-popup v-model:show="showSortSheet" position="bottom" round>
           <div class="sort-sheet-content">
               <div class="sort-item" :class="{active: currentSort==='desc'}" @click="onSortSelect({value: 'desc'})">
                   最新发布
               </div>
               <div class="sort-item" :class="{active: currentSort==='asc'}" @click="onSortSelect({value: 'asc'})">
                   最早发布
               </div>
               <div class="sort-cancel" @click="showSortSheet = false">
                   取消
               </div>
           </div>
       </van-popup>
    </div>
  </PageLayout>
</template>

<script>
import PageLayout from '@/components/PageLayout/PageLayout.vue';
import WaitReviewList from './components/WaitReviewList.vue';
import { getUserReviewList } from '@/api/reviews';
import { getCurrentUser } from '@/api/user';
import { filePrefix } from '@/utils/request';

export default {
  name: 'MyReviews',
  components: { PageLayout, WaitReviewList },
  data() {
    return {
       user: {},
       reviews: [],
       loading: false,
       finished: false,
       page: 1,
       size: 10,

       filePrefix: filePrefix,
       showSortSheet: false,
       currentSort: 'desc',
       activeHeaderTab: 'reviewed', // Default
       draftsCount: 5,
    }
  },
  computed: {
      sortActions() {
          return [
              { name: '最新发布', value: 'desc', color: this.currentSort === 'desc' ? '#ff9900' : '#333' },
              { name: '最早发布', value: 'asc', color: this.currentSort === 'asc' ? '#ff9900' : '#333' }
          ];
      },
      currentSortLabel() {
          const item = this.sortActions.find(a => a.value === this.currentSort);
          return item ? item.name : '按时间筛选';
      }
  },
  created() {
      // Check query param for tab
      const tab = this.$route.query.tab;
      if (tab === 'pending') {
          this.activeHeaderTab = 'pending';
      }
      this.getUserAndLoad();
  },
  activated() {
      // Keep-alive hook: sync tab from URL if changed (e.g. deep link)
      const tab = this.$route.query.tab;
      if (tab && tab !== this.activeHeaderTab && (tab === 'pending' || tab === 'reviewed')) {
          this.activeHeaderTab = tab;
      }
  },
  methods: {
      switchTab(tab) {
          this.activeHeaderTab = tab;
          // Optional: Update query param without reloading
          this.$router.replace({ query: { ...this.$route.query, tab } });
      },
      // Removed goToPending since it's now a tab switch
      toReviewDetail(review) {
          this.$router.push({
              name: 'ReviewDetail',
              query: {
                  id: review.id
              }
          });
      },
      getUserAndLoad() {
          getCurrentUser().then(res => {
              let userData = res.data || res;
              if (userData && userData.data) userData = userData.data;
              
              if (!userData || !userData.id) {
                 this.$router.push("/user/login");
                 return;
              }
              
              this.user = userData;
              // Trigger initial load manually after user is ready
              // Only load reviews if on review tab, or we can just load it anyway
              if (this.activeHeaderTab === 'reviewed') {
                   this.loadReviews();
              } else {
                  // If started on pending, we might want to lazy load reviews when switched
                  // simplified: just call it first time we are on the tab or if we want pre-loading
                  this.loadReviews(); 
              }
          }).catch(err => {
              console.error(err);
              // Handle error silently or show toast
          });
      },
      loadReviews() {
          if (this.finished) return;
          
          // Guard: User ID
          if (!this.user.id) {
              this.loading = false; // Reset loading if we abort
              return;
          }
          
          this.loading = true;
          
          const params = {
              sourceType: 2, 
              current: this.page,
              size: this.size,
              userId: this.user.id,
              sortBy: 'createTime',
              sort: 'createTime',
              sortOrder: this.currentSort,
              status: 0
          };

          getUserReviewList(params).then(res => {
              let list = [];
              // Robust response handling
              if (Array.isArray(res)) list = res;
              else if (res && Array.isArray(res.list)) list = res.list;
              else if (res && Array.isArray(res.data)) list = res.data;
              else if (res && res.data && Array.isArray(res.data.records)) list = res.data.records;
              else if (res && res.data && Array.isArray(res.data.list)) list = res.data.list;
              
              if (list.length === 0) {
                  this.finished = true;
              } else {
                  const newItems = list.map(this.processItem);
                  this.reviews = [...this.reviews, ...newItems];
                  if (list.length < this.size) this.finished = true;
                  else this.page++;
              }
          }).catch(err => {
              this.finished = true; // Stop on error to avoid loops
          }).finally(() => {
              this.loading = false;
          });
      },
      processItem(item) {
          // Process images
          let images = [];
          if (item.images) {
              images = item.images.split(',').map(url => {
                  if (url.startsWith('http')) return url;
                  return this.$fileURL + url;
              });
          }
          
          return {
              id: item.id,
              shopName: item.sourceName || item.shopName || 'Unknown Shop',
              date: this.formatDate(item.createTime),
              rating: item.score || item.rating || 0, // Changed from star to score/rating check
              content: item.content,
              images: images,
              viewCount: item.viewCount || 0,
              likeCount: item.liked || 0,
              expanded: false,
              orderId: item.orderId,
              reviewType: (item.orderId && item.orderId !== 0 && item.orderId !== '0') ? 'order' : 'shop'
          };
      },

       formatDate(time) {
           if (!time) return '';
           const date = new Date(time);
           const y = date.getFullYear();
           const m = date.getMonth() + 1;
           const d = date.getDate();
           return `${y}年${m}月${d}日`;
       },
       onSortSelect(item) {
           this.currentSort = item.value;
           this.showSortSheet = false;
           // Reload
           this.reviews = [];
           this.page = 1;
           this.finished = false;
           this.loadReviews();
       }
  }
}
</script>

<style scoped>
.gray-bg {
    background: #f9f9f9;
}
.custom-header {
    background: #fff;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: 0 1px 0 #fafafa;
}
.header-left {
    font-size: 20px;
    color: #333;
    width: 40px;
    display: flex; /* Centering icon */
    align-items: center;
}
.header-right {
    display: flex;
    align-items: center;
    gap: 4px;
    color: #333;
    font-size: 13px;
    cursor: pointer;
}
.drafts-text {
    white-space: nowrap;
}
.header-center {
    display: flex;
    gap: 20px;
    font-size: 16px;
    color: #666;
    font-weight: 500;
}
.header-tab {
    cursor: pointer;
    position: relative;
    padding-bottom: 4px;
    transition: all 0.2s;
}
.header-tab.active {
    color: #333;
    font-weight: 600;
    font-size: 17px;
}
.header-tab.active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 16px;
    height: 3px;
    background: #ff2442;
    border-radius: 2px;
}

.scroll-wrapper {
    padding-top: 10px;
}
.tab-content {
    min-height: calc(100vh - 48px);
}

/* Banner */
.review-banner-new {
    background: #fff5eb; /* Light orange bg */
    margin: 10px 15px;
    padding: 12px 15px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    font-size: 14px;
    color: #333;
    border: 1px solid #ffe4cc;
}
.banner-icon {
    color: #ff6600;
    font-size: 18px;
    margin-right: 8px;
}
.review-banner-new span {
    flex: 1;
    color: #333;
    font-weight: 500;
}
.arrow-icon {
    color: #ccc;
}

/* Filter */
.review-filter-row {
    background: #fff;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 15px;
    margin-bottom: 2px;
}
.filter-left {
    font-size: 14px;
    color: #666;
    display: flex;
    align-items: center;
}
.filter-right {
    font-size: 12px;
    color: #999;
}

/* Review Card */
.review-list {
    padding: 10px 0;
}
.review-card {
    background: #fff;
    margin: 0 10px 10px 10px;
    padding: 0; /* Remove padding from card, use inner padding */
    border-radius: 12px;
    overflow: hidden;
}

.rc-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 15px;
    background: #f8f9fa;
    border-bottom: 1px solid #f0f0f0;
}

.type-tag {
    font-size: 14px;
    font-weight: 500;
    display: flex;
    align-items: center;
}

.type-tag.order {
    color: #ff6600;
}

.type-tag.shop {
    color: #1677ff;
}

.rc-date {
     font-size: 12px;
     color: #bfbfbf;
}

.rc-body {
    padding: 15px;
}

.rc-shop-name-row {
    font-size: 16px;
    font-weight: 700;
    color: #333;
    margin-bottom: 8px;
}

.rc-date-row {
    font-size: 12px;
    color: #999;
    margin-bottom: 12px;
}
.rc-rating-row {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
}
.rc-rating-tag {
    background: #fff8f2;
    color: #ff6600;
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 4px;
    margin-left: 10px;
    font-weight: 500;
    display: flex;
    align-items: center;
}
.rc-rating-tag .emoji {
    margin-right: 2px;
}
.rc-content {
    margin-bottom: 12px;
}
.rc-text-body {
    font-size: 15px;
    color: #333;
    line-height: 1.6;
    white-space: pre-wrap;
}
.rc-text-body.collapsed {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    overflow: hidden;
}
.rc-full-text {
    font-size: 14px;
    color: #409eff;
    margin-top: 6px;
    cursor: pointer;
}

/* Images */
.rc-images {
    display: flex;
    gap: 8px;
    margin-bottom: 15px;
}
.rc-img {
    width: 110px;
    height: 110px;
    border-radius: 8px;
    object-fit: cover;
}

/* Footer */
.rc-footer-new {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.rc-views {
    font-size: 12px;
    color: #999;
}
.rc-actions {
    display: flex;
    gap: 20px;
}
.action-btn {
    display: flex;
    align-items: center;
    color: #999;
    font-size: 13px;
    gap: 4px;
}
.action-btn i {
    font-size: 16px;
}
.sort-item {
    padding: 16px;
    text-align: center;
    font-size: 16px;
    color: #333;
    border-bottom: 1px solid #f5f5f5;
}
.sort-item:active {
    background-color: #f9f9f9;
}
.sort-item.active {
    color: #ff9900;
}
.sort-cancel {
    padding: 16px;
    text-align: center;
    font-size: 16px;
    color: #666;
    border-top: 8px solid #f7f8fa;
}
.sort-cancel:active {
    background-color: #f9f9f9;
}
</style>
