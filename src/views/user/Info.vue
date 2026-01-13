<template>
  <div class="user-info-page" v-loading="pageLoading">
    <div class="header">
      <div class="header-back-btn" @click="goBack"><i class="el-icon-arrow-left"></i></div>
      <div class="header-title">个人主页</div>
      <div class="header-right-btn" @click="logout"><i class="el-icon-switch-button"></i></div>
    </div>

    <!-- Basic Info -->
    <div class="basic">
       <div class="basic-icon">
          <img :src="user.icon || '/imgs/icons/default-icon.png'" alt="">
       </div>
       <div class="basic-info">
          <div class="name">{{user.nickName || '未设置昵称'}}</div>
          <span class="location-text"><i class="el-icon-location-outline"></i> {{info.city || '未知城市'}}</span>
          <div class="edit-btn" @click="toEdit">
             编辑资料
          </div>
       </div>
    </div>

    <!-- Stats -->
    <div class="stats">
       <div class="stat-item">
          <div class="stat-number">{{stats.likeCount || 0}}</div>
          <div class="stat-label">获赞</div>
       </div>
       <div class="stat-item" @click="toFollows">
          <div class="stat-number">{{stats.followCount || 0}}</div>
          <div class="stat-label">关注</div>
       </div>
       <div class="stat-item" @click="toFans">
          <div class="stat-number">{{stats.fansCount || 0}}</div>
          <div class="stat-label">粉丝</div>
       </div>
    </div>

    <div class="introduce" @click="toEdit">
       <span v-if="info.introduce">{{info.introduce}}</span>
       <span v-else>添加个人简介，让大家更好的认识你 <i class="el-icon-edit"></i></span>
    </div>

    <!-- Quick Actions -->
    <div class="quick-actions">
       <div class="action-item" @click="toOrders">
          <div class="action-icon"><i class="el-icon-s-order"></i></div>
          <div class="action-label">我的订单</div>
       </div>
       <div class="action-item" @click="activeTab = 'collection'">
          <div class="action-icon"><i class="el-icon-star-on"></i></div>
          <div class="action-label">我的收藏</div>
       </div>
       <div class="action-item" @click="$router.push('/chat/list')">
          <div class="action-icon"><i class="el-icon-message-solid"></i></div>
          <div class="action-label">消息通知</div>
       </div>
    </div>
    
    <!-- Content Tabs -->
    <div class="content-tabs">
       <el-tabs v-model="activeTab" stretch @tab-click="handleTabClick">
          <!-- Notes Tab -->
          <el-tab-pane label="笔记" name="note">
             <div class="tab-content" ref="tabNote" v-infinite-scroll="loadMoreBlogs" :infinite-scroll-disabled="activeTab !== 'note' || blogLoading || blogNoMore">
                <div v-if="blogs.length > 0">
                   <div v-for="b in blogs" :key="b.id" class="blog-item" @click="toBlogDetail(b)">
                      <!-- Header -->
                      <div class="blog-header">
                         <img :src="b.icon || user.icon" class="blog-avatar">
                         <div class="blog-user-box">
                            <div class="blog-username">{{ b.nickName || user.nickName }}</div>
                            <div class="blog-date">{{ formatTime(b.createTime) }}</div>
                         </div>
                      </div>
                      <!-- Body -->
                      <div class="blog-body">
                         <div class="blog-img">
                            <img :src="getFirstImage(b.images)" alt="">
                         </div>
                         <div class="blog-content-col">
                            <div class="blog-title">{{ b.title }}</div>
                            <div class="blog-actions">
                               <div class="action-btn" @click.stop="toggleLike(b)">
                                  <svg class="icon" viewBox="0 0 1024 1024" width="16" height="16" style="margin-right: 2px;">
                                    <path d="M160 944c0 8.8-7.2 16-16 16h-32c-26.5 0-48-21.5-48-48V528c0-26.5 21.5-48 48-48h32c8.8 0 16 7.2 16 16v448zM96 416c-53 0-96 43-96 96v416c0 53 43 96 96 96h96c17.7 0 32-14.3 32-32V448c0-17.7-14.3-32-32-32H96zM505.6 64c16.2 0 26.4 8.7 31 13.9 4.6 5.2 12.1 16.3 10.3 32.4l-23.5 203.4c-4.9 42.2 8.6 84.6 36.8 116.4 28.3 31.7 68.9 49.9 111.4 49.9h271.2c6.6 0 10.8 3.3 13.2 6.1s5 7.5 4 14l-48 303.4c-6.9 43.6-29.1 83.4-62.7 112C815.8 944.2 773 960 728.9 960h-317c-33.1 0-59.9-26.8-59.9-59.9v-455c0-6.1 1.7-12 5-17.1 69.5-109 106.4-234.2 107-364h41.6z m0-64h-44.9C427.2 0 400 27.2 400 60.7c0 127.1-39.1 251.2-112 355.3v484.1c0 68.4 55.5 123.9 123.9 123.9h317c122.7 0 227.2-89.3 246.3-210.5l47.9-303.4c7.8-49.4-30.4-94.1-80.4-94.1H671.6c-50.9 0-90.5-44.4-84.6-95l23.5-203.4C617.7 55 568.7 0 505.6 0z" :fill="b.isLike ? '#ff6633' : '#82848a'"></path>
                                  </svg>
                                  {{b.liked || 0}}
                               </div>
                               <div class="action-btn"><i class="el-icon-chat-dot-round"></i> {{b.comments || 0}}</div>
                               <div class="action-btn"><i class="el-icon-share"></i> 分享</div>
                               <div class="action-btn edit-btn" @click.stop="handleEditBlog(b)"><i class="el-icon-edit"></i></div>
                               <div class="action-btn delete-btn" @click.stop="handleDeleteBlog(b)"><i class="el-icon-delete"></i></div>
                            </div>
                         </div>
                      </div>
                   </div>
                   <div class="loading-state" v-if="blogLoading"><i class="el-icon-loading"></i> 加载中...</div>
                   <div class="no-more" v-if="blogNoMore && blogs.length > 0">没有更多了</div>
                </div>
                <div v-else-if="!blogLoading" class="empty-state">
                   <i class="el-icon-document"></i>
                   <p>暂无笔记</p>
                </div>
                <div v-else class="loading-state"><i class="el-icon-loading"></i> 加载中...</div>
             </div>
          </el-tab-pane>

          <!-- Collections Tab -->
          <el-tab-pane label="店铺收藏" name="collection">
             <div class="tab-content" ref="tabCollection" v-infinite-scroll="loadMoreCollections" :infinite-scroll-disabled="activeTab !== 'collection' || collectionLoading || collectionNoMore">
                <div v-if="collections.length > 0">
                   <div v-for="shop in collections" :key="shop.id" class="shop-item" @click="toShopDetail(shop)">
                      <div class="shop-img">
                         <img :src="getFirstImage(shop.images)" @error="handleImgError">
                      </div>
                      <div class="shop-info">
                         <div class="shop-title">{{ shop.name }}</div>
                         <div class="shop-rate">
                            <el-rate :model-value="shop.score/10" disabled show-score text-color="#F63"></el-rate>
                            <span class="comment-count">{{ shop.comments }}条</span>
                         </div>
                         <div class="shop-meta">
                            <span>{{ shop.area }}</span>
                            <span v-if="shop.distance">{{ formatDistance(shop.distance) }}</span>
                         </div>
                         <div class="shop-price">￥{{ shop.avgPrice }}/人</div>
                         <div class="shop-action">
                            <el-button size="mini" @click.stop="uncollectShop(shop.id)">取消收藏</el-button>
                         </div>
                      </div>
                   </div>
                   <div class="loading-state" v-if="collectionLoading"><i class="el-icon-loading"></i> 加载中...</div>
                   <div class="no-more" v-if="collectionNoMore && collections.length > 0">没有更多了</div>
                </div>
                <div v-else-if="!collectionLoading" class="empty-state">
                   <i class="el-icon-star-off"></i>
                   <p>暂无收藏</p>
                </div>
                <div v-else class="loading-state"><i class="el-icon-loading"></i> 加载中...</div>
             </div>
          </el-tab-pane>

          <!-- Feeds Tab -->
          <el-tab-pane label="动态" name="feed">
             <div class="tab-content" ref="tabFeed" v-infinite-scroll="loadMoreFeeds" :infinite-scroll-disabled="activeTab !== 'feed' || feedLoading || feedNoMore">
                 <div v-if="feeds.length > 0">
                   <div v-for="b in feeds" :key="b.id" class="blog-item" @click="toBlogDetail(b)">
                      <!-- Header -->
                      <div class="blog-header">
                         <img :src="b.icon" class="blog-avatar">
                         <div class="blog-user-box">
                            <div class="blog-username">{{ b.name }}</div>
                            <div class="blog-date">{{ formatTime(b.createTime) }}</div>
                         </div>
                      </div>
                      <!-- Body -->
                      <div class="blog-body">
                         <div class="blog-img">
                            <img :src="getFirstImage(b.images)" alt="">
                         </div>
                         <div class="blog-content-col">
                            <div class="blog-title">{{ b.title }}</div>
                            <div class="blog-actions">
                               <div class="action-btn" @click.stop="toggleLike(b)">
                                  <svg class="icon" viewBox="0 0 1024 1024" width="16" height="16">
                                    <path d="M160 944c0 8.8-7.2 16-16 16h-32c-26.5 0-48-21.5-48-48V528c0-26.5 21.5-48 48-48h32c8.8 0 16 7.2 16 16v448zM96 416c-53 0-96 43-96 96v416c0 53 43 96 96 96h96c17.7 0 32-14.3 32-32V448c0-17.7-14.3-32-32-32H96zM505.6 64c16.2 0 26.4 8.7 31 13.9 4.6 5.2 12.1 16.3 10.3 32.4l-23.5 203.4c-4.9 42.2 8.6 84.6 36.8 116.4 28.3 31.7 68.9 49.9 111.4 49.9h271.2c6.6 0 10.8 3.3 13.2 6.1s5 7.5 4 14l-48 303.4c-6.9 43.6-29.1 83.4-62.7 112C815.8 944.2 773 960 728.9 960h-317c-33.1 0-59.9-26.8-59.9-59.9v-455c0-6.1 1.7-12 5-17.1 69.5-109 106.4-234.2 107-364h41.6z m0-64h-44.9C427.2 0 400 27.2 400 60.7c0 127.1-39.1 251.2-112 355.3v484.1c0 68.4 55.5 123.9 123.9 123.9h317c122.7 0 227.2-89.3 246.3-210.5l47.9-303.4c7.8-49.4-30.4-94.1-80.4-94.1H671.6c-50.9 0-90.5-44.4-84.6-95l23.5-203.4C617.7 55 568.7 0 505.6 0z" :fill="b.isLike ? '#ff6633' : '#82848a'"></path>
                                  </svg>
                                  {{b.liked || 0}}
                               </div>
                               <div class="action-btn"><i class="el-icon-chat-dot-round"></i> {{b.comments || 0}}</div>
                               <div class="action-btn"><i class="el-icon-share"></i> 分享</div>
                            </div>
                         </div>
                      </div>
                   </div>
                   <div class="loading-state" v-if="feedLoading"><i class="el-icon-loading"></i> 加载中...</div>
                   <div class="no-more" v-if="feedNoMore && feeds.length > 0">没有更多了</div>
                </div>
                <div v-else-if="!feedLoading" class="empty-state">
                   <i class="el-icon-chat-line-round"></i>
                   <p>暂无动态</p>
                </div>
                <div v-else class="loading-state"><i class="el-icon-loading"></i> 加载中...</div>
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
import { getMyBlogs, getFollowedFeeds, deleteBlog } from '@/api/blog';
import { getShopCollections, uncollectShop, likeBlog } from '@/api/interaction';

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
     },

     // Blog Logic
     queryBlogs() {
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
     handleDeleteBlog(b) {
        this.$confirm('确定删除这篇笔记吗？删除后不可恢复', '提示', {
           confirmButtonText: '确定',
           cancelButtonText: '取消',
           type: 'warning'
        }).then(() => {
           deleteBlog(b.id).then(() => {
              this.blogs = this.blogs.filter(item => item.id !== b.id);
              this.$message.success('删除成功');
           }).catch(() => {
              this.$message.error('删除失败');
           });
        }).catch(() => {});
     },
     handleEditBlog(b) {
        this.$router.push({ path: '/blog/edit', query: { id: b.id } });
     },
     // Collection Logic
     queryCollections() {
        this.collectionCurrent = 1;
        this.collectionLoading = true;
        this.collectionNoMore = false;
        getShopCollections({ userId: this.user.id, current: this.collectionCurrent }).then(res => {
           const list = res.data || res || [];
           this.collections = list.map(this.processShop);
           if(list.length < 10) this.collectionNoMore = true;
        }).finally(() => this.collectionLoading = false);
     },
     loadMoreCollections() {
         if(this.collectionLoading || this.collectionNoMore) return;
         this.collectionLoading = true;
         this.collectionCurrent++;
         getShopCollections({ userId: this.user.id, current: this.collectionCurrent }).then(res => {
             const list = res.data || res || [];
             if(list.length > 0) {
                 this.collections = [...this.collections, ...list.map(this.processShop)];
             }
             if(list.length < 10) this.collectionNoMore = true;
         }).catch(() => {
             this.collectionCurrent--;
         }).finally(() => this.collectionLoading = false);
     },
     processShop(s) {
         if(s.images && typeof s.images === 'string') {
             // Handle case where images might be comma separated string
         }
         return s;
     },
     uncollectShop(shopId) {
        uncollectShop(shopId).then(() => {
           this.$message.success("已取消收藏");
           this.collections = this.collections.filter(c => c.id !== shopId);
        });
     },

     // Feed Logic
     queryFeeds() {
        this.feedLoading = true;
        this.feedNoMore = false;
        this.feedParams.minTime = new Date().getTime();
        this.feedParams.offset = 0;
        const lastId = this.feedParams.minTime;
        getFollowedFeeds({ offset: 0, lastId }).then(res => {
           const data = res.data || res || {};
           const list = data.list || [];
           this.feeds = list.map(b => ({
               ...b,
               icon: b.icon ? this.$fileURL + b.icon : ''
           }));
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
                this.feeds = [...this.feeds, ...list.map(b => ({
                    ...b,
                    icon: b.icon ? this.$fileURL + b.icon : ''
                }))];
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
        if(!images) return '/imgs/default-blog.jpg';
        const img = images.split(',')[0];
        return this.$fileURL + img;
     },
     handleImgError(e) {
        e.target.src = '/imgs/icons/default-icon.png';
     },
     formatDistance(d) {
        return d < 1000 ? d.toFixed(1) + 'm' : (d/1000).toFixed(1) + 'km';
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
     loadMoreFeeds() {
         if(!this.feedLoading && !this.feedNoMore) this.queryFeeds();
     },
     onScroll(e, type) {
        const { scrollTop, clientHeight, scrollHeight } = e.target;
        if(scrollTop + clientHeight >= scrollHeight - 50) {
           if(type === 'blog' && !this.blogLoading && !this.blogNoMore) this.queryBlogs();
           if(type === 'collection' && !this.collectionLoading && !this.collectionNoMore) this.queryCollections();
           if(type === 'feed' && !this.feedLoading && !this.feedNoMore) this.queryFeeds();
        }
     }
  }
}
</script>

<style scoped>
.user-info-page { min-height: 100vh; background: #f5f5f5; padding-bottom: 60px; box-sizing: border-box; }
.user-info-page * { box-sizing: border-box; }
.header { height: 50px; background: white; display: flex; align-items: center; padding: 0 15px; border-bottom: 1px solid #eee; position: sticky; top: 0; z-index: 10; }
.header-title { flex: 1; text-align: center; font-weight: bold; }
.header-right-btn { position: absolute; right: 15px; top: 0; height: 50px; line-height: 50px; font-size: 20px; color: #333; cursor: pointer; }

/* Basic Info */
.basic { display: flex; align-items: center; padding: 30px 20px; background: white; margin-bottom: 10px; position: relative; }
.basic-icon img { width: 70px; height: 70px; border-radius: 50%; border: 1px solid #eee; }
.basic-info { margin-left: 15px; flex: 1; }
.basic-info .name { font-size: 20px; font-weight: bold; margin-bottom: 5px; }
.location-text { font-size: 12px; color: #999; display: block; margin-bottom: 8px; }
.edit-btn { display: inline-block; padding: 4px 15px; border: 1px solid #ddd; border-radius: 20px; font-size: 12px; }

/* Stats */
.stats { display: flex; background: white; padding: 15px 0; margin-bottom: 1px; }
.stat-item { flex: 1; text-align: center; cursor: pointer; }
.stat-number { font-weight: bold; font-size: 16px; margin-bottom: 3px; }
.stat-label { font-size: 12px; color: #999; }

.introduce { background: white; padding: 10px 20px; margin-bottom: 10px; font-size: 13px; color: #666; }

/* Quick Actions */
.quick-actions { display: flex; background: white; padding: 15px 0; margin-bottom: 10px; }
.action-item { flex: 1; text-align: center; cursor: pointer; }
.action-icon { font-size: 24px; color: #ff6633; margin-bottom: 5px; }
.action-label { font-size: 12px; color: #333; }

/* Tabs */
.content-tabs { background: white; margin-top: 10px; }
.el-tabs { }
:deep(.el-tabs__content) { }
.el-tab-pane { }
.tab-content { padding: 10px; background: #f5f5f5; min-height: 300px; }
:deep(.el-tabs__header) { margin-bottom: 0; position: sticky; top: 50px; z-index: 9; background: white; }

/* Blog Item */
.blog-item { background: white; margin-bottom: 10px; border-radius: 8px; overflow: hidden; cursor: pointer; padding: 15px; border-bottom: 1px solid #f5f5f5; }
.blog-header { display: flex; align-items: center; margin-bottom: 10px; }
.blog-avatar { width: 40px; height: 40px; border-radius: 50%; margin-right: 10px; object-fit: cover; }
.blog-user-box { display: flex; flex-direction: column; }
.blog-username { font-size: 14px; color: #333; font-weight: 500; }
.blog-date { font-size: 12px; color: #999; margin-top: 2px; }

.blog-body { display: flex; }
.blog-img { width: 100px; height: 100px; flex-shrink: 0; margin-right: 10px; border-radius: 4px; overflow: hidden; background: #f0f0f0; }
.blog-img img { width: 100%; height: 100%; object-fit: cover; }
.blog-content-col { flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
.blog-title { font-size: 15px; color: #333; line-height: 1.4; margin-bottom: 5px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; height: 42px; }
.blog-actions { display: flex; align-items: center; justify-content: space-between; padding-right: 10px; margin-top: auto; }
.action-btn { display: flex; align-items: center; color: #999; font-size: 13px; }
.action-btn i { font-size: 16px; margin-right: 4px; }
.action-btn:hover { color: #ff6633; }
.action-btn.delete-btn { color: #ff4d4f; }
.action-btn.delete-btn:hover { color: #ff1a1a; }
.action-btn.edit-btn { color: #409eff; border: none; outline: none; background: none; }
.action-btn.edit-btn:hover { color: #66b1ff; }

/* Shop Item */
.shop-item { display: flex; background: white; padding: 10px; margin-bottom: 10px; border-radius: 8px; }
.shop-img { width: 80px; height: 80px; flex-shrink: 0; margin-right: 10px; }
.shop-img img { width: 100%; height: 100%; object-fit: cover; border-radius: 5px; }
.shop-info { flex: 1; width: 0; }
.shop-title { font-weight: bold; font-size: 15px; margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.shop-rate { display: flex; align-items: center; font-size: 12px; margin-bottom: 5px; }
.comment-count { margin-left: 5px; color: #999; }
.shop-meta, .shop-price { font-size: 12px; color: #666; margin-bottom: 5px; display: flex; justify-content: space-between; }
.shop-action { text-align: right; }

.empty-state { text-align: center; padding: 50px 0; color: #ccc; }
.empty-state i { font-size: 40px; margin-bottom: 10px; }
.loading-state, .no-more { text-align: center; padding: 10px; color: #999; font-size: 12px; }
.footer-container { height: 60px; }
</style>
