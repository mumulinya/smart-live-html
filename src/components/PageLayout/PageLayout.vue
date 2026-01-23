<template>
  <div class="page-layout">
    <!-- 骨架屏状态 -->
    <div v-if="loading" class="skeleton-wrapper">
      <slot name="skeleton">
        <!-- 默认骨架屏，根据 skeletonType 显示不同样式 -->
        <div class="default-skeleton" :class="skeletonType">
          <!-- List 类型骨架 -->
          <template v-if="skeletonType === 'list'">
            <div class="sk-list-item" v-for="i in 5" :key="i">
              <div class="sk-avatar animate-pulse"></div>
              <div class="sk-content">
                <div class="sk-row width-60 animate-pulse"></div>
                <div class="sk-row width-100 animate-pulse"></div>
                <div class="sk-row width-40 animate-pulse"></div>
              </div>
            </div>
          </template>

          <!-- Profile 类型骨架 -->
          <template v-else-if="skeletonType === 'profile'">
            <div class="sk-profile">
              <div class="sk-cover animate-pulse"></div>
              <div class="sk-profile-header">
                <div class="sk-avatar-large animate-pulse"></div>
                <div class="sk-stats">
                  <div class="sk-stat animate-pulse" v-for="i in 3" :key="i"></div>
                </div>
              </div>
              <div class="sk-info">
                <div class="sk-row width-40 animate-pulse"></div>
                <div class="sk-row width-60 animate-pulse"></div>
              </div>
              <div class="sk-tabs animate-pulse"></div>
              <div class="sk-grid">
                <div class="sk-grid-item animate-pulse" v-for="i in 6" :key="i"></div>
              </div>
            </div>
          </template>

          <!-- Detail 类型骨架 -->
          <template v-else-if="skeletonType === 'detail'">
            <div class="sk-detail">
              <div class="sk-detail-header">
                <div class="sk-avatar animate-pulse"></div>
                <div class="sk-row width-30 animate-pulse"></div>
              </div>
              <div class="sk-image animate-pulse"></div>
              <div class="sk-content-block">
                <div class="sk-row width-80 animate-pulse"></div>
                <div class="sk-row width-100 animate-pulse"></div>
                <div class="sk-row width-60 animate-pulse"></div>
              </div>
            </div>
          </template>

          <!-- 默认通用骨架 -->
          <template v-else>
            <div class="sk-general">
              <div class="sk-row width-50 animate-pulse"></div>
              <div class="sk-row width-100 animate-pulse"></div>
              <div class="sk-row width-80 animate-pulse"></div>
              <div class="sk-row width-60 animate-pulse"></div>
            </div>
          </template>
        </div>
      </slot>
    </div>

    <!-- 真实内容 -->
    <div v-else class="real-content fade-in">
      <slot></slot>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PageLayout',
  props: {
    // 控制是否显示骨架屏
    loading: {
      type: Boolean,
      required: true
    },
    // 骨架屏类型: 'list' | 'profile' | 'detail' | 'general'
    skeletonType: {
      type: String,
      default: 'general',
      validator: (value) => ['list', 'profile', 'detail', 'general'].includes(value)
    }
  }
}
</script>

<style scoped>
.page-layout {
  min-height: 100vh;
  background: #f5f5f5;
}

.skeleton-wrapper {
  padding: 15px;
}

/* ============ 骨架屏动画 ============ */
.animate-pulse {
  background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ============ 淡入动画 ============ */
.fade-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* ============ 通用骨架元素 ============ */
.sk-row {
  height: 14px;
  border-radius: 4px;
  margin-bottom: 12px;
}
.width-30 { width: 30%; }
.width-40 { width: 40%; }
.width-50 { width: 50%; }
.width-60 { width: 60%; }
.width-80 { width: 80%; }
.width-100 { width: 100%; }

.sk-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  flex-shrink: 0;
}

.sk-avatar-large {
  width: 80px;
  height: 80px;
  border-radius: 50%;
}

/* ============ List 类型骨架 ============ */
.sk-list-item {
  display: flex;
  gap: 12px;
  padding: 15px;
  background: white;
  border-radius: 12px;
  margin-bottom: 12px;
}

.sk-content {
  flex: 1;
}

/* ============ Profile 类型骨架 ============ */
.sk-profile .sk-cover {
  width: 100%;
  height: 180px;
  border-radius: 0;
}

.sk-profile .sk-profile-header {
  display: flex;
  align-items: flex-end;
  padding: 0 20px;
  margin-top: -40px;
  gap: 20px;
}

.sk-profile .sk-stats {
  display: flex;
  gap: 20px;
  flex: 1;
  justify-content: flex-end;
}

.sk-profile .sk-stat {
  width: 50px;
  height: 40px;
  border-radius: 8px;
}

.sk-profile .sk-info {
  padding: 20px;
  background: white;
  margin-top: 15px;
  border-radius: 12px;
}

.sk-profile .sk-tabs {
  height: 44px;
  margin-top: 15px;
  border-radius: 8px;
}

.sk-profile .sk-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-top: 15px;
}

.sk-profile .sk-grid-item {
  aspect-ratio: 1;
  border-radius: 8px;
}

/* ============ Detail 类型骨架 ============ */
.sk-detail {
  background: white;
}

.sk-detail .sk-detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px;
  background: white;
}

.sk-detail .sk-image {
  width: 100%;
  height: 350px;
}

.sk-detail .sk-content-block {
  padding: 20px;
}

/* ============ General 类型骨架 ============ */
.sk-general {
  background: white;
  padding: 20px;
  border-radius: 12px;
}
</style>
