<template>
  <div class="login-page">
    <div class="login-header">
      <div class="back-btn" @click="goHome">
        <van-icon name="arrow-left" size="24" color="#333" />
      </div>
      <h2 class="welcome-text">欢迎登录智评生活</h2>
      <p class="sub-text">未注册的手机号登录后将自动注册</p>
    </div>

    <!-- Tab 切换 -->
    <div class="login-tabs">
      <div class="tab-item" :class="{ active: !isPasswordMode }" @click="isPasswordMode = false">验证码登录</div>
      <div class="tab-item" :class="{ active: isPasswordMode }" @click="isPasswordMode = true">密码登录</div>
    </div>

    <div class="login-form">
      <van-field 
        v-model="form.phone" 
        placeholder="请输入手机号" 
        class="custom-input"
        :border="false"
        type="tel"
        maxlength="11"
      >
        <template #left-icon>
          <van-icon name="phone-o" size="20" color="#666"/>
        </template>
      </van-field>

      <van-field 
        v-if="!isPasswordMode"
        v-model="form.code" 
        placeholder="请输入验证码" 
        class="custom-input mt-4"
        :border="false"
        type="digit"
        maxlength="6"
      >
        <template #left-icon>
          <van-icon name="shield-o" size="20" color="#666"/>
        </template>
        <template #button>
          <span class="send-code-text" :class="{disabled: counting}" @click="handleSendCode">
            {{ counting ? `${count}s后重发` : '获取验证码' }}
          </span>
        </template>
      </van-field>

      <van-field 
        v-else
        v-model="form.password" 
        placeholder="请输入密码" 
        class="custom-input mt-4"
        :border="false"
        type="password"
      >
        <template #left-icon>
          <van-icon name="lock" size="20" color="#666"/>
        </template>
      </van-field>

      <div class="btn-container">
        <van-button block color="linear-gradient(to right, #ff9966, #ff5e62)" round @click="handleLogin" :loading="loading">
          登录
        </van-button>
      </div>
    </div>

    <div class="login-footer">
       <van-checkbox v-model="agree" icon-size="14px" checked-color="#ff5e62">
         <span class="agreement-text">
            我已阅读并同意 
            <a href="javascript:void(0)" @click.stop>《用户协议》</a> 与 
            <a href="javascript:void(0)" @click.stop>《隐私政策》</a>
         </span>
       </van-checkbox>
    </div>

    <Vcode :show="isShowSlider" :imgs="sliderImages" @success="onSliderSuccess" @close="isShowSlider = false" />
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { showToast, showSuccessToast, showFailToast } from 'vant';
import { login, sendCode, appLoginByPassword } from '@/api/user';
import Vcode from "vue3-puzzle-vcode";

const router = useRouter();

const form = reactive({
    phone: '',
    phone: '',
    code: '',
    password: ''
});

const isPasswordMode = ref(false); 

const toggleMode = () => {
  isPasswordMode.value = !isPasswordMode.value;
  form.code = '';
  form.password = '';
};

const agree = ref(false);
const loading = ref(false);
const counting = ref(false);
const count = ref(60);
let timer = null;

const handleSendCode = async () => {
    if (counting.value) return;
    if (!form.phone) {
        showToast("请输入手机号");
        return;
    }
    if (!/^1[3-9]\d{9}$/.test(form.phone)) {
        showToast("手机号格式不正确");
        return;
    }

    try {
        await sendCode(form.phone);
        showSuccessToast("验证码已发送");
        startCount();
    } catch (err) {
        console.error(err);
        showFailToast("发送失败，请稍后重试");
    }
};

const startCount = () => {
    counting.value = true;
    count.value = 60;
    timer = setInterval(() => {
        count.value--;
        if (count.value <= 0) {
            clearInterval(timer);
            counting.value = false;
        }
    }, 1000);
};

const isShowSlider = ref(false);

const sliderImages = [
  "https://picsum.photos/id/1/600/300",
  "https://picsum.photos/id/11/600/300",
  "https://picsum.photos/id/20/600/300",
  "https://picsum.photos/id/35/600/300"
];

const handleLogin = async () => {
    if (!agree.value) {
        showToast("请先勾选同意用户协议");
        return;
    }
    
    // Validate Phone
    if (!form.phone) {
        showToast("请输入手机号");
        return;
    }

    if (isPasswordMode.value) {
        // Password Mode Validation
        if (!form.password) {
                return showToast("请输入密码");
        }
        // Show Slider
        isShowSlider.value = true;
    } else {
        // Code Mode Validation
        if (!form.code) {
                return showToast("请输入验证码");
        }
        performLogin();
    }
};

const onSliderSuccess = () => {
  isShowSlider.value = false;
  performLogin();
};

const performLogin = async () => {
    loading.value = true;
    try {
        let res;
        
        if (isPasswordMode.value) {
            res = await appLoginByPassword(form);
        } else {
            res = await login(form);
        }

        const token = res.data || res;
        if (token) {
            localStorage.setItem("token", token);
            showSuccessToast("登录成功");
            router.push("/");
        } else {
            showFailToast("登录失败：无Token");
        }
    } catch (err) {
        // err 可能是字符串(来自 request 拦截器)或 Error 对象
        const msg = typeof err === 'string' ? err : (err.response?.data?.errorMsg || err.response?.data || err.message || "登录失败");
        showFailToast(msg);
    } finally {
        loading.value = false;
    }
};



const goHome = () => {
    router.push('/');
};
</script>

<style scoped>
.login-page { 
    padding: 30px 24px; 
    background: white; 
    min-height: 100vh; 
    display: flex; 
    flex-direction: column; 
    box-sizing: border-box;
    position: relative;
}

.login-header { 
    margin-top: 40px; 
    margin-bottom: 40px; 
    text-align: left; 
}

.back-btn {
    position: absolute;
    top: 20px;
    left: 20px;
    cursor: pointer;
    z-index: 10;
}



.welcome-text { 
    font-size: 24px; 
    font-weight: bold; 
    color: #333; 
    margin-bottom: 8px;
}

.sub-text {
    font-size: 14px;
    color: #999;
}

.custom-input { 
    background-color: #F7F8FA; 
    border-radius: 24px; 
    padding: 10px 16px; 
    align-items: center; 
    margin-bottom: 16px; 
}

.mt-4 { 
    margin-top: 16px; 
}

.send-code-text { 
    color: #ff5e62; 
    font-size: 14px; 
    font-weight: 500; 
    padding-left: 10px; 
    border-left: 1px solid #eee; 
    cursor: pointer;
}
.send-code-text.disabled {
    color: #999;
    cursor: not-allowed;
}

.btn-container { 
    margin-top: 30px; 
    box-shadow: 0 4px 12px rgba(255, 94, 98, 0.3); 
    border-radius: 999px; 
}

/* Tab 切换样式 */
.login-tabs {
    display: inline-flex;
    margin-bottom: 24px;
}
.tab-item {
    padding: 10px 24px;
    font-size: 14px;
    color: #666;
    cursor: pointer;
    border: 1px solid #e0e0e0;
    background: #fff;
    transition: all 0.2s;
    white-space: nowrap;
}
.tab-item:first-child {
    border-radius: 20px 0 0 20px;
    border-right: none;
}
.tab-item:last-child {
    border-radius: 0 20px 20px 0;
}
.tab-item.active {
    color: #333;
    font-weight: 600;
    border-color: #333;
    background: #fff;
}

.login-footer { 
    margin-top: auto; 
    padding-bottom: 20px; 
    display: flex; 
    justify-content: center; 
}

.agreement-text { 
    font-size: 12px; 
    color: #999; 
    line-height: 1.5; 
}

.agreement-text a {
    color: #ff5e62;
}
</style>
