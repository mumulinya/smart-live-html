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
      <div class="stat-item">
        <div class="stat-value">{{ stats.fansCount||0 }}</div>
        <div class="stat-label">粉丝</div>
      </div>
      <div class="stat-item">
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
          <div class="custom-tab-item" :class="{active: activeTab==='common'}" @click="switchTab('common')">
            <div class="tab-text">共同关注 <span v-if="stats.commonFollowCount > 0" class="count-badge">{{formatCount(stats.commonFollowCount)}}</span></div>
          </div>
          <div class="custom-tab-item" :class="{active: activeTab==='collection'}" @click="switchTab('collection')">
            <div class="tab-text">店铺关注 <span v-if="stats.collectCount > 0" class="count-badge">{{formatCount(stats.collectCount)}}</span></div>
          </div>
        </div>
      </div>

      <div class="custom-tabs-content">
          <!-- Notes Tab -->
          <div v-if="activeTab==='note'" class="tab-pane" v-infinite-scroll="loadMoreNotes" :infinite-scroll-disabled="noteLoading || noteNoMore">
             <div v-if="notes.length > 0">
                <div v-for="b in notes" :key="b.id" class="blog-item" @click="toNoteDetail(b)">
                   <!-- Header -->
                   <div class="blog-header">
                      <img :src="user.icon || '/imgs/icons/default-icon.png'" class="blog-avatar">
                      <div class="blog-user-box">
                         <div class="blog-username">{{user.nickName}}</div>
                         <div class="blog-date">{{formatTime(b.createTime)}}</div>
                      </div>
                   </div>
                   <!-- Body -->
                   <div class="blog-body">
                      <div class="blog-img"><img :src="getImage(b.images)"></div>
                      <div class="blog-content-col">
                         <div class="blog-title">{{b.title}}</div>
                         <div class="blog-actions">
                            <div class="action-btn" :class="{active: b.isLike}" @click.stop="toggleLike(b)">
                               <svg class="icon" viewBox="0 0 1024 1024" width="16" height="16" style="margin-right: 2px;">
                                 <path d="M160 944c0 8.8-7.2 16-16 16h-32c-26.5 0-48-21.5-48-48V528c0-26.5 21.5-48 48-48h32c8.8 0 16 7.2 16 16v448zM96 416c-53 0-96 43-96 96v416c0 53 43 96 96 96h96c17.7 0 32-14.3 32-32V448c0-17.7-14.3-32-32-32H96zM505.6 64c16.2 0 26.4 8.7 31 13.9 4.6 5.2 12.1 16.3 10.3 32.4l-23.5 203.4c-4.9 42.2 8.6 84.6 36.8 116.4 28.3 31.7 68.9 49.9 111.4 49.9h271.2c6.6 0 10.8 3.3 13.2 6.1s5 7.5 4 14l-48 303.4c-6.9 43.6-29.1 83.4-62.7 112C815.8 944.2 773 960 728.9 960h-317c-33.1 0-59.9-26.8-59.9-59.9v-455c0-6.1 1.7-12 5-17.1 69.5-109 106.4-234.2 107-364h41.6z m0-64h-44.9C427.2 0 400 27.2 400 60.7c0 127.1-39.1 251.2-112 355.3v484.1c0 68.4 55.5 123.9 123.9 123.9h317c122.7 0 227.2-89.3 246.3-210.5l47.9-303.4c7.8-49.4-30.4-94.1-80.4-94.1H671.6c-50.9 0-90.5-44.4-84.6-95l23.5-203.4C617.7 55 568.7 0 505.6 0z" :fill="b.isLike ? '#ff6633' : '#82848a'"></path>
                               </svg>
                               {{b.liked||0}}
                            </div>
                            <div class="action-btn"><i class="el-icon-chat-dot-round"></i> {{b.comments||0}}</div>
                            <div class="action-btn"><i class="el-icon-share"></i> 分享</div>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
             <div v-else-if="!noteLoading" class="empty-state">还没有发布任何笔记</div>
             <div v-else class="loading-state"><i class="el-icon-loading"></i> 加载中...</div>
          </div>

          <!-- Common Follows Tab -->
          <div v-if="activeTab==='common'" class="tab-pane" v-infinite-scroll="loadMoreCommon" :infinite-scroll-disabled="commonLoading || commonNoMore">
             <div v-if="commonFollows.length > 0">
                <div v-for="u in commonFollows" :key="u.id" class="user-item" @click="toUserDetail(u)">
                   <div class="user-avatar"><img :src="u.icon || '/imgs/icons/default-icon.png'"></div>
                   <div class="user-info">
                      <div class="user-name">{{u.name || u.nickName}}</div>
                      <div class="user-desc">{{u.introduce || '这个人很懒，什么都没有留下'}}</div>
                   </div>
                   <div class="user-action">
                      <button class="follow-btn" :class="{followed: u.isFollow}" @click.stop="toggleCommonFollow(u)">
                        {{u.isFollow ? '已关注' : '关注'}}
                      </button>
                   </div>
                </div>
             </div>
             <div v-else-if="!commonLoading" class="empty-state">没有共同关注的用户</div>
             <div v-else class="loading-state"><i class="el-icon-loading"></i> 加载中...</div>
          </div>

          <!-- Collections Tab -->
          <div v-if="activeTab==='collection'" class="tab-pane" v-infinite-scroll="loadMoreCollections" :infinite-scroll-disabled="collectionLoading || collectionNoMore">
             <div v-if="collections.length > 0">
                <div v-for="s in collections" :key="s.id" class="shop-item" @click="toShopDetail(s)">
                   <div class="shop-img"><img :src="getImage(s.images)"></div>
                   <div class="shop-info">
                      <div class="shop-title">{{s.name}}</div>
                      <div class="shop-rate">
                         <el-rate disabled :model-value="s.score/10" text-color="#F63" :size="12"></el-rate>
                         <span>{{s.comments}}条</span>
                      </div>
                      <div class="shop-area">{{s.area}} <span v-if="s.distance">{{formatDistance(s.distance)}}</span></div>
                   </div>
                </div>
             </div>
             <div v-else-if="!collectionLoading" class="empty-state">还没有收藏任何店铺</div>
             <div v-else class="loading-state"><i class="el-icon-loading"></i> 加载中...</div>
          </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getUserInfo, getUserStats, getCurrentUser, getFullUserInfo } from '@/api/user';
import { getUserBlogs } from '@/api/blog';
import { getCommonFollows, getShopCollections, followUser, isFollowed, likeBlog } from '@/api/interaction';
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
      commonFollows: [],
      collections: [],
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
      this.$router.go(-1);
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
       Promise.all([
          getUserInfo(this.userId),
          getFullUserInfo(this.userId),
          getUserStats(this.userId),
          getCurrentUser().catch(()=>({}))
       ]).then(([uRes, infoRes, statsRes, meRes]) => {
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
       if(tab === 'common' && this.commonFollows.length === 0) this.loadCommon();
       if(tab === 'collection' && this.collections.length === 0) this.loadCollections();
    },
    loadNotes() {
       this.noteLoading = true;
       getUserBlogs({ userId: this.userId, current: this.noteCurrent }).then(res => {
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
       getShopCollections({ userId: this.userId, sourceType: 2, current: 1 }).then(res => {
          this.collections = res.data || res || [];
          this.collections.forEach(s => {
             if(s.images) s.images = this.$fileURL + s.images;
          });
       });
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
       this.$router.push(`/blog/detail/${b.id}`);
    },
    toShopDetail(s) {
       this.$router.push(`/shop/detail/${s.id}`);
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
