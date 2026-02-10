<script setup>
import GlobalAIEntry from '@/components/GlobalAIEntry.vue';
import { onMounted, onUnmounted } from 'vue';
import { wsManager } from '@/utils/websocket';
import { chatStore } from '@/store/chat';
import { getCurrentUser } from '@/api/user';
import { getUserSessions } from '@/api/chat';

onMounted(() => {
  const token = localStorage.getItem('token');
  if (token) {
    // 1. Init WebSocket
    wsManager.init(token);

    // 2. Init Unread Count
    initUnreadCount();

    // 3. Register Global Message Listener
    wsManager.registerCallback('global-app-listener', handleGlobalMessage);
  }
});

onUnmounted(() => {
    wsManager.unregisterCallback('global-app-listener');
});

const initUnreadCount = async () => {
    try {
        const userRes = await getCurrentUser();
        const userId = userRes.data?.id || userRes.id;
        if (userId) {
            const res = await getUserSessions({ userId: userId, current: 1, size: 100 });
            const list = res.data || [];
            // Calculate total unread
            const total = list.reduce((sum, s) => sum + (s.unread || 0), 0);
            chatStore.setUnread(total);
        }
    } catch (e) {
        console.error('Failed to init unread count', e);
    }
};

const handleGlobalMessage = (message) => {
    if (message.type === 'NEW_MESSAGE') {
        // Increment global unread count
        // Note: You might want to check if the message is from self, but usually NEW_MESSAGE is incoming.
        // Also check if we are currently in the chat detail of this sender (optional, but good for UX)
        // For simplicity, just increment. ChatDetail will mark it as read when viewed.
        chatStore.incrementUnread(1);
    }
};
</script>

<template>
  <router-view v-slot="{ Component }">
    <keep-alive include="OrderList,MyStar,MyFollow,Drafts,ListPage,MyReviews,UserInfo,HomeIndex,SearchIndex,UserSearch,ShopList">
      <component :is="Component" />
    </keep-alive>
  </router-view>
  <GlobalAIEntry />
</template>

<style>
/* Global styles can be placed here or in assets/css */
body {
  margin: 0;
  padding: 0;
  background-color: #f5f5f5;
}
</style>
