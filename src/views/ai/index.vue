<template>
  <PageLayout :loading="isSending && messages.length === 0" skeleton-type="detail" class="ai-container">
    <!-- Header -->
    <div class="ai-header">
      <div class="header-left">
        <!-- 汉堡菜单按钮 -->
        <i class="el-icon-s-fold menu-btn" @click="toggleSidebar"></i>
      </div>
      <div class="header-center">
        <span class="logo-text">{{ sessionTitle || '天机AI助理' }}</span>
        <!-- 当前话题标签 -->
        <span class="topic-tag" v-if="currentTopic">{{ currentTopic }}</span>
      </div>
      <div class="header-right">
        <div class="tools">
           <i class="el-icon-s-operation" @click="toggleSettings" title="设置"></i>
           <i class="el-icon-close" @click="goBack" title="退出"></i>
        </div>
      </div>
    </div>

    <!-- 侧边栏 -->
    <div class="sidebar-mask" v-if="sidebarVisible" @click="sidebarVisible = false"></div>
    <div class="sidebar" :class="{ open: sidebarVisible }">
      <div class="sidebar-header">
        <div class="search-box">
          <i class="el-icon-search"></i>
          <input type="text" v-model="searchText" placeholder="搜索对话">
        </div>
      </div>
      <div class="sidebar-body">
        <!-- 新建对话按钮 -->
        <div class="new-chat-card" @click="createSession">
          <i class="el-icon-edit-outline"></i>
          <span>发起新对话</span>
        </div>
        
        <!-- 对话列表 -->
        <div class="chat-list-title">对话</div>
        <div class="chat-list">
          <div v-if="isLoadingHistory" class="loading-state">
            <i class="el-icon-loading"></i>
            <span>加载中...</span>
          </div>
          <div v-else-if="filteredHistoryList.length === 0" class="empty-history">
            <p>暂无历史对话</p>
          </div>
          <div v-else class="chat-item" 
               v-for="item in filteredHistoryList" 
               :key="item.id"
               :class="{ active: currentSessionId === item.id }"
               @click="loadSession(item)">
            <div class="chat-item-content">
              <div class="chat-title">{{ item.title }}</div>
              <div class="chat-time">{{ formatTime(item.updateTime || item.createTime) }}</div>
            </div>
            <i class="el-icon-delete" @click.stop="deleteHistory(item.id)"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- Settings Panel -->
    <div class="settings-panel" v-if="settingsVisible">
      <div class="settings-header">
        <span>AI设置</span>
        <i class="el-icon-close" @click="settingsVisible = false"></i>
      </div>
      <div class="settings-body">
        <div class="setting-item">
          <span class="item-label">字体大小</span>
          <div class="font-size-btns">
            <button :class="{ active: fontSize === 'small' }" @click="fontSize = 'small'">小</button>
            <button :class="{ active: fontSize === 'medium' }" @click="fontSize = 'medium'">中</button>
            <button :class="{ active: fontSize === 'large' }" @click="fontSize = 'large'">大</button>
          </div>
        </div>
        <div class="setting-item">
          <span class="item-label">主题</span>
          <div class="theme-btns">
            <button :class="{ active: theme === 'light' }" @click="theme = 'light'">浅色</button>
            <button :class="{ active: theme === 'dark' }" @click="theme = 'dark'">深色</button>
          </div>
        </div>
        <div class="setting-item">
          <span class="item-label">连续对话</span>
          <div class="toggle-switch" :class="{ on: contextMode }" @click="contextMode = !contextMode">
            <div class="toggle-thumb"></div>
          </div>
        </div>
        <div class="setting-item">
          <span class="item-label">发送键</span>
          <div class="font-size-btns">
            <button :class="{ active: sendKey === 'enter' }" @click="sendKey = 'enter'">Enter</button>
            <button :class="{ active: sendKey === 'ctrl+enter' }" @click="sendKey = 'ctrl+enter'">Ctrl+Enter</button>
          </div>
        </div>
      </div>
    </div>


    <!-- Chat Body -->
    <div class="chat-body" ref="scrollRef">
      <!-- Empty State -->
      <div v-if="messages.length === 0" class="empty-state">
         <div class="welcome-visual">
            <div class="chick-wrapper">
               <img src="@/assets/ai-avatar.jpg" class="chick-img-custom" />
               <div class="hi-bubble">Hi</div>
            </div>
         </div>
         <h3 class="welcome-title">Hello, 我是小只因！</h3>
         <p class="welcome-desc">我是您的智能生活助手，我可以帮您查询附近的热门店铺，搜索超值代金券，还能直接为您下单抢购优惠券，让生活更省心！</p>
         
         <div class="suggestion-area">
            <div class="s-header">
               <span>试试这样问我:</span>
               <span class="refresh-btn"><i class="el-icon-refresh"></i> 换一换</span>
            </div>
            <div class="suggestion-chips">
               <div class="chip" @click="quickAsk('查找店铺')">帮我找附近评分最高的火锅店</div>
               <div class="chip" @click="quickAsk('搜索优惠')">查询附近的可用代金券</div>
               <div class="chip" @click="quickAsk('下单代金券')">帮我下单一张肯德基的套餐券</div>
            </div>
         </div>
      </div>

      <!-- Messages -->
      <div v-else class="message-list">
         <div v-for="(msg, idx) in messages" :key="idx" class="message-row" :class="msg.role">
            <div class="avatar" :class="msg.role">
               <img v-if="msg.role ==='user'" :src="userAvatar" />
               <img v-else src="@/assets/ai-avatar.jpg" />
            </div>
            <div class="content-wrapper">
               <div class="message-bubble">
                  <div v-if="msg.role === 'ai'" v-html="renderMd(msg.content)" class="markdown-body"></div>
                  <div v-else>{{ msg.content }}</div>
               </div>
            </div>
         </div>
      </div>
    </div>

    <!-- Input Area -->
    <div class="footer-input">
       <div class="input-container">
          <textarea 
            v-model="inputText" 
            placeholder="请将您的问题告诉我，Shift+Enter换行"
            @keydown="handleKeyDown"
            :disabled="isSending"
            rows="2"
          ></textarea>
          <div class="input-toolbar">
             <div class="toolbar-right">
                <button class="send-btn" @click="handleSend" :disabled="!inputText || isSending">
                  <i v-if="!isSending" class="el-icon-s-promotion"></i>
                  <i v-else class="el-icon-loading"></i>
                </button>
             </div>
          </div>
       </div>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, nextTick, onMounted, onUnmounted, computed, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useRouter, useRoute } from 'vue-router';
import MarkdownIt from 'markdown-it';
import { 
  sendMessageStream, 
  createSession as createSessionAPI, 
  getSessionList, 
  getMessageList, 
  deleteSession as deleteSessionAPI,
  updateSessionTitle,
  getSuggestions
} from '@/api/ai';
import { getCurrentUser } from '@/api/user';
import { locationUtil } from '@/utils/location';
import PageLayout from '@/components/PageLayout/PageLayout.vue';

const router = useRouter();
const route = useRoute();

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
});

const inputText = ref('');
const scrollRef = ref(null);
const messages = ref([]);
const currentSessionId = ref(null);
const isSending = ref(false);
const isLoadingHistory = ref(false);
const currentEventSource = ref(null);
const userAvatar = ref('https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'); // 默认头像

// 设置相关
const settingsVisible = ref(false);
const isFullscreen = ref(false);
const fontSize = ref('medium');
const theme = ref('light');
const contextMode = ref(true);
const sendKey = ref('enter');
const currentTopic = ref(''); // 当前话题标签
const sessionTitle = ref(''); // 会话标题

// 侧边栏相关
const sidebarVisible = ref(false);
const searchText = ref('');


// 切换侧边栏
const toggleSidebar = () => {
  sidebarVisible.value = !sidebarVisible.value;
  // 打开侧边栏时自动加载历史记录
  if (sidebarVisible.value && rawHistoryList.value.length === 0) {
    loadHistoryList();
  }
};

// 切换设置面板
const toggleSettings = () => {
  settingsVisible.value = !settingsVisible.value;
};

// 全屏功能
const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().then(() => {
      isFullscreen.value = true;
    }).catch(err => {
      ElMessage.warning('无法进入全屏模式');
    });
  } else {
    document.exitFullscreen().then(() => {
      isFullscreen.value = false;
    });
  }
};

// 监听全屏状态变化
const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement;
};

// 检查登录状态并获取用户信息
const checkLoginStatus = async () => {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const res = await getCurrentUser();
      if (res.code === 200 && res.data && res.data.avatar) {
         userAvatar.value = res.data.avatar;
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
    }
  }
};



onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange);
});

// 返回上一页
const goBack = () => {
  router.back();
};

// 根据设置应用字体大小
watch(fontSize, (val) => {
  const sizes = { small: '13px', medium: '15px', large: '17px' };
  document.documentElement.style.setProperty('--ai-font-size', sizes[val]);
}, { immediate: true });

const renderMd = (text) => {
  return md.render(text || '');
};

// 处理键盘事件
const handleKeyDown = (e) => {
  if (sendKey.value === 'enter') {
    // Enter发送，Shift+Enter换行
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  } else {
    // Ctrl+Enter发送，Enter换行
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSend();
    }
  }
};

// 监听主题变化
watch(theme, (val) => {
  if (val === 'dark') {
    document.documentElement.classList.add('dark-theme');
  } else {
    document.documentElement.classList.remove('dark-theme');
  }
});

// 发送消息
const handleSend = async () => {
  if (!inputText.value.trim() || isSending.value) return;
  
  const userMessage = inputText.value.trim();
  inputText.value = '';
  
  // 添加用户消息
  messages.value.push({ role: 'user', content: userMessage });
  scrollToBottom();
  
  // 设置当前话题（取消息前8个字）
  if (!currentTopic.value) {
    currentTopic.value = userMessage.substring(0, 8) + (userMessage.length > 8 ? '...' : '');
  }
  currentSessionId.value=11;
  // 如果没有会话ID，先创建会话
  if (!currentSessionId.value) {
    try {
      const res = await createSessionAPI({ title: userMessage.substring(0, 20) });
      if (res.code === 200) {
        currentSessionId.value = res.data.sessionId || res.data.id;
        sessionTitle.value = userMessage.substring(0, 20); // 设置会话标题
      } else {
        ElMessage.error('创建会话失败');
        return;
      }
    } catch (error) {
      console.error('创建会话失败:', error);
      ElMessage.error('创建会话失败，请重试');
      return;
    }
  }
  
  isSending.value = true;
  
  // 获取位置信息
  let location = null;
  try {
     location = await locationUtil.getLocation();
  } catch (e) {
     console.error('获取位置失败', e);
  }
  
  // 添加AI消息占位符
  messages.value.push({ role: 'ai', content: '' });
  const aiMessageIndex = messages.value.length - 1;
  
  // 使用流式API
  try {
    currentEventSource.value = sendMessageStream(
      {
        sessionId: currentSessionId.value,
        content: userMessage,
        contextMode: contextMode.value,
        latitude: location ? location.y : null,
        longitude: location ? location.x : null
      },
      // onMessage: 接收每个消息片段
      (data) => {
        if (data.content) {
          messages.value[aiMessageIndex].content += data.content;
          scrollToBottom();
        }
      },
      // onError: 错误处理
      (error) => {
        console.error('消息发送失败:', error);
        ElMessage.error('消息发送失败，请重试');
        isSending.value = false;
      },
      // onComplete: 完成回调
      () => {
        isSending.value = false;
        currentEventSource.value = null;
      }
    );
  } catch (error) {
    console.error('发送消息异常:', error);
    ElMessage.error('发送消息失败');
    isSending.value = false;
  }
};

// 快捷提问
const quickAsk = (text) => {
  inputText.value = text;
  handleSend();
};

// 创建新会话
const createSession = async () => {
  try {
    // 停止当前流式传输
    if (currentEventSource.value) {
      currentEventSource.value.close();
      currentEventSource.value = null;
    }
    
    const res = await createSessionAPI({ title: '新对话' });
    if (res.code === 200) {
      currentSessionId.value = res.data.sessionId || res.data.id;
      messages.value = [];
      currentTopic.value = ''; // 重置话题
      sessionTitle.value = ''; // 重置会话标题
      sidebarVisible.value = false; // 关闭侧边栏
      ElMessage.success('新会话已创建');
    } else {
      ElMessage.error(res.message || '创建会话失败');
    }
  } catch (error) {
    console.error('创建会话失败:', error);
    ElMessage.error('创建会话失败');
  }
};

// 历史记录相关
const rawHistoryList = ref([]);

// 搜索过滤后的历史列表
const filteredHistoryList = computed(() => {
  if (!searchText.value.trim()) {
    return rawHistoryList.value;
  }
  return rawHistoryList.value.filter(session => 
    session.title && session.title.toLowerCase().includes(searchText.value.toLowerCase())
  );
});

// 时间格式化
const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}月${day}日`;
};

// 加载历史会话列表
const loadHistoryList = async () => {
  try {
    isLoadingHistory.value = true;
    const res = await getSessionList({ pageNum: 1, pageSize: 50 });
    if (res.code === 200) {
      rawHistoryList.value = res.data.list || res.data.records || res.data || [];
    } else {
      ElMessage.error(res.message || '加载历史记录失败');
    }
  } catch (error) {
    console.error('加载历史记录失败:', error);
    ElMessage.error('加载历史记录失败');
  } finally {
    isLoadingHistory.value = false;
  }
};

// 加载指定会话
const loadSession = async (item) => {
  try {
    // 停止当前流式传输
    if (currentEventSource.value) {
      currentEventSource.value.close();
      currentEventSource.value = null;
    }
    
    currentSessionId.value = item.id || item.sessionId;
    
    // 加载该会话的消息历史
    const res = await getMessageList({ 
      sessionId: currentSessionId.value, 
      pageNum: 1, 
      pageSize: 100 
    });
    
    if (res.code === 200) {
      const messageList = res.data.list || res.data.records || res.data || [];
      messages.value = messageList.map(msg => ({
        role: msg.role === 'USER' || msg.role === 'user' ? 'user' : 'ai',
        content: msg.content
      }));
      sidebarVisible.value = false; // 关闭侧边栏
      currentTopic.value = item.title ? item.title.substring(0, 8) + (item.title.length > 8 ? '...' : '') : ''; // 设置话题
      sessionTitle.value = item.title || ''; // 设置会话标题
      scrollToBottom();
    } else {
      ElMessage.error(res.message || '加载会话失败');
    }
  } catch (error) {
    console.error('加载会话失败:', error);
    ElMessage.error('加载会话失败');
  }
};

// 删除历史会话
const deleteHistory = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除这个会话吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    const res = await deleteSessionAPI(id);
    if (res.code === 200) {
      ElMessage.success('删除成功');
      // 从列表中移除
      rawHistoryList.value = rawHistoryList.value.filter(item => item.id !== id && item.sessionId !== id);
      
      // 如果删除的是当前会话，清空消息
      if (currentSessionId.value === id) {
        messages.value = [];
        currentSessionId.value = null;
      }
    } else {
      ElMessage.error(res.message || '删除失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除会话失败:', error);
      ElMessage.error('删除失败');
    }
  }
};

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (scrollRef.value) {
       scrollRef.value.scrollTop = scrollRef.value.scrollHeight;
    }
  });
};

// 组件挂载时初始化
// 组件挂载时初始化
onMounted(() => {
  scrollToBottom();
  checkLoginStatus();
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  
  // Auto send if query exists
  if (route.query.q) {
     inputText.value = route.query.q;
     handleSend();
  }
});
</script>


<style scoped>
.ai-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #eef2f9 100%);
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
}

.ai-header {
  height: 60px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0,0,0,0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.02);
  z-index: 10;
}

/* 头部样式 */
.header-left {
  display: flex;
  align-items: center;
}
.menu-btn {
  font-size: 24px;
  color: #6b7280;
  cursor: pointer;
  transition: color 0.2s;
}
.menu-btn:hover {
  color: #3b82f6;
}
.header-center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}
.logo-text {
  font-size: 17px;
  font-weight: 700;
  color: #1f2937;
}
.header-right .tools {
  display: flex;
  align-items: center;
  gap: 20px;
}
.header-right .tools i {
  font-size: 20px;
  color: #6b7280;
  cursor: pointer;
  transition: color 0.2s;
}
.header-right .tools i:hover {
  color: #3b82f6;
}

/* 侧边栏 */
.sidebar-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 999;
  animation: fadeIn 0.2s;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.sidebar {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  width: 85%;
  max-width: 360px;
  background: #fff;
  z-index: 1000;
  transform: translateX(-100%);
  transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 20px rgba(0,0,0,0.15);
}
.sidebar.open {
  transform: translateX(0);
}
.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #f3f4f6;
}
.search-box {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: #f9fafb;
  border-radius: 10px;
}
.search-box i {
  font-size: 18px;
  color: #9ca3af;
}
.search-box input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 15px;
  color: #333;
}
.search-box input::placeholder {
  color: #9ca3af;
}
.sidebar-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}
.new-chat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%);
  border: 1px solid #bfdbfe;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 20px;
}
.new-chat-card:hover {
  background: linear-gradient(135deg, #dbeafe 0%, #e0f2fe 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}
.new-chat-card i {
  font-size: 20px;
  color: #3b82f6;
}
.new-chat-card span {
  font-size: 15px;
  font-weight: 600;
  color: #1e40af;
}
.chat-list-title {
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 12px;
  padding: 0 4px;
}
.chat-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.chat-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}
.chat-item:hover {
  background: #f9fafb;
}
.chat-item.active {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-left: 3px solid #3b82f6;
}
.chat-item-content {
  flex: 1;
  min-width: 0;
}
.chat-title {
  font-size: 14px;
  color: #1f2937;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 4px;
}
.chat-time {
  font-size: 12px;
  color: #9ca3af;
}
.chat-item .el-icon-delete {
  font-size: 16px;
  color: #d1d5db;
  opacity: 0;
  transition: all 0.2s;
}
.chat-item:hover .el-icon-delete {
  opacity: 1;
  color: #ef4444;
}

/* 加载状态和空状态 */
.loading-state, .empty-history {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #999;
  gap: 12px;
}
.loading-state i {
  font-size: 24px;
  animation: rotate 1s linear infinite;
}
@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.empty-history i {
  font-size: 48px;
  color: #ddd;
}
.empty-history p {
  margin: 0;
  font-size: 14px;
}

/* 禁用状态样式 */
textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}


.header-right {
  display: flex;
  align-items: center;
  gap: 24px;
  color: #666;
  font-size: 14px;
  cursor: pointer;
}
.history-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  transition: all 0.2s;
}
.history-btn:hover {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

/* 工具按钮 */
.tools {
  display: flex;
  align-items: center;
  gap: 16px;
}
.tools i {
  font-size: 18px;
  color: #9ca3af;
  cursor: pointer;
  transition: color 0.2s;
}
.tools i:hover {
  color: #3b82f6;
}

/* 主题标签 */
.topic-tag {
  background: linear-gradient(135deg, #fee2e2, #fecaca);
  color: #dc2626;
  padding: 6px 14px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid #fca5a5;
}

/* 用户头像 */
.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #e5e7eb;
}
.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 设置面板 */
.settings-panel {
  position: fixed;
  top: 70px;
  right: 24px;
  width: 320px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.15);
  z-index: 100;
  animation: slideIn 0.2s ease;
}
@keyframes slideIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
.settings-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 16px;
}
.settings-header i {
  cursor: pointer;
  color: #999;
  transition: color 0.2s;
}
.settings-header i:hover {
  color: #333;
}
.settings-body {
  padding: 16px 20px;
}
.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
}
.setting-item:last-child {
  border-bottom: none;
}
.item-label {
  font-size: 14px;
  color: #333;
}
.font-size-btns, .theme-btns {
  display: flex;
  gap: 8px;
}
.font-size-btns button, .theme-btns button {
  padding: 6px 14px;
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  color: #666;
}
.font-size-btns button:hover, .theme-btns button:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}
.font-size-btns button.active, .theme-btns button.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-color: transparent;
}

/* 开关 */
.toggle-switch {
  width: 44px;
  height: 24px;
  background: #e5e7eb;
  border-radius: 12px;
  position: relative;
  cursor: pointer;
  transition: background 0.3s;
}
.toggle-switch.on {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.toggle-thumb {
  width: 20px;
  height: 20px;
  background: #fff;
  border-radius: 50%;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: transform 0.3s;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.toggle-switch.on .toggle-thumb {
  transform: translateX(20px);
}

.chat-body {
  flex: 1;
  overflow-y: auto;
  padding: 30px;
  scroll-behavior: smooth;
}

.empty-state {
  margin-top: 60px;
  text-align: center;
  color: #333;
  padding: 0 20px;
}
.welcome-visual {
  margin-bottom: 24px;
}
.chick-wrapper {
  position: relative;
  display: inline-block;
}
.chick-img {
  font-size: 72px;
  animation: bounce 2s ease-in-out infinite;
}
.chick-img-custom {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  animation: bounce 2s ease-in-out infinite;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
.hi-bubble {
  position: absolute;
  top: -10px;
  right: -30px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  padding: 6px 14px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  animation: pulse 2s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
.welcome-title {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.welcome-desc {
  font-size: 15px;
  color: #6b7280;
  max-width: 420px;
  margin: 0 auto 32px;
  line-height: 1.6;
}
.suggestion-area {
  max-width: 600px;
  margin: 0 auto;
}
.s-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-size: 14px;
  color: #666;
}
.refresh-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  color: #3b82f6;
  transition: all 0.2s;
}
.refresh-btn:hover {
  color: #2563eb;
}
.refresh-btn i {
  transition: transform 0.3s;
}
.refresh-btn:hover i {
  transform: rotate(180deg);
}
.suggestion-chips {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
}
.chip {
  padding: 12px 20px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  cursor: pointer;
  color: #374151;
  font-size: 14px;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  max-width: 200px;
  text-align: left;
}
.chip:hover {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border-color: #667eea;
  color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.15);
}

.message-list {
  max-width: 800px;
  width: 100%;
  margin: 0 auto;
}

.message-row {
  display: flex;
  gap: 16px;
  margin-bottom: 30px;
  animation: fadeIn 0.3s ease;
}
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.message-row.user {
  flex-direction: row-reverse;
}

.avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  overflow: hidden;
  background: transparent;
  flex-shrink: 0;
}
.avatar img { width: 100%; height: 100%; }

.ai-avatar-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  width: 100%; height: 100%;
}

.content-wrapper {
  max-width: 80%;
}
.message-bubble {
  padding: 16px 20px;
  border-radius: 16px;
  font-size: var(--ai-font-size, 15px);
  line-height: 1.7;
  max-width: 600px;
  position: relative;
  word-wrap: break-word;
}
.message-row.ai .message-bubble {
  background: #fff;
  box-shadow: 0 4px 20px rgba(0,0,0,0.06);
  border-top-left-radius: 4px;
  color: #333;
  border: 1px solid rgba(0,0,0,0.04);
}
.message-row.user .message-bubble {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-top-right-radius: 4px;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.35);
}

/* Markdown样式优化 */
.markdown-body {
  font-size: var(--ai-font-size, 15px);
}
.markdown-body h1, .markdown-body h2, .markdown-body h3 {
  margin: 16px 0 8px;
  font-weight: 600;
}
.markdown-body p {
  margin: 8px 0;
}
.markdown-body ul, .markdown-body ol {
  padding-left: 20px;
  margin: 8px 0;
}
.markdown-body li {
  margin: 4px 0;
}
.markdown-body code {
  background: rgba(59, 130, 246, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 13px;
  color: #3b82f6;
}
.markdown-body pre {
  background: #1e293b;
  color: #e2e8f0;
  padding: 16px;
  border-radius: 12px;
  overflow-x: auto;
  margin: 12px 0;
}
.markdown-body pre code {
  background: none;
  color: inherit;
  padding: 0;
}
.markdown-body strong {
  color: #1f2937;
  font-weight: 600;
}

.footer-input {
  background: #fff;
  padding: 16px 20px;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.04);
  z-index: 10;
}
.input-container {
  max-width: 800px;
  margin: 0 auto;
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 16px;
  padding: 12px 16px;
  transition: all 0.3s;
}
.input-container:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

textarea {
  width: 100%;
  min-height: 40px;
  max-height: 120px;
  border: none;
  resize: none;
  outline: none;
  font-size: var(--ai-font-size, 15px);
  color: #333;
  line-height: 1.5;
  background: transparent;
  font-family: inherit;
}
textarea::placeholder {
  color: #9ca3af;
}
textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 输入框底部工具栏 */
.input-toolbar {
  display: flex;
  justify-content: flex-end; /* Align to right */
  align-items: center;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #f3f4f6;
}
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.send-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: #fff;
  background: #e5e7eb;
}
.send-btn:not(:disabled) {
  background: linear-gradient(135deg, #818cf8 0%, #6366f1 100%);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
}
.send-btn:not(:disabled):hover {
  transform: scale(1.05);
}
.send-btn i { 
  font-size: 18px; 
}

/* 深色主题 */
.dark-theme .ai-container {
  background: #1a1a1a;
  color: #e5e7eb;
}

.dark-theme .ai-header {
  background: #242424;
  border-bottom-color: #333;
}

.dark-theme .logo-text {
  color: #60a5fa;
}

.dark-theme .menu-btn,
.dark-theme .header-right .tools i {
  color: #9ca3af;
}

.dark-theme .menu-btn:hover,
.dark-theme .header-right .tools i:hover {
  color: #60a5fa;
}

.dark-theme .topic-tag {
  background: linear-gradient(135deg, #7c2d12, #991b1b);
  color: #fca5a5;
  border-color: #7c2d12;
}

/* 侧边栏深色 */
.dark-theme .sidebar {
  background: #242424;
}

.dark-theme .search-box {
  background: #1a1a1a;
}

.dark-theme .search-box input {
  color: #e5e7eb;
}

.dark-theme .new-chat-card {
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
  border-color: #3b82f6;
}

.dark-theme .new-chat-card span {
  color: #93c5fd;
}

.dark-theme .chat-list-title {
  color: #9ca3af;
}

.dark-theme .chat-item:hover {
  background: #1a1a1a;
}

.dark-theme .chat-item.active {
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
}

.dark-theme .chat-title {
  color: #e5e7eb;
}

.dark-theme .chat-time {
  color: #6b7280;
}

/* 设置面板深色 */
.dark-theme .settings-panel {
  background: #242424;
  border-left-color: #333;
}

.dark-theme .settings-header {
  border-bottom-color: #333;
  color: #e5e7eb;
}

.dark-theme .item-label {
  color: #e5e7eb;
}

.dark-theme .font-size-btns button,
.dark-theme .theme-btns button {
  background: #1a1a1a;
  color: #9ca3af;
  border-color: #333;
}

.dark-theme .font-size-btns button.active,
.dark-theme .theme-btns button.active {
  background: #3b82f6;
  color: #fff;
  border-color: #3b82f6;
}

.dark-theme .toggle-switch {
  background: #333;
}

.dark-theme .toggle-switch.on {
  background: #3b82f6;
}

/* 聊天区域深色 */
.dark-theme .chat-body {
  background: #1a1a1a;
}

.dark-theme .welcome-title {
  color: #e5e7eb;
}

.dark-theme .welcome-desc {
  color: #9ca3af;
}

.dark-theme .suggestion-area {
  background: #242424;
  border-color: #333;
}

.dark-theme .s-header {
  color: #9ca3af;
}

.dark-theme .chip {
  background: #1a1a1a;
  color: #e5e7eb;
  border-color: #333;
}

.dark-theme .chip:hover {
  background: #2a2a2a;
  border-color: #3b82f6;
}

.dark-theme .message-row.user .message-bubble {
  background: #3b82f6;
  color: #fff;
}

.dark-theme .message-row.ai .message-bubble {
  background: #242424;
  color: #e5e7eb;
  border-color: #333;
}

/* Markdown内容深色 */
.dark-theme .message-bubble h1,
.dark-theme .message-bubble h2,
.dark-theme .message-bubble h3,
.dark-theme .message-bubble h4,
.dark-theme .message-bubble h5,
.dark-theme .message-bubble h6 {
  color: #e5e7eb;
  border-bottom-color: #333;
}

.dark-theme .message-bubble code {
  background: #1a1a1a;
  color: #f472b6;
}

.dark-theme .message-bubble pre {
  background: #1a1a1a;
  border-color: #333;
}

.dark-theme .message-bubble pre code {
  color: #e5e7eb;
}

.dark-theme .message-bubble blockquote {
  border-left-color: #3b82f6;
  background: #1a1a1a;
}

.dark-theme .message-bubble table th {
  background: #2a2a2a;
  color: #e5e7eb;
}

.dark-theme .message-bubble table td {
  border-color: #333;
  color: #e5e7eb;
}

/* 输入区域深色 */
.dark-theme .footer-input {
  background: #242424;
}

.dark-theme .input-container {
  background: #1a1a1a;
  border-color: #333;
}

.dark-theme .input-container:focus-within {
  border-color: #3b82f6;
}

.dark-theme textarea {
  color: #e5e7eb;
}

.dark-theme textarea::placeholder {
  color: #6b7280;
}

.dark-theme .input-toolbar {
  border-top-color: #333;
}

.dark-theme .toolbar-left i,
.dark-theme .toolbar-center i {
  color: #6b7280;
}

.dark-theme .toolbar-left i:hover,
.dark-theme .toolbar-center i:hover {
  color: #3b82f6;
}

</style>

