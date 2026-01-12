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
          <div @click="addLike">
              <svg class="icon" viewBox="0 0 1024 1024" width="24" height="24">
                  <path d="M160 944c0 8.8-7.2 16-16 16h-32c-26.5 0-48-21.5-48-48V528c0-26.5 21.5-48 48-48h32c8.8 0 16 7.2 16 16v448zM96 416c-53 0-96 43-96 96v416c0 53 43 96 96 96h96c17.7 0 32-14.3 32-32V448c0-17.7-14.3-32-32-32H96zM505.6 64c16.2 0 26.4 8.7 31 13.9 4.6 5.2 12.1 16.3 10.3 32.4l-23.5 203.4c-4.9 42.2 8.6 84.6 36.8 116.4 28.3 31.7 68.9 49.9 111.4 49.9h271.2c6.6 0 10.8 3.3 13.2 6.1s5 7.5 4 14l-48 303.4c-6.9 43.6-29.1 83.4-62.7 112C815.8 944.2 773 960 728.9 960h-317c-33.1 0-59.9-26.8-59.9-59.9v-455c0-6.1 1.7-12 5-17.1 69.5-109 106.4-234.2 107-364h41.6z m0-64h-44.9C427.2 0 400 27.2 400 60.7c0 127.1-39.1 251.2-112 355.3v484.1c0 68.4 55.5 123.9 123.9 123.9h317c122.7 0 227.2-89.3 246.3-210.5l47.9-303.4c7.8-49.4-30.4-94.1-80.4-94.1H671.6c-50.9 0-90.5-44.4-84.6-95l23.5-203.4C617.7 55 568.7 0 505.6 0z" :fill="blog.isLike ? '#ff6633' : '#82848a'"></path>
              </svg>
          </div>
          <div class="zan-list">
             <div class="user-icon-mini" v-for="u in likes" :key="u.id">
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
                <div class="comment-icon"><img :src="c.userIcon || '/imgs/icons/default-icon.png'"></div>
                <div class="comment-info">
                   <div class="comment-user">{{c.nickName || '匿名用户'}} <span>Lv{{c.userLevel || 1}}</span></div>
                   <div class="comment-rating">
                      <el-rate :model-value="c.rating" disabled size="small"></el-rate>
                      <span class="score">{{c.rating}}分</span>
                   </div>
                   <div class="comment-content">{{c.content}}</div>
                   <div class="comment-images" v-if="c.images && c.images.length">
                      <img v-for="(img, idx) in c.images" :key="idx" :src="img" @click="previewImage(c.images, idx)">
                   </div>
                   <div class="comment-stats">
                      {{formatDate(c.createTime)}} · 浏览{{c.viewCount || 0}} · {{c.liked || 0}}点赞
                   </div>
                </div>
             </div>
             
             <!-- View All Link -->
             <div class="view-all" @click="viewAllComments">
                查看全部{{blog.comments}}条评价 <i class="el-icon-arrow-right"></i>
             </div>
          </div>
          <div v-else class="no-comments">暂无评论，快来发表第一条评论吧～</div>
       </div>
       </div> <!-- End of v-if="blog.id" -->
    </div>

    <!-- Footer -->
    <div class="foot-bar">
       <div class="foot-item" @click="addLike" :class="{active: blog.isLike}">
          <i :class="blog.isLike ? 'el-icon-thumb' : 'el-icon-thumb'"></i> <!-- Element Plus icon naming might vary, assuming thumb -->
          <span>{{blog.isLike ? '已点赞' : '点赞'}}</span>
       </div>
       <div class="foot-item action-big" @click="checkLogin">
          <i class="el-icon-edit-outline"></i>
          <span>写评价</span>
       </div>
    </div>

    <!-- Comment Modal -->
    <div class="comment-modal" v-if="showCommentPublish" @click="closeCommentModal">
       <div class="comment-modal-content" @click.stop>
          <div class="comment-publish">
             <div class="publish-header">
                <div class="publish-avatar"><img :src="user.icon || '/imgs/icons/default-icon.png'"></div>
                <div class="publish-user">{{user.nickName || '我'}}</div>
                <div class="close-btn" @click="closeCommentModal"><i class="el-icon-close"></i></div>
             </div>
             <div class="publish-content">
                <div class="publish-textarea">
                   <textarea v-model="commentText" placeholder="说点什么..." rows="4" maxlength="500"></textarea>
                   <div class="text-count">{{commentText.length}}/500</div>
                </div>
                <div class="publish-images">
                   <div class="image-upload" @click="$refs.imageInput.click()" v-if="selectedImages.length < 9">
                      <i class="el-icon-plus"></i>
                      <input type="file" ref="imageInput" multiple accept="image/*" @change="handleImageUpload" style="display:none">
                   </div>
                   <div class="image-preview-mini" v-for="(img, idx) in selectedImages" :key="idx">
                      <img :src="img.url">
                      <div class="image-remove" @click.stop="removeImage(idx)"><i class="el-icon-close"></i></div>
                   </div>
                </div>
                <div class="publish-actions">
                   <div class="rate-section">
                      <span>打分</span>
                      <el-rate v-model="commentRating" :colors="['#99A9BF', '#F7BA2A', '#FF9900']"></el-rate>
                   </div>
                   <div class="btns">
                      <el-button size="small" @click="closeCommentModal">取消</el-button>
                      <el-button type="primary" size="small" :disabled="!commentText.trim()" @click="publishComment">发布</el-button>
                   </div>
                </div>
             </div>
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
import { getLikeList, isFollowed, followUser, likeBlog, getComments, addComment } from '@/api/interaction';
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
       currentPreviewIndex: 0
    }
  },
  created() {
     const id = this.$route.query.id;
     if(id) {
        this.pageLoading = true;
        this.queryBlogById(id).finally(() => this.pageLoading = false);
        this.loadComments(id);
        this.queryLoginUser();
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
     toShopDetail() {
        if(this.shop.id) this.$router.push({ path: '/shop/detail', query: { id: this.shop.id } });
     },
     formatDate(time) {
        if(!time) return '';
        const d = new Date(time);
        return `${d.getFullYear()}.${d.getMonth()+1}.${d.getDate()}`;
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
            this.comments = processedList.slice(0, 3);
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
     },
     
     // Comment Publish
     async handleImageUpload(e) {
        const files = e.target.files;
        for(let file of files) {
           const formData = new FormData();
           formData.append("file", file);
           const url = await uploadFile(formData);
           this.selectedImages.push({ file, url: this.$fileURL + url, rawUrl: url });
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
           sourceType: 3,
           userId: this.user.id,
           parentId: 0,
           answerId: 0,
           images: this.selectedImages.map(i => i.rawUrl).join(',')
        };
        addComment(data).then(() => {
           this.$message.success("评价发布成功");
           this.closeCommentModal();
           this.loadComments(this.blog.id);
           this.queryBlogById(this.blog.id);
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
.carousel-img { width: 100%; height: 100%; object-fit: cover; }

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

/* Comment Modal */
.comment-modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 200; display: flex; align-items: flex-end; }
.comment-modal-content { background: white; width: 100%; border-radius: 16px 16px 0 0; padding: 20px; }
.publish-header { display: flex; align-items: center; margin-bottom: 15px; }
.publish-avatar img { width: 30px; height: 30px; border-radius: 50%; margin-right: 10px; }
.publish-user { flex: 1; font-weight: bold; }
.close-btn { font-size: 20px; color: #999; }
.publish-textarea textarea { width: 100%; border: 1px solid #eee; padding: 10px; border-radius: 8px; resize: none; background: #f9f9f9; }
.text-count { text-align: right; color: #999; font-size: 12px; margin-top: 5px; }
.publish-images { display: flex; flex-wrap: wrap; gap: 10px; margin: 10px 0; }
.image-upload { width: 70px; height: 70px; border: 1px dashed #ddd; display: flex; align-items: center; justify-content: center; color: #ddd; font-size: 20px; }
.image-preview-mini { width: 70px; height: 70px; position: relative; }
.image-preview-mini img { width: 100%; height: 100%; object-fit: cover; border-radius: 4px; }
.image-remove { position: absolute; top: -5px; right: -5px; background: rgba(0,0,0,0.5); color: white; border-radius: 50%; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; font-size: 12px; }
.publish-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 15px; }
.rate-section { display: flex; align-items: center; gap: 10px; font-size: 14px; color: #666; }

.view-all { text-align: center; padding: 15px 0; color: #666; font-size: 14px; border-top: 1px solid #f5f5f5; cursor: pointer; }
.no-comments { text-align: center; padding: 20px; color: #999; }

/* Override legacy CSS */
.blog-info-box { height: auto !important; }
.empty-state { text-align: center; padding: 100px 0; color: #999; }
.empty-state i { font-size: 60px; margin-bottom: 20px; color: #ddd; }

</style>
