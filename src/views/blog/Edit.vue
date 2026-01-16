<template>
  <div class="blog-edit-page">
    <div class="edit-page-header">
      <div class="header-left" @click="goBack">取消</div>
      <div class="header-title">发笔记</div>
      <div class="header-right">
        <button class="publish-btn" @click="submitBlog" :disabled="!canSubmit" :class="{ 'submitting': isSubmitting }">
          <span v-if="!isSubmitting">{{ editMode ? '保存' : '发布' }}</span>
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
            </div>
            <div class="content-input-box">
                <textarea v-model="params.content" placeholder="最近打卡了什么地方，有什么新奇体验呢？" @input="checkSubmitStatus" class="content-input"></textarea>
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
    </div>

    <div class="mask" v-show="showDialog" @click="showDialog=false"></div>

    <transition name="el-zoom-in-bottom">
      <div class="shop-dialog" v-show="showDialog">
        <div class="shop-dialog-header">
           <span>关联商户</span>
           <i class="el-icon-close" @click="showDialog=false"></i>
        </div>
        <div class="search-bar">
          <div class="city-select">杭州 <i class="el-icon-arrow-down"></i></div>
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

export default {
  name: "BlogEdit",
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
      
      // Edit mode
      editMode: false,
      blogId: null
    };
  },
  created() {
    this.checkLogin();
    this.queryShops();
    
    // Check if editing existing blog
    const id = this.$route.query.id;
    if (id) {
      this.editMode = true;
      this.blogId = id;
      this.loadBlogData(id);
    }
  },
  methods: {
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
    checkSubmitStatus() {
      this.canSubmit = this.params.title.trim() !== '' &&
              this.params.content.trim() !== '' &&
              this.fileList.length > 0;
    },
    queryShops() {
      this.shopLoading = true;
      searchShopsByName(this.shopName)
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
    submitBlog() {
      if (!this.canSubmit) return;
      this.isSubmitting = true;

      const data = {
        title: this.params.title,
        content: this.params.content,
        images: this.serverFilePaths.join(","),
        shopId: this.selectedShop.id
      };
      
      // If editing, add id and use update API
      if (this.editMode && this.blogId) {
        data.id = this.blogId;
        updateBlog(data)
          .then(() => {
            this.$message.success('修改成功！');
            setTimeout(() => {
              this.$router.push('/info');
            }, 1000);
          })
          .catch(err => {
            this.$message.error(err.response?.data?.message || '修改失败，请重试');
            this.isSubmitting = false;
          });
      } else {
        saveBlog(data)
          .then(() => {
            this.$message.success('发布成功！');
            setTimeout(() => {
              this.$router.push('/info');
            }, 1000);
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
          });
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
      if (this.params.title || this.params.content || this.fileList.length > 0) {
          this.showExitDialog = true;
      } else {
        this.$router.go(-1);
      }
    },
    confirmExit() {
        this.showExitDialog = false;
        this.$router.go(-1);
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
  flex: 1;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
</style>
