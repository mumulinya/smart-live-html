<template>
  <PageLayout :loading="pageLoading" skeleton-type="detail" class="points-page">
    <van-nav-bar
      title="积分中心"
      left-arrow
      fixed
      placeholder
      @click-left="goBack"
    />

    <div class="points-content">
      <div class="level-card">
        <div class="level-header">
          <div class="level-title">当前等级：{{ levelName }}</div>
          <div class="level-gap">
            距离升级还需 {{ formatDisplay(nextLevelNeed) }} 积分
          </div>
        </div>
        <div class="level-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
          </div>
          <div class="progress-text">成长进度 {{ progressPercent }}%</div>
        </div>
      </div>

      <div class="points-card">
        <div class="points-header">
          <div class="points-title-row">
            <span class="points-title">我的积分</span>
            <van-icon
              :name="showAmount ? 'eye' : 'closed-eye'"
              class="eye-toggle"
              @click="toggleAmount"
            />
          </div>
          <div class="points-value">{{ formatDisplay(pointsBalance) }} 分</div>
        </div>
        <div class="points-actions">
          <div class="action-item" :class="{ 'signed-in': signedIn }" @click="handleSignIn">
            <van-icon name="calendar-o" size="20" />
            <span>{{ signedIn ? `已签(连签${consecutiveDays}天)` : '签到' }}</span>
          </div>
          <div class="action-item" @click="showComingSoon('任务中心')">
            <van-icon name="todo-list-o" size="20" />
            <span>任务中心</span>
          </div>
          <div class="action-item highlight" @click="toLottery">
            <van-icon name="gift-o" size="20" />
            <span>积分抽奖</span>
          </div>
        </div>
      </div>

      <div class="benefit-card">
        <div class="section-title">当前等级专属权益</div>
        <div class="benefit-scroll">
          <div v-for="item in benefits" :key="item.title" class="benefit-item">
            <div class="benefit-title">{{ item.title }}</div>
            <div class="benefit-desc">{{ item.desc }}</div>
          </div>
        </div>
      </div>

      <div class="detail-card">
        <div class="detail-header" @click="toDetail">
          <div class="section-title">积分明细</div>
          <div class="detail-more">
            查看全部
            <van-icon name="arrow" size="14" />
          </div>
        </div>
        <div class="timeline">
          <div
            v-for="(item, index) in previewList"
            :key="item.id"
            class="timeline-item"
          >
            <div class="timeline-left">
              <div class="dot"></div>
              <div v-if="index !== previewList.length - 1" class="line"></div>
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
      </div>
    </div>
  </PageLayout>
</template>

<script>
import PageLayout from '@/components/PageLayout/PageLayout.vue';
import { getPointsInfo, signIn } from '@/api/points';
import { showToast } from 'vant';

export default {
  name: 'UserPoints',
  components: { PageLayout },
  data() {
    return {
      pageLoading: false,
      showAmount: true,
      levelName: '--',
      pointsBalance: 0,
      nextLevelNeed: 0,
      progressPercent: 0,
      signedIn: false,
      consecutiveDays: 0,
      benefits: [],
      previewList: [] // We'll keep this empty or fetch a few records if needed, but for now specific API doesn't return list in info
    };
  },
  created() {
    this.fetchData();
  },
  methods: {
    goBack() {
      this.$router.back();
    },
    toggleAmount() {
      this.showAmount = !this.showAmount;
    },
    toDetail() {
      this.$router.push('/user/points/detail');
    },
    toLottery() {
      this.$router.push('/user/points/lottery');
    },
    showComingSoon(label) {
      if (label === '签到') {
        this.handleSignIn();
        return;
      }
      this.$message.info(`${label}功能开发中`);
    },
    async fetchData() {
      this.pageLoading = true;
      try {
        const res = await getPointsInfo();
        if (res.success) {
          const data = res.data;
          this.pointsBalance = data.balance;
          this.levelName = data.levelName;
          this.nextLevelNeed = data.nextLevelNeed;
          this.progressPercent = data.progressPercent;
          this.benefits = data.benefits || [];
          this.signedIn = data.signedIn;
          this.consecutiveDays = data.consecutiveDays || 0;
        }
      } catch (error) {
        console.error('Fetch points info failed', error);
      } finally {
        this.pageLoading = false;
      }
    },
    async handleSignIn() {
      if (this.signedIn) {
        this.$message.warning('今日已签到');
        return;
      }
      try {
        const res = await signIn();
        if (res.success) {
          showToast({
            message: `签到成功 +${res.data.points}积分`,
            type: 'success'
          });
          // Refresh info to update balance and status
          this.fetchData();
        } else {
            this.$message.error(res.message || '签到失败');
        }
      } catch (error) {
         // Error handled by request interceptor or global handler
      }
    },
    formatNumber(val) {
      if (val === undefined || val === null || isNaN(val)) return '0';
      return Number(val).toLocaleString();
    },
    formatDisplay(val) {
      if (!this.showAmount) return '****';
      return this.formatNumber(val);
    },
    formatAmount(item) {
      if (!this.showAmount) return '****';
      const sign = item.type === 'in' ? '+' : '-';
      return `${sign}${item.value}`;
    }
  }
};
</script>

<style scoped>
.points-page {
  min-height: 100vh;
  background: #f5f5f5;
}
.points-content {
  padding: 12px;
}
.level-card {
  padding: 16px;
  border-radius: 16px;
  background: linear-gradient(135deg, #fff7e6 0%, #ffe0b2 100%);
  box-shadow: 0 8px 20px rgba(255, 185, 90, 0.25);
  color: #7a4b00;
}
.level-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 10px;
}
.level-title {
  font-size: 15px;
  font-weight: 600;
}
.level-gap {
  font-size: 12px;
  color: #8b5a2b;
}
.level-progress {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.progress-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 999px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ffb74d, #f57c00);
  border-radius: 999px;
  transition: width 0.3s ease;
}
.progress-text {
  font-size: 12px;
  color: #8b5a2b;
}
.points-card {
  margin-top: 12px;
  background: #fff;
  border-radius: 12px;
  padding: 14px 16px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.04);
}
.points-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.points-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.points-title {
  font-size: 14px;
  color: #666;
}
.eye-toggle {
  font-size: 18px;
  color: #ff7a00;
}
.points-value {
  font-size: 22px;
  font-weight: 700;
  color: #ff7a00;
}
.points-actions {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}
.action-item {
  flex: 1;
  background: #fff7e6;
  color: #8b5a2b;
  border-radius: 10px;
  padding: 10px 0;
  text-align: center;
  font-size: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.action-item.highlight {
  background: #ffe3c7;
  color: #ff6f00;
}
.benefit-card {
  margin-top: 12px;
  background: #fff;
  border-radius: 12px;
  padding: 14px 16px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.04);
}
.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
}
.benefit-scroll {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 6px;
}
.benefit-item {
  min-width: 140px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #fff7e6;
  border: 1px solid #ffe0b2;
  flex-shrink: 0;
}
.benefit-title {
  font-size: 14px;
  font-weight: 600;
  color: #a65b00;
  margin-bottom: 4px;
}
.benefit-desc {
  font-size: 12px;
  color: #8b5a2b;
}
.detail-card {
  margin-top: 12px;
  background: #fff;
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.04);
}
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  cursor: pointer;
}
.detail-more {
  font-size: 12px;
  color: #999;
  display: flex;
  align-items: center;
  gap: 4px;
}
.timeline {
  margin-top: 4px;
}
.timeline-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 0;
}
.timeline-left {
  position: relative;
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
  margin-top: 2px;
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
</style>
