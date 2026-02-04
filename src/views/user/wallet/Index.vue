<template>
  <PageLayout :loading="pageLoading" skeleton-type="detail" class="wallet-page">
    <van-nav-bar
      title="我的钱包"
      left-arrow
      fixed
      placeholder
      @click-left="goBack"
    />

    <div class="wallet-content">
      <div class="balance-card">
        <div class="balance-title-row">
          <div class="balance-title">钱包余额</div>
          <van-icon
            :name="showAmount ? 'eye' : 'closed-eye'"
            class="eye-toggle"
            @click="toggleAmount"
          />
        </div>
        <div class="balance-amount">¥{{ formatBalance(wallet.balance) }}</div>
      </div>

      <div class="action-card">
        <van-grid clickable :column-num="4" :border="false">
          <van-grid-item text="充值" @click="showComingSoon('充值')">
            <template #icon>
              <van-icon name="gold-coin-o" size="22" color="#ff8a00" style="margin-bottom: 6px;" />
            </template>
          </van-grid-item>
          <van-grid-item text="提现" @click="showComingSoon('提现')">
            <template #icon>
              <van-icon name="cash-o" size="22" color="#00b578" style="margin-bottom: 6px;" />
            </template>
          </van-grid-item>
          <van-grid-item text="账单" @click="showComingSoon('账单')">
            <template #icon>
              <van-icon name="records" size="22" color="#2f86f6" style="margin-bottom: 6px;" />
            </template>
          </van-grid-item>
          <van-grid-item text="银行卡" @click="showComingSoon('银行卡')">
            <template #icon>
              <van-icon name="card" size="22" color="#6f5bff" style="margin-bottom: 6px;" />
            </template>
          </van-grid-item>
        </van-grid>
      </div>

      <div class="transactions-card">
        <div class="section-title">交易明细</div>
        <van-tabs v-model:active="activeTab" animated swipeable color="#ff6600" line-width="28">
          <van-tab title="全部" name="all" />
          <van-tab title="收入" name="in" />
          <van-tab title="支出" name="out" />
        </van-tabs>

        <div class="transactions-list">
          <div v-if="filteredTransactions.length === 0" class="empty-state">
            <van-icon name="records-o" class="empty-icon" />
            <div class="empty-text">暂无明细</div>
          </div>
          <div v-else>
            <div
              v-for="item in filteredTransactions"
              :key="item.id"
              class="tx-item"
              @click="openTransaction(item)"
            >
              <div class="tx-left">
                <div class="tx-title">{{ item.title }}</div>
                <div class="tx-time">{{ item.time }}</div>
              </div>
              <div class="tx-right">
                <div class="tx-amount" :class="getAmountClass(item)">
                  {{ formatAmount(item) }}
                </div>
                <div class="tx-status" :class="getStatusClass(item)">
                  {{ getStatusText(item.status) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </PageLayout>
</template>

<script>
import PageLayout from '@/components/PageLayout/PageLayout.vue';

export default {
  name: 'UserWallet',
  components: { PageLayout },
  data() {
    return {
      pageLoading: false,
      showAmount: false,
      activeTab: 'all',
      wallet: {
        balance: 3821.58
      },
      transactions: [
        {
          id: 1,
          title: '订单返现',
          time: '2026-02-03 18:30',
          amount: 15.6,
          type: 'in',
          status: 'success'
        },
        {
          id: 2,
          title: '余额充值',
          time: '2026-02-01 10:12',
          amount: 200,
          type: 'in',
          status: 'success'
        },
        {
          id: 3,
          title: '订单支付',
          time: '2026-01-29 13:50',
          amount: 68.5,
          type: 'out',
          status: 'success'
        },
        {
          id: 4,
          title: '提现申请',
          time: '2026-01-27 09:22',
          amount: 300,
          type: 'out',
          status: 'pending'
        },
        {
          id: 5,
          title: '退款入账',
          time: '2026-01-25 16:05',
          amount: 39.9,
          type: 'in',
          status: 'success'
        },
        {
          id: 6,
          title: '银行卡扣款失败',
          time: '2026-01-23 11:40',
          amount: 120,
          type: 'out',
          status: 'failed'
        },
        {
          id: 7,
          title: '代金券退回',
          time: '2026-01-20 19:05',
          amount: 10,
          type: 'in',
          status: 'success'
        }
      ]
    };
  },
  computed: {
    filteredTransactions() {
      if (this.activeTab === 'in') {
        return this.transactions.filter(item => item.type === 'in');
      }
      if (this.activeTab === 'out') {
        return this.transactions.filter(item => item.type === 'out');
      }
      return this.transactions;
    }
  },
  methods: {
    goBack() {
      this.$router.back();
    },
    toggleAmount() {
      this.showAmount = !this.showAmount;
    },
    showComingSoon(label) {
      this.$message.info(`${label}功能开发中`);
    },
    openTransaction() {
      this.$message.info('详情功能开发中');
    },
    formatMoney(val) {
      if (val === undefined || val === null || isNaN(val)) return '0.00';
      return Number(val).toFixed(2);
    },
    formatBalance(val) {
      if (!this.showAmount) return '****';
      return this.formatMoney(val);
    },
    formatAmount(item) {
      if (!this.showAmount) return '****';
      const sign = item.type === 'in' ? '+' : '-';
      return `${sign}¥${this.formatMoney(item.amount)}`;
    },
    getAmountClass(item) {
      return item.type === 'in' ? 'amount-in' : 'amount-out';
    },
    getStatusText(status) {
      const map = {
        success: '已完成',
        pending: '处理中',
        failed: '失败'
      };
      return map[status] || '未知';
    },
    getStatusClass(item) {
      if (item.status === 'success') return 'status-success';
      if (item.status === 'pending') return 'status-pending';
      if (item.status === 'failed') return 'status-failed';
      return 'status-failed';
    }
  }
};
</script>

<style scoped>
.wallet-page {
  min-height: 100vh;
  background: #f5f5f5;
}
.wallet-content {
  padding: 12px;
}
.balance-card {
  padding: 16px;
  border-radius: 16px;
  background: linear-gradient(135deg, #fff4e6 0%, #ffe2c2 100%);
  color: #7a4b00;
  box-shadow: 0 8px 20px rgba(255, 168, 90, 0.2);
}
.balance-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.balance-title {
  font-size: 13px;
  opacity: 0.8;
}
.eye-toggle {
  font-size: 18px;
  color: #8b5a2b;
}
.balance-amount {
  font-size: 30px;
  font-weight: 700;
  margin: 8px 0 12px;
}
.action-card {
  margin-top: 12px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}
.transactions-card {
  margin-top: 12px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}
.section-title {
  padding: 14px 16px 6px;
  font-size: 15px;
  font-weight: 600;
  color: #333;
}
.transactions-list {
  padding-bottom: 6px;
}
.tx-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-top: 1px solid #f5f5f5;
}
.tx-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.tx-title {
  font-size: 14px;
  color: #333;
}
.tx-time {
  font-size: 12px;
  color: #999;
}
.tx-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}
.tx-amount {
  font-size: 16px;
  font-weight: 600;
}
.amount-in {
  color: #00b578;
}
.amount-out {
  color: #ff4d4f;
}
.tx-status {
  font-size: 12px;
}
.status-success {
  color: #00b578;
}
.status-pending {
  color: #ff9900;
}
.status-failed {
  color: #999;
}
.empty-state {
  padding: 30px 0 20px;
  text-align: center;
  color: #999;
}
.empty-icon {
  font-size: 32px;
  margin-bottom: 8px;
}
.empty-text {
  font-size: 13px;
}
:deep(.van-grid-item__text) {
  font-size: 13px !important;
  color: #333 !important;
  margin-top: 4px;
}
:deep(.van-tabs__line) {
  background: #ff6600;
}
:deep(.van-tab--active .van-tab__text) {
  font-weight: 600;
  color: #333;
}
</style>
