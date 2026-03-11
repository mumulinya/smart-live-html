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
      <!-- 等级卡片 -->
      <div class="level-card">
        <div class="level-badge">
          <span class="badge-icon">🏅</span>
          <span class="badge-text">{{ levelName }}</span>
        </div>
        <div class="level-progress-section">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progressPercent + '%' }">
              <div class="progress-glow"></div>
            </div>
          </div>
          <div class="progress-info">
            <span class="progress-text">成长进度 {{ progressPercent }}%</span>
            <span class="level-gap">距升级还需 {{ formatDisplay(nextLevelNeed) }} 积分</span>
          </div>
        </div>
      </div>

      <!-- 积分卡片 -->
      <div class="points-card">
        <div class="points-header">
          <div class="points-title-row">
            <span class="points-label">我的积分</span>
            <van-icon
              :name="showAmount ? 'eye' : 'closed-eye'"
              class="eye-toggle"
              @click="toggleAmount"
            />
          </div>
          <div class="points-value-row">
            <span class="points-value">{{ formatDisplay(pointsBalance) }}</span>
            <span class="points-unit">积分</span>
          </div>
        </div>
        <div class="points-actions">
          <div class="action-item" :class="{ 'signed-in': signedIn }" @click="handleSignIn">
            <div class="action-icon-wrap sign">
              <span class="action-emoji">📅</span>
            </div>
            <span class="action-text">{{ signedIn ? `已签到` : '签到' }}</span>
            <span v-if="signedIn" class="action-sub">连签{{ consecutiveDays }}天</span>
          </div>
          <div class="action-item" @click="showComingSoon('任务中心')">
            <div class="action-icon-wrap task">
              <span class="action-emoji">📋</span>
            </div>
            <span class="action-text">任务中心</span>
            <span class="action-sub">赚积分</span>
          </div>
          <div class="action-item highlight" @click="toLottery">
            <div class="action-icon-wrap lottery">
              <span class="action-emoji">🎰</span>
            </div>
            <span class="action-text">积分抽奖</span>
            <span class="action-sub">赢好礼</span>
          </div>
        </div>
      </div>

      <!-- 权益卡片 -->
      <div class="benefit-card">
        <div class="section-title">
          <span class="title-icon">👑</span>
          当前等级专属权益
        </div>
        <div class="benefit-scroll">
          <div v-for="item in benefits" :key="item.title" class="benefit-item">
            <div class="benefit-title">{{ item.title }}</div>
            <div class="benefit-desc">{{ item.desc }}</div>
          </div>
          <div v-if="benefits.length === 0" class="benefit-empty">
            暂无权益信息
          </div>
        </div>
      </div>

      <!-- 积分明细 -->
      <div class="detail-card">
        <div class="detail-header" @click="toDetail">
          <div class="section-title">
            <span class="title-icon">📊</span>
            积分明细
          </div>
          <div class="detail-more">
            查看全部
            <van-icon name="arrow" size="14" />
          </div>
        </div>
        <div v-if="previewList.length > 0" class="timeline">
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
              <div class="item-desc">{{ item.desc }}</div>
              <div class="item-time">{{ item.date }}</div>
            </div>
            <div class="timeline-amount" :class="item.type == 1 ? 'in' : 'out'">
              {{ formatAmount(item) }}
            </div>
          </div>
        </div>
        <div v-else class="empty-preview">
          <span class="empty-icon-text">📝</span>
          <span class="empty-text">暂无积分记录</span>
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
      previewList: []
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
          this.fetchData();
        } else {
          this.$message.error(res.message || '签到失败');
        }
      } catch (error) {
        // Error handled by request interceptor
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
      const sign = item.type == 1 ? '+' : '-';
      return `${sign}${item.value || item.amount}`;
    }
  }
};
</script>

<style scoped>
.points-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #ff6a00 0%, #ff8f3a 25%, #fff5ed 55%, #f5f5f5 100%);
}
.points-content {
  padding: 12px;
}

/* ===== 等级卡片 ===== */
.level-card {
  padding: 18px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(255,247,230,0.92) 100%);
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(255, 106, 0, 0.15);
  margin-bottom: 12px;
}
.level-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
}
.badge-icon {
  font-size: 22px;
}
.badge-text {
  font-size: 17px;
  font-weight: 700;
  background: linear-gradient(135deg, #ff6a00, #c45600);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.level-progress-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.progress-bar {
  height: 10px;
  background: rgba(255, 224, 178, 0.6);
  border-radius: 999px;
  overflow: hidden;
  position: relative;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ffb74d, #ff7a00);
  border-radius: 999px;
  transition: width 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: relative;
  min-width: 10px;
}
.progress-glow {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 20px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6));
  border-radius: 999px;
}
.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.progress-text {
  font-size: 12px;
  color: #c77800;
  font-weight: 500;
}
.level-gap {
  font-size: 11px;
  color: #a08060;
}

/* ===== 积分卡片 ===== */
.points-card {
  margin-bottom: 12px;
  background: #fff;
  border-radius: 16px;
  padding: 18px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.05);
}
.points-header {
  margin-bottom: 16px;
}
.points-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}
.points-label {
  font-size: 13px;
  color: #888;
}
.eye-toggle {
  font-size: 16px;
  color: #ff7a00;
  cursor: pointer;
}
.points-value-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
}
.points-value {
  font-size: 30px;
  font-weight: 800;
  background: linear-gradient(135deg, #ff6a00, #ff9a44);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.2;
}
.points-unit {
  font-size: 13px;
  color: #c77800;
  font-weight: 600;
}

.points-actions {
  display: flex;
  gap: 10px;
}
.action-item {
  flex: 1;
  background: linear-gradient(145deg, #fff8f0 0%, #fff3e5 100%);
  border: 1px solid #ffe8cc;
  border-radius: 14px;
  padding: 12px 4px 10px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.action-item:active {
  transform: scale(0.96);
}
.action-item.signed-in {
  opacity: 0.65;
}
.action-item.highlight {
  background: linear-gradient(145deg, #fff0e0 0%, #ffe3c7 100%);
  border-color: #ffd4a8;
}
.action-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2px;
}
.action-icon-wrap.sign {
  background: rgba(255, 167, 38, 0.12);
}
.action-icon-wrap.task {
  background: rgba(66, 165, 245, 0.12);
}
.action-icon-wrap.lottery {
  background: rgba(255, 87, 34, 0.12);
}
.action-emoji {
  font-size: 20px;
}
.action-text {
  font-size: 12px;
  font-weight: 600;
  color: #5a3e1e;
}
.action-sub {
  font-size: 10px;
  color: #a08060;
}

/* ===== 权益卡片 ===== */
.benefit-card {
  margin-bottom: 12px;
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.05);
}
.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.title-icon {
  font-size: 18px;
}
.benefit-scroll {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 6px;
  -webkit-overflow-scrolling: touch;
}
.benefit-scroll::-webkit-scrollbar {
  display: none;
}
.benefit-item {
  min-width: 130px;
  padding: 12px;
  border-radius: 12px;
  background: linear-gradient(145deg, #fff8f0 0%, #fff3e5 100%);
  border: 1px solid #ffe8cc;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}
.benefit-title {
  font-size: 13px;
  font-weight: 600;
  color: #a65b00;
  margin-bottom: 4px;
}
.benefit-desc {
  font-size: 11px;
  color: #a08060;
  line-height: 1.4;
}
.benefit-empty {
  width: 100%;
  padding: 20px 0;
  text-align: center;
  color: #ccc;
  font-size: 13px;
}

/* ===== 积分明细 ===== */
.detail-card {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.05);
}
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}
.detail-more {
  font-size: 12px;
  color: #aaa;
  display: flex;
  align-items: center;
  gap: 2px;
}
.timeline {
  margin-top: 4px;
}
.timeline-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
}
.timeline-item:last-child {
  border-bottom: none;
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
  background: linear-gradient(135deg, #ffb74d, #ff9800);
  margin-top: 4px;
  box-shadow: 0 0 6px rgba(255, 152, 0, 0.3);
}
.line {
  width: 2px;
  flex: 1;
  background: #ffe8cc;
  margin-top: 6px;
}
.timeline-content {
  flex: 1;
}
.item-desc {
  font-size: 14px;
  color: #333;
  font-weight: 500;
  margin-bottom: 2px;
}
.item-time {
  font-size: 11px;
  color: #bbb;
}
.timeline-amount {
  font-size: 15px;
  font-weight: 700;
  padding-top: 2px;
}
.timeline-amount.in {
  color: #00b578;
}
.timeline-amount.out {
  color: #ff4d4f;
}

.empty-preview {
  padding: 30px 0;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.empty-icon-text {
  font-size: 28px;
}
.empty-text {
  font-size: 13px;
  color: #ccc;
}
</style>
