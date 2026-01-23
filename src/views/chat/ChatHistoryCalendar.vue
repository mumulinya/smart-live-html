<template>
  <div class="history-calendar">
    <!-- Header -->
    <div class="header">
      <div class="header-back" @click="goBack"><i class="el-icon-arrow-left"></i></div>
      <div class="header-title">按日期查找</div>
      <div class="header-placeholder"></div>
    </div>

    <!-- Week Header -->
    <div class="week-header">
      <div class="week-item weekend">日</div>
      <div class="week-item">一</div>
      <div class="week-item">二</div>
      <div class="week-item">三</div>
      <div class="week-item">四</div>
      <div class="week-item">五</div>
      <div class="week-item weekend">六</div>
    </div>

    <!-- Calendar List -->
    <div class="calendar-list">
      <div v-for="(month, mIndex) in calendarList" :key="mIndex" class="month-block">
        <div class="month-title">{{ month.year }}年{{ month.month }}月</div>
        
        <div class="days-grid">
          <div 
            v-for="(day, dIndex) in month.days" 
            :key="dIndex"
            class="day-item"
            :class="{ 
              'active': day.dateStr && activeDates.includes(day.dateStr),
              'empty': !day.dayNum,
              'disabled': day.dayNum && !activeDates.includes(day.dateStr)
            }"
            @click="handleDayClick(day)"
          >
            <span v-if="day.dayNum">{{ day.dayNum }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getHistoryDates } from '@/api/chat';
import { ElMessage } from 'element-plus';

export default {
  name: 'ChatHistoryCalendar',
  data() {
    return {
      sessionId: null,
      activeDates: [], // 有消息的日期列表
      calendarList: [], // 日历数据
      loading: false
    };
  },
  created() {
    this.sessionId = this.$route.query.sessionId;
    this.initCalendar();
    this.loadActiveDates();
  },
  methods: {
    goBack() {
      this.$router.go(-1);
    },
    
    // 初始化日历数据 (生成最近12个月)
    initCalendar() {
      const months = [];
      const now = new Date();
      
      // 生成最近12个月的日历
      for (let i = 0; i < 12; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(this.generateMonthData(date.getFullYear(), date.getMonth() + 1));
      }
      
      this.calendarList = months;
    },
    
    // 生成单月日历数据
    generateMonthData(year, month) {
      const days = [];
      const firstDay = new Date(year, month - 1, 1);
      const lastDay = new Date(year, month, 0);
      const startWeekDay = firstDay.getDay(); // 0-6，0表示周日
      const daysInMonth = lastDay.getDate();
      
      // 填充月初空白占位
      for (let i = 0; i < startWeekDay; i++) {
        days.push({ dayNum: null, dateStr: null });
      }
      
      // 填充实际日期
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        days.push({
          dayNum: d,
          dateStr: dateStr,
          fullDate: new Date(year, month - 1, d)
        });
      }
      
      return { year, month, days };
    },
    
    // 加载活跃日期 (调用真实API)
    async loadActiveDates() {
      if (!this.sessionId) return;
      
      this.loading = true;
      try {
        const res = await getHistoryDates({ sessionId: this.sessionId });
        // 接口返回 List<String>，直接赋值
        this.activeDates = res.data || res || [];
        console.log('活跃日期列表:', this.activeDates);
      } catch (error) {
        console.error('加载活跃日期失败:', error);
        ElMessage.error('加载日期失败');
      } finally {
        this.loading = false;
      }
    },
    
    // 点击日期
    handleDayClick(day) {
      if (!day.dayNum || !day.dateStr) return;
      
      // 只有活跃日期可以点击
      if (!this.activeDates.includes(day.dateStr)) {
        return;
      }
      
      console.log('点击日期:', day.dateStr);
      
      // 携带参数返回聊天详情页
      this.$router.replace({
        path: '/chat/detail',
        query: {
          sessionId: this.sessionId,
          targetDate: day.dateStr
        }
      });
    }
  }
};
</script>

<style scoped>
.history-calendar {
  min-height: 100vh;
  background: #fff;
}

/* Header */
.header {
  height: 50px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 15px;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  z-index: 10;
}
.header-back {
  font-size: 20px;
  cursor: pointer;
  color: #333;
}
.header-title {
  font-size: 17px;
  font-weight: 600;
  color: #333;
}
.header-placeholder {
  width: 20px;
}

/* Week Header */
.week-header {
  display: flex;
  background: #fff;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
  position: sticky;
  top: 50px;
  z-index: 9;
}
.week-item {
  flex: 1;
  text-align: center;
  font-size: 13px;
  color: #333;
}
.week-item.weekend {
  color: #999;
}

/* Calendar List */
.calendar-list {
  padding: 0 10px 20px;
}

/* Month Block */
.month-block {
  margin-top: 20px;
}
.month-title {
  font-size: 14px;
  color: #999;
  padding: 10px 5px;
}

/* Days Grid */
.days-grid {
  display: flex;
  flex-wrap: wrap;
}
.day-item {
  width: calc(100% / 7);
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #333;
  cursor: pointer;
}
.day-item span {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
}
.day-item.empty {
  cursor: default;
}
.day-item.disabled {
  color: #ccc;
  cursor: not-allowed;
}
.day-item.active span {
  background: #07c160;
  color: #fff;
}
.day-item.active:hover span {
  background: #06ad56;
}
</style>
