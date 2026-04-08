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
      <van-tabs v-model:active="activeTab" animated swipeable color="#ff7a00" title-active-color="#ff7a00" @change="handleTabChange">
        <van-tab title="全部" :name="0" />
        <van-tab title="收入" :name="1" />
        <van-tab title="支出" :name="2" />
      </van-tabs>

      <van-pull-refresh v-model="refreshing" @refresh="onRefresh" success-text="刷新成功">
        <van-list
          v-model:loading="loading"
          :finished="finished"
          finished-text="没有更多了"
          @load="onLoad"
        >
          <div v-if="records.length === 0 && !loading" class="empty-state">
            <div class="empty-emoji">📝</div>
            <div class="empty-text">快去签到或消费赚积分吧~</div>
          </div>
          <div v-else class="record-list">
            <div
              v-for="item in records"
              :key="item.id"
              class="record-item"
            >
              <div class="record-icon-wrap" :class="item.type === 1 ? 'income' : 'expense'">
                <span class="record-emoji">{{ item.type === 1 ? '📥' : '📤' }}</span>
              </div>
              <div class="record-content">
                <div class="record-desc">{{ item.desc }}</div>
                <div class="record-time">{{ item.date }}</div>
              </div>
              <div class="record-amount" :class="item.type === 1 ? 'in' : 'out'">
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
      pageLoading: true,
      activeTab: 0,
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
        this.records = [];
      }
      this.onLoad();
    },
    async onLoad() {
      try {
        const params = {
          page: this.page,
          pageSize: this.pageSize
        };
        // type: 1=收入, 2=消费, 不传=全部
        if (this.activeTab) {
          params.type = this.activeTab;
        }
        const res = await getPointsRecordList(params);
        if (res.success) {
          // 适配可能直接返回数组或对象中包含 list/records 的情况
          const newRecords = Array.isArray(res.data) ? res.data : (res.data.list || res.data.records || []);
          
          if (this.page === 1) {
            this.records = newRecords;
          } else {
            this.records = this.records.concat(newRecords);
          }

          this.loading = false;
          this.refreshing = false;
          this.pageLoading = false;

          // 如果返回的数据少于每页大小，或者没有更多数据（适配 List 直接返回的情况）
          if (newRecords.length < this.pageSize || (res.data.total !== undefined && this.records.length >= res.data.total)) {
            this.finished = true;
          } else {
            this.page += 1;
          }
        } else {
          this.loading = false;
          this.finished = true;
          this.pageLoading = false;
        }
      } catch (error) {
        console.error('Fetch points records failed', error);
        this.loading = false;
        this.finished = true;
        this.pageLoading = false;
      }
    },
    formatAmount(item) {
      const sign = item.type == 1 ? '+' : '-';
      return `${sign}${item.value || item.amount}`;
    }
  }
};
</script>

<style scoped>
.points-detail-page {
  min-height: 100vh;
  background: #f5f5f5;
}
.detail-content {
  padding: 0 0 16px;
}

/* ===== 列表样式 ===== */
.record-list {
  padding: 8px 12px;
}
.record-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: #fff;
  border-radius: 14px;
  margin-bottom: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  transition: transform 0.2s ease;
}
.record-item:active {
  transform: scale(0.98);
}

.record-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.record-icon-wrap.income {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
}
.record-icon-wrap.expense {
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
}
.record-emoji {
  font-size: 20px;
}

.record-content {
  flex: 1;
  min-width: 0;
}
.record-desc {
  font-size: 14px;
  color: #333;
  font-weight: 500;
  margin-bottom: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.record-time {
  font-size: 11px;
  color: #bbb;
}

.record-amount {
  font-size: 16px;
  font-weight: 700;
  flex-shrink: 0;
}
.record-amount.in {
  color: #00b578;
}
.record-amount.out {
  color: #ff4d4f;
}

/* ===== 空状态 ===== */
.empty-state {
  padding: 60px 0;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.empty-emoji {
  font-size: 48px;
}
.empty-text {
  font-size: 14px;
  color: #bbb;
}
</style>
