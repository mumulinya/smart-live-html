<template>
  <PageLayout :loading="false" class="wallet-recharge-page">
    <van-nav-bar
      title="余额充值"
      left-arrow
      fixed
      placeholder
      @click-left="goBack"
    />

    <div class="recharge-content">
      <div class="amount-section">
        <div class="label">充值金额</div>
        <div class="input-wrapper">
            <span class="currency">¥</span>
            <van-field
                v-model="amount"
                type="number"
                placeholder="请输入金额"
                class="amount-input"
                :border="false"
            />
        </div>
      </div>

      <div class="grid-section">
        <div 
            v-for="item in quickAmounts" 
            :key="item" 
            class="amount-item"
            :class="{ active: Number(amount) === item }"
            @click="amount = item"
        >
            {{ item }}元
        </div>
      </div>

      <!-- 支付方式 -->
      <div class="pay-methods">
          <div class="method-title">支付方式</div>
          <van-radio-group v-model="payMethod">
              <!-- 微信扫码 -->
              <div class="pay-method-item" @click="payMethod = 'wx_native'">
                  <div class="method-left">
                      <van-icon name="qr" size="24" color="#07c160" />
                      <div class="method-info">
                          <div class="method-name">微信扫码支付</div>
                          <div class="method-desc">推荐 PC 端使用</div>
                      </div>
                  </div>
                  <van-radio name="wx_native" />
              </div>

              <!-- 微信跳转 -->
               <div class="pay-method-item" @click="payMethod = 'wx_h5'">
                  <div class="method-left">
                      <van-icon name="wechat-pay" size="24" color="#07c160" />
                      <div class="method-info">
                          <div class="method-name">微信支付 (跳转)</div>
                          <div class="method-desc">推荐手机端使用</div>
                      </div>
                  </div>
                  <van-radio name="wx_h5" />
              </div>

               <!-- 支付宝扫码 -->
              <div class="pay-method-item" @click="payMethod = 'ali_native'">
                  <div class="method-left">
                      <van-icon name="alipay" size="24" color="#1677ff" />
                      <div class="method-info">
                          <div class="method-name">支付宝扫码</div>
                          <div class="method-desc">PC端 / 另一台手机扫码</div>
                      </div>
                  </div>
                  <van-radio name="ali_native" />
              </div>

              <!-- 支付宝跳转 -->
               <div class="pay-method-item" @click="payMethod = 'ali_h5'">
                  <div class="method-left">
                      <van-icon name="alipay" size="24" color="#1677ff" />
                      <div class="method-info">
                          <div class="method-name">支付宝 (跳转)</div>
                          <div class="method-desc">跳转支付宝APP支付</div>
                      </div>
                  </div>
                  <van-radio name="ali_h5" />
              </div>
          </van-radio-group>
      </div>

      <div class="submit-btn">
          <van-button type="primary" block round size="large" :loading="loading" @click="handleRecharge">
              立即充值
          </van-button>
      </div>
    </div>

    <!-- 扫码支付弹窗 -->
    <van-overlay :show="qrVisible" @click="closeQr">
      <div class="qr-dialog" @click.stop>
        <div class="qr-title">{{ qrTitle }}</div>
        <div class="qr-amount">¥{{ formatMoney(amount) }}</div>
        <div class="qr-code-wrapper">
          <!-- 优先 Base64 -->
          <img v-if="qrCodeBase64" :src="qrCodeBase64" class="qr-img" />
          <QrcodeVue v-else-if="qrCodeUrl" :value="qrCodeUrl" :size="200" level="H" />
        </div>
        <div class="qr-tip">请使用{{ qrAppName }}扫描二维码完成支付</div>
        <div class="qr-status" v-if="pollingActive">
          <van-loading size="16" /> 等待支付中...
        </div>
        <div class="qr-close" @click="closeQr">关闭</div>
      </div>
    </van-overlay>
  </PageLayout>
</template>

<script>
import PageLayout from '@/components/PageLayout/PageLayout.vue';
import QrcodeVue from 'qrcode.vue';
import { unifiedPay, getPayStatus } from '@/api/pay';
import { showToast, showSuccessToast, showFailToast } from 'vant';

export default {
  name: 'UserWalletRecharge',
  components: { PageLayout, QrcodeVue },
  data() {
    return {
      amount: '',
      payMethod: 'wx_native',
      loading: false,
      quickAmounts: [10, 20, 50, 100, 200, 500],

      // 扫码支付
      qrVisible: false,
      qrCodeUrl: '',
      qrCodeBase64: '',
      qrTitle: '',
      qrAppName: '',
      pollingActive: false,
      pollTimer: null
    };
  },
  created() {
    const ua = navigator.userAgent.toLowerCase();
    if (!ua.includes('micromessenger') && /android|iphone|ipad|mobile/i.test(ua)) {
        this.payMethod = 'wx_h5';
    }
  },
  beforeUnmount() {
    this.stopPolling();
  },
  methods: {
    goBack() {
      this.stopPolling();
      this.$router.back();
    },
    formatMoney(val) {
      if (val === undefined || val === null || isNaN(val)) return '0.00';
      return Number(val).toFixed(2);
    },

    async handleRecharge() {
        if (!this.amount || Number(this.amount) <= 0) {
            showToast('请输入有效的充值金额');
            return;
        }

        this.loading = true;
        try {
            let provider = '';
            let appType = '';

            // 解析支付方式
            if (this.payMethod === 'wx_native') { provider = 'wechat'; appType = 'native'; }
            else if (this.payMethod === 'wx_h5') { provider = 'wechat'; appType = 'h5'; }
            else if (this.payMethod === 'ali_native') { provider = 'alipay'; appType = 'native'; }
            else if (this.payMethod === 'ali_h5') { provider = 'alipay'; appType = 'h5'; }

            // 微信内强制 jsapi
            const ua = navigator.userAgent.toLowerCase();
            if (provider === 'wechat' && appType === 'h5' && ua.includes('micromessenger')) {
                appType = 'jsapi';
            }

            const res = await unifiedPay({
                bizType: 'recharge',
                amount: Number(this.amount),
                payMethod: provider,
                appType: appType
            });

            if (res.success || res.code === 200) {
                const data = res.data;
                const paySn = data.paySn;

                // 统一处理扫码 (支持 Base64 和 URL)
                if (appType === 'native') {
                    if (data.codeImgBase64 || data.codeUrl || data.qrCode) {
                        const url = data.codeUrl || data.qrCode;
                        this.showQr(url, data.codeImgBase64, paySn, 
                            provider === 'wechat' ? '微信扫码支付' : '支付宝扫码',
                             provider === 'wechat' ? '微信' : '支付宝'
                        );
                        return;
                    }
                }

                // 支付宝 H5 Form 提交 (兼容 data.form 和 data.payParams.form)
                if (provider === 'alipay' && appType === 'h5') {
                    const formHtml = (data.payParams && data.payParams.form) || data.form;
                    if (formHtml) {
                        const div = document.createElement('div');
                        div.innerHTML = formHtml;
                        document.body.appendChild(div);
                        document.forms[0].submit();
                        return;
                    }
                }

                // 微信 H5 跳转
                if (provider === 'wechat' && appType === 'h5' && data.mwebUrl) {
                    const redirectUrl = encodeURIComponent(
                        window.location.origin + `/pay/result?paySn=${paySn}&bizType=recharge`
                    );
                    window.location.href = `${data.mwebUrl}&redirect_url=${redirectUrl}`;
                    return;
                }

                // 微信 JSAPI
                if (provider === 'wechat' && appType === 'jsapi' && data.payParams) {
                    if (typeof WeixinJSBridge !== 'undefined') {
                        WeixinJSBridge.invoke('getBrandWCPayRequest', data.payParams, (wxRes) => {
                            if (wxRes.err_msg === 'get_brand_wcpay_request:ok') {
                                showSuccessToast('充值成功');
                                setTimeout(() => this.$router.replace('/user/wallet'), 1200);
                            } else {
                                showFailToast('支付取消或失败');
                            }
                        });
                    } else {
                         // 异常情况，PC微信或开发者工具
                         showToast('请在微信中完成支付');
                         this.startPolling(paySn);
                    }
                    return;
                }

                showToast('支付发起成功，请在微信中完成支付');
                this.startPolling(paySn);
            } else {
                showFailToast(res.message || '下单失败');
            }
        } catch (error) {
            console.error('充值失败:', error);
            showFailToast('充值失败');
        } finally {
            this.loading = false;
        }
    },

    showQr(url, base64, paySn, title, appName) {
        this.qrCodeUrl = url;
        this.qrCodeBase64 = base64;
        this.qrTitle = title;
        this.qrAppName = appName;
        this.qrVisible = true;
        this.startPolling(paySn);
    },

    startPolling(paySn) {
        this.pollingActive = true;
        let count = 0;
        this.pollTimer = setInterval(async () => {
            count++;
            if (count > 60) {
                this.stopPolling();
                this.qrVisible = false;
                showFailToast('支付超时');
                return;
            }
            try {
                const res = await getPayStatus(paySn);
                if (res.success && res.data.status === 1) {
                    this.stopPolling();
                    this.qrVisible = false;
                    showSuccessToast('充值成功');
                    setTimeout(() => this.$router.replace('/user/wallet'), 1200);
                }
            } catch (e) { /* ignore */ }
        }, 2000);
    },

    stopPolling() {
        this.pollingActive = false;
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
        }
    },

    closeQr() {
        this.qrVisible = false;
        this.stopPolling();
        this.qrCodeUrl = '';
        this.qrCodeBase64 = '';
    }
  }
};
</script>

<style scoped>
/* 保持样式不变，只增加 img 样式 */
.wallet-recharge-page {
  min-height: 100vh;
  background: #f7f8fa;
}
.recharge-content {
    padding: 16px;
}
.amount-section {
    background: #fff;
    padding: 20px;
    border-radius: 12px;
    margin-bottom: 16px;
}
.label {
    font-size: 14px;
    color: #333;
    margin-bottom: 12px;
    font-weight: 500;
}
.input-wrapper {
    display: flex;
    align-items: center;
    border-bottom: 1px solid #eee;
    padding-bottom: 8px;
}
.currency {
    font-size: 28px;
    font-weight: 600;
    color: #333;
    margin-right: 8px;
}
.amount-input {
    padding: 0;
    font-size: 24px;
    font-weight: 600;
}
:deep(.amount-input .van-field__control) {
    height: auto;
}
.grid-section {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 16px;
}
.amount-item {
    background: #fff;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    font-size: 16px;
    color: #333;
    font-weight: 500;
    border: 1px solid transparent;
}
.amount-item.active {
    border-color: #ff6600;
    color: #ff6600;
    background: #fff8f2;
}

.pay-methods {
    background: #fff;
    border-radius: 12px;
    padding: 16px;
}
.method-title {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 16px;
    color: #333;
}
.pay-method-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
}
.pay-method-item:last-child {
  border-bottom: none;
}
.method-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.method-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.method-name {
  font-size: 15px;
  color: #333;
  font-weight: 500;
}
.method-desc {
  font-size: 12px;
  color: #999;
}

.submit-btn {
    margin-top: 30px;
}

.qr-dialog {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 300px;
  background: #fff;
  border-radius: 16px;
  padding: 30px 20px;
  padding-bottom: 20px;
  text-align: center;
}
.qr-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
}
.qr-amount {
  font-size: 24px;
  font-weight: 700;
  color: #ff6600;
  margin-bottom: 20px;
}
.qr-code-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}
.qr-img {
    width: 200px;
    height: 200px;
    object-fit: contain;
}
.qr-tip {
  font-size: 13px;
  color: #999;
  margin-bottom: 12px;
}
.qr-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
  color: #07c160;
  margin-bottom: 16px;
}
.qr-close {
    font-size: 14px;
    color: #666;
    padding: 10px;
    border-top: 1px solid #eee;
    margin-top: 10px;
    cursor: pointer;
}
</style>
