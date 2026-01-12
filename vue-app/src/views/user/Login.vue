<template>
  <div class="login-container">
    <div class="header">
      <div class="header-back-btn" @click="goBack"><i class="el-icon-arrow-left"></i></div>
      <div class="header-title">手机号码快捷登录</div>
    </div>
    
    <div class="content">
      <div class="login-form">
        <!-- Phone Input -->
        <div class="input-group">
          <div class="custom-input-box">
             <input type="tel" v-model="form.phone" placeholder="请输入手机号" maxlength="11" />
          </div>
          <button class="code-btn" :class="{ disabled: disabled }" @click="sendCode" :disabled="disabled">
            {{ codeBtnMsg }}
          </button>
        </div>

        <!-- Code Input -->
        <div class="input-group">
          <div class="custom-input-box full-width">
             <input type="text" v-model="form.code" placeholder="请输入验证码" maxlength="6" />
          </div>
        </div>

        <div class="tips">未注册的手机号码验证后自动创建账户</div>
        
        <button class="login-btn" @click="login">登录</button>
        
        <div class="password-login-link">
           <span @click="toPasswordLogin">密码登录</span>
        </div>
      </div>

      <div class="login-radio">
        <label class="radio-label">
          <input type="radio" v-model="radio" value="1">
          <span class="radio-text">
            我已阅读并同意
            <a href="javascript:void(0)">《智评生活用户服务协议》</a>、
            <a href="javascript:void(0)">《隐私政策》</a>
            等，接受免除或者限制责任、诉讼管辖约定等粗体标示条款
          </span>
        </label>
      </div>
    </div>
  </div>
</template>

<script>
import { login, sendCode } from '@/api/user';

export default {
  name: 'UserLogin',
  data() {
    return {
      radio: "",
      disabled: false,
      codeBtnMsg: "发送验证码",
      form:{
        phone: '',
        code: ''
      }
    }
  },
  methods: {
    login(){
      if(!this.radio){
        this.$message.warning("请先勾选同意用户协议");
        return
      }
      if(!this.form.phone || !this.form.code){
        this.$message.warning("手机号和验证码不能为空");
        return
      }
      
       login(this.form)
         .then((data) => {
          if(data && data.data) {
             localStorage.setItem("token", data.data);
             this.$message.success("登录成功");
             this.$router.push("/");
          } else if (data) {
             // Fallback if data is already unwrapped (unlikely given request.js)
             localStorage.setItem("token", data);
             this.$message.success("登录成功");
             this.$router.push("/");
          }
      })
      .catch(err => {
         const msg = err.response ? err.response.data : err;
         this.$message.error(msg || "登录失败");
      });
    },
    goBack(){
      this.$router.go(-1);
    },
    toPasswordLogin() {
      this.$message.info("密码登录即将上线");
    },
    sendCode(){
      if (!this.form.phone) {
        this.$message.warning("请输入手机号");
        return;
      }
      if (!/^1[3-9]\d{9}$/.test(this.form.phone)) {
        this.$message.warning("手机号格式不正确");
        return;
      }

      sendCode(this.form.phone)
        .then(() => {
           this.$message.success("验证码已发送");
        })
        .catch(err => {
          console.log(err);
          this.$message.error("发送失败，请稍后重试");
        });

      this.disabled = true;
      let i = 60;
      this.codeBtnMsg = i + 'S';
      let taskId = setInterval(() => {
         i--;
         this.codeBtnMsg = i + 'S';
         if (i <= 0) {
            clearInterval(taskId);
            this.disabled = false;
            this.codeBtnMsg = "发送验证码";
         }
      }, 1000);
    }
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background-color: #f5f5f7;
  display: flex;
  flex-direction: column;
}

.header {
  height: 50px;
  background: white;
  display: flex;
  align-items: center;
  padding: 0 15px;
  border-bottom: 1px solid #ff9c00;
  position: relative;
}
.header-back-btn {
  font-size: 24px;
  color: #f63;
  width: 40px;
  height: 100%;
  display: flex;
  align-items: center;
  cursor: pointer;
}
.header-title {
  flex: 1;
  text-align: center;
  font-size: 18px;
  color: #333;
  margin-right: 40px; /* Balance back btn */
}

.content {
  padding: 20px;
  flex: 1;
}

.input-group {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.custom-input-box {
  flex: 1;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 0 12px;
  height: 44px;
  display: flex;
  align-items: center;
}
.custom-input-box.full-width {
  width: 100%;
}
.custom-input-box input {
  width: 100%;
  border: none;
  background: transparent;
  font-size: 15px;
  outline: none;
  color: #333;
}
.custom-input-box input::placeholder {
  color: #ccc;
}

.code-btn {
  width: 110px;
  height: 44px;
  background-color: #67c23a; /* Green matching image */
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}
.code-btn.disabled {
  background-color: #b3e19d;
  cursor: not-allowed;
}

.tips {
  text-align: center;
  font-size: 12px;
  color: #999;
  margin: 10px 0 20px;
}

.login-btn {
  width: 100%;
  height: 44px;
  background: linear-gradient(90deg, #ff9c00, #f63);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 3px 8px rgba(255, 102, 51, 0.2);
}
.login-btn:active {
  transform: scale(0.98);
}

.password-login-link {
  text-align: right;
  margin-top: 15px;
  font-size: 14px;
}
.password-login-link span {
  color: #409EFF; /* Or maybe keep it simpler dark link? Image showed dark blue link */
  color: #3b5998;
  cursor: pointer;
  text-decoration: underline;
}

.login-radio {
  margin-top: 30px;
}
.radio-label {
  display: flex;
  align-items: flex-start;
  font-size: 12px;
  color: #666;
  line-height: 1.5;
}
.radio-label input {
  margin-top: 3px;
  margin-right: 6px;
}
.radio-text a {
  color: #409EFF;
  text-decoration: none;
}
</style>
