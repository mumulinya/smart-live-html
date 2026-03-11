<template>
  <div class="blog-edit-page">
    <div class="edit-page-header">
      <div class="header-left" @click="goBack">取消</div>
      <div class="header-title">{{ editMode ? '编辑笔记' : '发笔记' }}</div>
      <div class="header-right">
        <button class="publish-btn" @click="submitBlog" :disabled="!canSubmit" :class="{ 'submitting': isSubmitting }">
          <span v-if="!isSubmitting">{{ (editMode && !isDraft) ? '保存' : '发布' }}</span>
          <i v-else class="el-icon-loading"></i>
        </button>
      </div>
    </div>

    <div class="edit-content-scroll">
        <!-- Image Uploader (Top) -->
        <div class="upload-section">
            <div class="pic-list">
                <div class="pic-box" v-for="(f,i) in fileList" :key="i">
                <img :src="f" alt="" :class="{ 'loading': uploading[i] }">
                <i class="el-icon-close" @click="deletePic(i)"></i>
                </div>
                <!-- Upload Button -->
                <div class="upload-btn" @click="openFileDialog" v-if="fileList.length < 9">
                    <i class="el-icon-plus"></i>
                </div>
            </div>
            <input type="file" @change="fileSelected" ref="fileInput" style="display: none" accept="image/*">
        </div>

        <!-- Inputs -->
        <div class="input-section">
            <div class="title-input-box">
                <input v-model="params.title" type="text" placeholder="填写标题更容易上首页哦~" @input="checkSubmitStatus" class="title-input">
                <div class="ai-titles-row" v-if="aiTitles && aiTitles.length > 0">
                    <span class="ai-title-tag" v-for="(t, idx) in aiTitles" :key="idx" @click="selectAiTitle(t)">
                        {{ t }}
                    </span>
                </div>
            </div>
            <div class="content-input-box">
                <textarea v-model="params.content" placeholder="最近打卡了什么地方，有什么新奇体验呢？" @input="checkSubmitStatus" class="content-input"></textarea>
                <div class="word-count" v-if="aiWordCount > 0">已由 AI 生成 {{ aiWordCount }} 字，可在上方修改</div>
            </div>
        </div>

        <!-- Options -->
        <div class="options-section">
            <div class="option-item" @click="showDialog=true">
                <div class="option-left">
                    <i class="el-icon-location-outline"></i>
                    <span>关联商户</span>
                </div>
                <div class="option-right">
                    <span>{{selectedShop.name || '去选择'}}</span>
                    <i class="el-icon-arrow-right"></i>
                </div>
            </div>
        </div>

        <!-- AI 博客生成组件 -->
        <AiBlogGenerate 
          :shop-id="selectedShop.id" 
          :shop-name="selectedShop.name"
          @generated="handleAiGenerated" 
        />

        <!-- Footer Actions -->
        <div class="footer-action">
            <div class="draft-actions">
                <div class="draft-btn" @click="saveDraft" v-if="!editMode">
                    <i class="el-icon-document"></i>
                    <span>存草稿</span>
                </div>
                <div class="draft-btn" @click="goDraftBox">
                    <i class="el-icon-folder-opened"></i>
                    <span>草稿箱</span>
                </div>
            </div>
            <button class="publish-btn-footer" :disabled="!canSubmit" @click="submitBlog">
                {{ (editMode && !isDraft) ? '保存' : '发布' }}
            </button>
        </div>
    </div>

    <div class="mask" v-show="showDialog || showCityDialog" @click="closeAllDialogs"></div>

    <transition name="el-zoom-in-bottom">
      <div class="shop-dialog" v-show="showDialog">
        <div class="shop-dialog-header">
           <span>关联商户</span>
           <i class="el-icon-close" @click="showDialog=false"></i>
        </div>
        <div class="search-bar">
          <div class="city-select" @click="showCityDialog=true">{{ currentArea }} <i class="el-icon-arrow-down"></i></div>
          <div class="search-input">
            <i class="el-icon-search" @click="queryShops"></i>
            <input v-model="shopName" type="text" placeholder="搜索商户名称" @keyup.enter="queryShops">
          </div>
        </div>
        <div class="shop-list">
          <div v-if="shops.length === 0 && !shopLoading" class="empty-shop">
            <div style="text-align: center; padding: 30px 20px; color: #999;">
              <i class="el-icon-shopping-bag" style="font-size: 40px; margin-bottom: 10px; opacity: 0.3;"></i>
              <div>未找到相关商户</div>
            </div>
          </div>
          <div v-if="shopLoading" style="text-align: center; padding: 30px;">
            <i class="el-icon-loading" style="font-size: 24px; color: #f63;"></i>
          </div>
          <div v-for="s in shops" :key="s.id" class="shop-item" @click="selectShop(s)">
            <div class="shop-name">{{s.name}}</div>
            <div>{{s.area || '未知区域'}}</div>
          </div>
        </div>
      </div>
    </transition>

    <transition name="el-zoom-in-bottom">
      <div class="shop-dialog" v-show="showCityDialog" style="height: auto; max-height: 50vh;">
        <div class="shop-dialog-header">
           <span>选择城市</span>
           <i class="el-icon-close" @click="showCityDialog=false"></i>
        </div>
        <div class="city-grid-box">
           <div class="city-grid-item" v-for="city in hotCities" :key="city" @click="selectCity(city)">{{city}}</div>
        </div>
      </div>
    </transition>

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
  </div>
</template>

<script>
import { uploadFile, deleteFile } from "@/api/common";
import { saveBlog, getBlogDetail, updateBlog } from "@/api/blog";
import { searchShopsByName, getShopDetail } from "@/api/shop";
import { getCurrentUser } from "@/api/user";
import { locationUtil } from "@/utils/location";
import AiBlogGenerate from "./AiBlogGenerate.vue";

export default {
  name: "BlogEdit",
  components: {
    AiBlogGenerate
  },
  data() {
    return {
      fileList: [], // Display URLs
      serverFilePaths: [], // Actual server paths for submission
      uploading: [], 
      params: {
        title: '',
        content: ''
      },
      showDialog: false,
      shops: [],
      shopName: "",
      selectedShop: {},
      canSubmit: false,
      isSubmitting: false,
      shopLoading: false,
      showExitDialog: false,
      exitAction: 'back',
      
      // Edit mode
      editMode: false,
      blogId: null,
      isDraft: false,
      originalData: null, // Store original data for comparison
      currentArea: '佛山', // 默认为佛山，实际可从定位或缓存获取
      showCityDialog: false,
      hotCities: ['佛山','上海','北京','深圳','广州','成都','南京','武汉','西安','杭州'],
      aiWordCount: 0, // AI 生成的字数提示
      aiTitles: [] // AI 生成的候选标题
    };
  },
  created() {
    // 优先使用 locationUtil 获取定位 (false = 优先读缓存，这样能共享首页手动切换后的城市)
    locationUtil.getLocation(false).then(loc => {
        if (loc && loc.region) {
             let city = loc.region.city || loc.region.province;
             if (city && typeof city === 'string') {
                 if (city.endsWith('市')) city = city.slice(0, -1);
                 this.currentArea = city;
             }
        }
    }).catch(e => {
        console.log('定位获取失败，使用默认值:', e);
        this.currentArea = '佛山';
    });

    // 支持通过 URL 参数强制指定区域 (用于测试: ?area=深圳)
    if (this.$route.query.area) {
        this.currentArea = this.$route.query.area;
    }

    this.checkLogin();
    // queryShops 会依赖 currentArea，所以放在 nextTick 或者等待定位返回后调用更严谨，
    // 但为了响应速度，先用默认值/缓存值查一次，定位变了再查一次也可以。
    // 这里为了简单，先直接查。
    this.queryShops();
    
    // Check if editing existing blog
    const id = this.$route.query.id;
    const draft = this.$route.query.draft;
    if (id) {
      this.editMode = true;
      this.blogId = id;
      this.isDraft = draft === 'true';
      this.loadBlogData(id);
    } else {
      this.$nextTick(() => {
        this.originalData = this.getSnapshot();
      });
    }
  },
  methods: {
    markUserProfileNoteCacheDirty() {
      try {
        sessionStorage.setItem('user_profile_note_cache_dirty', String(Date.now()));
      } catch (e) {
        console.error('Failed to mark user profile note cache dirty', e);
      }
    },
    getSnapshot() {
      return JSON.stringify({
        title: this.params.title,
        content: this.params.content,
        images: this.serverFilePaths ? this.serverFilePaths.join(',') : '',
        shopId: this.selectedShop ? (this.selectedShop.id || '') : ''
      });
    },
    hasUnsavedChanges() {
      const currentSnapshot = this.getSnapshot();
      return this.originalData && currentSnapshot !== this.originalData;
    },
    checkLogin() {
      // Assuming route guard handles this, but double check
      getCurrentUser().catch(() => {
        this.$message.error('请先登录');
        this.$router.push('/user/login');
      });
    },
    showTips() {
      this.$message({
        message: '优质笔记更容易获得推荐：\n1. 上传清晰的图片\n2. 标题突出重点\n3. 内容详细描述体验',
        type: 'info',
        duration: 3000,
        showClose: true
      });
    },
    handleAiGenerated(data) {
      if (typeof data === 'object' && data !== null && data.titles) {
          this.params.content = data.content || '';
          this.aiWordCount = data.content ? data.content.length : 0;
          this.aiTitles = data.titles || [];
          if (this.aiTitles.length > 0 && !this.params.title) {
              this.params.title = this.aiTitles[0];
          }
      } else {
          this.params.content = data || '';
          this.aiWordCount = data ? data.length : 0;
      }
      this.checkSubmitStatus();
    },
    selectAiTitle(t) {
        this.params.title = t;
        this.checkSubmitStatus();
    },
    checkSubmitStatus() {
      if (this.params.content.length !== this.aiWordCount && this.aiWordCount > 0) {
          this.aiWordCount = 0; // 手动修改后取消字数提示
      }
      this.canSubmit = this.params.title.trim() !== '' &&
              this.params.content.trim() !== '' &&
              this.fileList.length > 0;
    },
    queryShops() {
      this.shopLoading = true;
      searchShopsByName(this.shopName, this.currentArea)
        .then((res) => {
          // Handle different response structures
          let list = res;
          if (res && res.data) list = res.data;
          if (res && Array.isArray(res.data)) list = res.data;
          else if (res && res.data && Array.isArray(res.data.records)) list = res.data.records;
          this.shops = Array.isArray(list) ? list : [];
        })
        .catch((err) => {
          console.error('Failed to fetch shops:', err);
          this.shops = [];
        })
        .finally(() => {
          this.shopLoading = false;
        });
    },
    selectShop(s) {
      this.selectedShop = s;
      this.showDialog = false;
    },
    selectCity(city) {
      this.currentArea = city;
      sessionStorage.setItem('userLocation', city);
      this.showCityDialog = false;
      this.shopName = ''; // 切换城市后清空搜索词
      this.queryShops(); // 重新查询该城市的商户
    },
    closeAllDialogs() {
      this.showDialog = false;
      this.showCityDialog = false;
    },
    submitBlog() {
      if (!this.canSubmit) return;
      this.isSubmitting = true;

      const data = {
        title: this.params.title,
        content: this.params.content,
        images: this.serverFilePaths.join(","),
        shopId: this.selectedShop.id,
        status: 0  // 0=发布
      };
      
      // If editing, add id and use update API
      if (this.editMode && this.blogId) {
        data.id = this.blogId;
        updateBlog(data)
          .then(() => {
            this.markUserProfileNoteCacheDirty();
            this.$message({
              type: 'success',
              message: '修改成功！',
              duration: 1000,
              onClose: () => {
                this.$router.push('/user/profile');
              }
            });
          })
          .catch(err => {
            this.$message.error(err.response?.data?.message || '修改失败，请重试');
            this.isSubmitting = false;
          });
      } else {
        saveBlog(data)
          .then(() => {
            this.markUserProfileNoteCacheDirty();
            this.$message({
              type: 'success',
              message: '发布成功！',
              duration: 1000,
              onClose: () => {
                this.$router.push('/user/profile');
              }
            });
          })
          .catch(err => {
            this.$message.error(err.response?.data?.message || '发布失败，请重试');
            this.isSubmitting = false;
          });
      }
    },
    loadBlogData(id) {
      getBlogDetail(id).then(res => {
        let blog = res;
        if (res && res.data) blog = res.data;
        
        this.params.title = blog.title || '';
        this.params.content = blog.content || '';
        
        // Load images
        if (blog.images) {
          const paths = blog.images.split(',').filter(p => p);
          this.serverFilePaths = paths;
          this.fileList = paths.map(p => p.startsWith('http') ? p : this.$fileURL + p);
          this.uploading = paths.map(() => false);
        }
        
        // Load shop
        if (blog.shopId) {
          getShopDetail(blog.shopId).then(shopRes => {
            let shop = shopRes;
            if (shopRes && shopRes.data) shop = shopRes.data;
            this.selectedShop = shop;
            this.originalData = this.getSnapshot();
          });
        } else {
            this.originalData = this.getSnapshot();
        }

        this.checkSubmitStatus();
      }).catch(() => {
        this.$message.error('加载笔记失败');
      });
    },
    openFileDialog() {
      if (this.fileList.length >= 9) {
        this.$message.warning('最多只能上传9张图片');
        return;
      }
      this.$refs.fileInput.click();
    },
    fileSelected(e) {
      const file = e.target.files[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        this.$message.error('请选择图片文件');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        this.$message.error('图片大小不能超过10MB');
        return;
      }

      const tempUrl = URL.createObjectURL(file);
      this.fileList.push(tempUrl);
      this.uploading.push(true);
      e.target.value = ''; // Reset input

      const formData = new FormData();
      formData.append("file", file);

      uploadFile(formData)
        .then((res) => {
          // Extract actual path string from response (may be wrapped in data property)
          let path = res;
          if (res && typeof res === 'object' && res.data) path = res.data;
          if (typeof path !== 'string') path = String(path);
          
          // Strip the fileURL prefix if present, keep only relative path like /2025/10/18/filename.png
          const filePrefix = this.$fileURL || '';
          if (path.startsWith(filePrefix)) {
            path = path.substring(filePrefix.length);
          }
          // Also handle if it starts with http but has a different structure
          if (path.startsWith('http')) {
            const urlParts = path.split('/smart-live');
            if (urlParts.length > 1) path = urlParts[1];
          }
          
          const index = this.fileList.indexOf(tempUrl);
          if (index !== -1) {
             this.serverFilePaths[index] = path;
             this.uploading[index] = false;
          }
          this.checkSubmitStatus();
        })
        .catch(() => {
          const index = this.fileList.indexOf(tempUrl);
          if (index !== -1) {
            this.fileList.splice(index, 1);
            this.uploading.splice(index, 1);
          }
          this.$message.error('图片上传失败');
        });
    },
    deletePic(i) {
      // Optional: call delete API if uploaded
      const path = this.serverFilePaths[i];
      if (path && !this.uploading[i]) {
         deleteFile(path).catch(console.error);
      }
      this.fileList.splice(i, 1);
      this.serverFilePaths.splice(i, 1);
      this.uploading.splice(i, 1);
      this.checkSubmitStatus();
    },
    goBack() {
      if (this.hasUnsavedChanges()) {
          this.exitAction = 'back';
          this.showExitDialog = true;
      } else {
          this.$router.go(-1);
      }
    },
    confirmExit() {
        this.showExitDialog = false;
        if (this.exitAction === 'draft') {
            this.$router.push({
                path: '/drafts',
                query: { type: 'note' }
            });
        } else {
            this.$router.go(-1);
        }
        this.exitAction = 'back';
    },
    saveDraft() {
        if (!this.params.title && !this.params.content && !this.fileList.length) {
            this.$message.warning('写点什么再存草稿吧');
            return;
        }
        
        this.isSubmitting = true;
        const data = {
            title: this.params.title,
            content: this.params.content,
            images: this.serverFilePaths.join(","),
            shopId: this.selectedShop.id,
            status: 3  // 3=草稿
        };
        
        // If editing existing blog/draft
        if (this.editMode && this.blogId) {
            data.id = this.blogId;
            updateBlog(data)
                .then(() => {
                    this.$message.success('已存入草稿箱');
                    setTimeout(() => {
                        this.$router.go(-1);
                    }, 500);
                })
                .catch(err => {
                    this.$message.error(err.response?.data?.message || '保存失败');
                })
                .finally(() => {
                    this.isSubmitting = false;
                });
        } else {
            saveBlog(data)
                .then(() => {
                    this.$message.success('已存入草稿箱');
                    setTimeout(() => {
                        this.$router.go(-1);
                    }, 500);
                })
                .catch(err => {
                    this.$message.error(err.response?.data?.message || '保存失败');
                })
                .finally(() => {
                    this.isSubmitting = false;
                });
        }
    },
    goDraftBox() {
        if (this.hasUnsavedChanges()) {
            this.exitAction = 'draft';
            this.showExitDialog = true;
            return;
        }
        this.$router.push({
            path: '/drafts',
            query: { type: 'note' }
        });
    }
  }
};
</script>

<style scoped>
.blog-edit-page {
  min-height: 100vh;
  background: white;
  padding-bottom: env(safe-area-inset-bottom);
}

/* Header */
.edit-page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 50px;
  background: white;
  position: sticky;
  top: 0;
  z-index: 100;
  padding-top: env(safe-area-inset-top);
  height: calc(50px + env(safe-area-inset-top));
  box-sizing: content-box; /* Ensure padding doesn't eat height if explicit */
}
.header-left {
  font-size: 16px;
  color: #666;
  cursor: pointer;
  flex-shrink: 0;
  white-space: nowrap;
}
.header-title {
  font-size: 17px;
  font-weight: bold;
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
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: flex-end;
}
.publish-btn {
  background: #ff2442;
  color: white;
  border: none;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 60px;
}
.publish-btn:disabled {
  background: #ff2442;
  opacity: 0.5;
  cursor: not-allowed;
}

.edit-content-scroll {
    padding: 10px 20px 80px;
}

/* Upload Section */
.upload-section {
    margin-bottom: 20px;
}
.pic-list {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}
.pic-box {
    width: 100px;
    height: 100px;
    border-radius: 8px;
    overflow: hidden;
    position: relative;
    background: #f5f5f5;
}
.pic-box img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.pic-box .el-icon-close {
    position: absolute;
    top: 4px;
    right: 4px;
    background: rgba(0,0,0,0.5);
    color: white;
    border-radius: 50%;
    padding: 2px;
    font-size: 12px;
}
.upload-btn {
    width: 100px;
    height: 100px;
    border: 1.5px dashed #ddd; /* Dashed border as requested */
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ccc;
    cursor: pointer;
}
.upload-btn i { font-size: 28px; }

/* Input Section */
.input-section {
    margin-bottom: 20px;
}
.title-input-box {
    border-bottom: 1px solid #eee;
    padding-bottom: 10px;
    margin-bottom: 15px;
}
.title-input {
    width: 100%;
    border: none;
    outline: none;
    font-size: 18px;
    font-weight: bold;
    color: #333;
}
.title-input::placeholder { color: #ccc; font-weight: normal; }

.ai-titles-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 10px;
}
.ai-title-tag {
    background: #fff2e8;
    color: #ff4d4f;
    border: 1px solid #ffd8bf;
    font-size: 12px;
    padding: 4px 10px;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
}
.ai-title-tag:active {
    background: #ffd8bf;
    transform: scale(0.98);
}

.content-input {
    width: 100%;
    border: none;
    outline: none;
    font-size: 15px;
    color: #333;
    min-height: 150px;
    resize: none;
    line-height: 1.6;
}
.content-input::placeholder { color: #ccc; }

.word-count { text-align: right; color: #ff4d4f; font-size: 12px; margin-top: 5px; }

/* Options Section */
.options-section {
    border-top: 1px solid #f5f5f5;
}
.option-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 15px 0;
    cursor: pointer;
    font-size: 15px;
    color: #333;
    border-bottom: 1px solid #f5f5f5;
}
.option-left {
    display: flex;
    align-items: center;
    gap: 8px;
}
.option-left i { font-size: 18px; color: #333; }
.option-right {
    display: flex;
    align-items: center;
    color: #999;
    font-size: 14px;
    gap: 4px;
}

/* Mask & Dialog */
.mask {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 199;
}
.shop-dialog {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  z-index: 200;
  border-radius: 16px 16px 0 0;
  height: 70vh;
  display: flex;
  flex-direction: column;
}
.shop-dialog-header {
    padding: 15px 20px;
    font-weight: bold;
    text-align: center;
    position: relative;
    border-bottom: 1px solid #eee;
}
.shop-dialog-header i {
    position: absolute;
    right: 15px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 20px;
    color: #999;
    cursor: pointer;
}
.search-bar {
  padding: 10px 15px;
  display: flex;
  gap: 10px;
  background: white;
}
.city-select {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #333;
  padding: 6px 12px;
  background: #f5f5f5;
  border-radius: 16px;
}
.search-input {
  flex: 1;
  background: #f5f5f5;
  border-radius: 16px;
  padding: 6px 12px;
  display: flex;
  align-items: center;
}
.search-input input {
    background: transparent;
    border: none;
    outline: none;
    flex: 1;
    margin-left: 5px;
    font-size: 14px;
}
.shop-list {
  flex: 1;
  overflow-y: auto;
}
.shop-item {
  padding: 15px 20px;
  border-bottom: 1px solid #f9f9f9;
}
.shop-name { font-weight: bold; margin-bottom: 4px; font-size: 15px; }
.empty-shop {
  padding: 50px;
  text-align: center;
  color: #bdbdbd;
}

/* City Selection Grid */
.city-grid-box {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    padding: 20px;
}
.city-grid-item {
    background: #f5f5f5;
    padding: 10px 0;
    text-align: center;
    border-radius: 4px;
    font-size: 14px;
    color: #333;
    cursor: pointer;
}
.city-grid-item:active {
    background: #e8e8e8;
}

/* iOS Alert Styles */
.ios-mask {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.4);
    z-index: 999;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(2px);
    animation: fadeIn 0.2s ease;
}
.ios-alert {
    width: 270px;
    background: rgba(255,255,255,0.95);
    backdrop-filter: blur(10px);
    border-radius: 14px;
    overflow: hidden;
    text-align: center;
    animation: popIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.ios-alert-content {
    padding: 20px 16px;
}
.ios-alert-title {
    font-size: 17px;
    font-weight: 700;
    color: #000;
    margin-bottom: 6px;
}
.ios-alert-msg {
    font-size: 13px;
    line-height: 1.4;
    color: #000;
}
.ios-alert-footer {
    display: flex;
    border-top: 0.5px solid rgba(60,60,67,0.29); /* iOS separaor color */
    height: 44px;
}
.ios-alert-footer > div {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 17px;
    cursor: pointer;
    transition: background 0.2s;
}
.ios-alert-footer > div:active {
    background: rgba(0,0,0,0.05);
}
.ios-btn-cancel {
    color: #007aff; /* iOS Blue */
    font-weight: 600;
    border-right: 0.5px solid rgba(60,60,67,0.29);
}
.ios-btn-confirm {
    color: #ff3b30; /* iOS Red */
    font-weight: 400;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}
@keyframes popIn {
    from { transform: scale(0.9); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
}

/* Save Draft Link in Header */
.save-draft-link {
    font-size: 14px;
    color: #666;
    margin-right: 12px;
    cursor: pointer;
}
.save-draft-link:active {
    opacity: 0.7;
}

/* Footer Action Bar */
.footer-action {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 60px;
    background: white;
    border-top: 1px solid #eee;
    display: flex;
    align-items: center;
    padding: 0 16px;
    gap: 16px;
    z-index: 100;
    padding-bottom: env(safe-area-inset-bottom);
}
.draft-actions {
    display: flex;
    align-items: center;
    gap: 16px;
}
.draft-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    color: #666;
    font-size: 10px;
    cursor: pointer;
}
.draft-btn i {
    font-size: 20px;
}
.draft-btn:active {
    opacity: 0.7;
}
.publish-btn-footer {
    flex: 1;
    height: 40px;
    background: #ff2442;
    color: white;
    border: none;
    border-radius: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
}
.publish-btn-footer:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
</style>
