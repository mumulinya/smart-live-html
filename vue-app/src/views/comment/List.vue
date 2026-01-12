<template>
  <div class="comment-list-page" v-loading="loading">
    <div class="header">
      <div class="header-back-btn" @click="goBack"><i class="el-icon-arrow-left"></i></div>
      <div class="header-title">全部评论</div>
      <div style="width: 20px;"></div>
    </div>

    <div class="scroll-container" @scroll="onScroll">
      <!-- Publish Area -->
      <div class="comment-publish">
         <div class="publish-header">
            <div class="publish-avatar"><img :src="user.icon || '/imgs/icons/default-icon.png'"></div>
            <div class="publish-user">{{user.nickName || '我'}}</div>
         </div>
         <div class="publish-content">
            <div class="publish-textarea">
               <textarea v-model="commentText" placeholder="说点什么..." rows="3" maxlength="500"></textarea>
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
               <el-button type="primary" size="small" :disabled="!commentText.trim()" @click="publishComment" round>发布</el-button>
            </div>
         </div>
      </div>

      <!-- List Area -->
      <div class="comments-section">
         <div v-if="comments.length === 0 && !loading" class="empty-state">
            <i class="el-icon-chat-round"></i>
            <p>暂无评论，快来发表第一条评论吧～</p>
         </div>

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
                  {{formatTime(c.createTime)}} · 浏览{{c.viewCount || 0}} · 评论{{c.replyCount || 0}}
               </div>
            </div>
         </div>
         
         <div v-if="noMore" class="no-more">没有更多评论了</div>
      </div>
    </div>

    <!-- Image Preview -->
    <el-image-viewer v-if="showImagePreview" :url-list="previewImages" :initial-index="currentPreviewIndex" @close="closeImagePreview" hide-on-click-modal />
  </div>
</template>

<script>
import { getComments, addComment } from '@/api/interaction';
import { getCurrentUser } from '@/api/user';
import { uploadFile } from '@/api/common';
import { ElImageViewer } from 'element-plus';

export default {
  name: 'CommentList',
  components: { ElImageViewer },
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
      currentPreviewIndex: 0
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
          this.user = res || {};
          if(this.user.icon) this.user.icon = this.$fileURL + this.user.icon;
       }).catch(()=>{});
    },
     loadComments() {
       if(this.loading || this.noMore) return;
       this.loading = true;
       getComments({ sourceId: this.sourceId, sourceType: this.sourceType, current: this.current }).then(res => {
          // Fix: Handle wrapped response
          let list = [];
          if (Array.isArray(res)) list = res;
          else if (res && Array.isArray(res.list)) list = res.list;
          else if (res && Array.isArray(res.data)) list = res.data;
          else if (res && res.data && Array.isArray(res.data.list)) list = res.data.list;
          else if (res && res.data && Array.isArray(res.data.records)) list = res.data.records;

          if(list.length === 0) {
             this.noMore = true;
          } else {
             this.comments = [...this.comments, ...list.filter(c => !c.isAIGenerated).map(this.processComment)];
             this.current++;
          }
       }).finally(() => this.loading = false);
    },
    processComment(c) {
       return {
          ...c,
          userIcon: c.userIcon ? this.$fileURL + c.userIcon : '',
          images: c.images ? c.images.split(',').map(i => this.$fileURL + i) : []
       };
    },
    
    // Publish
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
       if(!this.user.id) return this.$router.push('/user/login');
       
       const data = {
           content: this.commentText,
           rating: this.commentRating,
           sourceId: this.sourceId,
           sourceType: this.sourceType, // Ensure query param passed correctly
           userId: this.user.id,
           images: this.selectedImages.map(i => i.rawUrl).join(',')
       };
       addComment(data).then(() => {
           this.$message.success("评价发布成功");
           this.commentText = '';
           this.selectedImages = [];
           // Reload
           this.comments = [];
           this.current = 1;
           this.noMore = false;
           this.loadComments();
       });
    },
    
    // Preview
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
    }
  }
}
</script>

<style scoped>
.comment-list-page { height: 100vh; display: flex; flex-direction: column; background: #f8f8f8; }
.header { height: 50px; background: white; display: flex; align-items: center; padding: 0 15px; border-bottom: 1px solid #eee; }
.header-title { flex: 1; text-align: center; font-weight: bold; }
.scroll-container { flex: 1; overflow-y: auto; }

/* Publish Area */
.comment-publish { background: white; padding: 15px; margin-bottom: 10px; }
.publish-header { display: flex; align-items: center; margin-bottom: 10px; }
.publish-avatar img { width: 32px; height: 32px; border-radius: 50%; margin-right: 10px; }
.publish-user { font-weight: bold; font-size: 14px; }
.publish-textarea { position: relative; margin-bottom: 10px; }
.publish-textarea textarea { width: 100%; border: 1px solid #eee; padding: 10px; border-radius: 8px; resize: none; background: #fafafa; }
.text-count { position: absolute; bottom: 5px; right: 10px; font-size: 12px; color: #999; }
.publish-images { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 10px; }
.image-upload { width: 70px; height: 70px; border: 1px dashed #ddd; display: flex; align-items: center; justify-content: center; color: #999; font-size: 20px; }
.image-preview-mini { width: 70px; height: 70px; position: relative; }
.image-preview-mini img { width: 100%; height: 100%; object-fit: cover; border-radius: 4px; }
.image-remove { position: absolute; top: -5px; right: -5px; background: rgba(0,0,0,0.5); color: white; border-radius: 50%; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; font-size: 12px; cursor: pointer; }

.publish-actions { display: flex; justify-content: space-between; align-items: center; }
.rate-section { display: flex; align-items: center; gap: 10px; font-size: 14px; color: #666; }

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
.comment-stats { font-size: 12px; color: #999; }

.empty-state { text-align: center; padding: 50px 0; color: #999; }
.empty-state i { font-size: 48px; margin-bottom: 10px; color: #ddd; }
.no-more { text-align: center; padding: 15px; color: #999; font-size: 12px; }
</style>
