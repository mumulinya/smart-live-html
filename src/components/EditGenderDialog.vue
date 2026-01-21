<template>
  <transition name="dialog-fade">
    <div v-if="visible" class="dialog-mask" @click.self="handleCancel">
      <div class="dialog-card" :class="{ 'dialog-zoom': visible }">
        <!-- 标题 -->
        <div class="dialog-title">选择性别</div>
        
        <!-- 性别选择区域 -->
        <div class="gender-selection">
          <div 
            class="gender-option male" 
            :class="{ active: selectedGender === 0 }"
            @click="selectedGender = 0"
          >
            <i class="el-icon-male gender-icon"></i>
            <span class="gender-label">男</span>
          </div>
          
          <div 
            class="gender-option female" 
            :class="{ active: selectedGender === 1 }"
            @click="selectedGender = 1"
          >
            <i class="el-icon-female gender-icon"></i>
            <span class="gender-label">女</span>
          </div>
        </div>

        <!-- 按钮组 -->
        <div class="btn-group">
          <button class="btn btn-cancel" @click="handleCancel">取消</button>
          <button class="btn btn-confirm" @click="handleConfirm">确定</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'EditGenderDialog',
  props: {
    visible: { type: Boolean, default: false },
    value: { type: Number, default: 0 } // 0: 男, 1: 女
  },
  emits: ['update:visible', 'confirm', 'cancel'],
  data() {
    return {
      selectedGender: 0
    }
  },
  watch: {
    visible(val) {
      if (val) {
        this.selectedGender = this.value;
      }
    },
    value(val) {
      this.selectedGender = val;
    }
  },
  methods: {
    handleConfirm() {
      this.$emit('confirm', this.selectedGender);
    },
    handleCancel() {
      this.$emit('update:visible', false);
      this.$emit('cancel');
    }
  }
}
</script>

<style scoped>
/* 遮罩层 - Flex 完美居中 */
.dialog-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 弹窗卡片 */
.dialog-card {
  width: 80%;
  max-width: 320px;
  background: #fff;
  border-radius: 16px;
  padding: 24px 20px 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

/* 入场动画 - Zoom In */
.dialog-zoom {
  animation: zoomIn 0.25s ease-out;
}
@keyframes zoomIn {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 淡入淡出过渡 */
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.2s ease;
}
.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

/* 标题 */
.dialog-title {
  text-align: center;
  font-size: 18px;
  font-weight: 600;
  color: #222;
  margin-bottom: 24px;
}

/* 性别选择区域 */
.gender-selection {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 28px;
}

.gender-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 100px;
  border-radius: 12px;
  border: 1px solid #e8e8e8;
  cursor: pointer;
  transition: all 0.2s;
  background: #fafafa;
}

.gender-icon {
  font-size: 32px;
  margin-bottom: 8px;
  color: #ccc;
  transition: color 0.2s;
}

.gender-label {
  font-size: 16px;
  color: #666;
  transition: color 0.2s;
}

/* 选中状态 */
.gender-option.male.active {
  border-color: #409EFF;
  background: rgba(64, 158, 255, 0.05);
}
.gender-option.male.active .gender-icon,
.gender-option.male.active .gender-label {
  color: #409EFF;
}

.gender-option.female.active {
  border-color: #ff2442;
  background: rgba(255, 36, 66, 0.05);
}
.gender-option.female.active .gender-icon,
.gender-option.female.active .gender-label {
  color: #ff2442;
}


/* 按钮组 */
.btn-group {
  display: flex;
  gap: 12px;
}
.btn {
  flex: 1;
  height: 46px;
  border-radius: 23px;
  font-size: 16px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}
.btn:active {
  transform: scale(0.97);
}
.btn-cancel {
  background: #f5f5f5;
  color: #666;
}
.btn-cancel:hover {
  background: #ebebeb;
}
.btn-confirm {
  background: linear-gradient(135deg, #ff2442 0%, #ff6b6b 100%);
  color: #fff;
  box-shadow: 0 4px 12px rgba(255, 36, 66, 0.35);
}
.btn-confirm:hover {
  box-shadow: 0 6px 16px rgba(255, 36, 66, 0.45);
}
</style>
