<template>
  <div class="foot-bar-container">
    <div class="foot-item" :class="{active: activeBtn === 1}" @click="toPage(1)">
      <div class="foot-icon">
        <i :class="activeBtn === 1 ? 'el-icon-s-home' : 'el-icon-house'"></i>
      </div>
      <div class="foot-text">首页</div>
    </div>
    <div class="foot-item" :class="{active: activeBtn === 2}" @click="toPage(2)">
      <div class="foot-icon">
        <i :class="activeBtn === 2 ? 'el-icon-location' : 'el-icon-location-information'"></i>
      </div>
      <div class="foot-text">地图</div>
    </div>
    
    <div class="foot-center" @click="toPage(0)">
      <div class="add-btn">
        <i class="el-icon-plus"></i>
      </div>
    </div>
    
    <div class="foot-item" :class="{active: activeBtn === 3}" @click="toPage(3)">
      <div class="foot-icon">
        <i :class="activeBtn === 3 ? 'el-icon-chat-round' : 'el-icon-chat-dot-round'"></i>
      </div>
      <div class="foot-text">消息</div>
    </div>
    <div class="foot-item" :class="{active: activeBtn === 4}" @click="toPage(4)">
      <div class="foot-icon">
        <i :class="activeBtn === 4 ? 'el-icon-user-solid' : 'el-icon-user'"></i>
      </div>
      <div class="foot-text">我的</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FootBar',
  props: {
    activeBtn: {
      type: Number,
      default: 1
    }
  },
  methods: {
    toPage(i) {
      if (i === 0) {
        this.$router.push("/blog/edit");
      } else if (i === 4) {
        this.$router.push("/user/profile");
      } else if (i === 1){
        this.$router.push("/");
      } else if (i === 2) {
        this.$router.push("/map");
      }
      else {
        this.$router.push("/chat/list");
      }
    }
  }
}
</script>

<style scoped>
.foot-bar-container {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 60px;
    background: white;
    display: flex;
    align-items: center;
    justify-content: space-around;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.03); /* Subtle top shadow */
    z-index: 1000;
    padding: 0 10px;
    padding-bottom: env(safe-area-inset-bottom, 5px); /* iPhone X safe area */
}

/* Tab Items */
.foot-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    height: 100%;
    cursor: pointer;
    color: #999; /* Inactive color */
    transition: all 0.2s ease;
}

.foot-item.active {
    color: #ff2442; /* Brand active color */
}

.foot-icon {
    font-size: 24px;
    margin-bottom: 2px;
}

.foot-icon i {
    transition: transform 0.2s;
}

.foot-item.active .foot-icon i {
    transform: scale(1.1);
}

.foot-text {
    font-size: 10px;
    font-weight: 500;
}

/* Center Post Button */
.foot-center {
    width: 60px;
    display: flex;
    justify-content: center;
    position: relative;
}

.add-btn {
    width: 54px;
    height: 54px;
    background: linear-gradient(to bottom right, #ff9966, #ff5e62); /* Orange to Red Gradient */
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 10px rgba(255, 94, 98, 0.4); /* Colored soft shadow */
    position: absolute;
    top: -24px; /* Pop out */
    transition: transform 0.2s;
}

.add-btn:active {
    transform: scale(0.95);
}

.add-btn i {
    color: white;
    font-size: 28px;
    font-weight: bold;
}
</style>
