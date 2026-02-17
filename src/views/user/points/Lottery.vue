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
      <div class="balance-card">
        <div class="balance-title">当前积分</div>
        <div class="balance-value">{{ formatNumber(pointsBalance) }} 分</div>
        <div class="balance-tip">每次抽奖消耗 {{ costPerDraw }} 积分</div>
      </div>

      <div class="lottery-board">
        <div
          v-for="(cell, index) in gridCells"
          :key="index"
          class="board-cell"
          :class="cellClass(index, cell)"
          @click="cell.type === 'button' ? startLottery() : null"
        >
          <template v-if="cell.type === 'button'">
            <div class="draw-btn" :class="{ disabled: isSpinning }">立即抽奖</div>
            <div class="draw-cost">-{{ costPerDraw }} 积分</div>
          </template>
          <template v-else>
            <div class="prize-name">{{ cell.name }}</div>
            <div class="prize-desc">{{ cell.desc }}</div>
          </template>
        </div>
      </div>

      <div class="lottery-note">
        <div class="note-title">活动说明</div>
        <div class="note-text">奖品以实际到账为准，积分抽奖为模拟展示。</div>
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
      prizes: [], // Will be fetched from backend
      gridOrder: [0, 1, 2, 5, 8, 7, 6, 3]
    };
  },
  computed: {
    gridCells() {
      // Ensure we have 8 prizes to fill the grid (3x3 with center button)
      // If prizes are empty (loading), show placeholders or nothing
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
      if (!cell) return {};
      const activeCellIndex = this.gridOrder[this.currentIndex];
      // currentIndex is the index in the PRIZE list (0-7), not the grid cell index
      // activeCellIndex converts prize list index to grid cell index
      
      return {
        active: cell.type === 'prize' && index === activeCellIndex,
        center: cell.type === 'button'
      };
    },
    async startLottery() {
      if (this.isSpinning) return;
      if (this.pointsBalance < this.costPerDraw) {
        this.$message.warning('积分不足，快去赚积分吧~');
        return;
      }

      this.isSpinning = true;
      
      try {
          // call API to get result
          const res = await drawLottery();
          if (res.success) {
              const prizeId = res.data.prizeId;
              const prizeValue = res.data.prizeValue;
              // Find index of the prize in our local list
              const targetIndex = this.prizes.findIndex(p => p.id === prizeId);
              
              if (targetIndex !== -1) {
                  this.pointsBalance -= this.costPerDraw; // deduc locally for instant feedback, though API handles it
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
      // currentIndex is 0-7
      const offset = (targetIndex - this.currentIndex + this.prizes.length) % this.prizes.length;
      const totalSteps = rounds * this.prizes.length + offset;
      let steps = 0;
      let speed = 100;

      const step = () => {
         this.currentIndex = (this.currentIndex + 1) % this.prizes.length;
         steps++;

         if (steps >= totalSteps) {
             this.isSpinning = false;
             this.handlePrize(prizeData);
             // Refresh balance to ensure accuracy
             this.fetchBalance();
         } else {
             // Simple easing: slow down at the end
             if (totalSteps - steps < 5) {
                 speed += 50;
             }
             this.timer = setTimeout(step, speed);
         }
      };
      
      this.timer = setTimeout(step, speed);
    },
    handlePrize(prize) {
      this.$message.success(`恭喜获得 ${prize.prizeName}`);
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
  background: #f5f5f5;
}
.lottery-content {
  padding: 12px;
}
.balance-card {
  background: linear-gradient(135deg, #fff7e6 0%, #ffe0b2 100%);
  border-radius: 16px;
  padding: 16px;
  color: #7a4b00;
  box-shadow: 0 8px 20px rgba(255, 185, 90, 0.25);
  margin-bottom: 12px;
}
.balance-title {
  font-size: 12px;
  opacity: 0.8;
}
.balance-value {
  font-size: 26px;
  font-weight: 700;
  margin: 6px 0;
}
.balance-tip {
  font-size: 12px;
  color: #8b5a2b;
}
.lottery-board {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding: 12px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.04);
}
.board-cell {
  height: 88px;
  border-radius: 12px;
  background: #fff7e6;
  border: 1px solid #ffe0b2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 6px;
  padding: 6px;
  transition: transform 0.1s ease, box-shadow 0.1s ease;
}
.board-cell.active {
  background: linear-gradient(135deg, #ffd59e 0%, #ffb74d 100%);
  border-color: #ffb74d;
  box-shadow: 0 6px 12px rgba(255, 183, 77, 0.35);
  transform: translateY(-2px);
}
.board-cell.center {
  background: linear-gradient(135deg, #ffb74d 0%, #ff8a00 100%);
  border: none;
  color: #fff;
  cursor: pointer;
}
.draw-btn {
  font-size: 14px;
  font-weight: 700;
}
.draw-btn.disabled {
  opacity: 0.6;
}
.draw-cost {
  font-size: 11px;
  opacity: 0.9;
}
.prize-name {
  font-size: 13px;
  font-weight: 600;
  color: #a65b00;
}
.prize-desc {
  font-size: 11px;
  color: #8b5a2b;
}
.lottery-note {
  margin-top: 12px;
  background: #fff;
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.04);
}
.note-title {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
}
.note-text {
  font-size: 12px;
  color: #999;
}
</style>
