<template>
  <div v-if="!isOnAIPage">
      <!-- Normal Floating Mode -->
      <div 
        class="global-ai-entry" 
        v-if="!isMinimized" 
        :style="{ left: position.x + 'px', top: position.y + 'px', bottom: 'auto', right: 'auto' }"
        @mousedown="startDrag"
        @touchstart.prevent="startDrag"
      >
        <!-- Tooltip Bubble -->
        <div class="ai-bubble" v-if="showBubble">
           <span class="bubble-text">哈！我不仅会唱跳rap和篮球<br>还会为你解答</span>
           <div class="bubble-arrow"></div>
        </div>
        
        <!-- Floating Icon -->
        <div class="ai-icon-wrapper">
           <img src="@/assets/ai-avatar.jpg" class="ai-avatar-img" draggable="false" />
           <!-- Close Button -->
           <div class="ai-close">
             <el-icon><Close /></el-icon>
           </div>
        </div>
        <div class="ai-label">小只因</div>
      </div>

      <!-- Minimized/Docked Mode -->
      <div class="ai-docked" v-if="isMinimized" @click="restore">
          <img src="@/assets/ai-avatar.jpg" class="dock-avatar-img" draggable="false" />
          <div class="dock-text">AI</div>
      </div>
  </div>
</template>

<script setup>

import { ref, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Close } from '@element-plus/icons-vue';

const router = useRouter();
const route = useRoute();
const isMinimized = ref(false);
const showBubble = ref(true);

// 判断是否在AI页面
const isOnAIPage = computed(() => {
  return route.path === '/ai';
});

// 位置状态
const position = ref({ 
  x: window.innerWidth - 100, 
  y: window.innerHeight - 180 
});
const isDragging = ref(false);
const hasMoved = ref(false);

const goAI = () => {
    if (hasMoved.value) return;
    router.push('/ai');
};

const minimize = () => {
    isMinimized.value = true;
};

const restore = () => {
    if (hasMoved.value) return;
    isMinimized.value = false;
};

// 拖动功能
let startTarget = null;

const startDrag = (e) => {
  isDragging.value = true;
  hasMoved.value = false;
  startTarget = e.target;
  
  const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
  const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
  
  const startX = clientX - position.value.x;
  const startY = clientY - position.value.y;

  // To track total movement delta
  const initialClientX = clientX;
  const initialClientY = clientY;
  
  const handleMove = (moveEvent) => {
    if (!isDragging.value) return;
    
    const moveClientX = moveEvent.type === 'touchmove' ? moveEvent.touches[0].clientX : moveEvent.clientX;
    const moveClientY = moveEvent.type === 'touchmove' ? moveEvent.touches[0].clientY : moveEvent.clientY;
    
    // Check if moved significantly to treat as drag
    if (Math.abs(moveClientX - initialClientX) > 5 || Math.abs(moveClientY - initialClientY) > 5) {
        hasMoved.value = true;
    }

    let newX = moveClientX - startX;
    let newY = moveClientY - startY;
    
    // 限制在屏幕范围内
    const maxX = window.innerWidth - 80;
    const maxY = window.innerHeight - 100;
    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));
    
    position.value = { x: newX, y: newY };
  };
  
  const handleEnd = (endEvent) => {
    isDragging.value = false;
    document.removeEventListener('mousemove', handleMove);
    document.removeEventListener('mouseup', handleEnd);
    document.removeEventListener('touchmove', handleMove);
    document.removeEventListener('touchend', handleEnd);

    // Double check distance in case move event missed small movement
    const endClientX = endEvent.type === 'touchend' ? endEvent.changedTouches[0].clientX : endEvent.clientX;
    const endClientY = endEvent.type === 'touchend' ? endEvent.changedTouches[0].clientY : endEvent.clientY;
    
    if (Math.abs(endClientX - initialClientX) > 5 || Math.abs(endClientY - initialClientY) > 5) {
        hasMoved.value = true;
    }

    // Manual tap detection
    if (!hasMoved.value && startTarget) {
        // Check if we clicked the close button (or its children)
        if (startTarget.closest && startTarget.closest('.ai-close')) {
            minimize();
        } else {
            goAI();
        }
    }
    startTarget = null;
  };
  
  document.addEventListener('mousemove', handleMove);
  document.addEventListener('mouseup', handleEnd);
  document.addEventListener('touchmove', handleMove);
  document.addEventListener('touchend', handleEnd);
};
</script>

<style scoped>
/* Normal Floating Style */
.global-ai-entry {
  position: fixed;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: move;
  user-select: none;
  touch-action: none;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
}

.ai-bubble {
  background: linear-gradient(135deg, #a855f7, #3b82f6);
  color: white;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12px;
  text-align: center;
  margin-bottom: 8px;
  position: relative;
  box-shadow: 0 4px 10px rgba(0,0,0,0.2);
  white-space: nowrap;
}
.bubble-arrow {
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  width: 0; 
  height: 0; 
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid #3b82f6;
}

.ai-icon-wrapper {
  position: relative;
  width: 60px;
  height: 60px;
  background: transparent;
  border-radius: 50%;
  box-shadow: 0 4px 15px rgba(0,0,0,0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  overflow: hidden;
}
.ai-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  -webkit-user-drag: none;
}
.ai-close {
  position: absolute;
  top: 0;
  right: 0;
  width: 20px;
  height: 20px;
  background: rgba(0,0,0,0.6);
  color: #fff;
  border-radius: 50%;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
  z-index: 10;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}
.ai-close:hover {
  background: #f56c6c;
  transform: scale(1.1);
}

.ai-label {
  margin-top: 4px;
  font-size: 12px;
  color: #666;
  font-weight: bold;
  text-shadow: 0 1px 2px rgba(255,255,255,0.8);
  background: rgba(255,255,255,0.8);
  padding: 2px 4px;
  border-radius: 4px;
}

/* Docked Style */
.ai-docked {
  position: fixed;
  bottom: 120px;
  right: 0;
  z-index: 9999;
  background: linear-gradient(135deg, #a855f7, #3b82f6);
  color: white;
  padding: 8px 4px 8px 8px;
  border-top-left-radius: 20px;
  border-bottom-left-radius: 20px;
  cursor: pointer;
  box-shadow: -2px 2px 10px rgba(0,0,0,0.2);
  display: flex;
  align-items: center;
  gap: 4px;
  transition: transform 0.2s;
}
.ai-docked:hover {
  transform: translateX(-5px);
}
.dock-avatar-img {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
  border: none; 
  display: block;
}
.dock-text { font-size: 12px; font-weight: bold; writing-mode: vertical-rl; text-orientation: upright; display: none; }
</style>
