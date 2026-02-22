<template>
  <div class="review-publish-page">
    <!-- Header -->
    <div class="custom-nav">
      <div class="nav-left" @click="goBack">取消</div>
      <div class="nav-title">{{ shopName || '写评价' }}</div>
      <div class="nav-right" @click="saveDraft">
        <span style="font-size: 14px; color: #666;">存草稿</span>
      </div>
    </div>

    <!-- Edit Notice -->
    <div class="edit-notice" v-if="isEdit && createTime">
      正在对{{" " + formatTime(createTime) + " "}}的评价重新编辑，发表后将覆盖原评价
    </div>

    <div class="scroll-content">
      <!-- Overall Rating Card -->
      <div class="card overall-card">
        <div class="mood-labels">
            <div 
                v-for="(label, index) in overallLabels" 
                :key="index"
                class="mood-item"
                :class="{ active: overallRating === index + 1 }"
            >
                <div class="mood-icon">{{ moodIcons[index] }}</div>
                <div class="mood-text">{{ label }}</div>
            </div>
        </div>
        <div class="main-stars">
            <van-rate 
                v-model="overallRating" 
                :size="36" 
                color="#ff5622" 
                void-icon="star" 
                void-color="#eee"
                gutter="15px"
            />
        </div>
      </div>

      <!-- Detail Ratings Card -->
      <div class="card detail-card">
        <div class="detail-row">
            <span class="label">口味</span>
            <van-rate v-model="tasteScore" :size="20" color="#ff5622" void-icon="star" void-color="#eee" />
            <span class="score-text">{{ getScoreText(tasteScore) }}</span>
        </div>
        <div class="detail-row">
            <span class="label">环境</span>
            <van-rate v-model="envScore" :size="20" color="#ff5622" void-icon="star" void-color="#eee" />
            <span class="score-text">{{ getScoreText(envScore) }}</span>
        </div>
        <div class="detail-row">
            <span class="label">服务</span>
            <van-rate v-model="serviceScore" :size="20" color="#ff5622" void-icon="star" void-color="#eee" />
            <span class="score-text">{{ getScoreText(serviceScore) }}</span>
        </div>
        <div class="modify-tip">
            修改打分后，所有人都可以看到打分修改记录 <van-icon name="question-o" />
        </div>
      </div>

      <!-- Editor Card -->
      <div class="card editor-card">
        <textarea 
            v-model="content" 
            class="review-textarea" 
            placeholder="口味：&#10;服务：&#10;性价比：&#10;环境："
            rows="8"
        ></textarea>
        <div class="word-count">已写{{ content.length }}个字</div>

        <div class="media-section">
            <div class="media-list">
                <div class="media-item" v-for="(file, index) in fileList" :key="index">
                    <img :src="file.url" v-if="isImage(file.path)" />
                    <video :src="file.url" v-else></video>
                    <div class="delete-btn" @click="removeFile(index)">
                        <van-icon name="cross" size="10" color="#fff"/>
                    </div>
                </div>
            </div>
            
            <div class="upload-buttons" v-if="fileList.length < 9">
                <div class="upload-btn photo-btn" @click="triggerUpload('image')">
                    <van-icon name="photograph" />
                    <span>上传照片</span>
                </div>
                <div class="upload-btn video-btn" @click="triggerUpload('video')">
                    <van-icon name="video-o" />
                    <span>上传视频</span>
                </div>
            </div>
            
            <!-- Hidden Inputs -->
            <input type="file" ref="imageInput" accept="image/*" multiple style="display: none" @change="handleFileSelect($event, 'image')">
            <input type="file" ref="videoInput" accept="video/*" style="display: none" @change="handleFileSelect($event, 'video')">
        </div>

        <div class="anonymous-section" @click="isAnonymous = !isAnonymous">
            <div class="check-circle" :class="{ checked: isAnonymous }">
                <van-icon name="success" v-if="isAnonymous" />
            </div>
            <span class="anon-text">匿名评价</span>
            <span class="anon-tip">隐藏你的头像和昵称</span>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer-action">
        <div class="draft-btn" @click="saveDraft">
            <van-icon name="orders-o" size="20" />
            <span>存草稿</span>
        </div>
        <div class="publish-btn" :class="{ disabled: !canSubmit }" @click="submitReview">
            发布
        </div>
    </div>

  </div>

    <!-- iOS Exit Confirmation Dialog -->
    <div class="ios-mask" v-if="showExitDialog" @click.self="showExitDialog = false">
        <div class="ios-alert">
            <div class="ios-alert-content">
                <div class="ios-alert-title">放弃编辑？</div>
                <div class="ios-alert-msg">确定要放弃编辑吗？<br>已输入的内容将会丢失</div>
            </div>
            <div class="ios-alert-footer">
                <div class="ios-btn-cancel" @click="showExitDialog = false">继续编辑</div>
                <div class="ios-btn-confirm" @click="confirmExit">放弃</div>
            </div>
    </div>

  </div>
</template>

<script>
import { addReview, updateReview, getReview } from '@/api/reviews';
import { getShopDetail } from '@/api/shop';
import { getOrderDetail } from '@/api/order';
import { uploadFile } from '@/api/common';

import { fileURL } from '@/utils/request';
import { getCurrentUser } from '@/api/user';

export default {
  name: 'ReviewPublish',
  data() {
    return {
      isEdit: false,
      id: null,
      shopId: null,
      orderId: null,
      voucherId: null,
      sourceId: null,
      sourceType: 2, // Default to shop

      shopName: '',
      createTime: null,
      userId: null,

      overallRating: 5,
      tasteScore: 5,
      envScore: 5,
      serviceScore: 5,
      
      content: '',
      fileList: [],
      isAnonymous: false,
      
      submitting: false,
      fileURL: fileURL,
      
      overallLabels: ['很糟糕', '较差', '一般', '还可以', '很棒'],
      moodIcons: ['😖', '😞', '😐', '🙂', '😍'],
      showExitDialog: false
    };
  },
  computed: {
    canSubmit() {
        return this.overallRating > 0 && this.content.trim().length > 0;
    }
  },
  created() {
      const { edit, id, shopId, orderId, voucherId, sourceId, sourceType } = this.$route.query;
      this.shopId = shopId;
      this.orderId = orderId;
      this.voucherId = voucherId;
      this.sourceId = sourceId;

      // Determine implicit source type
      if (sourceType) {
          this.sourceType = Number(sourceType);
      } else if (this.voucherId || this.orderId) {
          this.sourceType = 4;
      } else {
          this.sourceType = 2;
      }

      if (edit && id) {
          // 从草稿箱编辑
          this.isEdit = true;
          this.id = id;
          this.loadReview(id);
      } else if (edit === 'true' && id) {
          // 从草稿箱编辑（兼容写法）
          this.isEdit = true;
          this.id = id;
          this.loadReview(id);
      } else if (orderId) {
          this.loadOrder(orderId);
      } else if (shopId) {
          this.loadShop(shopId);
      }
      this.getUserInfo();
  },
  methods: {
      goBack() {
          // Check if there's any content
          if (this.content || this.fileList.length > 0) {
              this.showExitDialog = true;
          } else {
              this.$router.go(-1);
          }
      },
      confirmExit() {
          this.showExitDialog = false;
          this.$router.go(-1);
      },
      formatTime(isoStr) {
          if (!isoStr) return '';
          const date = new Date(isoStr);
          return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
      },
      getScoreText(score) {
          const texts = ['很糟糕', '较差', '一般', '还可以', '很棒', '超预期'];
          if (score >= 5) return '超预期';
          if (score >= 4) return '很棒';
          if (score >= 3) return '一般';
          return texts[Math.max(0, score - 1)] || '';
      },
      loadShop(shopId) {
          getShopDetail(shopId).then(res => {
             const data = res.data || res;
             if(data) this.shopName = data.name;
          });
      },
      loadOrder(orderId) {
          getOrderDetail(orderId).then(res => {
              const data = res.data || res;
              if (data) {
                  // Use sourceId from order if available
                  if (data.sourceId) this.sourceId = data.sourceId;

                  // Use sourceType from order if available, otherwise default to 4 (if not already set via param)
                  if (data.type) {
                      // Assuming order type might correspond to review source type logic in future
                      // For now, if order exists, we already default to 4 in created()
                      // But if we want to be dynamic:
                      // this.sourceType = data.type;
                  }

                  if (data.shopId) {
                      this.shopId = data.shopId;
                      this.loadShop(this.shopId);
                  }
              }
          });
      },
      loadReview(id) {
          getReview(id).then(res => {
              const data = res.data || res;
              if (data) {
                  this.content = data.content || '';
                  this.overallRating = data.score || 5;
                  this.tasteScore = data.tasteScore || 5;
                  this.envScore = data.envScore || 5;
                  this.serviceScore = data.serviceScore || 5;

                  this.shopId = data.shopId || data.sourceId;
                  this.createTime = data.createTime;
                  
                  // Restore source info
                  if (data.sourceType) this.sourceType = data.sourceType;
                  else if (data.orderId) this.sourceType = 4;
                  
                  if (this.sourceType === 4 && data.sourceId) {
                      this.voucherId = data.sourceId;
                  }
                  
                  // Drafts use status=1
                  if (data.status === 0) {
                      // If loading a published review, we might want to warn or just edit
                  }

                  if (this.shopId) this.loadShop(this.shopId);

                  if (data.images) {
                      const imgs = data.images.split(',');
                      this.fileList = imgs.map(path => {
                          const url = path.startsWith('http') ? path : (this.fileURL + (path.startsWith('/') ? '' : '/') + path);
                          return {
                            url: url,
                            path: path,
                            type: this.isImage(path) ? 'image' : 'video'
                          };
                      });
                  }
              }
          });
      },

      triggerUpload(type) {
          if (type === 'image') this.$refs.imageInput.click();
          else this.$refs.videoInput.click();
      },
      handleFileSelect(e, type) {
          const files = e.target.files;
          if (!files.length) return;
          
          Array.from(files).forEach(file => {
             const formData = new FormData();
             formData.append('file', file);
             uploadFile(formData).then(res => {
                 let path = res.data || res;
                 if (typeof path === 'object') path = path.url || path.fileName;
                 
                 this.fileList.push({
                     url: path.startsWith('http') ? path : this.fileURL + (path.startsWith('/') ? '' : '/') + path,
                     path: path,
                     type: type
                 });
             }).catch(() => {
                 this.$message.error('文件上传失败');
             });
          });
          e.target.value = '';
      },
      removeFile(index) {
          this.fileList.splice(index, 1);
      },
      isImage(path) {
          return !path.match(/\.(mp4|mov|avi)$/i);
      },
      getUserInfo() {
          getCurrentUser().then(res => {
              const user = res.data || res;
              if (user && user.id) {
                  this.userId = user.id;
              }
          });
      },
      getValidOrderId() {
          if (this.orderId === null || this.orderId === undefined || this.orderId === '' || this.orderId === 0 || this.orderId === '0') {
              return null;
          }
          return this.orderId;
      },
      submitReview() {
          if (!this.canSubmit) return;
          this.submitting = true;
          
          const images = this.fileList.map(f => {
              if (f.path.startsWith(this.fileURL)) return f.path.replace(this.fileURL, '');
              return f.path;
          }).join(',');

          const params = {
              sourceId: this.sourceId || this.shopId,
              shopId: this.shopId,
              sourceType: this.sourceType,
              content: this.content,
              score: this.overallRating,
              tasteScore: this.tasteScore,
              envScore: this.envScore,
              serviceScore: this.serviceScore,
              images: images,
              isAnonymous: this.isAnonymous,
              userId: this.userId,
              status: 0  // 0=发布
          };
          
          const validOrderId = this.getValidOrderId();
          if (validOrderId) {
              params.orderId = validOrderId;
          }

          if (this.isEdit) {
              params.id = this.id;
              updateReview(params).then(() => {
                  this.$message({
                      type: 'success',
                      message: '修改成功',
                      duration: 1000,
                      onClose: () => {
                          this.$router.go(-1);
                      }
                  });
              }).finally(() => {
                  this.submitting = false;
              });
          } else {
              addReview(params).then(() => {
                  this.$message({
                      type: 'success',
                      message: '发布成功',
                      duration: 1000,
                      onClose: () => {
                          this.$router.go(-1);
                      }
                  });
              }).finally(() => {
                  this.submitting = false;
              });
          }
      },
      saveDraft() {
          if (!this.content && !this.fileList.length) {
              this.$toast('写点什么再存草稿吧');
              return;
          }
          const draft = {
              id: this.isEdit && this.id ? this.id : Date.now(),
              shopId: this.shopId,
              shopName: this.shopName,
              content: this.content,
              images: this.fileList.map(f => f.url),
              updateTime: Date.now()
          };

          // 调用API保存到服务器，status=1表示草稿
          const params = {
              sourceId: this.sourceId || this.shopId,
              shopId: this.shopId || 0,
              sourceType: this.sourceType,
              content: this.content || '',
              score: this.overallRating,
              tasteScore: this.tasteScore,
              envScore: this.envScore,
              serviceScore: this.serviceScore,
              images: this.fileList.map(f => {
                  if (f.path.startsWith(this.fileURL)) {
                      return f.path.replace(this.fileURL, '')
                  }
                  return f.path;
              }).join(','),
              isAnonymous: this.isAnonymous,
              userId: this.userId,
              status: 3  // 3=草稿
          };

          // 如果是编辑模式，传递草稿ID用于更新
          const validOrderId = this.getValidOrderId();
          if (validOrderId) {
              params.orderId = validOrderId;
          }

          if (this.isEdit && this.id) {
              params.id = this.id;
              updateReview(params).then(() => {
                  this.$message.success('草稿已更新');
                  setTimeout(() => {
                      this.$router.go(-1);
                  }, 500);
              });
          } else {
              // 新草稿，直接添加
              addReview(params).then(() => {
                  this.$message.success('已存入草稿箱');
                  setTimeout(() => {
                      this.$router.go(-1);
                  }, 500);
              });
          }
      }
  }
}
</script>

<style scoped>
.review-publish-page {
    background: #f7f7f7;
    min-height: 100vh;
    padding-bottom: 80px; /* Space for footer */
}

/* Header */
.custom-nav {
    display: flex; justify-content: space-between; align-items: center;
    height: 44px; padding: 0 16px; 
    background: white; 
    position: sticky; top: 0; z-index: 10;
}
.nav-left { font-size: 16px; color: #333; }
.nav-title { font-weight: 600; font-size: 17px; max-width: 60%; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }

/* Notice */
.edit-notice {
    background: #fff8e1; color: #e6a23c; font-size: 12px;
    padding: 10px 16px; line-height: 1.4;
}

.scroll-content { padding: 12px; }

/* Cards */
.card {
    background: white; border-radius: 12px; padding: 16px;
    margin-bottom: 12px;
}

/* Overall Rating */
.mood-labels {
    display: flex; justify-content: space-between; margin-bottom: 12px;
    padding: 0 10px;
}
.mood-item {
    display: flex; flex-direction: column; align-items: center; gap: 4px;
    opacity: 0.5; transition: all 0.2s;
}
.mood-item.active { opacity: 1; transform: scale(1.1); }
.mood-icon { font-size: 24px; }
.mood-text { font-size: 12px; color: #333; }

.main-stars { display: flex; justify-content: center; margin-bottom: 10px; }

/* Detail Ratings */
.detail-row {
    display: flex; align-items: center; gap: 12px; margin-bottom: 12px;
}
.detail-row .label { font-size: 15px; color: #333; font-weight: 500; min-width: 40px; }
.detail-row .score-text { color: #999; font-size: 13px; margin-left: auto; }
.modify-tip { 
    font-size: 11px; color: #bbb; text-align: center; margin-top: 10px;
    display: flex; justify-content: center; align-items: center; gap: 4px;
}

/* Editor */
.review-textarea {
    width: 100%; border: none; outline: none; resize: none;
    font-size: 15px; color: #333; line-height: 1.6;
    min-height: 120px;
}
.word-count { text-align: right; color: #ccc; font-size: 12px; margin-bottom: 12px; }

.media-section { margin-bottom: 20px; }
.media-list { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 12px; }
.media-item {
    width: 80px; height: 80px; border-radius: 8px; overflow: hidden; position: relative;
}
.media-item img, .media-item video {
    width: 100%; height: 100%; object-fit: cover;
}
.media-item .delete-btn {
    position: absolute; top: 0; right: 0; background: rgba(0,0,0,0.4);
    width: 20px; height: 20px; display: flex; justify-content: center; align-items: center;
    border-bottom-left-radius: 6px;
}

.upload-buttons { display: flex; gap: 12px; }
.upload-btn {
    width: 90px; height: 90px; background: #f8f8f8; border-radius: 4px;
    display: flex; flex-direction: column; justify-content: center; align-items: center;
    color: #333; font-size: 12px; gap: 6px; cursor: pointer;
}
.upload-btn .van-icon { font-size: 24px; color: #333; }

/* Anonymous */
.anonymous-section {
    display: flex; align-items: center; gap: 8px; cursor: pointer;
}
.check-circle {
    width: 18px; height: 18px; border: 1px solid #ddd; border-radius: 50%;
    display: flex; justify-content: center; align-items: center;
}
.check-circle.checked { background: #ff5622; border-color: #ff5622; }
.check-circle .van-icon { font-size: 12px; color: white; }
.anon-text { font-size: 14px; color: #333; }
.anon-tip { font-size: 12px; color: #ccc; margin-left: auto; }

/* Footer */
.footer-action {
    position: fixed; bottom: 0; left: 0; right: 0;
    height: 60px; background: white; border-top: 1px solid #eee;
    display: flex; align-items: center; padding: 0 16px; gap: 16px;
    z-index: 10;
}
.draft-btn {
    display: flex; flex-direction: column; align-items: center; gap: 2px;
    color: #666; font-size: 10px;
}
.publish-btn {
    flex: 1; height: 40px; background: #ff5622; color: white;
    border-radius: 20px; display: flex; justify-content: center; align-items: center;
    font-size: 16px; font-weight: 500;
}
.publish-btn.disabled { opacity: 0.5; }

/* iOS Dialog */
.ios-mask {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
    display: flex;
    justify-content: center;
    align-items: center;
}
.ios-alert {
    width: 270px;
    background: white;
    border-radius: 14px;
    overflow: hidden;
}
.ios-alert-content {
    padding: 20px 16px;
    text-align: center;
}
.ios-alert-title {
    font-size: 17px;
    font-weight: 600;
    color: #000;
    margin-bottom: 8px;
}
.ios-alert-msg {
    font-size: 13px;
    color: #666;
    line-height: 1.5;
}
.ios-alert-footer {
    display: flex;
    border-top: 0.5px solid #e0e0e0;
}
.ios-btn-cancel, .ios-btn-confirm {
    flex: 1;
    height: 44px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 17px;
    cursor: pointer;
}
.ios-btn-cancel {
    color: #007aff;
    border-right: 0.5px solid #e0e0e0;
}
.ios-btn-confirm {
    color: #ff3b30;
    font-weight: 600;
}
</style>
