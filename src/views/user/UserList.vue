<template>
  <div class="user-list-page" v-loading="pageLoading">
    <div class="header">
      <div class="header-back-btn" @click="goBack"><i class="el-icon-arrow-left"></i></div>
      <div class="header-title">{{ title }}</div>
    </div>



    <!-- Users List using Window Scroll -->
    <div class="users-container">
      <div class="user-list" v-infinite-scroll="loadMore" :infinite-scroll-disabled="loading || noMore">
        <div v-if="userList.length > 0">
          <div v-for="u in userList" :key="u.id" class="user-item" @click="toUserDetail(u)">
            <div class="user-avatar">
              <img :src="u.icon || '/imgs/icons/default-icon.png'" alt="">
            </div>
            <div class="user-info">
              <div class="user-name">{{ u.nickName || u.name || '匿名用户' }}</div>
              <div class="user-desc">{{ u.introduce || '这个人很懒，什么都没写' }}</div>
            </div>
            
            <button v-if="type === 'follow'" class="follow-btn following" @click.stop="unfollow(u)">
               已关注
            </button>
            <button v-else class="follow-btn" :class="{'following': u.isFollow}" @click.stop="toggleFollow(u)">
               {{ u.isFollow ? '已关注' : '关注' }}
            </button>
          </div>

          <div class="loading-state" v-if="loading"><i class="el-icon-loading"></i> 加载中...</div>
          <div class="no-more" v-if="noMore">没有更多了</div>
        </div>
        <div v-else class="empty-state">
           <i :class="emptyIcon"></i>
           <p>{{ emptyText }}</p>
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
import { getCurrentUser, getUserStats } from '@/api/user';
import { getFollows, getFans, followUserBoolean } from '@/api/interaction';

export default {
  name: 'UserList',
  components: { FootBar },
  props: {
    type: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      user: {},
      userList: [],
      current: 1,
      loading: false,
      noMore: false,
      pageLoading: false,
      stats: {}
    }
  },
  computed: {
    title() {
      const count = this.type === 'follow' ? (this.stats.followCount || 0) : (this.stats.fansCount || 0);
      const prefix = this.type === 'follow' ? '关注列表' : '粉丝列表';
      return count > 0 ? `${prefix}(${count})` : prefix;
    },
    emptyText() {
      return this.type === 'follow' ? '还没有关注任何人' : '还没有粉丝';
    },
    emptyIcon() {
      return this.type === 'follow' ? 'el-icon-star-off' : 'el-icon-user';
    }
  },
  created() {
    this.queryUser();
  },
  methods: {
    goBack() {
      this.$router.go(-1);
    },
    queryUser() {
      this.pageLoading = true;
      getCurrentUser().then(res => {
        this.user = res.data || res;
        this.queryStats();
        this.queryList();
      }).finally(() => this.pageLoading = false);
    },
    queryStats() {
      getUserStats(this.user.id).then(res => {
        this.stats = res.data || res || {};
      });
    },
    queryList() {
      this.loading = true;
      const apiFunc = this.type === 'follow' ? getFollows : getFans;
      
      const params = { current: this.current };
      if(this.type === 'follow') {
        params.sourceType = 1;
        params.userId = this.user.id;
      } else {
        params.sourceType = 1;
        params.sourceId = this.user.id;
      }

      apiFunc(params).then(res => {
        let list = [];
        if (Array.isArray(res)) {
            list = res;
        } else if (res && Array.isArray(res.data)) {
            list = res.data;
        }
        
        this.userList = [...this.userList, ...list.map(u => ({
          ...u,
          icon: u.icon ? this.$fileURL + u.icon : ''
        }))];
        if(list.length < 10) this.noMore = true;
        this.current++;
      }).finally(() => this.loading = false);
    },
    loadMore() {
      if(!this.loading && !this.noMore) {
        this.queryList();
      }
    },
    unfollow(u) {
      this.$confirm('确定要取消关注吗？', '提示', { type: 'warning' }).then(() => {
        followUserBoolean(u.id, false).then(() => {
          this.$message.success('已取消关注');
          if(this.type === 'follow') {
            this.userList = this.userList.filter(item => item.id !== u.id);
            this.stats.followCount--;
          } else {
            u.isFollow = false;
          }
        });
      }).catch(() => {});
    },
    toggleFollow(u) {
      const newStatus = !u.isFollow;
      followUserBoolean(u.id, newStatus).then(() => {
        u.isFollow = newStatus;
        this.$message.success(newStatus ? '关注成功' : '已取消关注');
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
.user-list-page { min-height: 100vh; background: #f5f5f5; padding-bottom: 60px; box-sizing: border-box; }
.user-list-page * { box-sizing: border-box; }
.header { height: 50px; background: white; display: flex; align-items: center; padding: 0 15px; border-bottom: 1px solid #eee; position: sticky; top: 0; z-index: 10; }
.header-title { flex: 1; text-align: center; font-weight: bold; }
.users-container { }
.user-list { background: white; margin-top: 10px; }
.user-item { display: flex; align-items: center; padding: 15px; border-bottom: 1px solid #f0f0f0; }
.user-avatar { width: 50px; height: 50px; margin-right: 15px; flex-shrink: 0; }
.user-avatar img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
.user-info { flex: 1; min-width: 0; }
.user-name { font-size: 16px; font-weight: 500; margin-bottom: 5px; }
.user-desc { font-size: 13px; color: #999; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.follow-btn { padding: 6px 15px; border-radius: 20px; border: 1px solid #409EFF; color: #409EFF; background: white; font-size: 12px; cursor: pointer; }
.follow-btn.following { background: #f0f0f0; border-color: #f0f0f0; color: #999; }
.empty-state { text-align: center; padding: 50px 0; color: #999; }
.empty-state i { font-size: 50px; margin-bottom: 10px; }
.loading-state, .no-more { text-align: center; padding: 10px; color: #999; font-size: 12px; }
.footer-container { height: 60px; }
</style>
