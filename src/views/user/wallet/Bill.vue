<template>
  <PageLayout :loading="false" class="wallet-bill-page">
    <van-nav-bar
      title="账单明细"
      left-arrow
      fixed
      placeholder
      @click-left="goBack"
    />

    <van-tabs v-model:active="activeTab" sticky offset-top="46" color="#ff6600" title-active-color="#ff6600">
      <van-tab title="全部" name="all" />
      <van-tab title="收入" name="in" />
      <van-tab title="支出" name="out" />
    </van-tabs>

    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="onLoad"
      >
        <div class="bill-list">
             <div v-if="list.length === 0 && !loading && !refreshing" class="empty-state">
                <van-icon name="records" size="64" color="#eee" />
                <p>暂无账单记录</p>
             </div>
            <div
              v-for="item in list"
              :key="item.id"
              class="bill-item"
            >
              <div class="bill-left">
                <div class="bill-title">{{ item.title }}</div>
                <div class="bill-time">{{ item.time }}</div>
              </div>
              <div class="bill-right">
                <div class="bill-amount" :class="getAmountClass(item)">
                  {{ formatAmount(item) }}
                </div>
                <div class="bill-status" :class="getStatusClass(item)">
                  {{ getStatusText(item.status) }}
                </div>
              </div>
            </div>
        </div>
      </van-list>
    </van-pull-refresh>
  </PageLayout>
</template>

<script>
import PageLayout from '@/components/PageLayout/PageLayout.vue';
import { getWalletTransactionList } from '@/api/wallet';

export default {
  name: 'UserWalletBill',
  components: { PageLayout },
  data() {
    return {
      activeTab: 'all',
      list: [],
      loading: false,
      finished: false,
      refreshing: false,
      page: 1,
      pageSize: 20
    };
  },
  watch: {
    activeTab() {
        this.onRefresh();
    }
  },
  methods: {
    goBack() {
      this.$router.back();
    },
    async onLoad() {
      if (this.refreshing) {
        this.list = [];
        this.refreshing = false;
      }

      try {
        const params = {
            page: this.page,
            pageSize: this.pageSize,
            type: this.activeTab
        };
        const res = await getWalletTransactionList(params);
        if (res.success) {
            const records = res.data.records || [];
            if (this.page === 1) {
                this.list = records;
            } else {
                this.list = this.list.concat(records);
            }
            
            this.loading = false;
            
            if (this.list.length >= res.data.total || records.length < this.pageSize) {
                this.finished = true;
            } else {
                this.page++;
            }
        } else {
            this.loading = false;
            this.finished = true;
        }
      } catch (error) {
        this.loading = false;
        this.finished = true;
      }
    },
    onRefresh() {
      this.finished = false;
      this.loading = true;
      this.refreshing = true;
      this.page = 1;
      this.onLoad();
    },
    formatMoney(val) {
      if (val === undefined || val === null || isNaN(val)) return '0.00';
      return Number(val).toFixed(2);
    },
    formatAmount(item) {
      const sign = item.type === 'in' || item.type === 1 || item.direction === 1 ? '+' : '-';
      return `${sign}¥${this.formatMoney(item.amount)}`;
    },
    getAmountClass(item) {
        // Adapt to backend or mock 'type'
       const isIn = item.type === 'in' || item.type === 1 || item.direction === 1;
       return isIn ? 'amount-in' : 'amount-out';
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
.wallet-bill-page {
  min-height: 100vh;
  background: #f7f8fa;
}
.bill-list {
    background: #fff;
}
.bill-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f5f5f5;
}
.bill-left {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.bill-title {
  font-size: 15px;
  color: #333;
  font-weight: 500;
}
.bill-time {
  font-size: 12px;
  color: #999;
}
.bill-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}
.bill-amount {
  font-size: 16px;
  font-weight: 600;
}
.amount-in {
  color: #00b578;
}
.amount-out {
  color: #333; /* Traditional accounting style: black for out, red/green for in. Or red for out. */
  color: #ff4d4f;
}
.bill-status {
  font-size: 12px;
}
.status-success {
  color: #999;
}
.status-pending {
  color: #ff9900;
}
.status-failed {
  color: #ff4d4f;
}
.empty-state {
    padding: 60px 0;
    text-align: center;
    color: #999;
    font-size: 14px;
}
:deep(.van-tabs__nav) {
    background: #fff;
}
</style>
