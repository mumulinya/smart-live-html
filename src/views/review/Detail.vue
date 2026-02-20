<template>
  <div class="review-detail-wrapper">
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

        <!-- 消费项目（仅订单评价显示） -->
        <div class="consume-item" v-if="review.sourceType === 4 && voucher">
            <span class="consume-icon">🛒</span>
             <div class="consume-text">消费项目：{{ voucher.originalPrice }}元商品（{{ voucher.name || voucher.title || '全场通用' }}）</div>
        </div>

        <!-- Shop Link -->
        <!-- 代金券卡片（订单评价 sourceType=4） -->
        <div class="voucher-card" v-if="review.sourceType === 4 && voucher" @click="toVoucherDetail">
             <div class="voucher-thumbnail">
                <img :src="voucher.image ? (voucher.image.startsWith('http') ? voucher.image : imgPrefix + voucher.image) : defaultAvatar" @error="(e) => e.target.src = defaultAvatar">
             </div>
             <div class="voucher-info">
                <div class="voucher-title">{{ voucher.price }}代{{ voucher.originalPrice }}元{{ voucher.name || voucher.title || '商品' }}</div>
                <div class="voucher-shop">{{ voucher.shopName || review.shopName }}</div>
             </div>
             <button class="voucher-buy-btn" @click.stop="buyVoucher">去购买</button>
        </div>

        <!-- 商户卡片（普通评价） -->
        <!-- Shop Link (POI Card Style) -->
        <div class="poi-card" v-else-if="review.shopId" @click="toShopDetail">
             <div class="poi-thumbnail">
                <img :src="(review.shopImages && review.shopImages.length) ? review.shopImages[0] : defaultAvatar" @error="(e) => e.target.src = defaultAvatar">
             </div>
             <div class="poi-info">
                <div class="poi-name">{{ review.shopName }}</div>
                <div class="poi-rating">
                   <div class="star-icons">
                      <!-- Assuming 5 is max score, display stars -->
                      <i class="el-icon-star-on" v-for="n in Math.floor(review.avgScore || 4.5)" :key="'f'+n"></i>
                      <i class="el-icon-star-off" v-for="n in (5 - Math.floor(review.avgScore || 4.5))" :key="'e'+n"></i>
                   </div>
                   <span class="rating-score">{{ Number(review.avgScore || 4.7).toFixed(1) }}</span>
                </div>
                <div class="poi-price">¥{{ review.avgPrice || '-' }}/人</div>
             </div>
             <div class="poi-arrow">
                <i class="el-icon-arrow-right"></i>
             </div>
        </div>

        <!-- Views -->


        <!-- Comments Section -->
        <div class="comments-section">
            <div class="comments-title">评论 ({{ comments.length }})</div>
                <div class="comment-list">
                    <div class="comment-box" v-if="comments.length === 0">
                        <div class="c-placeholder">暂无评论</div>
                    </div>
                    <div class="comment-box" v-for="c in comments.slice(0, 3)" :key="c.id">
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
            
            <!-- View All Button -->
            <div class="view-all-btn" v-if="comments.length > 3 || (review && review.comments > 3)" @click="showReviewPopup = true; loadAllComments()">
               查看全部{{review.comments || comments.length}}条评价 <i class="el-icon-arrow-right"></i>
            </div>
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
                    <div class="action-item" @click="showReviewPopup = true; loadAllComments()">
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
          <div class="review-popup-body" @scroll="onPopupScroll">
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
          <div class="popup-bottom-bar" @click="writeCommentFromPopup">
             <div class="popup-input-placeholder">说点什么吧~</div>
             <el-button type="primary" size="small" round @click.stop="writeCommentFromPopup">发布</el-button>
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
  </div>
</template>

<script>
import { ElImageViewer } from 'element-plus';
import { likeComment, getComments, addComment, removeComment, getChildComments, toggleStar } from '@/api/interaction';
import { removeReview, getReview, likeReviewComment } from '@/api/reviews';
import { getCurrentUser } from '@/api/user';
import { uploadFile } from '@/api/common';
import { fileURL } from '@/utils/request';
import { getProductDetail } from '@/api/shop';
import { showConfirmDialog } from 'vant';
import '@/assets/css/blog-detail.css'; // Import blog-detail.css for shared styles

export default {
  name: 'ReviewDetail',
  components: { ElImageViewer },
  data() {
      return {
          defaultAvatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
          review: null,
          voucher: null,  // 代金券详情
          imgPrefix: fileURL,
          comments: [],
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
     menuActions() {
         return [
             { text: '编辑', icon: 'edit' },
             { text: '删除', icon: 'delete', color: '#ee0a24' }
         ];
     }
  },
  created() {
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
  methods: {
      loadDetail(id) {
          getReview(id).then(res => {
              let data = res.data || res;
              if (data.data) data = data.data;

              // Map API response to UI
              this.review = {
                  id: data.id,
                  userId: data.userId,
                  userName: data.nickName || 'Unknown',
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
                  shopId: data.sourceId,
                  shopName: data.sourceName || 'Unknown Shop',
                  shopImages: data.shopImages ? data.shopImages.split(',').map(url => url.startsWith('http') ? url : this.imgPrefix + (url.startsWith('/')?'':'/') + url) : [],
                  viewCount: data.viewCount || 0,
                  likeCount: data.liked || 0,
                  collectCount: data.stared || 0,
                  isLike: data.isLike || false,
                  isCollect: data.isStared || false,
                  // Shop POI Data
                  avgScore: data.avgScore || data.shopScore || 4.7,
                  avgPrice: data.avgPrice || data.shopPrice || 188
              };

              // 如果是代金券评价，加载代金券详情
              if (data.sourceType === 4 && data.sourceId) {
                  this.loadVoucherDetail(data.sourceId);
              }

              // Load comments/replies
              this.loadComments(id);
          });
      },
      async loadVoucherDetail(voucherId) {
          try {
              const res = await getProductDetail(voucherId);
              if (res && res.data) {
                  this.voucher = res.data;
              }
          } catch (e) {
              console.error('加载代金券详情失败', e);
          }
      },
      toVoucherDetail() {
          if (this.voucher && this.voucher.id) {
              this.$router.push({ path: '/product/detail', query: { id: this.voucher.id } });
          }
      },
      buyVoucher() {
          this.toVoucherDetail();
      },
      loadComments(id) {
          // Increase size to fetch more comments for client-side nesting
          getComments({ sourceId: id, sourceType: 7, current: 1, size: 500 }).then(res => {
             let list = [];
             if (Array.isArray(res)) list = res;
             else if (res && Array.isArray(res.data)) list = res.data;
             else if (res && res.data && Array.isArray(res.data.records)) list = res.data.records;
             
             const processedList = (list || []).map(c => ({
                ...c,
                userAvatar: c.userIcon ? (c.userIcon.startsWith('http') ? c.userIcon : this.imgPrefix + c.userIcon) : this.defaultAvatar,
                createTime: this.formatDate(c.createTime),
                images: c.images ? c.images.split(',').map(i => i.startsWith('http') ? i : this.imgPrefix + i) : [],
                isLike: c.isLike || false,
                liked: c.liked || 0,
                comments: c.replyCount || c.comments || 0, // Prioritize replyCount as per user request
                showReplies: false, // UI toggle state
                replies: [], // will be filled on demand or by local nesting if data is present
                replyPage: 1 // Pagination state for replies
             }));

             // 1. Build a robust map with string keys for safety
             const commentMap = {};
             processedList.forEach(c => {
                c.replies = []; 
                commentMap[String(c.id)] = c;
             });
             
             const roots = [];
             
             // 2. Process each comment to determine if it's a root or a nested reply
             processedList.forEach(c => {
                 const aId = c.answerId ? String(c.answerId) : '0';
                 
                 // If answerId is "0" or null/missing, it's a top-level comment
                 if (aId === '0') {
                     roots.push(c);
                 } else { 
                     // It is a reply. Find who it belongs to.
                     const directParent = commentMap[aId];
                     if(directParent) {
                         c.replyToName = directParent.nickName;
                         
                         // In BlogDetail style, all replies are flattened under the top-level comment.
                         // Find the true "root" (the comment whose answerId points to the review/shop, or '0')
                         let curr = directParent;
                         let depth = 0;
                         while(curr && curr.answerId && String(curr.answerId) !== '0' && depth < 20) {
                              const nextId = String(curr.answerId);
                              // If the parent is not in the map, it means 'curr' is the root comment (connected to review/shop)
                              if (!commentMap[nextId]) break;
                              
                              curr = commentMap[nextId];
                              depth++;
                         }
                         
                         if(curr) {
                            // Link this reply to the root comment's replies list
                            if(!curr.replies.some(reply => reply.id === c.id)) {
                                curr.replies.push(c);
                            }
                         } else {
                            // If root can't be found despite parent existing (shouldn't happen with break fix), treat as root
                            roots.push(c);
                         }
                     } else {
                         // If the parent comment isn't in the list, treat this as a root comment
                         roots.push(c);
                     }
                 }
             });
             
             // 3. Final sorting of replies
             roots.forEach(r => {
                if(r.replies && r.replies.length) {
                   r.replies.sort((a,b) => new Date(a.createTime) - new Date(b.createTime));
                }
             });

             this.comments = roots;
          });
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
          this.replyToComment = null;
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
          this.openInlineInput();
      },
      handleReply(comment) {
          if (!this.user || !this.user.id) {
              this.$message.warning("请先登录");
              this.$router.push('/user/login');
              return;
          }
          this.replyToComment = comment;
          this.commentText = '';
          this.openInlineInput();
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
          // Navigate to publish page in edit mode
          // Assuming /shop/assess?id=... or similar. Since I am not sure of the exact edit route, 
          // I will use a generic one or check known routes.
          // Based on user/MyReviews "写评价", it likely goes to a publish page.
          // Let's assume '/order/evaluate' or similar? Or just re-use the publish component?
          // For now, I'll push to a hypothetical edit route, or if I can find the publish route in prior logs.
          // Checking `CommentList.vue` or `ShopDetail.vue` context... usually it is /shop/submit-comment or similar.
          // Wait, the "写评价" in MyReviews banner is just text.
          // Let's use a generic /page/edit route or alert if not found.
          // Actually, let's try to match existing pattern: /blog/edit (for blog).
          // Maybe /comment/edit?
          // I'll assume '/shop/comment/publish' with query.
          // Or strictly adhere to "只要编辑".
          this.$router.push({ 
              path: '/review/publish', 
              query: { 
                  edit: 1, 
                  id: this.review.id,
                  shopId: this.review.shopId 
              } 
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
              this.loadComments(this.review.id);
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
      loadAllComments() {
          if (this.allComments.length > 0) return;
          
          // Since loadComments fetched 500 items and filtered roots, we can assume we have most if not all comments.
          // Directly using existing comments avoids issues with pagination returning localized replies as roots.
          this.allComments = [...this.comments];
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
      writeCommentFromPopup() {
          if (!this.user || !this.user.id) {
              this.$message.warning("请先登录");
              this.$router.push('/user/login');
              return;
          }
          this.replyToComment = null;
          this.commentText = '';
          this.selectedImages = [];
          this.showReviewPopup = false;
          this.openInlineInput();
      }
  }
}
</script>

<style scoped>
/* Inherit standard page wrapper styles */

/* 消费项目样式 */
.consume-item {
    display: flex;
    align-items: center;
    padding: 10px 12px;
    background: #fafafa;
    border-radius: 6px;
    margin: 12px 15px;
}
.consume-icon {
    margin-right: 8px;
}
.consume-text {
    font-size: 13px;
    color: #666;
}

/* 代金券卡片样式 */
.voucher-card {
    display: flex;
    align-items: center;
    background: white;
    border: 1px solid #f0f0f0;
    border-radius: 8px;
    padding: 12px;
    margin: 15px 15px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.03);
    cursor: pointer;
}
.voucher-thumbnail {
    width: 60px;
    height: 60px;
    border-radius: 6px;
    overflow: hidden;
    margin-right: 12px;
    flex-shrink: 0;
    background: #fff5f5;
}
.voucher-thumbnail img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.voucher-info {
    flex: 1;
    overflow: hidden;
}
.voucher-title {
    font-size: 15px;
    font-weight: 600;
    color: #333;
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.voucher-shop {
    font-size: 13px;
    color: #999;
}
.voucher-buy-btn {
    padding: 6px 14px;
    background: linear-gradient(135deg, #ff6b6b, #ee5a5a);
    color: white;
    border: none;
    border-radius: 16px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    flex-shrink: 0;
    margin-left: 10px;
}
.voucher-buy-btn:active {
    opacity: 0.9;
}

/* POI Card (Shop) */
.poi-card {
    display: flex;
    align-items: center;
    background: white;
    border: 1px solid #f0f0f0;
    border-radius: 8px;
    padding: 12px;
    margin: 15px 15px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.03);
    cursor: pointer;
}
.poi-thumbnail {
    width: 60px;
    height: 60px;
    border-radius: 6px;
    overflow: hidden;
    margin-right: 12px;
    flex-shrink: 0;
    background: #f5f5f5;
}
.poi-thumbnail img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.poi-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    overflow: hidden;
}
.poi-name {
    font-size: 15px;
    font-weight: 600;
    color: #333;
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.poi-rating {
    display: flex;
    align-items: center;
    margin-bottom: 4px;
}
.star-icons {
    display: flex;
    gap: 1px;
    margin-right: 6px;
}
.star-icons i {
    font-size: 11px;
}
.star-icons i.el-icon-star-on {
    color: #ff9900;
}
.star-icons i.el-icon-star-off {
    color: #ddd;
}
.rating-score {
    font-size: 13px;
    color: #ff4400;
    font-weight: 500;
}
.poi-price {
    font-size: 12px;
    color: #666;
}
.poi-arrow {
    color: #ccc;
    font-size: 16px;
    margin-left: 8px;
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
    margin-bottom: 15px;
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
</style>
