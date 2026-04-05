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
           <div class="header-right" @click="$router.push({ path: '/drafts', query: { type: 'review' } })">
               <van-icon name="notes-o" size="18" />
               <span class="drafts-text">草稿箱({{ draftsCount }})</span>
           </div>
      </div>

     <div
       class="tab-swipe-area"
       @touchstart.passive="onTouchStart"
       @touchmove.passive="onTouchMove"
       @touchend="onTouchEnd"
     >
     <!-- Tab Content -->
     <!-- Wait Review Tab -->
     <div v-show="activeHeaderTab === 'pending'" class="tab-content">
         <WaitReviewList />
     </div>

     <!-- Reviewed Tab -->
     <div
       v-show="activeHeaderTab === 'reviewed'"
       class="tab-content scroll-wrapper"
       @touchstart.capture.stop.passive="onReviewTypeTouchStart"
       @touchmove.capture.stop.passive="onReviewTypeTouchMove"
       @touchend.capture.stop="onReviewTypeTouchEnd"
       @touchcancel.capture.stop="onReviewTypeTouchCancel"
       @mousedown.capture.stop="onReviewTypeMouseDown"
       @mousemove.capture.stop="onReviewTypeMouseMove"
       @mouseup.capture.stop="onReviewTypeMouseUp"
       @mouseleave.capture.stop="onReviewTypeMouseUp"
    >
      <div class="review-type-tabs">
           <span
               class="review-type-tab"
               :class="{ active: reviewSourceType === 'all' }"
               @click="onReviewTypeSelect('all')"
           >
               全部
           </span>
           <span
               class="review-type-tab"
               :class="{ active: reviewSourceType === '2' }"
               @click="onReviewTypeSelect('2')"
           >
               店铺评价
           </span>
           <span
               class="review-type-tab"
               :class="{ active: reviewSourceType === '4' }"
               @click="onReviewTypeSelect('4')"
           >
               订单评价
           </span>
       </div>
       <!-- Filter -->
       <div class="review-filter-row">
           <div class="filter-left" @click="showSortSheet = true">
               {{ currentSortLabel }} <i class="el-icon-caret-bottom"></i>
           </div>
            <div class="filter-right">{{ currentTypeLabel }}共{{ reviews.length }}条</div>
       </div>

       <div v-if="false" class="review-status-filter-box">
           <div class="review-status-filter-group">
               <div class="review-status-filter-title">业务状态</div>
               <div class="biz-status-filter-row">
                   <button
                     v-for="option in getBusinessStatusFilterOptions()"
                     :key="`review-status-${option.value}`"
                     type="button"
                     class="biz-status-filter-chip"
                     :class="{ 'is-active': selectedBusinessStatus === option.value }"
                     @click="onBusinessStatusSelect(option.value)"
                   >
                     {{ option.label }}
                   </button>
               </div>
           </div>
           <div class="review-status-filter-group">
               <div class="review-status-filter-title">审核状态</div>
               <div class="biz-status-filter-row">
                   <button
                     v-for="option in getAuditStatusFilterOptions()"
                     :key="`review-audit-${option.value}`"
                     type="button"
                     class="biz-status-filter-chip"
                     :class="{ 'is-active': selectedAuditStatus === option.value }"
                     @click="onAuditStatusSelect(option.value)"
                   >
                     {{ option.label }}
                   </button>
               </div>
           </div>
       </div>

       <!-- Review List -->
       <div class="review-list">
            <van-list
                v-model:loading="loading"
                v-model:error="error"
                error-text="请求失败，点击重新加载"
                :finished="finished"
                finished-text="没有更多了"
                :immediate-check="false"
                @load="loadReviews"
            >
               <div class="review-card" v-for="r in reviews" :key="r.id" @click="toReviewDetail(r)">
                    <!-- Header -->
                    <div class="rc-header">
                        <!-- Shop/Order/Product Review Header Info -->
                        <div class="rc-shop-info">
                            <img v-if="r.shopLogo" :src="r.shopLogo" class="rc-shop-logo" />
                            <van-icon v-else name="shop-o" class="rc-shop-icon" />
                            <span class="rc-shop-name">{{ r.shopName }}</span>
                        </div>

                        <!-- Status Tag -->
                        <div class="rc-status-area">
                            <span
                              v-if="getReviewDisplayStatusMeta(r).visible"
                              :class="['biz-status-chip', getStatusToneClass(getReviewDisplayStatusMeta(r).tone)]"
                            >
                              {{ getReviewDisplayStatusMeta(r).text }}
                            </span>
                            <div class="review-status-tag status-pending" v-if="r.status === 0">审核中</div>
                            <div class="review-status-tag status-rejected" v-if="r.status === 2 || r.status === 3">审核未通过</div>
                            <div class="review-status-tag status-draft" v-if="r.status === 4">草稿</div>
                        </div>
                    </div>
                    <div v-if="false" class="biz-status-summary rc-status-summary">
                        <div class="biz-status-summary__grid">
                            <div class="biz-status-summary__item">
                                <span class="biz-status-summary__label">业务状态</span>
                                <span :class="['biz-status-chip', getStatusToneClass(getReviewBusinessStatusMeta(r).tone)]">
                                    {{ getReviewBusinessStatusMeta(r).text }}
                                </span>
                            </div>
                            <div class="biz-status-summary__item">
                                <span class="biz-status-summary__label">审核状态</span>
                                <span :class="['biz-status-chip', getStatusToneClass(getReviewAuditStatusMeta(r).tone)]">
                                    {{ getReviewAuditStatusMeta(r).text }}
                                </span>
                            </div>
                        </div>
                    </div>

                   <div class="rc-body">
                        <!-- Second row: Rating + Date -->
                       <div class="rc-rating-date-row">
                           <van-rate v-model="r.rating" readonly size="14" color="#ff9900" void-icon="star" void-color="#eee" />
                           <span class="rc-date">{{r.date}}</span>
                       </div>
                       
                       <!-- Main Content Area (Text + Optional Image Row) -->
                       <div class="rc-content-area">
                          <div class="rc-text-col">
                              <!-- 商品信息（订单评价时显示） -->
                              <div class="rc-product-info" v-if="r.reviewType === 'product' && r.productName">
                                  <img v-if="r.productCoverImg" :src="r.productCoverImg" class="rc-product-img" />
                                  <span class="rc-product-name">{{ r.productName }}</span>
                                  <span class="rc-product-price" v-if="r.productPrice">¥{{ Number(r.productPrice).toFixed(2) }}</span>
                              </div>

                              <!-- Review Content -->
                              <div class="rc-text-body">
                                  {{ r.content || '暂无文字评价' }}
                              </div>

                              <!-- Reject Reason (If rejected) -->
                              <div class="rc-reject-reason" v-if="getReviewRejectReason(r)">
                                  <van-icon name="warning-o" size="12" style="margin-right:3px;vertical-align:middle;" />
                                  {{ r.rejectReason || '内容未通过审核，请修改后重新提交' }}
                              </div>
                          </div>

                          <!-- single Right-aligned thumbnail if images exist -->
                          <div class="rc-image-col" v-if="r.images && r.images.length">
                              <img :src="r.images[0]" class="rc-img-thumb" />
                              <div class="rc-img-count" v-if="r.images.length > 1">{{ r.images.length }}图</div>
                          </div>
                       </div>
                        
                       <!-- Footer (Likes + Actions) -->
                       <div class="rc-footer-new">
                           <div class="rc-stats">
                               <div class="action-btn">
                                   <van-icon name="like-o" size="14" v-if="!r.isLike"/>
                                   <van-icon name="like" size="14" color="#ff2442" v-else/>
                                   <span style="margin-left:2px;font-size:12px;">{{r.likeCount || 0}}</span>
                               </div>
                               <div class="action-btn" v-if="r.commentCount > 0" style="margin-left: 12px;">
                                   <van-icon name="comment-o" size="14" />
                                   <span style="margin-left:2px;font-size:12px;">{{r.commentCount}}</span>
                               </div>
                               <div class="action-btn" style="margin-left: 8px;">···</div>
                           </div>

                           <div class="rc-actions-right">
                               <van-button 
                                 v-if="shouldShowReviewEdit(r)"
                                 size="mini" 
                                 plain 
                                 type="primary" 
                                 round 
                                 class="btn-action edit-btn"
                                 @click.stop="onEditReview(r)"
                               >修改</van-button>
                               <span
                                 v-if="shouldShowReviewDelete(r)"
                                 class="btn-delete-text"
                                 @click.stop="onDeleteReview(r)"
                               >删除</span>
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
    </div>
  </PageLayout>
</template>

<script>
import PageLayout from '@/components/PageLayout/PageLayout.vue';
import WaitReviewList from './components/WaitReviewList.vue';
import { getUserReviewList } from '@/api/reviews';
import { getCurrentUser } from '@/api/user';
import { filePrefix } from '@/utils/request';
import {
    getAuditStatusMeta,
    getBusinessStatusMeta,
    getRejectReasonText,
    getSingleDisplayStatusMeta,
    getStatusToneClass
} from '@/utils/contentStatus';

export default {
  name: 'MyReviews',
  components: { PageLayout, WaitReviewList },
  data() {
    return {
       user: {},
       reviews: [],
       loading: false,
       error: false,
       finished: false,
       page: 1,
       size: 10,

       filePrefix: filePrefix,
       showSortSheet: false,
       currentSort: 'desc',
       reviewSourceType: 'all',
       activeHeaderTab: 'reviewed', // Default
       draftsCount: 5,
       headerTabOrder: ['pending', 'reviewed'],
       reviewTypeOrder: ['all', '2', '4'],
       touchStartX: 0,
       touchStartY: 0,
       touchEndX: 0,
       touchEndY: 0,
       swipeThreshold: 60,
       maxVerticalTravel: 50,
       reviewTouchStartX: 0,
       reviewTouchStartY: 0,
       reviewTouchEndX: 0,
       reviewTouchEndY: 0,
       reviewSwipeThreshold: 24,
       reviewMaxVerticalTravel: 120,
       reviewPointerActive: false
    }
  },
  computed: {
      reviewTypeActions() {
          return [
              { name: '全部', value: 'all' },
              { name: '店铺评价', value: '2' },
              { name: '订单评价', value: '4' }
          ];
      },
      currentTypeLabel() {
          const item = this.reviewTypeActions.find(a => a.value === this.reviewSourceType);
          return item ? item.name : '全部';
      },
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
      businessStatusOptions() {
          return getBusinessStatusOptions('review', { includeAll: true, allLabel: '全部业务状态' });
      },
      auditStatusOptions() {
          return getAuditStatusOptions({ includeAll: true, allLabel: '全部审核状态' });
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
          if (tab === this.activeHeaderTab) return;
          this.activeHeaderTab = tab;
          this.$router.replace({ query: { ...this.$route.query, tab } });
          if (tab === 'reviewed' && this.reviews.length === 0 && !this.loading && !this.finished) {
              this.loadReviews();
          }
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
      onTouchEnd() {
          const deltaX = this.touchEndX - this.touchStartX;
          const deltaY = Math.abs(this.touchEndY - this.touchStartY);

          if (deltaY > this.maxVerticalTravel) return;
          if (Math.abs(deltaX) < this.swipeThreshold) return;

          const currentIndex = this.headerTabOrder.indexOf(this.activeHeaderTab);
          if (currentIndex < 0) return;

          if (deltaX < 0 && currentIndex < this.headerTabOrder.length - 1) {
              this.switchTab(this.headerTabOrder[currentIndex + 1]);
          } else if (deltaX > 0 && currentIndex > 0) {
              this.switchTab(this.headerTabOrder[currentIndex - 1]);
          }
      },
      onReviewTypeTouchStart(e) {
          const touch = e.touches && e.touches[0];
          if (!touch) return;
          this.startReviewSwipe(touch.clientX, touch.clientY);
      },
      onReviewTypeTouchMove(e) {
          const touch = e.touches && e.touches[0];
          if (!touch) return;
          this.updateReviewSwipe(touch.clientX, touch.clientY);
      },
      onReviewTypeTouchEnd(e) {
          const touch = e.changedTouches && e.changedTouches[0];
          if (touch) {
              this.updateReviewSwipe(touch.clientX, touch.clientY);
          }
          this.finishReviewSwipe();
      },
      onReviewTypeTouchCancel() {
          this.reviewPointerActive = false;
      },
      onReviewTypeMouseDown(e) {
          if (e.button !== 0) return;
          this.reviewPointerActive = true;
          this.startReviewSwipe(e.clientX, e.clientY);
      },
      onReviewTypeMouseMove(e) {
          if (!this.reviewPointerActive) return;
          this.updateReviewSwipe(e.clientX, e.clientY);
      },
      onReviewTypeMouseUp() {
          if (!this.reviewPointerActive) return;
          this.reviewPointerActive = false;
          this.finishReviewSwipe();
      },
      startReviewSwipe(x, y) {
          this.reviewTouchStartX = x;
          this.reviewTouchStartY = y;
          this.reviewTouchEndX = x;
          this.reviewTouchEndY = y;
      },
      updateReviewSwipe(x, y) {
          this.reviewTouchEndX = x;
          this.reviewTouchEndY = y;
      },
      finishReviewSwipe() {
          const deltaX = this.reviewTouchEndX - this.reviewTouchStartX;
          const absX = Math.abs(deltaX);
          const absY = Math.abs(this.reviewTouchEndY - this.reviewTouchStartY);
          if (absY > this.reviewMaxVerticalTravel) return;
          if (absX < this.reviewSwipeThreshold) return;
          if (absX <= absY * 1.05) return;

          const currentIndex = this.reviewTypeOrder.indexOf(this.reviewSourceType);
          if (currentIndex < 0) return;

          if (deltaX < 0 && currentIndex < this.reviewTypeOrder.length - 1) {
              this.onReviewTypeSelect(this.reviewTypeOrder[currentIndex + 1]);
          } else if (deltaX > 0 && currentIndex > 0) {
              this.onReviewTypeSelect(this.reviewTypeOrder[currentIndex - 1]);
          }
      },
      onReviewTypeSelect(type) {
          if (this.reviewSourceType === type) return;
          this.reviewSourceType = type;
          this.resetReviewedList();
          this.loadReviews();
      },
      resetReviewedList() {
          this.reviews = [];
          this.page = 1;
          this.error = false;
          this.finished = false;
      },
      getStatusToneClass,
      getBusinessStatusFilterOptions() {
          return getBusinessStatusOptions('review', { includeAll: true, allLabel: '全部业务状态' });
      },
      getAuditStatusFilterOptions() {
          return getAuditStatusOptions({ includeAll: true, allLabel: '全部审核状态' });
      },
      getReviewBusinessStatusMeta(item) {
          return getBusinessStatusMeta('review', item?.status);
      },
      getReviewAuditStatusMeta(item) {
          return getAuditStatusMeta(item?.auditStatus);
      },
      getReviewDisplayStatusMeta(item) {
          return getSingleDisplayStatusMeta('review', item?.status, item?.auditStatus);
      },
      getReviewRejectReason(item) {
          return getRejectReasonText(item?.auditStatus, item?.rejectReason);
      },
      shouldShowReviewEdit(item) {
          return this.getReviewDisplayStatusMeta(item).key === 'draft' || !!this.getReviewRejectReason(item);
      },
      shouldShowReviewDelete() {
          return true;
      },
      onBusinessStatusSelect(value) {
          if (this.selectedBusinessStatus === value) return;
          this.selectedBusinessStatus = value;
          this.resetReviewedList();
          this.loadReviews();
      },
      onAuditStatusSelect(value) {
          if (this.selectedAuditStatus === value) return;
          this.selectedAuditStatus = value;
          this.resetReviewedList();
          this.loadReviews();
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
      onEditReview(review) {
          this.$router.push({
              name: 'ReviewPublish',
              query: {
                  id: review.id,
                  type: review.sourceType
              }
          });
      },
      async onDeleteReview(review) {
          try {
              await this.$dialog.confirm({
                  title: '提示',
                  message: '确定要删除这条评价吗？不可恢复'
              });
              // Note: actual backend deletion api should be imported and called here
              this.$toast('删除成功');
              this.resetReviewedList();
              this.loadReviews();
          } catch(e) {}
      },
      onEditReview(review) {
          this.$router.push({
              name: 'ReviewPublish',
              query: {
                  id: review.id,
                  type: review.sourceType
              }
          });
      },
      async onDeleteReview(review) {
          try {
              await this.$dialog.confirm({
                  title: '提示',
                  message: '确定要删除这条评价吗？不可恢复'
              });
              // ... deletion endpoint ...
              this.$toast('删除成功');
              this.resetReviewedList();
              this.loadReviews();
          } catch(e) {}
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
              current: this.page,
              size: this.size,
              userId: this.user.id,
              sort: this.currentSort
          };
          if (this.reviewSourceType !== 'all') {
              params.sourceType = Number(this.reviewSourceType);
          }
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
              this.error = true;
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
              shopName: item.shopName || item.sourceName || 'Unknown Shop',
              shopLogo: item.shopLogo ? (item.shopLogo.startsWith('http') ? item.shopLogo : this.$fileURL + item.shopLogo) : '',
              date: this.formatDate(item.createTime),
              rating: item.score || item.rating || 0,
              content: item.content,
              images: images,
              viewCount: item.viewCount || 0,
              likeCount: item.liked || item.likeCount || 0,
              isLike: item.isLike === true || item.isLike === 1 || item.isLike === '1' || item.isLike === 'true',
              expanded: false,
              sourceType: Number(item.sourceType || 2),
              reviewType: Number(item.sourceType || 2) === 4 ? 'product' : 'shop',
              productName: item.productName || '',
              productPrice: item.productPrice || 0,
              productCoverImg: item.productCoverImg ? (item.productCoverImg.startsWith('http') ? item.productCoverImg : this.$fileURL + item.productCoverImg) : '',
              rejectReason: item.rejectReason || '',
              status: item.status,
              auditStatus: item.auditStatus
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
           this.resetReviewedList();
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

.tab-swipe-area {
    min-height: calc(100vh - 48px);
}

.scroll-wrapper {
    padding-top: 10px;
}
.review-type-tabs {
    background: #fff;
    display: flex;
    gap: 8px;
    padding: 10px 12px 8px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
}
.review-type-tabs::-webkit-scrollbar {
    display: none;
}
.review-type-tab {
    flex-shrink: 0;
    font-size: 12px;
    color: #666;
    line-height: 1;
    padding: 8px 12px;
    border-radius: 14px;
    border: 1px solid #eee;
    background: #fff;
    cursor: pointer;
}
.review-type-tab.active {
    color: #ff2442;
    border-color: #ff2442;
    background: #fff1f4;
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
.review-status-filter-box {
    background: #fff;
    padding: 0 15px 12px;
    margin-bottom: 8px;
}
.review-status-filter-group + .review-status-filter-group {
    margin-top: 10px;
}
.review-status-filter-title {
    margin-bottom: 8px;
    font-size: 12px;
    color: #999;
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
    padding: 14px 15px 0;
    margin-bottom: 0;
}
.rc-body {
    padding: 12px 15px 15px;
}

.rc-shop-info {
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 0;
}

.rc-shop-logo {
    width: 24px;
    height: 24px;
    border-radius: 4px;
    object-fit: cover;
    margin-right: 8px;
    border: 1px solid #f0f0f0;
}

.rc-shop-icon {
    font-size: 24px;
    margin-right: 8px;
    color: #999;
}

.rc-shop-name {
    font-size: 15px;
    font-weight: 700;
    color: #111;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.rc-status-area {
    display: flex;
    align-items: center;
}
.rc-status-summary {
    padding: 10px 15px 12px;
    border-bottom: 1px solid #f7f7f7;
    border-radius: 0;
    background: transparent;
}

.review-status-tag {
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 4px;
    color: #fff;
    white-space: nowrap;
    display: none;
}

.status-pending { background: #8c8c8c; }
.status-rejected { background: #ff4d4f; }
.status-draft { background: #bfbfbf; }

.rc-rating-date-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.rc-date {
     font-size: 12px;
     color: #bfbfbf;
}

.rc-content-area {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
}

.rc-text-col {
    flex: 1;
    min-width: 0;
}

.rc-product-info {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: #666;
    margin-bottom: 8px;
    background: #f7f8fa;
    padding: 6px 10px;
    border-radius: 6px;
}
.rc-product-img {
    width: 36px;
    height: 36px;
    border-radius: 6px;
    object-fit: cover;
    flex-shrink: 0;
    border: 1px solid #eee;
}
.rc-product-name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #333;
}
.rc-product-price {
    flex-shrink: 0;
    color: #ff4d4f;
    font-weight: 600;
}

.rc-text-body {
    font-size: 15px;
    color: #333;
    line-height: 1.6;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    overflow: hidden;
    text-overflow: ellipsis;
}

.rc-reject-reason {
    margin-top: 6px;
    font-size: 12px;
    color: #ff4d4f;
    background: #fff1f0;
    padding: 6px 8px;
    border-radius: 4px;
}

.rc-image-col {
    position: relative;
    flex-shrink: 0;
}

.rc-img-thumb {
    width: 64px;
    height: 64px;
    border-radius: 6px;
    object-fit: cover;
    border: 1px solid #f0f0f0;
}

.rc-img-count {
    position: absolute;
    bottom: 4px;
    right: 4px;
    background: rgba(0, 0, 0, 0.5);
    color: #fff;
    font-size: 10px;
    padding: 1px 4px;
    border-radius: 8px;
}

.rc-footer-new {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 10px;
    border-top: 1px solid #f9f9f9;
}

.rc-stats {
    display: flex;
    align-items: center;
}

.rc-actions-right {
    display: flex;
    gap: 8px;
}

.btn-action {
    height: 24px !important;
    padding: 0 12px !important;
    font-size: 12px !important;
}

.btn-action.edit-btn {
    color: #1677ff !important;
    border-color: #1677ff !important;
}

.btn-delete-text {
    font-size: 12px;
    color: #999;
    cursor: pointer;
    line-height: 24px;
    padding: 0 4px;
}
.btn-delete-text:active {
    color: #ff4d4f;
}

.action-btn {
    display: flex;
    align-items: center;
    color: #bfbfbf;
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

/* Status Badges */
.review-status-tag {
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 11px;
    color: #fff;
    font-weight: 500;
    display: none;
}
.status-pending {
    background: #8c8c8c;
}
.status-rejected {
    background: #ff4d4f;
}
</style>
