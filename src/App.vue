<script setup>
import GlobalAIEntry from '@/components/GlobalAIEntry.vue';
</script>

<template>
  <router-view v-slot="{ Component }">
    <keep-alive>
      <component :is="Component" v-if="$route.meta.keepAlive" />
    </keep-alive>
    <component :is="Component" v-if="!$route.meta.keepAlive" />
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
