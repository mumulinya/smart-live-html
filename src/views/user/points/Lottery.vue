<template>
  <PageLayout :loading="pageLoading" skeleton-type="detail" class="points-lottery-page">
    <van-nav-bar
      title="积分抽奖"
      left-arrow
      fixed
      placeholder
      @click-left="goBack"
    />

    <div class="lottery-content">
      <!-- 顶部积分余额卡片 -->
      <div class="balance-card">
        <div class="balance-info">
          <div class="balance-label">
            <span class="label-icon">💎</span>
            当前积分
          </div>
          <div class="balance-value">{{ formatNumber(pointsBalance) }}</div>
          <div class="balance-unit">积分</div>
        </div>
        <div class="balance-tip">
          每次抽奖消耗 <strong>{{ costPerDraw }}</strong> 积分
        </div>
      </div>

      <!-- 九宫格抽奖区域 -->
      <div class="lottery-section">
        <div class="section-header">
          <span class="sparkle">✨</span>
          幸运转盘
          <span class="sparkle">✨</span>
        </div>
        <div class="lottery-board">
          <div
            v-for="(cell, index) in gridCells"
            :key="index"
            class="board-cell"
            :class="cellClass(index, cell)"
            @click="cell && cell.type === 'button' ? startLottery() : null"
          >
            <template v-if="cell && cell.type === 'button'">
              <div class="draw-btn-inner">
                <div class="draw-icon">🎰</div>
                <div class="draw-text" :class="{ disabled: isSpinning }">
                  {{ isSpinning ? '抽奖中...' : '立即抽奖' }}
                </div>
                <div class="draw-cost">-{{ costPerDraw }} 积分</div>
              </div>
            </template>
            <template v-else-if="cell && cell.type === 'prize'">
              <div class="prize-icon">{{ getPrizeIcon(cell) }}</div>
              <div class="prize-name">{{ cell.name }}</div>
              <div class="prize-desc">{{ cell.desc }}</div>
            </template>
            <template v-else>
              <div class="prize-icon">🎁</div>
              <div class="prize-name">---</div>
            </template>
          </div>
        </div>
      </div>

      <!-- 活动说明 -->
      <div class="lottery-note">
        <div class="note-title">
          <span class="note-icon">📋</span>
          活动说明
        </div>
        <div class="note-list">
          <div class="note-item">🔸 每次抽奖消耗 {{ costPerDraw }} 积分</div>
          <div class="note-item">🔸 奖品以实际到账为准</div>
          <div class="note-item">🔸 积分可通过签到、评价等方式获取</div>
        </div>
      </div>
    </div>
  </PageLayout>
</template>

<script>
import PageLayout from '@/components/PageLayout/PageLayout.vue';
import { getPointsInfo, getLotteryConfig, drawLottery } from '@/api/points';

export default {
  name: 'UserPointsLottery',
  components: { PageLayout },
  data() {
    return {
      pageLoading: false,
      pointsBalance: 0,
      costPerDraw: 50,
      isSpinning: false,
      currentIndex: 0,
      timer: null,
      prizes: [],
      gridOrder: [0, 1, 2, 5, 8, 7, 6, 3]
    };
  },
  computed: {
    gridCells() {
      const cells = new Array(9).fill(null);
      if (this.prizes.length >= 8) {
        this.gridOrder.forEach((cellIndex, i) => {
          cells[cellIndex] = { ...this.prizes[i], type: 'prize', originalIndex: i };
        });
      }
      cells[4] = { type: 'button' };
      return cells;
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
        await Promise.all([this.fetchBalance(), this.fetchConfig()]);
      } catch (error) {
        console.error(error);
      } finally {
        this.pageLoading = false;
      }
    },
    async fetchBalance() {
      const res = await getPointsInfo();
      if (res.success) {
        this.pointsBalance = res.data.balance;
      }
    },
    async fetchConfig() {
      const res = await getLotteryConfig();
      if (res.success) {
        this.costPerDraw = res.data.costPerDraw;
        this.prizes = res.data.prizes || [];
      }
    },
    cellClass(index, cell) {
      if (!cell || !cell.type) return { empty: true };
      const activeCellIndex = this.gridOrder[this.currentIndex];
      return {
        active: cell.type === 'prize' && index === activeCellIndex && this.isSpinning,
        center: cell.type === 'button',
        prize: cell.type === 'prize'
      };
    },
    getPrizeIcon(cell) {
      if (!cell || !cell.name) return '🎁';
      const name = cell.name.toLowerCase();
      if (name.includes('积分')) return '💰';
      if (name.includes('优惠券') || name.includes('券')) return '🎫';
      if (name.includes('红包')) return '🧧';
      if (name.includes('谢谢') || name.includes('再来')) return '🍀';
      if (name.includes('会员') || name.includes('VIP')) return '👑';
      if (name.includes('免单') || name.includes('免费')) return '🎉';
      return '🎁';
    },
    async startLottery() {
      if (this.isSpinning) return;
      if (this.pointsBalance < this.costPerDraw) {
        this.$message.warning('积分不足，快去赚积分吧~');
        return;
      }

      this.isSpinning = true;

      try {
        const res = await drawLottery();
        if (res.success) {
          const prizeId = res.data.prizeId;
          const targetIndex = this.prizes.findIndex(p => p.id === prizeId);

          if (targetIndex !== -1) {
            this.pointsBalance -= this.costPerDraw;
            this.runAnimation(targetIndex, res.data);
          } else {
            this.$message.error('奖品配置异常');
            this.isSpinning = false;
          }
        } else {
          this.$message.error(res.message || '抽奖失败');
          this.isSpinning = false;
        }
      } catch (error) {
        this.$message.error('网络异常，请重试');
        this.isSpinning = false;
      }
    },
    runAnimation(targetIndex, prizeData) {
      const rounds = 3;
      const offset = (targetIndex - this.currentIndex + this.prizes.length) % this.prizes.length;
      const totalSteps = rounds * this.prizes.length + offset;
      let steps = 0;
      let speed = 80;

      const step = () => {
        this.currentIndex = (this.currentIndex + 1) % this.prizes.length;
        steps++;

        if (steps >= totalSteps) {
          this.isSpinning = false;
          this.handlePrize(prizeData);
          this.fetchBalance();
        } else {
          if (totalSteps - steps < 8) {
            speed += 40;
          } else if (totalSteps - steps < 3) {
            speed += 80;
          }
          this.timer = setTimeout(step, speed);
        }
      };

      this.timer = setTimeout(step, speed);
    },
    handlePrize(prize) {
      this.$message.success(`🎉 恭喜获得 ${prize.prizeName}`);
    },
    formatNumber(val) {
      if (val === undefined || val === null || isNaN(val)) return '0';
      return Number(val).toLocaleString();
    }
  },
  beforeUnmount() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }
};
</script>

<style scoped>
.points-lottery-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #ff6a00 0%, #ff8f3a 30%, #fff5ed 60%, #f5f5f5 100%);
}

.lottery-content {
  padding: 12px;
}

/* ===== 积分余额卡片 ===== */
.balance-card {
  background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,247,230,0.95) 100%);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 8px 32px rgba(255, 106, 0, 0.15);
  position: relative;
  overflow: hidden;
}
.balance-card::before {
  content: '';
  position: absolute;
  top: -20px;
  right: -20px;
  width: 100px;
  height: 100px;
  background: radial-gradient(circle, rgba(255,167,38,0.15) 0%, transparent 70%);
  border-radius: 50%;
}
.balance-info {
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex-wrap: wrap;
}
.balance-label {
  font-size: 13px;
  color: #8b5a2b;
  display: flex;
  align-items: center;
  gap: 4px;
}
.label-icon {
  font-size: 16px;
}
.balance-value {
  font-size: 32px;
  font-weight: 800;
  background: linear-gradient(135deg, #ff6a00, #ff9a44);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.2;
}
.balance-unit {
  font-size: 14px;
  color: #c77800;
  font-weight: 600;
}
.balance-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #a0783c;
}
.balance-tip strong {
  color: #ff6a00;
  font-weight: 700;
}

/* ===== 抽奖区域 ===== */
.lottery-section {
  background: #fff;
  border-radius: 20px;
  padding: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);
  margin-bottom: 16px;
}
.section-header {
  text-align: center;
  font-size: 16px;
  font-weight: 700;
  color: #333;
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.sparkle {
  font-size: 18px;
}

.lottery-board {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 10px;
  background: linear-gradient(135deg, #fff8f0 0%, #ffefdf 100%);
  border-radius: 16px;
  border: 2px solid #ffe0b2;
}

.board-cell {
  aspect-ratio: 1;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 4px;
  padding: 6px;
  transition: all 0.15s ease;
  position: relative;
}

.board-cell.empty {
  background: #fff5e6;
  border: 1.5px dashed #ffe0b2;
}

.board-cell.prize {
  background: linear-gradient(145deg, #ffffff 0%, #fff8f0 100%);
  border: 1.5px solid #ffe0b2;
  box-shadow: 0 2px 8px rgba(255, 167, 38, 0.08);
}

.board-cell.active {
  background: linear-gradient(135deg, #ffcc02 0%, #ff9500 100%) !important;
  border-color: #ff8a00 !important;
  box-shadow: 0 0 20px rgba(255, 149, 0, 0.5), 0 4px 12px rgba(255, 149, 0, 0.3) !important;
  transform: scale(1.05);
  z-index: 2;
}
.board-cell.active .prize-name {
  color: #fff !important;
  font-weight: 700;
}
.board-cell.active .prize-desc {
  color: rgba(255,255,255,0.85) !important;
}
.board-cell.active .prize-icon {
  transform: scale(1.15);
}

.board-cell.center {
  background: linear-gradient(135deg, #ff7a00 0%, #ff5500 100%);
  border: none;
  color: #fff;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(255, 85, 0, 0.35);
}
.board-cell.center:active {
  transform: scale(0.96);
  box-shadow: 0 3px 10px rgba(255, 85, 0, 0.3);
}

.draw-btn-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.draw-icon {
  font-size: 22px;
  line-height: 1;
}
.draw-text {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1px;
}
.draw-text.disabled {
  opacity: 0.7;
}
.draw-cost {
  font-size: 10px;
  opacity: 0.85;
}

.prize-icon {
  font-size: 24px;
  line-height: 1;
  transition: transform 0.15s ease;
}
.prize-name {
  font-size: 12px;
  font-weight: 600;
  color: #7a4b00;
  line-height: 1.2;
}
.prize-desc {
  font-size: 10px;
  color: #a08060;
  line-height: 1.2;
}

/* ===== 活动说明 ===== */
.lottery-note {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}
.note-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.note-icon {
  font-size: 16px;
}
.note-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.note-item {
  font-size: 12px;
  color: #888;
  line-height: 1.6;
}
</style>
