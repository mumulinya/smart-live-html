<template>
  <PageLayout :loading="checking" class="pay-result-page">
    <van-nav-bar title="支付结果" fixed placeholder />

    <div class="result-content">
      <!-- 查询中 -->
      <div v-if="checking" class="result-box">
        <van-loading size="40" />
        <div class="result-text">正在查询支付结果...</div>
      </div>

      <!-- 成功 -->
      <div v-else-if="status === 1" class="result-box success">
        <van-icon name="checked" size="60" color="#07c160" />
        <div class="result-text">支付成功</div>
        <van-button type="primary" round @click="goNext">{{ nextButtonText }}</van-button>
      </div>

      <!-- 失败/待支付 -->
      <div v-else class="result-box fail">
        <van-icon name="warning-o" size="60" color="#ee0a24" />
        <div class="result-text">支付未完成</div>
        <div class="result-desc">如已支付，请稍等片刻</div>
        <div class="btn-group">
          <van-button round @click="recheckStatus" :loading="rechecking">重新查询</van-button>
          <van-button type="primary" round @click="goNext">返回</van-button>
        </div>
      </div>
    </div>
  </PageLayout>
</template>

<script>
import PageLayout from '@/components/PageLayout/PageLayout.vue';
import { getPayStatus } from '@/api/pay';

export default {
  name: 'PayResult',
  components: { PageLayout },
  data() {
    return {
      checking: true,
      rechecking: false,
      status: 0,
      paySn: '',
      bizType: '',
      bizId: ''
    };
  },
  computed: {
    nextButtonText() {
      return this.bizType === 'recharge' ? '返回钱包' : '查看订单';
    }
  },
  created() {
    const query = this.$route.query;
    this.paySn = query.paySn || '';
    this.bizType = query.bizType || 'order';
    this.bizId = query.bizId || '';
    this.checkStatus();
  },
  methods: {
    async checkStatus() {
      if (!this.paySn) {
        this.checking = false;
        return;
      }
      try {
        const res = await getPayStatus(this.paySn);
        if (res.success) {
          this.status = res.data.status;
        }
      } catch (e) {
        console.error(e);
      } finally {
        this.checking = false;
      }
    },
    async recheckStatus() {
      this.rechecking = true;
      await this.checkStatus();
      this.rechecking = false;
    },
    goNext() {
      if (this.bizType === 'recharge') {
        this.$router.replace('/user/wallet');
      } else {
        this.$router.replace({ path: '/order/detail', query: { id: this.bizId } });
      }
    }
  }
};
</script>

<style scoped>
.pay-result-page {
  min-height: 100vh;
  background: #f7f8fa;
}
.result-content {
  padding: 60px 20px;
}
.result-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
.result-text {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}
.result-desc {
  font-size: 13px;
  color: #999;
}
.btn-group {
  display: flex;
  gap: 12px;
  margin-top: 10px;
}
</style>
