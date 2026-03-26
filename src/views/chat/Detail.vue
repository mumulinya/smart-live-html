<template>
  <div class="chat-detail-page">
    <div class="header">
      <div class="header-back-btn" @click="goBack"><van-icon name="arrow-left" size="24" /></div>
      <div class="header-title">{{contactName}}</div>
      <div class="header-more-btn" @click="goToChatInfo"><van-icon name="ellipsis" size="24" /></div>
    </div>

    <div class="connection-status" :class="wsStatus" v-if="showConnectionStatus">
      {{connectionStatusText}}
    </div>

    <!-- Message List -->
    <div class="chat-messages" ref="chatMessages" @scroll.passive="handleScroll"
         :style="backgroundImage ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}">
       <div ref="topSentinel" class="top-sentinel"></div>

       <div v-if="loadingOld" class="loading-tip">
         <span>加载更早历史消息...</span>
       </div>

       <div v-if="messages.length === 0 && !loading" class="empty-messages">
          <i class="el-icon-chat-round"></i>
          <div>暂无消息，开始聊天吧</div>
       </div>

       <template v-for="(group, index) in groupedMessages">
          <div v-if="group.showTime" :key="'time-'+index" class="time-separator">
             <span class="time-label">{{formatGroupTime(group.time)}}</span>
          </div>
          
          <div v-for="msg in group.messages" :key="msg.id || msg.tempId" 
               class="message-container"
               :class="{'message-container-left': !msg.isSelf, 'message-container-right': msg.isSelf}">
             
             <div class="avatar" :class="{'avatar-left': !msg.isSelf, 'avatar-right': msg.isSelf}" @click="onAvatarClick(msg)">
                <img v-if="msg.isSelf && user.icon" :src="user.icon" class="avatar-image">
                <img v-else-if="!msg.isSelf && contactAvatar" :src="contactAvatar" class="avatar-image">
                <div v-else class="avatar-fallback">
                   {{ msg.isSelf ? (user.nickname || '我').charAt(0) : (contactName || 'Ta').charAt(0) }}
                </div>
             </div>

             <div class="message-content">
                <div v-if="!msg.isSystem" class="message" :class="{'message-left': !msg.isSelf, 'message-right': msg.isSelf, 'message-image': msg.messageType === 1}">
                   <span v-if="!msg.messageType || msg.messageType === 0">{{msg.content}}</span>
                   <img v-else-if="msg.messageType === 1" :src="msg.content" class="msg-img" @click="previewImage(msg.content)">
                   <span v-else>[未知消息类型]</span>
                </div>
                <!-- Status outside bubble -->
                <div v-if="msg.isSelf && !msg.isSystem" class="message-status-outer">
                   <span v-if="msg.status=='sending'" class="status-sending">发送中</span>
                   <span v-else-if="msg.status=='failed'" class="status-failed">发送失败</span>
                   <span v-else-if="Number(msg.status)===1" class="status-read">已读</span>
                   <span v-else class="status-unread">未读</span>
                </div>
                <div v-if="msg.isSystem" class="system-message">{{msg.content}}</div>
             </div>
          </div>
       </template>
    </div>

    <!-- Input Area -->
    <div class="chat-input" :class="{ 'show-panel': showMorePanel || showEmojiPanel }">
       <div class="input-container">
          <!-- Voice Icon -->
          <div class="input-icon" @click="toggleVoice">
             <i class="el-icon-microphone"></i>
          </div>
          
          <!-- Text Input -->
          <input type="text" v-model="messageInput" @keyup.enter="sendMessage" placeholder="输入消息..." @focus="hideAllPanels">
          
          <!-- Emoji Icon -->
          <div class="input-icon emoji-icon" @click="toggleEmojiPanel">
             <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
               <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-3.5-9c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm7 0c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
             </svg>
          </div>
          
          <!-- Plus/Send Icon -->
          <div v-if="messageInput.trim()" class="send-btn" @click="sendMessage">发送</div>
          <div v-else class="input-icon" @click="toggleMorePanel">
             <i class="el-icon-circle-plus-outline" :class="{ 'active': showMorePanel }"></i>
          </div>
       </div>
       
       <!-- Emoji Panel -->
       <div class="emoji-panel" v-if="showEmojiPanel">
          <div class="emoji-grid">
             <div class="emoji-item" v-for="(emoji, idx) in emojiList" :key="idx" @click="insertEmoji(emoji)">
                {{emoji}}
             </div>
          </div>
       </div>
       
       <!-- More Panel (Image Upload) -->
       <div class="more-panel" v-if="showMorePanel">
          <div class="panel-item" @click="selectImage">
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
          <div class="panel-item">
             <div class="panel-icon"><i class="el-icon-folder-opened"></i></div>
             <div class="panel-text">文件</div>
          </div>
       </div>
    </div>
    
    <!-- Hidden file input for image upload -->
    <input type="file" ref="imageInput" accept="image/*" @change="onImageSelected" style="display:none">
    
    <!-- Back to Latest Button -->
    <div v-if="isHistoryMode" class="back-to-latest" @click="resetToLatest">
      <i class="el-icon-arrow-down"></i>
      <span>回到最新位置</span>
    </div>
    

  </div>
</template>

<script>
import FootBar from '@/components/FootBar.vue';
import { wsManager } from '@/utils/websocket';
import { getCurrentUser } from '@/api/user';
import { getChatSession, getMessageList, getUserSessions } from '@/api/chat';
import { uploadFile } from "@/api/common";
import { showImagePreview } from 'vant'; // Use showImagePreview for Vue 3/Vant 4
import { throttle } from '@/utils/throttle';

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
       connectionStatusText: '连接断开...',
       isSending: false,
       
       // Refactored state
       isHistoryMode: false,
       loadingOld: false,
       loadingNew: false,
       noMoreOld: false,
       noMoreNew: false,
       chatInitToken: 0,
       targetDate: null, 

       showMorePanel: false,
       showEmojiPanel: false,
       backgroundImage: '', // NOTE: removed corrupted comment.
       emojiList: [
          ':)', ':D', ';)' , ':P', 'XD', '<3', ':(', ':|'
       ]
    }
  },
  computed: {
     groupedMessages() {
        const groups = [];
        let currentGroup = null;
        // messages are already sorted by backend usually, but sort to be safe
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
     },
     minId() {
        return this.messages.length > 0 ? this.messages[0].id : null;
     },
     maxId() {
        return this.messages.length > 0 ? this.messages[this.messages.length - 1].id : null;
     }
  },
  created() {
     this.handleScroll = throttle(this.handleScroll, 120);
     this.sessionId = this.$route.query.sessionId;
     this.targetDate = this.$route.query.targetDate || null;
     this.queryLoginUser();
  },
  activated() {
     const newSessionId = this.$route.query.sessionId;
     if (newSessionId && String(newSessionId) !== String(this.sessionId)) {
         // NOTE: removed corrupted comment.
         if (this.sessionId) {
             wsManager.unregisterCallback('private-chat-' + this.sessionId);
         }

         // NOTE: removed corrupted comment.
         this.sessionId = newSessionId;
         this.targetDate = this.$route.query.targetDate || null;
         this.messages = [];
         this.contactName = '加载中...';
         this.contactAvatar = '';

         // NOTE: removed corrupted comment.
         this.queryLoginUser();
     } else {
         // NOTE: removed corrupted comment.
         this.setCurrentActiveSession();
         // NOTE: removed corrupted comment.
         if (this.sessionId) {
             wsManager.registerCallback('private-chat-' + this.sessionId, this.handleWebSocketMessage);
         }
     }
  },
  deactivated() {
     if (typeof this.handleScroll?.cancel === 'function') {
        this.handleScroll.cancel();
     }
     if (wsManager.getWebSocket() && wsManager.getWebSocket().isConnected) {
        wsManager.sendMessage('UPDATE_ACTIVE_SESSION', { sessionId: null });
     }
  },
  mounted() {
     this.setupIntersectionObserver();
  },
  beforeUnmount() {
     if (typeof this.handleScroll?.cancel === 'function') {
       this.handleScroll.cancel();
     }
     if (this.observer) {
       this.observer.disconnect();
     }
     if (this.wsCallback) {
        wsManager.unregisterCallback('private-chat-' + this.sessionId);
     }
     if(wsManager.getWebSocket() && wsManager.getWebSocket().isConnected) {
        wsManager.sendMessage('UPDATE_ACTIVE_SESSION', { sessionId: null });
     }
  },
  methods: {
     goBack() {
        this.$router.go(-1);
     },
     goToChatInfo() {
        this.$router.push({ path: '/chat/info', query: { sessionId: this.sessionId } });
     },
     onAvatarClick(msg) {
        if (msg.isSelf) {
            this.$router.push('/user/info');
        } else {
            // NOTE: removed corrupted comment.
            if (this.toUserId) {
                this.$router.push(`/user/profile/${this.toUserId}`);
            } else {
                console.warn('Cannot navigate: toUserId is missing');
            }
        }
     },
     queryLoginUser() {
        const sessionKey = String(this.sessionId || '');
        getCurrentUser().then(res => {
           if (String(this.sessionId || '') !== sessionKey) return;
           this.user = res.data || res;
           if(this.user.icon && !this.user.icon.startsWith('http')) {
               this.user.icon = this.$fileURL + this.user.icon;
           }
           this.initWebSocket();
           this.getChatSession(sessionKey);
        }).catch(() => {
           if (String(this.sessionId || '') !== sessionKey) return;
           this.$router.push('/user/login');
        });
     },
     initWebSocket() {
        const token = localStorage.getItem("token");
        if(token) {
           // Ensure WS is connected (global instance)
           const ws = wsManager.getWebSocket();
           if (!ws || !ws.isConnected) {
               wsManager.init(token);
           }

           // Always register/update callback for current instance
           // Use an arrow function wrapper to ensure 'this' is always correct context
           this.wsCallback = (msg) => this.handleWebSocketMessage(msg);
           wsManager.registerCallback('private-chat-' + this.sessionId, this.wsCallback);

           // Update local status immediately
           if(ws && ws.isConnected) {
              this.wsStatus = 'connected';
              this.setCurrentActiveSession();
           }

           // Listen for connection changes
           // Note: This might stack listeners if not careful, but component is not cached now.
           // Better to use a specific named listener if manager supports it, or just rely on global state.
           // For now, let's keep it simple.
        }
     },
     handleConnectionChange(status) {
        this.wsStatus = status;
        this.connectionStatusText = status === 'connected' ? '已连接' : '已断开';
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
        if (import.meta.env.DEV) {
          console.log('[ChatDetail] WS message', message?.type, this.sessionId);
        }
        if(message.type === 'NEW_MESSAGE') {
           // Loose equality check for ID (string vs number)
           if(message.data.sessionId == this.sessionId) {
              this.addMessageToUI(message.data);
           } else {
              if (import.meta.env.DEV) console.log('[ChatDetail] Ignore message from other session', message.data.sessionId, this.sessionId);
           }
        } else if (message.type === 'MESSAGE_SENT') {
           this.handleMessageSent(message.data);
        } else if (message.type === 'MESSAGE_STATUS_UPDATE') {
           this.handleMessageStatusUpdate(message.data);
        } else if (message.type === 'ERROR') {
           this.$message.error('发送失败: ' + (message.data.msg || '未知错误'));
           // Mark latest sending message as failed
           const sendingMsg = this.messages.slice().reverse().find(m => m.status === 'sending');
           if (sendingMsg) {
               sendingMsg.status = 'failed';
           }
        }
     },
     handleMessageStatusUpdate(data) {
        if (data.type === 'BATCH_MESSAGES_READ') {
           const sessionId = data.sessionId;
           const newStatus = data.status;
           this.messages.forEach(msg => {
              if (msg.isSelf && msg.sessionId == sessionId && msg.status !== newStatus) {
                 msg.status = newStatus;
              }
           });
         } else if (data.type === 'MESSAGE_READ') {
            const messageId = this.normalizeId(data.messageId);
            const newStatus = data.status;
            this.messages.forEach(m => {
               if (m.id == messageId) {
                  m.status = newStatus;
               }
            });
         }
      },
     
     // NOTE: removed corrupted comment.
     getChatSession(sessionKey = String(this.sessionId || '')) {
        // NOTE: removed corrupted comment.
        if (this.user.id) {
           this.fetchSessionAndBackground(sessionKey);
        } else {
           // NOTE: removed corrupted comment.
           // NOTE: removed corrupted comment.
        }
     },
     fetchSessionAndBackground(sessionKey = String(this.sessionId || '')) {
        getChatSession({ sessionId: this.sessionId }).then(async res => {
           if (String(this.sessionId || '') !== sessionKey) return;
           const session = res.data || res;
           this.contactName = session.contactName;
           this.contactAvatar = session.contactAvatar ? (session.contactAvatar.startsWith('http') ? session.contactAvatar : this.$fileURL + session.contactAvatar) : '';
           
           if (session.fromUid === this.user.id) {
               this.toUserId = session.toUid;
           } else {
               this.toUserId = session.fromUid;
           }
           
           // NOTE: removed corrupted comment.
           try {
               const sessionsRes = await getUserSessions({ userId: this.user.id, current: 1 });
               if (String(this.sessionId || '') !== sessionKey) return;
               const userSessions = sessionsRes.data || [];
               const userSession = userSessions.find(s => s.sessionId == this.sessionId);
               if (userSession && userSession.backgroundImage) {
                   this.backgroundImage = userSession.backgroundImage.startsWith('http') ? userSession.backgroundImage : this.$fileURL + userSession.backgroundImage;
               }
           } catch (e) {
               console.error('Failed to load session background', e);
           }
           
           this.loadMessages(sessionKey);
        });
     },

     loadMessages(sessionKey = String(this.sessionId || '')) {
        const initToken = ++this.chatInitToken;
        this.loadingOld = false;
        this.loadingNew = false;
        if (this.targetDate) {
           this.initByDate(this.targetDate, initToken, sessionKey);
        } else {
           this.initLatest(initToken, sessionKey);
        }
     },

     // NOTE: removed corrupted comment.
     initLatest(initToken = this.chatInitToken, sessionKey = String(this.sessionId || '')) {
        this.loading = true;
        this.isHistoryMode = false;
        this.noMoreOld = false;
        this.noMoreNew = true; // NOTE: removed corrupted comment.
        
        getMessageList({ sessionId: this.sessionId, current: 1 }).then(res => {
             if (initToken !== this.chatInitToken || String(this.sessionId || '') !== sessionKey) return;
             const list = res.data || [];
             this.messages = list.map(this.processMessage).sort((a,b) => a.id - b.id);
             this.scrollToBottom();
             if (list.length < 10) {
                 this.noMoreOld = true;
             }
             
             // NOTE: removed corrupted comment.
             this.$nextTick(() => {
                 const el = this.$refs.chatMessages;
                 if(el) {
                    if (el.scrollHeight <= el.clientHeight && !this.noMoreOld) {
                        this.loadMoreOld();
                    }
                 }
             });
        }).finally(() => {
             if (initToken === this.chatInitToken && String(this.sessionId || '') === sessionKey) {
                 this.loading = false;
             }
        });
     },

     // NOTE: removed corrupted comment.
     initByDate(dateStr, initToken = this.chatInitToken, sessionKey = String(this.sessionId || '')) {
        this.loading = true;
        // NOTE: removed corrupted comment.
        const params = { sessionId: this.sessionId, targetDate: dateStr, current: 1 };
        
        getMessageList(params).then(res => {
             if (initToken !== this.chatInitToken || String(this.sessionId || '') !== sessionKey) return;
             const list = res.data || [];
             this.messages = list.map(this.processMessage).sort((a,b) => a.id - b.id);
             this.isHistoryMode = true;
             this.noMoreOld = false;
             this.noMoreNew = false;
             
             // NOTE: removed corrupted comment.
             this.$nextTick(() => {
                 const el = this.$refs.chatMessages;
                 if(el) {
                    el.scrollTop = 0; 
                    if (el.scrollHeight <= el.clientHeight && !this.noMoreOld) {
                        this.loadMoreOld();
                    }
                 }
             });
        }).finally(() => {
             if (initToken === this.chatInitToken && String(this.sessionId || '') === sessionKey) {
                 this.loading = false;
             }
        });
     },

     // NOTE: removed corrupted comment.
     loadMoreOld() {
        if (this.messages.length === 0) return;
        if (this.loadingOld || this.noMoreOld) return;
        this.loadingOld = true;
        const sessionKey = String(this.sessionId || '');
        
        // NOTE: removed corrupted comment.
        const currentMinId = this.minId;

        const params = {
            sessionId: this.sessionId,
            anchorId: Number(currentMinId) || currentMinId,
            direction: 'old'
        };
        
        const oldHeight = this.$refs.chatMessages?.scrollHeight || 0;
        
        getMessageList(params).then(res => {
             if (String(this.sessionId || '') !== sessionKey) return;
             const list = res.data || [];
             if (list.length > 0) {
                 const newMessages = list.map(this.processMessage);
                 const existingIds = new Set(this.messages.map(m => this.normalizeId(m.id)));
                 const uniqueMessages = newMessages.filter(m => !existingIds.has(this.normalizeId(m.id)));
                 
                 if (uniqueMessages.length > 0) {
                     this.messages = [...uniqueMessages, ...this.messages].sort((a,b) => a.id - b.id);
                     
                     // NOTE: removed corrupted comment.
                     this.$nextTick(() => {
                        if (String(this.sessionId || '') !== sessionKey) return;
                        const container = this.$refs.chatMessages;
                        if (!container) return;
                        const newHeight = container.scrollHeight;
                        const diff = newHeight - oldHeight;
                        container.scrollTop = diff;
                     });
                 } else {
                     console.warn('Received duplicate old messages, stop loading older history');
                     this.noMoreOld = true;
                 }
             } else {
                 this.noMoreOld = true;
             }
        }).finally(() => {
             if (String(this.sessionId || '') === sessionKey) {
                 this.loadingOld = false;
             }
        });
     },

     // NOTE: removed corrupted comment.
     loadMoreNew() {
        if (!this.isHistoryMode || this.loadingNew || this.noMoreNew) return;
        this.loadingNew = true;
        const sessionKey = String(this.sessionId || '');
        
        // NOTE: removed corrupted comment.
        const currentMaxId = this.maxId;
        const params = {
            sessionId: this.sessionId,
            anchorId: Number(currentMaxId) || currentMaxId,
            direction: 'new',
            current: 1 // NOTE: removed corrupted comment.
        };
        
        if (import.meta.env.DEV) console.log('[ChatDetail] debug log');
        
        getMessageList(params).then(res => {
             if (String(this.sessionId || '') !== sessionKey) return;
             const list = res.data || [];
             if (list.length > 0) {
                 const newMessages = list.map(this.processMessage);
                 // NOTE: removed corrupted comment.
                 const existingIds = new Set(this.messages.map(m => this.normalizeId(m.id)));
                 const uniqueMessages = newMessages.filter(m => !existingIds.has(this.normalizeId(m.id)));
                 
                 if (uniqueMessages.length > 0) {
                     // NOTE: removed corrupted comment.
                     this.messages = [...this.messages, ...uniqueMessages].sort((a,b) => a.id - b.id);
                 } else {
                     console.warn('Received duplicate new messages, stop loading newer history');
                     this.noMoreNew = true;
                 }
             } else {
                 this.noMoreNew = true;
             }
        }).finally(() => {
             if (String(this.sessionId || '') === sessionKey) {
                 this.loadingNew = false;
             }
        });
     },

     // NOTE: removed corrupted comment.
     resetToLatest() {
        this.targetDate = null;
        this.messages = [];
        this.loadMessages();
     },

     setupIntersectionObserver() {
        this.observer = new IntersectionObserver((entries) => {
            const entry = entries[0];
            if (entry.isIntersecting) {
                if (this.loadingOld || this.noMoreOld) {
                    return;
                }
                this.loadMoreOld();
            }
        }, {
            root: this.$refs.chatMessages,
            threshold: 0.1 
        });
        
        const sentinel = this.$refs.topSentinel;
        if (sentinel) {
            this.observer.observe(sentinel);
        }
     },
     handleScroll() {
        const el = this.$refs.chatMessages;
        if (!el) return;
        const hasObserver = typeof window !== 'undefined' && 'IntersectionObserver' in window && this.observer;
        
        // NOTE: removed corrupted comment.
        if (!hasObserver && el.scrollTop < 50) {
            this.loadMoreOld();
        } 
        // NOTE: removed corrupted comment.
        else if (el.scrollTop + el.clientHeight >= el.scrollHeight - 50) {
            this.loadMoreNew();
        }
     },

     normalizeId(value) {
         if (value === null || value === undefined) return value;
         return String(value);
     },
     processMessage(msg) {
        const fromId = msg.fromUid || msg.fromUserId;
        let msgType = Number(msg.messageType || 0);
        let content = msg.content || '';
        const processedId = this.normalizeId(msg.id ?? msg.messageId);

        // NOTE: removed corrupted comment.
        if (msgType === 0 && content) {
            const lower = content.toLowerCase();
            if (lower.endsWith('.jpg') || lower.endsWith('.png') || lower.endsWith('.jpeg') || lower.endsWith('.gif') || lower.endsWith('.webp')) {
                msgType = 1;
            }
        }

        // Fix image URL if needed
        if (msgType === 1 && content) {
            const isFullUrl = content.startsWith('http') || content.startsWith('blob:') || content.startsWith('data:');
            if (!isFullUrl) {
                const prefix = this.$fileURL || '';
                // prepend file host for relative image paths
                if (!content.startsWith(prefix) && !content.startsWith('http')) {
                     content = prefix + content;
                }
            }
        }

        return {
           ...msg,
           id: processedId,
           content,
           messageType: msgType,
           fromUid: fromId,
           isSelf: fromId === this.user.id
           // NOTE: removed corrupted comment.
           // NOTE: removed corrupted comment.
        };
     },
     addMessageToUI(data) {
        if (import.meta.env.DEV) console.log('[ChatDetail] debug log');
        const msg = this.processMessage(data);

        // Fix: If backend returns ID 0, do not use it for deduplication
        let exists = false;
        if (msg.id != 0 && msg.id != '0') {
            exists = this.messages.find(m => m.id == msg.id);
        }

        // NOTE: removed corrupted comment.
        // NOTE: removed corrupted comment.
        if (!exists && msg.isSelf) {
            const pendingTemp = this.messages.find(m => m.tempId && m.status === 'sending');
            if (pendingTemp) {
                if (import.meta.env.DEV) console.log('[ChatDetail] debug log');
                pendingTemp.id = msg.id;
                pendingTemp.status = msg.status || 'sent';
                pendingTemp.tempId = undefined;
                return;
            }

            // NOTE: removed corrupted comment.
            const pendingSameContent = this.messages.find(m =>
                m.isSelf && m.status === 'sending' && m.content === msg.content && m.messageType === msg.messageType
            );
            if (pendingSameContent) {
                if (import.meta.env.DEV) console.log('[ChatDetail] debug log');
                pendingSameContent.id = msg.id;
                pendingSameContent.status = msg.status || 'sent';
                pendingSameContent.tempId = undefined;
                return;
            }
        }

        if(!exists) {
           if (import.meta.env.DEV) console.log('[ChatDetail] debug log');
           this.messages.push(msg);
           if (!this.isHistoryMode) {
               this.$nextTick(() => {
                   this.scrollToBottom();
               });
           }
        } else {
           if (import.meta.env.DEV) console.log('[ChatDetail] debug log');
        }
     },
     sendMessage() {
        if(this.isSendDisabled) {
            if (import.meta.env.DEV) console.log('Send disabled:', this.messageInput, this.isSending, this.wsStatus);
            return;
        }

        if (this.isHistoryMode) {
            this.resetToLatest();
        }

        const content = this.messageInput.trim();
        const tempId = 'temp_' + Date.now();
        const msg = {
           id: tempId,
           tempId: tempId,
           content,
           messageType: 0, // Text
           createTime: new Date().toISOString(),
           isSelf: true,
           status: 'sending',
           sessionId: this.sessionId
        };

        // Critical: Ensure Vue reactivity detects the change
        this.messages.push(msg);
        this.$nextTick(() => {
            this.scrollToBottom();
        });

        this.messageInput = '';
        this.isSending = true;

        const sent = wsManager.sendMessage('CHAT_MESSAGE', {
           sessionId: parseInt(this.sessionId) || this.sessionId, // Ensure ID format matches backend expectation
           content,
           messageType: 0,
           toUserId: this.toUserId,
           tempId
        });

        if(!sent) {
           const target = this.messages.find(m => m.tempId === tempId);
           if (target) target.status = 'failed';
           this.isSending = false;
        }
        // Auto reset sending status just in case
        setTimeout(() => this.isSending = false, 500);
     },
     sendImageMessage(url, tempId) {
        const sent = wsManager.sendMessage('CHAT_MESSAGE', {
           sessionId: parseInt(this.sessionId) || this.sessionId,
           content: url,
           messageType: 1, // Image
           toUserId: this.toUserId,
           tempId
        });

        if(!sent) {
           const msg = this.messages.find(m => m.tempId === tempId);
           if(msg) msg.status = 'failed';
        }
     },
     previewImage(currentUrl) {
        if (!currentUrl) return;

        // NOTE: removed corrupted comment.
        const images = this.messages
            .filter(m => m.messageType === 1 && m.content)
            .map(m => m.content);

        // NOTE: removed corrupted comment.
        const index = images.indexOf(currentUrl);

        if (import.meta.env.DEV) console.log('Preview image:', currentUrl, 'Index:', index, 'Total:', images.length);

        showImagePreview({
            images: images,
            startPosition: index !== -1 ? index : 0,
            closeable: true,
            loop: false // NOTE: removed corrupted comment.
        });
     },
      handleMessageSent(data) {
         const idx = this.messages.findIndex(m => m.tempId === data.tempId);
         if(idx !== -1) {
            const normalizedId = this.normalizeId(data.messageId);
            // NOTE: removed corrupted comment.
            if (!normalizedId || normalizedId === '0') {
               this.messages[idx].status = 'sending';
               return;
            }

            const exists = this.messages.find(m => m.id == normalizedId);
            if (exists) {
                this.messages.splice(idx, 1);
            } else {
                this.messages[idx].id = normalizedId;
                this.messages[idx].status = 'sent';
                this.messages[idx].tempId = undefined;
            }
         } else {
           // NOTE: removed corrupted comment.
           const fallbackIdxFromEnd = this.messages.slice().reverse().findIndex(m => m.isSelf && m.status === 'sending');
           if (fallbackIdxFromEnd !== -1) {
               const realIdx = this.messages.length - 1 - fallbackIdxFromEnd;
               const normalizedId = this.normalizeId(data.messageId);
               const exists = this.messages.find(m => m.id == normalizedId);
               if (exists && exists !== this.messages[realIdx]) {
                   this.messages.splice(realIdx, 1);
               } else {
                   this.messages[realIdx].id = normalizedId;
                   this.messages[realIdx].status = 'sent';
                   this.messages[realIdx].tempId = undefined;
               }
           } else {
               // fallback: tempId not found, reconcile using messageId
               const normalizedId = this.normalizeId(data.messageId);
               const exists = this.messages.find(m => m.id == normalizedId);
               if (exists) {
                   exists.status = 'sent';
               } else {
                   this.messages.push(this.processMessage({ ...data, id: normalizedId, status: 'sent', fromUid: this.user.id }));
               }
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
        return timeStr;
     },
     getGroupTime(timeStr) {
        const d = new Date(timeStr);
        return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
     },
     getStatusText(status) {
        if (status === 'sending') return 'Sending';
        if (status === 'failed') return 'Failed';
        return '';
     },
     toggleMorePanel() {
        this.showEmojiPanel = false;
        this.showMorePanel = !this.showMorePanel;
        if(this.showMorePanel) {
           this.$nextTick(() => this.scrollToBottom());
        }
     },
     toggleEmojiPanel() {
        this.showMorePanel = false;
        this.showEmojiPanel = !this.showEmojiPanel;
        if(this.showEmojiPanel) {
           this.$nextTick(() => this.scrollToBottom());
        }
     },
     toggleVoice() {
        this.$message.info('Voice input is not available yet');
     },
     hideAllPanels() {
        this.showMorePanel = false;
        this.showEmojiPanel = false;
     },
     selectImage() {
        this.$refs.imageInput.click();
     },
     onImageSelected(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            this.$message.warning('Image size cannot exceed 5MB');
            return;
        }

        // Preview immediately
        const tempUrl = URL.createObjectURL(file);
        const tempId = 'temp_img_' + Date.now();

        if (this.isHistoryMode) {
            this.resetToLatest();
        }

        const msg = {
           id: tempId,
           tempId: tempId,
           content: tempUrl,
           messageType: 1, // Image
           createTime: new Date().toISOString(),
           isSelf: true,
           status: 'sending',
           sessionId: this.sessionId
        };
        this.messages.push(msg);
        this.scrollToBottom();
        this.showMorePanel = false;

        const formData = new FormData();
        formData.append('file', file);

        uploadFile(formData).then(res => {
            let path = res.data || res;
            if (path && typeof path === 'string') {
                 // NOTE: removed corrupted comment.
                 const prefix = this.$fileURL || '';
                 if (prefix && path.startsWith(prefix)) {
                     path = path.substring(prefix.length);
                 } else if (path.startsWith('http')) {
                     // NOTE: removed corrupted comment.
                     // NOTE: removed corrupted comment.
                     const match = path.match(/(\/smart-live\/.*)/) || path.match(/(\/20\d{2}\/.*)/);
                     if (match) path = match[1];
                 }

                 this.sendImageMessage(path, tempId);
            }
        }).catch(err => {
            console.error(err);
            msg.status = 'failed';
            this.$message.error('Image upload failed');
        });

        e.target.value = '';
     },
     insertEmoji(emoji) {
        this.messageInput += emoji;
     }
  }
}
</script>

<style scoped>
.chat-detail-page { height: 100vh; display: flex; flex-direction: column; background: #ededed; overflow-x: hidden; }
.header { height: 50px; display: flex; align-items: center; justify-content: space-between; padding: 0 15px; border-bottom: 1px solid #d9d9d9; background: #ededed; z-index: 10; position: relative; }
.header-title {
  font-weight: bold;
  font-size: 17px;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  max-width: 60%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
}
.header-back-btn { font-size: 20px; cursor: pointer; }
.header-more-btn { font-size: 20px; cursor: pointer; color: #333; padding: 4px; }
.header-more-btn:hover { color: #07c160; }
.connection-status { text-align: center; color: white; padding: 5px; font-size: 12px; }
.connection-status.connected { background: #67C23A; }
.connection-status.disconnected { background: #E6A23C; }

.top-sentinel { width: 100%; height: 2px; flex-shrink: 0; }
.chat-messages { flex: 1; overflow-y: auto; padding: 15px; display: flex; flex-direction: column; -webkit-overflow-scrolling: touch; }
.time-separator { text-align: center; margin: 15px 0; position: relative; }
.time-label { background: #c9c9c9; padding: 3px 10px; border-radius: 4px; font-size: 12px; color: #fff; }

.message-container { display: flex; margin-bottom: 15px; width: 100%; align-items: flex-start; }
.message-container-left { flex-direction: row; }
.message-container-right { flex-direction: row-reverse; }

.avatar { width: 40px; height: 40px; border-radius: 6px; margin: 0 10px; flex-shrink: 0; overflow: hidden; }
.avatar-image { width: 100%; height: 100%; object-fit: cover; }
.avatar-fallback { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; border-radius: 6px; }
.avatar-left .avatar-fallback { background: #07c160; }
.avatar-right .avatar-fallback { background: #ff6633; }

.message-content { max-width: 70%; display: flex; flex-direction: column; }
.message { padding: 10px 14px; border-radius: 12px; font-size: 16px; word-wrap: break-word; position: relative; color: #000; line-height: 1.5; }
.message-left { background: white; border-top-left-radius: 4px; }
.message-right { background: #95EC69; border-top-right-radius: 4px; }

/* NOTE: removed corrupted comment. */
.message-image {
    background: transparent !important;
    padding: 0 !important;
    border-radius: 4px;
    overflow: hidden;
}

/* Status outside bubble */
/* NOTE: removed corrupted comment. */
.msg-img {
    max-width: 150px;
    max-height: 150px;
    border-radius: 4px;
    cursor: zoom-in;
    display: block;
    object-fit: cover;
}

.message-status-outer { font-size: 11px; color: #999; margin-top: 4px; text-align: right; }
.message-status-outer .status-sending { color: #999; }
.message-status-outer .status-failed { color: #F56C6C; }
.message-status-outer .status-read { color: #07c160; }
.message-status-outer .status-delivered { color: #999; }

.chat-input { background: #f7f7f7; border-top: 1px solid #d9d9d9; display: flex; flex-direction: column; padding-bottom: env(safe-area-inset-bottom, 10px); }
.input-container { padding: 8px 12px; display: flex; align-items: center; gap: 8px; }
.input-icon { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 24px; color: #333; cursor: pointer; flex-shrink: 0; }
.input-icon i.active { color: #07c160; }
.chat-input input { flex: 1; padding: 8px 15px; border: none; border-radius: 20px; outline: none; height: 38px; box-sizing: border-box; background: #f0f0f0; font-size: 16px; min-width: 0; }
.send-btn { padding: 0 16px; height: 36px; background: #07c160; color: white; border: none; border-radius: 6px; font-weight: 500; cursor: pointer; white-space: nowrap; font-size: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

/* Emoji Panel */
.emoji-panel { background: #f7f7f7; border-top: 1px solid #e1e1e1; padding: 10px; height: 220px; overflow-y: auto; }
.emoji-grid { display: grid; grid-template-columns: repeat(8, 1fr); gap: 5px; }
.emoji-item { font-size: 28px; text-align: center; padding: 8px 0; cursor: pointer; border-radius: 8px; transition: background 0.15s; }
.emoji-item:active { background: rgba(0, 0, 0, 0.1); }

.more-panel { height: 200px; background: #f7f7f7; border-top: 1px solid #e1e1e1; display: flex; padding: 20px; box-sizing: border-box; flex-wrap: wrap; }
.panel-item { width: 25%; display: flex; flex-direction: column; align-items: center; margin-bottom: 20px; cursor: pointer; }
.panel-icon { width: 56px; height: 56px; background: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 26px; color: #333; margin-bottom: 8px; }
.panel-text { font-size: 12px; color: #666; }

.empty-messages { text-align: center; padding: 50px; color: #999; }
.system-message { text-align: center; font-size: 12px; color: #999; padding: 5px 10px; background: rgba(0,0,0,0.05); border-radius: 4px; margin: 5px auto; }
.back-to-latest {
  position: absolute;
  bottom: 80px;
  right: 20px;
  background: #fff;
  border-radius: 20px;
  padding: 8px 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  font-size: 13px;
  color: #07c160;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  z-index: 100;
}
.load-more-tip, .loading-tip {
  text-align: center;
  padding: 10px;
  color: #999;
  font-size: 12px;
}
.load-more-tip span {
    background: rgba(0,0,0,0.05);
    padding: 4px 10px;
    border-radius: 10px;
    cursor: pointer;
}
</style>
