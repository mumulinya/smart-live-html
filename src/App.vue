<script setup>
import { computed, defineAsyncComponent, onMounted, onUnmounted, ref } from 'vue';
import router from '@/router';
import { wsManager } from '@/utils/websocket';
import { chatStore } from '@/store/chat';
import { getCurrentUser } from '@/api/user';
import { getUserSessions } from '@/api/chat';
import { AUTH_CHANGED_EVENT } from '@/utils/auth-event';
import { getSystemNoticeUnreadCount, resolveSystemNoticeUnreadCount } from '@/api/systemNotice';
import { addSystemNotice, getSystemUnreadCount } from '@/utils/systemNotice';

let currentUserId = null;
const keepAliveVersion = ref(0);
const GlobalAIEntry = defineAsyncComponent(() => import('@/components/GlobalAIEntry.vue'));
const showAIEntry = computed(() => {
    const path = router.currentRoute.value?.path;
    return path === '/' || path === '/home';
});

try {
    const cachedUser = localStorage.getItem('userInfo');
    if (cachedUser) {
        currentUserId = JSON.parse(cachedUser)?.id ?? null;
    }
} catch (e) {
    console.error('Failed to parse cached user info', e);
}

onMounted(() => {
  // Register once so it can work even when token is written after App mounted.
  wsManager.registerCallback('global-app-listener', handleGlobalMessage);
  window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);

  const token = localStorage.getItem('token');
  if (token) {
    wsManager.init(token);
    initUnreadCount();
  }
});

onUnmounted(() => {
    wsManager.unregisterCallback('global-app-listener');
    window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
});

const initUnreadCount = async () => {
    try {
        const userRes = await getCurrentUser();
        const userId = userRes.data?.id || userRes.id;
        if (userId) {
            currentUserId = userId;
            const res = await getUserSessions({ userId: userId, current: 1, size: 100 });
            const list = res.data || [];
            const total = list.reduce((sum, s) => sum + (s.unread || 0), 0);
            chatStore.setUnread(total);
        }
        await initSystemUnreadCount();
    } catch (e) {
        console.error('Failed to init unread count', e);
    }
};

const initSystemUnreadCount = async () => {
    let unread = null;
    try {
        const res = await getSystemNoticeUnreadCount();
        unread = resolveSystemNoticeUnreadCount(res);
    } catch (error) {
        // Fallback to local cache when unread-count API is unavailable.
    }
    chatStore.setSystemUnread(unread ?? getSystemUnreadCount());
};

const isSameId = (a, b) => {
    if (a === null || a === undefined || b === null || b === undefined) return false;
    return String(a) === String(b);
};

const isCurrentSessionOpen = (sessionId) => {
    const route = router.currentRoute.value;
    if (!route) return false;
    if (route.path !== '/chat/detail') return false;
    return isSameId(route.query?.sessionId, sessionId);
};

const isSystemNoticeOpen = () => {
    const route = router.currentRoute.value;
    if (!route) return false;
    return route.path === '/chat/system';
};

const handleGlobalMessage = (message) => {
    if (!message?.type || !message?.data) return;

    if (message.type === 'NEW_MESSAGE') {
        const fromUid = message.data.fromUid ?? message.data.fromUserId;
        if (isSameId(fromUid, currentUserId)) return;
        if (isCurrentSessionOpen(message.data.sessionId)) return;

        chatStore.incrementUnread(1);
        return;
    }

    if (message.type === 'SYSTEM_MESSAGE') {
        addSystemNotice(message.data, { defaultRead: isSystemNoticeOpen() });
        chatStore.setSystemUnread(getSystemUnreadCount());
    }
};

const clearPageSessionCache = () => {
    if (typeof window === 'undefined') return;
    try {
        sessionStorage.clear();
    } catch (e) {
        console.error('Failed to clear session storage cache', e);
    }
};

const handleAuthChanged = (event) => {
    keepAliveVersion.value += 1;
    if (event?.detail?.action === 'logout') {
        currentUserId = null;
        chatStore.setUnread(0);
        chatStore.setSystemUnread(0);
    } else if (event?.detail?.action === 'login') {
        clearPageSessionCache();
        initSystemUnreadCount();
    }
};
</script>

<template>
  <router-view v-slot="{ Component }">
    <keep-alive :key="keepAliveVersion" include="OrderList,MyStar,MyFollow,MyInteractions,Drafts,ListPage,MyReviews,UserInfo,HomeIndex,SearchIndex,UserSearch,ShopList">
      <component :is="Component" />
    </keep-alive>
  </router-view>
  <GlobalAIEntry v-if="showAIEntry" />
</template>

<style>
/* Global styles can be placed here or in assets/css */
body {
  margin: 0;
  padding: 0;
  background-color: #f5f5f5;
}
</style>
