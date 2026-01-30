<template>
  <PageLayout :loading="loading" skeleton-type="list" class="comment-list-page">
    <div class="header">
      <div class="header-back-btn" @click="goBack"><i class="el-icon-arrow-left"></i></div>
      <div class="header-title">全部评论</div>
      <div style="width: 20px;"></div>
    </div>

    <div class="scroll-container" @scroll="onScroll">

      <!-- List Area -->
      <div class="comments-section">
         <div v-if="comments.length === 0 && !loading" class="empty-state">
            <i class="el-icon-chat-round"></i>
            <p>暂无评论，快来发表第一条评论吧～</p>
         </div>

         <div class="comment-box" v-for="c in comments" :key="c.id">
            <div class="comment-icon" @click.stop="toUserDetail(c.userId)">
               <img :src="c.userIcon || '/imgs/icons/default-icon.png'">
            </div>
            <div class="comment-info">
               <div class="comment-user" @click.stop="toUserDetail(c.userId)">
                  {{c.nickName || '匿名用户'}} <span>Lv{{c.userLevel || 1}}</span>
               </div>
               <div class="comment-rating" v-if="sourceType != 3">
                  <el-rate :model-value="c.rating" disabled size="small"></el-rate>
                  <span class="score">{{c.rating}}分</span>
               </div>
               <div class="comment-content">
                  <span v-if="c.replyToName" class="reply-target">回复 @{{c.replyToName}}:</span>
                  {{c.content}}
               </div>
               <div class="comment-images" v-if="c.images && c.images.length">
                  <img v-for="(img, idx) in c.images" :key="idx" :src="img" @click="previewImage(c.images, idx)">
               </div>
                <div class="comment-interactions">
                   <span class="comment-time">{{formatTime(c.createTime)}}</span>
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
                             <img :src="r.userIcon || r.icon || '/imgs/icons/default-icon.png'" alt="">
                          </div>
                          <div class="reply-main">
                             <div class="reply-header">
                                <span class="reply-user" @click.stop="toUserDetail(r.userId)">{{r.nickName || '匿名用户'}}</span>
                                <!-- Remove time from here if consistent with others, or keep formatTime -->
                             </div>
                             <div class="reply-content">
                                  <span v-if="r.replyToName" class="reply-target">回复 @{{r.replyToName}}:</span>
                                  {{r.content}}
                             </div>
                             <div class="comment-images" v-if="r.images && r.images.length">
                                <img v-for="(img, idx) in r.images" :key="idx" :src="img" @click.stop="previewImage(r.images, idx)">
                             </div>
                             <div class="reply-actions">
                                  <span class="reply-time" style="margin-right: 10px;">{{formatTime(r.createTime)}}</span>
                                  
                                  <div class="c-action-btn" @click.stop="handleCommentLike(r)">
                                     <svg viewBox="0 0 24 24" width="16" height="16">
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
         
         <div v-if="noMore" class="no-more">没有更多评论了</div>
      </div>
    </div>

    <!-- Image Preview -->
    <el-image-viewer v-if="showImagePreview" :url-list="previewImages" :initial-index="currentPreviewIndex" @close="closeImagePreview" hide-on-click-modal />
    
    <!-- Bottom Fixed Input Bar -->
    <div class="bottom-input-bar" @click="openCommentModal">
       <div class="input-placeholder">发条评论，和大家一起讨论</div>
       <div class="bar-icons">
          <i class="el-icon-picture-outline"></i>
       </div>
    </div>
    
    <!-- Comment Pop Modal -->
    <div class="comment-pop-overlay" v-if="showCommentPublish" @click="closeCommentModal">
       <div class="comment-pop-box" @click.stop>
          <div class="pop-header">
             <span class="pop-title">{{ replyToComment ? ('回复 @' + replyToComment.nickName) : '' }}</span>
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
                <div class="pop-rating-inline" v-if="!replyToComment && sourceType == 2">
                     <el-rate v-model="commentRating" :colors="['#99A9BF', '#F7BA2A', '#FF9900']"></el-rate>
                </div>
             </div>
             <el-button type="primary" size="small" :disabled="!commentText.trim()" @click="publishComment">发送</el-button>
          </div>
       </div>
    </div>
  </PageLayout>
</template>

<script>
import { getComments, addComment, likeComment, removeComment } from '@/api/interaction';
import { getReviewList } from '@/api/reviews';
import { getCurrentUser } from '@/api/user';
import { uploadFile } from '@/api/common';
import { showConfirmDialog } from 'vant';
import { ElImageViewer } from 'element-plus';
import '@/assets/css/blog-detail.css'; // Reuse styles

import PageLayout from '@/components/PageLayout/PageLayout.vue';

export default {
  name: 'CommentList',
  components: { ElImageViewer, PageLayout },
  data() {
    return {
      sourceId: null,
      sourceType: null,
      user: {},
      comments: [],
      current: 1,
      loading: false,
      noMore: false,
      
      commentText: '',
      commentRating: 5,
      selectedImages: [],
      
      showImagePreview: false,
      previewImages: [],
      currentPreviewIndex: 0,
      
      // Reply
      showCommentPublish: false,
      replyToComment: null
    }
  },
  created() {
    const { id, type } = this.$route.query;
    this.sourceId = id;
    this.sourceType = type || 3; // Default to blog? Or check logic.
    // 1: User?, 2: Shop, 3: Blog. usually.
    
    this.queryUser();
    if(this.sourceId) this.loadComments();
  },
  methods: {
    goBack() { this.$router.go(-1); },
    formatTime(time) {
        if(!time) return '';
        const d = new Date(time);
        return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()} ${d.getHours()}:${d.getMinutes()}`;
    },
    queryUser() {
       getCurrentUser().then(res => {
          let u = res.data || res;
          if(u && u.data) u = u.data;
          this.user = u || {};
          if(this.user.icon) this.user.icon = this.$fileURL + this.user.icon;
       }).catch(()=>{});
    },
     loadComments() {
       if(this.loading || this.noMore) return;
       this.loading = true;
       const api = this.sourceType == 2 ? getReviewList : getComments;
       api({ sourceId: this.sourceId, sourceType: this.sourceType, current: this.current }).then(res => {
          let list = [];
          if (Array.isArray(res)) list = res;
          else if (res && Array.isArray(res.list)) list = res.list;
          else if (res && Array.isArray(res.data)) list = res.data;
          else if (res && res.data && Array.isArray(res.data.list)) list = res.data.list;
          else if (res && res.data && Array.isArray(res.data.records)) list = res.data.records;

          if(!list || list.length === 0) {
             this.noMore = true;
          } else {
             const newItems = list.filter(c => !c.isAIGenerated).map(c => ({
                 ...c,
                 userIcon: c.userIcon ? (c.userIcon.startsWith('http') ? c.userIcon : this.$fileURL + (c.userIcon.startsWith('/')?'':'/') + c.userIcon) : '',
                 images: c.images ? c.images.split(',').map(i => i.startsWith('http') ? i : this.$fileURL + (i.startsWith('/')?'':'/') + i) : [],
                 // Reply Improvements
                 comments: c.replyCount || c.comments || c.childCount || 0,
                 showReplies: false,
                 replies: [],
                 replyPage: 1
             }));
             
             const roots = newItems.filter(c => !c.answerId || c.answerId === 0 || c.answerId === '0');
             
             if (this.current === 1) {
                 this.comments = roots;
             } else {
                 this.comments = [...this.comments, ...roots];
             }
             
             // Prevent infinite scroll if returned less than page size (assuming 10)
             if (list.length < 10) {
                 this.noMore = true;
             } else {
                 this.current++;
             }
          }
       }).finally(() => this.loading = false);
    },
    
    toggleReplies(comment) {
        if (!comment.showReplies) {
            // Expand
            comment.showReplies = true;
            if (!comment.replies || comment.replies.length === 0) {
                 comment.replyPage = 1;
                 this.fetchReplies(comment);
            }
        } else {
            // Already expanded
            if (comment.replies.length < comment.comments) {
                 // Load More
                 comment.replyPage = (comment.replyPage || 1) + 1;
                 this.fetchReplies(comment);
            } else {
                 // Collapse
                 comment.showReplies = false;
            }
        }
    },
    
    fetchReplies(comment) {
        getComments({ 
            sourceId: comment.id, 
            sourceType: 5, 
            current: comment.replyPage || 1, 
            size: 10 
        }).then(res => {
            let list = [];
            if (Array.isArray(res)) list = res;
            else if (res && Array.isArray(res.data)) list = res.data;
            else if (res && res.data && Array.isArray(res.data.records)) list = res.data.records;
            
            if (list) {
                const newReplies = list.map(r => ({
                    ...r,
                    userIcon: r.userIcon ? (r.userIcon.startsWith('http') ? r.userIcon : this.$fileURL + r.userIcon) : '',
                    images: r.images ? r.images.split(',').filter(x=>x).map(i => i.startsWith('http') ? i : this.$fileURL + i) : [],
                    liked: r.liked || 0,
                    isLike: r.isLike || false
                }));
                
                if (comment.replyPage === 1) {
                    comment.replies = newReplies;
                } else {
                    comment.replies = [...comment.replies, ...newReplies];
                }
                
                // Count Correction Logic
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

    // Publish
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
           
           // Strip the fileURL prefix
           const filePrefix = this.$fileURL || '';
           if (path.startsWith(filePrefix)) {
             path = path.substring(filePrefix.length);
           }
           if (path.startsWith('http')) {
             try {
                const urlObj = new URL(path);
                path = urlObj.pathname;
             } catch(e) {
                if(path.includes('/smart-live')) path = path.split('/smart-live')[1];
             }
           }
           
           this.selectedImages.push({ file, url: this.$fileURL + path, rawUrl: path });
        }
    },
    removeImage(idx) {
        this.selectedImages.splice(idx, 1);
    },
    publishComment() {
       if(!this.user.id) return this.$router.push('/user/login');
       if(!this.commentText.trim()) return this.$message.error('请输入评价内容');
       
       const data = {
           content: this.commentText,
           rating: this.commentRating,
           sourceId: this.sourceId,
           sourceType: this.sourceType,
           userId: this.user.id,
           parentId: 0,
           answerId: 0,
           images: this.selectedImages.map(i => i.rawUrl).join(',')
       };

       if(this.replyToComment) {
            data.sourceType = 5;
            data.parentId = this.sourceId; // The main resource (blog/shop)
            data.answerId = this.replyToComment.id;
            data.sourceId = this.replyToComment.id; // Use reply id as source
            delete data.rating;
       }

       addComment(data).then(() => {
           this.$message.success("发布成功");
           
           // Clear form data
           this.commentText = '';
           this.selectedImages = [];
           this.commentRating = 5;
           this.closeCommentModal();
           
           // Reload
           this.comments = [];
           this.current = 1;
           this.noMore = false;
           this.loadComments();
       }); 
    },
    handleCommentLike(c) {
         if(!this.user.id) return this.$router.push('/user/login');
         const oldState = c.isLike;
         c.isLike = !c.isLike;
         c.liked = c.isLike ? (c.liked + 1) : (c.liked - 1);
         
         likeComment(c.id).catch(() => {
            c.isLike = oldState;
            c.liked = c.isLike ? (c.liked + 1) : (c.liked - 1);
         });
    },
    handleCommentReply(c) {
         if(!this.user.id) return this.$router.push('/user/login');
         this.replyToComment = c;
         this.commentText = '';
         this.showCommentPublish = true;
    },
    handleCommentDelete(c) {
        showConfirmDialog({
           title: '提示',
           message: '确定删除该评论吗？',
           confirmButtonText: '确认',
           cancelButtonText: '取消',
        }).then(() => {
           removeComment({ id: c.id, sourceType: c.sourceType, sourceId: c.sourceId }).then(() => {
               this.$message.success('删除成功');
               this.comments = [];
               this.current = 1;
               this.loading = false;
               this.noMore = false;
               this.loadComments();
           });
        }).catch(() => {});
    },
    openCommentModal() {
        if(!this.user.id) {
           return this.$router.push('/user/login');
        }
        this.replyToComment = null;
        this.showCommentPublish = true;
        this.$nextTick(() => {
           if(this.$refs.commentTextarea) {
              this.$refs.commentTextarea.focus();
           }
        });
    },
    closeCommentModal() {
        this.showCommentPublish = false;
        this.commentText = '';
        this.selectedImages = [];
        this.replyToComment = null;
    },
    previewImage(list, idx) {
       this.previewImages = list;
       this.currentPreviewIndex = idx;
       this.showImagePreview = true;
    },
    closeImagePreview() {
       this.showImagePreview = false;
    },
    
    onScroll(e) {
        const { scrollTop, clientHeight, scrollHeight } = e.target;
        if(scrollTop + clientHeight >= scrollHeight - 50) {
           this.loadComments();
        }
    },
    toUserDetail(userId) {
       if(!userId) return;
        if(this.user && String(this.user.id) === String(userId)) {
           this.$router.push('/user/profile');
        } else {
           this.$router.push(`/user/profile/${userId}`);
        }
    }

  }
}
</script>

<style scoped>
.comment-list-page { height: 100vh; display: flex; flex-direction: column; background: #f8f8f8; overflow-x: hidden; }
.header { height: 50px; background: white; display: flex; align-items: center; padding: 0 15px; border-bottom: 1px solid #eee; position: fixed; top: 0; left: 0; right: 0; z-index: 99; }
.header-title { flex: 1; text-align: center; font-weight: bold; }
.scroll-container { flex: 1; overflow-y: auto; margin-top: 50px; }

/* Publish Area */
.comment-publish { background: white; padding: 12px 15px; }
.publish-input-row { display: flex; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 10px; }
.publish-input-row textarea { flex: 1; border: none; outline: none; resize: none; font-size: 15px; line-height: 1.5; background: transparent; min-height: 24px; }
.publish-input-row textarea::placeholder { color: #ccc; }
.char-count { font-size: 13px; color: #ccc; white-space: nowrap; margin-left: 10px; }
.publish-images { display: flex; flex-wrap: wrap; gap: 8px; padding: 10px 0; }
.image-preview-mini { width: 56px; height: 56px; position: relative; }
.image-preview-mini img { width: 100%; height: 100%; object-fit: cover; border-radius: 6px; }
.image-remove { position: absolute; top: -4px; right: -4px; background: rgba(0,0,0,0.6); color: white; border-radius: 50%; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; font-size: 10px; cursor: pointer; }
.image-add-btn { width: 56px; height: 56px; border: 1px dashed #ddd; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #ccc; font-size: 18px; cursor: pointer; }
.publish-toolbar { display: flex; justify-content: space-between; align-items: center; padding-top: 10px; }
.toolbar-left { display: flex; align-items: center; }
.toolbar-icon { font-size: 20px; color: #999; cursor: pointer; }
.toolbar-icon:hover { color: #333; }
/* List */
.comment-box { display: flex; padding: 15px; background: white; border-bottom: 1px solid #f1f1f1; }
.comment-icon { width: 36px; height: 36px; border-radius: 50%; overflow: hidden; margin-right: 12px; flex-shrink: 0; }
.comment-icon img { width: 100%; height: 100%; object-fit: cover; }
.comment-info { flex: 1; }
.comment-user { font-weight: 500; font-size: 14px; margin-bottom: 4px; }
.comment-user span { font-size: 10px; color: #F63; background: #fff5f5; padding: 1px 4px; border-radius: 4px; margin-left: 5px; }
.comment-rating { display: flex; align-items: center; margin-bottom: 5px; }
.score { color: #F63; font-size: 12px; margin-left: 5px; }
.comment-content { font-size: 14px; line-height: 1.5; margin-bottom: 8px; }
.comment-images { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 8px; }
.comment-images img { width: 80px; height: 80px; object-fit: cover; border-radius: 4px; cursor: pointer; }
.comment-images img { width: 80px; height: 80px; object-fit: cover; border-radius: 4px; cursor: pointer; }

/* Interactions */
.comment-interactions { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; font-size: 12px; color: #999; }
.comment-actions { display: flex; gap: 15px; }
.c-action-btn { display: flex; align-items: center; gap: 3px; cursor: pointer; }
.c-action-btn i { font-size: 14px; }
.delete-btn { color: #ff4d4f; }

.empty-state { text-align: center; padding: 50px 0; color: #999; }
.empty-state i { font-size: 48px; margin-bottom: 10px; color: #ddd; }
.no-more { text-align: center; padding: 15px; color: #999; font-size: 12px; }

/* Bottom Fixed Input Bar */
.bottom-input-bar { position: fixed; bottom: 0; left: 0; right: 0; background: white; padding: 12px 15px; display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #eee; z-index: 100; }
.input-placeholder { flex: 1; color: #999; font-size: 14px; background: #f5f5f5; padding: 10px 15px; border-radius: 20px; }
.bar-icons { display: flex; align-items: center; gap: 15px; margin-left: 15px; }
.bar-icons i { font-size: 22px; color: #666; }

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
.pop-toolbar-left { display: flex; align-items: center; gap: 20px; padding-left: 0; margin-left: 0; flex-wrap: wrap; }
.pop-toolbar-left i { font-size: 26px; color: #666; cursor: pointer; line-height: 1; }
.pop-toolbar-left i:hover { color: #ff6633; }
.pop-rating-inline { margin-left: 10px; display: flex; align-items: center; }
.pic-icon { cursor: pointer; flex-shrink: 0; display: block; width: 24px; height: 24px; }
.pic-icon:hover path { fill: #ff6633; }

/* Adjust scroll container to account for bottom bar */
.scroll-container { padding-bottom: 80px !important; }
</style>
