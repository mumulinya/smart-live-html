<template>
  <div class="other-info-page" v-loading="isLoading"
       @touchstart="handleTouchStart"
       @touchmove="handleTouchMove"
       @touchend="handleTouchEnd">
    <div class="page-header">
      <div class="header-back-btn" @click="goBack"><i class="el-icon-arrow-left"></i></div>
      <div class="header-title"></div>
    </div>

    <!-- Profile Cover -->
    <div class="profile-cover-container" :style="containerStyle" @click="handleHeaderClick">
       <img v-if="coverUrl" :src="coverUrl" :style="imgStyle" class="cover-img">
       <div v-else class="default-cover" :style="defaultCoverStyle"></div>
    </div>

    <!-- User Header Layout -->
    <div class="user-header-content" @click="isExpanded = false">
       <div class="user-avatar-wrapper" @click.stop="showAvatarDialog = true">
         <img :src="user.icon || '/imgs/icons/default-icon.png'" @error="handleImgError">
       </div>
       <div class="user-details-right">
          <div class="name-line">
             <div class="name">{{ user.nickName || '未知用户' }}</div>
          </div>
          <div class="id-line">
             ID: {{ user.id || '8832' }} <i class="el-icon-document-copy" style="margin-left: 4px;"></i>
          </div>
          <div class="user-tags-row">
             <!-- Gender & Age -->
             <div class="tag gender-tag" 
                  :style="{background: info.gender === 0 ? '#54b4ef' : '#ff88a7'}"
                  v-if="info.gender !== undefined && info.gender !== null">
                 <i :class="info.gender === 0 ? 'el-icon-male' : 'el-icon-female'"></i>
                 <span v-if="info.birthday" style="margin-left: 2px; font-size: 10px;">{{getAge(info.birthday)}}岁</span>
             </div>
             
             <!-- Level -->
             <div class="tag level-tag">Lv.{{user.level || 5}}</div>
             
             <!-- City -->
             <div class="tag city-tag" v-if="info.city">
                <i class="el-icon-location-outline" style="margin-right:2px"></i>{{info.city}}
             </div>
          </div>
       </div>

       <!-- Top Right Extras -->
       <div class="header-extras">
          <i class="el-icon-more settings-icon"></i>
       </div>
    </div>

    <div class="user-introduce">
      <span>{{ info.introduce || '这个人很懒，什么都没有留下' }}</span>
    </div>

    <!-- Action Buttons Row -->
    <div class="action-buttons" v-if="user.id && String(user.id) !== String(loginUser.id)">
         <button class="action-btn" :class="user.isFollow ? 'followed-btn' : 'follow-btn'" @click="handleFollow">
           <i v-if="!user.isFollow" class="el-icon-plus" style="font-weight: bold; margin-right: 2px;"></i>
           {{ user.isFollow ? '已关注' : '关注' }}
         </button>
         <button class="action-btn message-btn" @click="handleMessage">
           <i class="el-icon-chat-dot-round" style="margin-right: 4px;"></i> 发私信
         </button>
         <button class="action-btn more-btn">
            <i class="el-icon-more"></i>
         </button>
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
            <div class="tab-text">笔记 {{stats.blogCount || 0}}</div>
          </div>
          <div class="custom-tab-item" :class="{active: activeTab==='collection'}" @click="switchTab('collection')">
            <div class="tab-text">收藏 {{stats.blogStarCount || 0}}</div>
          </div>
          <div class="custom-tab-item" :class="{active: activeTab==='like'}" @click="switchTab('like')">
            <div class="tab-text">喜欢 {{stats.blogLikeCount || 0}}</div>
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
                       <div class="card-img-box" style="position: relative;">
                           <img :src="getImage(b.images)" class="work-cover" loading="lazy" @error="handleImgError">
                           <div class="pinned-tag" v-if="b.pin || b.isTop">置顶</div>
                       </div>
                       <div class="card-info">
                           <div class="card-title">{{ b.title }}</div>
                           <div class="card-bottom">
                               <div class="card-user">
                                   <img :src="user.icon || '/imgs/icons/default-icon.png'" class="card-avatar">
                                   <span class="card-name">{{ user.nickName }}</span>
                               </div>
                               <div class="card-likes">
                                   <svg viewBox="0 0 24 24" width="14" height="14" style="margin-right: 2px;">
                                     <path :fill="b.isLike ? '#ff2442' : '#999'" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
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
                                   <img :src="b.userAvatar || '/imgs/icons/default-icon.png'" class="card-avatar">
                                   <span class="card-name">{{ b.userName }}</span>
                               </div>
                               <div class="card-likes">
                                   <svg viewBox="0 0 24 24" width="14" height="14" style="margin-right: 2px;">
                                     <path :fill="b.isLike ? '#ff2442' : '#999'" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
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
                                   <img :src="b.userAvatar || '/imgs/icons/default-icon.png'" class="card-avatar">
                                   <span class="card-name">{{ b.userName }}</span>
                               </div>
                               <div class="card-likes">
                                   <!-- Heart Icon -->
                                   <svg viewBox="0 0 24 24" width="14" height="14" style="margin-right: 2px;">
                                     <path :fill="b.isLike ? '#ff2442' : '#999'" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
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
    <!-- Avatar Dialog -->
    <!-- Avatar Dialog -->
    <div class="avatar-dialog-overlay" v-if="showAvatarDialog" @click="showAvatarDialog = false">
       <div class="avatar-dialog-close" @click="showAvatarDialog = false"><i class="el-icon-close"></i></div>
       <div class="avatar-preview-container" @click.stop>
          <img :src="user.icon || '/imgs/icons/default-icon.png'" class="avatar-big">
       </div>
    </div>
    
    <!-- Image Preview Component -->
    <van-image-preview v-model:show="showPreview" :images="previewImages" />
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
      
      sessionId: null,
      
      sessionId: null,
      
      // Touch tracking
      touchStartX: 0,
      touchStartY: 0,
      coverHeight: 120, // Default height
      isPulling: false,
      isExpanded: false,
      
      tabOrder: ['note', 'collection', 'like'],
      showAvatarDialog: false,
      showAvatarDialog: false,
      showPreview: false
    }
  },
  computed: {
    coverUrl() {
        const bg = this.info.backgroundImage;
        if(bg) {
             let url = bg;
             if(!bg.startsWith('http')) {
                  url = this.$fileURL + bg;
             }
             return url;
        }
        return null;
    },
    containerStyle() {
        return {
             height: this.isExpanded ? 'auto' : (this.coverHeight + 'px'),
             transition: this.isPulling ? 'none' : 'height 0.3s ease-out',
             overflow: 'hidden',
             position: 'relative'
        };
    },
    imgStyle() {
        return {
             width: '100%',
             height: this.isExpanded ? 'auto' : '100%',
             objectFit: this.isExpanded ? 'contain' : 'cover',
             display: 'block'
        };
    },
    defaultCoverStyle() {
        return {
             width: '100%',
             height: '100%',
             background: 'linear-gradient(to right, #a8edea 0%, #fed6e3 100%)'
        };
    },
    previewImages() {
        const bg = this.info.backgroundImage;
        if(bg) {
             let url = bg;
             if(!bg.startsWith('http')) {
                  url = this.$fileURL + bg;
             }
             return [url];
        }
        return [];
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
    formatDistance(d) {
      if(!d) return '';
      return d < 1000 ? d + 'm' : (d/1000).toFixed(1) + 'km';
    },
    getAge(birthday) {
       if(!birthday) return '';
       const b = new Date(birthday);
       const now = new Date();
       let age = now.getFullYear() - b.getFullYear();
       if(now.getMonth() < b.getMonth() || (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())) {
         age--;
       }
       return age;
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
             this.switchTab(this.tabOrder[currentIndex + 1]);
          }
       } else {
          // Swipe right -> previous tab
          if (currentIndex > 0) {
             this.switchTab(this.tabOrder[currentIndex - 1]);
          }
       }
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
               if(b.userAvatar && !b.userAvatar.startsWith('http')) b.userAvatar = this.$fileURL + b.userAvatar;
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
              if(s.userAvatar && !s.userAvatar.startsWith('http')) s.userAvatar = this.$fileURL + s.userAvatar;
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
    },
    handleHeaderClick() {
        if (this.previewImages.length > 0) {
          this.showPreview = true;
        }
    },
    togglePreview() {
        if (this.previewImages.length > 0) {
          this.showPreview = true;
        }
    },
    
    // Touch Logic
    handleTouchStart(e) {
       this.touchStartX = e.touches[0].clientX;
       this.touchStartY = e.touches[0].clientY;
       this.isPulling = false;
    },
    handleTouchMove(e) {
       const currentY = e.touches[0].clientY;
       const diffY = currentY - this.touchStartY;
       const scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop;
       
       if (this.isExpanded) {
           // If expanded, check for slide up to collapse
           if (diffY < -50) { // Sliding up
                this.isExpanded = false;
                this.coverHeight = 120; // Reset height
           }
       } else {
           // Vertical Pull to Expand
           if (scrollTop <= 0 && diffY > 0) {
              if (e.cancelable && diffY < 200) e.preventDefault(); 
              this.isPulling = true;
              this.coverHeight = 120 + Math.pow(diffY, 0.8);
           }
       }
    },
    handleTouchEnd(e) {
       // Reset Cover
       if (this.isPulling) {
           this.isPulling = false;
           // If pulled enough, trigger expand
           if (this.coverHeight > 180) { // Threshold
               this.isExpanded = true;
           }
           this.coverHeight = 120; // Always reset base height var, expanded state uses fixed height
       }
       
       // Horizontal Swipe (Tab Switch) - Only if NOT pulling significantly vertical
       // Logic: Check start vs end
       const touchEndX = e.changedTouches[0].clientX;
       const touchEndY = e.changedTouches[0].clientY;
       
       const xDiff = this.touchStartX - touchEndX;
       const yDiff = this.touchStartY - touchEndY;
       
       // Verify it's primarily a horizontal swipe
       if (Math.abs(xDiff) > 50 && Math.abs(xDiff) > Math.abs(yDiff)) {
           const currentIndex = this.tabOrder.indexOf(this.activeTab);
           if (xDiff > 0) {
               // Next
               if (currentIndex < this.tabOrder.length - 1) this.switchTab(this.tabOrder[currentIndex + 1]);
           } else {
               // Prev
               if (currentIndex > 0) this.switchTab(this.tabOrder[currentIndex - 1]);
           }
       }
    }
  }
}
</script>

<style scoped>
/* Pinned Tag */
.pinned-tag {
    position: absolute;
    top: 6px;
    left: 6px;
    background: linear-gradient(to right, #ff9966, #ff5e62);
    color: white;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 4px;
    z-index: 10;
}
.other-info-page { background: #f5f5f5; min-height: 100vh; padding-bottom: 20px; }
.page-header { height: 50px; background: white; display: flex; align-items: center; padding: 0 15px; position: sticky; top: 0; z-index: 10; }
.header-back-btn i { font-size: 20px; }
.header-title { flex: 1; text-align: center; font-size: 16px; font-weight: bold; }

.user-introduce { padding: 8px 15px; background: white; font-size: 13px; color: #555; }

/* Update action-buttons spacing if needed */
.action-buttons { display: flex; gap: 10px; padding: 10px 15px; background: white; }
.action-btn { 
  flex: 1; 
  height: 36px; 
  line-height: normal; 
  border-radius: 4px; 
  border: none; 
  font-size: 14px; 
  cursor: pointer; 
  display: flex; 
  align-items: center; 
  justify-content: center;
  font-weight: 500;
  min-width: 0;
}
.logout-btn { background: #ff6633; color: white; } 
.follow-btn { background: #ff2442; color: white; }
.followed-btn { background: #f2f2f2; color: #333; border: 1px solid rgba(0,0,0,0.05); }
.message-btn { background: #f2f2f2; color: #333; border: 1px solid rgba(0,0,0,0.05); }
.more-btn { flex: none; width: 36px; background: #f2f2f2; color: #333; border: 1px solid rgba(0,0,0,0.05); }

/* New Header Styles */
.profile-cover {
    height: 120px;
    width: 100%;
    background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
    background-size: cover;
    background-position: center;
}
.user-header-content {
    position: relative;
    padding: 0 15px;
    display: flex;
    align-items: flex-start;
    background: white;
}
.user-avatar-wrapper {
    width: 76px;
    height: 76px;
    border-radius: 50%;
    border: 3px solid white;
    overflow: hidden;
    margin-top: -20px; /* Overlap cover */
    flex-shrink: 0;
    margin-right: 12px;
    z-index: 2;
    background: white;
}
.user-avatar-wrapper img { width: 100%; height: 100%; object-fit: cover; }

.user-details-right {
    padding-top: 10px;
    flex: 1;
}
.name-line {
    display: flex;
    align-items: center;
    margin-bottom: 2px;
}
.name { font-size: 18px; font-weight: 600; color: #1a1a1a; }

.id-line {
    font-size: 11px;
    color: #999;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
}

.user-tags-row { 
    display: flex; 
    align-items: center; 
    gap: 6px; 
    flex-wrap: wrap; 
}

.tag { 
    height: 18px; 
    line-height: normal; 
    padding: 0 6px; 
    border-radius: 9px; 
    font-size: 10px; 
    display: flex; 
    align-items: center; 
    color: white;
}
.gender-tag { /* Background handled inline */ }
.level-tag { background: #FFD700; font-weight: bold; font-style: italic; } 
.city-tag { background: rgba(0,0,0,0.05); color: #666; }

.header-extras {
    position: absolute;
    right: 15px;
    top: 10px; 
    display: flex;
    align-items: center;
}
/* user-id-text removed */
.settings-icon {
    font-size: 20px;
    color: #333;
    background: #f5f5f5;
    padding: 4px;
    border-radius: 4px;
    cursor: pointer;
}

/* Avatar Dialog Styles */
.avatar-dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: black; /* Pure black background for full screen */
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
}
.avatar-dialog-close {
    position: absolute;
    top: 40px;
    right: 20px;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 28px;
    cursor: pointer;
    z-index: 10001;
}
.avatar-preview-container {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}
.avatar-big {
    width: 100%;
    max-height: 80%; /* Don't fill entire height, leave space */
    object-fit: contain;
}

.user-introduce { padding: 8px 15px; background: white; font-size: 13px; color: #555; }

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
