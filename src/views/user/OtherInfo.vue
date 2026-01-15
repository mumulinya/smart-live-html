<template>
  <div class="other-info-page" v-loading="isLoading">
    <div class="page-header">
      <div class="header-back-btn" @click="goBack"><i class="el-icon-arrow-left"></i></div>
      <div class="header-title">用户详情</div>
    </div>

    <!-- Basic Info -->
    <div class="user-basic">
      <div class="user-avatar-box">
        <img :src="user.icon || '/imgs/icons/default-icon.png'" @error="handleImgError" alt="用户头像">
      </div>
      <div class="user-info-box">
        <div class="name">{{ user.nickName || '未知用户' }}</div>
        <span>{{info.city||'未知城市'}}</span>
      </div>
      <div class="action-buttons" v-if="user.id && String(user.id) !== String(loginUser.id)">
         <button class="action-btn logout-btn" @click="handleFollow">
           {{ user.isFollow ? '取消关注' : '关注' }}
         </button>
         <button class="action-btn message-btn" @click="handleMessage">
           私信
         </button>
      </div>
    </div>

    <div class="user-introduce">
      <span>{{ info.introduce || '这个人很懒，什么都没有留下' }}</span>
    </div>

    <!-- Stats -->
    <div class="stats-card">
      <div class="stat-item" @click="toFans">
        <div class="stat-value">{{ stats.fansCount||0 }}</div>
        <div class="stat-label">粉丝</div>
      </div>
      <div class="stat-item" @click="toFollows">
        <div class="stat-value">{{ stats.followCount||0 }}</div>
        <div class="stat-label">关注</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ stats.likeCount||0 }}</div>
        <div class="stat-label">获赞</div>
      </div>
    </div>
    


    <!-- Tabs -->
    <div class="tabs-container">
      <div class="custom-tabs-header">
        <div class="custom-tabs-nav">
          <div class="custom-tab-item" :class="{active: activeTab==='note'}" @click="switchTab('note')">
            <div class="tab-text">笔记 <span v-if="stats.blogCount > 0" class="count-badge">{{formatCount(stats.blogCount)}}</span></div>
          </div>
          <div class="custom-tab-item" :class="{active: activeTab==='collection'}" @click="switchTab('collection')">
            <div class="tab-text">收藏 <span v-if="stats.collectCount > 0" class="count-badge">{{formatCount(stats.collectCount)}}</span></div>
          </div>
          <div class="custom-tab-item" :class="{active: activeTab==='like'}" @click="switchTab('like')">
            <div class="tab-text">赞过 <span v-if="stats.likeCount > 0" class="count-badge">{{formatCount(stats.likeCount)}}</span></div>
          </div>
        </div>
      </div>

      <div class="custom-tabs-content">
          <!-- Notes Tab -->
          <div v-if="activeTab==='note'" class="tab-pane" v-infinite-scroll="loadMoreNotes" :infinite-scroll-disabled="noteLoading || noteNoMore">
             <div v-if="notes.length > 0" class="waterfall-container">
                 <div class="waterfall-column" v-for="(col, i) in [0, 1]" :key="i">
                    <div class="waterfall-item" 
                         v-for="b in notes.filter((_, index) => index % 2 === i)" 
                         :key="b.id"
                         @click="toNoteDetail(b)"
                    >
                       <div class="card-img-box">
                           <img :src="getImage(b.images)" class="work-cover" loading="lazy" @error="handleImgError">
                       </div>
                       <div class="card-info">
                           <div class="card-title">{{ b.title }}</div>
                           <div class="card-bottom">
                               <div class="card-user">
                                   <img :src="user.icon || '/imgs/icons/default-icon.png'" class="card-avatar">
                                   <span class="card-name">{{ user.nickName }}</span>
                               </div>
                               <div class="card-likes">
                                   <svg t="1646634642977" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2187" width="14" height="14" style="margin-right: 2px;">
                                     <path d="M160 944c0 8.8-7.2 16-16 16h-32c-26.5 0-48-21.5-48-48V528c0-26.5 21.5-48 48-48h32c8.8 0 16 7.2 16 16v448zM96 416c-53 0-96 43-96 96v416c0 53 43 96 96 96h96c17.7 0 32-14.3 32-32V448c0-17.7-14.3-32-32-32H96zM505.6 64c16.2 0 26.4 8.7 31 13.9 4.6 5.2 12.1 16.3 10.3 32.4l-23.5 203.4c-4.9 42.2 8.6 84.6 36.8 116.4 28.3 31.7 68.9 49.9 111.4 49.9h271.2c6.6 0 10.8 3.3 13.2 6.1s5 7.5 4 14l-48 303.4c-6.9 43.6-29.1 83.4-62.7 112C815.8 944.2 773 960 728.9 960h-317c-33.1 0-59.9-26.8-59.9-59.9v-455c0-6.1 1.7-12 5-17.1 69.5-109 106.4-234.2 107-364h41.6z m0-64h-44.9C427.2 0 400 27.2 400 60.7c0 127.1-39.1 251.2-112 355.3v484.1c0 68.4 55.5 123.9 123.9 123.9h317c122.7 0 227.2-89.3 246.3-210.5l47.9-303.4c7.8-49.4-30.4-94.1-80.4-94.1H671.6c-50.9 0-90.5-44.4-84.6-95l23.5-203.4C617.7 55 568.7 0 505.6 0z" :fill="b.isLike ? '#ff6633' : '#82848a'"></path>
                                   </svg>
                                   {{b.liked||0}}
                               </div>
                           </div>
                       </div>
                    </div>
                 </div>
             </div>
             <div v-else-if="!noteLoading" class="empty-state">还没有发布任何笔记</div>
             <div v-else class="loading-state"><i class="el-icon-loading"></i> 加载中...</div>
          </div>

          <!-- Collections Tab -->
          <div v-if="activeTab==='collection'" class="tab-pane" v-infinite-scroll="loadMoreCollections" :infinite-scroll-disabled="collectionLoading || collectionNoMore">
             <div v-if="collections.length > 0" class="waterfall-container">
                 <div class="waterfall-column" v-for="(col, i) in [0, 1]" :key="i">
                    <div class="waterfall-item" 
                         v-for="b in collections.filter((_, index) => index % 2 === i)" 
                         :key="b.id"
                         @click="toNoteDetail(b)"
                    >
                       <div class="card-img-box">
                           <img :src="getImage(b.images)" class="work-cover" loading="lazy">
                       </div>
                       <div class="card-info">
                           <div class="card-title">{{ b.title }}</div>
                           <div class="card-bottom">
                               <div class="card-user">
                                   <img :src="b.icon || '/imgs/icons/default-icon.png'" class="card-avatar">
                                   <span class="card-name">{{ b.nickName || b.name }}</span>
                               </div>
                               <div class="card-likes">
                                   <svg class="icon" viewBox="0 0 1024 1024" width="14" height="14" style="margin-right: 2px;">
                                     <path d="M160 944c0 8.8-7.2 16-16 16h-32c-26.5 0-48-21.5-48-48V528c0-26.5 21.5-48 48-48h32c8.8 0 16 7.2 16 16v448zM96 416c-53 0-96 43-96 96v416c0 53 43 96 96 96h96c17.7 0 32-14.3 32-32V448c0-17.7-14.3-32-32-32H96zM505.6 64c16.2 0 26.4 8.7 31 13.9 4.6 5.2 12.1 16.3 10.3 32.4l-23.5 203.4c-4.9 42.2 8.6 84.6 36.8 116.4 28.3 31.7 68.9 49.9 111.4 49.9h271.2c6.6 0 10.8 3.3 13.2 6.1s5 7.5 4 14l-48 303.4c-6.9 43.6-29.1 83.4-62.7 112C815.8 944.2 773 960 728.9 960h-317c-33.1 0-59.9-26.8-59.9-59.9v-455c0-6.1 1.7-12 5-17.1 69.5-109 106.4-234.2 107-364h41.6z m0-64h-44.9C427.2 0 400 27.2 400 60.7c0 127.1-39.1 251.2-112 355.3v484.1c0 68.4 55.5 123.9 123.9 123.9h317c122.7 0 227.2-89.3 246.3-210.5l47.9-303.4c7.8-49.4-30.4-94.1-80.4-94.1H671.6c-50.9 0-90.5-44.4-84.6-95l23.5-203.4C617.7 55 568.7 0 505.6 0z" :fill="b.isLike ? '#ff6633' : '#82848a'"></path>
                                   </svg>
                                   {{b.liked||0}}
                               </div>
                           </div>
                       </div>
                    </div>
                 </div>
              </div>
              <div v-else-if="!collectionLoading" class="empty-state">还没有收藏任何笔记</div>
             <div v-else class="loading-state"><i class="el-icon-loading"></i> 加载中...</div>
          </div>

          <!-- Likes Tab (Stub) -->
           <div v-if="activeTab==='like'" class="tab-pane" v-infinite-scroll="loadMoreLikes" :infinite-scroll-disabled="likeLoading || likeNoMore">
              <!-- Reusing waterfall structure for future like list -->
              <div v-if="likes.length > 0" class="waterfall-container">
                 <div class="waterfall-column" v-for="(col, i) in [0, 1]" :key="i">
                    <div class="waterfall-item" 
                         v-for="b in likes.filter((_, index) => index % 2 === i)" 
                         :key="b.id"
                         @click="toNoteDetail(b)"
                    >
                       <div class="card-img-box">
                           <img :src="getImage(b.images)" class="work-cover" loading="lazy">
                       </div>
                       <div class="card-info">
                           <div class="card-title">{{ b.title }}</div>
                           <div class="card-bottom">
                               <div class="card-user">
                                   <img :src="b.icon || '/imgs/icons/default-icon.png'" class="card-avatar">
                                   <span class="card-name">{{ b.nickName || b.name }}</span>
                               </div>
                               <div class="card-likes">
                                   <!-- Heart Icon -->
                                   <svg class="icon" viewBox="0 0 1024 1024" width="14" height="14" style="margin-right: 2px;">
                                     <path d="M160 944c0 8.8-7.2 16-16 16h-32c-26.5 0-48-21.5-48-48V528c0-26.5 21.5-48 48-48h32c8.8 0 16 7.2 16 16v448zM96 416c-53 0-96 43-96 96v416c0 53 43 96 96 96h96c17.7 0 32-14.3 32-32V448c0-17.7-14.3-32-32-32H96zM505.6 64c16.2 0 26.4 8.7 31 13.9 4.6 5.2 12.1 16.3 10.3 32.4l-23.5 203.4c-4.9 42.2 8.6 84.6 36.8 116.4 28.3 31.7 68.9 49.9 111.4 49.9h271.2c6.6 0 10.8 3.3 13.2 6.1s5 7.5 4 14l-48 303.4c-6.9 43.6-29.1 83.4-62.7 112C815.8 944.2 773 960 728.9 960h-317c-33.1 0-59.9-26.8-59.9-59.9v-455c0-6.1 1.7-12 5-17.1 69.5-109 106.4-234.2 107-364h41.6z m0-64h-44.9C427.2 0 400 27.2 400 60.7c0 127.1-39.1 251.2-112 355.3v484.1c0 68.4 55.5 123.9 123.9 123.9h317c122.7 0 227.2-89.3 246.3-210.5l47.9-303.4c7.8-49.4-30.4-94.1-80.4-94.1H671.6c-50.9 0-90.5-44.4-84.6-95l23.5-203.4C617.7 55 568.7 0 505.6 0z" :fill="b.isLike ? '#ff6633' : '#82848a'"></path>
                                   </svg>
                                   {{b.liked||0}}
                               </div>
                           </div>
                       </div>
                    </div>
                 </div>
              </div>
              <div v-else class="empty-state">还没有点赞过任何笔记</div>
           </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getUserInfo, getUserStats, getCurrentUser, getFullUserInfo } from '@/api/user';
import { getUserBlogs } from '@/api/blog';
import { getCommonFollows, followUser, isFollowed, likeBlog, likeRecord, starList } from '@/api/interaction';
import { createChatSession, getSessionId } from '@/api/chat';

export default {
  name: 'OtherInfo',
  data() {
    return {
      userId: null,
      user: {},
      info: {},
      loginUser: {},
      stats: {},
      activeTab: 'note',
      isLoading: false,
      notes: [],
      noteLoading: false,
      noteNoMore: false,
      noteCurrent: 1,
      noteCurrent: 1,
      
      collections: [],
      collectionLoading: false,
      collectionNoMore: false,
      collectionCurrent: 1,
      
      likes: [],
      likeLoading: false,
      likeNoMore: false,
      likeCurrent: 1,
      
      sessionId: null
    }
  },
  created() {
    this.userId = this.$route.params.id;
    if(this.userId) {
       this.initData();
    }
  },
  methods: {
    formatTime(time) {
        if(!time) return '';
        const d = new Date(time);
        const y = d.getFullYear();
        const m = (d.getMonth()+1).toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');
        return `${y}-${m}-${day}`;
    },
    goBack() {
      this.$router.back();
    },
    formatCount(n) {
       return n > 99 ? '99+' : n;
    },
    formatDistance(d) {
      if(!d) return '';
      return d < 1000 ? d + 'm' : (d/1000).toFixed(1) + 'km';
    },
    handleImgError(e) {
       e.target.src = '/imgs/icons/default-icon.png';
    },
    getImage(imgs) {
       if(!imgs) return '';
       return imgs.split(',')[0];
    },

    initData() {
       this.isLoading = true;
       
       const promises = [
          getUserInfo(this.userId),
          getFullUserInfo(this.userId),
          getUserStats(this.userId)
       ];
       
       const token = localStorage.getItem("token");
       if(token) {
           promises.push(getCurrentUser().catch(()=>({})));
       } else {
           promises.push(Promise.resolve({}));
       }

       Promise.all(promises).then(([uRes, infoRes, statsRes, meRes]) => {
          this.user = uRes.data || uRes || {};
          if(this.user.data) this.user = this.user.data; // Double check for nested data
          
          if(this.user.icon && !this.user.icon.startsWith('http')) this.user.icon = this.$fileURL + this.user.icon;
          
          this.info = infoRes.data || infoRes || {};
          if(this.info.data) this.info = this.info.data;
          
          this.stats = statsRes.data || statsRes || {};
          if(this.stats.data) this.stats = this.stats.data;
          
          this.loginUser = meRes.data || meRes || {};
          if(this.loginUser.data) this.loginUser = this.loginUser.data;
          
          if (this.loginUser.id && this.userId && String(this.loginUser.id) !== String(this.userId)) {
             this.checkFollow();
             this.isCreateSession();
          }

          this.loadNotes();
       }).finally(() => this.isLoading = false);
    },

    checkFollow() {
       isFollowed({ sourceId: this.userId, sourceType: 1 }).then(res => {
          this.user.isFollow = res.data;
       });
    },
    switchTab(tab) {
       this.activeTab = tab;
       if(tab === 'note' && this.notes.length === 0) this.loadNotes();
       if(tab === 'collection' && this.collections.length === 0) this.loadCollections();
       if(tab === 'like' && this.likes.length === 0) this.loadLikes();
    },
    loadNotes() {
       this.noteLoading = true;
       getUserBlogs({ userId: this.userId, current: this.noteCurrent, size: 10 }).then(res => {
          const list = res.data || res || [];
          if(list.length < 5) this.noteNoMore = true;
          this.notes = this.noteCurrent === 1 ? list : [...this.notes, ...list];
          this.notes.forEach(n => {
             if(n.images && !n.images.startsWith('http')) n.images = this.$fileURL + n.images;
          });
          this.noteCurrent++;
       }).finally(() => this.noteLoading = false);
    },
    loadMoreNotes() {
       if(!this.noteLoading && !this.noteNoMore) {
          this.loadNotes();
       }
    },
    loadLikes() {
       this.likeLoading = true;
       // sourceType=3 for blogs, consistent with other APIs
       likeRecord({ userId: this.userId, sourceType: 3, current: this.likeCurrent, size: 10 }).then(res => {
           let list = res.data || res || [];
           // Handle potential wrapper structure if records exist
           if(list.records) list = list.records;
           
           if(list.length < 10) this.likeNoMore = true;
           this.likes = this.likeCurrent === 1 ? list : [...this.likes, ...list];
           
           this.likes.forEach(b => {
               if(b.images && !b.images.startsWith('http')) b.images = this.$fileURL + b.images;
                // Icons for liked blogs user
               if(b.icon && !b.icon.startsWith('http')) b.icon = this.$fileURL + b.icon;
               // Liked list items, so by definition I (the user viewing) liked them? 
               // Wait, 'likeRecord' returns items user liked. 
               // Do WE (loginUser) like them? 
               // Usually the list returns the Blog Object. 
               // Blog Object should have 'isLike' field relative to loginUser if backend supports it.
               // We will trust backend response.
           });
           this.likeCurrent++;
       }).finally(() => this.likeLoading = false);
    },
    loadMoreLikes() {
        if(!this.likeLoading && !this.likeNoMore) {
            this.loadLikes();
        }
    },
    loadCommon() {
       getCommonFollows({ userId: this.userId, sourceType: 1, current: 1 }).then(res => {
          this.commonFollows = res.data || res || [];
          this.commonFollows.forEach(u => {
             if(u.icon) u.icon = this.$fileURL + u.icon;
             u.isFollow = true; // Common follows implies I follow them
          });
       });
    },
    toggleCommonFollow(u) {
       const newStatus = !u.isFollow;
       followUser({ sourceId: u.id, sourceType: 1, isFollow: newStatus }).then(() => {
          u.isFollow = newStatus;
          this.$message.success(newStatus ? '关注成功' : '已取消关注');
       });
    },
    loadCollections() {
       this.collectionLoading = true;
       // sourceType=3 for blogs
       starList({ userId: this.userId, sourceType: 3, current: this.collectionCurrent, size: 10 }).then(res => {
          let list = res.data || res || [];
          if(list.records) list = list.records;

          if(list.length < 10) this.collectionNoMore = true;
          this.collections = this.collectionCurrent === 1 ? list : [...this.collections, ...list];
          
          this.collections.forEach(s => {
              if(s.images && !s.images.startsWith('http')) s.images = this.$fileURL + s.images;
              if(s.icon && !s.icon.startsWith('http')) s.icon = this.$fileURL + s.icon;
          });
          this.collectionCurrent++;
       }).finally(() => this.collectionLoading = false);
    },
    loadMoreCollections() {
       if(!this.collectionLoading && !this.collectionNoMore) {
          this.loadCollections();
       }
    },
    handleFollow() {
       if(!this.loginUser.id) return this.$router.push('/user/login');
       const newStatus = !this.user.isFollow;
       
       followUser({ sourceId: this.userId, sourceType: 1, isFollow: newStatus }).then(() => {
          this.user.isFollow = newStatus;
          this.$message.success(newStatus ? '关注成功' : '已取消关注');
          
          // Update stats locally
          if(newStatus) this.stats.fansCount = (this.stats.fansCount || 0) + 1;
          else this.stats.fansCount = Math.max(0, (this.stats.fansCount || 0) - 1);
          
          this.queryUserStats(); // Refresh stats from server to be sure
       });
    },
    isCreateSession() {
       getSessionId({ fromUid: this.loginUser.id, toUid: this.userId }).then(res => {
          if(res && res.success && res.data) {
             this.sessionId = res.data;
          }
       }).catch(e => console.error(e));
    },
    handleMessage() {
       if(!this.loginUser.id) return this.$router.push('/user/login');
       
       if (this.sessionId) {
          return this.$router.push({ path: '/chat/detail', query: { sessionId: this.sessionId } });
       }
       
       createChatSession(this.userId).then(res => {
           if(res) { // res is sessionId string or object depending on API wrapper, usually string from previous context
              // If API wrapper returns object, use res.data. If plain string, use res.
              const sid = (res.data || res); 
              this.sessionId = sid;
              this.$router.push({ path: '/chat/detail', query: { sessionId: sid } });
           } else {
              this.$message.error('创建会话失败');
           }
       }).catch(() => this.$message.error('私信功能暂不可用'));
    },
    toggleLike(b) {
       if(!this.loginUser.id) return this.$router.push('/user/login');
       
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
    toNoteDetail(b) {
       this.$router.push({ path: '/blog/detail', query: { id: b.id } });
    },
    toShopDetail(s) {
       this.$router.push({ path: '/shop/detail', query: { id: s.id } });
    },
    toUserDetail(u) {
       if(String(u.id) === String(this.loginUser.id)) {
           this.$router.push('/info');
       } else {
           // Push to same route with different ID, reusing component
           this.$router.push(`/user-info/${u.id}`);
           // Reset data
           this.userId = u.id;
           this.notes = [];
           this.commonFollows = [];
           this.collections = [];
           this.initData();
       }
    },
    toFollows() {
       this.$router.push({ path: '/user/follows', query: { id: this.userId } });
    },
    toFans() {
       this.$router.push({ path: '/user/fans', query: { id: this.userId } });
    }
  }
}
</script>

<style scoped>
.other-info-page { background: #f5f5f5; min-height: 100vh; padding-bottom: 20px; }
.page-header { height: 50px; background: white; display: flex; align-items: center; padding: 0 15px; position: sticky; top: 0; z-index: 10; }
.header-back-btn i { font-size: 20px; }
.header-title { flex: 1; text-align: center; font-size: 16px; font-weight: bold; }

.user-basic { padding: 15px; background: white; display: flex; align-items: center; }
.user-avatar-box { width: 60px; height: 60px; border-radius: 50%; overflow: hidden; margin-right: 12px; border: 2px solid #f0f0f0; }
.user-avatar-box img { width: 100%; height: 100%; object-fit: cover; }
.user-info-box { flex: 1; }
.name { font-size: 18px; font-weight: 600; color: #1a1a1a; }
.action-buttons { display: flex; gap: 8px; align-items: center; }
.action-btn { 
  padding: 0 16px; 
  height: 32px; 
  line-height: 32px; 
  border-radius: 16px; 
  border: none; 
  font-size: 13px; 
  color: #fff; 
  cursor: pointer; 
  display: flex; 
  align-items: center; 
  justify-content: center;
  font-weight: 500;
  min-width: 72px;
}
.logout-btn { background: #ff6633; box-shadow: 0 2px 6px rgba(255, 102, 51, 0.3); }
.message-btn { background: #07c160; box-shadow: 0 2px 6px rgba(7, 193, 96, 0.3); }

.user-introduce { padding: 12px 15px; background: white; font-size: 14px; color: #555; border-top: 1px solid #f5f5f5; }

.stats-card { display: flex; background: white; padding: 15px 0; margin-top: 10px; }
.stat-item { flex: 1; text-align: center; }
.stat-value { font-size: 18px; font-weight: 600; }
.stat-label { font-size: 13px; color: #666; }

.custom-tabs-header { background: white; margin-top: 10px; border-bottom: 1px solid #eee; position: sticky; top: 50px; z-index: 9; }
.custom-tabs-nav { display: flex; }
.custom-tab-item { flex: 1; text-align: center; padding: 12px 0; font-size: 15px; cursor: pointer; }
.custom-tab-item.active { color: #07c160; border-bottom: 2px solid #07c160; }
.count-badge { background: #ff6633; color: white; padding: 0 5px; border-radius: 10px; font-size: 10px; margin-left: 2px; }

.custom-tabs-content { min-height: 300px; }
.tab-pane { padding-bottom: 20px; }
.empty-state { padding: 40px; text-align: center; color: #999; }

.shop-item, .user-item { background: white; padding: 12px 15px; display: flex; border-bottom: 1px solid #f5f5f5; }
.blog-item { background: white; margin-bottom: 10px; border-radius: 8px; overflow: hidden; cursor: pointer; padding: 15px; border-bottom: 1px solid #f5f5f5; }
.blog-header { display: flex; align-items: center; margin-bottom: 10px; }

/* User Item */
.user-item { align-items: center; }
.user-info { flex: 1; margin-right: 10px; }
.user-desc { color: #999; font-size: 12px; margin-top: 4px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.user-action { flex-shrink: 0; }
.follow-btn {
   padding: 4px 12px; border-radius: 14px; font-size: 12px; cursor: pointer; border: none; outline: none;
   background: #ff6633; color: white;
}
.follow-btn.followed {
   background: #07c160;
}
.blog-avatar { width: 40px; height: 40px; border-radius: 50%; margin-right: 10px; object-fit: cover; }
.blog-user-box { display: flex; flex-direction: column; }
.blog-username { font-size: 14px; color: #333; font-weight: 500; }
.blog-date { font-size: 12px; color: #999; margin-top: 2px; }

.blog-body { display: flex; }
.blog-img { width: 100px; height: 100px; flex-shrink: 0; margin-right: 10px; border-radius: 4px; overflow: hidden; background: #f0f0f0; }
.blog-img img, .shop-img img, .user-avatar img { width: 100%; height: 100%; object-fit: cover; }
.user-avatar { width: 50px; height: 50px; border-radius: 50%; overflow: hidden; margin-right: 12px; flex-shrink: 0; }
.blog-content-col { flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
.blog-title { font-size: 15px; color: #333; line-height: 1.4; margin-bottom: 5px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; height: 42px; }
.blog-actions { display: flex; align-items: center; justify-content: flex-end; gap: 20px; margin-top: auto; }
.action-btn { display: flex; align-items: center; color: #999; font-size: 13px; }
.action-btn i { font-size: 16px; margin-right: 4px; }
.action-btn.active { color: #ff6633; }
.loading-state { text-align: center; padding: 20px 0; color: #999; font-size: 13px; }
</style>

<style scoped>
/* Waterfall Layout Styles (Synced from Info.vue) */
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
}

.card-avatar {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    margin-right: 4px;
    flex-shrink: 0;
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
}

.card-likes i {
    margin-right: 2px;
}
</style>
