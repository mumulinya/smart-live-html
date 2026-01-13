<template>
  <div class="blog-edit-page">
    <div class="header">
      <div class="header-cancel-btn" @click="goBack">取消</div>
      <div class="header-title">{{ editMode ? '编辑笔记' : '发笔记' }}<i class="el-icon-info" @click="showTips"></i></div>
      <div class="header-commit">
        <button class="header-commit-btn" @click="submitBlog" :disabled="!canSubmit" :class="{ 'submitting': isSubmitting }">
          <span v-if="!isSubmitting">{{ editMode ? '保存' : '发布' }}</span>
          <i v-else class="el-icon-loading"></i>
        </button>
      </div>
    </div>

    <div class="upload-box">
      <input type="file" @change="fileSelected" ref="fileInput" style="display: none" accept="image/*">
      <div class="upload-btn" @click="openFileDialog" :class="{ 'disabled': fileList.length >= 9 }">
        <i class="el-icon-camera"></i>
        <div style="font-size: 12px;line-height: 12px">上传照片</div>
      </div>
      <div class="pic-list">
        <div class="pic-box" v-for="(f,i) in fileList" :key="i">
          <img :src="f" alt="" :class="{ 'loading': uploading[i] }">
          <i class="el-icon-close" @click="deletePic(i)"></i>
        </div>
      </div>
      <div v-if="fileList.length > 0" style="font-size: 12px; color: #999; margin-top: 8px;">
        已选择 {{fileList.length}} 张，最多可上传9张
      </div>
    </div>

    <div class="blog-title">
      <input v-model="params.title" type="text" placeholder="填写标题更容易上首页哦~" @input="checkSubmitStatus">
    </div>

    <div class="blog-content">
      <textarea v-model="params.content" placeholder="最近打卡了什么地方，有什么新奇体验呢？" @input="checkSubmitStatus"></textarea>
    </div>

    <div class="divider"></div>

    <div class="blog-shop" @click="showDialog=true">
      <div class="shop-left">关联商户</div>
      <div v-if="selectedShop.name">{{selectedShop.name}}</div>
      <div v-else>去选择&nbsp;<i class="el-icon-arrow-right"></i></div>
    </div>

    <div class="mask" v-show="showDialog" @click="showDialog=false"></div>

    <transition name="el-zoom-in-bottom">
      <div class="shop-dialog" v-show="showDialog">
        <div class="blog-shop">
          <div class="shop-left">关联商户</div>
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
        this.$confirm('确定要放弃编辑吗？已输入的内容将会丢失', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          this.$router.go(-1);
        }).catch(() => {});
      } else {
        this.$router.go(-1);
      }
    }
  }
};
</script>

<style scoped>
.blog-edit-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #fdfbfb 0%, #ebedee 100%);
  padding-bottom: env(safe-area-inset-bottom);
}

/* Header */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0,0,0,0.05);
  position: sticky;
  top: 0;
  z-index: 100;
}
.header-cancel-btn {
  font-size: 15px;
  color: #666;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 8px;
  transition: background 0.2s;
}
.header-cancel-btn:hover { background: rgba(0,0,0,0.05); }
.header-title {
  font-size: 17px;
  font-weight: 700;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  gap: 6px;
}
.header-title .el-icon-info {
  color: #f9a825;
  font-size: 16px;
  cursor: pointer;
  transition: transform 0.2s;
}
.header-title .el-icon-info:hover { transform: scale(1.1); }
.header-commit-btn {
  background: linear-gradient(135deg, #ff6f61 0%, #ff8a65 100%);
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  opacity: 0.5;
  pointer-events: none;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(255,111,97,0.3);
}
.header-commit-btn:enabled {
  opacity: 1;
  pointer-events: auto;
}
.header-commit-btn:enabled:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255,111,97,0.4);
}
.header-commit-btn.submitting {
  opacity: 0.7;
  pointer-events: none;
}

/* Upload Section */
.upload-box {
  padding: 20px 16px;
  background: white;
  margin: 12px;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}
.upload-btn {
  width: 88px;
  height: 88px;
  border: 2px dashed #e0e0e0;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #bdbdbd;
  cursor: pointer;
  transition: all 0.2s;
  background: #fafafa;
}
.upload-btn:hover { 
  border-color: #ff6f61; 
  color: #ff6f61;
  background: #fff5f4;
}
.upload-btn.disabled { 
  opacity: 0.5; 
  cursor: not-allowed; 
}
.upload-btn i { font-size: 28px; margin-bottom: 6px; }
.pic-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;
}
.pic-box {
  width: 88px;
  height: 88px;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.pic-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}
.pic-box:hover img { transform: scale(1.05); }
.pic-box img.loading { filter: blur(3px); opacity: 0.7; }
.pic-box .el-icon-close {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(0,0,0,0.6);
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s;
}
.pic-box .el-icon-close:hover { background: rgba(255,0,0,0.7); }

/* Input Cards */
.blog-title, .blog-content {
  background: white;
  margin: 0 12px 2px;
  padding: 16px 18px;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}
.blog-title { 
  border-radius: 16px 16px 4px 4px;
  margin-top: 0;
}
.blog-content { 
  border-radius: 4px 4px 16px 16px;
  min-height: 160px;
}
.blog-title input {
  width: 100%;
  border: none;
  outline: none;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  background: transparent;
}
.blog-title input::placeholder { color: #bdbdbd; font-weight: 500; }
.blog-content textarea {
  width: 100%;
  border: none;
  outline: none;
  min-height: 140px;
  resize: none;
  font-size: 15px;
  font-family: inherit;
  color: #424242;
  line-height: 1.7;
  background: transparent;
}
.blog-content textarea::placeholder { color: #bdbdbd; }

.divider { display: none; }

/* Shop Selector */
.blog-shop {
  background: white;
  margin: 12px;
  padding: 16px 18px;
  border-radius: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 15px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
  cursor: pointer;
  transition: box-shadow 0.2s;
}
.blog-shop:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
.shop-left { 
  color: #1a1a1a; 
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
}
.shop-left::before {
  content: '🏪';
  font-size: 18px;
}
.blog-shop > div:last-child {
  color: #ff6f61;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
}
.blog-shop .el-icon-arrow-right { color: #ff6f61; }

/* Dialog Overlay */
.mask {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  z-index: 199;
  backdrop-filter: blur(2px);
}
.shop-dialog {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  z-index: 200;
  border-radius: 24px 24px 0 0;
  height: 70vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -4px 24px rgba(0,0,0,0.15);
}
.shop-dialog .blog-shop {
  margin: 0;
  border-radius: 24px 24px 0 0;
  border-bottom: 1px solid #f0f0f0;
  box-shadow: none;
  pointer-events: none;
}
.search-bar {
  padding: 12px 16px;
  border-bottom: 1px solid #f5f5f5;
  display: flex;
  gap: 12px;
  background: #fafafa;
}
.city-select {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #333;
  font-weight: 500;
  background: white;
  padding: 8px 12px;
  border-radius: 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}
.search-input {
  flex: 1;
  background: white;
  border-radius: 20px;
  padding: 8px 14px;
  display: flex;
  align-items: center;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}
.search-input i { color: #999; }
.search-input input {
  background: transparent;
  border: none;
  outline: none;
  margin-left: 8px;
  font-size: 14px;
  flex: 1;
}
.shop-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}
.shop-item {
  padding: 14px 18px;
  border-bottom: 1px solid #f5f5f5;
  transition: background 0.2s;
}
.shop-item:hover { background: #fff8f6; }
.shop-name { 
  font-weight: 600; 
  margin-bottom: 4px; 
  color: #1a1a1a;
}
.shop-item > div:last-child { 
  font-size: 13px; 
  color: #999; 
}
.empty-shop { 
  padding: 50px; 
  text-align: center; 
  color: #bdbdbd; 
}
</style>
