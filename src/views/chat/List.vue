<template>
  <PageLayout :loading="loading" skeleton-type="list" class="chat-list-page">
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

       <div 
          class="chat-item-wrapper" 
          v-for="chat in sortedSessionList" 
          :key="chat.id"
          @touchstart.stop="handleStart($event, chat)"
          @touchmove.stop.prevent="handleMove($event, chat)"
          @touchend.stop="handleEnd($event, chat)"
          @mousedown.stop="handleStart($event, chat)"
          @mousemove.stop.prevent="handleMove($event, chat)"
          @mouseup.stop="handleEnd($event, chat)"
          @mouseleave.stop="handleEnd($event, chat)"
       >
          <div 
             class="chat-item" 
             :class="{ 'pinned': chat.isPinned }"
             :style="{ transform: `translateX(${chat.translateX || 0}px)` }"
             @click="toChat(chat.sessionId, $event)"
          >
             <div class="avatar-container">
                <img :src="chat.avatar || '/imgs/icons/default-icon.png'" class="chat-avatar">
                <div class="unread-badge" v-if="chat.unread > 0">{{chat.unread}}</div>
             </div>
             <div class="chat-info">
                <div class="chat-name">
                   {{chat.nickname || '未知用户'}}
                </div>
                <div class="chat-msg">{{chat.lastMessage}}</div>
             </div>
             <div class="chat-time">{{formatTime(chat.lastTime)}}</div>
          </div>
          <div class="action-buttons">
             <div class="action-btn pin-btn" @click.stop="togglePin(chat)">
                <i :class="chat.isPinned ? 'el-icon-bottom' : 'el-icon-top'"></i>
                <span>{{chat.isPinned ? '取消置顶' : '置顶'}}</span>
             </div>
             <div class="action-btn delete-btn" @click.stop="openDeleteConfirm(chat)">
                <i class="el-icon-delete"></i>
                <span>删除</span>
             </div>
          </div>
       </div>
    </div>

    <!-- 自定义删除确认弹窗，微信风格 -->
    <el-dialog
      v-model="deleteDialogVisible"
      width="240px"
      :show-close="false"
      align-center
      custom-class="wechat-confirm-dialog"
    >
      <div class="wechat-confirm-content">删除该聊天?</div>
      <template #footer>
        <div class="wechat-confirm-footer">
          <button class="wechat-btn cancel" @click="cancelDelete">取消</button>
          <button class="wechat-btn confirm" @click="confirmDelete">删除</button>
        </div>
      </template>
    </el-dialog>

    <div class="footer-container">
       <foot-bar :active-btn="3"></foot-bar>
    </div>
  </PageLayout>
</template>

<script>
import FootBar from '@/components/FootBar.vue';
import PageLayout from '@/components/PageLayout/PageLayout.vue';
import { wsManager } from '@/utils/websocket';
import { getCurrentUser } from '@/api/user';
import { getUserSessions, deleteUserSession, togglePinUserSession } from '@/api/chat';

export default {
  name: 'ChatList',
  components: { FootBar, PageLayout },
  data() {
    return {
       user: {},
       userSessionList: [],
       loading: false,
       wsStatus: 'disconnected',
       showConnectionStatus: false,
       connectionStatusText: '连接中...',
       touchStartX: 0,
       touchStartY: 0,
       currentSwipeId: null,
       actionButtonWidth: 160,
       isDragging: false,
       currentChat: null,
       deleteDialogVisible: false,
       deleteTargetChat: null
    }
  },
  computed: {
     sortedSessionList() {
        return [...this.userSessionList].sort((a, b) => {
           if (a.isPinned && !b.isPinned) return -1;
           if (!a.isPinned && b.isPinned) return 1;
           const timeA = new Date(a.lastTime || 0).getTime();
           const timeB = new Date(b.lastTime || 0).getTime();
           return timeB - timeA;
        });
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
     toChat(sessionId, e) {
        if (this.isDragging) {
           return;
        }
        const chat = this.userSessionList.find(c => c.sessionId === sessionId);
        if (chat && chat.translateX && chat.translateX < 0) {
           chat.translateX = 0;
           this.currentSwipeId = null;
           return;
        }
        this.userSessionList.forEach(chat => {
           if (chat.translateX && chat.translateX < 0) {
              chat.translateX = 0;
           }
        });
        this.currentSwipeId = null;
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
        const idx = this.userSessionList.findIndex(s => s.sessionId == data.sessionId);
        if(idx !== -1) {
           const session = this.userSessionList[idx];
           session.lastMessage = data.content;
           session.lastTime = new Date();
           if(data.fromUid !== this.user.id) {
              session.unread = (session.unread || 0) + 1;
           }
        } else {
           this.loadUserSessions();
        }
     },
     loadUserSessions() {
        this.loading = true;
        getUserSessions({ userId: this.user.id, current: 1 })
           .then(res => {
              const list = res.data || [];
              this.userSessionList = list.map(s => ({
                 ...s,
                 avatar: s.avatar ? this.$fileURL + s.avatar : '',
                 lastMessage: this.formatLastMessage(s.lastMessage),
                 translateX: 0,
                 isPinned: s.pin || s.isPinned || false
              }));
           })
           .finally(() => {
              this.loading = false;
           });
     },
     formatLastMessage(msg) {
        if (!msg) return '';
        // 简单判断：如果是图片路径（包含特定路径特征或后缀），显示为[图片]
        // 也可以让后端返回 messageType，这里先做前端兼容
        if (msg.match(/\.(jpg|png|jpeg|gif|webp)$/i) || msg.includes('/smart-live/') || msg.includes('/2026/') || msg.includes('blob:')) {
            return '[图片]';
        }
        return msg;
     },
     formatTime(time) {
        if(!time) return '';
        const d = new Date(time);
        return `${d.getMonth()+1}-${d.getDate()} ${d.getHours()}:${d.getMinutes()}`;
     },
     handleStart(e, chat) {
        if (e.target.closest('.action-btn')) {
           return;
        }
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        this.touchStartX = clientX;
        this.touchStartY = clientY;
        this.isDragging = false;
        this.currentChat = chat;
     },
     handleMove(e, chat) {
        if (!this.touchStartX || !this.currentChat || this.currentChat.id !== chat.id) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const diffX = this.touchStartX - clientX;
        const diffY = Math.abs(this.touchStartY - clientY);
        if (diffY > Math.abs(diffX) && Math.abs(diffX) < 10) {
           return;
        }
        if (Math.abs(diffX) > 5) {
           this.isDragging = true;
        }
        if (!this.isDragging) return;
        e.preventDefault();
        if (diffX > 0) {
           const translateX = Math.min(diffX, this.actionButtonWidth);
           if (this.currentSwipeId && this.currentSwipeId !== chat.id) {
              const otherChat = this.userSessionList.find(c => c.id === this.currentSwipeId);
              if (otherChat) {
                 otherChat.translateX = 0;
              }
           }
           chat.translateX = -translateX;
           this.currentSwipeId = chat.id;
        } else if (diffX < 0 && chat.translateX < 0) {
           const moveRight = clientX - this.touchStartX;
           const newTranslateX = Math.min(Math.max(chat.translateX + moveRight, -this.actionButtonWidth), 0);
           chat.translateX = newTranslateX;
        }
     },
     handleEnd(e, chat) {
        const isTouch = e.touches || e.changedTouches;
        if (!this.touchStartX || !this.currentChat || this.currentChat.id !== chat.id) {
           this.resetDragState();
           return;
        }
        const clientX = isTouch
          ? (e.changedTouches ? e.changedTouches[0].clientX : e.touches[0].clientX)
          : e.clientX;
        const diffX = this.touchStartX - clientX;
        if (!this.isDragging) {
           this.resetDragState();
           return;
        }
        if (Math.abs(diffX) > this.actionButtonWidth / 2 && diffX > 0) {
           chat.translateX = -this.actionButtonWidth;
        } else {
           chat.translateX = 0;
           if (this.currentSwipeId === chat.id) {
              this.currentSwipeId = null;
           }
        }
        this.resetDragState();
     },
     resetDragState() {
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.isDragging = false;
        this.currentChat = null;
     },
     openDeleteConfirm(chat) {
        this.deleteTargetChat = chat;
        this.deleteDialogVisible = true;
     },
     cancelDelete() {
        this.deleteDialogVisible = false;
        this.deleteTargetChat = null;
     },
     async confirmDelete() {
        const chat = this.deleteTargetChat;
        if (!chat) {
           this.deleteDialogVisible = false;
           return;
        }
        try {
           await deleteUserSession(chat.id);
           this.$message.success('删除成功');
           const index = this.userSessionList.findIndex(s => s.id === chat.id);
           if (index !== -1) {
              this.userSessionList.splice(index, 1);
           }
           chat.translateX = 0;
           if (this.currentSwipeId === chat.id) {
              this.currentSwipeId = null;
           }
        } catch (error) {
           this.$message.error('删除失败：' + (error.message || error));
        } finally {
           this.deleteDialogVisible = false;
           this.deleteTargetChat = null;
        }
     },
     async togglePin(chat) {
        try {
           const newPinStatus = !chat.isPinned;
           await togglePinUserSession({ id: chat.id, pin: newPinStatus });
           chat.isPinned = newPinStatus;
           this.$message.success(newPinStatus ? '已置顶' : '已取消置顶');
           chat.translateX = 0;
           this.currentSwipeId = null;
        } catch (error) {
           this.$message.error('操作失败：' + (error.message || error));
        }
     }
  }
}
</script>

<style scoped>
.chat-list-page { height: 100vh; display: flex; flex-direction: column; background: #fff; overflow-x: hidden; }
.header { height: 50px; border-bottom: 1px solid #f0f0f0; display: flex; align-items: center; justify-content: center; position: relative; background: #fff; }
.header-title { font-weight: 600; font-size: 17px; color: #000; }
.header-search { position: absolute; right: 15px; font-size: 20px; cursor: pointer; color: #333; }
.connection-status { padding: 5px; text-align: center; color: white; font-size: 12px; }
.connection-status.connected { background: #67C23A; }
.connection-status.error { background: #F56C6C; }
.connection-status.disconnected { background: #E6A23C; }

.chat-list { flex: 1; overflow-y: auto; background: #fff; }
.chat-item-wrapper { position: relative; overflow: hidden; user-select: none; }
.chat-item { 
   display: flex; 
   padding: 12px 15px; 
   min-height: 72px;
   box-sizing: border-box;
   align-items: center; 
   cursor: pointer;
   background: white;
   transition: transform 0.3s ease;
   position: relative;
   z-index: 1;
}
/* Indented divider using pseudo-element */
.chat-item::after {
   content: '';
   position: absolute;
   bottom: 0;
   left: 75px; /* Start after avatar */
   right: 0;
   height: 1px;
   background: #f0f0f0;
}
.chat-item.pinned {
   background: #f7f7f7;
}
.chat-item:active { background: #f5f5f5; }
.chat-item.pinned:active { background: #efefef; }

.avatar-container { position: relative; margin-right: 12px; flex-shrink: 0; }
.chat-avatar { width: 48px; height: 48px; border-radius: 8px; object-fit: cover; }
.unread-badge { 
   position: absolute; 
   top: -4px; 
   right: -4px; 
   background: #F56C6C; 
   color: white; 
   font-size: 11px; 
   padding: 0 5px; 
   border-radius: 10px; 
   min-width: 18px; 
   height: 18px;
   line-height: 18px;
   text-align: center; 
   font-weight: 500;
}

.chat-info { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; }
.chat-name { 
   font-size: 16px;
   font-weight: 500; 
   color: #333;
   margin-bottom: 4px; 
   overflow: hidden;
   text-overflow: ellipsis;
   white-space: nowrap;
}
.chat-msg { 
   color: #999; 
   font-size: 13px; 
   overflow: hidden; 
   text-overflow: ellipsis; 
   white-space: nowrap; 
   line-height: 1.4;
}

.chat-time { 
   font-size: 12px; 
   color: #bbb; 
   margin-left: 10px; 
   flex-shrink: 0; 
   align-self: flex-start;
   margin-top: 2px;
}

.footer-container { height: 60px; }
.empty-state { text-align: center; padding: 80px 20px; color: #999; }
.empty-state i { font-size: 48px; margin-bottom: 15px; display: block; color: #ccc; }

.action-buttons {
   position: absolute;
   right: 0;
   top: 0;
   bottom: 0;
   display: flex;
   z-index: 0;
   transition: transform 0.3s ease;
}

.action-btn {
   width: 80px;
   display: flex;
   flex-direction: column;
   align-items: center;
   justify-content: center;
   color: white;
   font-size: 12px;
   cursor: pointer;
   user-select: none;
}

.action-btn i {
   font-size: 20px;
   margin-bottom: 4px;
}

.pin-btn {
   background: #409EFF;
}

.pin-btn:active {
   background: #337ecc;
}

.delete-btn {
   background: #F56C6C;
}

.delete-btn:active {
   background: #d44a4a;
}

/* 微信风格确认弹窗 */
:deep(.el-overlay) {
   display: flex;
   align-items: center;
   justify-content: center;
}

:deep(.wechat-confirm-dialog) {
   width: 240px;
   max-width: 70vw;
   border-radius: 12px;
   overflow: hidden;
   margin: 0 !important;
   position: relative !important;
   top: auto !important;
}

:deep(.wechat-confirm-dialog .el-dialog__header) {
   display: none;
}

:deep(.wechat-confirm-dialog .el-dialog__body) {
   padding: 24px 16px 18px;
}

:deep(.wechat-confirm-dialog .el-dialog__footer) {
   padding: 0;
   border-top: 1px solid #e5e5e5;
}

.wechat-confirm-content {
   font-size: 15px;
   color: #000;
   text-align: center;
   line-height: 1.4;
}

.wechat-confirm-footer {
   display: flex;
}

.wechat-btn {
   flex: 1;
   height: 44px;
   border: none;
   background: #fff;
   font-size: 15px;
   cursor: pointer;
   transition: background 0.2s;
}

.wechat-btn:active {
   background: #f5f5f5;
}

.wechat-btn.cancel {
   color: #000;
   border-right: 1px solid #e5e5e5;
}

.wechat-btn.confirm {
   color: #576b95;
}
</style>
