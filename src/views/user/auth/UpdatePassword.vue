<template>
  <div class="update-password-page">
    <div class="header">
      <div class="header-back-btn" @click="goBack"><i class="el-icon-arrow-left"></i></div>
      <div class="header-title">修改密码</div>
    </div>

    <div class="form-container">
      <div class="form-box">
        <div class="form-item">
          <div class="form-label">旧密码</div>
          <div class="form-input-wrapper">
            <input 
              v-model="form.oldPassword" 
              :type="showOldPassword ? 'text' : 'password'" 
              class="form-input" 
              placeholder="请输入旧密码"
              @focus="focusOld = true"
              @blur="focusOld = false"
            >
            <i 
              v-show="focusOld || form.oldPassword"
              :class="showOldPassword ? 'el-icon-view' : 'el-icon-hide'" 
              class="toggle-password-icon"
              @mousedown.prevent="showOldPassword = !showOldPassword"
            ></i>
          </div>
        </div>
        <div class="divider"></div>
        <div class="form-item">
          <div class="form-label">新密码</div>
          <div class="form-input-wrapper">
            <input 
              v-model="form.newPassword" 
              :type="showNewPassword ? 'text' : 'password'" 
              class="form-input" 
              placeholder="请输入新密码，6-20位"
              maxlength="20"
              @focus="focusNew = true"
              @blur="focusNew = false"
            >
            <i 
              v-show="focusNew || form.newPassword"
              :class="showNewPassword ? 'el-icon-view' : 'el-icon-hide'" 
              class="toggle-password-icon"
              @mousedown.prevent="showNewPassword = !showNewPassword"
            ></i>
          </div>
        </div>
        <div class="divider"></div>
        <div class="form-item">
          <div class="form-label">确认密码</div>
          <div class="form-input-wrapper">
            <input 
              v-model="form.confirmPassword" 
              :type="showConfirmPassword ? 'text' : 'password'" 
              class="form-input" 
              placeholder="请再次确认新密码"
              maxlength="20"
              @focus="focusConfirm = true"
              @blur="focusConfirm = false"
            >
            <i 
              v-show="focusConfirm || form.confirmPassword"
              :class="showConfirmPassword ? 'el-icon-view' : 'el-icon-hide'" 
              class="toggle-password-icon"
              @mousedown.prevent="showConfirmPassword = !showConfirmPassword"
            ></i>
          </div>
        </div>
      </div>

      <div class="tips">
        <p>• 密码长度为6-20位</p>
        <p>• 建议使用字母、数字组合</p>
      </div>
    </div>

    <div class="submit-btn-container">
      <el-button type="primary" class="submit-btn" round :loading="loading" @click="handleSubmit">
        确认修改
      </el-button>
    </div>
  </div>
</template>

<script>
import { updatePassword } from '@/api/user';

export default {
  name: 'UpdatePassword',
  data() {
    return {
      loading: false,
      showOldPassword: false,
      showNewPassword: false,
      showConfirmPassword: false,
      focusOld: false,
      focusNew: false,
      focusConfirm: false,
      form: {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      }
    }
  },
  methods: {
    goBack() {
      this.$router.go(-1);
    },
    validate() {
      if (!this.form.oldPassword) {
        this.$message.warning('请输入旧密码');
        return false;
      }
      if (!this.form.newPassword) {
        this.$message.warning('请输入新密码');
        return false;
      }
      if (this.form.newPassword.length < 6 || this.form.newPassword.length > 20) {
        this.$message.warning('新密码长度需在6-20位之间');
        return false;
      }
      if (!this.form.confirmPassword) {
        this.$message.warning('请确认新密码');
        return false;
      }
      if (this.form.newPassword !== this.form.confirmPassword) {
        this.$message.warning('两次输入的密码不一致');
        return false;
      }
      return true;
    },
    async handleSubmit() {
      if (!this.validate()) return;

      this.loading = true;
      try {
        await updatePassword({
          oldPassword: this.form.oldPassword,
          newPassword: this.form.newPassword
        });
        this.$message({
          type: 'success',
          message: '密码修改成功',
          duration: 1000,
          onClose: () => {
            this.goBack();
          }
        });
      } catch (err) {
        // err 可能是字符串(来自 request 拦截器)或 Error 对象
        const msg = typeof err === 'string' ? err : (err.response?.data?.errorMsg || err.response?.data?.message || err.message || '修改失败');
        this.$message.error(msg);
      } finally {
        this.loading = false;
      }
    }
  }
}
</script>

<style scoped>
.update-password-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-top: 50px;
  padding-bottom: 100px;
}

.header {
  height: 50px;
  background: white;
  display: flex;
  align-items: center;
  padding: 0 15px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 99;
  padding-top: env(safe-area-inset-top);
  height: calc(50px + env(safe-area-inset-top));
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
}
.header-back-btn {
  cursor: pointer;
  padding: 10px;
  margin-left: -10px;
}
.header-title {
  flex: 1;
  text-align: center;
  font-weight: bold;
  font-size: 16px;
  margin-right: 24px;
}

.form-container {
  padding: 15px;
}

.form-box {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.02);
}

.form-item {
  display: flex;
  align-items: center;
  padding: 16px 15px;
}

.form-label {
  width: 80px;
  font-size: 15px;
  font-weight: 500;
  color: #333;
  flex-shrink: 0;
}

.form-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 15px;
  color: #333;
  background: transparent;
}
.form-input::placeholder {
  color: #ccc;
}

.form-input-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
}
.toggle-password-icon {
  font-size: 18px;
  color: #999;
  cursor: pointer;
  padding: 5px;
  margin-left: 8px;
}
.toggle-password-icon:active {
  color: #666;
}

.divider {
  height: 1px;
  background: #f5f5f5;
  margin: 0 15px;
}

.tips {
  margin-top: 15px;
  padding: 0 5px;
}
.tips p {
  font-size: 12px;
  color: #999;
  margin: 4px 0;
}

.submit-btn-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 15px 30px;
  background: white;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
  z-index: 100;
  padding-bottom: calc(15px + env(safe-area-inset-bottom));
}

.submit-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  font-weight: bold;
  background: #ff2442;
  border-color: #ff2442;
}
</style>
