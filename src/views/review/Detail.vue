<template>
  <PageLayout :loading="pageLoading" skeleton-type="detail" class="review-detail-wrapper">
    <!-- Header with Back Button -->
    <div class="detail-header">
        <div class="back-btn" @click="$router.go(-1)">
            <i class="el-icon-arrow-left"></i>
        </div>
        <div class="header-title">评价详情</div>
        <div class="header-right">
             <van-popover
                v-model:show="showMenu"
                :actions="menuActions"
                trigger="click"
                placement="bottom-end"
                @select="onMenuSelect"
                v-if="isMe"
             >
                <template #reference>
                    <i class="el-icon-more"></i>
                </template>
             </van-popover>
             <i class="el-icon-more" v-else></i>
        </div>
    </div>
    
    <div class="review-detail-page" v-if="review">
        <!-- Author Info -->
        <div class="author-info">
            <img :src="review.userAvatar || defaultAvatar" class="avatar" />
            <div class="info-right">
                <div class="name-row">
                    <span class="name">{{ review.userName || 'Unknown' }}</span>
                    <span class="level-tag">Lv1</span>
                </div>
                <div class="date">发布于 {{ review.date }}</div>
            </div>
            <!-- Removed more-btn as per request -->
        </div>

        <!-- Status Badges -->
        <div class="review-status-row" v-if="isMe && (review.status === 0 || review.status === 2 || review.status === 3)">
            <div class="detail-status-tag status-pending" v-if="review.status === 0">审核中</div>
            <div class="detail-status-tag status-rejected" v-if="review.status === 2 || review.status === 3">审核未通过</div>
        </div>

        <div v-if="false" class="biz-status-summary review-status-summary">
            <div class="biz-status-summary__grid">
                <div class="biz-status-summary__item">
                    <span class="biz-status-summary__label">业务状态</span>
                    <span :class="['biz-status-chip', getStatusToneClass(reviewBusinessStatusMeta.tone)]">
                        {{ reviewBusinessStatusMeta.text }}
                    </span>
                </div>
                <div class="biz-status-summary__item">
                    <span class="biz-status-summary__label">审核状态</span>
                    <span :class="['biz-status-chip', getStatusToneClass(reviewAuditStatusMeta.tone)]">
                        {{ reviewAuditStatusMeta.text }}
                    </span>
                </div>
            </div>
            <div v-if="reviewRejectReason" class="biz-status-summary__reason">驳回原因：{{ reviewRejectReason }}</div>
        </div>

        <div v-if="isMe && (reviewDisplayStatusMeta.visible || reviewRejectReason)" class="review-status-summary single-status-panel">
            <div v-if="reviewDisplayStatusMeta.visible" class="single-status-panel__row">
                <span :class="['biz-status-chip', getStatusToneClass(reviewDisplayStatusMeta.tone)]">
                    {{ reviewDisplayStatusMeta.text }}
                </span>
            </div>
            <div v-if="reviewRejectReason" class="single-status-panel__reason">驳回原因：{{ reviewRejectReason }}</div>
        </div>

        <!-- Rating & Tags -->
        <div class="rating-section">
            <span class="rating-tag"><span class="emoji">🎁</span> 超预期</span>
            <van-rate v-model="review.rating" readonly size="14" color="#ff9900" void-icon="star" void-color="#eee" />
            <span class="free-trial-tag" v-if="review.isFreeTrial">免费试评价 ></span>
        </div>

        <!-- Scores -->
        <div class="scores-row">
            <span>口味: {{ (review.scores && review.scores.taste) || '5.0' }}</span>
            <span>环境: {{ (review.scores && review.scores.env) || '5.0' }}</span>
            <span>服务: {{ (review.scores && review.scores.service) || '5.0' }}</span>
        </div>

        <!-- Content -->
        <div class="detail-content">
            <div class="content-text">{{ review.content }}</div>
            <!-- Images -->
            <div class="detail-images">
                 <img 
                    v-for="(img, idx) in review.images" 
                    :key="idx" 
                    :src="img" 
                    class="d-img"
                    :class="{'one-image': review.images.length === 1}"
                    @click="previewImage(review.images, idx)"
                 />
            </div>
        </div>

        <!-- 订单评价卡片：商品主 + 店铺副 -->
        <div class="order-card" v-if="voucher && voucher.name">
          <div class="order-product-row" @click="toVoucherDetail">
            <div class="order-product-img">
              <img :src="voucher.image ? (voucher.image.startsWith('http') ? voucher.image : imgPrefix + voucher.image) : ''" v-if="voucher.image" @error="(e) => e.target.style.display='none'">
              <i class="el-icon-goods" v-if="!voucher.image" style="font-size:24px;color:#aaa;"></i>
            </div>
            <div class="order-product-info">
              <div class="order-product-name">{{ voucher.name }}</div>
              <div class="order-product-price">¥{{ Number(voucher.price || 0).toFixed(2) }}</div>
            </div>
            <button class="order-buy-btn" @click.stop="buyVoucher">去购买</button>
          </div>
          <div class="order-shop-row" @click.stop="toShopDetail">
            <div class="order-shop-icon">
              <img :src="formatShopLogo(voucher.shopLogo)" v-if="voucher.shopLogo" @error="(e) => e.target.style.display='none'">
              <i class="el-icon-s-shop" v-if="!voucher.shopLogo" style="font-size:13px;color:#66bb6a;"></i>
            </div>
            <span class="order-shop-name">{{ voucher.shopName }}</span>
            <span class="order-shop-link">进店看看 ›</span>
          </div>
        </div>

        <!-- 店铺评价卡片：单独展示店铺信息 -->
        <div class="shop-card" v-else-if="review.shopId" @click="toShopDetail">
          <div class="shop-card-img">
            <img :src="(review.shopImages && review.shopImages.length) ? review.shopImages[0] : ''" v-if="review.shopImages && review.shopImages.length" @error="(e) => e.target.style.display='none'">
            <i class="el-icon-s-shop" v-else style="font-size:24px;color:#66bb6a;"></i>
          </div>
          <div class="shop-card-info">
            <div class="shop-card-name">{{ review.shopName }}</div>
            <div class="shop-card-sub">📍 {{ review.shopAddress || review.shopCategory || '' }}</div>
          </div>
          <button class="shop-card-btn" @click.stop="toShopDetail">进店看看</button>
        </div>

        <!-- Views -->


        <!-- Comments Section -->
        <div class="comments-section" ref="commentsSection">
            <div class="comments-title">评论 ({{ (review && review.comments) || comments.length }})</div>
                <div class="comments-sort-group">
                    <span
                      class="comments-sort-btn"
                      :class="{ active: commentSortType === 'latest' }"
                      @click="onCommentSortChange('latest')"
                    >
                      最新
                    </span>
                    <span
                      class="comments-sort-btn"
                      :class="{ active: commentSortType === 'hot' }"
                      @click="onCommentSortChange('hot')"
                    >
                      热门
                    </span>
                </div>
                <div class="comment-list" v-if="comments.length > 0">
                    <div class="comment-box" v-for="c in comments" :key="c.id">
                        <div class="comment-icon" @click.stop="toUserDetail(c.userId)">
                            <img :src="c.userAvatar" />
                        </div>
                        <div class="comment-info">
                            <div class="comment-user" @click.stop="toUserDetail(c.userId)">
                                {{ c.nickName || '匿名用户' }} <span>Lv{{c.userLevel || 1}}</span>
                            </div>
                            <div class="comment-content" @click="handleReply(c)">{{ c.content }}</div>
                            <div class="comment-images" v-if="c.images && c.images.length">
                                <img v-for="(img, idx) in c.images" :key="idx" :src="img" @click.stop="previewImage(c.images, idx)" />
                            </div>
                            
                            <div class="comment-interactions">
                                <span class="comment-time">{{ c.createTime }}</span>
                                <div class="comment-actions">
                                    <div class="c-action-btn" @click.stop="handleCommentLike(c)">
                                        <svg viewBox="0 0 24 24" width="16" height="16">
                                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" :fill="c.isLike ? '#ff2442' : '#999'"></path>
                                        </svg>
                                        <span v-if="c.liked > 0">{{c.liked}}</span>
                                    </div>
                                    <div class="c-action-btn" @click.stop="handleReply(c)">
                                        <i class="el-icon-chat-dot-square"></i>
                                    </div>
                                    <div class="c-action-btn delete-btn" v-if="user.id === c.userId" @click.stop="handleCommentDelete(c)">
                                        <i class="el-icon-delete"></i>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Replies -->
                            <div class="comment-replies" v-if="c.comments > 0">
                                <!-- Initial Expand Button (Only show if NOT expanded) -->
                                <div class="reply-expand" v-if="!c.showReplies" @click.stop="toggleReplies(c)">
                                    展开{{c.comments}}条回复 <i class="el-icon-arrow-down"></i>
                                </div>

                                <!-- Reply List (Show if expanded) -->
                                <template v-if="c.showReplies">
                                    <div class="reply-item" v-for="r in c.replies" :key="r.id">
                                        <div class="reply-avatar" @click.stop="toUserDetail(r.userId)">
                                            <img :src="r.userAvatar || defaultAvatar" alt="">
                                        </div>
                                        <div class="reply-main">
                                            <div class="reply-header">
                                                <span class="reply-user" @click.stop="toUserDetail(r.userId)">{{r.nickName || '匿名用户'}}</span>
                                                <!-- Remove time from here -->
                                            </div>
                                            <div class="reply-content">
                                                <span v-if="r.replyToName" class="reply-target">回复 @{{r.replyToName}}</span>
                                                {{r.content}}
                                            </div>
                                            <div class="reply-actions">
                                                <!-- Add time here -->
                                                <span class="reply-time" style="margin-right: 10px;">{{r.createTime}}</span>
                                                
                                                <div class="c-action-btn" @click.stop="handleCommentLike(r)">
                                                <svg viewBox="0 0 24 24" width="14" height="14">
                                                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" :fill="r.isLike ? '#ff2442' : '#999'"></path>
                                                </svg>
                                                <span v-if="r.liked > 0">{{r.liked}}</span>
                                                </div>
                                                <div class="c-action-btn delete-btn" v-if="user.id === r.userId" @click.stop="handleCommentDelete(r)">
                                                    <i class="el-icon-delete"></i>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Load More / Collapse Button (Show at BOTTOM) -->
                                    <!-- Only show if there are more to load OR if the list was long enough to warrant a collapse button (>10) -->
                                    <div class="reply-expand" 
                                         v-if="c.replies.length > 0" 
                                         @click.stop="toggleReplies(c)">
                                         <template v-if="c.replies.length < Number(c.comments)">
                                            展开更多回复 <i class="el-icon-arrow-down"></i>
                                         </template>
                                         <template v-else>
                                            收起回复 <i class="el-icon-arrow-up"></i>
                                         </template>
                                    </div>
                                </template>
                            </div>
                </div>
            </div>
            
            <div class="no-comments" v-if="comments.length === 0 && !commentsLoading && commentsNoMore">暂无评论</div>
            <div class="comment-load-state" v-if="commentsLoading">加载中...</div>
            <div class="comment-load-state comment-load-end" v-else-if="commentsNoMore && comments.length > 0">没有更多评论了</div>
                        <div ref="commentLoadTrigger" class="comment-load-trigger" v-if="!commentsNoMore"></div>
        </div>

        <!-- Sticky Bottom Bar (Same style as Blog Detail) -->
        <div class="sticky-bottom-bar" :class="{ 'is-focused': isInputFocus }">
            <div class="inline-input-container" v-show="isInputFocus">
                <div class="inline-textarea-wrapper">
                    <textarea
                        ref="inlineTextarea"
                        v-model="commentText"
                        :placeholder="replyToComment ? ('回复 @' + (replyToComment.nickName || replyToComment.userName || '用户')) : '说点什么吧...'"
                        :maxlength="500"
                        rows="3"
                        @focus="onInlineFocus"
                    ></textarea>
                </div>
                <div class="inline-images" v-if="selectedImages.length > 0">
                    <div class="inline-image-item" v-for="(img, idx) in selectedImages" :key="idx">
                        <img :src="img.url">
                        <i class="el-icon-close" @click="removeImage(idx)"></i>
                    </div>
                    <div class="inline-image-add" @click="$refs.imageInput.click()" v-if="selectedImages.length < 9">
                        <i class="el-icon-plus"></i>
                    </div>
                </div>
                <div class="inline-toolbar">
                    <div class="inline-toolbar-left">
                        <span class="toolbar-icon" @click="insertAt">@</span>
                        <svg class="toolbar-icon pic-icon" @click="$refs.imageInput.click()" viewBox="0 0 1024 1024" width="22" height="22">
                            <path d="M896 160H128c-35.2 0-64 28.8-64 64v576c0 35.2 28.8 64 64 64h768c35.2 0 64-28.8 64-64V224c0-35.2-28.8-64-64-64z m0 640H128V224h768v576z" fill="#666"></path>
                            <path d="M320 512c53 0 96-43 96-96s-43-96-96-96-96 43-96 96 43 96 96 96z" fill="#666"></path>
                            <path d="M896 736l-192-192-128 96-192-160-256 256v64h768z" fill="#666"></path>
                        </svg>
                        <input type="file" ref="imageInput" multiple accept="image/*" @change="handleImageUpload" style="display:none">
                        <van-icon
                            name="smile-o"
                            class="emoji-icon emoji-toggle"
                            :class="{ active: showEmojiPanel }"
                            @click="toggleEmojiPanel"
                        />
                    </div>
                    <div class="inline-toolbar-right">
                        <el-button class="cancel-btn" size="small" round @click="closeInlineInput">取消</el-button>
                        <el-button class="send-btn" type="primary" size="small" :disabled="!commentText.trim()" round @click="publishComment">发送</el-button>
                    </div>
                </div>
                <div class="emoji-panel" v-show="showEmojiPanel">
                    <div class="emoji-grid">
                        <span class="emoji-item" v-for="emoji in emojis" :key="emoji" @click="insertEmoji(emoji)">{{emoji}}</span>
                    </div>
                </div>
            </div>

            <div class="compact-bottom-bar" v-show="!isInputFocus">
                <div class="compact-input-placeholder" @click="checkLogin">
                    <i class="el-icon-edit"></i>
                    <span>说点什么吧...</span>
                </div>
                <div class="compact-actions">
                    <div class="action-item" @click="addLike">
                        <svg viewBox="0 0 24 24" width="22" height="22">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" :fill="review.isLike ? '#ff2442' : '#333'"></path>
                        </svg>
                        <span>{{ review.likeCount || 0 }}</span>
                    </div>
                    <div class="action-item" @click="toggleCollect">
                        <i :class="review.isCollect ? 'el-icon-star-on active' : 'el-icon-star-off'"></i>
                        <span>{{ review.collectCount || 0 }}</span>
                    </div>
                    <div class="action-item" @click="scrollToComments">
                        <i class="el-icon-chat-dot-round"></i>
                        <span>{{ review.comments || comments.length || 0 }}</span>
                    </div>
                </div>
            </div>
        </div>
        </div>
    </div>
    <!-- End of Review Detail Page -->

    <!-- All Reviews Bottom Sheet Popup -->
    <div class="review-popup-overlay" v-if="showReviewPopup" @click="showReviewPopup = false">
       <div class="review-popup-sheet" @click.stop>
          <div class="review-popup-header">
             <span class="review-popup-title">全部评论 ({{review.comments || comments.length}})</span>
             <i class="el-icon-close review-popup-close" @click="showReviewPopup = false"></i>
          </div>
          <div class="review-popup-body" @scroll.passive="onPopupScroll">
             <div v-if="allComments.length === 0 && !allCommentsLoading" class="empty-reviews">
                <i class="el-icon-chat-round"></i>
                <p>暂无评论</p>
             </div>
             
             <div class="comment-box" v-for="c in allComments" :key="c.id">
                 <div class="comment-icon" @click.stop="toUserDetail(c.userId)">
                     <img :src="c.userAvatar" />
                 </div>
                 <div class="comment-info">
                     <div class="comment-user" @click.stop="toUserDetail(c.userId)">
                         {{ c.nickName || '匿名用户' }} <span>Lv{{c.userLevel || 1}}</span>
                     </div>
                     <div class="comment-content" @click="handleReply(c)">{{ c.content }}</div>
                     <div class="comment-images" v-if="c.images && c.images.length">
                         <img v-for="(img, idx) in c.images" :key="idx" :src="img" @click.stop="previewImage(c.images, idx)" />
                     </div>
                     
                     <div class="comment-interactions">
                         <span class="comment-time">{{ c.createTime }}</span>
                         <div class="comment-actions">
                             <div class="c-action-btn" @click.stop="handleCommentLike(c)">
                                 <svg viewBox="0 0 24 24" width="16" height="16">
                                     <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" :fill="c.isLike ? '#ff2442' : '#999'"></path>
                                 </svg>
                                 <span v-if="c.liked > 0">{{c.liked}}</span>
                             </div>
                             <div class="c-action-btn" @click.stop="handleReply(c)">
                                 <i class="el-icon-chat-dot-square"></i>
                             </div>
                             <div class="c-action-btn delete-btn" v-if="user.id === c.userId" @click.stop="handleCommentDelete(c)">
                                 <i class="el-icon-delete"></i>
                             </div>
                         </div>
                     </div>
                     
                     <!-- Replies -->
                     <div class="comment-replies" v-if="c.comments > 0">
                         <!-- Initial Expand Button -->
                         <div class="reply-expand" v-if="!c.showReplies" @click.stop="toggleReplies(c)">
                             展开{{c.comments}}条回复 <i class="el-icon-arrow-down"></i>
                         </div>

                         <!-- Reply List -->
                         <template v-if="c.showReplies">
                             <div class="reply-item" v-for="r in c.replies" :key="r.id">
                                 <div class="reply-avatar" @click.stop="toUserDetail(r.userId)">
                                     <img :src="r.userAvatar || defaultAvatar" alt="">
                                 </div>
                                 <div class="reply-main">
                                     <div class="reply-header">
                                         <span class="reply-user" @click.stop="toUserDetail(r.userId)">{{r.nickName || '匿名用户'}}</span>
                                     </div>
                                     <div class="reply-content">
                                         <span v-if="r.replyToName" class="reply-target">回复 @{{r.replyToName}}:</span>
                                         {{r.content}}
                                     </div>
                                     <div class="reply-actions">
                                         <span class="reply-time" style="margin-right: 10px;">{{r.createTime}}</span>
                                         
                                         <div class="c-action-btn" @click.stop="handleCommentLike(r)">
                                         <svg viewBox="0 0 24 24" width="14" height="14">
                                             <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" :fill="r.isLike ? '#ff2442' : '#999'"></path>
                                         </svg>
                                         <span v-if="r.liked > 0">{{r.liked}}</span>
                                         </div>
                                         <div class="c-action-btn delete-btn" v-if="user.id === r.userId" @click.stop="handleCommentDelete(r)">
                                            <i class="el-icon-delete"></i>
                                        </div>
                                     </div>
                                 </div>
                             </div>
                             
                             <!-- Load More / Collapse Button -->
                             <div class="reply-expand" 
                                  v-if="c.replies.length > 0" 
                                  @click.stop="toggleReplies(c)">
                                  <template v-if="c.replies.length < Number(c.comments)">
                                     展开更多回复 <i class="el-icon-arrow-down"></i>
                                  </template>
                                  <template v-else>
                                     收起回复 <i class="el-icon-arrow-up"></i>
                                  </template>
                             </div>
                         </template>
                     </div>
                 </div>
             </div>
             
             <div v-if="allCommentsLoading" class="loading-more">加载中...</div>
             <div v-if="allCommentsNoMore && allComments.length > 0" class="no-more-reviews">没有更多评论了</div>
          </div>
          <!-- Bottom Input Bar in Popup -->
          <div class="popup-bottom-bar" @click.stop>
             <input
               ref="popupCommentInput"
               v-model="commentText"
               class="popup-input-editor"
               :placeholder="replyToComment ? ('回复 @' + (replyToComment.nickName || replyToComment.userName || '用户')) : '说点什么吧~'"
               maxlength="500"
               @focus="handlePopupInputFocus"
               @click.stop
             />
             <el-button
               type="primary"
               size="small"
               round
               :disabled="!commentText.trim()"
               @click.stop="publishCommentFromPopup"
             >发布</el-button>
          </div>
       </div>
    </div>

    <!-- Image Preview Component -->
    <el-image-viewer 
        v-if="showImagePreview" 
        :url-list="previewImages" 
        :initial-index="currentPreviewIndex" 
        @close="closeImagePreview" 
        hide-on-click-modal 
    />
  </PageLayout>
</template>

<script>
import { ElImageViewer } from 'element-plus';
import anonymousAvatar from '@/assets/images/anonymous.png';
import { likeComment, getComments, addComment, removeComment, getChildComments, toggleStar } from '@/api/interaction';
import { removeReview, getReview, likeReviewComment } from '@/api/reviews';
import { getCurrentUser } from '@/api/user';
import { uploadFile } from '@/api/common';
import { fileURL } from '@/utils/request';
import { throttle } from '@/utils/throttle';
import { getProductDetail } from '@/api/shop';
import { showConfirmDialog } from 'vant';
import {
    getAuditStatusMeta,
    getBusinessStatusMeta,
    isDraftBusinessStatus,
    getRejectReasonText,
    getSingleDisplayStatusMeta,
    getStatusToneClass
} from '@/utils/contentStatus';
import '@/assets/css/blog-detail.css'; // Import blog-detail.css for shared styles
import PageLayout from '@/components/PageLayout/PageLayout.vue';

export default {
  name: 'ReviewDetail',
  components: { ElImageViewer, PageLayout },
  data() {
      return {
          pageLoading: true,
          defaultAvatar: anonymousAvatar,
          review: null,
          voucher: null,  // 代金券详情
          imgPrefix: fileURL,
          comments: [],
          commentsPage: 1,
          commentsPageSize: 10,
          commentSortType: 'latest',
          commentsNoMore: false,
          commentsLoading: false,
                    commentLoadArmed: false,
          commentObserver: null,
          // Preview
          showImagePreview: false,
          previewImages: [],
          currentPreviewIndex: 0,
          // Comment Input
          isInputFocus: false,
          showEmojiPanel: false,
          commentText: '',
          selectedImages: [],
          emojis: [
              '\uD83D\uDE00', '\uD83D\uDE03', '\uD83D\uDE04', '\uD83D\uDE01', '\uD83D\uDE06',
              '\uD83D\uDE05', '\uD83D\uDE02', '\uD83E\uDD23', '\uD83D\uDE0A', '\uD83D\uDE42',
              '\uD83D\uDE09', '\uD83D\uDE0D', '\uD83E\uDD70', '\uD83D\uDE18', '\uD83D\uDE0B',
              '\uD83D\uDE0E', '\uD83E\uDD29', '\uD83E\uDD14', '\uD83E\uDD2D', '\uD83D\uDE2E',
              '\uD83D\uDE31', '\uD83D\uDE2D', '\uD83D\uDE22', '\uD83D\uDE24', '\uD83D\uDE21',
              '\uD83E\uDD2C', '\uD83D\uDE37', '\uD83E\uDD22', '\uD83D\uDC4D', '\uD83D\uDC4E',
              '\uD83D\uDC4F', '\uD83D\uDE4C', '\uD83D\uDE4F', '\uD83E\uDD1D', '\uD83D\uDC4C',
              '\u2764\uFE0F', '\uD83E\uDDE1', '\uD83D\uDC9B', '\uD83D\uDC9A', '\uD83D\uDC99',
              '\uD83D\uDC9C', '\uD83D\uDDA4', '\uD83D\uDC94', '\uD83D\uDD25', '\u2728',
              '\uD83C\uDF1F', '\uD83C\uDF89', '\uD83C\uDF8A', '\uD83D\uDCAF', '\uD83D\uDE80'
          ],
          user: {},
          replyToComment: null,
          showMenu: false, // For action menu
          
          // Popup
          showReviewPopup: false,
          allComments: [],
          allCommentsPage: 1,
          allCommentsNoMore: false,
          allCommentsLoading: false
      }
  },
  computed: {
      isMe() {
          return this.user && this.review && this.user.id === this.review.userId;
      },
      reviewDisplayStatusMeta() {
          const meta = getSingleDisplayStatusMeta('review', this.review?.status, this.review?.auditStatus);
          if (meta.key === 'draft') {
              return { ...meta, visible: false, text: '' };
          }
          return meta;
      },
      reviewBusinessStatusMeta() {
          return getBusinessStatusMeta('review', this.review?.status);
      },
      reviewAuditStatusMeta() {
          return getAuditStatusMeta(this.review?.auditStatus);
      },
      reviewRejectReason() {
          return getRejectReasonText(this.review?.auditStatus, this.review?.rejectReason);
      },
      menuActions() {
         return [
             { text: '编辑', icon: 'edit' },
             { text: '删除', icon: 'delete', color: '#ee0a24' }
         ];
     }
  },
  created() {
      this.onPopupScroll = throttle(this.onPopupScroll, 120);
      // Check login status early
      const token = localStorage.getItem("token");
      if (token) {
          this.queryLoginUser();
      }

      const id = this.$route.query.id;
      if (id) {
          this.id = id; // Store ID in data property
          this.loadDetail(id);
      } else {
          this.$message.error('参数错误');
          this.$router.go(-1);
      }
  },
  mounted() {
      this.setupCommentObserver();
      window.addEventListener('scroll', this.onWindowScroll, { passive: true });
  },
  beforeUnmount() {
      if (this.commentObserver) {
          this.commentObserver.disconnect();
          this.commentObserver = null;
      }
      if (typeof this.onPopupScroll?.cancel === 'function') {
          this.onPopupScroll.cancel();
      }
      window.removeEventListener('scroll', this.onWindowScroll);
  },
  methods: {
      getStatusToneClass,
      onCommentSortChange(type) {
          if (!type || this.commentSortType === type) return;
          this.commentSortType = type;
          if (!this.review || !this.review.id) return;
          this.loadComments(this.review.id, true).then(() => {
              if (this.showReviewPopup) {
                  this.loadAllComments(true);
              }
          });
      },
      getCommentSortParams() {
          return {
              sort: this.commentSortType
          };
      },
      getCommentLikeCount(item) {
          const value = Number(item?.liked ?? item?.likeCount ?? item?.likes ?? 0);
          return Number.isFinite(value) ? value : 0;
      },
      getCommentTime(item) {
          const source = item?.createTimeRaw ?? item?.createTime ?? item?.updateTime;
          const timestamp = source ? new Date(source).getTime() : 0;
          return Number.isNaN(timestamp) ? 0 : timestamp;
      },
      sortRootComments(list) {
          if (!Array.isArray(list) || list.length < 2) return Array.isArray(list) ? [...list] : [];
          const type = this.commentSortType;
          return [...list].sort((a, b) => {
              const aLiked = this.getCommentLikeCount(a);
              const bLiked = this.getCommentLikeCount(b);
              const aTime = this.getCommentTime(a);
              const bTime = this.getCommentTime(b);

              if (type === 'hot') {
                  if (bLiked !== aLiked) return bLiked - aLiked;
                  if (bTime !== aTime) return bTime - aTime;
                  return Number(b?.id || 0) - Number(a?.id || 0);
              }

              if (bTime !== aTime) return bTime - aTime;
              if (bLiked !== aLiked) return bLiked - aLiked;
              return Number(b?.id || 0) - Number(a?.id || 0);
          });
      },
      loadDetail(id) {
          getReview(id).then(res => {
              let data = res.data || res;
              if (data.data) data = data.data;

              // Map API response to UI
              this.review = {
                  id: data.id,
                  userId: data.userId,
                  userName: data.nickName || '匿名用户',
                  userAvatar: data.userIcon ? (data.userIcon.startsWith('http') ? data.userIcon : this.imgPrefix + (data.userIcon.startsWith('/')?'':'/') + data.userIcon) : this.defaultAvatar,
                  date: this.formatDate(data.createTime),
                  rating: data.score || 5,
                  isFreeTrial: false,
                  scores: {
                      taste: data.tasteScore || 5.0,
                      env: data.envScore || 5.0,
                      service: data.serviceScore || 5.0
                  },
                  content: data.content,
                  images: data.images ? data.images.split(',').map(url => url.startsWith('http') ? url : this.imgPrefix + (url.startsWith('/')?'':'/') + url) : [],
                  sourceType: data.sourceType,  // 保存来源类型
                  sourceId: data.sourceId,      // 保存原始 sourceId
                  shopId: data.shopId,
                  shopName: data.shopName || data.sourceName || '',
                  shopImages: data.shopLogo ? data.shopLogo.split(',').map(url => url.startsWith('http') ? url : this.imgPrefix + (url.startsWith('/')?'':'/') + url) : (data.shopImages ? data.shopImages.split(',').map(url => url.startsWith('http') ? url : this.imgPrefix + (url.startsWith('/')?'':'/') + url) : []),
                  viewCount: data.viewCount || 0,
                  likeCount: data.liked || 0,
                  collectCount: data.stared || 0,
                  isLike: data.isLike || false,
                  isCollect: data.isStared || false,
                  // Shop POI Data
                  avgScore: data.avgScore || data.shopScore || 4.7,
                  avgPrice: data.avgPrice || data.shopPrice || 188,
                  orderId: data.orderId || 0,
                  isAnonymous: !!data.isAnonymous,
                  status: data.status,
                  auditStatus: data.auditStatus,
                  rejectReason: data.rejectReason || ''
              };

              // 商品评价卡片：直接从评价数据获取商品信息
              if (data.productName) {
                  this.voucher = {
                      id: data.sourceId,
                      shopName: data.shopName || data.sourceName || '',
                      shopLogo: data.shopLogo || '',
                      name: data.productName,
                      price: data.productPrice || 0,
                      image: data.productCoverImg || ''
                  };
              }

              // Load comments/replies
              this.loadComments(id);
          }).catch(err => {
              console.error('Failed to load comments:', err);
              this.commentsNoMore = true;
          }).finally(() => {
              this.commentsLoading = false;
              this.$nextTick(() => this.observeCommentLoadTrigger());
          });
      },
      loadMoreComments() {
          if (!this.review || !this.review.id || this.commentsLoading || this.commentsNoMore || this.commentsLoadError || !this.commentLoadArmed) return;
          this.loadComments(this.review.id, false);
      },
      onWindowScroll() {
          if (!this.commentLoadArmed && window.scrollY > 0) {
              this.commentLoadArmed = true;
              this.observeCommentLoadTrigger();
          }
      },
      scrollToComments() {
          this.$nextTick(() => {
              if (this.$refs.commentsSection && this.$refs.commentsSection.scrollIntoView) {
                  this.$refs.commentsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
          });
      },
      setupCommentObserver() {
          if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
          if (this.commentObserver) {
              this.commentObserver.disconnect();
          }
          this.commentObserver = new IntersectionObserver((entries) => {
              if (entries.some(entry => entry.isIntersecting)) {
                  this.loadMoreComments();
              }
          }, {
              root: null,
              rootMargin: '0px 0px 220px 0px',
              threshold: 0
          });
          this.observeCommentLoadTrigger();
      },
      observeCommentLoadTrigger() {
          if (!this.commentObserver) return;
          this.commentObserver.disconnect();
          if (this.$refs.commentLoadTrigger) {
              this.commentObserver.observe(this.$refs.commentLoadTrigger);
          }
      },
      formatDate(time) {
          if (!time) return '';
          const date = new Date(time);
          return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
      },
      previewImage(images, startIdx) {
          if (!images || !images.length) return;
          this.previewImages = images;
          this.currentPreviewIndex = startIdx;
          this.showImagePreview = true;
      },
      closeImagePreview() {
          this.showImagePreview = false;
      },
      toShopDetail() {
          if (this.review && this.review.shopId) {
              this.$router.push({
                  path: '/shop/detail',
                  query: { id: this.review.shopId }
              });
          }
      },
      addLike() {
          if (!this.review) return;
          const originalLike = this.review.isLike;
          
          this.review.isLike = !this.review.isLike;
          this.review.likeCount = this.review.isLike ? (this.review.likeCount + 1) : (this.review.likeCount - 1);
          
          likeReviewComment(this.review.id).catch(() => {
              this.review.isLike = originalLike;
              this.review.likeCount = originalLike ? (this.review.likeCount + 1) : (this.review.likeCount - 1);
              this.$message.error('操作失败');
          });
      },
      toggleCollect() {
         if (!this.user.id) {
             this.$message.warning("请先登录");
             return this.$router.push('/user/login');
         }
         if (!this.review) return;
         
         const oldState = this.review.isCollect;
         this.review.isCollect = !this.review.isCollect;
         this.review.collectCount = this.review.isCollect ? (this.review.collectCount + 1) : (Math.max(0, this.review.collectCount - 1));
         
         toggleStar({ sourceId: this.review.id, sourceType: 7, isStar: this.review.isCollect }).then(() => {
             this.$message.success(this.review.isCollect ? '收藏成功' : '已取消收藏');
         }).catch(err => {
             console.error(err);
             this.review.isCollect = oldState;
             this.review.collectCount = oldState ? (this.review.collectCount + 1) : (Math.max(0, this.review.collectCount - 1));
             this.$message.error('操作失败');
         });
      },
      queryLoginUser() {
          getCurrentUser().then(res => {
              this.user = res.data || res || {};
              if (this.user.data) this.user = this.user.data;
          }).catch(() => {});
      },
      openInlineInput() {
          this.isInputFocus = true;
          this.showEmojiPanel = false;
          this.$nextTick(() => {
              if (this.$refs.inlineTextarea) this.$refs.inlineTextarea.focus();
          });
      },
      closeInlineInput() {
          this.isInputFocus = false;
          this.showEmojiPanel = false;
          this.commentText = '';
          this.selectedImages = [];
      },
      onInlineFocus() {
          this.isInputFocus = true;
          this.showEmojiPanel = false;
      },
      toggleEmojiPanel() {
          this.showEmojiPanel = !this.showEmojiPanel;
          this.$nextTick(() => {
              if (!this.$refs.inlineTextarea) return;
              if (this.showEmojiPanel) this.$refs.inlineTextarea.blur();
              else this.$refs.inlineTextarea.focus();
          });
      },
      insertAt() {
          this.commentText += '@';
          if (this.$refs.inlineTextarea) this.$refs.inlineTextarea.focus();
      },
      insertEmoji(emoji) {
          this.commentText += emoji;
          if (!this.showEmojiPanel && this.$refs.inlineTextarea) {
              this.$nextTick(() => {
                  this.$refs.inlineTextarea.focus();
              });
          }
      },
      async handleImageUpload(e) {
          const files = e.target.files;
          if (!files || !files.length) return;
          for (let file of files) {
              const formData = new FormData();
              formData.append("file", file);
              let res = await uploadFile(formData);

              let path = res;
              if (res && typeof res === 'object' && res.data) path = res.data;
              if (typeof path !== 'string') path = String(path);

              const filePrefix = this.imgPrefix || '';
              if (path.startsWith(filePrefix)) {
                  path = path.substring(filePrefix.length);
              }
              if (path.startsWith('http')) {
                  try {
                      const urlObj = new URL(path);
                      path = urlObj.pathname;
                  } catch (error) {
                      if (path.includes('/smart-live')) path = path.split('/smart-live')[1];
                  }
              }
              if (path && !path.startsWith('/')) path = '/' + path;

              this.selectedImages.push({ file, url: this.imgPrefix + path, rawUrl: path });
          }
          if (this.$refs.imageInput) this.$refs.imageInput.value = '';
      },
      removeImage(idx) {
          this.selectedImages.splice(idx, 1);
      },
      checkLogin() {
          if (!this.user || !this.user.id) {
              this.$message.warning("请先登录");
              this.$router.push('/user/login');
              return;
          }
          this.replyToComment = null; // Clear reply target when opening from main button
          if (this.showReviewPopup) {
              this.$nextTick(() => {
                  if (this.$refs.popupCommentInput) {
                      this.$refs.popupCommentInput.focus();
                  }
              });
          } else {
              this.openInlineInput();
          }
      },
      handleReply(comment) {
          if (!this.user || !this.user.id) {
              this.$message.warning("请先登录");
              this.$router.push('/user/login');
              return;
          }
          this.replyToComment = comment;
          this.commentText = '';
          if (this.showReviewPopup) {
              this.$nextTick(() => {
                  if (this.$refs.popupCommentInput) {
                      this.$refs.popupCommentInput.focus();
                  }
              });
          } else {
              this.openInlineInput();
          }
      },
      handleCommentDelete(comment) {
          showConfirmDialog({
            title: '提示',
            message: '确定删除该评论吗？',
          })
            .then(() => {
              // Fix: removeComment expects an object, not just ID
              // Also pass sourceType/sourceId for consistency if needed by backend, though usually ID is enough for deletion if unique
              removeComment({ id: comment.id, sourceType: 5, sourceId: this.review.id }).then(() => {
                  this.$message.success('删除成功');
                  this.loadComments(this.review.id);
              });
            })
            .catch(() => {
              // on cancel
            });
      },
      handleCommentLike(comment) {
         if(!this.user.id) {
             this.$message.warning("请先登录");
             return this.$router.push('/user/login');
         }
         const oldState = comment.isLike;
         comment.isLike = !comment.isLike;
         comment.liked = comment.isLike ? (comment.liked + 1) : (comment.liked - 1);
         likeComment(comment.id).catch(() => {
             comment.isLike = oldState;
             comment.liked = oldState ? (comment.liked + 1) : (comment.liked - 1);
             this.$message.error('操作失败');
         });
      },
      toUserDetail(userId) {
          if(!userId) return;
          if (this.user && String(this.user.id) === String(userId)) {
              this.$router.push('/user/info');
          } else {
              this.$router.push({ path: '/user/other-info', query: { id: userId } });
          }
      },
      onMenuSelect(action) {
          if (action.text === '删除') {
              this.handleDeleteReview();
          } else if (action.text === '编辑') {
              this.handleEditReview();
          }
      },
      handleDeleteReview() {
          showConfirmDialog({
            title: '提示',
            message: '确定要删除这条评价吗？删除后不可恢复',
            confirmButtonText: '确定',
            cancelButtonText: '取消',
          }).then(() => {
          }).then(() => {
              removeReview(this.review.id).then(() => {
                  this.$message.success('删除成功');
                  this.$router.go(-1);
              });
          }).catch(() => {});
      },
      saveReviewDraft() {
          // 检查登录状态
          if (!this.user || !this.user.id) {
              this.$message.warning("请先登录");
              this.$router.push('/user/login');
              return;
          }

          // 构建草稿数据
          const draft = {
              id: Date.now(),
              shopId: this.review.shopId || 0,
              shopName: this.review.shopName || '',
              content: this.review.content || '',
              images: this.review.images ? this.review.images.join(',') : '',
              updateTime: Date.now()
          };

          // 保存到localStorage
          let drafts = [];
          try {
              const stored = localStorage.getItem('review_drafts');
              if (stored) drafts = JSON.parse(stored);
          } catch (e) {}

          // 检查是否已存在相同内容的草稿，避免重复
          const exists = drafts.some(d =>
              d.shopId === draft.shopId &&
              d.content === draft.content
          );

          if (!exists) {
              drafts.unshift(draft);
              localStorage.setItem('review_drafts', JSON.stringify(drafts));
              this.$message.success('已存入草稿箱');
          } else {
              this.$message.warning('草稿已存在');
          }
      },
      handleEditReview() {
          const query = {
              edit: 'true',
              id: this.review.id,
              orderId: this.review.orderId || undefined,
              sourceId: this.review.sourceId || undefined,
              sourceType: this.review.sourceType || undefined,
              shopId: this.review.shopId
          };
          if (isDraftBusinessStatus('review', this.review?.status)) {
              query.draft = 'true';
          }
          this.$router.push({ 
              path: '/review/publish', 
              query
          });
      },
      publishComment() {
          if (!this.commentText.trim()) {
              this.$message.warning("请输入内容");
              return;
          }
          const params = {
              sourceType: 7,
              content: this.commentText,
              userId: this.user.id,
              images: this.selectedImages.map(i => i.rawUrl).join(',')
          };
          
          if (this.replyToComment) {
              // Reply to a specific comment
              params.sourceType = 5; // Set type to 5 (Comment) for replies
              params.answerId = this.replyToComment.id;
              params.sourceId = this.replyToComment.id; 
              params.parentId = this.review.shopId; // Keep parentId if needed/consistent with existing logic
              // Note: User previously mentioned "ReplyId and ParentId not passed" for *root* comments on *Shop*, 
              // but for Review, usually nested replies need linkage. 
              // Given "Review Detail Page's reply... type should be 5", I am correcting the type.
          } else {
              // Comment on the review itself
              params.sourceId = this.review.id;
              params.parentId = 0;
          }
          
          addComment(params).then(() => {
              this.$message.success("评论成功");
              this.closeInlineInput();
              this.loadComments(this.review.id).then(() => {
                  if (this.showReviewPopup) {
                      this.allComments = [];
                      this.allCommentsPage = 1;
                      this.allCommentsNoMore = false;
                      this.allCommentsLoading = false;
                      this.loadAllComments();
                  }
              });
          });
      },
      toggleReplies(comment) {
          // If all loaded and expanded, clicking again collapses the list
          const isFullyLoaded = comment.replies.length >= comment.comments;
          if (comment.showReplies && isFullyLoaded) {
              comment.showReplies = false;
              // Optional: Reset state on collapse? User said "first time pass 1, then pass 2...". 
              // If we collapse, next time user expands we might want to start from page 1 again or keep state.
              // Usually collapse resets user interaction context. Let's reset to allow re-expanding from 0 if desired, 
              // OR if user just wants to hide.
              // Given "Click expand again to load next", if fully loaded, the button says "Collapse" (implied).
              return;
          }
          
          // If we are already expanded but have more to load, we just load more.
          // If not expanded:
          //   - If replies empty: Load Page 1.
          //   - If replies exist (e.g. from previous load but collapsed): Just show them? 
          //     But user logic implies "click to load". If we cache, we should just show. 
          //     However, let's assume if collapsed, we show what we have. 
          //     BUT if we want to support "Expand -> Page 1 -> Expand -> Page 2", we need to distinguish "Expand" vs "Load More".
          //     Proposed Logic:
          //     - If !showReplies: Show existing replies. If empty, Load Page 1.
          //     - If showReplies: Load Next Page.
          
          if (!comment.showReplies) {
             comment.showReplies = true;
             if (comment.replies.length === 0) {
                 this.fetchReplies(comment, 1);
             }
             return;
          }
          
          // If expanded and clicked: Load next page
          if (comment.replies.length < comment.comments) {
              const nextPage = (Math.ceil(comment.replies.length / 10)) + 1;
              this.fetchReplies(comment, nextPage);
          }
      },
      fetchReplies(comment, page) {
          getChildComments({ id: comment.id, current: page, size: 10 }).then(res => {
              let list = [];
              if (Array.isArray(res)) list = res;
              else if (res && Array.isArray(res.data)) list = res.data;
              else if (res && res.data && Array.isArray(res.data.records)) list = res.data.records;
              
              if (list) {
                  const processed = list.map(r => ({
                      ...r,
                      userAvatar: r.userIcon ? (r.userIcon.startsWith('http') ? r.userIcon : this.imgPrefix + r.userIcon) : this.defaultAvatar,
                      createTime: this.formatDate(r.createTime),
                      isLike: r.isLike || false,
                      liked: r.liked || 0,
                      replyToName: r.targetName || r.replyToName
                  }));
                  
                  if (page === 1) {
                      comment.replies = processed;
                  } else {
                      // Append and deduplicate just in case
                      const existingIds = new Set(comment.replies.map(r => r.id));
                      const newItems = processed.filter(r => !existingIds.has(r.id));
                      comment.replies = [...comment.replies, ...newItems];
                  }
                  comment.replyPage = page; // Sync page
                  
                  if (res && res.data && res.data.total) {
                       comment.comments = res.data.total;
                  }
                  
                  if (list.length < 10) {
                      if (comment.replies.length < comment.comments) {
                          comment.comments = comment.replies.length;
                      }
                  }
              }
          });
      },
      loadAllComments(force = false) {
          if (!force && this.allComments.length > 0) return;
          
          // Since loadComments fetched 500 items and filtered roots, we can assume we have most if not all comments.
          // Directly using existing comments avoids issues with pagination returning localized replies as roots.
          this.allComments = this.sortRootComments([...this.comments]);
          this.allCommentsNoMore = true;
          this.allCommentsLoading = false;
      },
      onPopupScroll(e) {
          const { scrollTop, clientHeight, scrollHeight } = e.target;
          if (scrollHeight - scrollTop - clientHeight < 50) {
              if (!this.allCommentsNoMore && !this.allCommentsLoading) {
                  this.loadAllComments();
              }
          }
      },
      handlePopupInputFocus() {
          if (!this.user || !this.user.id) {
              this.$message.warning("请先登录");
              if (this.$refs.popupCommentInput) {
                  this.$refs.popupCommentInput.blur();
              }
              this.$router.push('/user/login');
          }
      },
      publishCommentFromPopup() {
          if (!this.user || !this.user.id) {
              this.$message.warning("请先登录");
              this.$router.push('/user/login');
              return;
          }
          this.selectedImages = [];
          this.showEmojiPanel = false;
          this.isInputFocus = false;
          this.publishComment();
      }
  }
}
</script>

<style scoped>
/* Inherit standard page wrapper styles */

/* ===== 订单评价卡片：商品主 + 店铺副 ===== */
.order-card {
    background: #fafafa;
    border: 1px solid #eee;
    border-radius: 10px;
    overflow: hidden;
    margin: 15px;
}
.order-product-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px;
    cursor: pointer;
}
.order-product-img {
    width: 52px;
    height: 52px;
    border-radius: 8px;
    background: #f0f0f0;
    flex-shrink: 0;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
}
.order-product-img img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.order-product-info {
    flex: 1;
    min-width: 0;
}
.order-product-name {
    font-size: 13px;
    font-weight: 600;
    color: #111;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.order-product-price {
    font-size: 13px;
    color: #ff4d4f;
    margin-top: 4px;
    font-weight: 600;
}
.order-buy-btn {
    background: #ff6b35;
    color: #fff;
    font-size: 12px;
    padding: 6px 10px;
    border-radius: 16px;
    white-space: nowrap;
    flex-shrink: 0;
    border: none;
    cursor: pointer;
}
.order-buy-btn:active {
    opacity: 0.85;
}
/* 店铺副信息行 */
.order-shop-row {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 10px;
    border-top: 1px solid #eee;
    background: #fff;
    cursor: pointer;
}
.order-shop-icon {
    width: 18px;
    height: 18px;
    border-radius: 4px;
    background: #f0f0f0;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}
.order-shop-icon img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.order-shop-name {
    font-size: 11px;
    color: #888;
    flex: 1;
}
.order-shop-link {
    font-size: 11px;
    color: #ff6b35;
}

/* ===== 店铺评价卡片 ===== */
.shop-card {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #fafafa;
    border: 1px solid #eee;
    border-radius: 10px;
    padding: 10px;
    margin: 15px;
    cursor: pointer;
}
.shop-card-img {
    width: 52px;
    height: 52px;
    border-radius: 8px;
    background: #f0f0f0;
    flex-shrink: 0;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
}
.shop-card-img img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.shop-card-info {
    flex: 1;
    min-width: 0;
}
.shop-card-name {
    font-size: 13px;
    font-weight: 600;
    color: #111;
}
.shop-card-sub {
    font-size: 11px;
    color: #aaa;
    margin-top: 3px;
}
.shop-card-btn {
    background: #fff;
    color: #ff6b35;
    font-size: 12px;
    padding: 6px 10px;
    border-radius: 16px;
    white-space: nowrap;
    flex-shrink: 0;
    border: 1px solid #ff6b35;
    cursor: pointer;
}
.shop-card-btn:active {
    background: #fff5f0;
}


/* Original Styles */
.review-detail-wrapper {
    min-height: 100vh;
    background: #fff;
}
.detail-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 48px;
    padding: 0 15px;
    background: #fff;
    border-bottom: 1px solid #f0f0f0;
    position: sticky;
    top: 0;
    z-index: 100;
}
.back-btn {
    width: 40px;
    font-size: 20px;
    color: #333;
    cursor: pointer;
}
.header-title {
  font-size: 17px;
  font-weight: 600;
  color: #333;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  max-width: 60%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
}
.header-right {
    width: 40px;
    text-align: right;
    font-size: 20px;
    color: #333;
}

.save-draft-btn {
    font-size: 14px;
    color: #666;
    cursor: pointer;
    padding: 8px 0;
    margin-left: 8px;
}

.save-draft-btn:active {
    color: #999;
}
.review-detail-page {
    padding-bottom: 60px;
    background: #fff;
}
.author-info {
    display: flex;
    align-items: center;
    padding: 15px;
}
.avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    margin-right: 10px;
    object-fit: cover;
    background: #f0f0f0;
}
.info-right {
    flex: 1;
}
.name-row {
    font-size: 15px;
    font-weight: 600;
    color: #333;
    display: flex;
    align-items: center;
}
.level-tag {
    background: #ffaa00;
    color: #fff;
    font-size: 10px;
    padding: 0 4px;
    border-radius: 4px;
    margin-left: 6px;
    font-weight: normal;
}
.date {
    font-size: 12px;
    color: #999;
    margin-top: 2px;
}
.more-btn {
    color: #333;
    font-size: 20px;
}

.rating-section {
    display: flex;
    align-items: center;
    padding: 0 15px;
    margin-bottom: 10px;
}
.rating-tag {
    background: #fff8f2;
    color: #ff6600;
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 4px;
    margin-right: 10px;
    font-weight: 600;
    display: flex;
    align-items: center;
}
.rating-tag .emoji {
    margin-right: 2px;
}
.free-trial-tag {
    color: #D3691E;
    font-size: 12px;
    margin-left: auto;
    background: #fff5eb;
    padding: 2px 6px;
    border-radius: 4px;
}

.scores-row {
    padding: 0 15px;
    margin-bottom: 15px;
    font-size: 13px;
    color: #666;
    display: flex;
    gap: 15px;
}

.detail-content {
    padding: 0 15px;
}
.content-text {
    font-size: 16px;
    color: #333;
    line-height: 1.6;
    white-space: pre-wrap;
    margin-bottom: 15px;
}
.detail-images {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-bottom: 20px;
}
.d-img {
    width: calc(33.33% - 4px);
    aspect-ratio: 1;
    border-radius: 8px;
    object-fit: cover;
}
.d-img.one-image {
    width: 60%; /* Or 100% or larger based on design, screenshot shows large */
    aspect-ratio: auto;
    max-height: 400px;
}

.shop-link-card {
    margin: 0 15px 20px 15px;
    background: #f8f8f8;
    padding: 10px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    cursor: pointer;
}
.shop-thumb {
    width: 40px;
    height: 40px;
    border-radius: 6px;
    object-fit: cover;
    margin-right: 10px;
}
.shop-icon {
    font-size: 18px;
    color: #ff6600;
    margin-right: 8px;
}
.shop-info {
    flex: 1;
}
.shop-name {
    font-size: 14px;
    font-weight: 600;
    color: #333;
}
.shop-rating {
    font-size: 12px;
    color: #666;
}
.shop-collect {
    font-size: 12px;
    color: #999;
}

.view-count {
    padding: 0 15px;
    font-size: 13px;
    color: #999;
    margin-bottom: 10px;
}
.like-avatars {
    padding: 0 15px;
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 20px;
}
.mini-avatar {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    object-fit: cover;
    background: #f0f0f0;
}
.like-avatars span {
    font-size: 13px;
    color: #666;
}

.comments-section {
    padding: 0 15px 80px 15px;
}
.comments-title {
    font-size: 16px;
    font-weight: 600;
    color: #333;
    margin-bottom: 10px;
}
.comments-sort-group {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
}
.comments-sort-btn {
    font-size: 12px;
    line-height: 1;
    color: #666;
    background: #f5f5f7;
    padding: 6px 10px;
    border-radius: 999px;
    cursor: pointer;
    user-select: none;
    transition: all 0.2s ease;
}
.comments-sort-btn.active {
    color: #ff2442;
    background: #ffeff4;
    font-weight: 600;
}

/* Fake input placeholder */
.c-placeholder {
    background: #f5f5f5;
    color: #999;
    padding: 8px 15px;
    border-radius: 20px;
    font-size: 14px;
    width: 100%;
}

.emoji-toggle.active {
    color: #ff2442;
}

.emoji-panel {
    margin-top: 10px;
    background: #f7f8fa;
    border: 1px solid #eceef2;
    border-radius: 12px;
    padding: 10px;
    max-height: 220px;
    overflow-y: auto;
}

.emoji-panel .emoji-grid {
    grid-template-columns: repeat(8, minmax(0, 1fr)) !important;
    gap: 10px !important;
}

.emoji-panel .emoji-item {
    font-size: 24px;
    line-height: 1;
    padding: 4px 0;
}

.emoji-panel .emoji-item:active {
    transform: scale(1.12);
}

/* Override blog-detail.css for cleaner look */
.comment-replies {
    background: none !important;
    padding: 0 !important;
    margin-top: 6px;
}

.reply-expand {
    font-size: 13px;
    color: #333; /* Darker for visibility */
    display: flex;
    align-items: center;
    margin-top: 8px;
    cursor: pointer;
    font-weight: 500;
}
.expand-line {
    margin-right: 8px;
    color: #ddd;
    font-weight: bold;
}
.reply-expand i {
    margin-left: 4px;
    font-size: 12px;
}

/* Status Badges */
.review-status-row {
    margin: 0 15px 12px;
    display: flex;
    align-items: center;
}
.detail-status-tag {
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 11px;
    color: #fff;
    font-weight: 500;
    line-height: 1.2;
}
.status-pending {
    background: rgba(255, 153, 0, 0.85);
}
.status-rejected {
    background: rgba(255, 36, 66, 0.85);
}
/* Status Badges */
.review-status-row {
    margin: 0 15px 12px;
    display: flex;
    align-items: center;
}
.detail-status-tag {
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 11px;
    color: #fff;
    font-weight: 500;
    line-height: 1.2;
}
.status-pending {
    background: rgba(255, 153, 0, 0.85);
}
.status-rejected {
    background: rgba(255, 36, 66, 0.85);
}
.review-status-row {
    display: none;
}
.review-status-summary {
    margin: 0 15px 12px;
    padding: 0;
    background: transparent;
}
</style>
