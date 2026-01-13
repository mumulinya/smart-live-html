<template>
  <div class="blog-detail-page" v-loading="pageLoading">
    <!-- Header -->
    <div class="detail-header">
      <div class="header-back-btn" @click="goBack"><i class="el-icon-arrow-left"></i></div>
      <div class="header-title">笔记详情</div>
      <div class="header-share">...</div>
    </div>

    <div class="scroll-container">
       <div v-if="!blog.id && !pageLoading" class="empty-state">
           <i class="el-icon-warning-outline"></i>
           <p>内容不存在或已被删除</p>
       </div>

       <div v-if="blog.id">
          <!-- Carousel -->
          <div class="carousel-container" v-if="blog.images && blog.images.length > 0">
          <el-carousel trigger="click" height="300px" :autoplay="false" arrow="always" indicator-position="none">
             <el-carousel-item v-for="(img, i) in blog.images" :key="i">
                <img :src="img" class="carousel-img" @click="previewImage(blog.images, i)">
             </el-carousel-item>
          </el-carousel>
       </div>

       <!-- User Info -->
       <div class="basic">
          <div class="basic-icon" @click="toOtherInfo">
             <img :src="blog.icon || '/imgs/icons/default-icon.png'">
          </div>
          <div class="basic-info">
             <div class="name">{{blog.name}}</div>
             <span class="time">{{formatDate(blog.createTime)}}</span>
          </div>
          <div style="width: 20%">
             <div class="follow-btn" @click="toggleFollow" v-if="user && user.id !== blog.userId">
                {{followed ? '取消关注' : '关注'}}
             </div>
          </div>
       </div>

       <!-- Content -->
       <div class="blog-text" v-html="blog.content"></div>

       <!-- Shop Info -->
       <div class="shop-basic" v-if="shop.id" @click="toShopDetail">
          <div class="shop-icon">
             <img :src="shop.image || '/imgs/icons/default-icon.png'">
          </div>
          <div style="width: 80%">
             <div class="name">{{shop.name}}</div>
             <div><el-rate :model-value="shop.score/10" disabled text-color="#F63" show-score></el-rate></div>
             <div class="shop-avg">￥{{shop.avgPrice}}/人</div>
          </div>
       </div>

       <!-- Likes -->
       <div class="zan-box">
          <div class="zan-icon" @click="addLike">
              <svg viewBox="0 0 1024 1024" width="20" height="20">
                  <path d="M160 944c0 8.8-7.2 16-16 16h-32c-26.5 0-48-21.5-48-48V528c0-26.5 21.5-48 48-48h32c8.8 0 16 7.2 16 16v448zM96 416c-53 0-96 43-96 96v416c0 53 43 96 96 96h96c17.7 0 32-14.3 32-32V448c0-17.7-14.3-32-32-32H96zM505.6 64c16.2 0 26.4 8.7 31 13.9 4.6 5.2 12.1 16.3 10.3 32.4l-23.5 203.4c-4.9 42.2 8.6 84.6 36.8 116.4 28.3 31.7 68.9 49.9 111.4 49.9h271.2c6.6 0 10.8 3.3 13.2 6.1s5 7.5 4 14l-48 303.4c-6.9 43.6-29.1 83.4-62.7 112C815.8 944.2 773 960 728.9 960h-317c-33.1 0-59.9-26.8-59.9-59.9v-455c0-6.1 1.7-12 5-17.1 69.5-109 106.4-234.2 107-364h41.6z m0-64h-44.9C427.2 0 400 27.2 400 60.7c0 127.1-39.1 251.2-112 355.3v484.1c0 68.4 55.5 123.9 123.9 123.9h317c122.7 0 227.2-89.3 246.3-210.5l47.9-303.4c7.8-49.4-30.4-94.1-80.4-94.1H671.6c-50.9 0-90.5-44.4-84.6-95l23.5-203.4C617.7 55 568.7 0 505.6 0z" :fill="blog.isLike ? '#ff6633' : '#82848a'"></path>
              </svg>
          </div>
          <div class="zan-list">
             <div class="user-icon-mini" v-for="u in likes" :key="u.id" @click="toUserDetail(u.id)">
                <img :src="u.icon || '/imgs/icons/default-icon.png'">
             </div>
             <div class="like-count">{{blog.liked}}人点赞</div>
          </div>
       </div>

       <div class="blog-divider"></div>

       <!-- Comments -->
       <div class="blog-comments">
          <div class="comments-head">网友评价 ({{blog.comments || 0}})</div>
          
          <div class="comment-list" v-if="(comments && comments.length > 0) || (aiComment && aiComment.content)">
             <!-- AI Comment -->
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

             <!-- User Comments -->
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
                         <i class="el-icon-thumb" :style="{color: c.isLike ? '#F63' : '#999'}"></i>
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

                <!-- Replies -->
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
                                   <i class="el-icon-thumb" :style="{color: r.isLike ? '#F63' : '#999'}"></i>
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
            
            <div class="view-all" @click="viewAllComments">
               查看全部{{blog.comments}}条评价 <i class="el-icon-arrow-right"></i>
            </div>
         </div>
         <div v-else class="no-comments">暂无评论，快来发表第一条评论吧～</div>
      </div>
      
   </div> <!-- End of content-wrapper -->
   </div> <!-- End of scroll-container -->

   <!-- Footer -->
   <div class="foot-bar">
      <div class="foot-item" @click="addLike" :class="{active: blog.isLike}">
         <i :class="blog.isLike ? 'el-icon-thumb' : 'el-icon-thumb'"></i>
         <span>{{blog.isLike ? '已点赞' : '点赞'}}</span>
      </div>
      <div class="foot-item action-big" @click="checkLogin">
         <i class="el-icon-edit-outline"></i>
         <span>写评价</span>
      </div>
   </div>

   <!-- Comment Pop Input -->
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
    
    <!-- Image Preview -->
    <el-image-viewer v-if="showImagePreview" :url-list="previewImages" :initial-index="currentPreviewIndex" @close="closeImagePreview" hide-on-click-modal />
  </div>
</template>

<script>
import { getBlogDetail } from '@/api/blog';
import { getShopDetail } from '@/api/shop';
import { getLikeList, isFollowed, followUser, likeBlog, getComments, addComment, likeComment, replyComment, removeComment } from '@/api/interaction';
import { getCurrentUser } from '@/api/user';
import { uploadFile } from '@/api/common';
import '@/assets/css/blog-detail.css'; // Import existing styles
import { ElImageViewer } from 'element-plus'; // Vue 3 version might need update, checking usage

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
       
       // Comment UI
       showCommentPublish: false,
       commentText: '',
       commentRating: 5,
       selectedImages: [], // {file, url}
       
       // Preview
       showImagePreview: false,
       previewImages: [],
       currentPreviewIndex: 0,
       replyToComment: null // State for reply
    }
  },
  computed: {
     fileURL() {
        return this.$fileURL || '';
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
         this.$router.push({
            path: '/comment/list',
            query: { id: this.blog.id, type: 3 }
         });
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
           // this.current = 1; // Assuming 'current' is a data property for pagination
           // this.noMore = false; // Assuming 'noMore' is a data property for pagination
           this.loadComments(this.blog.id); // Reload comments for the current blog
           this.queryBlogById(this.blog.id); // Refresh blog details to update comment count
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
     }
  }
}
</script>

<style scoped>
  /* AI Comment Styles */
  .ai-generated-comment {
     background: #f7f9fc;
     border: 1px solid #e0e6ed;
     border-radius: 12px;
     margin-bottom: 15px;
     padding: 16px;
     box-shadow: 0 4px 12px rgba(24, 144, 255, 0.05);
  }
  .ai-comment-icon {
     background: linear-gradient(135deg, #6366f1, #3b82f6);
     border-radius: 50%;
     color: white;
     display: flex; align-items: center; justify-content: center;
     width: 36px; height: 36px;
  }
  .ai-verified {
     background: linear-gradient(90deg, #f59e0b, #d97706);
     color: white;
     font-size: 10px;
     padding: 2px 6px;
     border-radius: 4px;
     margin-left: 8px;
     font-weight: 500;
     display: inline-flex; align-items: center;
  }
  .ai-time { color: #94a3b8; font-size: 12px; }
  .ai-tag {
     background: #eff6ff;
     color: #3b82f6;
     border: 1px solid #bfdbfe;
     padding: 1px 8px;
     border-radius: 12px;
     font-size: 10px;
     margin-left: 10px;
     font-weight: 500;
  }

/* Scoped styles supplementing blog-detail.css */
.blog-detail-page { height: 100vh; display: flex; flex-direction: column; background: white; }
.detail-header { position: sticky; top: 0; z-index: 100; background: white; height: 50px; display: flex; align-items: center; padding: 0 15px; border-bottom: 1px solid #eee; flex-shrink: 0; }
.header-back-btn { font-size: 24px; cursor: pointer; }
.header-title { flex: 1; text-align: center; font-weight: bold; font-size: 16px; }
.header-share { width: 24px; text-align: center; color: #999; }
.scroll-container { flex: 1; overflow-y: auto; padding-bottom: 60px; }

.carousel-container { width: 100%; height: auto; }
.carousel-img { width: 100%; height: 100%; object-fit: cover; cursor: pointer; }

.follow-btn { border: 1px solid #FC3; color: #FC3; border-radius: 20px; text-align: center; padding: 5px 0; font-size: 12px; cursor: pointer; }

/* AI Comment Styles from inline HTML */
.ai-generated-comment { background: linear-gradient(135deg, #f8fbff 0%, #f0f7ff 100%); border: 1px solid #e1eeff; border-radius: 12px; margin: 12px 0; padding: 16px; position: relative; }
.ai-generated-badge { position: absolute; top: 12px; right: 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-size: 10px; padding: 4px 8px; border-radius: 10px; font-weight: 600; }
.ai-comment-icon { width: 36px; height: 36px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; margin-right: 10px; float: left; }
.ai-comment-info { overflow: hidden; }
.ai-verified { color: #667eea; font-size: 12px; background: rgba(102, 126, 234, 0.1); padding: 2px 6px; border-radius: 8px; margin-left: 5px; }
.ai-highlight { color: #667eea; font-weight: 600; font-size: 12px; }

/* Foot Bar */
.foot-bar { height: 56px; background: white; border-top: 1px solid #eee; display: flex; padding-bottom: env(safe-area-inset-bottom); position: fixed; bottom: 0; left: 0; right: 0; }
.foot-item { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 10px; color: #666; transition: all 0.2s; }
.foot-item i { font-size: 20px; margin-bottom: 2px; }
.foot-item.active i, .foot-item.active span { color: #FF6B00; }
.foot-item.action-big { flex: 1.5; background: #FF6B00; color: white; margin: 8px 16px; border-radius: 20px; flex-direction: row; gap: 6px; font-size: 14px; }
.foot-item.action-big i { font-size: 16px; margin: 0; color: white; }

/* Comment Pop Modal */
.comment-pop-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: flex-end; }
.comment-pop-box { background: white; width: 100%; border-radius: 16px 16px 0 0; padding: 20px; max-height: 80vh; overflow-y: auto; box-sizing: border-box; }
.pop-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.pop-title { font-size: 14px; color: #666; }
.pop-close { font-size: 20px; color: #999; cursor: pointer; padding: 5px; }
.pop-close:hover { color: #333; }
.pop-textarea textarea { width: 100%; border: none; outline: none; resize: none; font-size: 16px; line-height: 1.6; min-height: 80px; padding: 0; }
.pop-textarea textarea::placeholder { color: #ccc; }
.pop-images { display: flex; flex-wrap: wrap; gap: 8px; margin: 10px 0; }
.pop-image-item { width: 60px; height: 60px; position: relative; }
.pop-image-item img { width: 100%; height: 100%; object-fit: cover; border-radius: 6px; }
.pop-image-item i { position: absolute; top: -4px; right: -4px; background: rgba(0,0,0,0.6); color: white; border-radius: 50%; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; font-size: 10px; cursor: pointer; }
.pop-image-add { width: 60px; height: 60px; border: 1px dashed #ddd; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #ccc; font-size: 18px; cursor: pointer; }
.pop-toolbar { display: flex; justify-content: space-between; align-items: center; padding: 15px 0 0 0; margin-top: 10px; border-top: 1px solid #f0f0f0; overflow: visible; }
.pop-toolbar-left { display: flex; align-items: center; gap: 20px; padding-left: 0; margin-left: 0; }
.pop-toolbar-left i { font-size: 26px; color: #666; cursor: pointer; line-height: 1; }
.pop-toolbar-left i:hover { color: #ff6633; }
.pic-icon { cursor: pointer; flex-shrink: 0; display: block; width: 24px; height: 24px; }
.pic-icon:hover path { fill: #ff6633; }
.rate-section { display: flex; align-items: center; gap: 10px; font-size: 14px; color: #666; }

.view-all { text-align: center; padding: 15px 0; color: #666; font-size: 14px; border-top: 1px solid #f5f5f5; cursor: pointer; }
.no-comments { text-align: center; padding: 20px; color: #999; }

/* Like Box Styles */
.zan-box { display: flex; align-items: center; padding: 12px 15px; gap: 12px; }
.zan-icon { cursor: pointer; display: flex; align-items: center; justify-content: center; }
.zan-list { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.user-icon-mini { width: 24px; height: 24px; border-radius: 50%; overflow: hidden; cursor: pointer; transition: transform 0.2s; }
.user-icon-mini:hover { transform: scale(1.1); }
.user-icon-mini img { width: 100%; height: 100%; object-fit: cover; }
.like-count { font-size: 13px; color: #666; margin-left: 4px; }

/* Override legacy CSS */
.blog-info-box { height: auto !important; }
.empty-state { text-align: center; padding: 100px 0; color: #999; }
.empty-state i { font-size: 60px; margin-bottom: 20px; color: #ddd; }

</style>
