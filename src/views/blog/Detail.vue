<template>
  <div class="blog-detail-page" v-loading="pageLoading">
    <!-- 顶部固定用户信息栏 -->
    <div class="fixed-top-bar">
      <div class="top-back-btn" @click="goBack"><i class="el-icon-arrow-left"></i></div>
      <div class="top-user-section" @click="toOtherInfo" v-if="blog.id">
        <img class="top-user-avatar" :src="blog.icon || '/imgs/icons/default-icon.png'">
        <div class="top-user-info">
          <span class="top-user-name">{{blog.name}}</span>
          <span class="top-user-tag" v-if="blog.userTag">{{blog.userTag}}</span>
        </div>
      </div>
      <div class="top-actions">
        <button class="top-follow-btn" :class="{followed: followed}" @click.stop="toggleFollow" v-if="user && user.id !== blog.userId && blog.id">
          {{followed ? '已关注' : '关注'}}
        </button>
        <i class="el-icon-upload2 top-share-icon"></i>
        <el-popover
            v-if="isOwner"
            placement="bottom-end"
            trigger="click"
            v-model:visible="showMenu"
            popper-class="more-menu-popover"
            :width="120"
            :show-arrow="false"
        >
            <template #reference>
                <i class="el-icon-more top-more-icon"></i>
            </template>
            <div class="more-menu-list">
                <div class="menu-item" @click="handleSticky">
                    <i class="el-icon-top"></i> {{ blog.pin ? '取消置顶' : '置顶' }}
                </div>
                <div class="menu-item" @click="handleEdit">
                    <i class="el-icon-edit-outline"></i> 编辑
                </div>
                <div class="menu-item delete" @click="handleDelete">
                    <i class="el-icon-delete"></i> 删除
                </div>
                <div class="menu-item" @click="goHome">
                    <i class="el-icon-s-home"></i> 回到首页
                </div>
            </div>
        </el-popover>
      </div>
    </div>

    <!-- 可滚动内容区域 -->
    <div class="scroll-container">
       <div v-if="!blog.id && !pageLoading" class="empty-state">
           <i class="el-icon-warning-outline"></i>
           <p>内容不存在或已被删除</p>
       </div>

       <div v-if="blog.id" class="content-wrapper">
          <!-- 全图轮播区域 -->
          <div class="image-carousel-full" 
               v-if="blog.images && blog.images.length > 0"
               @touchstart="onTouchStart"
               @touchmove="onTouchMove"
               @touchend="onTouchEnd"
          >
            <el-carousel 
              ref="imageCarousel"
              :height="carouselHeight" 
              :autoplay="false" 
              arrow="never" 
              indicator-position="none"
              @change="onCarouselChange"
            >
               <el-carousel-item v-for="(img, i) in blog.images" :key="i">
                  <img :src="img" class="full-carousel-img" @click="previewImage(blog.images, i)" @load="onImageLoad">
               </el-carousel-item>
            </el-carousel>
            <!-- 图片序号指示器 (右上角) -->
            <div class="image-indicator">{{currentImageIndex + 1}}/{{blog.images.length}}</div>
            <!-- 底部点状指示器 -->
            <div class="dots-indicator" v-if="blog.images.length > 1">
              <span 
                v-for="(img, i) in blog.images" 
                :key="i" 
                class="dot" 
                :class="{active: i === currentImageIndex}"
                @click="goToImage(i)"
              ></span>
            </div>
          </div>

          <!-- 博客文字内容 -->
          <div class="blog-content-section">
            <div class="blog-title" v-if="blog.title">{{blog.title}}</div>
            <div class="blog-text" v-html="blog.content"></div>
            <div class="blog-time">{{formatDate(blog.createTime)}}</div>
          </div>

          <!-- 关联店铺信息 -->
          <div class="shop-card" v-if="shop.id" @click="toShopDetail">
             <div class="shop-card-icon">
                <img :src="shop.image || '/imgs/icons/default-icon.png'">
             </div>
             <div class="shop-card-info">
                <div class="shop-card-name">{{shop.name}}</div>
                <div class="shop-card-rating"><el-rate :model-value="shop.score/10" disabled text-color="#F63" show-score></el-rate></div>
                <div class="shop-card-price">￥{{shop.avgPrice}}/人</div>
             </div>
             <i class="el-icon-arrow-right shop-card-arrow"></i>
          </div>

          <!-- 点赞用户列表 -->
          <div class="like-section" v-if="likes && likes.length > 0">
             <div class="like-icon-btn" @click="addLike">
                 <svg viewBox="0 0 24 24" width="24" height="24">
                     <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" :fill="blog.isLike ? '#ff2442' : '#82848a'"></path>
                 </svg>
             </div>
             <div class="like-avatars">
                <div class="like-avatar-item" v-for="u in likes.slice(0, 8)" :key="u.id" @click="toUserDetail(u.id)">
                   <img :src="u.icon || '/imgs/icons/default-icon.png'">
                </div>
                <span class="like-count-text">{{blog.liked}}人点赞</span>
             </div>
          </div>

          <div class="section-divider"></div>

          <!-- 评论区域 -->
          <div class="comments-section">
             <div class="comments-header">网友评价 ({{blog.comments || 0}})</div>
             
             <div class="comment-list" v-if="(comments && comments.length > 0) || (aiComment && aiComment.content)">
                <!-- AI 评论 -->
                <div class="comment-box ai-generated-comment" v-if="aiComment && aiComment.content">
                   <div class="comment-icon ai-comment-icon"><i class="el-icon-magic-stick"></i></div>
                   <div class="comment-info ai-comment-info">
                      <div class="comment-user">
                         智评助手
                         <span class="ai-verified"><i class="el-icon-check"></i> 官方认证</span>
                      </div>
                      <div class="comment-content">{{aiComment.content}}</div>
                      <div class="comment-stats"><span class="ai-highlight">{{aiComment.createTime}}</span></div>
                   </div>
                   <div class="ai-generated-badge">AI生成</div>
                </div>

                <!-- 用户评论 -->
                <div class="comment-box" v-for="c in comments" :key="c.id">
                   <div class="comment-icon" @click.stop="toUserDetail(c.userId)">
                      <img :src="c.userIcon || '/imgs/icons/default-icon.png'">
                   </div>
                   <div class="comment-info">
                      <div class="comment-user" @click.stop="toUserDetail(c.userId)">
                         {{c.nickName || '匿名用户'}} <span>Lv{{c.userLevel || 1}}</span>
                      </div>
                      <div class="comment-content">{{c.content}}</div>
                      <div class="comment-images" v-if="c.images && c.images.length">
                         <img v-for="(img, idx) in c.images" :key="idx" :src="img" @click="previewImage(c.images, idx)">
                      </div>
                      <div class="comment-interactions">
                         <span class="comment-time">{{formatDate(c.createTime)}}</span>
                         <div class="comment-actions">
                            <div class="c-action-btn" @click.stop="handleCommentLike(c)">
                               <svg viewBox="0 0 24 24" width="16" height="16">
                                 <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" :fill="c.isLike ? '#ff2442' : '#999'"></path>
                               </svg>
                               {{c.liked || 0}}
                            </div>
                            <div class="c-action-btn" @click.stop="handleCommentReply(c)">
                               <i class="el-icon-chat-dot-square"></i>
                            </div>
                            <div class="c-action-btn delete-btn" v-if="user.id === c.userId" @click.stop="handleCommentDelete(c)">
                               <i class="el-icon-delete"></i>
                            </div>
                         </div>
                      </div>

                      <!-- 回复列表 -->
                      <div class="comment-replies" v-if="c.replies && c.replies.length > 0">
                          <div class="reply-item" v-for="r in c.replies" :key="r.id">
                              <div class="reply-avatar" @click.stop="toUserDetail(r.userId)">
                                 <img :src="r.userIcon || r.icon || '/imgs/icons/default-icon.png'" alt="">
                              </div>
                              <div class="reply-main">
                                 <div class="reply-header">
                                    <span class="reply-user" @click.stop="toUserDetail(r.userId)">{{r.nickName || '匿名用户'}}</span>
                                    <span class="reply-time">{{formatDate(r.createTime)}}</span>
                                 </div>
                                 <div class="reply-content">
                                      <span v-if="r.replyToName" class="reply-target">回复 @{{r.replyToName}}</span>
                                      {{r.content}}
                                 </div>
                                 <div class="comment-images" v-if="r.images && r.images.length">
                                    <img v-for="(img, idx) in r.images" :key="idx" :src="img" @click.stop="previewImage(r.images, idx)">
                                 </div>
                                 <div class="reply-actions">
                                      <div class="c-action-btn" @click.stop="handleCommentLike(r)">
                                         <svg viewBox="0 0 24 24" width="16" height="16">
                                           <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" :fill="r.isLike ? '#ff2442' : '#999'"></path>
                                         </svg>
                                         <span v-if="r.liked > 0">{{r.liked}}</span>
                                      </div>
                                      <div class="c-action-btn" @click.stop="handleCommentReply(r)">
                                         <i class="el-icon-chat-dot-square"></i>
                                      </div>
                                       <div class="c-action-btn delete-btn" v-if="user.id === r.userId" @click.stop="handleCommentDelete(r)">
                                         <i class="el-icon-delete"></i>
                                      </div>
                                 </div>
                              </div>
                          </div>
                      </div>
                   </div>
                </div>
              
               <div class="view-all-btn" @click="viewAllComments">
                  查看全部{{blog.comments}}条评价 <i class="el-icon-arrow-right"></i>
               </div>
            </div>
            <div v-else class="no-comments">暂无评论，快来发表第一条评论吧～</div>
         </div>
         
      </div> <!-- End of content-wrapper -->
    </div> <!-- End of scroll-container -->

    <!-- 底部固定操作栏 -->
    <div class="fixed-bottom-bar">
      <div class="bottom-comment-input" @click="checkLogin">
        <i class="el-icon-edit"></i>
        <span>说点什么...</span>
      </div>
      <div class="bottom-actions">
        <div class="bottom-action-item" @click="addLike">
          <svg viewBox="0 0 24 24" width="22" height="22">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" :fill="blog.isLike ? '#ff2442' : '#333'"></path>
          </svg>
          <span>{{blog.liked || 0}}</span>
        </div>
        <div class="bottom-action-item" @click="toggleStar">
          <i :class="blog.isStared ? 'el-icon-star-on active' : 'el-icon-star-off'"></i>
          <span>{{blog.stared || 0}}</span>
        </div>
        <div class="bottom-action-item" @click="viewAllComments">
          <i class="el-icon-chat-dot-round"></i>
          <span>{{blog.comments || 0}}</span>
        </div>
      </div>
    </div>

    <!-- 评论输入弹窗 -->
    <div class="comment-pop-overlay" v-if="showCommentPublish" @click="closeCommentModal">
      <div class="comment-pop-box" @click.stop>
         <div class="pop-header">
            <span class="pop-title">{{ replyToComment ? ('回复 @' + replyToComment.nickName) : '发表评论' }}</span>
            <i class="el-icon-close pop-close" @click="closeCommentModal"></i>
         </div>
         <div class="pop-textarea">
            <textarea 
               ref="commentTextarea"
               v-model="commentText" 
               placeholder="分享你此刻的想法..." 
               :maxlength="500"
               rows="3"
            ></textarea>
         </div>
         <div class="pop-images" v-if="selectedImages.length > 0">
            <div class="pop-image-item" v-for="(img, idx) in selectedImages" :key="idx">
               <img :src="img.url">
               <i class="el-icon-close" @click="removeImage(idx)"></i>
            </div>
            <div class="pop-image-add" @click="$refs.imageInput.click()" v-if="selectedImages.length < 9">
               <i class="el-icon-plus"></i>
            </div>
         </div>
         <div class="pop-toolbar">
            <div class="pop-toolbar-left">
               <svg class="pic-icon" @click="$refs.imageInput.click()" viewBox="0 0 1024 1024" width="24" height="24">
                  <path d="M896 160H128c-35.2 0-64 28.8-64 64v576c0 35.2 28.8 64 64 64h768c35.2 0 64-28.8 64-64V224c0-35.2-28.8-64-64-64z m0 640H128V224h768v576z" fill="#666"></path>
                  <path d="M320 512c53 0 96-43 96-96s-43-96-96-96-96 43-96 96 43 96 96 96z" fill="#666"></path>
                  <path d="M896 736l-192-192-128 96-192-160-256 256v64h768z" fill="#666"></path>
               </svg>
               <input type="file" ref="imageInput" multiple accept="image/*" @change="handleImageUpload" style="display:none">
            </div>
            <el-button type="primary" size="small" :disabled="!commentText.trim()" @click="publishComment">发送</el-button>
         </div>
      </div>
    </div>
    
    <!-- All Reviews Bottom Sheet Popup -->
    <div class="review-popup-overlay" v-if="showReviewPopup" @click="showReviewPopup = false">
       <div class="review-popup-sheet" @click.stop>
          <div class="review-popup-header">
             <span class="review-popup-title">全部评论 ({{blog.comments || 0}})</span>
             <i class="el-icon-close review-popup-close" @click="showReviewPopup = false"></i>
          </div>
          <div class="review-popup-body" @scroll="onPopupScroll">
             <div v-if="allComments.length === 0 && !allCommentsLoading" class="empty-reviews">
                <i class="el-icon-chat-round"></i>
                <p>暂无评论</p>
             </div>
             
             <div class="comment-box" v-for="c in allComments" :key="c.id">
                <div class="comment-icon" @click.stop="toUserDetail(c.userId)">
                   <img :src="c.userIcon || '/imgs/icons/default-icon.png'">
                </div>
                <div class="comment-info">
                   <div class="comment-user" @click.stop="toUserDetail(c.userId)">
                      {{c.nickName || '匿名用户'}} <span>Lv{{c.userLevel || 1}}</span>
                   </div>
                   <div class="comment-content">{{c.content}}</div>
                   <div class="comment-images" v-if="c.images && c.images.length">
                      <img v-for="(img, idx) in c.images" :key="idx" :src="img" @click="previewImage(c.images, idx)">
                   </div>
                   <div class="comment-interactions">
                      <span class="comment-time">{{formatDate(c.createTime)}}</span>
                      <div class="comment-actions">
                         <div class="c-action-btn" @click.stop="handleCommentLike(c)">
                            <svg viewBox="0 0 24 24" width="16" height="16">
                              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" :fill="c.isLike ? '#ff2442' : '#999'"></path>
                            </svg>
                            {{c.liked || 0}}
                         </div>
                         <div class="c-action-btn" @click.stop="handleCommentReply(c)">
                            <i class="el-icon-chat-dot-square"></i>
                         </div>
                         <div class="c-action-btn delete-btn" v-if="user && user.id === c.userId" @click.stop="handleCommentDelete(c)">
                            <i class="el-icon-delete"></i>
                         </div>
                      </div>
                   </div>
                   
                   <!-- Replies -->
                   <div class="comment-replies" v-if="c.replies && c.replies.length > 0">
                      <div class="reply-item" v-for="r in c.replies" :key="r.id">
                         <div class="reply-avatar" @click.stop="toUserDetail(r.userId)">
                            <img :src="r.userIcon || '/imgs/icons/default-icon.png'">
                         </div>
                         <div class="reply-main">
                            <div class="reply-header">
                               <span class="reply-user" @click.stop="toUserDetail(r.userId)">{{r.nickName || '匿名用户'}}</span>
                               <span class="reply-time">{{formatDate(r.createTime)}}</span>
                            </div>
                            <div class="reply-content">
                               <span v-if="r.replyToName" class="reply-target">回复 @{{r.replyToName}}</span>
                               {{r.content}}
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
             
             <div v-if="allCommentsLoading" class="loading-more">加载中...</div>
             <div v-if="allCommentsNoMore && allComments.length > 0" class="no-more-reviews">没有更多评论了</div>
          </div>
          <!-- Bottom Input Bar in Popup -->
          <div class="popup-bottom-bar" @click="writeCommentFromPopup">
             <div class="popup-input-placeholder">发条评论，和大家一起讨论</div>
             <el-button type="primary" size="small" round>发布</el-button>
          </div>
       </div>
    </div>
    
    <!-- 图片预览 -->
    <el-image-viewer v-if="showImagePreview" :url-list="previewImages" :initial-index="currentPreviewIndex" @close="closeImagePreview" hide-on-click-modal />
  </div>
</template>

<script>
import { getBlogDetail, deleteBlog, pinBlog } from '@/api/blog';
import { getShopDetail } from '@/api/shop';
import { getLikeList, isFollowed, followUser, likeBlog, getComments, addComment, likeComment, replyComment, removeComment, toggleStar } from '@/api/interaction';
import { getCurrentUser } from '@/api/user';
import { uploadFile } from '@/api/common';
import '@/assets/css/blog-detail.css';
import { ElImageViewer } from 'element-plus';

export default {
  name: 'BlogDetail',
  components: { ElImageViewer },
  data() {
    return {
       blog: {},
       shop: {},
       user: {},
       likes: [],
       comments: [],
       aiComment: null,
       followed: false,
       pageLoading: false,
       
       // Carousel
       currentImageIndex: 0,
       carouselHeight: '400px',
       touchStartX: 0,
       touchEndX: 0,
       
       // Comment UI
       showCommentPublish: false,
       commentText: '',
       commentRating: 5,
       selectedImages: [], // {file, url}
       
       // Preview
       showImagePreview: false,
       previewImages: [],
       currentPreviewIndex: 0,
       replyToComment: null,
       showMenu: false,
       
       // Review popup
       showReviewPopup: false,
       allComments: [],
       allCommentsPage: 1,
       allCommentsNoMore: false,
       allCommentsLoading: false
    }
  },
  computed: {
     fileURL() {
        return this.$fileURL || '';
     },
     isOwner() {
         return this.user && this.blog && this.user.id === this.blog.userId;
     }
  },
  created() {
     const id = this.$route.query.id;
     if(id) {
        this.pageLoading = true;
        this.queryBlogById(id).finally(() => this.pageLoading = false);
        this.loadComments(id);

        const token = localStorage.getItem("token");
        if(token) {
           this.queryLoginUser();
        }
     }
  },
  methods: {
     goBack() { this.$router.go(-1); },
     toOtherInfo() {
        if(this.user && this.user.id === this.blog.userId) {
           this.$router.push('/info');
        } else {
           this.$router.push(`/user-info/${this.blog.userId}`);
        }
     },
      toUserDetail(userId) {
         if(!userId) return;
         if(this.user && String(this.user.id) === String(userId)) {
            this.$router.push('/info');
         } else {
            this.$router.push(`/user-info/${userId}`);
         }
      },
      toShopDetail() {
        if(this.shop.id) this.$router.push({ path: '/shop/detail', query: { id: this.shop.id } });
     },
     formatDate(time) {
        if(!time) return '';
        const d = new Date(time);
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${d.getFullYear()}.${d.getMonth()+1}.${d.getDate()} ${hours}:${minutes}`;
     },
     
     // API Calls
      async queryBlogById(id) {
        try {
           let res = await getBlogDetail(id);
           // Adapter: unwrap if strictly needed. Usually 'request.js' handles standard structure, 
           // but seeing previous issues, let's be safe.
           // However, for single object returns, often it's just the object.
           // If 'res' has 'data' property that is the object, extract it.
           // BUT be careful not to mistake a blog property named 'data' (unlikely).
           // If res.id exists, it's the blog. If res.data && res.data.id, it's nested.
           let blogData = res;
           if (!res.id && res.data) blogData = res.data;

           this.blog = blogData;
           if(this.blog.images) {
              const imgs = typeof this.blog.images === 'string' ? this.blog.images.split(',') : this.blog.images;
              this.blog.images = imgs.map(i => i.startsWith('http') ? i : this.$fileURL + i);
           }
           if(this.blog.icon) this.blog.icon = this.$fileURL + this.blog.icon;
           
           if(this.blog.shopId) this.queryShopById(this.blog.shopId);
           
           // Check follow status if user is already logged in
           if(this.user.id && this.user.id !== this.blog.userId) {
               this.checkFollowStatus();
           }
           
           this.queryLikeList(id);
        } catch(e) { console.error(e); }
     },
     async queryShopById(id) {
        getShopDetail(id).then(res => {
           let shopData = res;
           if (!res.id && res.data) shopData = res.data;
           
           this.shop = shopData;
           if(this.shop.images) this.shop.image = this.$fileURL + this.shop.images.split(',')[0];
        });
     },
     queryLikeList(id) {
        getLikeList({ sourceType: 3, sourceId: id }).then(res => {
           let list = res;
           if (Array.isArray(res)) list = res;
           else if (res && Array.isArray(res.data)) list = res.data;
           
           this.likes = list || [];
           this.likes.forEach(u => u.icon = u.icon ? this.$fileURL + u.icon : '');
        });
     },
     queryLoginUser() {
        getCurrentUser().then(res => {
           this.user = res.data || res || {};
           if (this.user.data) this.user = this.user.data; // Double check
           
           if(this.user.icon) this.user.icon = this.$fileURL + this.user.icon;
           
           // Check follow status if both blog and user are loaded
           if(this.blog.userId && this.user.id && this.user.id !== this.blog.userId) {
               this.checkFollowStatus();
           }
        }).catch(() => {});
     },
     
     // Interactions
     checkFollowStatus() {
        isFollowed({ sourceId: this.blog.userId, sourceType: 1 }).then(res => {
            this.followed = res.data; 
        });
     },
     toggleFollow() {
        if(!this.user.id) return this.$router.push('/user/login');
        const newStatus = !this.followed;
        followUser({
           sourceId: this.blog.userId,
           sourceType: 1,
           isFollow: newStatus
        }).then(() => {
           this.followed = newStatus;
           this.$message.success(newStatus ? '已关注' : '已取消关注');
        });
     },
     addLike() {
        if(!this.user.id) return this.$router.push('/user/login');
        
        // Optimistic update
        const originalLike = this.blog.isLike;
        const originalCount = this.blog.liked;
        
        this.blog.isLike = !this.blog.isLike;
        this.blog.liked = this.blog.isLike ? (this.blog.liked + 1) : (this.blog.liked - 1);
        
        likeBlog({ sourceType: 3, sourceId: this.blog.id }).then(() => {
           this.queryLikeList(this.blog.id);
        }).catch(() => {
           // Revert
           this.blog.isLike = originalLike;
           this.blog.liked = originalCount;
           this.$message.error('操作失败');
        });
     },
     
     // Comments
      loadComments(id) {
         getComments({ 
            sourceId: id, sourceType: 3, current: 1 
         }).then(res => {
            let list = [];
            if (Array.isArray(res)) list = res;
            else if (res && Array.isArray(res.data)) list = res.data;
            else if (res && res.data && Array.isArray(res.data)) list = res.data;
            else if (res && typeof res === 'object') {
                if(Array.isArray(res.records)) list = res.records;
                else if(res.data && Array.isArray(res.data.records)) list = res.data.records;
            }
            
            const processedList = list.map(c => ({
               ...c,
               userIcon: c.userIcon ? (c.userIcon.startsWith('http') ? c.userIcon : this.$fileURL + c.userIcon) : '',
               images: c.images ? c.images.split(',').map(i => i.startsWith('http') ? i : this.$fileURL + i) : []
            }));

            // Reset AI comment
            this.aiComment = null;
            
            // Find and extract AI comment
            const aiIndex = processedList.findIndex(c => c.isAIGenerated || c.userId === -1); // Assuming -1 or specific flag
            if(aiIndex !== -1) {
               this.aiComment = processedList[aiIndex];
               processedList.splice(aiIndex, 1);
            }
            
            // Limit to top 3 for preview
            // this.comments = processedList.slice(0, 3); // Original line, now replaced by nesting logic below
            
            if(processedList.length === 0) {
              this.noMore = true; // Assuming 'noMore' is a data property for pagination
           } else {
              // Process list to nest replies
              const rawList = processedList.filter(c => !c.isAIGenerated);
              
              // Let's implement robust nesting on client side for the accumulating list.
              // For simplicity, we'll re-process the entire list received from the API call.
              // If `this.comments` was accumulating, we'd merge `rawList` into it first.
              // But since `loadComments` is called once on created, we just process `rawList`.
              
              // Build map for all comments
              const commentMap = {};
              rawList.forEach(c => {
                 c.replies = []; 
                 commentMap[c.id] = c;
              });
              
              const roots = [];
              
              // Helper to find root ancestor
              const findRoot = (comment) => {
                 let curr = comment;
                 let depth = 0;
                 while(curr && curr.answerId && depth < 20) {
                     curr = commentMap[curr.answerId];
                     depth++;
                 }
                 return (curr && !curr.answerId) ? curr : null;
              };

              rawList.forEach(c => {
                  if (!c.answerId) {
                      roots.push(c);
                  } else {
                      // It is a reply
                      const directParent = commentMap[c.answerId];
                      if(directParent) {
                          c.replyToName = directParent.nickName; // Set who it replies to
                          
                          // Find root to attach to
                          const root = findRoot(c);
                          if(root) {
                              root.replies.push(c);
                          } else {
                              // Fallback if root not found (e.g. not in this page), render as root?
                              // Or ignore? Let's render as root to be safe but it might look weird.
                              roots.push(c); 
                          }
                      } else {
                         // Parent not found, treat as root
                         roots.push(c);
                      }
                  }
              });
              
              // Sort replies by time?
              roots.forEach(r => {
                 if(r.replies && r.replies.length) {
                    r.replies.sort((a,b) => new Date(a.createTime) - new Date(b.createTime));
                 }
              });
              
              this.comments = roots.slice(0, 3); // Preview limit or full list logic
           } 
         });
      },
      viewAllComments() {
         this.showReviewPopup = true;
         this.allComments = [];
         this.allCommentsPage = 1;
         this.allCommentsNoMore = false;
         this.loadAllComments();
      },
      loadAllComments() {
         if(this.allCommentsLoading || this.allCommentsNoMore) return;
         this.allCommentsLoading = true;
         
         getComments({ sourceId: this.blog.id, sourceType: 3, current: this.allCommentsPage }).then(res => {
            let list = [];
            if(Array.isArray(res)) list = res;
            else if(res && Array.isArray(res.list)) list = res.list;
            else if(res && Array.isArray(res.data)) list = res.data;
            else if(res && res.data && Array.isArray(res.data.records)) list = res.data.records;
            
            if(list.length === 0) {
               this.allCommentsNoMore = true;
            } else {
               const processed = list.filter(c => !c.isAIGenerated).map(c => ({
                  ...c,
                  userIcon: c.userIcon ? (c.userIcon.startsWith('http') ? c.userIcon : this.fileURL + c.userIcon) : '',
                  images: c.images ? c.images.split(',').filter(x=>x).map(i => i.startsWith('http') ? i : this.fileURL + i) : [],
                  replies: []
               }));
               
               // Build reply tree
               const map = {};
               processed.forEach(c => map[c.id] = c);
               
               const roots = [];
               processed.forEach(c => {
                  if(!c.answerId) {
                     roots.push(c);
                  } else {
                     const parent = map[c.answerId];
                     if(parent) {
                        c.replyToName = parent.nickName;
                        let curr = parent;
                        while(curr && curr.answerId && map[curr.answerId]) {
                           curr = map[curr.answerId];
                        }
                        if(curr && !curr.answerId) {
                           if(!curr.replies) curr.replies = [];
                           curr.replies.push(c);
                        } else {
                           roots.push(c);
                        }
                     } else {
                        roots.push(c);
                     }
                  }
               });
               
               this.allComments = [...this.allComments, ...roots];
               this.allCommentsPage++;
            }
         }).finally(() => {
            this.allCommentsLoading = false;
         });
      },
      onPopupScroll(e) {
         const { scrollTop, clientHeight, scrollHeight } = e.target;
         if(scrollTop + clientHeight >= scrollHeight - 50) {
            this.loadAllComments();
         }
      },
      writeCommentFromPopup() {
         if(!this.user || !this.user.id) {
            this.$message.warning("请先登录");
            return this.$router.push('/user/login');
         }
         this.replyToComment = null;
         this.commentText = '';
         this.selectedImages = [];
         this.showCommentPublish = true;
      },
     checkLogin() {
        if(!this.user.id) this.$router.push('/user/login');
        else this.showCommentPublish = true;
     },
     closeCommentModal() {
        this.commentText = '';
        this.selectedImages = [];
        this.showCommentPublish = false;
        this.replyToComment = null;
     },
     
     // Comment Publish
     async handleImageUpload(e) {
        const files = e.target.files;
        for(let file of files) {
           const formData = new FormData();
           formData.append("file", file);
           let res = await uploadFile(formData);
           
           // Extract path from response
           let path = res;
           if (res && typeof res === 'object' && res.data) path = res.data;
           if (typeof path !== 'string') path = String(path);
           
           // Strip the fileURL prefix, keep only relative path
           const filePrefix = this.fileURL || '';
           if (path.startsWith(filePrefix)) {
             path = path.substring(filePrefix.length);
           }
           if (path.startsWith('http')) {
             // Heuristic: if it contains /smart-live, split there
             // Or generic split
             try {
                const urlObj = new URL(path);
                path = urlObj.pathname;
             } catch(e) {
                // simple split if URL parsing fails
                if(path.includes('/smart-live')) path = path.split('/smart-live')[1];
             }
           }
           // Ensure path starts with / if not empty
           if(path && !path.startsWith('/')) path = '/' + path;
           
           this.selectedImages.push({ file, url: this.fileURL + path, rawUrl: path });
        }
     },
     removeImage(idx) {
        this.selectedImages.splice(idx, 1);
     },
     publishComment() {
        if (!this.commentText.trim()) {
           this.$message.error('请输入评价内容');
           return;
        }

        const data = {
           content: this.commentText,
           rating: this.commentRating,
           sourceId: this.blog.id,
           sourceType: 3, // Blog
           userId: this.user.id,
           parentId: 0, // Default for top-level comments
           answerId: 0, // Default for top-level comments
           images: this.selectedImages.map(i => i.rawUrl).join(',')
        };

        if (this.replyToComment) {
             data.sourceType = 5; // Reply type
             data.parentId = this.blog.id; // Blog ID
             data.answerId = this.replyToComment.id; // Comment ID being replied to
             // sourceId for reply? User said "Reuse... sourceType 5".
             // Standard addComment usually sends sourceId.
             // If sourceType=5, sourceId might be ignored or should be the answerId or parentId?
             // Based on "answer_id is reply comment id", we send that.
             // Let's send sourceId = this.replyToComment.id just in case, but rely on answerId.
             data.sourceId = this.replyToComment.id; 
             // Replies typically don't have ratings or images, clear them
             delete data.rating;
        }

        addComment(data).then(() => {
           this.$message.success("发布成功");
           this.closeCommentModal();
           // Reload
           this.comments = []; 
           this.aiComment = null; // Reset AI comment
           this.loadComments(this.blog.id); // Reload comments for the current blog
           this.queryBlogById(this.blog.id); // Refresh blog details to update comment count
           // Also refresh popup comments if open
           if(this.showReviewPopup) {
              this.allComments = [];
              this.allCommentsPage = 1;
              this.allCommentsNoMore = false;
              this.loadAllComments();
           }
        }).catch(err => {
           this.$message.error('发布失败，请重试');
           console.error(err);
        });
     },
     
     // Preview
     previewImage(list, idx) {
        this.previewImages = list || [];
        this.currentPreviewIndex = idx;
        this.showImagePreview = true;
     },
     closeImagePreview() {
        this.showImagePreview = false;
     },
     handleCommentLike(c) {
        if(!this.user.id) return this.$router.push('/user/login');
        const oldState = c.isLike;
        c.isLike = !c.isLike;
        c.liked = c.isLike ? (c.liked + 1) : (c.liked - 1);
        
        likeComment(c.id).then(() => {
           // Success
        }).catch(() => {
           c.isLike = oldState;
           c.liked = c.isLike ? (c.liked + 1) : (c.liked - 1);
        });
     },
     handleCommentReply(c) {
        if(!this.user.id) return this.$router.push('/user/login');
        this.replyToComment = c;
        this.commentText = ''; // Dont prefill, use placeholder
        this.showCommentPublish = true;
     },
     handleCommentDelete(c) {
        this.$confirm('确定要删除这条评论吗？删除后不可恢复。', '删除评论', {
           confirmButtonText: '确定删除',
           cancelButtonText: '取消',
           type: 'warning',
           confirmButtonClass: 'el-button--danger'
        }).then(() => {
           // Use fallback values if sourceType/sourceId are missing
           const sourceType = c.sourceType || 3; // Default to blog type
           const sourceId = c.sourceId || this.blog.id;
           
           removeComment({ id: c.id, sourceType, sourceId }).then(() => {
              this.$message.success('删除成功');
              this.comments = []; // Clear first to force reload
              this.loadComments(this.blog.id);
              this.queryBlogById(this.blog.id);
           }).catch(err => {
              console.error('删除失败', err);
              this.$message.error('删除失败，请重试');
           });
        }).catch(() => {});
     },
     
     // Star/Collection
      // Star/Collection
     toggleStar() {
        if(!this.user.id) return this.$router.push('/user/login');
        const newStatus = !this.blog.isStared;
        
        // Optimistic update
        const originalStatus = this.blog.isStared;
        const originalCount = this.blog.stared;
        
        this.blog.isStared = newStatus;
        this.blog.stared = newStatus ? (this.blog.stared || 0) + 1 : Math.max((this.blog.stared || 0) - 1, 0);
        
        toggleStar({
           sourceId: this.blog.id,
           sourceType: 3,
           isStar: newStatus
        }).then(() => {
           this.$message.success(newStatus ? '已收藏' : '已取消收藏');
        }).catch(() => {
           // Revert
           this.blog.isStared = originalStatus;
           this.blog.stared = originalCount;
           this.$message.error('操作失败');
        });
     },
     
     // Carousel
     onCarouselChange(index) {
        this.currentImageIndex = index;
     },
     onImageLoad(e) {
        // Auto adjust height based on image ratio
        const img = e.target;
        const ratio = img.naturalHeight / img.naturalWidth;
        const width = window.innerWidth;
        const height = Math.min(width * ratio, window.innerHeight * 0.7);
        this.carouselHeight = height + 'px';
     },
     
     // Touch swipe handlers
     onTouchStart(e) {
        this.touchStartX = e.touches[0].clientX;
     },
     onTouchMove(e) {
        this.touchEndX = e.touches[0].clientX;
     },
     onTouchEnd() {
        const diff = this.touchStartX - this.touchEndX;
        const threshold = 50; // 最小滑动距离
        
        if (Math.abs(diff) > threshold) {
           if (diff > 0) {
              // 向左滑动，下一张
              this.$refs.imageCarousel?.next();
           } else {
              // 向右滑动，上一张
              this.$refs.imageCarousel?.prev();
           }
        }
        
        // 重置
        this.touchStartX = 0;
        this.touchEndX = 0;
     },
     goToImage(index) {
        this.$refs.imageCarousel?.setActiveItem(index);
     },
      handleSticky() {
          this.showMenu = false;
          if (this.blog.id) {
             const newStatus = !this.blog.pin;
             pinBlog({ id: this.blog.id, pin: newStatus }).then(() => {
                this.blog.pin = newStatus;
                this.$message.success(newStatus ? '置顶成功' : '取消置顶成功');
             });
          }
      },
      handleEdit() {
          this.showMenu = false;
          this.$router.push({ path: '/blog/edit', query: { id: this.blog.id } });
      },
      handleDelete() {
          this.showMenu = false;
          this.$confirm('确定删除这篇笔记吗？删除后不可恢复', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }).then(() => {
             deleteBlog(this.blog.id).then(() => {
                this.$message.success('删除成功');
                this.$router.push('/user/info'); 
             }).catch(() => {
                this.$message.error('删除失败');
             });
          }).catch(() => {});
      },
      goHome() {
          this.showMenu = false;
          this.$router.push('/');
      }
  }
}
</script>

<style scoped>
/* Page Layout */
.blog-detail-page { 
  height: 100vh; 
  display: flex; 
  flex-direction: column; 
  background: white; 
}

/* Fixed Top Bar */
.fixed-top-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 50px;
  background: white;
  display: flex;
  align-items: center;
  padding: 0 12px;
  z-index: 100;
  border-bottom: 1px solid #f0f0f0;
}
.top-back-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #333;
  cursor: pointer;
}
.top-user-section {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  margin-left: 8px;
}
.top-user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}
.top-user-info {
  display: flex;
  flex-direction: column;
}
.top-user-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}
.top-user-tag {
  font-size: 10px;
  color: #999;
  display: flex;
  align-items: center;
  gap: 4px;
}
.top-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.top-follow-btn {
  padding: 5px 14px;
  border-radius: 16px;
  font-size: 12px;
  border: 1px solid #ff2442;
  background: #ff2442;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}
.top-follow-btn.followed {
  background: white;
  color: #999;
  border-color: #ddd;
}
.top-share-icon {
  font-size: 20px;
  color: #333;
  cursor: pointer;
}

/* Scroll Container */
.scroll-container {
  flex: 1;
  overflow-y: auto;
  margin-top: 50px;
  padding-bottom: 70px;
}
.content-wrapper {
  min-height: 100%;
}

/* Image Carousel */
.image-carousel-full {
  position: relative;
  width: 100%;
  background: #f5f5f5;
}
.full-carousel-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  cursor: pointer;
  background: #f5f5f5;
}
.image-indicator {
  position: absolute;
  right: 12px;
  top: 12px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 10px;
  z-index: 10;
}

/* Dots Indicator */
.dots-indicator {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 6px;
  z-index: 10;
}
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.3s;
}
.dot.active {
  background: white;
  width: 18px;
  border-radius: 3px;
}

/* Blog Content Section */
.blog-content-section {
  padding: 15px;
}
.blog-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  line-height: 1.4;
}
.blog-text {
  font-size: 15px;
  color: #333;
  line-height: 1.8;
  word-break: break-word;
}
.blog-time {
  font-size: 12px;
  color: #999;
  margin-top: 20px;
}

/* Shop Card */
.shop-card {
  margin: 15px;
  padding: 12px;
  background: #f8f8f8;
  border-radius: 10px;
  display: flex;
  align-items: center;
  cursor: pointer;
}
.shop-card-icon {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}
.shop-card-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.shop-card-info {
  flex: 1;
  margin-left: 12px;
}
.shop-card-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}
.shop-card-rating {
  display: flex;
  align-items: center;
}
.shop-card-price {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}
.shop-card-arrow {
  color: #ccc;
  font-size: 16px;
}

/* Like Section */
.like-section {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  gap: 12px;
}
.like-icon-btn {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.like-avatars {
  display: flex;
  align-items: center;
  gap: 0;
  flex-wrap: wrap;
}
.like-avatar-item {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  overflow: hidden;
  margin-left: -6px;
  border: 2px solid white;
  cursor: pointer;
}
.like-avatar-item:first-child {
  margin-left: 0;
}
.like-avatar-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.like-count-text {
  font-size: 13px;
  color: #666;
  margin-left: 8px;
}

/* Section Divider */
.section-divider {
  height: 8px;
  background: #f5f5f5;
}

/* Comments Section */
.comments-section {
  padding: 15px;
}
.comments-header {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 15px;
}
.view-all-btn {
  text-align: center;
  padding: 15px 0;
  color: #666;
  font-size: 14px;
  border-top: 1px solid #f5f5f5;
  cursor: pointer;
  margin-top: 10px;
}
.no-comments {
  text-align: center;
  padding: 30px;
  color: #999;
  font-size: 14px;
}

/* Fixed Bottom Bar */
.fixed-bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: white;
  border-top: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  padding: 0 12px;
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 100;
  gap: 12px;
}
.bottom-comment-input {
  flex: 1;
  height: 36px;
  background: #f5f5f5;
  border-radius: 18px;
  display: flex;
  align-items: center;
  padding: 0 15px;
  gap: 8px;
  color: #999;
  font-size: 14px;
  cursor: pointer;
}
.bottom-comment-input i {
  font-size: 16px;
}
.bottom-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}
.bottom-action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}
.bottom-action-item i {
  font-size: 22px;
  color: #333;
}
.bottom-action-item i.active {
  color: #ff2442;
}
.bottom-action-item span {
  font-size: 10px;
  color: #666;
  margin-top: 2px;
}

/* Like Icon SVG */
.like-icon {
  display: block;
}
.like-icon-small {
  display: block;
  flex-shrink: 0;
}

/* AI Comment Styles */
.ai-generated-comment {
  background: linear-gradient(135deg, #f8fbff 0%, #f0f7ff 100%);
  border: 1px solid #e1eeff;
  border-radius: 12px;
  margin: 12px 0;
  padding: 16px;
  position: relative;
}
.ai-generated-badge {
  position: absolute;
  top: 12px;
  right: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 10px;
  padding: 4px 8px;
  border-radius: 10px;
  font-weight: 600;
}
.ai-comment-icon {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-right: 10px;
  float: left;
}
.ai-comment-info {
  overflow: hidden;
}
.ai-verified {
  color: #667eea;
  font-size: 12px;
  background: rgba(102, 126, 234, 0.1);
  padding: 2px 6px;
  border-radius: 8px;
  margin-left: 5px;
}
.ai-highlight {
  color: #667eea;
  font-weight: 600;
  font-size: 12px;
}

/* Comment Pop Modal */
.comment-pop-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
}
.comment-pop-box {
  background: white;
  width: 100%;
  border-radius: 16px 16px 0 0;
  padding: 20px;
  max-height: 80vh;
  overflow-y: auto;
  box-sizing: border-box;
}
.pop-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.pop-title {
  font-size: 14px;
  color: #666;
}
.pop-close {
  font-size: 20px;
  color: #999;
  cursor: pointer;
  padding: 5px;
}
.pop-textarea textarea {
  width: 100%;
  border: none;
  outline: none;
  resize: none;
  font-size: 16px;
  line-height: 1.6;
  min-height: 80px;
  padding: 0;
}
.pop-textarea textarea::placeholder {
  color: #ccc;
}
.pop-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 10px 0;
}
.pop-image-item {
  width: 60px;
  height: 60px;
  position: relative;
}
.pop-image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 6px;
}
.pop-image-item i {
  position: absolute;
  top: -4px;
  right: -4px;
  background: rgba(0,0,0,0.6);
  color: white;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  cursor: pointer;
}
.pop-image-add {
  width: 60px;
  height: 60px;
  border: 1px dashed #ddd;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ccc;
  font-size: 18px;
  cursor: pointer;
}
.pop-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0 0 0;
  margin-top: 10px;
  border-top: 1px solid #f0f0f0;
}
.pop-toolbar-left {
  display: flex;
  align-items: center;
  gap: 20px;
}
.pic-icon {
  cursor: pointer;
  flex-shrink: 0;
  display: block;
  width: 24px;
  height: 24px;
}
.pic-icon:hover path {
  fill: #ff6633;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 100px 0;
  color: #999;
}
.empty-state i {
  font-size: 60px;
  margin-bottom: 20px;
  color: #ddd;
}

/* More Menu Popover */
.more-menu-popover {
    padding: 0 !important;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
}
.more-menu-list {
    display: flex;
    flex-direction: column;
}
.menu-item {
    height: 44px;
    display: flex;
    align-items: center;
    padding: 0 16px;
    font-size: 14px;
    color: #333;
    cursor: pointer;
    transition: background 0.2s;
}
.menu-item:hover {
    background: #f5f5f5;
}
.menu-item i {
    margin-right: 8px;
    font-size: 16px;
}
.menu-item.delete {
    color: #ff2442;
}
.top-more-icon {
    font-size: 20px;
    color: #333;
    cursor: pointer;
    margin-left: 12px;
}

/* Review Popup Bottom Sheet */
.review-popup-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: flex-end; }
.review-popup-sheet { width: 100%; height: 75vh; background: white; border-radius: 16px 16px 0 0; display: flex; flex-direction: column; animation: slideUp 0.3s ease; }
@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
.review-popup-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #f0f0f0; flex-shrink: 0; }
.review-popup-title { font-size: 16px; font-weight: 600; }
.review-popup-close { font-size: 22px; color: #999; cursor: pointer; padding: 4px; }
.review-popup-close:hover { color: #333; }
.review-popup-body { flex: 1; overflow-y: auto; padding: 0 16px 20px; }
.review-popup-body .comment-box { padding: 16px 0; border-bottom: 1px solid #f5f5f5; }
.review-popup-body .comment-box:last-child { border-bottom: none; }
.empty-reviews { text-align: center; padding: 60px 20px; color: #999; }
.empty-reviews i { font-size: 48px; margin-bottom: 12px; color: #ddd; }
.loading-more { text-align: center; padding: 15px; color: #999; font-size: 13px; }
.no-more-reviews { text-align: center; padding: 15px; color: #ccc; font-size: 12px; }

/* Popup Bottom Input Bar */
.popup-bottom-bar { display: flex; align-items: center; padding: 12px 16px; border-top: 1px solid #f0f0f0; background: white; flex-shrink: 0; gap: 12px; }
.popup-input-placeholder { flex: 1; background: #f5f5f5; padding: 10px 16px; border-radius: 20px; color: #999; font-size: 14px; }

/* Ensure comment modal is above review popup */
.comment-pop-overlay { z-index: 1100 !important; }
</style>
