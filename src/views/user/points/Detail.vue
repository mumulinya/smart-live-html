<template>
  <PageLayout :loading="pageLoading" skeleton-type="list" class="points-detail-page">
    <van-nav-bar
      title="积分明细"
      left-arrow
      fixed
      placeholder
      @click-left="goBack"
    />

    <div class="detail-content">
      <van-tabs v-model:active="activeTab" animated swipeable color="#ff7a00" @change="handleTabChange">
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
          <div v-if="records.length === 0 && !loading" class="empty-state">
            <van-icon name="points" class="empty-icon" />
            <div class="empty-text">快去签到或消费赚积分吧~</div>
          </div>
          <div v-else class="timeline">
            <div
              v-for="(item, index) in records"
              :key="item.id"
              class="timeline-item"
            >
              <div class="timeline-left">
                <div class="dot"></div>
                <div v-if="index !== records.length - 1" class="line"></div>
              </div>
              <div class="timeline-content">
                <div class="item-time">{{ item.date }}</div>
                <div class="item-desc">{{ item.desc }}</div>
              </div>
              <div class="timeline-amount" :class="item.type === 'in' ? 'in' : 'out'">
                {{ formatAmount(item) }}
              </div>
            </div>
          </div>
        </van-list>
      </van-pull-refresh>
    </div>
  </PageLayout>
</template>

<script>
import PageLayout from '@/components/PageLayout/PageLayout.vue';

export default {
  name: 'UserPointsDetail',
  components: { PageLayout },
  data() {
    return {
      pageLoading: false,
      activeTab: 'all',
      refreshing: false,
      loading: false,
      finished: false,
      page: 1,
      pageSize: 6,
      records: [],
      allRecords: [
        { id: 1, date: '2026-02-04 18:30', desc: '消费订单', value: 88, type: 'in' },
        { id: 2, date: '2026-02-03 08:20', desc: '签到', value: 10, type: 'in' },
        { id: 3, date: '2026-02-01 14:10', desc: '兑换优惠券', value: 200, type: 'out' },
        { id: 4, date: '2026-01-30 10:05', desc: '评价晒单', value: 20, type: 'in' },
        { id: 5, date: '2026-01-28 09:50', desc: '积分抽奖', value: 50, type: 'out' },
        { id: 6, date: '2026-01-27 12:00', desc: '邀请好友', value: 60, type: 'in' },
        { id: 7, date: '2026-01-25 20:15', desc: '兑换免邮券', value: 120, type: 'out' },
        { id: 8, date: '2026-01-22 16:40', desc: '签到', value: 10, type: 'in' },
        { id: 9, date: '2026-01-20 11:05', desc: '消费订单', value: 66, type: 'in' },
        { id: 10, date: '2026-01-18 09:22', desc: '积分抽奖', value: 50, type: 'out' },
        { id: 11, date: '2026-01-16 13:40', desc: '评价晒单', value: 20, type: 'in' },
        { id: 12, date: '2026-01-14 18:05', desc: '兑换优惠券', value: 150, type: 'out' },
        { id: 13, date: '2026-01-12 10:30', desc: '邀请好友', value: 80, type: 'in' },
        { id: 14, date: '2026-01-10 09:10', desc: '签到', value: 10, type: 'in' },
        { id: 15, date: '2026-01-08 19:45', desc: '兑换礼包', value: 300, type: 'out' }
      ]
    };
  },
  computed: {
    filteredSource() {
      if (this.activeTab === 'in') {
        return this.allRecords.filter(item => item.type === 'in');
      }
      if (this.activeTab === 'out') {
        return this.allRecords.filter(item => item.type === 'out');
      }
      return this.allRecords;
    }
  },
  methods: {
    goBack() {
      this.$router.back();
    },
    handleTabChange() {
      this.resetAndLoad();
    },
    onRefresh() {
      this.resetAndLoad(true);
    },
    resetAndLoad(isRefresh = false) {
      this.page = 1;
      this.records = [];
      this.finished = false;
      this.loading = true;
      if (isRefresh) this.refreshing = true;
      this.onLoad();
    },
    onLoad() {
      const source = this.filteredSource;
      const start = (this.page - 1) * this.pageSize;
      const end = start + this.pageSize;
      const nextList = source.slice(start, end);

      setTimeout(() => {
        this.records = this.records.concat(nextList);
        this.loading = false;
        this.refreshing = false;

        if (end >= source.length) {
          this.finished = true;
        } else {
          this.page += 1;
        }
      }, 300);
    },
    formatAmount(item) {
      const sign = item.type === 'in' ? '+' : '-';
      return `${sign}${item.value}`;
    }
  },
  mounted() {
    this.loading = true;
    this.onLoad();
  }
};
</script>

<style scoped>
.points-detail-page {
  min-height: 100vh;
  background: #f5f5f5;
}
.detail-content {
  padding: 8px 12px 16px;
}
.timeline {
  padding: 8px 0;
}
.timeline-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 0;
}
.timeline-left {
  width: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ffb74d;
  margin-top: 3px;
}
.line {
  width: 2px;
  flex: 1;
  background: #ffe0b2;
  margin-top: 6px;
}
.timeline-content {
  flex: 1;
}
.item-time {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}
.item-desc {
  font-size: 14px;
  color: #333;
}
.timeline-amount {
  font-size: 14px;
  font-weight: 600;
}
.timeline-amount.in {
  color: #00b578;
}
.timeline-amount.out {
  color: #ff4d4f;
}
.empty-state {
  padding: 40px 0;
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
</style>
