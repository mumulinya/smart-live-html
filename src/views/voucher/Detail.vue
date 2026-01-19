<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showToast } from 'vant';
import { getVoucherDetail, buyVoucherAPI, seckillVoucherAPI } from '@/api/shop'; 
import { toggleStar, followUser } from '@/api/interaction';

const route = useRoute();
const router = useRouter();

const info = ref({});
const validRules = computed(() => {
    if(!info.value.rules) return [];
    // Assuming rules might be a string (as in user sample) or array
    if(typeof info.value.rules === 'string') return [info.value.rules];
    return info.value.rules;
});

const validityText = computed(() => {
  const { validityType, useStartTime, useEndTime, validDays } = info.value;
  
  if (validityType === 1) {
    // Fixed Date: "2023-10-01 至 2023-12-31 有效"
    const start = useStartTime?.split(' ')[0] || '';
    const end = useEndTime?.split(' ')[0] || '';
    return `${start} 至 ${end} 有效`;
  } else {
    // Dynamic Days: "领取后 7 天内有效"
    return `领取/购买后 ${validDays} 天内有效`;
  }
});

// Computed for Seckill status
const isSeckill = computed(() => info.value.type === 1); // User sample says type: 1 for seckill? Or 2? 
// User snippet: "type": 1, "title": "...100元代金券". Wait, user snippet is Type 1. 
// Standard logic usually: 1=Normal, 2=Seckill? Or 1=Seckill? 
// In ShopDetail.vue logic: "v.type === 1 ? '秒杀券' : '代金券'". So Type 1 IS Seckill.
// My previous mock used type: 2. I should correct this to type === 1.

const isSeckillStarted = computed(() => {
    if(!info.value.beginTime) return false;
    return new Date(info.value.beginTime).getTime() <= Date.now();
});
const isSeckillEnded = computed(() => {
    if(!info.value.endTime) return false;
    return new Date(info.value.endTime).getTime() <= Date.now();
});

const remainingTime = computed(() => {
    if(!info.value.beginTime) return 0;
    return new Date(info.value.beginTime).getTime() - Date.now();
});

const remainingEndTime = computed(() => {
    if(!info.value.endTime) return 0;
    return new Date(info.value.endTime).getTime() - Date.now();
});

const formatSeckillTime = (v) => {
    if(!v.beginTime || !v.endTime) return '';
    const format = (str) => {
        const d = new Date(str);
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const h = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        return `${m}.${day} ${h}:${min}`;
    };
    return `${format(v.beginTime)} - ${format(v.endTime)}`;
};

// Actions
const loadData = async () => {
    const id = route.query.id;
    if(!id) return;
    try {
        const res = await getVoucherDetail(id);
        const data = res.data || res;
        if(data) {
            info.value = data;
            // Use field from API directly
            if (data.isStar !== undefined) {
               info.value.isCollected = data.isStar;
            } else if (data.isStared !== undefined) {
               info.value.isCollected = data.isStared;
            } else {
               info.value.isCollected = false;
            }
        }
    } catch (e) {
        console.error(e);
        showToast('加载失败');
    }
};



const handleCollect = async () => {
  if(!localStorage.getItem('token')) return router.push('/user/login');
  
  const newState = !info.value.isCollected;
  // Optimistic update
  info.value.isCollected = newState;
  
  try {
      // API expects { isStar: boolean } not isCollection
      await toggleStar({ sourceId: info.value.id, sourceType: 4, isStar: newState });
      showToast(newState ? '收藏成功' : '取消收藏');
  } catch (e) {
      info.value.isCollected = !newState; // Revert
      showToast('操作失败');
  }
};

const handleFollowSeckill = async () => {
  if(!localStorage.getItem('token')) return router.push('/user/login');

  const nextStatus = !info.value.isFollow;
  
  // Optimistic update
  info.value.isFollow = nextStatus;

  try {
      await followUser({
          sourceId: info.value.id,
          sourceType: 4, // Voucher Seckill Reminder
          isFollow: nextStatus
      });
      showToast(nextStatus ? '开抢前将提醒您' : '已取消提醒');
  } catch (error) {
       // Revert
       info.value.isFollow = !nextStatus;
       console.error(error);
       showToast('操作失败');
  }
};

const handleBuy = async () => {
    if(!localStorage.getItem('token')) return router.push('/user/login');
    
    try {
        const api = isSeckill.value ? seckillVoucherAPI : buyVoucherAPI;
        if(isSeckill.value) {
            if(!isSeckillStarted.value) return showToast('抢购未开始');
            if(isSeckillEnded.value) return showToast('抢购已结束');
            if(info.value.stock < 1) return showToast('已抢光');
        }
        
        await api(info.value.id);
        showToast('抢购成功');
        // Refresh?
        loadData(); 
    } catch (e) {
        showToast(e.message || '抢购失败');
    }
};

const buttonState = computed(() => {
    const { type, stock, isFollow } = info.value;
    const nowTime = Date.now();
    
    // 1. BUY Mode: Seckill Ongoing AND Stock > 0
    if (isSeckill.value) {
        // Seckill Logic
        if (isSeckillStarted.value && !isSeckillEnded.value && stock > 0) {
            return { type: 'danger', text: '立即抢购', disabled: false, action: 'buy' };
        }
        
        let label = '开抢提醒';
        if (stock <= 0) label = '缺货提醒';
        else if (isSeckillEnded.value) label = '下场提醒';
        
        return { 
            type: 'warning', 
            text: isFollow ? '已设提醒' : label, 
            disabled: false, 
            action: 'remind' 
        };
    } else {
        return { type: 'danger', text: '立即抢购', disabled: false, action: 'buy' };
    }
});

const handleBtnClick = () => {
    if (buttonState.value.action === 'buy') {
        handleBuy();
    } else {
        handleFollowSeckill();
    }
};

onMounted(() => {
    loadData();
});
</script>

<template>
  <div class="voucher-detail">
    <van-nav-bar title="代金券详情" left-arrow @click-left="$router.back()" fixed placeholder />

    <div class="ticket-container">
      <div class="ticket-main">
        <div class="price-col">
          <span class="symbol">¥</span>
          <span class="amount">{{ info.payValue }}</span>
          <div class="original" v-if="info.actualValue">¥{{ info.actualValue }}</div>
        </div>
        <div class="info-col">
          <div class="title" v-html="info.title"></div>
          <div class="tags">
            <van-tag type="warning" v-if="isSeckill">秒杀</van-tag>
            <van-tag plain type="primary">随时退</van-tag>
          </div>
        </div>
      </div>
      <div class="seckill-bar" v-if="isSeckill">
        <div class="seckill-left">
            <span>{{ formatSeckillTime(info) }}</span>
        </div>
        <div class="seckill-right" v-if="!isSeckillEnded && !isSeckillStarted && remainingTime < 86400000">
            <span>距开抢：</span>
            <van-count-down :time="remainingTime" />
        </div>
         <div class="seckill-right" v-else-if="!isSeckillEnded && remainingEndTime < 86400000">
            <span>距结束：</span>
            <van-count-down :time="remainingEndTime" />
        </div>
      </div>
    </div>

    <div class="section-group">
      <van-cell title="适用门店" :value="info.shopName" is-link :to="`/shop/detail?id=${info.shopId}`" icon="shop-o" />
      <van-cell title="有效期" :label="validityText" icon="clock-o" />
      
      <div class="rules-box">
        <div class="section-title">使用规则</div>
        <div class="rule-item" v-for="(rule, index) in validRules" :key="index">
          • {{ rule }}
        </div>
      </div>
    </div>

    <van-action-bar>
      <van-action-bar-icon icon="shop-o" text="店铺" :to="`/shop/detail?id=${info.shopId}`" />
      
      <van-action-bar-icon 
        :icon="info.isCollected ? 'star' : 'star-o'" 
        :text="info.isCollected ? '已收藏' : '收藏'" 
        :color="info.isCollected ? '#ff5000' : '#666'"
        @click="handleCollect" 
      />

      <van-action-bar-button 
         :type="buttonState.type" 
         :text="buttonState.text" 
         @click="handleBtnClick" 
      />
    </van-action-bar>
  </div>
</template>

<style scoped>
.voucher-detail { min-height: 100vh; background: #f7f8fa; padding-bottom: 60px; }
.ticket-container { margin: 12px; background: white; border-radius: 8px; overflow: hidden; }
.ticket-main { display: flex; padding: 20px; background: linear-gradient(135deg, #fff5f2 0%, #fff 100%); }
.price-col { color: #ff5000; margin-right: 16px; text-align: center; }
.amount { font-size: 32px; font-weight: bold; }
.original { text-decoration: line-through; color: #999; font-size: 12px; }
.info-col { flex: 1; }
.title { font-size: 16px; font-weight: bold; margin-bottom: 8px; }
.tags { display: flex; gap: 5px; }
.seckill-bar { background: #ffeae6; padding: 8px 16px; color: #ff5000; display: flex; align-items: center; justify-content: space-between; font-size: 13px; gap: 10px; }
.seckill-right { display: flex; align-items: center; gap: 4px; }
.section-group { margin: 12px; background: white; border-radius: 8px; overflow: hidden; }
.rules-box { padding: 16px; }
.section-title { font-weight: bold; margin-bottom: 10px; font-size: 15px; }
.rule-item { color: #666; font-size: 13px; margin-bottom: 4px; line-height: 1.5; }
</style>
