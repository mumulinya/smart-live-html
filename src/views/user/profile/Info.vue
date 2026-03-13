<template>
  <PageLayout :loading="pageLoading" skeleton-type="profile" class="user-info-page"
       @touchstart="handleTouchStart"
       @touchmove="handleTouchMove"
       @touchend="handleTouchEnd">
    <!-- Cover Image -->
    <!-- Cover Image -->
    <!-- Cover Image -->
    <div class="profile-cover-container" :style="containerStyle" @click="isExpanded = !isExpanded">
      <img v-if="coverUrl" :src="coverUrl" :style="imgStyle" class="cover-img">
      <div class="change-bg-btn" @click.stop="triggerBgUpload" v-if="isExpanded">
         <i class="el-icon-camera"></i>
         <span>更换封面</span>
      </div>
      <input type="file" ref="bgInput" accept="image/*" style="display:none" @change="handleBgUpload">
    </div>



    <!-- Navbar (Fixed, Transparent->White) -->
    <div class="nav-bar" :class="{ 'nav-scrolled': scrollTop > 50 }">
       <div class="nav-left">
          <i class="el-icon-back" @click="goBack" v-if="!isSelf" :style="{ color: scrollTop > 50 ? '#333' : '#fff' }"></i>
          <div class="icon-btn top-add-user-btn" @click="toAddFriend" v-if="isSelf" :style="{ color: scrollTop > 50 ? '#333' : '#fff', background: scrollTop > 50 ? 'transparent' : 'rgba(93, 131, 173, 0.35)', border: scrollTop > 50 ? 'none' : '0.5px solid rgba(255,255,255,0.3)' }">
             <i class="el-icon-user-solid"></i>
             <span class="add-text">添加朋友</span>
          </div>
       </div>
       <div class="nav-title" v-if="scrollTop > 50">{{ user.nickName }}</div>
       <div class="nav-right">
          <div class="icon-btn top-circle-btn" @click="$router.push('/search/user')" :style="{ color: scrollTop > 50 ? '#333' : '#fff', background: scrollTop > 50 ? 'transparent' : 'rgba(93, 131, 173, 0.35)',  border: scrollTop > 50 ? 'none' : '0.5px solid rgba(255,255,255,0.3)' }"><i class="el-icon-search"></i></div>
          <div class="icon-btn top-circle-btn top-menu-btn" @click="logout" v-if="isSelf" :style="{ color: scrollTop > 50 ? '#333' : '#fff', background: scrollTop > 50 ? 'transparent' : 'rgba(93, 131, 173, 0.35)', border: scrollTop > 50 ? 'none' : '0.5px solid rgba(255,255,255,0.3)' }"><i class="el-icon-s-operation"></i></div>
       </div>
    </div>

    <!-- Header Section -->
    <div class="profile-header" @click="isExpanded = false">
       <div class="header-top">
          <!-- Avatar -->
          <div class="avatar-box" @click="showAvatarDialog = true">
             <van-image round width="80" height="80" :src="user.icon || '/imgs/icons/default-icon.png'" class="avatar-img" fit="cover" />
             <!-- Removed + add status for self -->
          </div>
          <!-- Stats -->
          <div class="stats-box">
             <div class="stat-item">
                <div class="stat-num">{{ formatCount(info?.liked || 0) }}</div>
                <div class="stat-label">获赞</div>
             </div>
             <div class="stat-item" @click="toFollows">
                <div class="stat-num">{{ formatCount(info?.followee || 0) }}</div>
                <div class="stat-label">关注</div>
             </div>
             <div class="stat-item" @click="toFans">
                <div class="stat-num">{{ formatCount(info?.fans || 0) }}</div>
                <div class="stat-label">粉丝</div>
             </div>
          </div>
       </div>

       <!-- Info Text -->
        <div class="info-text-section">
          <div class="user-name-row">
             <div class="cancel-bold-name">{{ user.nickName || '未命名' }}</div>
             <button type="button" class="name-edit-btn" @click="toEdit" v-if="isSelf">编辑资料</button>
          </div>
          <div class="user-id-row">
             <span>生活号：{{ user.id || '未知' }}</span>
             <i class="el-icon-document-copy" @click="copyId"></i>
          </div>
          <!-- Bio -->
          <div class="user-bio">
             {{ info.introduce || '填写简介，让大家更好地认识你' }}
          </div>
          <!-- Tags -->
          <div class="user-tags-row">
             <div class="gender-tag" v-if="info.gender !== undefined">
                <i :class="info.gender === 0 ? 'el-icon-male' : 'el-icon-female'"></i>
                {{ info.birthday ? getAge(info.birthday) + '岁' : '' }}
             </div>
             <div class="info-tag" v-if="info.city">{{ info.city }}</div>
             <div class="info-tag" v-if="info.school">{{ info.school }}</div>
             <!-- Removed + Add Info Tag -->
          </div>
       </div>

       <!-- Action Buttons -->
       <div class="action-buttons-row" v-if="!isSelf">
          <div class="follow-btn" v-if="!isSelf" @click="handleFollow">关注</div>
          <div class="chat-btn" v-if="!isSelf" @click="toChat">私信</div>
       </div>
    </div>

    <!-- Service Bar (Horizontal Scroll if needed, or fixed 4) -->
    <!-- Service Bar (Grid) -->
    <div class="service-bar-container">
        <van-grid clickable :column-num="4" :border="false" class="custom-grid">
            <van-grid-item @click="toOrders">
               <template #icon>
                   <div class="service-icon-wrapper bg-blue priority">
                       <van-icon name="orders-o" size="24" color="#409EFF" />
                   </div>
               </template>
               <template #text>
                   <span class="service-text priority-text">订单</span>
               </template>
            </van-grid-item>
            <van-grid-item @click="toWallet">
               <template #icon>
                   <div class="service-icon-wrapper bg-orange priority">
                       <van-icon name="balance-o" size="24" color="#ff9900" />
                   </div>
               </template>
               <template #text>
                   <span class="service-text priority-text">钱包</span>
               </template>
            </van-grid-item>
             <van-grid-item @click="toCollections">
               <template #icon>
                   <div class="service-icon-wrapper bg-red priority">
                       <van-icon name="star-o" size="24" color="#ff2442" />
                   </div>
               </template>
               <template #text>
                   <span class="service-text priority-text">收藏</span>
               </template>
            </van-grid-item>
             <van-grid-item @click="toInteractions">
               <template #icon>
                   <div class="service-icon-wrapper bg-purple">
                       <van-icon name="comment-o" size="24" color="#8e44ad" />
                   </div>
               </template>
               <template #text>
                   <span class="service-text">互动</span>
               </template>
            </van-grid-item>
             <van-grid-item @click="toMyFollow">
               <template #icon>
                    <div class="service-icon-wrapper bg-cyan">
                        <van-icon name="friends-o" size="24" color="#00bcd4" />
                    </div>
               </template>
               <template #text>
                   <span class="service-text">关注</span>
               </template>
            </van-grid-item>
             <van-grid-item @click="$router.push('/user/moments')">
               <template #icon>
                    <div class="service-icon-wrapper bg-pink">
                        <van-icon name="clock-o" size="24" color="#FF4081" />
                    </div>
               </template>
               <template #text>
                   <span class="service-text">动态</span>
               </template>
            </van-grid-item>
            <van-grid-item @click.stop="$router.push({ path: '/review/mine', query: { tab: 'reviewed' } })">
               <template #icon>
                    <div class="service-icon-wrapper bg-grayblue">
                        <van-icon name="description-o" size="24" color="#607D8B" />
                    </div>
               </template>
               <template #text>
                   <span class="service-text">评价</span>
               </template>
            </van-grid-item>
            <van-grid-item @click="toDrafts">
               <template #icon>
                    <div class="service-icon-wrapper bg-green">
                        <van-icon name="notes-o" size="24" color="#67C23A" />
                    </div>
               </template>
               <template #text>
                   <span class="service-text">草稿箱</span>
               </template>
            </van-grid-item>
        </van-grid>
    </div>

    <!-- Sticky Tabs -->
    <div class="sticky-tabs-container">
        <van-tabs v-model:active="activeTab" sticky offset-top="50" @change="handleTabChange">
            <van-tab title="笔记" name="note">
                <template #title>
                    <div class="tab-label">
                        <span>笔记</span> 
                        <span class="tab-num" v-if="stats.blogCount">{{ stats.blogCount }}</span>
                    </div>
                </template>
                <div
                    class="tab-content"
                    v-infinite-scroll="loadMoreBlogs"
                    :infinite-scroll-disabled="activeTab !== 'note' || blogLoading || blogNoMore || blogs.length === 0"
                    :infinite-scroll-immediate="true"
                >
                    <div class="waterfall-container">
                        <div class="waterfall-column" v-for="(col, i) in blogColumns" :key="'blog-col-' + i">
                            <div class="waterfall-item" v-for="(b, index) in col" :key="b.id" @click="toBlogDetail(b)">
                                <div class="card-img-box">
                                    <img
                                        v-show="!b.imgError"
                                        :src="getFirstImage(b.images)"
                                        class="work-cover note-cover"
                                        :class="{ 'is-loaded': b.imgLoaded }"
                                        :loading="getImageLoading(index)"
                                        :fetchpriority="index < 2 ? 'high' : 'auto'"
                                        decoding="async"
                                        @error="handleImageError($event, b)"
                                        @load="handleImageLoad($event, b)"
                                    >
                                    <div class="img-skeleton" v-if="!b.imgError && !b.imgLoaded"></div>
                                    <div class="img-placeholder" v-if="b.imgError">图片加载失败</div>
                                    <div class="pinned-tag" v-if="b.pin || b.isTop">置顶</div>
                                    <div v-if="isSelf && getBlogDisplayStatusMeta(b).visible" class="profile-blog-status-tag">
                                        <span :class="['biz-status-chip', getStatusToneClass(getBlogDisplayStatusMeta(b).tone)]">
                                            {{ getBlogDisplayStatusMeta(b).text }}
                                        </span>
                                    </div>
                                </div>
                                <div class="card-info">
                                    <div class="card-title">{{ b.title }}</div>
                                    <div v-if="isSelf && getBlogRejectReason(b)" class="single-status-panel__reason profile-blog-reason">驳回原因：{{ getBlogRejectReason(b) }}</div>
                                    <div class="card-bottom">
                                        <div class="card-user">
                                            <img :src="user.icon || '/imgs/icons/default-icon.png'" class="card-avatar">
                                            <span class="card-name">{{ user.nickName }}</span>
                                        </div>
                                        <div class="card-likes">
                                            <van-icon name="like-o" v-if="!b.isLike" color="#999" />
                                            <van-icon name="like" v-else color="#ff2442" />
                                            {{ b.liked || 0 }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div v-if="blogs.length === 0 && !blogLoading" class="empty-state">
                        <img src="https://img01.yzcdn.cn/vant/empty-image-default.png" class="empty-img">
                        <div class="empty-text">发布你的第一篇笔记此</div>
                    </div>
                </div>
            </van-tab>

            <van-tab title="收藏" name="collection">
                <template #title>
                    <div class="tab-label">
                        <span>收藏</span> 
                        <span class="tab-num" v-if="stats.blogStarCount">{{ stats.blogStarCount }}</span>
                    </div>
                </template>
                <div
                    class="tab-content"
                    v-infinite-scroll="loadMoreCollections"
                    :infinite-scroll-disabled="activeTab !== 'collection' || collectionLoading || collectionNoMore || collections.length === 0"
                    :infinite-scroll-immediate="true"
                >
                    <div class="waterfall-container">
                         <div class="waterfall-column" v-for="(col, i) in collectionColumns" :key="'collection-col-' + i">
                            <div class="waterfall-item" v-for="b in col" :key="b.id" @click="toBlogDetail(b)">
                                <div class="card-img-box">
                                    <img :src="getFirstImage(b.images)" class="work-cover" :class="{ 'is-loaded': b.imgLoaded }" loading="lazy" @error="handleImgError($event, b)" @load="b.imgLoaded=true">
                                    <div class="img-skeleton" v-if="!b.imgError && !b.imgLoaded"></div>
                                </div>
                                <div class="card-info">
                                    <div class="card-title">{{ b.title }}</div>
                                    <div class="card-bottom">
                                        <div class="card-user">
                                            <img :src="b.icon || user.icon || '/imgs/icons/default-icon.png'" class="card-avatar">
                                            <span class="card-name">{{ b.name || user.nickName }}</span>
                                        </div>
                                        <div class="card-likes">
                                            <van-icon name="like-o" v-if="!b.isLike" color="#999" />
                                            <van-icon name="like" v-else color="#ff2442" />
                                            {{ b.liked || 0 }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                         </div>
                    </div>
                     <div v-if="collections.length === 0 && !collectionLoading" class="empty-state">
                         <img src="https://img01.yzcdn.cn/vant/empty-image-default.png" class="empty-img">
                         <div class="empty-text">这里空空如也</div>
                    </div>
                </div>
            </van-tab>

            <van-tab title="喜欢" name="likes">
                <template #title>
                    <div class="tab-label">
                        <span>喜欢</span> 
                        <span class="tab-num" v-if="stats.blogLikeCount">{{ stats.blogLikeCount }}</span>
                    </div>
                </template>
                <div
                    class="tab-content"
                    v-infinite-scroll="loadMoreLikes"
                    :infinite-scroll-disabled="activeTab !== 'likes' || likeLoading || likeNoMore || likes.length === 0"
                    :infinite-scroll-immediate="true"
                >
                    <div class="waterfall-container">
                         <div class="waterfall-column" v-for="(col, i) in likeColumns" :key="'like-col-' + i">
                            <div class="waterfall-item" v-for="b in col" :key="b.id" @click="toBlogDetail(b)">
                                <div class="card-img-box">
                                    <img :src="getFirstImage(b.images)" class="work-cover" :class="{ 'is-loaded': b.imgLoaded }" loading="lazy" @error="handleImgError($event, b)" @load="b.imgLoaded=true">
                                    <div class="img-skeleton" v-if="!b.imgError && !b.imgLoaded"></div>
                                </div>
                                <div class="card-info">
                                    <div class="card-title">{{ b.title }}</div>
                                    <div class="card-bottom">
                                        <div class="card-user">
                                            <img :src="b.icon || user.icon || '/imgs/icons/default-icon.png'" class="card-avatar">
                                            <span class="card-name">{{ b.name || user.nickName }}</span>
                                        </div>
                                        <div class="card-likes">
                                            <van-icon name="like-o" v-if="!b.isLike" color="#999" />
                                            <van-icon name="like" v-else color="#ff2442" />
                                            {{ b.liked || 0 }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                         </div>
                    </div>
                     <div v-if="likes.length === 0 && !likeLoading" class="empty-state">
                         <img src="https://img01.yzcdn.cn/vant/empty-image-default.png" class="empty-img">
                         <div class="empty-text">去点个赞吧</div>
                    </div>
                </div>
            </van-tab>
        </van-tabs>
    </div>

    <!-- FootBar -->
    <div class="footer-container">
      <foot-bar :active-btn="4"></foot-bar>
    </div>

    <!-- Avatar Dialog -->
    <div class="avatar-dialog-overlay" v-if="showAvatarDialog" @click="showAvatarDialog = false">
       <div class="avatar-dialog-content" @click.stop>
          <div class="avatar-dialog-close" @click="showAvatarDialog = false"><i class="el-icon-close"></i></div>
          <img :src="user.icon || '/imgs/icons/default-icon.png'" class="avatar-big">
          <div class="avatar-actions">
             <div class="action-btn" @click="handleChangeAvatar">更换头像</div>
             <div class="action-btn secondary" @click="handleSaveAvatar">保存图片</div>
          </div>
       </div>
    </div>
    <input type="file" ref="avatarInput" accept="image/*" @change="onAvatarSelected" style="display:none">

    <!-- Logout Action Sheet -->
    <van-action-sheet
      v-model:show="showLogoutAction"
      :actions="logoutActions"
      cancel-text="取消"
      close-on-click-action
      @select="onLogoutSelect"
    />

    <!-- Image Preview Component -->
    <van-image-preview v-model:show="showPreview" :images="previewImages" @change="onChange">
    </van-image-preview>
  </PageLayout>
</template>

<script>
import FootBar from '@/components/FootBar.vue';
import { getCurrentUser, getFullUserInfo, getUserStats, uploadFile, updateUser } from '@/api/user';
import { getMyBlogs, getFollowedFeeds } from '@/api/blog';
import { likeBlog, likeRecord, starList } from '@/api/interaction';
import { filePrefix } from '@/utils/request';
import { locationUtil } from '@/utils/location';
import { updateBackgroundImage } from '@/api/user'; // Import new API
import {
    getRejectReasonText,
    getSingleDisplayStatusMeta,
    getStatusToneClass
} from '@/utils/contentStatus';
import { emitAuthChanged } from '@/utils/auth-event';

import PageLayout from '@/components/PageLayout/PageLayout.vue';

export default {
  name: 'UserInfo',
  components: { FootBar, PageLayout },
  data() {
    return {
       user: {},
       info: {},
       stats: { likeCount: 0, fansCount: 0, followCount: 0 },
       activeTab: 'note',
       pageLoading: false,
       
       // UI State
       scrollTop: 0,
       isSelf: true, // Info.vue is always current user
       showAvatarDialog: false,
       showLogoutAction: false,
       logoutActions: [
           { name: '退出登录', color: '#ee0a24' }
       ],
       
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
       
       // Touch Swipe
       touchStartX: 0,
       touchStartY: 0,
       coverHeight: 120, 
       isPulling: false,
       isExpanded: false,
       
        showPreview: false,
        previewImages: [],
        
        tabOrder: ['note', 'collection', 'likes', 'feed'],
        scrollTicking: false,
        scrollRafId: null,
        bottomCheckTimer: null
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
    blogColumns() {
        return this.splitWaterfallColumns(this.blogs);
    },
    collectionColumns() {
        return this.splitWaterfallColumns(this.collections);
    },
    likeColumns() {
        return this.splitWaterfallColumns(this.likes);
    },

  },
  created() {
     const token = localStorage.getItem('token');
     if (!token) {
        this.$router.push('/user/login');
        return;
     }

     // 从路由参数恢复 tab
     const tab = this.$route.query.tab;
     if (tab && ['note', 'collection', 'likes', 'feed'].includes(tab)) {
         this.activeTab = tab;
     }

     this.queryUser();
     // 移除这里的直接调用，移到 queryUser 成功回调中
     // this.loadTabData(this.activeTab);
  },
  activated() {
     // Keep-alive hook: sync tab from URL if changed (e.g. deep link)
     const tab = this.$route.query.tab;
     if (tab && tab !== this.activeTab && ['note', 'collection', 'likes', 'feed'].includes(tab)) {
         this.activeTab = tab;
         this.loadTabData(tab);
     }
     window.addEventListener('scroll', this.handleWindowScroll, { passive: true });
     this.scheduleBottomCheck(180);
  },
  deactivated() {
      window.removeEventListener('scroll', this.handleWindowScroll);
      this.clearBottomCheckTimer();
  },
  mounted() {
      // Listener moved to activated for keep-alive support
  },
  beforeUnmount() {
      window.removeEventListener('scroll', this.handleWindowScroll);
      if (this.scrollRafId !== null) {
          cancelAnimationFrame(this.scrollRafId);
          this.scrollRafId = null;
      }
      this.clearBottomCheckTimer();
      this.scrollTicking = false;
  },
  methods: {
    getStatusToneClass,
    getBlogDisplayStatusMeta(item) {
        return getSingleDisplayStatusMeta('blog', item?.status, item?.auditStatus);
    },
    getBlogRejectReason(item) {
        return getRejectReasonText(item?.auditStatus, item?.rejectReason);
    },
     splitWaterfallColumns(list) {
          const columns = [[], []];
         if (!Array.isArray(list) || list.length === 0) return columns;
         list.forEach((item, index) => {
             columns[index % 2].push(item);
         });
         return columns;
     },
     formatCount(num) {
         if (!num) return '0';
         if (num >= 10000) {
             return (num / 10000).toFixed(1).replace(/\.0$/, '') + '万';
         }
         return num;
     },
     clearBottomCheckTimer() {
         if (this.bottomCheckTimer !== null) {
             clearTimeout(this.bottomCheckTimer);
             this.bottomCheckTimer = null;
         }
     },
     scheduleBottomCheck(delay = 0) {
         this.clearBottomCheckTimer();
         this.bottomCheckTimer = setTimeout(() => {
             this.bottomCheckTimer = null;
             this.checkActiveTabLoadMore();
         }, delay);
     },
     checkActiveTabLoadMore() {
         const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
         const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight || 0;
         const clientHeight = document.documentElement.clientHeight || document.body.clientHeight || 0;

         this.scrollTop = scrollTop;

         if (scrollTop + clientHeight < scrollHeight - 100) return;

         const type = this.activeTab;
         if (type === 'note' && !this.blogLoading && !this.blogNoMore) this.loadMoreBlogs();
         if (type === 'collection' && !this.collectionLoading && !this.collectionNoMore) this.loadMoreCollections();
         if (type === 'likes' && !this.likeLoading && !this.likeNoMore) this.loadMoreLikes();
         if (type === 'feed' && !this.feedLoading && !this.feedNoMore) this.loadMoreFeeds();
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
     onChange(index) {
        this.index = index;
     },
     goBack() {
        this.$router.go(-1);
     },
     toAddFriend() {
        this.$router.push('/user/add-friend');
     },
     logout() {
        this.showLogoutAction = true;
     },
     onLogoutSelect(item) {
        if (item.name === '退出登录') {
            localStorage.removeItem("token");
            localStorage.removeItem("userInfo");
            emitAuthChanged('logout');
            this.$router.push('/user/login');
        }
     },
     toEdit() {
        this.$router.push('/user/edit');
     },
     toOrders() {
        this.$router.push('/order/list'); 
     },
     toWallet() {
        this.$router.push('/user/wallet');
     },
     toCollections() {
          this.$router.push('/user/star');
      },
     toMyFollow() {
        this.$router.push('/user/follow');
     },
     toInteractions() {
        this.$router.push('/user/interactions');
     },
     toReviews() {
        this.$router.push({ path: '/review/mine', query: { tab: 'reviewed' } });
     },
     toDrafts() {
        this.$router.push('/drafts');
     },
     toFollows() {
        this.$router.push('/user/list?type=follow');
     },
     toFans() {
        this.$router.push('/user/list?type=fans');
     },
     toHistory() {
         this.$message.info('浏览历史功能开发中');
     },
     toChat() {
         // Logic for other user chat
     },
     handleFollow() {
         // Logic for follow
     },
     copyId() {
         const id = this.user.phoneNumber || this.user.id;
         if(!id) return;
         navigator.clipboard.writeText(id).then(() => {
             this.$message.success('复制成功');
         }).catch(() => {
             this.$message.error('复制失败');
         });
     },
     handleWindowScroll() {
          if (this.scrollTicking) return;
          this.scrollTicking = true;
          this.scrollRafId = requestAnimationFrame(() => {
              this.scrollRafId = null;
              this.scrollTicking = false;
              const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
              this.scrollTop = scrollTop;
          });
      },
     // Data Query
     queryUser() {
        this.pageLoading = true;
        getCurrentUser().then(res => {
           let userData = res.data || res;
           if (userData && userData.data) userData = userData.data;
           
           if (!userData || !userData.id) {
              this.$message.error("登录已失效，请重新登录");
              localStorage.removeItem("token");
              emitAuthChanged('logout');
              this.$router.push("/user/login");
              return;
           }
           
           this.user = userData;
           if(this.user.icon) this.user.icon = this.$fileURL + this.user.icon;
            this.queryUserInfo();
            this.queryUserStats();
            // 用户信息加载完成后，再加载当前 Tab 的数据
            this.loadTabData(this.activeTab);
         }).catch(err => {
            console.error(err);
            this.$message.error("登录失效，请重新登录");
            localStorage.removeItem("token");
            emitAuthChanged('logout');
            this.$router.push("/user/login");
         }).finally(() => {
            this.pageLoading = false;
         });
     },
      // New Background Logic
      triggerBgUpload() {
          this.$refs.bgInput.click();
      },
      handleBgUpload(e) {
          const file = e.target.files[0];
          if(!file) return;
          if(file.size > 5 * 1024 * 1024) return this.$message.warning("图片大小不能超过5MB");
          
          const formData = new FormData();
          formData.append('file', file);
          
          this.pageLoading = true;
          uploadFile(formData).then(res => {
              let path = res.data || res;
              if (path.includes(filePrefix)) {
                  path = path.split(filePrefix)[1];
              }
              // Call API to update background
              updateBackgroundImage({ userId: this.user.id, backgroundImage: path }).then(() => {
                  this.$message.success("背景图修改成功");
                  // Update local user info to reflect change
                  this.user.backgroundImage = this.$fileURL + path; // Prioritize local update
                  this.info.backgroundImage = this.$fileURL + path; // Sync both just in case
              });
          }).finally(() => {
              this.pageLoading = false;
          });
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
           if (diffY < -50) { 
                this.isExpanded = false;
                this.coverHeight = 120;
           }
       } else {
           if (scrollTop <= 0 && diffY > 0) {
              if (e.cancelable && diffY < 200) e.preventDefault(); 
              this.isPulling = true;
              this.coverHeight = 120 + Math.pow(diffY, 0.8); 
           }
       }
    },
    handleTouchEnd(e) {
       if (this.isPulling) {
           this.isPulling = false;
           if (this.coverHeight > 180) {
              this.isExpanded = true;
           }
           this.coverHeight = 120;
       }
       
       // Horizontal Swipe (Tab Switch)
       const touchEndX = e.changedTouches[0].clientX;
       const touchEndY = e.changedTouches[0].clientY;
       
       const xDiff = this.touchStartX - touchEndX;
       const yDiff = this.touchStartY - touchEndY;
       
       // Verify it's primarily a horizontal swipe
       if (Math.abs(xDiff) > 50 && Math.abs(xDiff) > Math.abs(yDiff)) {
           const currentIndex = this.tabOrder.indexOf(this.activeTab);
           if (xDiff > 0) {
               // Next
               if (currentIndex < this.tabOrder.length - 1) {
                   this.activeTab = this.tabOrder[currentIndex + 1];
                   this.handleTabChange(this.activeTab);
               }
           } else {
               // Prev
               if (currentIndex > 0) {
                   this.activeTab = this.tabOrder[currentIndex - 1];
                   this.handleTabChange(this.activeTab);
               }
           }
       }
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
     handleTabChange(name) {
        // 保存 tab 状态到路由查询参数
        this.$router.replace({ query: { ...this.$route.query, tab: name } });
        this.loadTabData(name);
        this.scheduleBottomCheck(120);
     },
     handleTabClick(tab) {
         // Keep for compatibility if mixed usage
        this.loadTabData(tab.paneName || tab);
     },
     loadTabData(tabName) {
        if(tabName === 'note' && this.blogs.length === 0) this.queryBlogs();
        if(tabName === 'collection' && this.collections.length === 0) this.queryCollections();
        if(tabName === 'feed' && this.feeds.length === 0) this.queryFeeds();
        if(tabName === 'likes' && this.likes.length === 0) this.loadLikes();
     },

     // Blog Logic
     queryBlogs() {
        if(this.blogLoading) return;
        this.blogCurrent = 1;
        this.blogLoading = true;
        this.blogNoMore = false;
        getMyBlogs({ current: this.blogCurrent }).then(res => {
           const list = res.data || res || [];
           this.blogs = list.map(this.processBlog);
           if(list.length < 10) this.blogNoMore = true;
        }).finally(() => {
            this.blogLoading = false;
            if (this.activeTab === 'note') {
                this.scheduleBottomCheck(80);
            }
        });
     },
     // ... (Keep existing loadMoreBlogs, processBlog, etc.)
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
         }).finally(() => {
             this.blogLoading = false;
             if (this.activeTab === 'note') {
                 this.scheduleBottomCheck(80);
             }
         });
     },
     processBlog(b) {
        const item = (b && typeof b === 'object') ? b : {};
        const iconRaw = item.icon || item.userIcon || '';
        const avatarRaw = item.userAvatar || item.icon || item.userIcon || '';
        const toUrl = (val) => {
            if (!val || typeof val !== 'string') return '';
            if (
                val.startsWith('http') ||
                val.startsWith('/imgs/') ||
                val.startsWith('data:') ||
                val.startsWith('blob:')
            ) {
                return val;
            }
            return this.$fileURL + val;
        };
        return {
           ...item,
           icon: toUrl(iconRaw),
           userAvatar: toUrl(avatarRaw),
           images: item.images,
           // Image error flag
           imgError: false,
           imgLoaded: false
        };
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
        if (!merged.userAvatar && merged.icon) {
            merged.userAvatar = merged.icon;
        }
        if (!merged.name) {
            merged.name = merged.nickName || merged.userName || merged.username || '';
        }
        merged.likeTime = record.likeTime || merged.likeTime || merged.createTime || '';
        return merged;
     },
     
     // Collection Logic
     queryCollections() {
        if(this.collectionLoading) return;
        this.collectionCurrent = 1;
        this.collectionLoading = true;
        this.collectionNoMore = false;
        starList({ userId: this.user.id, sourceType: 3, current: this.collectionCurrent, size: 10 }).then(res => {
           let list = res.data || res || [];
           if(list.records) list = list.records;
           
           this.collections = list.map(this.processBlog);
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
            this.likes = list.map(this.normalizeLikeRecord).map(this.processBlog);
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
                this.likes = [...this.likes, ...list.map(this.normalizeLikeRecord).map(this.processBlog)];
            }
            if(list.length < 10) this.likeNoMore = true;
        }).catch(() => {
            this.likeCurrent--;
        }).finally(() => this.likeLoading = false);
     },

     // Feed Logic
     queryFeeds() {
        if(this.feedLoading) return;
        this.feedLoading = true;
        this.feedNoMore = false;
        this.feedParams.minTime = new Date().getTime();
        this.feedParams.offset = 0;
        const lastId = this.feedParams.minTime;
        getFollowedFeeds({ offset: 0, lastId, status: 1 }).then(res => {
           const data = res.data || res || {};
           const list = data.list || [];
           this.feeds = list.map(this.processBlog);
           this.feedParams.minTime = data.minTime;
           this.feedParams.offset = data.offset;
           if(list.length < 10) this.feedNoMore = true;
        }).finally(() => this.feedLoading = false);
     },
     loadMoreFeeds() {
         if(this.feedLoading || this.feedNoMore) return;
         this.feedLoading = true;
         const lastId = this.feedParams.minTime || new Date().getTime();
         getFollowedFeeds({ offset: this.feedParams.offset, lastId, status: 1 }).then(res => {
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

     // Helpers
     getFirstImage(images) {
        if(!images) return 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"><rect fill="%23f5f5f5" width="200" height="150"/><text x="100" y="75" font-size="14" fill="%23ccc" text-anchor="middle" dominant-baseline="middle">暂无图片</text></svg>';
        let img = '';
        if(Array.isArray(images)) {
            img = images[0];
        } else {
            img = images.split(',')[0];
        }
        
        if(!img) return 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"><rect fill="%23f5f5f5" width="200" height="150"/><text x="100" y="75" font-size="14" fill="%23ccc" text-anchor="middle" dominant-baseline="middle">暂无图片</text></svg>';
        if(img.startsWith('http')) return img;
        return this.$fileURL + img;
     },
     handleImageError(event, blog) {
        if (blog && typeof blog === 'object') {
            blog.imgError = true;
            blog.imgLoaded = false;
        }
     },
     handleImageLoad(event, blog) {
        if (blog && typeof blog === 'object') {
            blog.imgError = false;
            blog.imgLoaded = true;
        }
     },
     getImageLoading(index) {
        return index < 3 ? 'eager' : 'lazy';
     },
     handleImgError(e) {
        e.target.onerror = null;
        e.target.style.objectFit = 'contain';
        e.target.style.padding = '20px';
        e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"><rect fill="%23f5f5f5" width="200" height="150"/><text x="100" y="75" font-size="14" fill="%23ccc" text-anchor="middle" dominant-baseline="middle">加载失败</text></svg>';
     },
     getGenderText(g) {
        return g === 1 ? '男' : (g === 2 ? '女' : '');
     },
     getAge(birthday) {
        if (!birthday) return '';
        const birthDate = new Date(birthday);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
     },
     toBlogDetail(b) {
        this.$router.push({ path: '/blog/detail', query: { id: b.id } });
     },
     onScroll(e) {
        // Not used with Vant Tabs scroll? 
        // Vant Tabs handles content scrolling if sticky.
        // But for infinite list load, we usually rely on window scroll if not in container.
        // UserInfo page is window scroll.
     },
     // Avatar methods (Keep existing)
     handleChangeAvatar() {
        this.$refs.avatarInput.click();
     },
     onAvatarSelected(e) {
        const file = e.target.files[0];
        if(!file) return;
        if(file.size > 2 * 1024 * 1024) {
           this.$message.error('图片大小不能超过2MB');
           return;
        }
        const formData = new FormData();
        formData.append('file', file);
        this.pageLoading = true;
        uploadFile(formData).then(res => {
           const path = res.data || res;
           let savePath = path;
           if (path.includes(filePrefix)) {
              savePath = path.split(filePrefix)[1];
           }
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
        e.target.value = '';
     },
     handleSaveAvatar() {
        if(!this.user.icon) return;
        const link = document.createElement('a');
        link.href = this.user.icon;
        link.download = 'avatar.jpg';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
.user-info-page {
    min-height: 100vh;
    background: #fff;
    padding-bottom: 60px;
    position: relative;
    /* overflow-x: hidden; */ /* Allow sticky to work better */
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
    z-index: 1000;
    transition: background-color 0.3s, box-shadow 0.3s;
}
.nav-scrolled {
    background: #fff;
    box-shadow: 0 1px 5px rgba(0,0,0,0.05);
}
.nav-left, .nav-right {
    display: flex;
    align-items: center;
}
.nav-right {
    justify-content: flex-end;
}
.nav-left i {
    font-size: 24px;
    color: #333;
}
.nav-title {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 42%;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 16px;
    font-weight: 600;
    color: #333;
    opacity: 0;
    transition: opacity 0.3s;
}
.nav-scrolled .nav-title {
    opacity: 1;
}
.icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 28px;
    height: 28px;
    padding: 0 4px;
    border-radius: 14px;
    margin-left: 0;
    font-size: 20px;
    color: #333;
}
.icon-btn + .icon-btn {
    margin-left: 10px;
}
.top-circle-btn {
    width: 32px;
    min-width: 32px;
    height: 32px;
    padding: 0;
    border-radius: 50%;
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
}
.top-circle-btn i {
    font-size: 17px;
}
.top-add-user-btn {
    gap: 4px;
    min-width: 102px;
    height: 34px;
    padding: 0 12px;
    border-radius: 17px;
    font-size: 13px;
    font-weight: 600;
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
}
.top-add-user-btn i {
    font-size: 15px;
}
.top-add-user-btn .add-text {
    font-size: 13px;
    line-height: 1;
}
.top-menu-btn i {
    font-size: 16px;
}

/* Profile Cover */
.profile-cover {
    height: 240px;
    background-size: cover;
    background-position: center;
    position: relative;
}
.profile-cover::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 60px;
    background: linear-gradient(to bottom, transparent, rgba(0,0,0,0.1));
}

/* Header */
.profile-header {
    background: linear-gradient(to bottom, #fef9f5, #ffffff); /* Added Gradient */
    padding: 0 16px;
    padding-bottom: 15px;
    position: relative;
    margin-top: -20px; /* Overlap cover */
    border-top-left-radius: 16px;
    border-top-right-radius: 16px;
    z-index: 2;
}
.header-top {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
}
.avatar-box {
    position: relative;
    margin-right: 24px;
}
.avatar-img {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    object-fit: cover;
    border: 1px solid #f0f0f0;
}
.add-status {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 20px;
    height: 20px;
    background: #ff2442;
    color: white;
    border-radius: 50%;
    text-align: center;
    line-height: 20px;
    font-size: 14px;
    border: 2px solid #fff;
}
.stats-box {
    flex: 1;
    display: flex;
    justify-content: space-around;
}
.stat-item {
    text-align: center;
}
.stat-num {
    font-size: 20px;
    font-weight: 600;
    color: #333;
}
.stat-label {
    font-size: 13px;
    color: #999;
    margin-top: 4px;
}

/* Info Text */
.info-text-section {
    margin-bottom: 16px;
}
.user-name-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 6px;
}
.cancel-bold-name {
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 22px;
    font-weight: 600;
    color: #333;
}
.name-edit-btn {
    flex-shrink: 0;
    height: 32px;
    padding: 0 14px;
    border: 1px solid #ddd;
    border-radius: 16px;
    background: #fff;
    color: #333;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
}
.user-id-row {
    font-size: 12px;
    color: #999;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
}
.user-id-row i {
    margin-left: 4px;
    cursor: pointer;
}
.user-bio {
    font-size: 15px;
    color: #333;
    line-height: 1.5;
    margin-bottom: 12px;
    white-space: pre-wrap;
}
.user-tags-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}
.gender-tag, .info-tag {
    background: #f5f5f5;
    color: #666;
    padding: 4px 10px; /* Increased padding */
    border-radius: 4px;
    font-size: 12px; /* Increased from 10px */
    display: flex;
    align-items: center;
}
.gender-tag i {
    margin-right: 2px;
    font-size: 12px; /* Increased from 10px */
}
.gender-tag .el-icon-female { color: #ff4d94; }
.gender-tag .el-icon-male { color: #409eff; }

/* Action Buttons */
.action-buttons-row {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
}
.follow-btn, .chat-btn {
    flex: 1;
    height: 32px;
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
}
.follow-btn {
    background: #ff2442;
    color: white;
}
.chat-btn {
    border: 1px solid #ddd;
    color: #333;
}

/* Service Bar */
.service-bar-container {
    padding: 12px 4px;
    background: #fff;
    margin-bottom: 10px;
}
:deep(.van-grid-item__text) {
    font-size: 13px !important;
    color: #333 !important;
    margin-top: 4px;
}
.service-bar {
    display: flex;
    justify-content: space-around;
    /* padding: 0 10px; */
    margin-bottom: 10px;
    border-bottom: 1px solid #fafafa;
    padding-bottom: 10px;
}
.service-item {
    display: flex;
    flex-direction: column;
    align-items: center;
}
.service-item i {
    font-size: 24px;
    color: #333;
    margin-bottom: 4px;
}
.service-item span {
    font-size: 12px;
    color: #666;
}

/* Tabs */
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
    font-size: 14px; /* Increased from 12px */
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

/* Content Waterfall */
.tab-content {
    background: #f9f9f9;
    padding: 10px 4px;
    min-height: 400px;
}
.waterfall-container {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
}
.waterfall-column {
    width: 49%;
    display: flex;
    flex-direction: column;
    gap: 6px;
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
    position: relative;
    min-height: 120px;
    background: #f8f9fa;
    overflow: hidden;
}
.work-cover {
    width: 100%;
    display: block;
}
.note-cover {
    opacity: 0;
    transform: scale(1.015);
    transition: opacity 220ms ease, transform 420ms ease;
}
.note-cover.is-loaded {
    opacity: 1;
    transform: scale(1);
}
.img-skeleton {
    position: absolute;
    inset: 0;
    background: linear-gradient(100deg, #f3f4f6 30%, #ebeef2 45%, #f3f4f6 60%);
    background-size: 300% 100%;
    animation: profileImgShimmer 1.25s linear infinite;
    pointer-events: none;
}
@keyframes profileImgShimmer {
    0% {
        background-position: 100% 0;
    }
    100% {
        background-position: 0 0;
    }
}
.img-placeholder {
    width: 100%;
    min-height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #c0c4cc;
    font-size: 14px;
    background: #f5f5f5;
}
.pinned-tag {
    position: absolute;
    top: 8px;
    left: 8px;
    background: linear-gradient(135deg, #ff4d4f, #ff2442);
    color: white;
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 4px;
    z-index: 10;
}
.card-info {
    padding: 8px 10px 12px;
}
.profile-blog-status-tag {
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 10;
}
.profile-blog-reason {
    margin: 8px 0 10px;
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
.card-likes i, .card-likes svg {
    margin-right: 2px;
}

/* Empty State */
.empty-state {
    padding: 40px 0;
    text-align: center;
    color: #999;
    display: flex;
    flex-direction: column;
    align-items: center;
}
.empty-img {
    width: 100%;
  padding-bottom: 20px;
}
.change-bg-btn {
    position: absolute;
    bottom: 40px;
    right: 15px;
    background: rgba(0,0,0,0.4);
    color: #fff;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    display: flex;
    align-items: center;
    backdrop-filter: blur(4px);
    z-index: 10;
}
.change-bg-btn i {
    margin-right: 4px;
}

/* Avatar Dialog */
.avatar-dialog-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.5);
    z-index: 2000;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
}
.avatar-dialog-content {
    background: #fff;
    border-radius: 16px 16px 0 0;
    padding: 20px;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
}
.avatar-dialog-close {
    position: absolute;
    top: 16px;
    right: 16px;
    font-size: 20px;
    color: #999;
}
.avatar-big {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    margin-bottom: 30px;
    margin-top: 20px;
}
.avatar-actions {
    width: 100%;
}
.action-btn {
    width: 100%;
    height: 44px;
    background: #f5f5f5;
    border-radius: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    color: #333;
    margin-bottom: 12px;
}
.action-btn.secondary {
    background: transparent;
    border: 1px solid #eee;
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
/* ============ Service Grid UI ============ */
.service-bar-container {
    margin: 15px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
    overflow: hidden; /* Ensure grid items don't bleed out of rounded corners */
}

/* Base custom grid inner padding override */
.custom-grid :deep(.van-grid-item__content) {
    padding: 16px 8px;
    background-color: transparent;
}

/* Wrapper for the icons */
.service-icon-wrapper {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 8px;
    transition: transform 0.2s ease;
}
.service-icon-wrapper.priority {
    width: 50px;
    height: 50px;
    border-radius: 14px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.06);
}

/* Active touch state */
.custom-grid :deep(.van-grid-item__content:active) .service-icon-wrapper {
    transform: scale(0.92);
}

.service-text {
    font-size: 13px;
    color: #333;
    font-weight: 500;
}
.service-text.priority-text {
    font-weight: 600;
    color: #222;
}

/* Colors for specific functions */
.bg-blue { background-color: rgba(64, 158, 255, 0.1); }
.bg-orange { background-color: rgba(255, 153, 0, 0.1); }
.bg-green { background-color: rgba(103, 194, 58, 0.1); }
.bg-red { background-color: rgba(255, 36, 66, 0.1); }
.bg-purple { background-color: rgba(142, 68, 173, 0.1); }
.bg-cyan { background-color: rgba(0, 188, 212, 0.1); }
.bg-pink { background-color: rgba(255, 64, 129, 0.1); }
.bg-grayblue { background-color: rgba(96, 125, 139, 0.1); }

/* Status Tags */
.status-tag {
    position: absolute;
    top: 6px;
    right: 6px;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 11px;
    color: #fff;
    font-weight: 500;
    z-index: 2;
    backdrop-filter: blur(4px);
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.card-img-box .status-tag {
    display: none;
}
.status-pending {
    background: rgba(255, 153, 0, 0.85);
}
.status-rejected {
    background: rgba(255, 36, 66, 0.85);
}

</style>

