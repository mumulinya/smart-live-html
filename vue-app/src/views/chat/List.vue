<template>
  <div class="chat-list-page">
    <div class="header">
      <!-- <div class="header-back-btn"><i class="el-icon-arrow-left"></i></div> -->
      <div class="header-title">消息</div>
      <div class="header-search" @click="search"><i class="el-icon-search"></i></div>
    </div>

    <!-- Connection Status -->
    <div class="connection-status" :class="wsStatus" v-if="showConnectionStatus">
      {{connectionStatusText}}
    </div>

    <div class="chat-list" v-loading="loading">
       <div v-if="userSessionList.length === 0 && !loading" class="empty-state">
          <i class="el-icon-chat-round"></i>
          <div>暂无消息</div>
       </div>

       <div class="chat-item" v-for="chat in userSessionList" :key="chat.id" @click="toChat(chat.sessionId)">
          <div class="avatar-container">
             <img :src="chat.avatar || '/imgs/icons/default-icon.png'" class="chat-avatar">
             <div class="unread-badge" v-if="chat.unread > 0">{{chat.unread}}</div>
          </div>
          <div class="chat-info">
             <div class="chat-name">{{chat.nickname || '未知用户'}}</div>
             <div class="chat-msg">{{chat.lastMessage}}</div>
          </div>
          <div class="chat-time">{{formatTime(chat.lastTime)}}</div>
       </div>
    </div>

    <div class="footer-container">
       <foot-bar :active-btn="3"></foot-bar>
    </div>
  </div>
</template>

<script>
import FootBar from '@/components/FootBar.vue';
import { wsManager } from '@/utils/websocket';
import { getCurrentUser } from '@/api/user';
import { getUserSessions } from '@/api/chat';

export default {
  name: 'ChatList',
  components: { FootBar },
  data() {
    return {
       user: {},
       userSessionList: [],
       loading: false,
       wsStatus: 'disconnected',
       showConnectionStatus: false,
       connectionStatusText: '连接中...'
    }
  },
  created() {
     this.queryLoginUser();
  },
  beforeUnmount() {
     wsManager.unregisterCallback('chat-list');
  },
  methods: {
     search() {
        this.$message.info("搜索功能开发中");
     },
     toChat(sessionId) {
        this.$router.push({ path: '/chat/detail', query: { sessionId } });
     },
     queryLoginUser() {
        getCurrentUser().then(res => {
           this.user = res.data || res;
           this.initWebSocket();
           this.loadUserSessions();
        }).catch(() => {
           this.$router.push('/user/login');
        });
     },
     initWebSocket() {
        const token = localStorage.getItem("token");
        if(token) {
           const ws = wsManager.init(token);
           ws.onConnectionChange(this.handleConnectionChange);
           
           wsManager.registerCallback('chat-list', (message) => {
              if(message.type === 'NEW_MESSAGE') {
                 this.handleNewMessage(message.data);
              }
           });
           
           if(ws.isConnected) this.wsStatus = 'connected';
        }
     },
     handleConnectionChange(status) {
        this.wsStatus = status;
        this.connectionStatusText = status === 'connected' ? '已连接' : '连接断开';
        this.showConnectionStatus = status !== 'connected';
        if(status === 'connected') {
           setTimeout(() => this.showConnectionStatus = false, 2000);
        }
     },
     handleNewMessage(data) {
        // Update list logic, similar to original `chat-list.html`
        const idx = this.userSessionList.findIndex(s => s.sessionId == data.sessionId);
        if(idx !== -1) {
           const session = this.userSessionList[idx];
           session.lastMessage = data.content;
           session.lastTime = new Date(); // or data.createTime
           if(data.fromUid !== this.user.id) {
              session.unread = (session.unread || 0) + 1;
           }
           // Move to top
           this.userSessionList.splice(idx, 1);
           this.userSessionList.unshift(session);
        } else {
           this.loadUserSessions(); // Reload if new session
        }
     },
     loadUserSessions() {
        this.loading = true;
        getUserSessions({ userId: this.user.id, current: 1 })
           .then(res => {
              const list = res.data || [];
              this.userSessionList = list.map(s => ({
                 ...s,
                 avatar: s.avatar ? this.$fileURL + s.avatar : ''
              }));
           })
           .finally(() => {
              this.loading = false;
           });
     },
     formatTime(time) {
        if(!time) return '';
        const d = new Date(time);
        return `${d.getMonth()+1}-${d.getDate()} ${d.getHours()}:${d.getMinutes()}`;
     }
  }
}
</script>

<style scoped>
.chat-list-page { height: 100vh; display: flex; flex-direction: column; background: white; }
.header { height: 50px; border-bottom: 1px solid #eee; display: flex; align-items: center; justify-content: center; position: relative; }
.header-title { font-weight: bold; font-size: 16px; }
.header-search { position: absolute; right: 15px; font-size: 20px; cursor: pointer; }
.connection-status { padding: 5px; text-align: center; color: white; font-size: 12px; }
.connection-status.connected { background: #67C23A; }
.connection-status.error { background: #F56C6C; }
.connection-status.disconnected { background: #E6A23C; }

.chat-list { flex: 1; overflow-y: auto; }
.chat-item { display: flex; padding: 12px 15px; border-bottom: 1px solid #f5f5f5; align-items: center; cursor: pointer; }
.chat-item:hover { background: #fafafa; }
.avatar-container { position: relative; margin-right: 12px; }
.chat-avatar { width: 50px; height: 50px; border-radius: 50%; object-fit: cover; }
.unread-badge { position: absolute; top: -2px; right: -2px; background: #F56C6C; color: white; font-size: 10px; padding: 1px 5px; border-radius: 10px; }
.chat-info { flex: 1; min-width: 0; }
.chat-name { font-weight: bold; margin-bottom: 4px; }
.chat-msg { color: #999; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.chat-time { font-size: 12px; color: #ccc; margin-left: 10px; }
.footer-container { height: 60px; }
.empty-state { text-align: center; padding: 50px; color: #999; }
.empty-state i { font-size: 40px; margin-bottom: 10px; display: block; }
</style>
