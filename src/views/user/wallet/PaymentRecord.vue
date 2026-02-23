<template>
  <PageLayout :loading="pageLoading" class="payment-record-page">
    <van-nav-bar
      title="支付明细"
      left-arrow
      fixed
      placeholder
      @click-left="$router.back()"
    />

    <van-tabs v-model:active="activeTab" sticky @change="onTabChange">
      <van-tab title="全部" name="all"></van-tab>
      <van-tab title="待支付" name="pending"></van-tab>
      <van-tab title="成功" name="success"></van-tab>
      <van-tab title="失败" name="failed"></van-tab>
      <van-tab title="已取消" name="cancelled"></van-tab>
    </van-tabs>

    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="listLoading"
        :finished="finished"
        finished-text="没有更多了"
        @load="onLoad"
      >
        <div v-for="item in list" :key="item.id" class="record-item">
          <div class="item-header">
            <span class="biz-type">{{ formatBizType(item.bizType) }}</span>
            <span class="status" :class="getStatusClass(item.status)">
              {{ formatStatus(item.status) }}
            </span>
          </div>
          <div class="item-body">
            <div class="row">
              <span class="label">支付单号</span>
              <span class="value">{{ item.paySn }}</span>
            </div>
            <div class="row">
              <span class="label">金额</span>
              <span class="value amount">¥{{ Number(item.amount).toFixed(2) }}</span>
            </div>
            <div class="row">
              <span class="label">支付方式</span>
              <span class="value">{{ formatPayMethod(item.payMethod) }}</span>
            </div>
            <div class="row">
              <span class="label">创建时间</span>
              <span class="value">{{ item.createTime }}</span>
            </div>
            <!-- 待支付倒计时: 使用 van-count-down -->
            <div class="row" v-if="item.status === 0 && item._remainingMs > 0">
              <span class="label">剩余支付时间</span>
              <span class="value countdown">
                <van-count-down :time="item._remainingMs" format="mm:ss" @finish="onCountdownFinish(item)" />
              </span>
            </div>
            <div class="row" v-else-if="item.status === 0 && item._remainingMs <= 0">
              <span class="label">剩余支付时间</span>
              <span class="value text-danger">已过期</span>
            </div>
          </div>
          <!-- 待支付操作按钮 -->
          <div class="item-footer" v-if="item.status === 0 && item._remainingMs > 0">
             <van-button size="small" round plain @click="handleCancel(item)">取消</van-button>
             <van-button size="small" round type="primary" plain @click="toPay(item)">去支付</van-button>
          </div>
        </div>
      </van-list>
    </van-pull-refresh>
  </PageLayout>
</template>

<script>
import PageLayout from '@/components/PageLayout/PageLayout.vue';
import { getPaymentList, cancelPay } from '@/api/pay';
import { showSuccessToast, showFailToast, showConfirmDialog } from 'vant';

const EXPIRE_MINUTES = 15; // 过期时间（分钟）

export default {
  name: 'PaymentRecord',
  components: { PageLayout },
  data() {
    return {
      activeTab: 'all',
      pageLoading: true,
      refreshing: false,
      listLoading: false,
      finished: false,
      list: [],
      page: 1,
      pageSize: 10
    };
  },
  methods: {
    getStatusParam(tab) {
      if (tab === 'pending') return 0;
      if (tab === 'success') return 1;
      if (tab === 'failed') return 2;
      if (tab === 'cancelled') return 3;
      return undefined;
    },

    /**
     * 兼容多种时间格式的解析
     * 支持: "2026-02-17 22:00:00", "2026/02/17 22:00:00", ISO 8601, 时间戳等
     */
    parseTime(timeStr) {
      if (!timeStr) return 0;
      if (typeof timeStr === 'number') return timeStr;
      // 兼容 "yyyy-MM-dd HH:mm:ss" 格式 (Safari/iOS 不支持带 - 的日期)
      const normalized = String(timeStr).replace(/-/g, '/');
      const ts = new Date(normalized).getTime();
      return isNaN(ts) ? 0 : ts;
    },

    /**
     * 为每条记录计算剩余毫秒数，供 van-count-down 使用
     */
    computeRemainingMs(item) {
      if (item.status !== 0) {
        item._remainingMs = 0;
        return;
      }
      const createdTs = this.parseTime(item.createTime);
      if (createdTs <= 0) {
        item._remainingMs = 0;
        return;
      }
      const expireAt = createdTs + EXPIRE_MINUTES * 60 * 1000;
      item._remainingMs = Math.max(0, expireAt - Date.now());
    },

    async fetchList(isRefresh = false) {
      if (isRefresh) {
        this.page = 1;
        this.finished = false;
      }

      const status = this.getStatusParam(this.activeTab);

      try {
        const res = await getPaymentList({
          page: this.page,
          pageSize: this.pageSize,
          status: status
        });

        if (res.success || res.code === 200) {
          const records = res.data.records || res.data.rows || res.data.list || [];
          const total = res.data.total || 0;

          // 为每条记录计算倒计时剩余毫秒
          records.forEach(item => this.computeRemainingMs(item));

          if (isRefresh) {
            this.list = records;
          } else {
            this.list = [...this.list, ...records];
          }

          if (this.list.length >= total || records.length < this.pageSize) {
             this.finished = true;
          } else {
             this.page++;
          }
        } else {
            this.finished = true;
        }
      } catch (error) {
        console.error(error);
        this.finished = true;
      } finally {
        this.pageLoading = false;
        this.listLoading = false;
        this.refreshing = false;
      }
    },
    onLoad() {
      this.fetchList();
    },
    onRefresh() {
      this.fetchList(true);
    },
    onTabChange() {
        this.list = [];
        this.page = 1;
        this.finished = false;
        this.listLoading = true;
        this.fetchList(true);
    },

    onCountdownFinish(item) {
      // 倒计时结束，标记为已过期
      item._remainingMs = 0;
      item.status = 3;
    },

    // ---- 取消支付 ----
    async handleCancel(item) {
      try {
        await showConfirmDialog({
          title: '确认取消',
          message: `确认取消该笔 ¥${Number(item.amount).toFixed(2)} 的支付吗？`
        });

        const res = await cancelPay(item.paySn);
        if (res.success) {
          showSuccessToast('已取消');
          item.status = 3;
          item._remainingMs = 0;
        } else {
          showFailToast(res.message || '取消失败');
        }
      } catch (e) {
        // 用户点了取消确认对话框
      }
    },

    // ---- 格式化 ----
    formatBizType(type) {
        const map = { recharge: '充值', order: '订单支付' };
        return map[type] || type;
    },
    formatStatus(status) {
        const map = { 0: '待支付', 1: '支付成功', 2: '支付失败', 3: '已取消' };
        return map[status] || '未知';
    },
    getStatusClass(status) {
        if (status === 0) return 'text-warning';
        if (status === 1) return 'text-success';
        if (status === 3) return 'text-muted';
        return 'text-danger';
    },
    formatPayMethod(method) {
        const map = { wechat: '微信支付', alipay: '支付宝', balance: '余额支付' };
        return map[method] || method;
    },
    toPay(item) {
        if (item._remainingMs <= 0) {
            showFailToast('该支付单已过期，请重新下单');
            item.status = 3;
            return;
        }
        if (item.bizType) {
            this.$router.push({
                path: '/pay/checkout',
                query: {
                    bizType: item.bizType,
                    bizId: item.bizId || item.paySn,
                    amount: item.amount,
                    title: this.formatBizType(item.bizType)
                }
            });
        }
    }
  }
};
</script>


<style scoped>
.payment-record-page {
  background: #f7f8fa;
  min-height: 100vh;
}
.record-item {
  background: #fff;
  margin: 10px 16px;
  padding: 16px;
  border-radius: 8px;
}
.item-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f5f5f5;
  font-size: 15px;
  font-weight: 500;
}
.text-warning { color: #ff976a; }
.text-success { color: #07c160; }
.text-danger { color: #ee0a24; }
.text-muted { color: #999; }

.item-body {
  font-size: 13px;
  color: #666;
  line-height: 1.8;
}
.row {
  display: flex;
  justify-content: space-between;
}
.amount {
  color: #333;
  font-weight: 600;
}
.countdown {
  color: #ff6600;
  font-weight: 600;
  font-family: 'Courier New', monospace;
}
.item-footer {
  margin-top: 12px;
  text-align: right;
  border-top: 1px solid #f5f5f5;
  padding-top: 10px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
