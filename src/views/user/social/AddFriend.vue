<template>
  <div class="add-friend-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-back" @click="goBack"><i class="el-icon-arrow-left"></i></div>
      <div class="header-title">添加朋友</div>
      <div class="header-right"><i class="el-icon-setting"></i></div>
    </div>

    <!-- Search Bar -->
    <div class="search-bar">
      <div class="search-input-wrapper">
        <i class="el-icon-search"></i>
        <input 
          type="text" 
          v-model="keyword" 
          placeholder="搜索用户名字 / 生活号"
          @keyup.enter="handleSearch"
        >
      </div>
      <div class="search-btn" @click="handleSearch">搜索</div>
    </div>

    <!-- Search Results -->
    <div class="search-results" v-loading="loading">
      <div v-if="searched && users.length === 0 && !loading" class="empty-state">
        <i class="el-icon-user"></i>
        <p>未找到相关用户</p>
      </div>
      
      <div v-else class="user-list">
        <div 
          class="user-item" 
          v-for="user in users" 
          :key="user.id"
          @click="toUserDetail(user)"
        >
          <div class="user-avatar">
            <img :src="user.icon || '/imgs/icons/default-icon.png'" @error="handleImgError">
          </div>
          <div class="user-info">
            <div class="user-name" v-html="user.nickName || '未知用户'"></div>
            <div class="user-id">生活号：{{ user.id }}</div>
          </div>
          <div class="user-action">
            <button 
              class="follow-btn" 
              :class="{ followed: user.isFollow }"
              @click.stop="handleFollow(user)"
            >
              {{ user.isFollow ? '已关注' : '关注' }}
            </button>
          </div>
        </div>
      </div>
      
      <div v-if="users.length > 0 && noMore" class="no-more">没有更多了</div>
    </div>
  </div>
</template>

<script>
import { searchUsers } from '@/api/search';
import { followUser, isFollowed } from '@/api/interaction';
import { getCurrentUser } from '@/api/user';

export default {
  name: 'AddFriend',
  data() {
    return {
      keyword: '',
      users: [],
      loading: false,
      searched: false,
      noMore: false,
      current: 1,
      loginUser: {}
    }
  },
  created() {
    this.getLoginUser();
  },
  methods: {
    goBack() {
      this.$router.go(-1);
    },
    getLoginUser() {
      const token = localStorage.getItem('token');
      if (token) {
        getCurrentUser().then(res => {
          this.loginUser = res.data || res || {};
        }).catch(() => {});
      }
    },
    handleSearch() {
      if (!this.keyword.trim()) {
        this.$message.warning('请输入搜索关键词');
        return;
      }
      
      this.current = 1;
      this.users = [];
      this.noMore = false;
      this.searched = true;
      this.searchUsers();
    },
    searchUsers() {
      this.loading = true;
      searchUsers({ 
        keyword: this.keyword, 
        page: this.current, 
        size: 20 
      }).then(res => {
        // 数据在 res.data.list 中
        const data = res.data || res || {};
        let list = data.list || data.records || data || [];
        
        // 如果 list 仍然不是数组，尝试其他方式
        if (!Array.isArray(list)) list = [];
        
        // Process user data
        list.forEach(u => {
          // 处理头像
          if (u.icon && !u.icon.startsWith('http')) {
            u.icon = this.$fileURL + u.icon;
          }
        });
        
        if (this.current === 1) {
          this.users = list;
        } else {
          this.users = [...this.users, ...list];
        }
        
        // 检查是否还有更多数据
        const total = data.total || 0;
        const pageSize = data.pageSize || 20;
        if (list.length < pageSize || this.users.length >= total) {
          this.noMore = true;
        }
      }).finally(() => {
        this.loading = false;
      });
    },
    loadMore() {
      if (this.loading || this.noMore) return;
      this.current++;
      this.searchUsers();
    },
    handleFollow(user) {
      if (!this.loginUser.id) {
        return this.$router.push('/user/login');
      }
      
      const newStatus = !user.isFollow;
      followUser({ sourceId: user.id, sourceType: 1, isFollow: newStatus }).then(() => {
        user.isFollow = newStatus;
        this.$message.success(newStatus ? '关注成功' : '已取消关注');
      }).catch(() => {
        this.$message.error('操作失败');
      });
    },
    toUserDetail(user) {
      if (this.loginUser.id && String(user.id) === String(this.loginUser.id)) {
        this.$router.push('/user/profile');
      } else {
        this.$router.push(`/user/profile/${user.id}`);
      }
    },
    handleImgError(e) {
      e.target.src = '/imgs/icons/default-icon.png';
    }
  }
}
</script>

<style scoped>
.add-friend-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.page-header {
  height: 50px;
  background: white;
  display: flex;
  align-items: center;
  padding: 0 15px;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-back {
  width: 30px;
  font-size: 20px;
  cursor: pointer;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
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
  width: 30px;
  text-align: right;
  font-size: 20px;
  color: #666;
}

.search-bar {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  background: white;
  border-bottom: 1px solid #eee;
}

.search-input-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  background: #f5f5f5;
  border-radius: 20px;
  padding: 8px 15px;
}

.search-input-wrapper i {
  color: #999;
  margin-right: 8px;
}

.search-input-wrapper input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 14px;
  color: #333;
}

.search-btn {
  margin-left: 12px;
  color: #07c160;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.search-results {
  min-height: calc(100vh - 110px);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  color: #999;
}

.empty-state i {
  font-size: 48px;
  margin-bottom: 15px;
}

.user-list {
  background: white;
  margin-top: 10px;
}

.user-item {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
}

.user-item:active {
  background: #fafafa;
}

.user-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 12px;
  flex-shrink: 0;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.user-id {
  font-size: 12px;
  color: #999;
}



.user-action {
  flex-shrink: 0;
}

.follow-btn {
  padding: 6px 16px;
  border-radius: 16px;
  border: none;
  font-size: 13px;
  cursor: pointer;
  background: #ff6633;
  color: white;
}

.follow-btn.followed {
  background: #f0f0f0;
  color: #999;
}

.no-more {
  text-align: center;
  padding: 15px;
  color: #ccc;
  font-size: 12px;
}
</style>
