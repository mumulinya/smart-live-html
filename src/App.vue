<script setup>
import GlobalAIEntry from '@/components/GlobalAIEntry.vue';
</script>

<template>
  <router-view v-slot="{ Component }">
    <keep-alive include="OrderList,MyStar,MyFollow,Drafts,ListPage,MyReviews,UserInfo,HomeIndex,SearchIndex,UserSearch,ShopList,ChatDetail">
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
