<template>
  <div class="system-notice-page">
    <div class="header">
      <div class="header-back-btn" @click="goBack"><i class="el-icon-arrow-left"></i></div>
      <div class="header-title">系统消息</div>
      <div class="header-right"></div>
    </div>

    <div class="notice-list">
      <div class="notice-item" v-for="(item, index) in notices" :key="index">
        <div class="notice-time">{{ item.time }}</div>
        <div class="notice-card">
          <div class="notice-title">{{ item.title }}</div>
          <div class="notice-content">{{ item.content }}</div>
          <div class="notice-footer" v-if="item.link" @click="toLink(item.link)">
            <span>查看详情</span>
            <i class="el-icon-arrow-right"></i>
          </div>
        </div>
      </div>

      <div v-if="notices.length === 0" class="empty-state">
          <i class="el-icon-bell"></i>
          <div>暂无系统通知</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SystemNotice',
  data() {
    return {
      notices: [
        {
          title: '欢迎加入智评生活',
          content: '感谢您注册使用智评生活APP，我们将为您提供最优质的本地生活服务体验。快去探索周边的美食和好店吧！',
          time: '2026-02-10 10:00',
          link: '/'
        },
        {
          title: '新功能上线通知',
          content: '我们上线了全新的AI助手功能，点击首页右下角的悬浮球即可体验智能问答服务。',
          time: '2026-02-08 14:30',
          link: '/ai'
        }
      ]
    }
  },
  methods: {
    goBack() {
      this.$router.go(-1);
    },
    toLink(path) {
      if(path) this.$router.push(path);
    }
  }
}
</script>

<style scoped>
.system-notice-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.header {
  height: 44px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 1px solid #eee;
}

.header-title {
  font-size: 17px;
  font-weight: 600;
  color: #333;
}

.header-back-btn {
  font-size: 20px;
  color: #333;
  cursor: pointer;
}

.notice-list {
  padding: 20px 16px;
  flex: 1;
}

.notice-item {
  margin-bottom: 24px;
}

.notice-time {
  text-align: center;
  font-size: 12px;
  color: #999;
  margin-bottom: 12px;
}

.notice-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.02);
}

.notice-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.notice-content {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  text-align: justify;
}

.notice-footer {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f5f5f5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #333;
  cursor: pointer;
}

.empty-state {
    padding: 60px 0;
    text-align: center;
    color: #999;
}
.empty-state i {
    font-size: 48px;
    margin-bottom: 10px;
    color: #ddd;
}
</style>