<template>
  <PageLayout :loading="pageLoading" skeleton-type="list" class="user-list-page">
    <van-nav-bar
      :title="user.nickName || '用户'"
      left-arrow
      fixed
      placeholder
      z-index="1001"
      @click-left="goBack"
    />

    <van-tabs 
      ref="tabsRef"
      v-model:active="activeTab" 
      sticky
      :offset-top="46"
      animated 
      swipeable 
      color="#ff5000" 
      :ellipsis="false"
      title-active-color="#333"
      @click-tab="handleTabClick"
    >
      <van-tab :title="'关注 ' + (stats.followCount || 0)" name="follow">
          <div class="list-container" v-infinite-scroll="loadMore" :infinite-scroll-disabled="loading || noMore" :infinite-scroll-distance="10">
             <div v-if="userList.length > 0">
                 <div v-for="u in userList" :key="u.id" class="user-item" @click="toUserDetail(u)">
                    <van-image round width="48px" height="48px" :src="u.icon || '/imgs/icons/default-icon.png'" fit="cover" class="user-avatar-img" />
                    
                    <div class="user-info">
                        <div class="user-name">{{ u.nickName || u.name || '匿名用户' }}</div>
                        <div class="user-desc van-ellipsis">{{ u.introduce || '这个人很懒，什么都没写' }}</div>
                    </div>

                    <div v-if="String(u.id) !== String(currentUserId)" class="action-btn-wrapper" @click.stop>
                        <button class="action-btn" :class="{ 'following': u.isFollow }" @click="toggleFollow(u)">
                            {{ u.isFollow ? '已关注' : '关注' }}
                        </button>
                    </div>
                 </div>
                 <div class="loading-state" v-if="loading"><van-loading size="24px" vertical>加载中...</van-loading></div>
                 <div class="no-more" v-if="noMore">没有更多了</div>
             </div>
             <van-empty v-else-if="!loading" description="暂无关注" />
          </div>
      </van-tab>

      <van-tab :title="'粉丝 ' + (stats.fansCount || 0)" name="fans">
           <div class="list-container" v-infinite-scroll="loadMore" :infinite-scroll-disabled="loading || noMore" :infinite-scroll-distance="10">
             <div v-if="userList.length > 0">
                 <div v-for="u in userList" :key="u.id" class="user-item" @click="toUserDetail(u)">
                    <van-image round width="48px" height="48px" :src="u.icon || '/imgs/icons/default-icon.png'" fit="cover" class="user-avatar-img" />
                    
                    <div class="user-info">
                        <div class="user-name">{{ u.nickName || u.name || '匿名用户' }}</div>
                        <div class="user-desc van-ellipsis">{{ u.introduce || '这个人很懒，什么都没写' }}</div>
                    </div>

                    <div v-if="String(u.id) !== String(currentUserId)" class="action-btn-wrapper" @click.stop>
                         <button class="action-btn" :class="{ 'following': u.isFollow }" @click="toggleFollow(u)">
                            {{ u.isFollow ? '已关注' : '关注' }}
                        </button>
                    </div>
                 </div>
                 <div class="loading-state" v-if="loading"><van-loading size="24px" vertical>加载中...</van-loading></div>
                 <div class="no-more" v-if="noMore">没有更多了</div>
             </div>
             <van-empty v-else-if="!loading" description="暂无粉丝" />
          </div>
      </van-tab>

      <van-tab v-if="!isMe" :title="'共同关注 ' + (stats.commonFollowCount || 0)" name="common">
          <div class="list-container" v-infinite-scroll="loadMore" :infinite-scroll-disabled="loading || noMore" :infinite-scroll-distance="10">
             <div v-if="userList.length > 0">
                 <div v-for="u in userList" :key="u.id" class="user-item" @click="toUserDetail(u)">
                    <van-image round width="48px" height="48px" :src="u.icon || '/imgs/icons/default-icon.png'" fit="cover" class="user-avatar-img" />
                    
                    <div class="user-info">
                        <div class="user-name">{{ u.nickName || u.name || '匿名用户' }}</div>
                        <div class="user-desc van-ellipsis">{{ u.introduce || '这个人很懒，什么都没写' }}</div>
                    </div>

                   <div v-if="String(u.id) !== String(currentUserId)" class="action-btn-wrapper" @click.stop>
                         <button class="action-btn" :class="{ 'following': u.isFollow }" @click="toggleFollow(u)">
                            {{ u.isFollow ? '已关注' : '关注' }}
                        </button>
                    </div>
                 </div>
                 <div class="loading-state" v-if="loading"><van-loading size="24px" vertical>加载中...</van-loading></div>
                 <div class="no-more" v-if="noMore">没有更多了</div>
             </div>
             <van-empty v-else-if="!loading" description="暂无共同关注" />
          </div>
      </van-tab>
    </van-tabs>
  </PageLayout>
</template>

<script>
import { getCurrentUser, getUserStats, getUserInfo } from '@/api/user';
import { getFollows, getFans, getCommonFollows, followUser } from '@/api/interaction';

import PageLayout from '@/components/PageLayout/PageLayout.vue';

export default {
  name: 'UserList',
  components: { PageLayout },
  props: ['type'],
  data() {
    return {
      user: {},
      stats: { followCount: 0, fansCount: 0, commonFollowCount: 0 },
      isMe: true,
      targetUserId: null,
      currentUserId: null,
      
      activeTab: this.type || 'follow',
      
      userList: [],
      current: 1,
      pageLoading: true,
      loading: false,
      noMore: false,
      refreshId: 0,
    }
  },
  created() {
    this.targetUserId = this.$route.query.id;
    if(this.type) this.activeTab = this.type;
    this.queryUser();
  },
  mounted() {
    this.refreshTabs();
    window.addEventListener('resize', this.refreshTabs);
  },
  activated() {
    this.refreshTabs();
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.refreshTabs);
  },
  watch: {
    loading(val) {
      if (!val) {
        this.refreshTabs();
      }
    }
  },
  methods: {
    refreshTabs() {
      this.$nextTick(() => {
        const tabs = this.$refs.tabsRef;
        const doResize = () => tabs?.resize?.();
        doResize();
        requestAnimationFrame(doResize);
        setTimeout(doResize, 120);
      });
    },
    goBack() {
      this.$router.back();
    },
    handleTabClick(name) {
        // Vant tabs emit name/index directly in newer versions or object in older
        // If it's the tab name string:
        this.activeTab = name.name || name; 
        this.resetList();
        this.refreshTabs();
    },
    async queryUser() {
      try {
          let myId = null;
          // 尝试获取当前登录用户，未登录时不影响后续逻辑
          try {
              const me = await getCurrentUser();
              myId = me.data ? me.data.id : null;
              this.currentUserId = myId;
          } catch (e) {
              // 用户未登录，继续执行
              console.log('用户未登录');
          }

          let targetId = this.targetUserId;
          if (!targetId || targetId == myId) {
              // 未登录且没有targetId时，无法显示数据
              if (!myId) {
                  this.loading = false;
                  this.pageLoading = false;
                  return;
              }
              this.isMe = true;
              const meRes = await getCurrentUser();
              this.user = meRes.data || {};
              const statsRes = await getUserStats(myId);
              this.stats = statsRes.data || {};
          } else {
              this.isMe = false;
              const otherRes = await getUserInfo(targetId);
              this.user = otherRes.data || {};

              const statsRes = await getUserStats(targetId);
              this.stats = statsRes.data || {};
          }

          this.resetList();
      } catch(e) {
          console.error(e);
          this.pageLoading = false;
      }
    },

    resetList() {
        this.refreshId++;
        this.userList = [];
        this.current = 1;
        this.noMore = false;
        this.loading = false;
        this.loadMore();
    },
    loadMore() {
        if(this.loading || this.noMore) return;
        this.loading = true;
        this.queryList();
    },
    queryList() {
        const currentRefreshId = this.refreshId;
        const targetTab = this.activeTab;
        
        let api = null;
        let params = {
            current: this.current,
            size: 10,
            sourceType: 1
        };
        
        if (targetTab === 'follow') {
            api = getFollows;
            params.userId = this.isMe ? this.user.id : this.targetUserId;
        } else if (targetTab === 'fans') {
             api = getFans;
             params.sourceId = this.isMe ? this.user.id : this.targetUserId;
        } else if (targetTab === 'common') {
             api = getCommonFollows;
             params.userId = this.targetUserId;
        }
        
        if(!api || (!this.user.id && !this.targetUserId)) { 
            this.loading = false;
            this.pageLoading = false;
            return; 
        }

        api(params).then(res => {
            if (targetTab !== this.activeTab || currentRefreshId !== this.refreshId) return; 
            
            let list = [];
            if (res.data && Array.isArray(res.data.records)) {
                list = res.data.records;
            } else if (res.data && Array.isArray(res.data)) {
                list = res.data;
            } else if (Array.isArray(res)) {
                list = res;
            }
            
            if (list.length < 10) {
                this.noMore = true;
            }
            
            list.forEach(u => {
                if(targetTab === 'follow' && this.isMe) {
                    u.isFollow = true;
                }
                if(targetTab === 'common') {
                    u.isFollow = true;
                }
                if(u.icon && !u.icon.startsWith('http')) {
                   u.icon = this.$fileURL + u.icon;
                }
            });

            this.userList = this.userList.concat(list);
            this.current++;
        }).catch(e => {
            console.error(e);
        }).finally(() => {
            if (targetTab === this.activeTab && currentRefreshId === this.refreshId) {
                this.loading = false;
            }
            this.pageLoading = false;
            this.refreshTabs();
        })
    },
    
    toggleFollow(u) {
      const newStatus = !u.isFollow;
      followUser({
         sourceId: u.id,
         sourceType: 1,
         isFollow: newStatus
      }).then(() => {
        u.isFollow = newStatus;
        if(newStatus) {
            this.$message.success('关注成功');
            if(this.isMe) this.stats.followCount++;
        } else {
            this.$message.success('已取消关注');
            if(this.isMe) this.stats.followCount--;
        }
      });
    },
    
    toUserDetail(u) {
      if(String(u.id) === String(this.currentUserId)) {
        this.$router.push('/user/profile');
      } else {
        this.$router.push(`/user/profile/${u.id}`);
      }
    }
  }
}
</script>

<style scoped>
.user-list-page {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.list-container {
    padding-bottom: 20px;
}

.user-item {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  background: white;
  margin-bottom: 1px; /* Divider effect */
}

.user-avatar-img {
    margin-right: 12px;
    border: 1px solid #f0f0f0;
}

.user-info {
  flex: 1;
  overflow: hidden; 
  margin-right: 12px;
}
.user-name {
    font-size: 16px;
    font-weight: 600;
    color: #333;
    margin-bottom: 4px;
}
.user-desc {
    font-size: 13px;
    color: #999;
}

/* Custom Button Styles */
.action-btn {
  min-width: 72px;
  height: 30px;
  border-radius: 15px;
  font-size: 13px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  background: linear-gradient(to right, #ff6034, #ee0a24);
  color: white;
  padding: 0 10px;
}

/* State: Following (Gray) */
.action-btn.following {
  background: #f0f0f0;
  color: #999;
  border: 1px solid #eee;
}

.loading-state, .no-more {
    text-align: center;
    padding: 20px;
    color: #999;
    font-size: 13px;
}
</style>
