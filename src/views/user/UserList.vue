<template>
  <div class="user-list-page" v-loading="pageLoading">
    <!-- Header -->
    <div class="header">
      <div class="header-back-btn" @click="goBack"><i class="el-icon-arrow-left"></i></div>
      <div class="header-title">{{ user.nickName || '用户' }}</div>
    </div>

    <!-- Tabs -->
    <div class="tabs-container">
        <el-tabs v-model="activeTab" @tab-click="handleTabClick" stretch>
            <el-tab-pane :label="'关注 ' + (stats.followCount || 0)" name="follow"></el-tab-pane>
            <el-tab-pane :label="'粉丝 ' + (stats.fansCount || 0)" name="fans"></el-tab-pane>
            <el-tab-pane v-if="!isMe" :label="'共同关注 ' + (stats.commonFollowCount || 0)" name="common"></el-tab-pane>
        </el-tabs>
    </div>

    <!-- List Content -->
    <div class="users-container">
      <div class="user-list" v-infinite-scroll="loadMore" :infinite-scroll-disabled="loading || noMore" :infinite-scroll-distance="10">
        <div v-if="userList.length > 0">
          <div v-for="u in userList" :key="u.id" class="user-item" @click="toUserDetail(u)">
            <div class="user-avatar">
              <img :src="u.icon || '/imgs/icons/default-icon.png'" alt="">
            </div>
            <div class="user-info">
              <div class="user-name">{{ u.nickName || u.name || '匿名用户' }}</div>
              <div class="user-desc">{{ u.introduce || '这个人很懒，什么都没写' }}</div>
            </div>
            
            <!-- Follow Button Logic -->
            <!-- If we are in 'follow' tab, these are people I follow. Button usually says "Following" or allows unfollow. -->
            <!-- If we are in 'fans' tab, these are people following me. I can follow them back. -->
            
            <button v-if="u.isFollow" class="follow-btn following" @click.stop="toggleFollow(u)">
               已关注
            </button>
            <button v-else class="follow-btn" @click.stop="toggleFollow(u)">
               关注
            </button>
          </div>

          <div class="loading-state" v-if="loading"><i class="el-icon-loading"></i> 加载中...</div>
          <div class="no-more" v-if="noMore">没有更多了</div>
        </div>
        
        <!-- Empty State -->
        <div v-else-if="!loading" class="empty-state">
           <i :class="activeTab === 'follow' ? 'el-icon-star-off' : 'el-icon-user'"></i>
           <p>{{ activeTab === 'follow' ? '还没有关注任何人' : '还没有粉丝' }}</p>
        </div>
      </div>
    </div>
    
    <div class="footer-container">
      <foot-bar :active-btn="4"></foot-bar>
    </div>
  </div>
</template>

<script>
import FootBar from '@/components/FootBar.vue';
import { getCurrentUser, getUserStats, getUserInfo } from '@/api/user';
import { getFollows, getFans, getCommonFollows, followUserBoolean } from '@/api/interaction';

export default {
  name: 'UserList',
  components: { FootBar },
  props: {
    type: {
      type: String,
      default: 'follow'
    }
  },
  data() {
    return {
      user: {},
      stats: { followCount: 0, fansCount: 0 },
      isMe: true, // Mark if viewing own list
      targetUserId: null,
      
      activeTab: 'follow',
      
      userList: [],
      current: 1,
      loading: false,
      noMore: false,
      pageLoading: false,
      refreshId: 0, // Add refreshId
    }
  },
  // ... (watch remains same)
  created() {
    this.targetUserId = this.$route.query.id;
    this.queryUser();
  },
  methods: {
    goBack() {
      this.$router.back();
    },
    handleTabClick(tab) {
        this.activeTab = tab.props.name;
        this.resetList();
    },
    async queryUser() {
      this.pageLoading = true;
      try {
          // 1. Get Current User (Me) to check ID
          const me = await getCurrentUser();
          const myId = me.data ? me.data.id : null;
          
          // 2. Determine target user
          let targetId = this.targetUserId;
          if (!targetId || targetId == myId) {
              this.isMe = true;
              this.user = me.data || {};
              // Get stats for me
              const statsRes = await getUserStats(myId);
              this.stats = statsRes.data || {};
          } else {
              this.isMe = false;
              // Get Other User Info & Stats
              const otherRes = await getUserInfo(targetId);
              this.user = otherRes.data || {};
              
              const statsRes = await getUserStats(targetId);
              this.stats = statsRes.data || {};
          }
          
          this.resetList();
      } catch(e) {
          console.error(e);
      } finally {
          this.pageLoading = false;
      }
    },

    resetList() {
        this.refreshId++; // Increment ID to invalidate old requests
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
        // Capture current refreshId and activeTab
        const currentRefreshId = this.refreshId;
        const targetTab = this.activeTab;
        
        let api = null;
        let params = {
            current: this.current,
            size: 10,
            sourceType: 1
        };
        
        if (this.activeTab === 'follow') {
            api = getFollows;
            params.userId = this.isMe ? this.user.id : this.targetUserId;
        } else if (this.activeTab === 'fans') {
             api = getFans;
             params.sourceId = this.isMe ? this.user.id : this.targetUserId;
        } else if (this.activeTab === 'common') {
             api = getCommonFollows;
             params.userId = this.targetUserId;
        }
        
        // Ensure we have necessary Ids
        if(!api || (!this.user.id && !this.targetUserId)) { 
            this.loading = false; 
            return; 
        }

        api(params).then(res => {
            // Check for stale request: matches tab AND refreshId
            if (targetTab !== this.activeTab || currentRefreshId !== this.refreshId) return; 
            
            // Robust parsing: Handle if records exists, or if data is the array, or if res is the array
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
                // Determine isFollow status
                // For 'follow' tab (My Follows), everyone is followed.
                if(this.activeTab === 'follow' && this.isMe) {
                    u.isFollow = true;
                }
                // For common follows, by definition I follow them.
                if(this.activeTab === 'common') {
                    u.isFollow = true;
                }
                // Fix avatar path if needed
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
        })
    },
    
    toggleFollow(u) {
      const newStatus = !u.isFollow;
      // If we unfollow in "Follows" tab, should we remove item? 
      // User experience: Usually better to just change state to "Follow" button, 
      // and remove on refresh, or remove immediately.
      // Requirements said "Follows list" - if I unfollow, they are no longer in follows list.
      // But immediately disappearing can be jarring.
      // Let's toggle state first.
      
      followUserBoolean(u.id, newStatus).then(() => {
        u.isFollow = newStatus;
        if(newStatus) {
            this.$message.success('关注成功');
            // If in fans tab and I follow back, stats.followCount++
            this.stats.followCount++;
        } else {
            this.$message.success('已取消关注');
            this.stats.followCount--;
            // If in Follow tab, maybe remove?
            // current logic: keeps it but button changes.
        }
      });
    },
    
    toUserDetail(u) {
      if(u.id === this.user.id) {
        this.$router.push('/info');
      } else {
        this.$router.push(`/user-info/${u.id}`);
      }
    }
  }
}
</script>

<style scoped>
.user-list-page { min-height: 100vh; background: #fff; padding-bottom: 60px; display: flex; flex-direction: column; }

/* Header */
.header { 
    height: 50px; 
    display: flex; 
    align-items: center; 
    padding: 0 15px; 
    background: white;
    /* border-bottom: 1px solid #eee; removed to blend with tabs */
    position: sticky;
    top: 0;
    z-index: 100;
}
.header-back-btn { font-size: 20px; width: 40px; cursor: pointer; }
.header-title { flex: 1; text-align: center; font-weight: 500; font-size: 16px; margin-right: 40px; }

/* Tabs */
.tabs-container {
    background: white;
    padding-top: 0;
    border-bottom: 1px solid #f0f0f0;
}
:deep(.el-tabs__nav-wrap::after) { height: 1px; background-color: transparent; }
:deep(.el-tabs__item) { font-size: 15px; font-weight: 500; color: #666; }
:deep(.el-tabs__item.is-active) { color: #333; font-weight: 600; }
:deep(.el-tabs__active-bar) { background-color: #333; height: 3px; border-radius: 1.5px; }

/* List Content */
.users-container { flex: 1; overflow-y: auto; }
.user-list { padding: 0 12px; }

.user-item { 
    display: flex; 
    align-items: center; 
    padding: 16px 0; 
    border-bottom: 1px solid #f9f9f9; 
}
.user-avatar { width: 48px; height: 48px; margin-right: 12px; flex-shrink: 0; }
.user-avatar img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }

.user-info { flex: 1; min-width: 0; margin-right: 12px; }
.user-name { font-size: 15px; font-weight: 500; color: #333; margin-bottom: 4px; }
.user-desc { font-size: 12px; color: #999; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.follow-btn { 
    min-width: 72px; 
    height: 30px; 
    border-radius: 15px; 
    border: none;
    font-size: 13px; 
    cursor: pointer; 
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 500;
}

/* Not following: Red button */
.follow-btn {
    background: #ff2442;
    color: white;
}

/* Following: Gray/White button */
.follow-btn.following { 
    background: #f5f5f5; 
    color: #999; 
    border: 1px solid #ddd;
}

.empty-state { text-align: center; padding: 60px 0; color: #ccc; }
.empty-state i { font-size: 48px; margin-bottom: 16px; display: block; }

.loading-state, .no-more { text-align: center; padding: 15px; color: #ccc; font-size: 12px; }
.footer-container { height: 60px; }
</style>
