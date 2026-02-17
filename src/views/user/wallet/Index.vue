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
          <van-grid-item text="充值" to="/user/wallet/recharge">
            <template #icon>
              <van-icon name="gold-coin-o" size="22" color="#ff8a00" style="margin-bottom: 6px;" />
            </template>
          </van-grid-item>
          <van-grid-item text="账单" to="/user/wallet/bill">
            <template #icon>
              <van-icon name="records" size="22" color="#2f86f6" style="margin-bottom: 6px;" />
            </template>
          </van-grid-item>
          <van-grid-item text="支付明细" to="/user/wallet/payment-record">
            <template #icon>
              <van-icon name="balance-list-o" size="22" color="#673ab7" style="margin-bottom: 6px;" />
            </template>
          </van-grid-item>
        </van-grid>
      </div>

      <div class="transactions-card">
        <div class="section-title">
            <span>最近交易</span>
            <span class="view-all" @click="$router.push('/user/wallet/bill')">全部 <van-icon name="arrow" /></span>
        </div>
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
import { getWalletInfo, getWalletTransactionList } from '@/api/wallet';

export default {
  name: 'UserWallet',
  components: { PageLayout },
  data() {
    return {
      pageLoading: false,
      showAmount: false,
      activeTab: 'all',
      wallet: {
        balance: 0.00,
        frozenBalance: 0.00
      },
      transactions: [],
      page: 1,
      pageSize: 20,
      finished: false,
      loading: false
    };
  },
  computed: {
    // Filter on frontend for now if API supports 'all' but we want local filter or if API returns all
    // But better to use API filter if available. My design says API supports 'type'.
    // Let's use API filter for tab switch to be consistent with backend design.
    // However, for simplicity and small data, fetching all and filtering locally is also fine?
    // The design says: /transaction/list?type=all|in|out
    // So we should re-fetch on tab change.
    // But to match current structure, I'll fetch 'all' and if pagination is needed, handle it.
    // For now, I'll just fetch latest 20 'all' records.
    filteredTransactions() {
       return this.transactions;
    }
  },
  watch: {
    activeTab() {
        this.page = 1;
        this.transactions = [];
        this.fetchTransactions();
    }
  },
  created() {
    this.initData();
  },
  methods: {
    goBack() {
      this.$router.back();
    },
    async initData() {
        this.pageLoading = true;
        try {
            await Promise.all([this.fetchWalletInfo(), this.fetchTransactions()]);
        } catch (error) {
            console.error(error);
        } finally {
            this.pageLoading = false;
        }
    },
    async fetchWalletInfo() {
        const res = await getWalletInfo();
        if (res.success) {
            this.wallet = res.data;
        }
    },
    async fetchTransactions() {
        const params = {
            page: 1,
            pageSize: 5, // Only show recent 5 records
            type: 'all' // Always show all types for preview
        };
        const res = await getWalletTransactionList(params);
        if (res.success) {
            this.transactions = res.data.records || [];
        }
    },
    toggleAmount() {
      this.showAmount = !this.showAmount;
    },
    showComingSoon(label) {
      this.$message.info(`${label}功能开发中`);
    },
    openTransaction() {
      // this.$router.push(...)
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
      const sign = item.type === 'in' || item.type === 1 || item.direction === 1 ? '+' : '-';
      return `${sign}¥${this.formatMoney(item.amount)}`;
    },
    getAmountClass(item) {
       // Backend Design: type 1,4,5 are income? No, `direction` field: 1-income, 2-expense
       // But my mock transaction data used 'type': 'in'/'out'.
       // Let's adapt to backend response which returns `type` ('in'/'out' string based on my doc example) 
       // OR check `direction`.
       // Doc example: "type": "in". So string is returned.
       return item.type === 'in' ? 'amount-in' : 'amount-out';
    },
    getStatusText(status) {
      const map = {
        success: '已完成',
        pending: '处理中',
        failed: '失败'
      };
      return map[status] || status;
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
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.view-all {
    font-size: 12px;
    font-weight: normal;
    color: #999;
    display: flex;
    align-items: center;
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
