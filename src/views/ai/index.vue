<template>
  <PageLayout :loading="isSending && messages.length === 0" skeleton-type="detail" class="ai-container">
    <!-- Header -->
    <div class="ai-header">
      <div class="header-left">
        <i class="el-icon-s-fold menu-btn" @click="toggleSidebar"></i>
      </div>
      <div class="header-center">
        <span class="header-logo-icon">✦</span>
        <span class="logo-text">{{ sessionTitle || '只因智能助手' }}</span>
      </div>
      <div class="header-right">
        <div class="tools">
           <i class="el-icon-setting" @click="toggleSettings" title="设置"></i>
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
        <div class="chat-list" @scroll="handleHistoryScroll">
          <div v-if="isLoadingHistory && rawHistoryList.length === 0" class="loading-state">
            <i class="el-icon-loading"></i>
            <span>加载中...</span>
          </div>
          <div v-else-if="filteredHistoryList.length === 0" class="empty-history">
            <p>暂无历史对话</p>
          </div>
          <template v-else>
            <div class="chat-item"
                 v-for="item in filteredHistoryList"
                 :key="item.id"
                 :class="{ active: currentSessionId === item.id }"
                 @click="loadSession(item)">
              <div class="chat-item-content">
                <div class="chat-title">{{ item.title }}</div>
                <div class="chat-time">{{ formatTime(item.updateTime || item.createTime) }}</div>
              </div>
              <el-icon class="delete-icon" @click.stop="deleteHistory(item.id)"><Delete /></el-icon>
            </div>
            <div v-if="isLoadingMore" class="loading-more">
              <i class="el-icon-loading"></i>
              <span>加载中...</span>
            </div>
            <div v-if="noMoreHistory && rawHistoryList.length > 0" class="no-more">
              没有更多了
            </div>
          </template>
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
            <div class="mascot-wrapper">
               <div class="mascot-glow"></div>
               <div class="mascot-card">
                  <img src="@/assets/ai-avatar.jpg" class="mascot-img" />
               </div>
               <div class="hi-bubble">Hi</div>
            </div>
         </div>
         <h3 class="welcome-title">Hello, 我是小只因!</h3>
         <p class="welcome-desc">我是您的智能生活助手，我可以帮您查询附近的热门店铺<br>搜索超值代金券服务，还能直接为您下单特惠优惠券，让生活更省心</p>
         
         <div class="suggestion-area">
            <div class="s-header">
               <span class="s-header-text">试试这样问我:</span>
               <span class="refresh-btn" @click="refreshSuggestions"><i class="el-icon-refresh-right"></i> 换一换</span>
            </div>
            <div class="suggestion-list">
               <div class="suggestion-card" @click="quickAsk('帮我找附近评分最高的火锅店')">
                  <div class="card-icon"><i class="el-icon-search"></i></div>
                  <span class="card-text">帮我找附近评分最高的火锅店</span>
               </div>
               <div class="suggestion-card" @click="quickAsk('查询附近的可用代金券')">
                  <div class="card-icon"><i class="el-icon-search"></i></div>
                  <span class="card-text">查询附近的可用代金券</span>
               </div>
               <div class="suggestion-card" @click="quickAsk('帮我下单一张首选基础套餐卷')">
                  <div class="card-icon"><i class="el-icon-search"></i></div>
                  <span class="card-text">帮我下单一张首选基础套餐卷</span>
               </div>
            </div>
         </div>
      </div>

      <!-- Messages -->
      <template v-else>
        <div class="top-sentinel" ref="topSentinel"></div>

        <div class="message-list">

           <!-- 点击加载更多 -->
           <div v-if="messages.length > 0 && !noMoreMessages" class="load-more-manual">
             <button class="load-more-btn" :disabled="isLoadingMoreMessages" @click="loadMoreMessages">
               <i v-if="isLoadingMoreMessages" class="el-icon-loading"></i>
               <span v-else>点击加载更多</span>
             </button>
           </div>

           <!-- 加载中提示 -->
           <div v-if="isLoadingMoreMessages" class="loading-more-messages">
              <i class="el-icon-loading"></i>
              <span>加载中...</span>
         </div>

         <div v-if="noMoreMessages && messages.length > 0" class="no-more-messages">
            没有更多消息了
         </div>
         <div v-for="(msg, idx) in messages" :key="idx" class="message-row" :class="msg.role">
            <div class="avatar" :class="msg.role">
               <img v-if="msg.role ==='user'" :src="userAvatar" />
               <img v-else src="@/assets/ai-avatar.jpg" />
            </div>
            <div class="content-wrapper">
               <div class="message-bubble">
                  <!-- 思考中状态 -->
                  <div v-if="msg.role === 'ai' && msg.thinking" class="thinking-indicator">
                     <span class="thinking-text">正在思考</span>
                     <span class="thinking-dots">
                        <span class="dot"></span>
                        <span class="dot"></span>
                        <span class="dot"></span>
                     </span>
                  </div>
                  <!-- 状态提示（正在搜索等） -->
                  <div v-else-if="msg.role === 'ai' && msg.status" class="status-loading">
                     <i class="el-icon-loading"></i>
                     <span>{{ msg.status }}</span>
                  </div>
                  <!-- AI 回复内容 -->
                  <div v-else-if="msg.role === 'ai'" v-html="renderMd(msg.displayContent || msg.content)" class="markdown-body"></div>
                  <!-- 用户消息 -->
                  <div v-else>{{ msg.content }}</div>
               </div>

               <!-- 店铺卡片列表 - 横向滑动，内置推荐理由与动作 -->
               <div v-if="msg.role === 'ai' && msg.shopList && msg.shopList.length > 0" class="shop-card-list carousel">
                  <div v-for="(shop, idx) in msg.shopList" :key="shop.id" class="shop-card" @click="goToShopDetail(shop)">
                     <div class="shop-img-wrapper">
                        <img :src="getShopImage(shop)" class="shop-img" @error="onImgError" loading="lazy" />
                        <div class="pill img-pill">推荐</div>
                        <div class="card-index-badge">{{ idx + 1 }} / {{ msg.shopList.length }}</div>
                     </div>
                     <div class="shop-info">
                        <div class="shop-header-row">
                          <h4 class="shop-name">{{ shop.name }}</h4>
                          <div class="rate-box">
                             <i class="el-icon-star-on"></i>
                             <span class="score-val">{{ shop.score || '0.0' }}</span>
                          </div>
                        </div>

                        <p v-if="shop.aiSuggestion" class="shop-reason">{{ shop.aiSuggestion }}</p>

                        <div class="shop-stat-row">
                           <span class="sold-count" v-if="shop.sold">月售 {{ shop.sold }}</span>
                           <span class="stat-divider" v-if="shop.sold && shop.avgPrice">|</span>
                           <span class="price-per" v-if="shop.avgPrice">¥{{ shop.avgPrice }}/人</span>
                           <span class="distance-tag" v-if="shop.distanceText">{{ shop.distanceText }}</span>
                        </div>

                        <div class="shop-loc-row">
                           <span class="shop-cate">{{ shop.categoryName || '美食' }}</span>
                           <span class="loc-divider">|</span>
                           <span class="shop-area">{{ shop.area || (shop.address ? shop.address.substring(0, 8) + '...' : '附近') }}</span>
                        </div>

                        <div class="shop-open-row" v-if="shop.openHours">
                           <i class="el-icon-time"></i>
                           <span>营业时间 {{ shop.openHours }}</span>
                        </div>

                        <div class="shop-tags-row" v-if="shop.tags && shop.tags.length">
                           <span class="tag-item pill" v-for="(tag, tIdx) in shop.tags.slice(0, 3)" :key="tIdx">{{ tag }}</span>
                        </div>

                        <div class="shop-actions">
                           <button class="ghost-btn primary" @click.stop="goToMap(shop)">去这里</button>
                           <button class="ghost-btn" @click.stop="doCollect(shop)">收藏</button>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
         <!-- 底部锚点 -->
         <div ref="bottomRef" class="scroll-anchor"></div>
      </div>
      </template>
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
  getSuggestions,
  searchSession
} from '@/api/ai';
import { Delete } from '@element-plus/icons-vue';
import { showConfirmDialog } from 'vant';
import 'vant/es/dialog/style';
import { getCurrentUser } from '@/api/user';
import { locationUtil } from '@/utils/location';
import { fileURL } from '@/utils/request';
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
const bottomRef = ref(null); // 底部锚点引用
const topSentinel = ref(null); // 顶部哨兵引用
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
const historyCurrent = ref(1);
const isLoadingMore = ref(false);
const noMoreHistory = ref(false);
const isSearching = ref(false);
const searchCurrent = ref(1);
const noMoreSearch = ref(false);
const searchResults = ref([]);

// 消息列表分页相关
const messageCurrent = ref(1);
const isLoadingMoreMessages = ref(false);
const noMoreMessages = ref(false);


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
      // 先从本地存储获取用户信息
      const userInfoStr = localStorage.getItem('userInfo');
      if (userInfoStr) {
        const userInfo = JSON.parse(userInfoStr);
        if (userInfo && userInfo.icon) {
          userAvatar.value = userInfo.icon.startsWith('http') ? userInfo.icon : fileURL + userInfo.icon;
          return;
        }
      }
      // 本地没有则从API获取
      const res = await getCurrentUser();
      const userData = res.data;
      if ((res.success || res.code === 200) && userData && userData.icon) {
        userAvatar.value = userData.icon.startsWith('http') ? userData.icon : fileURL + userData.icon;
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

  // 检查登录状态
  const token = localStorage.getItem('token');
  if (!token) {
    ElMessage.warning('请先登录后再使用AI助手');
    router.push('/user/login');
    return;
  }

  // 立即锁定，防止并发请求
  isSending.value = true;

  const userMessage = inputText.value.trim();
  inputText.value = '';

  // 添加用户消息
  messages.value.push({ role: 'user', content: userMessage });
  scrollToBottom();

  // 设置当前话题（取消息前8个字）
  if (!currentTopic.value) {
    currentTopic.value = userMessage.substring(0, 8) + (userMessage.length > 8 ? '...' : '');
  }

  // 如果没有会话ID，先创建会话
  if (!currentSessionId.value) {
    try {
      const res = await createSessionAPI({ title: userMessage.substring(0, 20) });
      // 兼容 success 或 code=200
      if (res.success || res.code === 200) {
        // 兼容 data 为对象或直接为 ID 的情况
        const id = (res.data && typeof res.data === 'object')
          ? (res.data.sessionId || res.data.id)
          : res.data;

        currentSessionId.value = id;
        sessionTitle.value = userMessage.substring(0, 20); // 设置会话标题
      } else {
        ElMessage.error('创建会话失败');
        isSending.value = false; // 失败时解锁
        return;
      }
    } catch (error) {
      console.error('创建会话失败:', error);
      ElMessage.error('创建会话失败，请重试');
      isSending.value = false; // 失败时解锁
      return;
    }
  }

  // 获取位置信息
  let location = null;
  try {
     location = await locationUtil.getLocation();
  } catch (e) {
     console.error('获取位置失败', e);
  }

  // 获取用户信息
  let userName = '';
  try {
    const userInfoStr = localStorage.getItem('userInfo');
    if (userInfoStr) {
      const userInfo = JSON.parse(userInfoStr);
      userName = userInfo.nickName || userInfo.name || '';
    }
  } catch (e) {
    console.error('获取用户信息失败', e);
  }

  // 添加AI消息占位符（思考中状态）
  messages.value.push({ role: 'ai', content: '', thinking: true, status: null, shopList: [] });
  const aiMessageIndex = messages.value.length - 1;

  // 使用流式API - 支持事件分流
  try {
    currentEventSource.value = sendMessageStream(
      {
        sessionId: currentSessionId.value,
        content: userMessage,
        contextMode: contextMode.value,
        latitude: location ? location.y : null,
        longitude: location ? location.x : null,
        userName: userName,
        region: location && location.region ? location.region.district || location.region.city : null
      },
      // onMessage: 接收普通消息片段（打字机效果）
      (data) => {
        // 如果后端返回401错误，直接跳登录
        if (data?.code === 401) {
          ElMessage.warning('登录状态已过期，请重新登录');
          router.push('/user/login');
          isSending.value = false;
          return;
        }
        // 部分后端可能把错误包在 content 里
        if (typeof data?.content === 'string') {
          try {
            const maybeErr = JSON.parse(data.content);
            if (maybeErr && maybeErr.code === 401) {
              ElMessage.warning('登录状态已过期，请重新登录');
              router.push('/user/login');
              isSending.value = false;
              return;
            }
          } catch (e) {
            // ignore json parse errors
          }
        }
        if (data.content) {
          // 收到第一条消息时，取消思考状态和status状态
          if (messages.value[aiMessageIndex].thinking) {
            messages.value[aiMessageIndex].thinking = false;
          }
          messages.value[aiMessageIndex].status = null;

          // 累积原始内容
          messages.value[aiMessageIndex].content += data.content;

          // 使用统一的解析函数处理流式内容
          const parsed = parseMessageContent(messages.value[aiMessageIndex].content);

          messages.value[aiMessageIndex].displayContent = parsed.displayContent;
          if (parsed.shopList && parsed.shopList.length > 0) {
            messages.value[aiMessageIndex].shopList = parsed.shopList;
          }

          scrollToBottom();
        }
      },
      // onError: 错误处理
      (error) => {
        console.error('消息发送失败:', error);
        const errCode = error?.code || error?.status || error?.response?.status;
        if (errCode === 401) {
          ElMessage.warning('登录状态已过期，请重新登录');
          router.push('/user/login');
        } else {
          ElMessage.error('消息发送失败，请重试');
        }
        isSending.value = false;
      },
      // onComplete: 完成回调
      () => {
        isSending.value = false;
        currentEventSource.value = null;
      },
      // onStatus: 状态更新回调（正在搜索...）
      (statusText) => {
        messages.value[aiMessageIndex].thinking = false;
        messages.value[aiMessageIndex].status = statusText;
        scrollToBottom();
      },
      // onCardRender: 卡片渲染回调（店铺推荐结果）
      (cardData) => {
        messages.value[aiMessageIndex].thinking = false;
        messages.value[aiMessageIndex].status = null;
        // 设置推荐语
        if (cardData.replyText) {
          messages.value[aiMessageIndex].content = cardData.replyText;
        }
        // 设置店铺列表
        if (cardData.recommendations && cardData.recommendations.length > 0) {
          messages.value[aiMessageIndex].shopList = cardData.recommendations;
        }
        scrollToBottom();
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

// 刷新建议
const refreshSuggestions = () => {
  ElMessage.info('正在刷新建议...');
  // TODO: 可以调用 API 获取新的建议
};

// 创建新会话
const createSession = async () => {
  // 检查登录状态
  const token = localStorage.getItem('token');
  if (!token) {
    ElMessage.warning('请先登录后再使用AI助手');
    router.push('/user/login');
    return;
  }

  try {
    // 停止当前流式传输
    if (currentEventSource.value) {
      currentEventSource.value.close();
      currentEventSource.value = null;
    }

    const res = await createSessionAPI({ title: '新对话' });
    if (res.success || res.code === 200) {
      // 兼容 data 为对象或直接为 ID 的情况
      const id = (res.data && typeof res.data === 'object')
        ? (res.data.sessionId || res.data.id)
        : res.data;

      currentSessionId.value = id;
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
  if (searchText.value.trim()) {
    return searchResults.value;
  }
  return rawHistoryList.value;
});

// 搜索会话
const handleSearch = async () => {
  const keyword = searchText.value.trim();
  if (!keyword) {
    searchResults.value = [];
    return;
  }
  try {
    isSearching.value = true;
    searchCurrent.value = 1;
    noMoreSearch.value = false;
    const res = await searchSession({ keyword, current: 1 });
    if (res.success || res.code === 200) {
      const list = Array.isArray(res.data) ? res.data : (res.data.list || res.data.records || []);
      searchResults.value = list;
      if (list.length < 10) {
        noMoreSearch.value = true;
      }
    }
  } catch (error) {
    console.error('搜索会话失败:', error);
  } finally {
    isSearching.value = false;
  }
};

// 加载更多搜索结果
const loadMoreSearchResults = async () => {
  if (isSearching.value || noMoreSearch.value || !searchText.value.trim()) return;
  try {
    isSearching.value = true;
    searchCurrent.value++;
    const res = await searchSession({ keyword: searchText.value.trim(), current: searchCurrent.value });
    if (res.success || res.code === 200) {
      const list = Array.isArray(res.data) ? res.data : (res.data.list || res.data.records || []);
      if (list.length === 0) {
        noMoreSearch.value = true;
      } else {
        searchResults.value = [...searchResults.value, ...list];
        if (list.length < 10) {
          noMoreSearch.value = true;
        }
      }
    }
  } catch (error) {
    console.error('加载更多搜索结果失败:', error);
    searchCurrent.value--;
  } finally {
    isSearching.value = false;
  }
};

// 监听搜索关键词变化（防抖）
let searchTimer = null;
watch(searchText, (val) => {
  if (searchTimer) clearTimeout(searchTimer);
  if (!val.trim()) {
    searchResults.value = [];
    return;
  }
  searchTimer = setTimeout(() => {
    handleSearch();
  }, 300);
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
  // 检查登录状态
  const token = localStorage.getItem('token');
  if (!token) {
    rawHistoryList.value = [];
    return;
  }

  try {
    isLoadingHistory.value = true;
    historyCurrent.value = 1;
    noMoreHistory.value = false;
    const res = await getSessionList({ current: 1 });
    if (res.success || res.code === 200) {
      const list = Array.isArray(res.data) ? res.data : (res.data.list || res.data.records || []);
      rawHistoryList.value = list;
      if (list.length < 10) {
        noMoreHistory.value = true;
      }
    } else {
      ElMessage.error(res.errorMsg || res.message || '加载历史记录失败');
    }
  } catch (error) {
    console.error('加载历史记录失败:', error);
    ElMessage.error('加载历史记录失败');
  } finally {
    isLoadingHistory.value = false;
  }
};

// 加载更多历史会话
const loadMoreHistory = async () => {
  if (isLoadingMore.value || noMoreHistory.value) return;
  try {
    isLoadingMore.value = true;
    historyCurrent.value++;
    const res = await getSessionList({ current: historyCurrent.value });
    if (res.success || res.code === 200) {
      const list = Array.isArray(res.data) ? res.data : (res.data.list || res.data.records || []);
      if (list.length === 0) {
        noMoreHistory.value = true;
      } else {
        rawHistoryList.value = [...rawHistoryList.value, ...list];
        if (list.length < 10) {
          noMoreHistory.value = true;
        }
      }
    }
  } catch (error) {
    console.error('加载更多历史记录失败:', error);
    historyCurrent.value--;
  } finally {
    isLoadingMore.value = false;
  }
};

// 处理会话列表滚动
const handleHistoryScroll = (e) => {
  const { scrollTop, scrollHeight, clientHeight } = e.target;
  if (scrollHeight - scrollTop - clientHeight < 50) {
    loadMoreHistory();
  }
};

// 解析消息内容，提取JSON数据
const parseMessageContent = (content) => {
  if (!content) return { displayContent: '', shopList: [] };

  let displayContent = content;
  let shopList = [];

  try {
    // 1. 尝试清洗数据，移除 ```json 标记
    // 注意：流式传输中，开头可能是 ```json\n{...
    let cleanContent = content;
    if (content.includes('```json')) {
      cleanContent = content.replace(/```json\s*/, '').replace(/```$/, '');
    }

    // 2. 尝试提取 replyText
    // 策略：找到 "replyText": " 开始的位置
    const replyKey = '"replyText"';
    const replyIndex = cleanContent.indexOf(replyKey);

    if (replyIndex !== -1) {
      // 找到冒号
      const colonIndex = cleanContent.indexOf(':', replyIndex);
      // 找到起始引号，冒号后面第一个非空白字符应该是引号
      let quoteStartIndex = -1;
      for (let i = colonIndex + 1; i < cleanContent.length; i++) {
        const char = cleanContent[i];
        if (char === '"') {
          quoteStartIndex = i;
          break;
        } else if (!/\s/.test(char)) {
          // 如果遇到非空白且非引号，说明格式不对
          break;
        }
      }

      if (quoteStartIndex !== -1) {
        let extractedText = '';
        // 尝试找到下一个字段的开始，作为当前字段的结束边界
        // 下一个字段通常是 "recommendations"
        const nextFieldKey = '"recommendations"';
        const nextFieldIndex = cleanContent.indexOf(nextFieldKey, quoteStartIndex);

        if (nextFieldIndex !== -1) {
          // 如果找到了下一个字段，说明 replyText 已经传完了
          // 往前找结束引号（忽略逗号和空白）
          const quoteEndIndex = cleanContent.lastIndexOf('"', nextFieldIndex);
          if (quoteEndIndex > quoteStartIndex) {
            extractedText = cleanContent.substring(quoteStartIndex + 1, quoteEndIndex);
          }
        } else {
          // 如果没找到下一个字段，说明还在传输中
          // 直接取到末尾，或者尝试找结束引号
          let rawText = cleanContent.substring(quoteStartIndex + 1);

          // 尝试去掉末尾可能的未闭合符号
          // 常见的流结尾可能是: ",  或者 "  或者只是内容
          if (rawText.endsWith('",')) {
             rawText = rawText.slice(0, -2);
          } else if (rawText.endsWith('"')) {
             rawText = rawText.slice(0, -1);
          }

          extractedText = rawText;
        }

        // 处理转义字符
        try {
          // 补全引号尝试 JSON.parse，处理 \n \" 等转义
          displayContent = JSON.parse(`"${extractedText}"`);
        } catch (e) {
          // 解析失败降级处理：手动处理常见转义
          // 替换 \\n 为换行，\\" 为 "
          displayContent = extractedText
            .replace(/\\n/g, '\n')
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\');
        }
      }
    } else {
      // 没找到 replyText，检查是不是只有 ```json 前缀
      if (content.trim().startsWith('```json')) {
         const idx = content.indexOf('```json');
         // 如果只有前缀，显示为空，避免显示 ```json
         displayContent = idx > 0 ? content.substring(0, idx) : '';
      }
    }

    // 3. 尝试提取 recommendations
    // 只有当存在闭合的数组结构时才解析
    const recMatch = cleanContent.match(/"recommendations"\s*:\s*(\[[\s\S]*\])/);
    if (recMatch) {
      try {
         shopList = JSON.parse(recMatch[1]);
      } catch (e) {
         // 数组还没传完
      }
    }

  } catch (err) {
    console.error('Message parsing error', err);
  }

  return { displayContent, shopList };
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
    messageCurrent.value = 1;
    noMoreMessages.value = false;

    // 加载该会话的消息历史
    const res = await getMessageList({
      sessionId: currentSessionId.value,
      current: 1
    });

    if (res.success || res.code === 200) {
      const messageList = Array.isArray(res.data) ? res.data : (res.data.list || res.data.records || []);
      messages.value = messageList.map(msg => {
        const role = msg.role === 'USER' || msg.role === 'user' ? 'user' : 'ai';
        // 如果是AI消息，尝试解析内容
        const parsed = role === 'ai' ? parseMessageContent(msg.content) : { displayContent: msg.content, shopList: [] };

        return {
          role,
          content: msg.content,
          displayContent: parsed.displayContent,
          shopList: parsed.shopList
        };
      });
      if (messageList.length < 10) {
        noMoreMessages.value = true;
      }
      sidebarVisible.value = false; // 关闭侧边栏
      currentTopic.value = item.title ? item.title.substring(0, 8) + (item.title.length > 8 ? '...' : '') : ''; // 设置话题
      sessionTitle.value = item.title || ''; // 设置会话标题
      scrollToBottom();
    } else {
      ElMessage.error(res.errorMsg || res.message || '加载会话失败');
    }
  } catch (error) {
    console.error('加载会话失败:', error);
    ElMessage.error('加载会话失败');
  }
};

// 加载更多消息
const loadMoreMessages = async () => {
  if (isLoadingMoreMessages.value || noMoreMessages.value || !currentSessionId.value) return;
  try {
    isLoadingMoreMessages.value = true;
    messageCurrent.value++;
    const res = await getMessageList({
      sessionId: currentSessionId.value,
      current: messageCurrent.value
    });
    if (res.success || res.code === 200) {
      const messageList = Array.isArray(res.data) ? res.data : (res.data.list || res.data.records || []);
      if (messageList.length === 0) {
        noMoreMessages.value = true;
      } else {
        // 记录当前的滚动高度，用于加载后保持位置
        const scrollContainer = scrollRef.value;
        const oldScrollHeight = scrollContainer ? scrollContainer.scrollHeight : 0;

        // 旧消息插入到前面
        const oldMessages = messageList.map(msg => {
          const role = msg.role === 'USER' || msg.role === 'user' ? 'user' : 'ai';
          const parsed = role === 'ai' ? parseMessageContent(msg.content) : { displayContent: msg.content, shopList: [] };

          return {
            role,
            content: msg.content,
            displayContent: parsed.displayContent,
            shopList: parsed.shopList
          };
        });
        messages.value = [...oldMessages, ...messages.value];

        // 保持滚动位置
        nextTick(() => {
          if (scrollContainer) {
            const newScrollHeight = scrollContainer.scrollHeight;
            scrollContainer.scrollTop = newScrollHeight - oldScrollHeight;
          }
        });

        if (messageList.length < 10) {
          noMoreMessages.value = true;
        }
      }
    }
  } catch (error) {
    console.error('加载更多消息失败:', error);
    messageCurrent.value--;
  } finally {
    isLoadingMoreMessages.value = false;
  }
};

// 删除历史会话
const deleteHistory = async (id) => {
  try {
    await showConfirmDialog({
      title: '提示',
      message: '确定要删除这个会话吗？',
      confirmButtonColor: '#ef4444', // 使用红色强调删除操作
    });

    const res = await deleteSessionAPI(id);
    if (res.code === 200 || res.success) {
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
    if (bottomRef.value) {
      bottomRef.value.scrollIntoView({ behavior: 'smooth' });
    } else if (scrollRef.value) {
      scrollRef.value.scrollTop = scrollRef.value.scrollHeight;
    }
  });
};

// 获取店铺图片
const getShopImage = (shop) => {
  if (shop.images) {
    return shop.images.startsWith('http') ? shop.images : fileURL + shop.images;
  }
  if (shop.image) {
    return shop.image.startsWith('http') ? shop.image : fileURL + shop.image;
  }
  return 'https://img.alicdn.com/imgextra/i1/O1CN01fplaceholder.png_400x400.jpg';
};

const onImgError = (e) => {
  e.target.src = 'https://img.alicdn.com/imgextra/i1/O1CN01fplaceholder.png_400x400.jpg';
};

// 跳转到店铺详情
const goToShopDetail = (shop) => {
  router.push({
    path: '/shop/detail',
    query: { id: shop.id }
  });
};

// 导航到店铺
const goToMap = (shop) => {
  if (shop.x && shop.y) {
    const center = `${shop.x},${shop.y}`;
    router.push({
      path: '/map',
      query: {
        center,
        shopId: shop.id
      }
    });
  } else {
    ElMessage.warning('暂无位置信息');
  }
};

// 收藏店铺
const doCollect = (shop) => {
  ElMessage.info('收藏功能开发中');
  console.log('收藏店铺:', shop.id);
};


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

// 当消息数量从 0 变为有数据时，再次绑定哨兵，确保上滑能触发
watch(
  () => messages.value.length,
  (len) => {
    if (len > 0) {
      // no-op for manual load mode
    }
  }
);

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange);
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
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
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
  gap: 8px;
}
.header-logo-icon {
  font-size: 20px;
  color: #374151;
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
  color: #374151;
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
  overflow: hidden;
  padding: 16px;
  display: flex;
  flex-direction: column;
}
.new-chat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 20px;
}
.new-chat-card:hover {
  background: #f3f4f6;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
.new-chat-card i {
  font-size: 20px;
  color: #374151;
}
.new-chat-card span {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
}
.chat-list-title {
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 12px;
  padding: 0 4px;
}
.chat-list {
  flex: 1;
  overflow-y: auto;
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
  padding-top: 90px;
  padding-bottom: 120px;
  /* 移除全局平滑滚动，由 JS 控制特定场景的动画，避免影响历史记录加载的位置恢复 */
}

.empty-state {
  margin-top: 40px;
  text-align: center;
  color: #333;
  padding: 0 20px;
}
.welcome-visual {
  margin-bottom: 24px;
}
/* 吉祥物包装器 */
.mascot-wrapper {
  position: relative;
  display: inline-block;
  width: 140px;
  height: 160px;
}
/* 光晕背景效果 */
.mascot-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(156, 163, 175, 0.3) 0%, rgba(107, 114, 128, 0.15) 50%, transparent 70%);
  animation: glow-pulse 3s ease-in-out infinite;
}
@keyframes glow-pulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; }
  50% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
}
/* 吉祥物卡片 */
.mascot-card {
  position: relative;
  z-index: 2;
  width: 100px;
  height: 120px;
  margin: 20px auto 0;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 3px solid rgba(156, 163, 175, 0.3);
}
.mascot-img {
  width: 90%;
  height: 90%;
  object-fit: cover;
  border-radius: 8px;
}
/* Hi 气泡 */
.hi-bubble {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 3;
  background: #374151;
  color: #fff;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  animation: bubble-bounce 2s ease-in-out infinite;
}
@keyframes bubble-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}
/* 欢迎标题 */
.welcome-title {
  font-size: 26px;
  font-weight: 700;
  margin: 20px 0 16px;
  color: #1f2937;
}
/* 欢迎描述 */
.welcome-desc {
  font-size: 14px;
  color: #6b7280;
  max-width: 380px;
  margin: 0 auto 16px;
  line-height: 1.8;
}
/* 心形图标 */
.heart-icon {
  font-size: 18px;
  margin-bottom: 32px;
}
/* 建议区域 */
.suggestion-area {
  max-width: 500px;
  margin: 0 auto;
  text-align: left;
}
.s-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 0 4px;
}
.s-header-text {
  font-size: 14px;
  color: #6b7280;
}
.refresh-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  color: #6b7280;
  font-size: 14px;
  transition: all 0.2s;
}
.refresh-btn:hover {
  color: #374151;
}
.refresh-btn i {
  transition: transform 0.3s;
}
.refresh-btn:hover i {
  transform: rotate(180deg);
}
/* 建议卡片列表 */
.suggestion-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.suggestion-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: #fff;
  border: 1px solid #e8e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.02);
}
.suggestion-card:hover {
  border-color: #9ca3af;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}
.card-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.card-icon i {
  font-size: 18px;
  color: #6b7280;
}
.card-text {
  font-size: 15px;
  color: #333;
  flex: 1;
}

.message-list {
  max-width: 800px;
  width: 100%;
  margin: 0 auto;
}

.load-more-manual {
  text-align: center;
  margin-bottom: 12px;
}
.load-more-btn {
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
  transition: all 0.2s;
}
.load-more-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
.load-more-btn:not(:disabled):hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.top-sentinel {
  height: 1px;
  width: 100%;
}

.loading-more-messages,
.no-more-messages {
  text-align: center;
  padding: 12px 0;
  color: #9ca3af;
  font-size: 13px;
}
.loading-more-messages i {
  margin-right: 6px;
}

.loading-more,
.no-more {
  text-align: center;
  padding: 12px 0;
  color: #9ca3af;
  font-size: 13px;
}
.loading-more i {
  margin-right: 6px;
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
  background: #374151;
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
  padding: 14px 18px;
  border-radius: 18px;
  font-size: var(--ai-font-size, 15px);
  line-height: 1.7;
  max-width: 600px;
  position: relative;
  word-wrap: break-word;
}
.message-row.ai .message-bubble {
  background: #fff;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  border-top-left-radius: 4px;
  color: #333;
  border: 1px solid #e5e7eb;
}
.message-row.user .message-bubble {
  background: #1f2937;
  color: #fff;
  border-top-right-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

/* 思考中动画样式 */
.thinking-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}
.thinking-text {
  color: #6b7280;
  font-size: 14px;
}
.thinking-dots {
  display: flex;
  gap: 4px;
}
.thinking-dots .dot {
  width: 6px;
  height: 6px;
  background: #6b7280;
  border-radius: 50%;
  animation: thinking-bounce 1.4s infinite ease-in-out both;
}
.thinking-dots .dot:nth-child(1) {
  animation-delay: -0.32s;
}
.thinking-dots .dot:nth-child(2) {
  animation-delay: -0.16s;
}
.thinking-dots .dot:nth-child(3) {
  animation-delay: 0s;
}
@keyframes thinking-bounce {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 状态加载提示 */
.status-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6b7280;
  font-size: 14px;
  font-style: italic;
}
.status-loading i {
  animation: rotate 1s linear infinite;
}

/* 店铺卡片列表 */
.shop-card-list {
  display: flex;
  flex-direction: row;
  gap: 12px;
  margin-top: 12px;
  padding: 6px 4px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
}
.shop-card-list.carousel::-webkit-scrollbar {
  height: 6px;
}
.shop-card-list.carousel::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 999px;
}
.shop-card {
  scroll-snap-align: start;
  min-width: 240px;
  max-width: 260px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 14px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.shop-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.1);
}

/* 图片 */
.shop-img-wrapper {
  position: relative;
  width: 100%;
  height: 140px;
  border-radius: 12px;
  overflow: hidden;
  background: linear-gradient(135deg, #eef2ff, #f5f7fb);
}
.shop-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.img-pill {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(255, 255, 255, 0.85);
  color: #ef4444;
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid rgba(239, 68, 68, 0.2);
}
.card-index-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(17, 24, 39, 0.75);
  color: #fff;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 11px;
  backdrop-filter: blur(4px);
}

/* 信息 */
.shop-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.shop-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.shop-name {
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}
.rate-box {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #f59e0b;
  font-weight: 700;
  background: #fff7ed;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 13px;
}
.rate-box i {
  font-size: 14px;
}
.shop-reason {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: #4b5563;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 8px 10px;
}
.shop-stat-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #6b7280;
}
.stat-divider {
  color: #d1d5db;
}
.price-per {
  color: #111827;
  font-weight: 600;
}
.distance-tag {
  margin-left: auto;
  background: #eef2ff;
  color: #4f46e5;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 11px;
}
.shop-loc-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #9ca3af;
}
.shop-area {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.shop-open-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #6b7280;
}
.shop-open-row i {
  font-size: 14px;
  color: #4b5563;
}
.shop-tags-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 11px;
  background: #fff1f2;
  color: #e11d48;
  border: 1px solid #fecdd3;
}
.ghost-btn {
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #374151;
  padding: 6px 10px;
  border-radius: 10px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}
.ghost-btn.primary {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  border: none;
  box-shadow: 0 6px 14px rgba(99, 102, 241, 0.25);
}
.ghost-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.08);
}
.shop-actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

/* 深色模式适配 */
.dark-theme .shop-card {
  background: #242424;
  border-color: #333;
}
.dark-theme .shop-name {
  color: #e5e7eb;
}
.dark-theme .price-per {
  color: #d1d5db;
}
.dark-theme .tag-item {
  background: rgba(255, 107, 107, 0.1);
  border-color: rgba(255, 107, 107, 0.2);
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
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 8px 12px;
  padding-bottom: calc(8px + env(safe-area-inset-bottom));
  box-shadow: 0 -2px 12px rgba(0,0,0,0.03);
  z-index: 100;
}
.input-container {
  max-width: 800px;
  margin: 0 auto;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 20px;
  padding: 6px 12px;
  transition: all 0.3s;
}
/* 移动端适配 */
@media (max-width: 768px) {
  .footer-input {
    padding: 6px 10px;
    padding-bottom: calc(6px + env(safe-area-inset-bottom));
  }
  .input-container {
    border-radius: 18px;
    padding: 4px 10px;
  }
}
.input-container:focus-within {
  border-color: #9ca3af;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(156, 163, 175, 0.1);
}

textarea {
  width: 100%;
  min-height: 20px;
  max-height: 60px;
  border: none;
  resize: none;
  outline: none;
  font-size: 14px;
  color: #333;
  line-height: 1.4;
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

/* 输入框工具栏 */
.input-toolbar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: 2px;
  padding-top: 0;
  border-top: none;
}
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.send-btn {
  width: 32px;
  height: 32px;
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
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
}
.send-btn:not(:disabled):hover {
  transform: scale(1.05);
}
.send-btn i { 
  font-size: 16px; 
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

