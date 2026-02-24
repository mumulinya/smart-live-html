<template>
  <PageLayout :loading="isLoading" skeleton-type="profile" class="other-info-page"
       @touchstart="handleTouchStart"
       @touchmove="handleTouchMove"
       @touchend="handleTouchEnd">
    <!-- Custom Navbar -->
    <div class="custom-nav" :style="{ background: `rgba(255,255,255,${navOpacity})` }">
      <div class="nav-back" @click="goBack" :class="{ 'dark-icon': navOpacity > 0.5 }">
        <i class="el-icon-arrow-left"></i>
      </div>
      <div class="nav-title" :style="{ opacity: navOpacity }">
        <span v-if="navOpacity > 0.8">{{ user.nickName }}</span>
      </div>
      <div class="nav-more" :class="{ 'dark-icon': navOpacity > 0.5 }">
        <i class="el-icon-more"></i>
      </div>
    </div>

    <!-- Cover Image Container (Block Layout) -->
    <div class="profile-cover-container" :style="containerStyle" @click="handleBgClick">
       <img v-if="coverUrl" :src="coverUrl" :style="imgStyle" class="cover-img">
    </div>

    <!-- Main Content Container (Card) -->
    <div class="profile-header">
       
       <!-- Top Row: Avatar & Stats -->
       <div class="header-top">
           <div class="avatar-box" @click.stop="handlePreview(user.icon || '/imgs/icons/default-icon.png')">
              <img :src="user.icon || '/imgs/icons/default-icon.png'" class="avatar-img" @error="handleImgError">
           </div>
           
           <div class="stats-row">
             <div class="stat-item">
               <div class="stat-num">{{ formatCount(stats.likeCount || 0) }}</div>
               <div class="stat-lbl">获赞</div>
             </div>
             <div class="stat-item" @click="toFollows">
               <div class="stat-num">{{ formatCount(stats.followCount || 0) }}</div>
               <div class="stat-lbl">关注</div>
             </div>
             <div class="stat-item" @click="toFans">
               <div class="stat-num">{{ formatCount(stats.fansCount || 0) }}</div>
               <div class="stat-lbl">粉丝</div>
             </div>
           </div>
       </div>

       <!-- User Info Details -->
       <div class="user-info-section">
           <div class="name-row">
               <span class="user-nickname">{{ user.nickName || '未知用户' }}</span>
               
               <!-- Action Buttons -->
               <div class="name-actions" v-if="user.id && String(user.id) !== String(loginUser.id)">
                    <button class="mini-action-btn" :class="user.isFollow ? 'btn-gray' : 'btn-primary'" @click.stop="handleFollow">
                      {{ user.isFollow ? '已关注' : '关注' }}
                    </button>
                    <button class="mini-action-btn btn-outline" @click.stop="handleMessage">
                      私信
                    </button>
               </div>
           </div>
           
           <div class="id-row">
               <span>生活号：{{ user.id || '8832' }}</span>
               <i class="el-icon-document-copy" style="margin-left: 4px;"></i>
           </div>
           
           <div class="intro-row">
              <span class="intro-text">{{ info.introduce || '这个人很懒，什么都没有留下' }}</span>
           </div>

           <div class="tags-row">
               <div class="tag-capsule gender" v-if="info.gender !== undefined">
                   <i :class="info.gender === 0 ? 'el-icon-male' : 'el-icon-female'"></i>
                   <span v-if="info.birthday">{{getAge(info.birthday)}}岁</span>
               </div>
               <div class="tag-capsule city" v-if="info.city">
                   {{info.city}}
               </div>
               <div class="tag-capsule level">Lv.{{user.level || 5}}</div>
           </div>
       </div>

    </div>
    <!-- Tabs -->
    <!-- Sticky Tabs (Refactored to match Info.vue) -->
    <div class="sticky-tabs-container">
        <van-tabs v-model:active="activeTab" sticky offset-top="64" @change="switchTab">
            <van-tab name="note">
                <template #title>
                    <div class="tab-label">
                        <span>笔记</span> 
                        <span class="tab-num" v-if="stats.blogCount">{{ stats.blogCount }}</span>
                    </div>
                </template>
                <div class="tab-content" v-infinite-scroll="loadMoreNotes" :infinite-scroll-disabled="noteLoading || noteNoMore">
                     <div v-if="notes.length > 0" class="waterfall-container">
                         <div class="waterfall-column" v-for="(col, i) in noteColumns" :key="'note-col-' + i">
                            <div class="waterfall-item" 
                                 v-for="b in col" 
                                 :key="b.id"
                                 @click="toNoteDetail(b)"
                            >
                               <div class="card-img-box" style="position: relative;">
                                   <img :src="getImage(b.images)" class="work-cover" :class="{ 'is-loaded': b.imgLoaded }" loading="lazy" @error="handleImgError($event, b)" @load="b.imgLoaded=true">
                                   <div class="img-skeleton" v-if="!b.imgError && !b.imgLoaded"></div>
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
                     <div v-else-if="!noteLoading" class="empty-state">
                          <img src="https://img01.yzcdn.cn/vant/empty-image-default.png" class="empty-img">
                          <div class="empty-text">Ta还没有发布任何笔记</div>
                     </div>
                     <div v-else class="loading-state"><i class="el-icon-loading"></i> 加载中...</div>
                </div>
            </van-tab>

            <van-tab name="collection">
                <template #title>
                    <div class="tab-label">
                        <span>收藏</span> 
                        <span class="tab-num" v-if="stats.blogStarCount">{{ stats.blogStarCount }}</span>
                    </div>
                </template>
                <div class="tab-content" v-infinite-scroll="loadMoreCollections" :infinite-scroll-disabled="collectionLoading || collectionNoMore">
                     <div v-if="collections.length > 0" class="waterfall-container">
                         <div class="waterfall-column" v-for="(col, i) in collectionColumns" :key="'collection-col-' + i">
                            <div class="waterfall-item" 
                                 v-for="b in col" 
                                 :key="b.id"
                                 @click="toNoteDetail(b)"
                            >
                               <div class="card-img-box">
                                   <img :src="getImage(b.images)" class="work-cover" :class="{ 'is-loaded': b.imgLoaded }" loading="lazy" @error="handleImgError($event, b)" @load="b.imgLoaded=true">
                                   <div class="img-skeleton" v-if="!b.imgError && !b.imgLoaded"></div>
                               </div>
                               <div class="card-info">
                                   <div class="card-title">{{ b.title }}</div>
                                   <div class="card-bottom">
                                       <div class="card-user">
                                           <img :src="b.icon || '/imgs/icons/default-icon.png'" class="card-avatar">
                                           <span class="card-name">{{ b.name }}</span>
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
                      <div v-else-if="!collectionLoading" class="empty-state">
                          <img src="https://img01.yzcdn.cn/vant/empty-image-default.png" class="empty-img">
                          <div class="empty-text">Ta还没有收藏任何笔记</div>
                      </div>
                     <div v-else class="loading-state"><i class="el-icon-loading"></i> 加载中...</div>
                </div>
            </van-tab>

            <van-tab name="like">
                <template #title>
                    <div class="tab-label">
                        <span>喜欢</span> 
                        <span class="tab-num" v-if="stats.blogLikeCount">{{ stats.blogLikeCount }}</span>
                    </div>
                </template>
                <div class="tab-content" v-infinite-scroll="loadMoreLikes" :infinite-scroll-disabled="likeLoading || likeNoMore">
                   <div v-if="likes.length > 0" class="waterfall-container">
                      <div class="waterfall-column" v-for="(col, i) in likeColumns" :key="'like-col-' + i">
                         <div class="waterfall-item" 
                              v-for="b in col" 
                              :key="b.id"
                              @click="toNoteDetail(b)"
                         >
                            <div class="card-img-box">
                                <img :src="getImage(b.images)" class="work-cover" :class="{ 'is-loaded': b.imgLoaded }" loading="lazy" @error="handleImgError($event, b)" @load="b.imgLoaded=true">
                                <div class="img-skeleton" v-if="!b.imgError && !b.imgLoaded"></div>
                            </div>
                            <div class="card-info">
                                <div class="card-title">{{ b.title }}</div>
                                <div class="card-bottom">
                                    <div class="card-user">
                                        <img :src="b.icon || '/imgs/icons/default-icon.png'" class="card-avatar">
                                        <span class="card-name">{{ b.name }}</span>
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
                   <div v-else class="empty-state">
                       <img src="https://img01.yzcdn.cn/vant/empty-image-default.png" class="empty-img">
                       <div class="empty-text">Ta还没有点赞过任何笔记</div>
                   </div>
                </div>
            </van-tab>
        </van-tabs>
    </div>
    
    <!-- Image Preview Component -->
    <van-image-preview v-model:show="showPreview" :images="previewImages" />
  </PageLayout>
</template>

<script>
import { getUserInfo, getUserStats, getCurrentUser, getFullUserInfo } from '@/api/user';
import { getUserBlogs } from '@/api/blog';
import { getCommonFollows, followUser, isFollowed, likeBlog, likeRecord, starList } from '@/api/interaction';
import { createChatSession, getSessionId } from '@/api/chat';

import PageLayout from '@/components/PageLayout/PageLayout.vue';

export default {
  name: 'OtherInfo',
  components: { PageLayout },
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
      showPreview: false,
      
      navOpacity: 0,
      previewImages: [],
      scrollTicking: false,
      scrollRafId: null
    }
  },
  mounted() {
    window.addEventListener('scroll', this.handleScroll, { passive: true });
  },
  beforeUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
    if (this.scrollRafId !== null) {
      cancelAnimationFrame(this.scrollRafId);
      this.scrollRafId = null;
    }
    this.scrollTicking = false;
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
        return '/imgs/default-bg.png';
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
    noteColumns() {
        return this.splitWaterfallColumns(this.notes);
    },
    collectionColumns() {
        return this.splitWaterfallColumns(this.collections);
    },
    likeColumns() {
        return this.splitWaterfallColumns(this.likes);
    }
  },
  created() {
    this.userId = this.$route.params.id;
    if(this.userId) {
       this.initData();
    }
  },
  methods: {
    splitWaterfallColumns(list) {
       const columns = [[], []];
       if (!Array.isArray(list) || list.length === 0) return columns;
       list.forEach((item, index) => {
          columns[index % 2].push(item);
       });
       return columns;
    },
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
       if (!n) return '0';
       if (n >= 10000) {
           return (n / 10000).toFixed(1).replace(/\.0$/, '') + '万';
       }
       return n;
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
    handleImgError(e, b) {
       e.target.src = '/imgs/icons/default-icon.png';
       if (b) b.imgError = true;
    },
    getImage(imgs) {
       if(!imgs) return '';
       if (Array.isArray(imgs)) return imgs[0] || '';
       return String(imgs).split(',')[0];
    },

    normalizeLikeRecord(record) {
       if (!record || typeof record !== 'object') return {};
       const detail = record.data && typeof record.data === 'object' && !Array.isArray(record.data)
           ? record.data
           : null;
       const merged = detail ? { ...record, ...detail } : { ...record };
       if (Array.isArray(merged.images)) {
           merged.images = merged.images.filter(Boolean).join(',');
       }
       if (!merged.icon && merged.userIcon) {
           merged.icon = merged.userIcon;
       }
       if (!merged.name) {
           merged.name = merged.nickName || merged.userName || merged.username || '';
       }
       merged.likeTime = record.likeTime || merged.likeTime || merged.createTime || '';
       return merged;
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
       getUserBlogs({ userId: this.userId, current: this.noteCurrent, size: 10, status: 0 }).then(res => {
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
           const normalizedList = list.map(this.normalizeLikeRecord);
           
           if(list.length < 10) this.likeNoMore = true;
           this.likes = this.likeCurrent === 1 ? normalizedList : [...this.likes, ...normalizedList];
           
           this.likes.forEach(b => {
               if (
                   typeof b.images === 'string' &&
                   b.images &&
                   !b.images.startsWith('http') &&
                   !b.images.startsWith('/imgs/') &&
                   !b.images.startsWith('data:') &&
                   !b.images.startsWith('blob:')
               ) b.images = this.$fileURL + b.images;
                // Icons for liked blogs user
               if (
                   typeof b.icon === 'string' &&
                   b.icon &&
                   !b.icon.startsWith('http') &&
                   !b.icon.startsWith('/imgs/') &&
                   !b.icon.startsWith('data:') &&
                   !b.icon.startsWith('blob:')
               ) b.icon = this.$fileURL + b.icon;
               if (
                   typeof b.userAvatar === 'string' &&
                   b.userAvatar &&
                   !b.userAvatar.startsWith('http') &&
                   !b.userAvatar.startsWith('/imgs/') &&
                   !b.userAvatar.startsWith('data:') &&
                   !b.userAvatar.startsWith('blob:')
               ) b.userAvatar = this.$fileURL + b.userAvatar;
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
           this.$router.push('/user/profile');
       } else {
           // Push to same route with different ID, reusing component
           this.$router.push(`/user/profile/${u.id}`);
           // Reset data
           this.userId = u.id;
           this.notes = [];
           this.commonFollows = [];
           this.collections = [];
           this.initData();
       }
    },
    toFollows() {
       this.$router.push({ path: '/user/list', query: { type: 'follow', id: this.userId } });
    },
    toFans() {
       this.$router.push({ path: '/user/list', query: { type: 'fans', id: this.userId } });
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
    },
    handleScroll() {
       if (this.scrollTicking) return;
       this.scrollTicking = true;
       this.scrollRafId = requestAnimationFrame(() => {
         this.scrollRafId = null;
         this.scrollTicking = false;
         const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
         let opacity = scrollTop / 100;
         if (opacity > 1) opacity = 1;
         if (opacity < 0) opacity = 0;
         this.navOpacity = opacity;
       });
    },
    handlePreview(url) {
        if(!url) return;
        let previewUrl = url;
        // Only prepend fileURL if it's not http and NOT a local asset
        if(!url.startsWith('http') && !url.startsWith('/imgs/')) {
             previewUrl = this.$fileURL + url;
        }
        this.previewImages = [previewUrl];
        this.showPreview = true;
    },
    handleBgClick(e) {
        // Defensive check: if click originated from interactive elements (like avatar), ignore it
        if (e.target.closest('.user-avatar-wrapper') || e.target.closest('.mini-action-btn') || e.target.closest('.stat-item')) {
            return;
        }
        this.handlePreview(this.coverUrl);
    }
  }
}
</script>

<style scoped>

/* Custom Nav */
.custom-nav {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 44px; /* Adjust for status bar if needed in uniapp */
    padding-top: 20px; /* Spacer for status bar, adjust based on platform */
    display: flex;
    align-items: center;
    padding-left: 15px;
    padding-right: 15px;
    z-index: 100;
    transition: background 0.3s;
}
.nav-back, .nav-more {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: rgba(0,0,0,0.3);
    color: white;
    font-size: 18px;
    backdrop-filter: blur(4px);
    cursor: pointer;
    transition: all 0.3s;
}
.nav-back.dark-icon, .nav-more.dark-icon {
    background: transparent;
    color: #333;
    backdrop-filter: none;
}
.nav-title {
    flex: 1;
    text-align: center;
    font-size: 16px;
    font-weight: 600;
    color: #333;
    opacity: 0;
    transition: opacity 0.3s;
}

/* Profile Cover Container (Matches Info.vue) */
.profile-cover-container {
    width: 100%;
    /* height handled by inline style */
    z-index: 10;
}
.cover-img {
    /* styles handled by inline style mainly */
    width: 100%;
    height: 100%;
    object-fit: cover;
}

/* Profile Header (Card Layout) */
.profile-header {
    background: linear-gradient(to bottom, #fef9f5, #ffffff);
    padding: 0 16px;
    padding-bottom: 15px;
    position: relative;
    margin-top: -20px; /* Overlap cover */
    border-top-left-radius: 16px;
    border-top-right-radius: 16px;
    z-index: 20; /* Above cover */
}

/* Header Top Row */
.header-top {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    padding-top: 15px; /* Add padding inside card */
}

/* Avatar */
.avatar-box {
    position: relative;
    margin-right: 20px;
    flex-shrink: 0;
    cursor: pointer;
}
.avatar-img {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    object-fit: cover;
    border: 1px solid #f0f0f0;
    background: #fff;
}

/* Stats Row */
.stats-row {
    flex: 1;
    display: flex;
    justify-content: space-around;
}
.stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
}
.stat-num {
    font-size: 22px;
    font-weight: 600;
    color: #333;
}

/* User Info Section */
.user-info-section {
    position: relative;
    padding-bottom: 20px;
}

.name-row {
    margin-top: 10px;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    justify-content: space-between; /* Space out name and buttons */
}
.user-nickname {
    font-size: 24px;
    font-weight: 700;
    color: #222;
    flex: 1;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    margin-right: 12px;
}

/* Mini Action Buttons Next to Name */
.name-actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
}
.mini-action-btn {
    height: 32px; /* Increased from 28px */
    padding: 0 20px; /* Increased from 14px */
    border-radius: 16px; /* Increased radius */
    font-size: 14px; /* Increased from 13px */
    font-weight: 600;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    white-space: nowrap;
}
/* Reusing btn-primary/gray/outline color classes, same definition */

.id-row {
    font-size: 13px;
    color: #999;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
}

.intro-row {
    margin-bottom: 16px;
}
.intro-text {
    font-size: 15px; /* Slightly larger */
    color: #333;
    line-height: 1.5;
    white-space: pre-wrap;
}

/* Larger Tags */
.tags-row {
    display: flex;
    flex-wrap: wrap;
    margin-bottom: 15px;
}
.tag-capsule {
    margin-right: 8px;
    height: 24px;
    padding: 0 8px;
    background: #f5f5f5;
    border-radius: 12px;
    font-size: 12px;
    display: flex;
    align-items: center;
    color: #666;
    font-weight: 500;
}
.tag-capsule i { margin-right: 2px; }
.tag-capsule.gender {
    color: #54b4ef;
    background: rgba(84, 180, 239, 0.1);
}
.gender .el-icon-female { color: #ff88a7; } 

/* Action Buttons */
.action-row {
    display: flex;
    gap: 12px;
    padding-bottom: 10px;
}
.action-btn-new {
    flex: 1;
    height: 40px;
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    font-weight: 600;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
}
.btn-primary {
    background: #ff2442;
    color: white;
    box-shadow: 0 4px 12px rgba(255, 36, 66, 0.15);
}
.btn-gray {
    background: #eee;
    color: #999;
    font-weight: 500;
}
.btn-outline {
    background: white;
    border: 1px solid #ddd;
    color: #333;
}

/* Sticky Tabs */
.sticky-tabs-container {
    background: #fff;
    min-height: 500px;
}
.tab-label {
    display: flex;
    align-items: center;
    justify-content: center;
}
.tab-num {
    margin-left: 2px;
    font-size: 14px;
    color: #999;
}
/* Deep selector for active tab color */
:deep(.van-tab--active .tab-label span:first-child) {
    font-weight: 600;
    font-size: 16px;
    color: #333;
}
:deep(.van-tabs__nav) {
    background: #fff;
}
/* Content */
.tab-content {
    background: #f9f9f9;
    padding: 0; /* Reset padding as waterfall container has its own */
    min-height: 400px;
}

/* Cleanup old styles */
 .other-info-page { background: #fff; min-height: 100vh; padding-bottom: 20px; }
 .page-header { display: none; }
 .action-buttons { display: none; } /* Hide old action row wrapper if any */
 .stats-card { display: none; }
 .user-introduce { display: none; }

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
    font-size: 15px; /* Increased from 14px */
    color: #333;
    line-height: 1.4;
    margin-bottom: 8px;

    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
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
    width: 20px; /* Increased from 16px */
    height: 20px; /* Increased from 16px */
    border-radius: 50%;
    margin-right: 4px;
    flex-shrink: 0;
}

.card-name {
    font-size: 12px; /* Increased from 10px */
    color: #999;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 80px;
}

.card-likes {
    font-size: 12px; /* Increased from 10px */
    color: #999;
    display: flex;
    align-items: center;
}

.card-likes i {
    margin-right: 2px;
}

.empty-state {
    padding: 60px 0;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}
.empty-img {
    width: 160px;
    height: 160px;
    margin-bottom: 16px;
    object-fit: contain;
}
.empty-text {
    font-size: 14px;
    color: #999;
}
</style>
