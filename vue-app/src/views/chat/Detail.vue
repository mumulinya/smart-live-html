<template>
  <div class="chat-detail-page">
    <div class="header">
      <div class="header-back-btn" @click="goBack"><i class="el-icon-arrow-left"></i></div>
      <div class="header-title">{{contactName}}</div>
      <div style="width: 20px;"></div>
    </div>

    <div class="connection-status" :class="wsStatus" v-if="showConnectionStatus">
      {{connectionStatusText}}
    </div>

    <!-- Message List -->
    <div class="chat-messages" ref="chatMessages" @scroll="handleScroll">
       <div v-if="messages.length === 0 && !loading" class="empty-messages">
          <i class="el-icon-chat-round"></i>
          <div>暂无消息，开始聊天吧～</div>
       </div>

       <template v-for="(group, index) in groupedMessages">
          <div v-if="group.showTime" :key="'time-'+index" class="time-separator">
             <span class="time-label">{{formatGroupTime(group.time)}}</span>
          </div>
          
          <div v-for="msg in group.messages" :key="msg.id || msg.tempId" 
               class="message-container"
               :class="{'message-container-left': !msg.isSelf, 'message-container-right': msg.isSelf}">
             
             <div class="avatar" :class="{'avatar-left': !msg.isSelf, 'avatar-right': msg.isSelf}">
                <img v-if="msg.isSelf && user.icon" :src="user.icon" class="avatar-image">
                <img v-else-if="!msg.isSelf && contactAvatar" :src="contactAvatar" class="avatar-image">
                <div v-else class="avatar-fallback">
                   {{ msg.isSelf ? (user.nickname || '我').charAt(0) : (contactName || '友').charAt(0) }}
                </div>
             </div>

             <div class="message-content">
                <div v-if="!msg.isSystem" class="message" :class="{'message-left': !msg.isSelf, 'message-right': msg.isSelf}">
                   {{msg.content}}
                   <!-- Status -->
                   <div v-if="msg.isSelf" class="message-status-container">
                      <div class="message-status" :class="msg.status" v-if="msg.status==='sending' || msg.status==='failed'">{{getStatusText(msg.status)}}</div>
                      <div v-else-if="msg.dbStatus===1" class="message-read-status">已读</div>
                      <div v-else-if="msg.dbStatus===2" class="message-delivered-status">已送达</div>
                   </div>
                </div>
                <div v-if="msg.isSystem" class="system-message">{{msg.content}}</div>
             </div>
          </div>
       </template>
    </div>

    <!-- Input Area -->
    <div class="chat-input" :class="{ 'show-panel': showMorePanel }">
       <div class="input-container">
          <!-- Voice Icon (Optional) -->
          <!-- <i class="el-icon-microphone input-icon"></i> -->
          
          <input type="text" v-model="messageInput" @keyup.enter="sendMessage" placeholder="输入消息..." @focus="showMorePanel = false">
          
          <button v-if="messageInput.trim()" @click="sendMessage" class="send-btn">发送</button>
          <i v-else class="el-icon-circle-plus-outline input-icon-btn" @click="toggleMorePanel"></i>
       </div>
       
       <!-- More Panel -->
       <div class="more-panel" v-if="showMorePanel">
          <div class="panel-item">
             <div class="panel-icon"><i class="el-icon-picture-outline"></i></div>
             <div class="panel-text">相册</div>
          </div>
          <div class="panel-item">
             <div class="panel-icon"><i class="el-icon-camera"></i></div>
             <div class="panel-text">拍摄</div>
          </div>
          <div class="panel-item">
             <div class="panel-icon"><i class="el-icon-location-outline"></i></div>
             <div class="panel-text">位置</div>
          </div>
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
import { getChatSession, getMessageList } from '@/api/chat';

export default {
  name: 'ChatDetail',
  components: { FootBar },
  data() {
    return {
       sessionId: 0,
       toUserId: 0,
       user: { id: 0, nickname: '我', icon: '' },
       contactName: '加载中...',
       contactAvatar: '',
       messages: [],
       messageInput: '',
       loading: false,
       wsStatus: 'disconnected',
       showConnectionStatus: false,
       connectionStatusText: '连接中...',
       isSending: false,
       current: 1,
       noMore: false,
       showMorePanel: false
    }
  },
  computed: {
     groupedMessages() {
        const groups = [];
        let currentGroup = null;
        const sorted = [...this.messages].sort((a,b) => new Date(a.createTime) - new Date(b.createTime));
        sorted.forEach(msg => {
           const time = this.getGroupTime(msg.createTime);
           if(!currentGroup || currentGroup.time !== time) {
              currentGroup = { time, messages: [], showTime: true };
              groups.push(currentGroup);
           }
           currentGroup.messages.push(msg);
        });
        return groups;
     },
     isSendDisabled() {
        return !this.messageInput.trim() || this.isSending || this.wsStatus !== 'connected';
     }
  },
  created() {
     this.sessionId = this.$route.query.sessionId;
     this.queryLoginUser();
  },
  beforeUnmount() {
     wsManager.unregisterCallback('private-chat-' + this.sessionId);
     // Send leave session message
     if(wsManager.getWebSocket() && wsManager.getWebSocket().isConnected) {
        wsManager.sendMessage('UPDATE_ACTIVE_SESSION', { sessionId: null });
     }
  },
  methods: {
     goBack() {
        this.$router.go(-1);
     },
     queryLoginUser() {
        getCurrentUser().then(res => {
           this.user = res.data || res;
           if(this.user.icon) this.user.icon = this.$fileURL + this.user.icon;
           this.initWebSocket();
           this.getChatSession();
        }).catch(() => {
           this.$router.push('/user/login');
        });
     },
     initWebSocket() {
        const token = localStorage.getItem("token");
        if(token) {
           const ws = wsManager.init(token);
           ws.onConnectionChange(this.handleConnectionChange);
           // Register callback specific for this session
           wsManager.registerCallback('private-chat-' + this.sessionId, this.handleWebSocketMessage);
           
           if(ws.isConnected) {
              this.wsStatus = 'connected';
              this.setCurrentActiveSession();
           }
        }
     },
     handleConnectionChange(status) {
        this.wsStatus = status;
        this.connectionStatusText = status === 'connected' ? '已连接' : '连接断开';
        this.showConnectionStatus = status !== 'connected';
        if(status === 'connected') {
           setTimeout(() => this.showConnectionStatus = false, 2000);
           this.setCurrentActiveSession();
        }
     },
     setCurrentActiveSession() {
        wsManager.sendMessage('UPDATE_ACTIVE_SESSION', { sessionId: this.sessionId });
     },
     handleWebSocketMessage(message) {
        if(message.type === 'NEW_MESSAGE') {
           if(message.data.sessionId == this.sessionId) {
              this.addMessageToUI(message.data);
           }
        } else if (message.type === 'MESSAGE_SENT') {
           this.handleMessageSent(message.data);
        } else if (message.type === 'MESSAGE_STATUS_UPDATE') {
           this.handleMessageStatusUpdate(message.data);
        }
     },
     handleMessageStatusUpdate(data) {
        if (data.type === 'BATCH_MESSAGES_READ') {
           const sessionId = data.sessionId;
           const newStatus = data.status;
           this.messages.forEach(msg => {
              if (msg.isSelf && msg.sessionId == sessionId && msg.dbStatus !== newStatus) {
                 msg.dbStatus = newStatus;
              }
           });
        } else if (data.type === 'MESSAGE_READ') {
           const messageId = data.messageId;
           const newStatus = data.status;
           const msg = this.messages.find(m => m.id == messageId);
           if (msg) {
              msg.dbStatus = newStatus;
           }
        }
     },
     handleScroll() {
        const el = this.$refs.chatMessages;
        if (el.scrollTop < 50 && !this.loading && !this.noMore) {
           this.loadMoreMessages();
        }
     },
     loadMoreMessages() {
        this.loading = true;
        const oldHeight = this.$refs.chatMessages.scrollHeight;
        this.current++;
        getMessageList({ sessionId: this.sessionId, current: this.current })
           .then(res => {
              const list = res.data || [];
              if (list.length > 0) {
                 const newMessages = list.map(this.processMessage);
                 // Sort and merge to ensure order
                 this.messages = [...newMessages, ...this.messages]; 
                 // Restore scroll position
                 this.$nextTick(() => {
                    const newHeight = this.$refs.chatMessages.scrollHeight;
                    this.$refs.chatMessages.scrollTop = newHeight - oldHeight;
                 });
              } else {
                 this.noMore = true;
              }
           })
           .finally(() => this.loading = false);
     },
     toggleMorePanel() {
        this.showMorePanel = !this.showMorePanel;
        if(this.showMorePanel) {
           this.$nextTick(() => this.scrollToBottom());
        }
     },
     getChatSession() {
        getChatSession({ sessionId: this.sessionId }).then(res => {
           const session = res.data || res;
           this.contactName = session.contactName;
           this.contactAvatar = session.contactAvatar ? this.$fileURL + session.contactAvatar : '';
           // Determine toUserId
           if (session.fromUid === this.user.id) {
               this.toUserId = session.toUid;
           } else {
               this.toUserId = session.fromUid;
           }
           this.loadMessages();
        });
     },
     loadMessages() {
        this.loading = true;
        this.current = 1;
        this.noMore = false;
        getMessageList({ sessionId: this.sessionId, current: 1 })
           .then(res => {
              const list = res.data || [];
              this.messages = list.map(this.processMessage);
              this.scrollToBottom();
              if(list.length === 0) this.noMore = true;
           })
           .finally(() => this.loading = false);
     },
     processMessage(msg) {
        const fromId = msg.fromUid || msg.fromUserId;
        return {
           ...msg,
           fromUid: fromId,
           isSelf: fromId === this.user.id,
           status: 'sent',
           dbStatus: msg.status
        };
     },
     addMessageToUI(data) {
        const msg = this.processMessage(data);
        if(!this.messages.find(m => m.id === msg.id)) {
           this.messages.push(msg);
           this.scrollToBottom();
        }
     },
     sendMessage() {
        if(this.isSendDisabled) return;
        const content = this.messageInput.trim();
        const tempId = 'temp_' + Date.now();
        const msg = {
           id: tempId,
           tempId: tempId,
           content,
           createTime: new Date().toISOString(),
           isSelf: true,
           status: 'sending',
           sessionId: this.sessionId
        };
        this.messages.push(msg);
        this.scrollToBottom();
        this.messageInput = '';
        this.isSending = true;

        const sent = wsManager.sendMessage('CHAT_MESSAGE', {
           sessionId: parseInt(this.sessionId) || this.sessionId, // Ensure number if possible
           content,
           toUserId: this.toUserId,
           tempId
        });

        if(!sent) {
           msg.status = 'failed';
           this.isSending = false;
        }
        // Wait for MESSAGE_SENT for success
        setTimeout(() => this.isSending = false, 500); // Reset sending lock quickly
     },
     handleMessageSent(data) {
        const idx = this.messages.findIndex(m => m.tempId === data.tempId);
        if(idx !== -1) {
           // Check if real message already exists (from NEW_MESSAGE race)
           const exists = this.messages.find(m => m.id === data.messageId);
           if (exists) {
               // Real message arrived first, remove temp message to avoid dupe
               this.messages.splice(idx, 1);
           } else {
               this.messages[idx].id = data.messageId;
               this.messages[idx].status = 'sent';
               this.messages[idx].tempId = undefined;
           }
        }
     },
     scrollToBottom() {
        this.$nextTick(() => {
           const el = this.$refs.chatMessages;
           if(el) el.scrollTop = el.scrollHeight;
        });
     },
     formatGroupTime(timeStr) {
        return timeStr; // Simplified
     },
     getGroupTime(timeStr) {
        const d = new Date(timeStr);
        return `${d.getMonth()+1}月${d.getDate()}日 ${d.getHours()}:${d.getMinutes()}`;
     },
     getStatusText(status) {
        return status === 'sending' ? '发送中' : (status === 'failed' ? '失败' : '');
     }
  }
}
</script>

<style scoped>
.chat-detail-page { height: 100vh; display: flex; flex-direction: column; background: #f5f5f5; }
.header { height: 50px; display: flex; align-items: center; justify-content: space-between; padding: 0 15px; border-bottom: 1px solid #e1e1e1; background: #f7f7f7; }
.header-title { font-weight: bold; }
.connection-status { text-align: center; color: white; padding: 5px; font-size: 12px; }
.connection-status.connected { background: #67C23A; }
.connection-status.disconnected { background: #E6A23C; }

.chat-messages { flex: 1; overflow-y: auto; padding: 15px; display: flex; flex-direction: column; }
.time-separator { text-align: center; margin: 15px 0; position: relative; }
.time-label { background: #d8d8d8; padding: 3px 10px; border-radius: 10px; font-size: 12px; color: #666; }

.message-container { display: flex; margin-bottom: 15px; width: 100%; }
.message-container-left { flex-direction: row; }
.message-container-right { flex-direction: row-reverse; }

.avatar { width: 40px; height: 40px; border-radius: 50%; margin: 0 10px; flex-shrink: 0; overflow: hidden; }
.avatar-image { width: 100%; height: 100%; object-fit: cover; }
.avatar-fallback { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; }
.avatar-left .avatar-fallback { background: #07c160; }
.avatar-right .avatar-fallback { background: #ff6633; }

.message-content { max-width: 70%; display: flex; flex-direction: column; }
.message { padding: 10px 15px; border-radius: 5px; font-size: 16px; word-wrap: break-word; position: relative; }
.message-left { background: white; border-top-left-radius: 0; }
.message-right { background: #95ec69; border-top-right-radius: 0; }

.message-status-container { font-size: 10px; text-align: right; margin-top: 2px; }
.message-read-status { color: #07c160; }
.message-delivered-status { color: #999; }

.chat-input { background: #f7f7f7; border-top: 1px solid #e1e1e1; display: flex; flex-direction: column; padding-bottom: 25px; }
.input-container { padding: 10px; display: flex; align-items: center; }
.chat-input input { flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 4px; outline: none; margin-right: 10px; height: 36px; box-sizing: border-box; }
.send-btn { padding: 0 15px; height: 36px; background: #07c160; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; white-space: nowrap; }
.input-icon-btn { font-size: 28px; color: #7f7f7f; cursor: pointer; margin-left: 5px; }

.more-panel { height: 200px; background: #f7f7f7; border-top: 1px solid #e1e1e1; display: flex; padding: 20px; box-sizing: border-box; flex-wrap: wrap; }
.panel-item { width: 25%; display: flex; flex-direction: column; align-items: center; margin-bottom: 20px; }
.panel-icon { width: 50px; height: 50px; background: white; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 24px; color: #666; margin-bottom: 5px; border: 1px solid #ddd; }
.panel-text { font-size: 12px; color: #888; }

.footer-container { height: 60px; flex-shrink: 0; }

.empty-messages { text-align: center; padding: 50px; color: #999; }
</style>
