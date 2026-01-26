<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showToast } from 'vant';
import { getVoucherDetail, buyVoucherAPI, seckillVoucherAPI } from '@/api/shop'; 
import { toggleStar, followUser } from '@/api/interaction';
import PageLayout from '@/components/PageLayout/PageLayout.vue';

const route = useRoute();
const router = useRouter();

const info = ref({});
const validRules = computed(() => {
    if(!info.value.rules) return [];
    if(typeof info.value.rules === 'string') return [info.value.rules];
    return info.value.rules;
});

const validityTextSimple = computed(() => {
    const { validityType, useStartTime, useEndTime, validDays } = info.value;
    if (validityType === 1) {
        return `${useStartTime?.split(' ')[0] || ''} 至 ${useEndTime?.split(' ')[0] || ''}`;
    } else {
        return `领取/购买后 ${validDays} 天内有效`;
    }
});

const isSeckill = computed(() => info.value.type === 1);

const isSeckillStarted = computed(() => {
    if(!info.value.beginTime) return false;
    return new Date(info.value.beginTime).getTime() <= Date.now();
});
const isSeckillEnded = computed(() => {
    if(!info.value.endTime) return false;
    return new Date(info.value.endTime).getTime() <= Date.now();
});

const remainingEndTime = computed(() => {
    if(!info.value.endTime) return 0;
    return new Date(info.value.endTime).getTime() - Date.now();
});

const formatSeckillRange = (v) => {
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

const loadData = async () => {
    const id = route.query.id;
    if(!id) return;
    try {
        const res = await getVoucherDetail(id);
        const data = res.data || res;
        if(data) {
            info.value = data;
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
  info.value.isCollected = newState;
  
  try {
      await toggleStar({ sourceId: info.value.id, sourceType: 4, isStar: newState });
      showToast(newState ? '收藏成功' : '取消收藏');
  } catch (e) {
      info.value.isCollected = !newState; 
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
        loadData(); 
    } catch (e) {
        showToast(e.message || '抢购失败');
    }
};

const handleBtnClick = () => {
    handleBuy();
};

const openShopList = () => {
    // Just a placeholder for now, usually scrolls to shop list or opens a popup
    // For now we scroll to bottom if needed?
    // Or just no-op as the shop list is already visible below
    const el = document.querySelector('.shop-list-group');
    if(el) el.scrollIntoView({ behavior: 'smooth' });
};

const goToShop = (id) => {
    if(id) router.push(`/shop/detail?id=${id}`);
};

onMounted(() => {
    loadData();
});
</script>

<template>
  <PageLayout :loading="false" skeleton-type="detail" class="voucher-detail-page">
    <van-nav-bar title="代金券详情" left-arrow @click-left="$router.back()" fixed placeholder z-index="99" />

    <!-- Main Card -->
    <div class="main-card">
       <div class="price-row">
          <span class="currency">¥</span>
          <span class="amount">{{ info.payValue }}</span>
          <span class="original">¥{{ info.actualValue }}</span>
       </div>
       <div class="card-title">
          {{ info.title || (info.actualValue + '元代金券') }}
          <span class="tag-seckill" v-if="isSeckill">秒杀</span>
          <span class="tag-return">随时退</span>
       </div>
       
       <!-- Countdown Bar -->
       <div class="countdown-bar" v-if="isSeckill && !isSeckillEnded">
           <span class="lightning-icon">⚡</span>
           <span>倒计时: </span>
           <van-count-down :time="remainingEndTime" format="DD天HH小时mm分钟" class="custom-countdown" />
       </div>
    </div>

    <!-- Validity Time Range -->
    <div class="validity-range-bar" v-if="isSeckill">
        {{ formatSeckillRange(info) }}
    </div>

    <!-- Info Cells -->
    <div class="info-group">
        <div class="info-cell is-link" @click="openShopList">
            <div class="cell-icon icon-shop">
                <i class="el-icon-s-shop"></i>
            </div>
            <div class="cell-content">
                <div class="cell-title">适用门店</div>
                <div class="cell-sub">3家门店可用</div>
            </div>
            <i class="el-icon-arrow-right cell-arrow"></i>
        </div>
        
        <div class="info-cell">
            <div class="cell-icon icon-time">
                <i class="el-icon-time"></i>
            </div>
            <div class="cell-content">
                <div class="cell-title">有效期</div>
                <div class="cell-sub">{{ validityTextSimple }}</div>
            </div>
        </div>
    </div>

    <!-- Rules -->
    <div class="section-card">
        <div class="section-header">使用规则</div>
        <div class="rules-content">
             <div v-if="validRules.length === 0">无规则喔呵呵呵呵</div>
             <div v-else v-for="(rule, i) in validRules" :key="i">{{rule}}</div>
        </div>
    </div>

    <!-- Applicable Shops List -->
    <div class="section-card">
        <div class="section-header">适用门店列表</div>
        <div class="shop-list-group">
            <!-- Mock Data for Display as requested by UI design -->
            <div class="shop-item" @click="goToShop(info.shopId)">
                <div class="shop-name">{{ info.shopName || '家味道家常菜馆' }}</div>
                <div class="shop-addr"><i class="el-icon-location-outline"></i> {{ info.shopAddress || '佛山市禅城区张槎街道' }}</div>
                <i class="el-icon-arrow-right shop-arrow"></i>
            </div>
            <div class="shop-item" v-for="i in 2" :key="i">
                <div class="shop-name">{{ i===1?'蜀香坊川菜':'坤坤蜀味轩' }}</div>
                <div class="shop-addr"><i class="el-icon-location-outline"></i> 佛山市禅城区张槎街道</div>
                 <i class="el-icon-arrow-right shop-arrow"></i>
            </div>
        </div>
    </div>

    <!-- Bottom Bar -->
    <div class="bottom-bar-fixed">
        <div class="bar-icon-col" @click="goToShop(info.shopId)">
            <i class="el-icon-s-shop"></i>
            <span>店铺</span>
        </div>
        <div class="bar-icon-col" @click="handleCollect">
            <i :class="info.isCollected ? 'el-icon-star-on' : 'el-icon-star-off'" :style="{color: info.isCollected ? '#ff5000' : '#333'}"></i>
            <span>收藏</span>
        </div>
        <div class="bar-btn-wrapper">
            <button class="buy-btn" @click="handleBtnClick">
                🔥 立即抢购
            </button>
        </div>
    </div>

  </PageLayout>
</template>

<style scoped>
.voucher-detail-page {
    min-height: 100vh;
    background: #f7f8fa;
    padding-bottom: 80px;
    padding-top: 10px; 
}

/* Main Card */
.main-card {
    margin: 10px 16px;
    background: linear-gradient(180deg, #FFF5F2 0%, #FFF 100%);
    border-radius: 12px;
    padding: 24px 16px 16px;
    text-align: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.02);
}
.price-row {
    color: #E60012;
    display: flex;
    justify-content: center;
    align-items: baseline;
    margin-bottom: 12px;
}
.currency { font-size: 20px; font-weight: bold; margin-right: 2px; }
.amount { font-size: 48px; font-weight: bold; line-height: 1; }
.original { 
    text-decoration: line-through; 
    color: #999; 
    font-size: 16px; 
    margin-left: 8px; 
    font-weight: normal; 
}

.card-title {
    font-size: 18px;
    font-weight: bold;
    color: #333;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-bottom: 20px;
}
.tag-seckill {
    background: linear-gradient(90deg, #FF8E53, #FF6B8B);
    color: white;
    font-size: 11px;
    padding: 1px 6px;
    border-radius: 4px;
    font-weight: normal;
}
.tag-return {
    border: 1px solid #409EFF;
    color: #409EFF;
    font-size: 11px;
    padding: 0 6px;
    border-radius: 4px;
    font-weight: normal;
    background: #F0F9FF;
}

.countdown-bar {
    background: #FFE4E1; /* Light Pink */
    border-radius: 8px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #D32F2F; /* Red */
    font-weight: bold;
    font-size: 14px;
    gap: 6px;
}
.custom-countdown {
    color: #D32F2F;
    font-weight: bold;
    font-size: 14px;
}

/* Validity Range Bar */
.validity-range-bar {
    margin: 0 16px 12px;
    background: #FFF0F5;
    color: #D32F2F;
    padding: 12px 16px;
    border-radius: 8px;
    font-weight: bold;
    font-size: 14px;
}

/* Info Group */
.info-group {
    background: white;
    border-radius: 12px;
    margin: 0 16px 12px;
    overflow: hidden;
}
.info-cell {
    display: flex;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid #f5f5f5;
}
.info-cell:last-child { border-bottom: none; }
.cell-icon {
    width: 32px; height: 32px;
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    margin-right: 12px;
    color: white;
    font-size: 18px;
}
.icon-shop { background: #409EFF; }
.icon-time { background: #00C853; }
.cell-content { flex: 1; }
.cell-title { font-size: 15px; color: #333; font-weight: 600; margin-bottom: 4px; }
.cell-sub { font-size: 12px; color: #666; }
.cell-arrow { color: #ccc; }

/* Section Card */
.section-card {
    background: white;
    border-radius: 12px;
    margin: 0 16px 12px;
    padding: 16px;
}
.section-header {
    font-size: 16px;
    font-weight: bold;
    color: #333;
    margin-bottom: 16px;
}
.rules-content {
    font-size: 14px;
    color: #666;
    line-height: 1.6;
}

.shop-list-group {
    display: flex;
    flex-direction: column;
}
.shop-item {
    position: relative;
    padding: 12px 0;
    border-bottom: 1px solid #f9f9f9;
}
.shop-item:last-child { border-bottom: none; }
.shop-name { font-size: 15px; color: #333; margin-bottom: 4px; }
.shop-addr { font-size: 12px; color: #999; }
.shop-arrow { position: absolute; right: 0; top: 50%; transform: translateY(-50%); color: #ccc; }

/* Bottom Bar */
.bottom-bar-fixed {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    background: white;
    height: 60px;
    display: flex;
    align-items: center;
    padding: 0 16px;
    box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
    z-index: 100;
}
.bar-icon-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    color: #333;
    width: 50px;
    margin-right: 8px;
}
.bar-icon-col i { font-size: 20px; margin-bottom: 2px; }
.bar-btn-wrapper { flex: 1; }
.buy-btn {
    width: 100%;
    height: 44px;
    background: linear-gradient(90deg, #FF5000 0%, #FF8E53 100%);
    border-radius: 22px;
    border: none;
    color: white;
    font-size: 16px;
    font-weight: 600;
    display: flex; align-items: center; justify-content: center;
}
</style>
