<template>
  <div class="foot-bar">
    <div class="foot-item" :class="{active: activeBtn === 1}" @click="toPage(1)">
      <div class="foot-icon">
        <i class="el-icon-s-home"></i>
      </div>
      <div class="foot-text">首页</div>
    </div>
    <div class="foot-item" :class="{active: activeBtn === 2}" @click="toPage(2)">
      <div class="foot-icon">
        <i class="el-icon-map-location"></i>
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
        <i class="el-icon-chat-dot-round"></i>
      </div>
      <div class="foot-text">消息</div>
    </div>
    <div class="foot-item" :class="{active: activeBtn === 4}" @click="toPage(4)">
      <div class="foot-icon">
        <i class="el-icon-user"></i>
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
        this.$router.push("/user/info");
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
/* Styles are already in main.css, but we can scope them if encapsulation is needed. 
   For now relying on global main.css as per legacy project structure. */
</style>
