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

export default {
  name: 'UserPointsLottery',
  components: { PageLayout },
  data() {
    return {
      pageLoading: false,
      pointsBalance: 2458,
      costPerDraw: 50,
      isSpinning: false,
      currentIndex: 0,
      timer: null,
      prizes: [
        { name: '积分+88', type: 'points', value: 88, desc: '积分返还' },
        { name: '95折券', type: 'coupon', value: 1, desc: '全场可用' },
        { name: '免邮券', type: 'coupon', value: 1, desc: '限时有效' },
        { name: '积分+20', type: 'points', value: 20, desc: '小额返还' },
        { name: '礼品券', type: 'coupon', value: 1, desc: '指定商品' },
        { name: '积分+50', type: 'points', value: 50, desc: '积分返还' },
        { name: '优先购资格', type: 'coupon', value: 1, desc: '限量商品' },
        { name: '积分+10', type: 'points', value: 10, desc: '保底奖励' }
      ],
      gridOrder: [0, 1, 2, 5, 8, 7, 6, 3]
    };
  },
  computed: {
    gridCells() {
      const cells = new Array(9).fill(null);
      this.gridOrder.forEach((cellIndex, i) => {
        cells[cellIndex] = { ...this.prizes[i], type: 'prize' };
      });
      cells[4] = { type: 'button' };
      return cells;
    }
  },
  methods: {
    goBack() {
      this.$router.back();
    },
    cellClass(index, cell) {
      const activeIndex = this.gridOrder[this.currentIndex];
      return {
        active: cell.type === 'prize' && index === activeIndex,
        center: cell.type === 'button'
      };
    },
    startLottery() {
      if (this.isSpinning) return;
      if (this.pointsBalance < this.costPerDraw) {
        this.$message.warning('积分不足，快去赚积分吧~');
        return;
      }

      this.pointsBalance -= this.costPerDraw;
      this.isSpinning = true;

      const targetIndex = Math.floor(Math.random() * this.prizes.length);
      const rounds = 3;
      const offset = (targetIndex - this.currentIndex + this.prizes.length) % this.prizes.length;
      const totalSteps = rounds * this.prizes.length + offset;
      let steps = 0;

      this.timer = setInterval(() => {
        this.currentIndex = (this.currentIndex + 1) % this.prizes.length;
        steps += 1;
        if (steps >= totalSteps) {
          clearInterval(this.timer);
          this.timer = null;
          this.isSpinning = false;
          this.handlePrize(targetIndex);
        }
      }, 90);
    },
    handlePrize(targetIndex) {
      const prize = this.prizes[targetIndex];
      if (prize.type === 'points') {
        this.pointsBalance += prize.value;
      }
      this.$message.success(`恭喜获得 ${prize.name}`);
    },
    formatNumber(val) {
      if (val === undefined || val === null || isNaN(val)) return '0';
      return Number(val).toLocaleString();
    }
  },
  beforeUnmount() {
    if (this.timer) {
      clearInterval(this.timer);
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
