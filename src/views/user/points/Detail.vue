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
import { getPointsRecordList } from '@/api/points';

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
      pageSize: 10,
      records: []
    };
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
      this.finished = false;
      this.loading = true;
      if (isRefresh) {
        this.refreshing = true;
        this.records = []; // Clear immediately on refresh
      }
      this.onLoad();
    },
    async onLoad() {
      if (this.refreshing) {
          // If refreshing, we might have cleared records, but if not, logic is same.
      }
      
      try {
        const params = {
          page: this.page,
          pageSize: this.pageSize,
          type: this.activeTab
        };
        const res = await getPointsRecordList(params);
        if (res.success) {
          const newRecords = res.data.records || [];
          if (this.page === 1) {
            this.records = newRecords;
          } else {
            this.records = this.records.concat(newRecords);
          }
          
          this.loading = false;
          this.refreshing = false;

          if (this.records.length >= res.data.total) { // Or check newRecords.length < pageSize
            this.finished = true;
          } else {
            this.page += 1;
          }
        } else {
           this.loading = false;
           this.finished = true;
        }
      } catch (error) {
        console.error('Fetch points records failed', error);
        this.loading = false;
        this.finished = true;
      }
    },
    formatAmount(item) {
      // Backend might return signed value or we handle it here. 
      // Assumption: backend returns absolute value and type.
      const sign = item.type === 'in' || item.type === 1 ? '+' : '-';
      return `${sign}${item.value || item.amount}`; 
      // Compatible with 'value' (mock) or 'amount' (db) if map happens in backend or here.
      // Based on API doc: data.records item has `value`.
    }
  },
  mounted() {
    // Initial load handled by van-list or manual call? 
    // van-list with v-model:loading="loading" will trigger load if not enough content.
    // But safely we can call it if list is empty.
    // Because immediate-check is true by default for van-list, it might auto trigger.
    // Let's rely on van-list immediate check or set it manually.
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
