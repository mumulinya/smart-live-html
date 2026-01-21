<template>
  <transition name="dialog-fade">
    <div v-if="visible" class="dialog-mask" @click.self="handleCancel">
      <div class="dialog-card" :class="{ 'dialog-zoom': visible }">
        <!-- 标题 -->
        <div class="dialog-title">修改个人介绍</div>
        
        <!-- 输入区域 -->
        <div class="input-wrapper">
          <textarea
            ref="inputRef"
            v-model="inputValue" 
            class="introduce-input"
            rows="4"
            :placeholder="placeholder"
            maxlength="200"
            @focus="isFocused = true"
            @blur="isFocused = false"
          ></textarea>
          
          <div class="word-count">{{ (inputValue || '').length }} / 200</div>
          
          <!-- 底线装饰 (可选，或者给textarea加边框) -->
          <!-- 这里使用全包围边框风格适配多行文本 -->
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
  name: 'EditIntroduceDialog',
  props: {
    visible: { type: Boolean, default: false },
    value: { type: String, default: '' },
    placeholder: { type: String, default: '请输入个人介绍' }
  },
  emits: ['update:visible', 'confirm', 'cancel'],
  data() {
    return {
      inputValue: '',
      isFocused: false
    }
  },
  watch: {
    visible(val) {
      if (val) {
        this.inputValue = this.value;
        this.$nextTick(() => {
          this.$refs.inputRef?.focus();
        });
      }
    },
    value(val) {
      this.inputValue = val;
    }
  },
  methods: {
    handleConfirm() {
      // 个人介绍可以为空，这里不做非空校验，直接返回
      this.$emit('confirm', this.inputValue.trim());
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
  margin-bottom: 20px;
}

/* 输入区域 */
.input-wrapper {
  position: relative;
  margin-bottom: 28px;
  background: #f8f8f8;
  border-radius: 8px;
  padding: 10px;
  border: 1px solid transparent;
  transition: all 0.2s;
}
/* 聚焦时显示边框 */
.input-wrapper:focus-within {
  border-color: #ff2442;
  background: #fff;
}

.introduce-input {
  width: 100%;
  border: none;
  outline: none;
  font-size: 15px;
  color: #333;
  background: transparent;
  resize: none;
  line-height: 1.5;
  font-family: inherit;
}
.introduce-input::placeholder {
  color: #bbb;
}

.word-count {
  text-align: right;
  font-size: 12px;
  color: #ccc;
  margin-top: 4px;
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
