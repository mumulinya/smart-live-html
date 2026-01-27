<template>
  <div class="review-detail-wrapper">
    <!-- Header with Back Button -->
    <div class="detail-header">
        <div class="back-btn" @click="$router.go(-1)">
            <i class="el-icon-arrow-left"></i>
        </div>
        <div class="header-title">评价详情</div>
        <div class="header-right">
            <i class="el-icon-more"></i>
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
            <div class="more-btn"><i class="el-icon-more"></i></div>
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

        <!-- Shop Link -->
        <div class="shop-link-card" @click="toShopDetail">
            <img v-if="review.shopImages && review.shopImages.length" :src="review.shopImages[0]" class="shop-thumb" />
            <i v-else class="el-icon-shop shop-icon"></i>
            <div class="shop-info">
                <div class="shop-name">{{ review.shopName }}</div>
                <div class="shop-rating">4.2 星</div>
            </div>
            <div class="shop-collect">收藏 97</div>
        </div>

        <!-- Views -->
        <div class="view-count">浏览 {{ review.viewCount }}</div>

        <!-- Likes Avatars -->
        <div class="like-avatars" v-if="review.likeCount > 0">
             <img :src="review.userAvatar || defaultAvatar" class="mini-avatar" />
             <span>{{ review.likeCount }}人赞</span>
        </div>

        <!-- Comments Section -->
        <div class="comments-section">
            <div class="comments-title">评论 ({{ comments.length }})</div>
                <div class="comment-list">
                    <div class="comment-box" v-if="comments.length === 0">
                        <div class="c-placeholder">暂无评论</div>
                    </div>
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
                            
                            <!-- Replies matching BlogDetail.vue -->
                            <div class="comment-replies" v-if="c.replies && c.replies.length > 0">
                                <div class="reply-item" v-for="r in c.replies" :key="r.id">
                                    <div class="reply-avatar" @click.stop="toUserDetail(r.userId)">
                                        <img :src="r.userIcon || r.userAvatar || defaultAvatar" alt="">
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
                                        <div class="reply-actions">
                                            <div class="c-action-btn" @click.stop="handleCommentLike(r)">
                                            <svg viewBox="0 0 24 24" width="14" height="14">
                                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" :fill="r.isLike ? '#ff2442' : '#999'"></path>
                                            </svg>
                                            <span v-if="r.liked > 0">{{r.liked}}</span>
                                            </div>
                                            <div class="c-action-btn" @click.stop="handleReply(r)">
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
                </div>
            </div>
            
            <!-- Bottom Bar -->
            <div class="bottom-bar">
                <div class="input-fake" @click="checkLogin">说点什么吧~</div>
                <div class="bar-actions">
                    <div class="bar-btn" @click="addLike">
                        <svg viewBox="0 0 24 24" width="22" height="22">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" :fill="review.isLike ? '#ff2442' : '#333'"></path>
                        </svg>
                        <span>{{ review.likeCount || '点赞' }}</span>
                    </div>
                    <div class="bar-btn">
                        <i class="el-icon-star-off"></i>
                        <span>收藏{{review.collectCount || 1}}</span>
                    </div>
                    <!-- Also trigger comment on comment icon click -->
                    <div class="bar-btn" @click="checkLogin">
                        <i class="el-icon-chat-round"></i>
                        <span>评论</span>
                    </div>
                </div>
            </div>
        </div>

    <!-- Comment Input Popup -->
    <div class="comment-pop-overlay" v-if="showCommentPublish" @click="closeCommentModal">
        <div class="comment-pop-box" @click.stop>
            <div class="pop-header">
                <span class="pop-title">{{ replyToComment ? ('回复 @' + replyToComment.nickName) : '发表评论' }}</span>
                <i class="el-icon-close pop-close" @click="closeCommentModal"></i>
            </div>
            <div class="pop-textarea">
                <textarea 
                    v-model="commentText" 
                    placeholder="分享你此刻的想法..." 
                    rows="3"
                ></textarea>
            </div>
            <div class="pop-toolbar">
                <div class="pop-toolbar-left"></div>
                <el-button type="primary" size="small" :disabled="!commentText.trim()" @click="publishComment">发送</el-button>
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
import { getCommentDetail, likeComment, getComments, addComment, removeComment } from '@/api/interaction';
import { getCurrentUser } from '@/api/user';
import { fileURL } from '@/utils/request';
import '@/assets/css/blog-detail.css'; // Import blog-detail.css for shared styles

export default {
  name: 'ReviewDetail',
  components: { ElImageViewer },
  data() {
      return {
          defaultAvatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
          review: null,
          imgPrefix: fileURL,
          comments: [],
          // Preview
          showImagePreview: false,
          previewImages: [],
          currentPreviewIndex: 0,
          // Comment Input
          showCommentPublish: false,
          commentText: '',
          user: {},
          replyToComment: null
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
          this.loadDetail(id);
      } else {
          this.$message.error('参数错误');
          this.$router.go(-1);
      }
  },
  methods: {
      loadDetail(id) {
          getCommentDetail(id).then(res => {
              let data = res.data || res;
              if (data.data) data = data.data;
              
              // Map API response to UI
              this.review = {
                  id: data.id,
                  userName: data.nickName || 'Unknown',
                  userAvatar: data.userIcon ? (data.userIcon.startsWith('http') ? data.userIcon : this.imgPrefix + data.userIcon) : this.defaultAvatar,
                  date: this.formatDate(data.createTime),
                  rating: data.score || 5,
                  isFreeTrial: false,
                  scores: { 
                      taste: data.tasteScore || 5.0, 
                      env: data.envScore || 5.0, 
                      service: data.serviceScore || 5.0 
                  },
                  content: data.content,
                  images: data.images ? data.images.split(',').map(url => url.startsWith('http') ? url : this.imgPrefix + url) : [],
                  shopId: data.sourceId,
                  shopName: data.sourceName || 'Unknown Shop',
                  shopImages: data.shopImages ? data.shopImages.split(',').map(url => url.startsWith('http') ? url : this.imgPrefix + url) : [],
                  viewCount: data.viewCount || 0,
                  likeCount: data.liked || 0,
                  collectCount: 0,
                  isLike: data.isLike || false
              };
              
              // Load comments/replies
              this.loadComments(id);
          });
      },
      loadComments(id) {
          // Increase size to fetch more comments for client-side nesting
          getComments({ sourceId: id, sourceType: 5, current: 1, size: 500 }).then(res => {
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
                liked: c.liked || 0
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
                         // Find the true "root" (the comment whose answerId is "0")
                         let curr = directParent;
                         let depth = 0;
                         while(curr && curr.answerId && String(curr.answerId) !== '0' && depth < 20) {
                              const nextId = String(curr.answerId);
                              curr = commentMap[nextId];
                              depth++;
                         }
                         
                         if(curr) {
                            // Link this reply to the root comment's replies list
                            if(!curr.replies.some(reply => reply.id === c.id)) {
                                curr.replies.push(c);
                            }
                         } else {
                            // If root can't be found despite parent existing, treat as root for safety
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
          
          likeComment(this.review.id).catch(() => {
              this.review.isLike = originalLike;
              this.review.likeCount = originalLike ? (this.review.likeCount + 1) : (this.review.likeCount - 1);
              this.$message.error('操作失败');
          });
      },
      queryLoginUser() {
          getCurrentUser().then(res => {
              this.user = res.data || res || {};
              if (this.user.data) this.user = this.user.data;
          }).catch(() => {});
      },
      checkLogin() {
          if (!this.user || !this.user.id) {
              this.$message.warning("请先登录");
              this.$router.push('/user/login');
              return;
          }
          this.replyToComment = null; // Clear reply target when opening from main button
          this.showCommentPublish = true;
      },
      handleReply(comment) {
          if (!this.user || !this.user.id) {
              this.$message.warning("请先登录");
              this.$router.push('/user/login');
              return;
          }
          this.replyToComment = comment;
          this.showCommentPublish = true;
      },
      handleCommentDelete(comment) {
          this.$confirm('确定删除该评论吗？', '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }).then(() => {
              removeComment(comment.id).then(() => {
                  this.$message.success('删除成功');
                  this.loadComments(this.review.id);
              });
          }).catch(() => {});
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
          this.$router.push({ path: '/user/other-info', query: { id: userId } });
      },
      closeCommentModal() {
          this.showCommentPublish = false;
          this.commentText = '';
          this.replyToComment = null;
      },
      publishComment() {
          if (!this.commentText.trim()) {
              this.$message.warning("请输入内容");
              return;
          }
          const params = {
              sourceType: 5,
              content: this.commentText,
              userId: this.user.id,
              parentId: this.review.shopId // Parent ID is the shop ID for the review
          };
          
          if (this.replyToComment) {
              // Reply to a specific comment
              params.answerId = this.replyToComment.id;
              // IMPORTANT: Correctly set sourceId to Review ID so it appears in the list
              params.sourceId = this.review.id; 
          } else {
              // Comment on the review itself
              params.sourceId = this.review.id;
          }
          
          addComment(params).then(() => {
              this.$message.success("评论成功");
              this.closeCommentModal();
              this.loadComments(this.review.id);
          });
      }
  }
}
</script>

<style scoped>
/* Inherit standard page wrapper styles */
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

/* Bottom Bar */
.bottom-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 50px;
    background: #fff;
    border-top: 1px solid #f0f0f0;
    display: flex;
    align-items: center;
    padding: 0 15px;
    z-index: 100;
}
.input-fake {
    flex: 1;
    background: #f5f5f5;
    color: #999;
    padding: 8px 15px;
    border-radius: 20px;
    font-size: 13px;
    margin-right: 15px;
}
.bar-actions {
    display: flex;
    gap: 20px;
}
.bar-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    color: #333;
    font-size: 10px;
}
.bar-btn i {
    font-size: 20px;
    margin-bottom: 2px;
}

/* Comment Popup Styles */
.comment-pop-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    z-index: 2000;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
}
.comment-pop-box {
    background: #fff;
    border-radius: 12px 12px 0 0;
    padding: 15px;
    padding-bottom: 30px;
}
.pop-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
}
.pop-title {
    font-size: 16px;
    font-weight: 600;
    color: #333;
}
.pop-close {
    font-size: 20px;
    color: #999;
}
.pop-textarea textarea {
    width: 100%;
    border: none;
    background: #f5f5f5;
    padding: 10px;
    border-radius: 8px;
    font-size: 14px;
    resize: none;
    height: 100px;
    outline: none;
}
.pop-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 15px;
}
.pop-toolbar-left {
    flex: 1;
}
</style>
