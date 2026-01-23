<template>
  <div class="chat-info-page">
    <!-- Header -->
    <div class="header">
      <div class="header-back" @click="goBack"><i class="el-icon-arrow-left"></i></div>
      <div class="header-title">聊天信息</div>
      <div class="header-placeholder"></div>
    </div>

    <!-- Member Section -->
    <div class="section member-section">
      <div class="member-list">
        <div class="member-item" @click="goToProfile">
          <img :src="contact.avatar || '/imgs/icons/default-icon.png'" class="member-avatar" />
          <div class="member-name">{{ contact.name || '好友' }}</div>
        </div>
      </div>
    </div>

    <!-- Function List 1 -->
    <div class="section">
      <div class="list-item" @click="searchHistory">
        <span class="item-label">查找聊天记录</span>
        <i class="el-icon-arrow-right"></i>
      </div>
    </div>

    <!-- Function List 2 -->
    <div class="section">
      <div class="list-item">
        <span class="item-label">消息免打扰</span>
        <el-switch v-model="settings.mute" @change="toggleMute" />
      </div>
      <div class="list-item">
        <span class="item-label">置顶聊天</span>
        <el-switch v-model="settings.pin" @change="togglePin" />
      </div>
    </div>

    <!-- Function List 3 -->
    <div class="section">
      <div class="list-item" @click="setBackground">
        <span class="item-label">设置当前聊天背景</span>
        <i class="el-icon-arrow-right"></i>
      </div>
      <div class="list-item" @click="clearHistory">
        <span class="item-label">清空聊天记录</span>
        <i class="el-icon-arrow-right"></i>
      </div>
    </div>

    <!-- 微信风格确认弹窗 -->
    <div class="modal-overlay" v-if="showClearModal" @click="showClearModal = false">
      <div class="modal-box" @click.stop>
        <div class="modal-content">确定清空聊天记录吗？</div>
        <div class="modal-footer">
          <button class="modal-btn cancel" @click="showClearModal = false">取消</button>
          <button class="modal-btn confirm" @click="confirmClear">清空</button>
        </div>
      </div>
    </div>

    <!-- Hidden file input -->
    <input type="file" ref="bgInput" accept="image/*" @change="onBgSelected" style="display:none" />
  </div>
</template>

<script>
import { getChatSession, getUserSessions, togglePinUserSession, updateBackgroundImage } from '@/api/chat';
import { getCurrentUser } from '@/api/user';
import { uploadFile } from '@/api/common';
import { ElMessage } from 'element-plus';

export default {
  name: 'ChatInfo',
  data() {
    return {
      sessionId: null,
      userSession: null, // 用户会话对象 (包含 id, pin 等字段)
      contact: {
        id: null,
        name: '',
        avatar: ''
      },
      settings: {
        pin: false,
        mute: false
      },
      showClearModal: false
    };
  },
  created() {
    this.sessionId = this.$route.query.sessionId;
    this.loadSessionInfo();
  },
  methods: {
    goBack() {
      this.$router.go(-1);
    },
    async loadSessionInfo() {
      if (!this.sessionId) return;
      try {
        // 获取当前用户
        const userRes = await getCurrentUser();
        const user = userRes.data || userRes;
        
        // 获取聊天会话信息
        const res = await getChatSession({ sessionId: this.sessionId });
        const session = res.data || res;
        this.contact.name = session.contactName;
        this.contact.avatar = session.contactAvatar ? this.$fileURL + session.contactAvatar : '';
        this.contact.id = session.toUid || session.fromUid;
        
        // 获取用户会话列表 (包含 pin 状态) - 需要传 userId
        const sessionsRes = await getUserSessions({ userId: user.id, current: 1 });
        const userSessions = sessionsRes.data || [];
        console.log('用户会话列表:', userSessions);
        
        const userSession = userSessions.find(s => s.sessionId == this.sessionId);
        console.log('当前会话:', userSession, 'sessionId:', this.sessionId);
        
        if (userSession) {
          this.userSession = userSession;
          // pin 可能是 true/1 或 false/0
          this.settings.pin = userSession.pin === true || userSession.pin === 1;
          console.log('置顶状态:', this.settings.pin, '原始值:', userSession.pin);
        }
      } catch (error) {
        console.error('加载会话信息失败:', error);
      }
    },
    goToProfile() {
      if (this.contact.id) {
        this.$router.push(`/user/profile/${this.contact.id}`);
      }
    },
    inviteMember() {
      ElMessage.info('邀请功能开发中');
    },
    searchHistory() {
      this.$router.push({ path: '/chat/history-calendar', query: { sessionId: this.sessionId } });
    },
    async togglePin(val) {
      if (!this.userSession || !this.userSession.id) {
        ElMessage.error('会话信息加载中，请稍后再试');
        this.settings.pin = !val;
        return;
      }
      try {
        // 和 List.vue 保持一致的调用方式
        await togglePinUserSession({ id: this.userSession.id, pin: val });
        this.userSession.pin = val; // 更新本地状态
        ElMessage.success(val ? '已置顶' : '已取消置顶');
      } catch (error) {
        ElMessage.error('操作失败');
        this.settings.pin = !val;
      }
    },
    async toggleMute(val) {
      console.log('POST /chat/mute', { id: this.userSession?.id, mute: val });
      ElMessage.success(val ? '已开启免打扰' : '已关闭免打扰');
    },
    setBackground() {
      this.$refs.bgInput.click();
    },
    async onBgSelected(e) {
      const file = e.target.files[0];
      if (!file) return;
      
      if (!this.userSession || !this.userSession.id) {
        ElMessage.error('会话信息加载中，请稍后再试');
        e.target.value = '';
        return;
      }
      
      try {
        // 1. 上传图片
        const formData = new FormData();
        formData.append('file', file);
        const uploadRes = await uploadFile(formData);
        let imagePath = uploadRes.data || uploadRes;
        
        // 如果返回的是完整URL，只取路径部分
        if (typeof imagePath === 'string' && imagePath.startsWith('http')) {
          // 移除域名前缀，只保留路径 (如 /2026/01/23/xxx.jpg)
          try {
            const url = new URL(imagePath);
            imagePath = url.pathname.replace('/smart-live', ''); // 移除 /smart-live 前缀
          } catch (e) {
            // 如果解析失败，保持原样
          }
        }
        
        // 2. 调用接口保存背景图
        await updateBackgroundImage({
          id: this.userSession.id,
          backgroundImage: imagePath
        });
        
        ElMessage.success('背景设置成功');
      } catch (error) {
        console.error('设置背景失败:', error);
        ElMessage.error('设置背景失败');
      }
      e.target.value = '';
    },
    clearHistory() {
      this.showClearModal = true;
    },
    async confirmClear() {
      console.log('POST /chat/clear', { sessionId: this.sessionId });
      ElMessage.success('清空成功');
      this.showClearModal = false;
    }
  }
};
</script>

<style scoped>
.chat-info-page {
  min-height: 100vh;
  background: #f5f5f5;
}

/* Header */
.header {
  height: 50px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 15px;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  z-index: 10;
}
.header-back {
  font-size: 20px;
  cursor: pointer;
  color: #333;
}
.header-title {
  font-size: 17px;
  font-weight: 600;
  color: #333;
}
.header-placeholder {
  width: 20px;
}

/* Section */
.section {
  background: #fff;
  margin-top: 10px;
}
.section:first-of-type {
  margin-top: 0;
}

/* Member Section */
.member-section {
  padding: 20px 15px;
}
.member-list {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}
.member-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}
.member-avatar {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  object-fit: cover;
}
.member-name {
  font-size: 12px;
  color: #666;
  margin-top: 6px;
  max-width: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
}
/* 邀请按钮 - 美化版 */
.add-btn {
  width: 56px;
  height: 56px;
  border: 1.5px dashed #d9d9d9;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  transition: all 0.2s ease;
}
.add-btn i {
  font-size: 24px;
  color: #bbb;
  transition: color 0.2s ease;
}
.member-item:hover .add-btn {
  border-color: #a0a0a0;
  background: #f5f5f5;
}
.member-item:hover .add-btn i {
  color: #888;
}
.member-item:active .add-btn {
  transform: scale(0.95);
  background: #f0f0f0;
}

/* List Item */
.list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 15px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  transition: background 0.15s;
}
.list-item:last-child {
  border-bottom: none;
}
.list-item:active {
  background: #f9f9f9;
}
.item-label {
  font-size: 16px;
  color: #333;
}
.list-item i {
  font-size: 14px;
  color: #ccc;
}

/* Switch 样式覆盖 */
:deep(.el-switch) {
  --el-switch-on-color: #07c160;
}

/* 微信风格确认弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-box {
  width: 280px;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
}
.modal-content {
  padding: 24px 20px;
  text-align: center;
  font-size: 16px;
  color: #333;
}
.modal-footer {
  display: flex;
  border-top: 1px solid #eee;
}
.modal-btn {
  flex: 1;
  height: 48px;
  border: none;
  background: #fff;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.2s;
}
.modal-btn:active {
  background: #f5f5f5;
}
.modal-btn.cancel {
  color: #333;
  border-right: 1px solid #eee;
}
.modal-btn.confirm {
  color: #576b95;
  font-weight: 500;
}
</style>
