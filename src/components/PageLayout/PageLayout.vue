<template>
  <div class="page-layout">
    <!-- 统一加载遮罩屏 -->
    <transition name="van-fade">
      <div v-if="loading" class="global-loading-overlay">
        <div class="loading-content-box">
          <van-loading type="spinner" color="#ff2442" size="36px" />
          <div class="loading-text">加载中...</div>
        </div>
      </div>
    </transition>

    <!-- 真实内容 -->
    <div class="real-content fade-in">
      <slot></slot>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PageLayout',
  props: {
    // 控制是否显示全局加载效果
    loading: {
      type: Boolean,
      required: true
    },
    // (保留兼容属性骨架屏类型，但不再使用内置复杂设计，统一用精致Loading动画代替)
    skeletonType: {
      type: String,
      default: 'general'
    }
  }
}
</script>

<style scoped>
.page-layout {
  min-height: 100vh;
  background: #f5f5f5;
  position: relative;
}

/* ============ 统一全局加载特效 ============ */
.global-loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  /* 轻微灰底毛玻璃效果 */
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-content-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  padding: 24px 32px;
  border-radius: 16px;
  /* 增加品牌化微弹跳动画增强动效质感 */
  animation: boxPopUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
}

@keyframes boxPopUp {
  0% { transform: scale(0.85); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.loading-text {
  margin-top: 12px;
  font-size: 14px;
  color: #666;
  font-weight: 500;
  letter-spacing: 1px;
}

/* ============ 真实内容淡入动画 ============ */
.fade-in {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
