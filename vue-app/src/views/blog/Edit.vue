<template>
  <div class="blog-edit-page">
    <div class="header">
      <div class="header-cancel-btn" @click="goBack">取消</div>
      <div class="header-title">发笔记<i class="el-icon-info" @click="showTips"></i></div>
      <div class="header-commit">
        <button class="header-commit-btn" @click="submitBlog" :disabled="!canSubmit" :class="{ 'submitting': isSubmitting }">
          <span v-if="!isSubmitting">发布</span>
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
import { saveBlog } from "@/api/blog";
import { searchShopsByName } from "@/api/shop";
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
      shopLoading: false
    };
  },
  created() {
    this.checkLogin();
    this.queryShops();
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
          this.shops = res || [];
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
        .then((path) => {
          // Success: replace tempUrl with displayed image if needed, or just store the path
          const index = this.fileList.indexOf(tempUrl);
          if (index !== -1) {
             // In this system, it seems we display the full URL but submit the path
             // path is likely "/imgs/blogs/..." or similar
             // We need to store this path for submission
             this.serverFilePaths[index] = path;
             // Update display if path is a full URL? Assuming path needs $fileURL prefix if strict, 
             // but 'path' returned from upload is usually relative.
             // For simplicity, keep displaying tempUrl (it's faster) or display fileURL + path
             // Let's keep tempUrl for display as it's instant
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
  background-color: #f5f5f7;
  padding-bottom: 20px;
}

/* Header */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 15px;
  background-color: #fff;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  z-index: 10;
}
.header-cancel-btn {
  font-size: 15px;
  color: #666;
  cursor: pointer;
}
.header-title {
  font-size: 17px;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
}
.header-title .el-icon-info {
  margin-left: 5px;
  color: #999;
  font-size: 15px;
}
.header-commit-btn {
  background-color: #f63;
  color: white;
  border: none;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  opacity: 0.6;
  pointer-events: none;
  transition: all 0.2s;
}
.header-commit-btn:enabled {
  opacity: 1;
  pointer-events: auto;
}
.header-commit-btn.submitting {
  opacity: 0.8;
  pointer-events: none;
}

/* Upload */
.upload-box {
  padding: 15px;
  background-color: #fff;
  margin-bottom: 10px;
}
.upload-btn {
  width: 80px;
  height: 80px;
  border: 1px dashed #ddd;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
  cursor: pointer;
  margin-bottom: 10px;
}
.pic-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.pic-box {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}
.pic-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.pic-box .el-icon-close {
  position: absolute;
  top: 2px;
  right: 2px;
  background: rgba(0,0,0,0.5);
  color: white;
  border-radius: 50%;
  padding: 2px;
  font-size: 12px;
}

/* Inputs */
.blog-title, .blog-content {
  background: white;
  padding: 15px;
  margin-bottom: 2px;
}
.blog-title input {
  width: 100%;
  border: none;
  outline: none;
  font-size: 16px;
  font-weight: 500;
}
.blog-content textarea {
  width: 100%;
  border: none;
  outline: none;
  min-height: 120px;
  resize: none;
  font-size: 15px;
  font-family: inherit;
}

.blog-shop {
  background: white;
  padding: 15px;
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 15px;
}
.shop-left { color: #333; }
.blog-shop .el-icon-arrow-right { color: #ccc; }

/* Dialog */
.mask {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 99;
}
.shop-dialog {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  z-index: 100;
  border-radius: 16px 16px 0 0;
  height: 70vh;
  display: flex;
  flex-direction: column;
}
/* Reusing Search Bar Styles locally or global */
.search-bar {
  padding: 10px 15px;
  border-bottom: 1px solid #f5f5f5;
  display: flex;
  gap: 10px;
}
.city-select {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #333;
}
.search-input {
  flex: 1;
  background: #f5f5f5;
  border-radius: 18px;
  padding: 6px 12px;
  display: flex;
  align-items: center;
}
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
}
.shop-item {
  padding: 12px 15px;
  border-bottom: 1px solid #f9f9f9;
}
.shop-name { font-weight: 500; margin-bottom: 4px; }
.empty-shop { padding: 40px; text-align: center; color: #999; }
</style>
