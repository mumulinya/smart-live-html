<template>
  <div class="user-info-page" v-loading="pageLoading">
    <!-- Top Header Background -->
    <div class="profile-header">
       <!-- Nav Bar -->
       <div class="nav-bar">
          <div class="nav-left">
             <div class="add-friend-btn">
                <i class="el-icon-user"></i> 添加朋友
             </div>
          </div>
          <div class="nav-right">
             <div class="icon-btn search-icon"><i class="el-icon-search"></i></div>
             <div class="icon-btn menu-icon" @click="logout"><i class="el-icon-s-operation"></i></div>
          </div>
       </div>

       <!-- User Info Top (Avatar + Name) -->
       <div class="user-intro-top">
          <div class="avatar-wrapper">
             <img :src="user.icon || '/imgs/icons/default-icon.png'" class="avatar-img">
          </div>
          <div class="name-wrapper">
             <div class="nick-name">{{user.nickName || '未命名'}} <i class="el-icon-caret-bottom"></i></div>
             <div class="douyin-id">抖音号：{{user.phoneNumber || user.id || '未知'}} <i class="el-icon-document-copy"></i></div>
          </div>
       </div>
    </div>

    <!-- White Body Card -->
    <div class="profile-body-card">
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
          <div class="edit-btn" @click="toEdit">编辑主页</div>
       </div>

       <!-- Description -->
       <div class="user-desc">
          {{info.introduce || '填写简介，让大家更好地认识你'}}
       </div>

       <!-- Tags -->
       <div class="user-tags">
          <span class="tag" v-if="info.city">{{info.city}}</span>
          <span class="tag" v-else>未知城市</span>
          
          <span class="tag">{{getGenderText(info.gender)}} · {{getAge(info.birthday)}}岁</span>
          
          <span class="tag" v-if="info.school">{{info.school}}</span>
          <span class="tag" v-else>添加学校</span>
       </div>
       
       <!-- Content Tabs (Waterfall) -->
       <el-tabs v-model="activeTab" @tab-click="handleTabClick" class="profile-tabs" stretch>
          <el-tab-pane label="笔记" name="note">
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
                                   <svg t="1646634642977" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2187" width="14" height="14" style="margin-right: 2px;">
                                     <path d="M160 944c0 8.8-7.2 16-16 16h-32c-26.5 0-48-21.5-48-48V528c0-26.5 21.5-48 48-48h32c8.8 0 16 7.2 16 16v448zM96 416c-53 0-96 43-96 96v416c0 53 43 96 96 96h96c17.7 0 32-14.3 32-32V448c0-17.7-14.3-32-32-32H96zM505.6 64c16.2 0 26.4 8.7 31 13.9 4.6 5.2 12.1 16.3 10.3 32.4l-23.5 203.4c-4.9 42.2 8.6 84.6 36.8 116.4 28.3 31.7 68.9 49.9 111.4 49.9h271.2c6.6 0 10.8 3.3 13.2 6.1s5 7.5 4 14l-48 303.4c-6.9 43.6-29.1 83.4-62.7 112C815.8 944.2 773 960 728.9 960h-317c-33.1 0-59.9-26.8-59.9-59.9v-455c0-6.1 1.7-12 5-17.1 69.5-109 106.4-234.2 107-364h41.6z m0-64h-44.9C427.2 0 400 27.2 400 60.7c0 127.1-39.1 251.2-112 355.3v484.1c0 68.4 55.5 123.9 123.9 123.9h317c122.7 0 227.2-89.3 246.3-210.5l47.9-303.4c7.8-49.4-30.4-94.1-80.4-94.1H671.6c-50.9 0-90.5-44.4-84.6-95l23.5-203.4C617.7 55 568.7 0 505.6 0z" p-id="2188" :fill="b.isLike ? '#ff6633' : '#82848a'"></path>
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

          <el-tab-pane label="收藏" name="collection">
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
                                   <img :src="b.icon || user.icon || '/imgs/icons/default-icon.png'" class="card-avatar">
                                   <span class="card-name">{{ b.nickName || b.name || user.nickName }}</span>
                               </div>
                               <div class="card-likes">
                                   <svg class="icon" viewBox="0 0 1024 1024" width="14" height="14" style="margin-right: 2px;">
                                     <path d="M160 944c0 8.8-7.2 16-16 16h-32c-26.5 0-48-21.5-48-48V528c0-26.5 21.5-48 48-48h32c8.8 0 16 7.2 16 16v448zM96 416c-53 0-96 43-96 96v416c0 53 43 96 96 96h96c17.7 0 32-14.3 32-32V448c0-17.7-14.3-32-32-32H96zM505.6 64c16.2 0 26.4 8.7 31 13.9 4.6 5.2 12.1 16.3 10.3 32.4l-23.5 203.4c-4.9 42.2 8.6 84.6 36.8 116.4 28.3 31.7 68.9 49.9 111.4 49.9h271.2c6.6 0 10.8 3.3 13.2 6.1s5 7.5 4 14l-48 303.4c-6.9 43.6-29.1 83.4-62.7 112C815.8 944.2 773 960 728.9 960h-317c-33.1 0-59.9-26.8-59.9-59.9v-455c0-6.1 1.7-12 5-17.1 69.5-109 106.4-234.2 107-364h41.6z m0-64h-44.9C427.2 0 400 27.2 400 60.7c0 127.1-39.1 251.2-112 355.3v484.1c0 68.4 55.5 123.9 123.9 123.9h317c122.7 0 227.2-89.3 246.3-210.5l47.9-303.4c7.8-49.4-30.4-94.1-80.4-94.1H671.6c-50.9 0-90.5-44.4-84.6-95l23.5-203.4C617.7 55 568.7 0 505.6 0z" :fill="b.isLike ? '#ff6633' : '#82848a'"></path>
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
                                   <img :src="b.icon || user.icon || '/imgs/icons/default-icon.png'" class="card-avatar">
                                   <span class="card-name">{{ b.nickName || b.name || user.nickName }}</span>
                               </div>
                               <div class="card-likes">
                                   <!-- Reverted to Heart SVG as per user request -->
                                   <svg t="1646634642977" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2187" width="14" height="14" style="margin-right: 2px;">
                                     <path d="M160 944c0 8.8-7.2 16-16 16h-32c-26.5 0-48-21.5-48-48V528c0-26.5 21.5-48 48-48h32c8.8 0 16 7.2 16 16v448zM96 416c-53 0-96 43-96 96v416c0 53 43 96 96 96h96c17.7 0 32-14.3 32-32V448c0-17.7-14.3-32-32-32H96zM505.6 64c16.2 0 26.4 8.7 31 13.9 4.6 5.2 12.1 16.3 10.3 32.4l-23.5 203.4c-4.9 42.2 8.6 84.6 36.8 116.4 28.3 31.7 68.9 49.9 111.4 49.9h271.2c6.6 0 10.8 3.3 13.2 6.1s5 7.5 4 14l-48 303.4c-6.9 43.6-29.1 83.4-62.7 112C815.8 944.2 773 960 728.9 960h-317c-33.1 0-59.9-26.8-59.9-59.9v-455c0-6.1 1.7-12 5-17.1 69.5-109 106.4-234.2 107-364h41.6z m0-64h-44.9C427.2 0 400 27.2 400 60.7c0 127.1-39.1 251.2-112 355.3v484.1c0 68.4 55.5 123.9 123.9 123.9h317c122.7 0 227.2-89.3 246.3-210.5l47.9-303.4c7.8-49.4-30.4-94.1-80.4-94.1H671.6c-50.9 0-90.5-44.4-84.6-95l23.5-203.4C617.7 55 568.7 0 505.6 0z" p-id="2188" :fill="b.isLike ? '#ff6633' : '#82848a'"></path>
                                   </svg>
                                   {{b.liked || 0}}
                               </div>
                           </div>
                       </div>
                    </div>
                 </div>
                 <div v-if="feeds.length > 0 &&feedNoMore" class="no-more">没有更多了</div>
                 <div v-else-if="!feedLoading && feeds.length===0" class="empty-state">
                   <p>暂无动态</p>
                 </div>
             </div>
          </el-tab-pane>

          <el-tab-pane label="喜欢" name="likes">
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
                                   <img :src="b.icon || user.icon || '/imgs/icons/default-icon.png'" class="card-avatar">
                                   <span class="card-name">{{ b.nickName || b.name || user.nickName }}</span>
                               </div>
                               <div class="card-likes">
                                   <svg class="icon" viewBox="0 0 1024 1024" width="14" height="14" style="margin-right: 2px;">
                                     <path d="M160 944c0 8.8-7.2 16-16 16h-32c-26.5 0-48-21.5-48-48V528c0-26.5 21.5-48 48-48h32c8.8 0 16 7.2 16 16v448zM96 416c-53 0-96 43-96 96v416c0 53 43 96 96 96h96c17.7 0 32-14.3 32-32V448c0-17.7-14.3-32-32-32H96zM505.6 64c16.2 0 26.4 8.7 31 13.9 4.6 5.2 12.1 16.3 10.3 32.4l-23.5 203.4c-4.9 42.2 8.6 84.6 36.8 116.4 28.3 31.7 68.9 49.9 111.4 49.9h271.2c6.6 0 10.8 3.3 13.2 6.1s5 7.5 4 14l-48 303.4c-6.9 43.6-29.1 83.4-62.7 112C815.8 944.2 773 960 728.9 960h-317c-33.1 0-59.9-26.8-59.9-59.9v-455c0-6.1 1.7-12 5-17.1 69.5-109 106.4-234.2 107-364h41.6z m0-64h-44.9C427.2 0 400 27.2 400 60.7c0 127.1-39.1 251.2-112 355.3v484.1c0 68.4 55.5 123.9 123.9 123.9h317c122.7 0 227.2-89.3 246.3-210.5l47.9-303.4c7.8-49.4-30.4-94.1-80.4-94.1H671.6c-50.9 0-90.5-44.4-84.6-95l23.5-203.4C617.7 55 568.7 0 505.6 0z" :fill="b.isLike ? '#ff6633' : '#82848a'"></path>
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
                <p>暂无喜欢的笔记</p>
             </div>
          </el-tab-pane>
       </el-tabs>
    </div>

    <div class="footer-container">
      <foot-bar :active-btn="4"></foot-bar>
    </div>
  </div>
</template>

<script>
import FootBar from '@/components/FootBar.vue';
import { getCurrentUser, getFullUserInfo, getUserStats } from '@/api/user';
import { getMyBlogs, getFollowedFeeds } from '@/api/blog';
import { getShopCollections, uncollectShop, likeBlog, likeRecord, starList } from '@/api/interaction';

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
       feedNoMore: false
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
}

.user-info-page * {
    box-sizing: border-box;
}

/* Profile Header (Background) */
.profile-header {
    height: 280px;
    background: linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%);
    background: linear-gradient(180deg, #A7BFE8 0%, #6190E8 100%);
    position: relative;
    display: flex;
    flex-direction: column;
}

/* Nav Bar */
.nav-bar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    z-index: 100;
    color: white;
}

.nav-left .add-friend-btn {
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(4px);
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 14px;
    display: flex;
    align-items: center;
}

.nav-left .add-friend-btn i {
    margin-right: 4px;
}

.nav-right {
    display: flex;
    gap: 15px;
}

.icon-btn {
    width: 32px;
    height: 32px;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(4px);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
}

/* User Intro Top (Avatar + Name area) */
.user-intro-top {
    margin-top: 80px;
    /* Space from top */
    padding: 0 20px;
    display: flex;
    align-items: center;
}

.avatar-wrapper {
    position: relative;
    margin-right: 15px;
}

.avatar-img {
    width: 84px;
    height: 84px;
    border-radius: 50%;
    border: 2px solid white;
    object-fit: cover;
}

.name-wrapper {
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.nick-name {
    font-size: 22px;
    font-weight: bold;
    display: flex;
    align-items: center;
    margin-bottom: 6px;
}

.nick-name i {
    margin-left: 6px;
    font-size: 14px;
}

.douyin-id {
    font-size: 12px;
    opacity: 0.9;
    display: flex;
    align-items: center;
}

.douyin-id i {
    margin-left: 4px;
    cursor: pointer;
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
    padding: 15px 20px;
}

.stats-box {
    display: flex;
    gap: 24px;
}

.stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
}

.stat-item .num {
    font-size: 16px;
    font-weight: 600;
    color: #333;
}

.stat-item .label {
    font-size: 12px;
    color: #999;
    margin-top: 2px;
}

.edit-btn {
    border: 1px solid #ddd;
    border-radius: 20px;
    padding: 6px 16px;
    font-size: 13px;
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

</style>
