<template>
  <div class="user-info-page" v-loading="pageLoading">
    <!-- Immersive Cover -->
    <div class="profile-cover" :style="{ backgroundImage: `url(${user.cover || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80'})` }">
       <div class="cover-gradient"></div>
    </div>

    <!-- Transparent Nav -->
    <div class="nav-bar">
       <div class="nav-left">
          <div class="add-friend-btn" @click="toAddFriend">
             <i class="el-icon-user"></i> <span style="margin-left:4px">添加朋友</span>
          </div>
       </div>
       <div class="nav-right">
          <div class="icon-btn search-icon"><i class="el-icon-search"></i></div>
          <div class="icon-btn menu-icon" @click="logout"><i class="el-icon-s-operation"></i></div>
       </div>
    </div>

    <!-- White Body Card -->
    <div class="profile-body-card">
       
       <!-- Header Row: Avatar & Actions -->
       <div class="body-header-row">
           <div class="avatar-container" @click="showAvatarDialog = true">
               <img :src="user.icon || '/imgs/icons/default-icon.png'" class="avatar-img">
           </div>
           <div class="header-actions">
               <div class="edit-btn" @click="toEdit">编辑主页</div>
               <div class="settings-btn" @click="logout"><i class="el-icon-setting"></i></div>
           </div>
       </div>

       <!-- Basic Info -->
       <div class="basic-info-section">
           <div class="user-name">{{user.nickName || '未命名'}}</div>
           <div class="user-id">
               抖音号：{{user.phoneNumber || user.id || '未知'}} 
               <i class="el-icon-document-copy copy-icon"></i>
           </div>
           <div class="user-desc">
               {{info.introduce || '填写简介，让大家更好地认识你'}}
           </div>
           
           <!-- Tags -->
           <div class="user-tags">
               <div class="tag-list">
                   <span class="tag" v-if="info.city">{{info.city}}</span>
                   <span class="tag" v-if="info.gender || info.birthday">
                       {{getGenderText(info.gender)}} <span v-if="info.birthday">· {{getAge(info.birthday)}}岁</span>
                   </span>
                   <span class="tag" v-if="info.school">{{info.school}}</span>
                   
                   <!-- Show Add Info if missing essential info -->
                   <span class="tag add-tag" v-if="!info.city && !info.school && !info.birthday" @click="toEdit">
                       + 添加标签信息
                   </span>
               </div>
           </div>
       </div>

       <!-- Stats Row -->
       <div class="stats-action-row">
          <div class="stats-box">
             <div class="stat-item">
                <div class="num">{{stats.likeCount || 0}}</div>
                <div class="label">获赞</div>
             </div>

             <div class="stat-item" @click="toFollows">
                <div class="num">{{stats.followCount || 0}}</div>
                <div class="label">关注</div>
             </div>
             <div class="stat-item" @click="toFans">
                <div class="num">{{stats.fansCount || 0}}</div>
                <div class="label">粉丝</div>
             </div>
          </div>
       </div>

       <!-- Quick Actions -->
       <div class="quick-actions">
          <div class="action-item" @click="toOrders">
             <div class="action-icon"><i class="el-icon-tickets"></i></div>
             <div class="action-text">我的订单</div>
          </div>
          <div class="action-item" @click="toCollections">
             <div class="action-icon"><i class="el-icon-star-off"></i></div>
             <div class="action-text">我的收藏</div>
          </div>
          <div class="action-item" @click="toReviews">
             <div class="action-icon"><i class="el-icon-document-checked"></i></div>
             <div class="action-text">我的评价</div>
          </div>
       </div>
       
       <!-- Content Tabs (Waterfall) -->
       <el-tabs v-model="activeTab" @tab-click="handleTabClick" class="profile-tabs" stretch
                @touchstart.native="handleTouchStart" 
                @touchend.native="handleTouchEnd">
          <el-tab-pane name="note">
             <template #label>
                <span>笔记 {{stats.blogCount || 0}}</span>
             </template>
             <div class="waterfall-container">
                 <div class="waterfall-column" v-for="(col, i) in [0, 1]" :key="i">
                    <div class="waterfall-item" 
                         v-for="b in blogs.filter((_, index) => index % 2 === i)" 
                         :key="b.id"
                         @click="toBlogDetail(b)"
                    >
                       <div class="card-img-box">
                           <img :src="getFirstImage(b.images)" class="work-cover" loading="lazy" @error="handleImgError">
                       </div>
                       <div class="card-info">
                           <div class="card-title">{{ b.title }}</div>
                           <div class="card-bottom">
                               <div class="card-user">
                                   <img :src="user.icon || '/imgs/icons/default-icon.png'" class="card-avatar">
                                   <span class="card-name">{{ user.nickName }}</span>
                               </div>
                               <div class="card-likes">
                                   <!-- Reverted to Heart SVG as per user request -->
                                   <svg viewBox="0 0 24 24" width="14" height="14" style="margin-right: 2px;">
                                     <path :fill="b.isLike ? '#ff2442' : '#999'" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                                   </svg>
                                   {{b.liked || 0}}
                               </div>
                           </div>
                       </div>
                    </div>
                 </div>
             </div>
             
             <div v-if="blogs.length > 0 && blogNoMore" class="no-more">没有更多了</div>
             <div v-else-if="!blogLoading && blogs.length===0" class="empty-state">
                <div class="empty-icon"><i class="el-icon-edit-outline"></i></div>
                <div class="empty-text">快来发布第一篇笔记吧</div>
             </div>
          </el-tab-pane>

          <el-tab-pane name="collection">
             <template #label>
                <span>收藏 {{stats.blogStarCount || 0}}</span>
             </template>
             <div class="waterfall-container">
                 <div class="waterfall-column" v-for="(col, i) in [0, 1]" :key="i">
                    <div class="waterfall-item" 
                         v-for="b in collections.filter((_, index) => index % 2 === i)" 
                         :key="b.id"
                         @click="toBlogDetail(b)"
                    >
                       <div class="card-img-box">
                           <img :src="getFirstImage(b.images)" class="work-cover" loading="lazy" @error="handleImgError">
                       </div>
                       <div class="card-info">
                           <div class="card-title">{{ b.title }}</div>
                           <div class="card-bottom">
                               <div class="card-user">
                                   <img :src="b.userAvatar || user.icon || '/imgs/icons/default-icon.png'" class="card-avatar">
                                   <span class="card-name">{{ b.userName || user.nickName }}</span>
                               </div>
                               <div class="card-likes">
                                   <svg viewBox="0 0 24 24" width="14" height="14" style="margin-right: 2px;">
                                     <path :fill="b.isLike ? '#ff2442' : '#999'" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                                   </svg>
                                   {{b.liked || 0}}
                               </div>
                           </div>
                       </div>
                    </div>
                 </div>
             </div>
             <div v-if="collections.length > 0 && collectionNoMore" class="no-more">没有更多了</div>
             <div v-else-if="!collectionLoading && collections.length===0" class="empty-state">
                <p>暂无收藏</p>
             </div>
          </el-tab-pane>

          <el-tab-pane name="likes">
             <template #label>
                <span>喜欢 {{stats.blogLikeCount || 0}}</span>
             </template>
             <div class="waterfall-container">
                 <div class="waterfall-column" v-for="(col, i) in [0, 1]" :key="i">
                    <div class="waterfall-item" 
                         v-for="b in likes.filter((_, index) => index % 2 === i)" 
                         :key="b.id"
                         @click="toBlogDetail(b)"
                    >
                       <div class="card-img-box">
                           <img :src="getFirstImage(b.images)" class="work-cover" loading="lazy" @error="handleImgError">
                       </div>
                       <div class="card-info">
                           <div class="card-title">{{ b.title }}</div>
                           <div class="card-bottom">
                               <div class="card-user">
                                   <img :src="b.userAvatar || user.icon || '/imgs/icons/default-icon.png'" class="card-avatar">
                                   <span class="card-name">{{ b.userName || user.nickName }}</span>
                               </div>
                               <div class="card-likes">
                                   <!-- Reverted to Heart SVG as per user request -->
                                   <svg viewBox="0 0 24 24" width="14" height="14" style="margin-right: 2px;">
                                     <path :fill="b.isLike ? '#ff2442' : '#999'" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                                   </svg>
                                   {{b.liked || 0}}
                               </div>
                           </div>
                       </div>
                    </div>
                 </div>
             </div>
             <div v-if="likes.length > 0 && likeNoMore" class="no-more">没有更多了</div>
             <div v-else-if="!likeLoading && likes.length===0" class="empty-state">
               <p>暂无喜欢</p>
             </div>
          </el-tab-pane>

          <el-tab-pane label="动态" name="feed">
             <div class="waterfall-container">
                 <div class="waterfall-column" v-for="(col, i) in [0, 1]" :key="i">
                    <div class="waterfall-item" 
                         v-for="b in feeds.filter((_, index) => index % 2 === i)" 
                         :key="b.id"
                         @click="toBlogDetail(b)"
                    >
                       <div class="card-img-box">
                           <img :src="getFirstImage(b.images)" class="work-cover" loading="lazy" @error="handleImgError">
                       </div>
                       <div class="card-info">
                           <div class="card-title">{{ b.title }}</div>
                           <div class="card-bottom">
                               <div class="card-user">
                                   <img :src="b.userAvatar || user.icon || '/imgs/icons/default-icon.png'" class="card-avatar">
                                   <span class="card-name">{{ b.userName || user.nickName }}</span>
                               </div>
                               <div class="card-likes">
                                   <svg viewBox="0 0 24 24" width="14" height="14" style="margin-right: 2px;">
                                     <path :fill="b.isLike ? '#ff2442' : '#999'" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                                   </svg>
                                   {{b.liked || 0}}
                               </div>
                           </div>
                       </div>
                    </div>
                 </div>
             </div>
             <div v-if="feeds.length > 0 && feedNoMore" class="no-more">没有更多了</div>
             <div v-else-if="!feedLoading && feeds.length===0" class="empty-state">
                <p>暂无动态</p>
             </div>
          </el-tab-pane>
       </el-tabs>
    </div>

    <div class="footer-container">
      <foot-bar :active-btn="4"></foot-bar>
    </div>

    <!-- Avatar Dialog (Bottom Sheet) -->
    <div class="avatar-dialog-overlay" v-if="showAvatarDialog" @click="showAvatarDialog = false">
       <div class="avatar-dialog-content" @click.stop>
          <div class="avatar-dialog-close" @click="showAvatarDialog = false"><i class="el-icon-close"></i></div>
          <div class="avatar-preview">
             <img :src="user.icon || '/imgs/icons/default-icon.png'" class="avatar-big">
          </div>
          <div class="avatar-dialog-actions">
             <div class="action-item" @click="handleChangeAvatar">
                <i class="el-icon-edit"></i>
                <span>更换头像</span>
                <i class="el-icon-arrow-right"></i>
             </div>
             <div class="action-item" @click="handleSaveAvatar">
                <i class="el-icon-download"></i>
                <span>保存头像</span>
                <i class="el-icon-arrow-right"></i>
             </div>
          </div>
       </div>
    </div>

    <!-- Hidden file input for avatar upload -->
    <input type="file" ref="avatarInput" accept="image/*" @change="onAvatarSelected" style="display:none">
  </div>
</template>

<script>
import FootBar from '@/components/FootBar.vue';
import { getCurrentUser, getFullUserInfo, getUserStats, uploadFile, updateUser } from '@/api/user';
import { getMyBlogs, getFollowedFeeds } from '@/api/blog';
import { getShopCollections, uncollectShop, likeBlog, likeRecord, starList } from '@/api/interaction';
import { filePrefix } from '@/utils/request';

export default {
  name: 'UserInfo',
  components: { FootBar },
  data() {
    return {
       user: {},
       info: {},
       stats: { likeCount: 0, fansCount: 0, followCount: 0 },
       activeTab: 'note',
       pageLoading: false,
       
       // Blog Data
       blogs: [],
       blogCurrent: 1,
       blogLoading: false,
       blogNoMore: false,

       // Collection Data
       collections: [],
       collectionCurrent: 1,
       collectionLoading: false,
       collectionNoMore: false,

       // Likes Data
       likes: [],
       likeCurrent: 1,
       likeLoading: false,
       likeNoMore: false,

       // Feed Data
       feeds: [],
       feedParams: { minTime: 0, offset: 0 },
       feedLoading: false,
       feedNoMore: false,
       
       // Avatar Dialog
       showAvatarDialog: false,
       
       // Touch Swipe
       touchStartX: 0,
       tabOrder: ['note', 'collection', 'likes', 'feed']
    }
  },
  created() {
     // Check token first
     const token = localStorage.getItem('token');
     if (!token) {
        this.$router.push('/user/login');
        return;
     }
     this.queryUser();
     this.loadTabData('note');
  },
  methods: {
     goBack() {
        this.$router.go(-1);
     },
     toAddFriend() {
        this.$router.push('/user/add-friend');
     },
     logout() {
        this.$confirm('确定要退出登录吗？', '提示', { 
            type: 'warning',
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            center: true
        }).then(() => {
            localStorage.removeItem("token");
            localStorage.removeItem("userInfo");
            this.$router.push('/user/login');
        }).catch(() => {});
     },
     toEdit() {
        this.$router.push('/user/edit');
     },
     toOrders() {
        this.$router.push('/order/list'); 
     },
     toFollows() {
        this.$router.push('/user/follows');
     },
     toFans() {
        this.$router.push('/user/fans');
     },
     toCollections() {
        // 切换到收藏tab
        this.activeTab = 'collection';
        this.loadTabData('collection');
     },
     toMessages() {
        this.$router.push('/chat/list');
     },
     toService() {
        this.$message.info('客服功能开发中');
     },
     
     // Touch Swipe handlers
     handleTouchStart(e) {
        this.touchStartX = e.touches[0].clientX;
     },
     handleTouchEnd(e) {
        const touchEndX = e.changedTouches[0].clientX;
        const diff = this.touchStartX - touchEndX;
        const threshold = 50; // Minimum swipe distance
        
        if (Math.abs(diff) < threshold) return;
        
        const currentIndex = this.tabOrder.indexOf(this.activeTab);
        
        if (diff > 0) {
           // Swipe left -> next tab
           if (currentIndex < this.tabOrder.length - 1) {
              this.activeTab = this.tabOrder[currentIndex + 1];
              this.loadTabData(this.activeTab);
           }
        } else {
           // Swipe right -> previous tab
           if (currentIndex > 0) {
              this.activeTab = this.tabOrder[currentIndex - 1];
              this.loadTabData(this.activeTab);
           }
        }
     },
     
     // Data Query
     queryUser() {
        this.pageLoading = true;
        getCurrentUser().then(res => {
           let userData = res.data || res;
           if (userData && userData.data) userData = userData.data;
           
           // Check if user data is valid
           if (!userData || !userData.id) {
              this.$message.error("登录已失效，请重新登录");
              localStorage.removeItem("token");
              this.$router.push("/user/login");
              return;
           }
           
           this.user = userData;
           if(this.user.icon) this.user.icon = this.$fileURL + this.user.icon;
            this.queryUserInfo();
            this.queryUserStats();
         }).catch(err => {
            console.error(err);
            // Redirect to login on any auth error
            this.$message.error("登录失效，请重新登录");
            localStorage.removeItem("token");
            this.$router.push("/user/login");
         }).finally(() => {
            this.pageLoading = false;
         });
     },
     queryUserInfo() {
        if(!this.user.id) return;
        getFullUserInfo(this.user.id).then(res => {
           this.info = res.data || {};
        });
     },
     queryUserStats() {
        if(!this.user.id) return;
        getUserStats(this.user.id).then(res => {
           this.stats = res.data || { likeCount: 0, fansCount: 0, followCount: 0 };
        });
     },

     // Tabs
     handleTabClick(tab) {
        this.loadTabData(tab.paneName);
     },
     formatCount(n) {
        return n > 99 ? '99+' : n;
     },
     loadTabData(tabName) {
        if(tabName === 'note' && this.blogs.length === 0) this.queryBlogs();
        if(tabName === 'collection' && this.collections.length === 0) this.queryCollections();
        if(tabName === 'feed' && this.feeds.length === 0) this.queryFeeds();
        if(tabName === 'likes' && this.likes.length === 0) this.loadLikes();
     },

     // Blog Logic
     queryBlogs() {
        if(this.blogLoading) return; // Prevent duplicate requests
        this.blogCurrent = 1;
        this.blogLoading = true;
        this.blogNoMore = false;
        getMyBlogs({ current: this.blogCurrent }).then(res => {
           const list = res.data || res || [];
           this.blogs = list.map(this.processBlog);
           if(list.length < 10) this.blogNoMore = true;
        }).finally(() => this.blogLoading = false);
     },
     loadMoreBlogs() {
         if(this.blogLoading || this.blogNoMore) return;
         this.blogLoading = true;
         this.blogCurrent++;
         getMyBlogs({ current: this.blogCurrent }).then(res => {
             const list = res.data || res || [];
             if(list.length > 0) {
                 this.blogs = [...this.blogs, ...list.map(this.processBlog)];
             }
             if(list.length < 10) this.blogNoMore = true;
         }).catch(() => {
             this.blogCurrent--;
         }).finally(() => this.blogLoading = false);
     },
     processBlog(b) {
        return {
           ...b,
           icon: b.icon ? this.$fileURL + b.icon : '',
           userAvatar: b.userAvatar ? this.$fileURL + b.userAvatar : '',
           images: b.images,
        };
     },
     
     // Collection Logic (Using starList for notes)
     queryCollections() {
        if(this.collectionLoading) return;
        this.collectionCurrent = 1;
        this.collectionLoading = true;
        this.collectionNoMore = false;
        // sourceType=3 for blogs
        starList({ userId: this.user.id, sourceType: 3, current: this.collectionCurrent, size: 10 }).then(res => {
           let list = res.data || res || [];
           if(list.records) list = list.records;
           
           this.collections = list.map(this.processBlog); // Reuse processBlog as they are blogs
           if(list.length < 10) this.collectionNoMore = true;
        }).finally(() => this.collectionLoading = false);
     },
     loadMoreCollections() {
         if(this.collectionLoading || this.collectionNoMore) return;
         this.collectionLoading = true;
         this.collectionCurrent++;
         starList({ userId: this.user.id, sourceType: 3, current: this.collectionCurrent, size: 10 }).then(res => {
             let list = res.data || res || [];
             if(list.records) list = list.records;
             
             if(list.length > 0) {
                 this.collections = [...this.collections, ...list.map(this.processBlog)];
             }
             if(list.length < 10) this.collectionNoMore = true;
         }).catch(() => {
             this.collectionCurrent--;
         }).finally(() => this.collectionLoading = false);
     },
     
     // Likes Logic
     loadLikes() {
        if(this.likeLoading) return;
        this.likeCurrent = 1;
        this.likeLoading = true;
        this.likeNoMore = false;
        likeRecord({ userId: this.user.id, sourceType: 3, current: this.likeCurrent, size: 10 }).then(res => {
            let list = res.data || res || [];
            if(list.records) list = list.records;
            
            this.likes = list.map(this.processBlog);
            if(list.length < 10) this.likeNoMore = true;
        }).finally(() => this.likeLoading = false);
     },
     loadMoreLikes() {
        if(this.likeLoading || this.likeNoMore) return;
        this.likeLoading = true;
        this.likeCurrent++;
        likeRecord({ userId: this.user.id, sourceType: 3, current: this.likeCurrent, size: 10 }).then(res => {
            let list = res.data || res || [];
            if(list.records) list = list.records;
            
            if(list.length > 0) {
                this.likes = [...this.likes, ...list.map(this.processBlog)];
            }
            if(list.length < 10) this.likeNoMore = true;
        }).catch(() => {
            this.likeCurrent--;
        }).finally(() => this.likeLoading = false);
     },

     processShop(s) {
         // kept for reference or if implementation changes back
         return s;
     },
     uncollectShop(shopId) {
        // ... (unused for now if replacing with blogs)
     },

     // Feed Logic
     queryFeeds() {
        if(this.feedLoading) return;
        this.feedLoading = true;
        this.feedNoMore = false;
        this.feedParams.minTime = new Date().getTime();
        this.feedParams.offset = 0;
        const lastId = this.feedParams.minTime;
        getFollowedFeeds({ offset: 0, lastId }).then(res => {
           const data = res.data || res || {};
           const list = data.list || [];
           this.feeds = list.map(this.processBlog);
           this.feedParams.minTime = data.minTime;
           this.feedParams.offset = data.offset;
           if(list.length < 10) this.feedNoMore = true; // Assuming page size roughly 10
        }).finally(() => this.feedLoading = false);
     },
     loadMoreFeeds() {
         if(this.feedLoading || this.feedNoMore) return;
         this.feedLoading = true;
         const lastId = this.feedParams.minTime || new Date().getTime();
         getFollowedFeeds({ offset: this.feedParams.offset, lastId }).then(res => {
            const data = res.data || res || {};
            const list = data.list || [];
            if(list.length > 0) {
                this.feeds = [...this.feeds, ...list.map(this.processBlog)];
                this.feedParams.minTime = data.minTime;
                this.feedParams.offset = data.offset;
            } else {
                this.feedNoMore = true;
            }
         }).finally(() => this.feedLoading = false);
     },
     toggleLike(b) {
        if(!this.user.id) return this.$router.push('/user/login');
        
        const originalLike = b.isLike;
        const originalCount = b.liked;
        
        b.isLike = !b.isLike;
        b.liked = b.isLike ? (b.liked + 1) : (b.liked - 1);
        
        likeBlog({ sourceType: 3, sourceId: b.id }).catch(() => {
           b.isLike = originalLike;
           b.liked = originalCount;
           this.$message.error('操作失败');
        });
     },

     // Helpers
     getFirstImage(images) {
        if(!images) return 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"><rect fill="%23f0f0f0" width="200" height="150"/><text x="100" y="75" font-size="14" fill="%23999" text-anchor="middle" dominant-baseline="middle">暂无图片</text></svg>';
        let img = '';
        if(Array.isArray(images)) {
            img = images[0];
        } else {
            img = images.split(',')[0];
        }
        
        if(!img) return 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"><rect fill="%23f0f0f0" width="200" height="150"/><text x="100" y="75" font-size="14" fill="%23999" text-anchor="middle" dominant-baseline="middle">暂无图片</text></svg>';
        if(img.startsWith('http')) return img;
        return this.$fileURL + img;
     },
     handleImgError(e) {
        e.target.onerror = null; // Prevent infinite loop
        e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"><rect fill="%23f0f0f0" width="200" height="150"/><text x="100" y="75" font-size="14" fill="%23999" text-anchor="middle" dominant-baseline="middle">图片加载失败</text></svg>';
     },
     formatDistance(d) {
        return d < 1000 ? d.toFixed(1) + 'm' : (d/1000).toFixed(1) + 'km';
     },
     getGenderText(g) {
        return g === 1 ? '男' : (g === 2 ? '女' : '未知');
     },
     getAge(birthday) {
        if(!birthday) return 18; // Default or calculate
        const ageDifMs = Date.now() - new Date(birthday).getTime();
        const ageDate = new Date(ageDifMs);
        return Math.abs(ageDate.getUTCFullYear() - 1970);
     },
     formatTime(time) {
        if(!time) return '';
        const d = new Date(time);
        const y = d.getFullYear();
        const m = (d.getMonth()+1).toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');
        return `${y}-${m}-${day}`;
     },
     toBlogDetail(b) {
        this.$router.push({ path: '/blog/detail', query: { id: b.id } });
     },
     toShopDetail(s) {
        this.$router.push({ path: '/shop/detail', query: { id: s.id } });
     },

     onScroll(e, type) {
        const { scrollTop, clientHeight, scrollHeight } = e.target;
        if(scrollTop + clientHeight >= scrollHeight - 50) {
           if(type === 'note' && !this.blogLoading && !this.blogNoMore) this.loadMoreBlogs();
           if(type === 'collection' && !this.collectionLoading && !this.collectionNoMore) this.loadMoreCollections();
           if(type === 'likes' && !this.likeLoading && !this.likeNoMore) this.loadMoreLikes();
           if(type === 'feed' && !this.feedLoading && !this.feedNoMore) this.loadMoreFeeds();
        }
     },
     
     // Avatar methods
     handleChangeAvatar() {
        this.$refs.avatarInput.click();
     },
     onAvatarSelected(e) {
        const file = e.target.files[0];
        if(!file) return;
        
        // Check file size (max 2MB)
        if(file.size > 2 * 1024 * 1024) {
           this.$message.error('图片大小不能超过2MB');
           return;
        }
        
        const formData = new FormData();
        formData.append('file', file);
        
        this.pageLoading = true;
        
        // Step 1: Upload file
        uploadFile(formData).then(res => {
           const path = res.data || res;
           
           // Process path - remove filePrefix if present
           let savePath = path;
           if (path.includes(filePrefix)) {
              savePath = path.split(filePrefix)[1];
           }
           
           // Step 2: Update user icon
           updateUser({ id: this.user.id, icon: savePath }).then(() => {
              this.$message.success('头像修改成功');
              this.showAvatarDialog = false;
              this.user.icon = this.$fileURL + savePath;
           }).catch(() => {
              this.$message.error('更新头像失败');
           });
        }).catch(() => {
           this.$message.error('上传失败');
        }).finally(() => {
           this.pageLoading = false;
        });
        
        e.target.value = ''; // Reset input
     },
     handleSaveAvatar() {
        if(!this.user.icon) {
           this.$message.warning('暂无头像可保存');
           return;
        }
        
        // Create a temporary link to download the image
        const link = document.createElement('a');
        link.href = this.user.icon;
        link.download = 'avatar.jpg';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.$message.success('头像保存中...');
     }
  }
}
</script>
<style scoped>

/* Page Layout */
.user-info-page {
    min-height: 100vh;
    background: #fff;
    padding-bottom: 60px;
    box-sizing: border-box;
    position: relative;
    overflow-x: hidden;
}

.user-info-page * {
    box-sizing: border-box;
}

/* Immersive Cover */
.profile-cover {
    height: 250px;
    background-size: cover;
    background-position: center;
    position: relative;
}
.cover-gradient {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 80px;
    background: linear-gradient(to top, rgba(0,0,0,0.3), transparent);
}

/* Nav Bar */
.nav-bar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 60px; /* Taller for mobile status bar area */
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 16px 0 16px;
    z-index: 100;
    color: white;
    /* Transparent by default */
}

.nav-left .add-friend-btn {
    background: rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(4px);
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 14px;
    display: flex;
    align-items: center;
    color: white;
    border: 0.5px solid rgba(255,255,255,0.2);
}

.nav-right {
    display: flex;
    gap: 12px;
}

.icon-btn {
    width: 34px;
    height: 34px;
    background: rgba(0, 0, 0, 0.2); 
    backdrop-filter: blur(4px);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    border: 0.5px solid rgba(255,255,255,0.2);
}

/* Profile Body Card */
.profile-body-card {
    position: relative;
    margin-top: -15px; /* Slight overlap */
    background: white;
    border-radius: 16px 16px 0 0;
    padding: 0 16px;
    min-height: 500px; /* ensure white bg covers bottom */
    z-index: 10;
}

/* Header Row: Avatar & Actions */
.body-header-row {
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 12px;
    height: 50px; /* Placeholder for overlap calculation */
}

.avatar-container {
    position: absolute;
    left: 0;
    bottom: 0; /* Align with bottom of this row container */
    width: 90px;
    height: 90px;
    border-radius: 50%;
    padding: 3px;
    background: white; /* White border effect */
    top: -40px; /* Move up to overlap cover */
    z-index: 12;
}

.avatar-img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
}

.header-actions {
    margin-left: auto; /* Push to right */
    display: flex;
    align-items: center;
    gap: 8px;
    padding-top: 10px;
}

.edit-btn {
    border: 1px solid #ddd;
    border-radius: 20px;
    padding: 6px 16px;
    font-size: 14px;
    color: #333;
    font-weight: 500;
}
.settings-btn {
    border: 1px solid #ddd;
    border-radius: 20px;
    padding: 6px 12px;
    font-size: 16px;
    color: #333;
    display: flex; 
    align-items: center;
}

/* Basic Info Section */
.basic-info-section {
    margin-bottom: 15px;
}

.user-name {
    font-size: 22px;
    font-weight: bold;
    color: #000;
    margin-bottom: 4px;
}

.user-id {
    font-size: 12px;
    color: #666;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 4px;
}
.copy-icon { font-size: 12px; cursor: pointer; }

.user-desc {
    font-size: 14px;
    color: #333;
    line-height: 1.5;
    margin-bottom: 12px;
    white-space: pre-wrap;
}

/* Tags */
.user-tags {
    display: flex;
    flex-wrap: wrap;
    margin-bottom: 5px;
}
.tag-list { display: flex; gap: 6px; flex-wrap: wrap; }
.tag {
    background: #f2f2f2;
    color: #666;
    font-size: 11px;
    padding: 4px 8px;
    border-radius: 4px;
}
.add-tag {
    color: #999;
    border: 1px dashed #ddd;
    background: transparent;
}

/* Stats Row */
.stats-action-row {
    margin-bottom: 20px;
}
.stats-box {
    display: flex;
    justify-content: space-around;
    width: 100%;
}

.stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
}

.stat-item .num {
    font-size: 18px;
    font-weight: bold;
    color: #000;
}

.stat-item .label {
    font-size: 13px;
    color: #999;
}

/* Keeping Tabs & Quick Actions as is */
.quick-actions {
    display: flex;
    justify-content: space-between;
    background: #fff;
    padding: 5px 10px 20px 10px; 
}
.action-item {
   display: flex;
   flex-direction: column;
   align-items: center;
   cursor: pointer;
}
.action-icon {
   width: 40px;
   height: 40px;
   background: #f8f8f8; /* Softer circle bg */
   border-radius: 50%;
   display: flex;
   align-items: center;
   justify-content: center;
   margin-bottom: 6px;
}
.action-icon i {
   font-size: 20px;
   color: #ff2442;
}
.action-text {
   font-size: 12px;
   color: #666;
}

.profile-tabs >>> .el-tabs__nav-wrap::after {
    height: 0.5px;
    background-color: #f1f1f1;
}
.profile-tabs >>> .el-tabs__active-bar {
    background-color: #ff2442;
    height: 3px;
    border-radius: 3px;
}
.profile-tabs >>> .el-tabs__item {
    font-weight: 500;
    color: #999;
}
.profile-tabs >>> .el-tabs__item.is-active {
    color: #333;
    font-weight: bold;
    font-size: 16px;
}


/* White Body Card */
.profile-body-card {
    background: #fff;
    border-radius: 16px 16px 0 0;
    margin-top: 20px;
    /* Overlap header slightly or push down */
    position: relative;
    flex: 1;
    display: flex;
    flex-direction: column;
    padding-bottom: 20px;
}

/* Stats Row */
.stats-action-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px;
}



.stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
}

.stat-item .num {
    font-size: 20px;
    font-weight: 600;
    color: #333;
}

.stat-item .label {
    font-size: 13px;
    color: #999;
    margin-top: 4px;
}

.edit-btn {
    border: 1px solid #ddd;
    border-radius: 20px;
    padding: 8px 20px;
    font-size: 14px;
    color: #333;
    cursor: pointer;
}

/* Description */
.user-desc {
    padding: 0 20px;
    font-size: 14px;
    color: #333;
    line-height: 1.5;
    margin-bottom: 15px;
}

/* Tags */
.user-tags {
    padding: 0 20px;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 10px;
}

.tag {
    background: #f5f5f5;
    color: #666;
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 4px;
}

/* Quick Actions */
.quick-actions {
    display: flex;
    justify-content: space-around;
    padding: 15px 20px;
    margin: 10px 0;
    background: #fafafa;
    border-radius: 12px;
    margin-left: 15px;
    margin-right: 15px;
}

.quick-actions .action-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
}

.quick-actions .action-icon {
    width: 44px;
    height: 44px;
    background: white;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 6px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.quick-actions .action-icon i {
    font-size: 20px;
    color: #ff6633;
}

.quick-actions .action-text {
    font-size: 12px;
    color: #666;
}

/* Tabs */
.profile-tabs>>>.el-tabs__nav-wrap::after {
    height: 0;
    /* Remove divider */
}

.profile-tabs>>>.el-tabs__active-bar {
    background-color: #333;
    height: 3px;
    border-radius: 1.5px;
}

.profile-tabs>>>.el-tabs__item {
    font-size: 16px;
    color: #999;
    font-weight: 500;
}

.profile-tabs>>>.el-tabs__item.is-active {
    color: #333;
    font-weight: 600;
}

/* Waterfall Layout */
.waterfall-container {
    padding: 10px;
    display: flex;
    align-items: flex-start;
    gap: 10px;
    background: #f9f9f9;
    min-height: 400px;
}

.waterfall-column {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.waterfall-item {
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
    cursor: pointer;
}

.card-img-box {
    width: 100%;
}

.work-cover {
    width: 100%;
    display: block;
}

.card-info {
    padding: 8px 10px 12px;
}


.card-title {
    font-size: 14px;
    color: #333;
    line-height: 1.4;
    margin-bottom: 8px;

    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    text-overflow: ellipsis;
    min-height: 38px; /* Enforce min-height to align cards with short titles */
}

.card-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.card-user {
    display: flex;
    align-items: center;
    overflow: hidden;
    height: 16px; /* Fix height */
}

.card-avatar {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    margin-right: 4px;
    flex-shrink: 0;
    object-fit: cover; /* Ensure no distortion */
}

.card-name {
    font-size: 10px;
    color: #999;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 80px;
}

.card-likes {
    font-size: 10px;
    color: #999;
    display: flex;
    align-items: center;
    height: 16px; /* Align with user info */
}

.card-likes i {
    margin-right: 2px;
}

/* Shop Card specific tweak */
.card-rating {
    transform: scale(0.8);
    transform-origin: left center;
}

.card-price {
    font-size: 11px;
    color: #666;
}

.empty-state {
    text-align: center;
    padding: 60px 0;
    color: #999;
}

.empty-icon {
    width: 80px;
    height: 80px;
    background: #f5f5f5;
    border-radius: 50%;
    margin: 0 auto 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    color: #ccc;
}

.empty-text {
    font-size: 14px;
}

.no-more {
    text-align: center;
    padding: 15px;
    color: #ccc;
    font-size: 12px;
}

.footer-container {
    height: 60px;
}

/* Avatar Dialog Styles */
.avatar-dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.85);
    z-index: 9999;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
}

.avatar-dialog-content {
    background: #1a1a1a;
    border-radius: 16px 16px 0 0;
    padding-bottom: env(safe-area-inset-bottom, 20px);
    position: relative;
}

.count-badge {
    background: #ff6633;
    color: white;
    padding: 0 5px;
    border-radius: 10px;
    font-size: 10px;
    margin-left: 2px;
    vertical-align: middle;
}

.avatar-dialog-close {
    position: fixed;
    top: 20px;
    left: 20px;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 24px;
    cursor: pointer;
    z-index: 10000;
}

.avatar-preview {
    position: absolute;
    top: -420px;
    left: 0;
    right: 0;
    height: 400px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
}

.avatar-big {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 0;
}

.avatar-dialog-actions {
    padding: 15px 0;
}

.avatar-dialog-actions .action-item {
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 16px 20px;
    color: #fff;
    font-size: 16px;
    cursor: pointer;
    transition: background 0.2s;
}

.avatar-dialog-actions .action-item:active {
    background: rgba(255, 255, 255, 0.1);
}

.avatar-dialog-actions .action-item i:first-child {
    font-size: 20px;
    margin-right: 15px;
    color: #ccc;
}

.avatar-dialog-actions .action-item span {
    flex: 1;
}

.avatar-dialog-actions .action-item i:last-child {
    color: #666;
}

.avatar-wrapper {
    position: relative;
    margin-right: 15px;
    cursor: pointer;
}

</style>
