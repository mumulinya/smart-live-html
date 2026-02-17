<template>
  <PageLayout :loading="pageLoading" class="checkout-page">
    <van-nav-bar
      title="收银台"
      left-arrow
      fixed
      placeholder
      @click-left="goBack"
    />

    <!-- 订单金额 -->
    <div class="amount-header">
      <div class="amount-label">支付金额</div>
      <div class="amount-value">¥{{ formatMoney(orderAmount) }}</div>
      <div class="order-info">{{ orderTitle }}</div>
    </div>

    <!-- 支付方式选择 -->
    <div class="pay-methods">
      <div class="section-label">选择支付方式</div>

      <van-radio-group v-model="payMethod">
        <!-- 余额支付 (仅订单) -->
        <div class="pay-method-item" v-if="bizType !== 'recharge'" @click="payMethod = 'balance'">
          <div class="method-left">
            <van-icon name="balance-o" size="24" color="#ff6600" />
            <div class="method-info">
              <div class="method-name">余额支付</div>
              <div class="method-desc">可用余额: ¥{{ formatMoney(walletBalance) }}</div>
            </div>
          </div>
          <van-radio name="balance" />
        </div>

        <!-- 微信扫码支付 -->
        <div class="pay-method-item" @click="payMethod = 'wechat_scan'">
          <div class="method-left">
            <van-icon name="qr" size="24" color="#07c160" />
            <div class="method-info">
              <div class="method-name">微信扫码支付</div>
              <div class="method-desc">推荐 PC 端使用</div>
            </div>
          </div>
          <van-radio name="wechat_scan" />
        </div>

        <!-- 微信跳转支付 -->
        <div class="pay-method-item" @click="payMethod = 'wechat_h5'">
          <div class="method-left">
            <van-icon name="wechat-pay" size="24" color="#07c160" />
            <div class="method-info">
              <div class="method-name">微信支付 (跳转)</div>
              <div class="method-desc">推荐手机端使用</div>
            </div>
          </div>
          <van-radio name="wechat_h5" />
        </div>

        <!-- 支付宝扫码支付 -->
        <div class="pay-method-item" @click="payMethod = 'alipay_scan'">
          <div class="method-left">
            <van-icon name="alipay" size="24" color="#1677ff" />
            <div class="method-info">
              <div class="method-name">支付宝扫码</div>
              <div class="method-desc">PC端 / 另一台手机扫码</div>
            </div>
          </div>
          <van-radio name="alipay_scan" />
        </div>

        <!-- 支付宝跳转支付 -->
        <div class="pay-method-item" @click="payMethod = 'alipay_h5'">
          <div class="method-left">
            <van-icon name="alipay" size="24" color="#1677ff" />
            <div class="method-info">
              <div class="method-name">支付宝 (跳转)</div>
              <div class="method-desc">跳转支付宝APP支付</div>
            </div>
          </div>
          <van-radio name="alipay_h5" />
        </div>
      </van-radio-group>
    </div>

    <!-- 余额不足提示 -->
    <div class="balance-warning" v-if="payMethod === 'balance' && walletBalance < orderAmount">
      <van-icon name="warning-o" color="#ff976a" />
      <span>余额不足，请先充值或选择其他支付方式</span>
    </div>

    <!-- 提交按钮 -->
    <div class="submit-section">
      <van-button
        type="primary"
        block
        round
        size="large"
        :loading="paying"
        :disabled="payMethod === 'balance' && walletBalance < orderAmount"
        @click="handlePay"
      >
        确认支付 ¥{{ formatMoney(orderAmount) }}
      </van-button>
    </div>

    <!-- 扫码支付弹窗 -->
    <van-overlay :show="qrVisible" @click="closeQr">
      <div class="qr-dialog" @click.stop>
        <div class="qr-title">{{ qrTitle }}</div>
        <div class="qr-amount">¥{{ formatMoney(orderAmount) }}</div>
        <div class="qr-code-wrapper">
          <!-- 优先显示 base64 图片 -->
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
import { unifiedPay, balancePay, getPayStatus } from '@/api/pay';
import { getWalletInfo } from '@/api/wallet';
import { showToast, showSuccessToast, showFailToast, showConfirmDialog } from 'vant';

export default {
  name: 'PayCheckout',
  components: { PageLayout, QrcodeVue },
  data() {
    return {
      pageLoading: false,
      paying: false,
      payMethod: 'wechat_scan', // 默认微信扫码
      walletBalance: 0,

      // 路由参数
      bizType: '',
      bizId: '',
      orderAmount: 0,
      orderTitle: '',

      // 扫码支付
      qrVisible: false,
      qrCodeUrl: '',
      qrCodeBase64: '', // 新增: Base64图片
      qrTitle: '扫码支付',
      qrAppName: '微信',
      pollingActive: false,
      pollTimer: null
    };
  },
  created() {
    const query = this.$route.query;
    this.bizType = query.bizType || 'order';
    this.bizId = query.bizId || '';
    this.orderAmount = Number(query.amount) || 0;
    this.orderTitle = query.title || '订单支付';

    // 手机端且不是微信内，默认选中微信H5
    const ua = navigator.userAgent.toLowerCase();
    if (!ua.includes('micromessenger') && /android|iphone|ipad|mobile/i.test(ua)) {
        this.payMethod = 'wechat_h5';
    }

    this.fetchWalletInfo();
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
    async fetchWalletInfo() {
      try {
        const res = await getWalletInfo();
        if (res.success) {
          this.walletBalance = res.data.balance || 0;
        }
      } catch (e) {
        console.warn('获取钱包余额失败', e);
      }
      
      // If order amount is 0 and it's an order, try to fetch order detail
      if (this.bizType === 'order' && (!this.orderAmount || this.orderAmount <= 0) && this.bizId) {
          this.fetchOrderDetail();
      }
    },
    
    async fetchOrderDetail() {
        this.pageLoading = true;
        try {
            const { getOrderDetail } = await import('@/api/order');
            const res = await getOrderDetail(this.bizId);
            const data = res.data || res;
            if(data) {
                // Try to find the amount field
                const amt = data.payValue || data.price || data.amount || data.totalAmount || data.payAmount;
                if(amt) {
                    this.orderAmount = Number(amt);
                    if(!this.orderTitle && data.title) {
                        this.orderTitle = data.title;
                    }
                }
            }
        } catch(e) {
            console.error('Fetch order failed', e);
            showToast('获取订单信息失败');
        } finally {
            this.pageLoading = false;
        }
    },

    async handlePay() {
      if (this.paying) return;
      this.paying = true;

      try {
        if (this.payMethod === 'balance') {
          await this.doBalancePay();
        } else if (this.payMethod.startsWith('wechat')) {
          const appType = this.payMethod === 'wechat_scan' ? 'native' : 'h5';
          // 微信内强制 JSAPI
          const ua = navigator.userAgent.toLowerCase();
          const finalAppType = (appType === 'h5' && ua.includes('micromessenger')) ? 'jsapi' : appType;
          await this.doWechatPay(finalAppType);
        } else if (this.payMethod.startsWith('alipay')) {
          const appType = this.payMethod === 'alipay_scan' ? 'native' : 'h5';
          await this.doAlipay(appType);
        }
      } catch (error) {
        console.error('支付失败:', error);
        showFailToast(error.message || '支付失败');
      } finally {
        this.paying = false;
      }
    },

    async doBalancePay() {
      try {
        await showConfirmDialog({
          title: '确认支付',
          message: `确认使用余额支付 ¥${this.formatMoney(this.orderAmount)} 吗？`,
        });

        const res = await balancePay({
          bizType: this.bizType,
          bizId: this.bizId,
          amount: this.orderAmount
        });

        if (res.success) {
          showSuccessToast('支付成功');
          this.onPaySuccess();
        } else {
          showFailToast(res.message || '余额支付失败');
        }
      } catch (e) {
        this.paying = false;
      }
    },

    async doWechatPay(appType) {
      const res = await unifiedPay({
        bizType: this.bizType,
        bizId: this.bizId,
        amount: this.orderAmount,
        payMethod: 'wechat',
        appType: appType
      });

      if (res.success || res.code === 200) {
        const data = res.data;

        if (appType === 'native' && data.codeUrl) {
          this.showQr(data.codeUrl, null, data.paySn, '微信扫码支付', '微信');
          return;
        }

        if (appType === 'h5' && data.mwebUrl) {
           this.redirect(data.mwebUrl, data.paySn);
           return;
        }

        if (appType === 'jsapi' && data.payParams) {
          this.callWechatSDK(data.payParams, data.paySn);
          return;
        }

        showToast('支付发起成功');
        this.startPolling(data.paySn);
      } else {
        showFailToast(res.message || '下单失败');
      }
    },

    async doAlipay(appType) {
        const res = await unifiedPay({
            bizType: this.bizType,
            bizId: this.bizId,
            amount: this.orderAmount,
            payMethod: 'alipay',
            appType: appType
        });

        if (res.success || res.code === 200) {
            const data = res.data;

            // 支付宝扫码 (当面付) - 优先 Base64，其次 codeUrl
            if (appType === 'native') {
                if (data.codeImgBase64 || data.codeUrl) {
                    this.showQr(data.codeUrl, data.codeImgBase64, data.paySn, '支付宝扫码支付', '支付宝');
                    return;
                }
            }

            // 支付宝跳转 (HTML Form) - 兼容新旧格式
            // 1. data.payParams.form (新)
            // 2. data.form (旧 - 兼容)
            if (appType === 'h5') {
                const formHtml = (data.payParams && data.payParams.form) || data.form;
                if (formHtml) {
                    const div = document.createElement('div');
                    div.innerHTML = formHtml;
                    document.body.appendChild(div);
                    document.forms[0].submit();
                    return;
                }
            }

            showFailToast('未获取到支付参数');
        } else {
            showFailToast(res.message || '下单失败');
        }
    },

    showQr(url, base64, paySn, title, appName) {
        this.qrCodeUrl = url;
        this.qrCodeBase64 = base64; // 设置 Base64
        this.qrTitle = title;
        this.qrAppName = appName;
        this.qrVisible = true;
        this.startPolling(paySn);
    },

    redirect(url, paySn) {
        const redirectUrl = encodeURIComponent(
            window.location.origin + `/pay/result?paySn=${paySn}&bizType=${this.bizType}&bizId=${this.bizId}`
        );
        window.location.href = `${url}&redirect_url=${redirectUrl}`;
    },

    callWechatSDK(params, paySn) {
      if (typeof WeixinJSBridge !== 'undefined') {
        WeixinJSBridge.invoke('getBrandWCPayRequest', params, (res) => {
          if (res.err_msg === 'get_brand_wcpay_request:ok') {
            showSuccessToast('支付成功');
            this.onPaySuccess();
          } else {
            showFailToast('支付取消或失败');
          }
        });
      } else {
        showToast('请在微信中完成支付');
        this.startPolling(paySn);
      }
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
            showSuccessToast('支付成功');
            this.onPaySuccess();
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
    },

    onPaySuccess() {
      setTimeout(() => {
        if (this.bizType === 'recharge') {
          this.$router.replace('/user/wallet');
        } else {
          this.$router.replace({ path: '/order/detail', query: { id: this.bizId } });
        }
      }, 1200);
    }
  }
};
</script>

<style scoped>
/* 保持样式一致 */
.checkout-page {
  min-height: 100vh;
  background: #f7f8fa;
}

.amount-header {
  background: linear-gradient(135deg, #ff6633, #ff8c66);
  padding: 30px 20px;
  text-align: center;
  color: #fff;
}
.amount-label {
  font-size: 14px;
  opacity: 0.85;
  margin-bottom: 8px;
}
.amount-value {
  font-size: 36px;
  font-weight: 700;
  letter-spacing: 1px;
}
.order-info {
  font-size: 13px;
  margin-top: 8px;
  opacity: 0.8;
}

.pay-methods {
  margin: 16px;
  background: #fff;
  border-radius: 12px;
  padding: 16px;
}
.section-label {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
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

.balance-warning {
  margin: 0 16px 16px;
  padding: 10px 14px;
  background: #fffbe6;
  border-radius: 8px;
  font-size: 13px;
  color: #ff976a;
  display: flex;
  align-items: center;
  gap: 6px;
}

.submit-section {
  margin: 24px 16px;
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
