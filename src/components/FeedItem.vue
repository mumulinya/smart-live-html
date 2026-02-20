<template>
  <div class="feed-item" :class="cardBgClass" @click="handleClick">
    
    <!-- ========== 用户笔记卡片 (Blog) - 大图模式 ========== -->
    <template v-if="isBlogType">
      <div class="blog-header">
        <van-image round width="32" height="32" :src="item.userAvatar || item.icon" class="avatar" fit="cover">
          <template #error><div class="avatar-placeholder"></div></template>
        </van-image>
        <div class="user-meta">
          <span class="user-name">{{ item.userName || item.name || '匿名用户' }}</span>
          <span class="sub-action">发布了笔记</span>
        </div>
        <span class="time-label">{{ formatTime(item.publishTime || item.time) }}</span>
      </div>
      
      <!-- 大图区域 -->
      <div class="blog-image-wrapper" v-if="item.cover || (item.images && item.images.length)">
        <van-image 
          width="100%" 
          :src="item.cover || item.images[0]" 
          radius="8" 
          class="blog-main-image" 
          fit="cover"
        >
          <template #error><div class="image-placeholder"></div></template>
        </van-image>
        <!-- 图集数量标签 -->
        <div class="image-count-badge" v-if="imgCount > 1">
          <van-icon name="photo-o" size="10" style="margin-right: 2px" />
          {{ imgCount }}
        </div>
      </div>
      
      <!-- 标题和摘要 -->
      <div class="blog-content">
        <div class="blog-title" v-if="item.title">{{ item.title }}</div>
        <div class="blog-summary" v-if="item.content">{{ item.content }}</div>
      </div>
      
      <!-- 底部互动栏 -->
      <div class="blog-footer">
        <span class="stat-item">
          <van-icon :name="item.isLike ? 'like' : 'like-o'" :color="item.isLike ? '#FF2442' : ''" size="18" />
          <span class="stat-num" :style="{ color: item.isLike ? '#FF2442' : '' }">{{ item.liked || item.likes || 0 }}</span>
        </span>
        <span class="stat-item">
          <van-icon name="chat-o" size="18" />
          <span class="stat-num">{{ item.comments || 0 }}</span>
        </span>
      </div>
    </template>

    <!-- ========== 商家动态卡片 (Product/Voucher) - 优惠券风格 ========== -->
    <template v-else>
      <div class="product-header">
        <div class="shop-info">
          <van-image round width="38" height="38" :src="item.shopLogo || item.shopIcon" class="shop-avatar" fit="cover">
            <template #error><van-icon name="shop-o" class="shop-icon-fallback" /></template>
          </van-image>
          <div class="shop-meta">
            <div class="shop-name">{{ item.shopName || '店铺' }}</div>
            <div class="action-text-row" :style="{ color: isSeckill ? '#FF2442' : eventConfig.color }">
               {{ (isSeckill && ['new', 'start'].includes(eventType)) ? '限时秒杀' : actionLabel }}
            </div>
          </div>
        </div>
        <div class="header-right">
          <div class="top-row">
             <span class="time-label">{{ formatTime(item.publishTime || item.time) }}</span>
             <div 
               v-if="eventConfig.label || isSeckill" 
               class="status-badge" 
               :class="{ 'outline-red': isSeckill }"
               :style="isSeckill ? {} : badgeStyle"
             >
                {{ eventConfig.label || (isSeckill ? '秒杀' : '') }}
             </div>
          </div>
        </div>
      </div>

      <!-- Type 1: 秒杀代金券 (渐变样色) -->
      <div v-if="isSeckill" class="seckill-body" @click.stop="handleButtonClick">
         <div class="seckill-top">
            <div class="price-box">
                <span class="symbol">¥</span>
                <span class="amount">{{ item.price }}</span>
                <span class="orig">¥{{ item.originalPrice }}</span>
                <span class="discount-tag" v-if="item.price && item.originalPrice">
                    {{ (item.price / item.originalPrice * 10).toFixed(1) }}折
                </span>
            </div>
            <div class="grab-btn" :class="{ disabled: buttonState.disabled }">
                {{ buttonState.disabled ? buttonState.text : '抢购中' }}
            </div>
         </div>
         
         <div class="seckill-mid">
             <span class="white-tag">商品</span>
             <span class="seckill-title">{{ item.voucherName || item.name || item.title }}</span>
         </div>
         
         <!-- 已售/剩余 进度条区域 -->
          <div class="voucher-progress-section">
              <div class="progress-label left">已售{{ item.sold || 0 }}张</div>
              <div class="progress-bar-track">
                  <div class="progress-bar-fill" :style="{ width: getProgress(item) + '%' }"></div>
              </div>
              <div class="progress-label right">剩余{{ item.stock || 0 }}张</div>
          </div>
          
          <div class="seckill-bottom">
              <div class="time-info">
                  <van-icon name="clock-o" color="#fff" size="12" style="margin-right: 2px;" />
                  {{ seckillTimeText }}
              </div>
          </div>
         <div class="seckill-bottom" v-if="getValidityText(item)">
             <div class="time-info">
                 <van-icon name="calendar-o" color="#fff" size="12" style="margin-right: 2px;" />
                 {{ getValidityText(item) }}
             </div>
         </div>
      </div>

      <!-- 非秒杀代金券 - 使用秒杀券同款样式 -->
      <div v-if="!isSeckill" class="seckill-body normal-voucher" @click.stop="handleButtonClick">
         <div class="seckill-top">
            <div class="price-box">
                <span class="symbol">¥</span>
                <span class="amount">{{ item.price }}</span>
                <span class="orig">¥{{ item.originalPrice }}</span>
                <span class="discount-tag" v-if="item.price && item.originalPrice">
                    {{ (item.price / item.originalPrice * 10).toFixed(1) }}折
                </span>
            </div>
            <div class="grab-btn" :class="{ disabled: buttonState.disabled }">
                {{ buttonState.disabled ? buttonState.text : '去看看' }}
            </div>
         </div>
         
         <div class="seckill-mid">
             <span class="white-tag">商品</span>
             <span class="seckill-title">{{ item.voucherName || item.name || item.title || (item.originalPrice + '元商品') }}</span>
         </div>
         
         <!-- 已售/剩余 进度条区域 -->
         <div class="voucher-progress-section">
             <div class="progress-label left">已售{{ item.sold || 0 }}张</div>
             <div class="progress-bar-track">
                 <div class="progress-bar-fill" :style="{ width: getProgress(item) + '%' }"></div>
             </div>
             <div class="progress-label right">剩余{{ item.stock || 0 }}张</div>
         </div>
         
         <div class="seckill-bottom" v-if="item.subTitle">
             <div class="time-info">
                 <van-icon name="clock-o" color="#fff" size="12" style="margin-right: 2px;" />
                 {{ item.subTitle }}
             </div>
         </div>
         <!-- 有效期信息 -->
         <div class="seckill-bottom" v-if="getValidityText(item)">
             <div class="time-info">
                 <van-icon name="calendar-o" color="#fff" size="12" style="margin-right: 2px;" />
                 {{ getValidityText(item) }}
             </div>
         </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { getEventConfig, getButtonState } from '@/config/feedStatus';

const props = defineProps({
  item: { type: Object, required: true }
});

const emit = defineEmits(['click', 'action']);

// 当前时间 (用于倒计时刷新)
const now = ref(Date.now());
let timer = null;

onMounted(() => {
    // 只有在是秒杀卡片时才启动定时器
    if (isSeckill.value) {
        timer = setInterval(() => {
            now.value = Date.now();
        }, 1000);
    }
});

onUnmounted(() => {
    if (timer) clearInterval(timer);
});



// 获取秒杀时间显示文本 (Dynamic)
const seckillTimeText = computed(() => {
    const item = props.item;
    if (!item.endTime) return '';
    try {
        const current = now.value; // Dependency on 'now' triggers updates
        const end = new Date(String(item.endTime).replace(/-/g, '/')).getTime();
        const diffValid = end - current;
        
        // 已过期
        if (diffValid <= 0) return '已结束';
        
        // 大于24小时，显示日期区间
        // 需要 beginTime
        const oneDay = 24 * 60 * 60 * 1000;
        if (diffValid > oneDay) {
            return `${formatSeckillTime(item.beginTime)} - ${formatSeckillTime(item.endTime)}`;
        } else {
            // 小于24小时，显示倒计时
            const h = Math.floor(diffValid / 3600000);
            const m = Math.floor((diffValid % 3600000) / 60000);
            const s = Math.floor((diffValid % 60000) / 1000);
            return `剩余 ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
        }
    } catch (e) {
        return '';
    }
});

// 判断是否为 Blog 类型
const isBlogType = computed(() => {
  const type = props.item.dataType?.toLowerCase();
  return type === 'blog';
});

// 计算图集数量
const imgCount = computed(() => {
    if (props.item.imageCount) return props.item.imageCount;
    if (!props.item.images) return 0;
    if (Array.isArray(props.item.images)) return props.item.images.length;
    // 如果是字符串，尝试按逗号分隔
    if (typeof props.item.images === 'string') {
        return props.item.images.split(',').filter(i => i).length;
    }
    return 0;
});

// 判断是否为代金券（根据 dataType）
const isVoucher = computed(() => {
  const type = props.item.dataType?.toLowerCase();
  return type === 'voucher' || type === 'shop_new' || type === 'restock';
});

// 判断是否为秒杀 (Type=1)
const isSeckill = computed(() => {
    return props.item.activityType === 1 || props.item.subType === 'start';
});

// 动作文案映射
const actionLabelMap = {
  price_drop: '降价了', restock: '补货了', start: '开抢了',
  soon_end: '即将结束', reshelf: '重新上架', new: '上新了'
};

const eventType = computed(() => props.item.subType || props.item.action || 'new');
const eventConfig = computed(() => getEventConfig(eventType.value));
const buttonState = computed(() => getButtonState(props.item));
const actionLabel = computed(() => actionLabelMap[eventType.value] || '有新动态');

// 卡片背景 class
const cardBgClass = computed(() => {
  if (isBlogType.value) return '';
  return eventConfig.value.bg || 'bg-white';
});

// 标签样式
const badgeStyle = computed(() => ({
  color: eventConfig.value.color,
  backgroundColor: eventConfig.value.labelBg,
  borderColor: eventConfig.value.color
}));

// 时间格式化
const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const date = new Date(String(timeStr).replace(/-/g, '/'));
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}天前`;
  return timeStr.split(' ')[0];
};

const formatSeckillTime = (timeStr) => {
  if (!timeStr) return '';
  const date = new Date(String(timeStr).replace(/-/g, '/'));
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${m}.${d} ${h}:${min}`;
};



const getProgress = (item) => {
    const sold = item.sold || 68;
    const total = (item.sold || 68) + (item.stock || 32);
    return Math.min(100, Math.floor((sold / total) * 100));
};

const handleClick = () => emit('click', props.item);
const handleButtonClick = () => { if (!buttonState.value.disabled) emit('action', props.item); };

const getValidityText = (item) => {
    if (item.validityType === 1 && item.useStartTime && item.useEndTime) {
        const start = item.useStartTime.split(' ')[0] || '';
        const end = item.useEndTime.split(' ')[0] || '';
        return `${start} 至 ${end} 有效`;
    } else if (item.validityType === 2 && item.validDays) {
        return `领取/购买后 ${item.validDays} 天内有效`;
    }
    return '';
};
</script>

<style scoped>
.feed-item {
  background: #fff;
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  transition: transform 0.15s;
}
.feed-item:active { transform: scale(0.99); }

/* Card Backgrounds */
.bg-red { background: linear-gradient(135deg, #fff5f5, #fff0f0); box-shadow: 0 4px 12px rgba(238,10,36,0.08); }
.bg-orange { background: linear-gradient(135deg, #fffef5, #fffbe8); box-shadow: 0 4px 12px rgba(255,151,106,0.1); }
.bg-white { background: #fff; }

/* ===== Blog Card Premium ===== */
.blog-header { display: flex; align-items: center; margin-bottom: 12px; }
.avatar { margin-right: 10px; flex-shrink: 0; }
.avatar-placeholder { width: 32px; height: 32px; border-radius: 50%; background: #f0f0f0; }
.user-meta { display: flex; flex-direction: column; flex: 1; }
.user-name { font-size: 14px; font-weight: 600; color: #333; }
.sub-action { font-size: 12px; color: #999; margin-top: 2px; }
.time-label { font-size: 11px; color: #ccc; flex-shrink: 0; }

/* 大图区域 */
.blog-image-wrapper {
  position: relative;
  margin-bottom: 12px;
  border-radius: 8px;
  overflow: hidden;
}
.blog-main-image {
  width: 100%;
  aspect-ratio: 16/9;
}
.image-placeholder {
  width: 100%;
  aspect-ratio: 16/9;
  background: #f5f5f5;
}
.image-count-badge {
  position: absolute;
  right: 8px;
  bottom: 8px;
  background: rgba(0,0,0,0.6);
  color: white;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}

/* 标题和摘要 */
.blog-content {
  margin-bottom: 12px;
}
.blog-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.blog-summary {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 底部互动栏 */
.blog-footer { display: flex; gap: 24px; }
.stat-item { 
  display: flex; 
  align-items: center; 
  gap: 4px; 
  font-size: 13px; 
  color: #666; 
}
.stat-num { font-weight: 500; }

/* ===== Product Card Premium ===== */
.product-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
.shop-info { display: flex; align-items: center; }
.shop-avatar { margin-right: 8px; flex-shrink: 0; }
.shop-icon-fallback { font-size: 20px; color: #ff6600; background: #fff3e6; border-radius: 50%; padding: 4px; }
.shop-meta { display: flex; flex-direction: column; justify-content: center; }
.shop-name { font-size: 15px; font-weight: 600; color: #333; line-height: 1.2; }
.action-text-row {
  font-size: 11px;
  font-weight: 500;
  margin-top: 4px;
}

.header-right { 
  display: flex; 
  align-items: center; 
  height: 38px; /* Match avatar height */
}
.top-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.status-badge { 
  font-size: 10px; 
  font-weight: 500; 
  padding: 1px 6px; 
  border-radius: 8px; 
  border: 1px solid; 
}

/* Normal Voucher Override (Orange Theme) */
.seckill-body.normal-voucher {
    background: linear-gradient(90deg, #FF9000 0%, #FFB600 100%);
    box-shadow: 0 4px 12px rgba(255, 144, 0, 0.2);
}
.normal-voucher .white-tag {
    color: #FF9000;
}
.outline-red {
    border-color: #FF2442 !important;
    color: #FF2442 !important;
    background: #FFF5F7 !important;
}

/* Seckill Special Style */
.seckill-body {
    background: linear-gradient(90deg, #FF3D7F 0%, #FF7300 100%);
    border-radius: 10px;
    padding: 16px;
    color: white;
    box-shadow: 0 4px 12px rgba(255, 61, 127, 0.2);
    position: relative;
    overflow: hidden;
}
.seckill-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}
.seckill-top .price-box {
    display: flex;
    align-items: baseline;
}
.seckill-top .symbol { font-size: 18px; font-weight: 700; margin-right: 2px; }
.seckill-top .amount { font-size: 34px; font-weight: 700; font-family: 'DIN Alternate', sans-serif; line-height: 1; }
.seckill-top .orig { font-size: 14px; text-decoration: line-through; margin-left: 8px; opacity: 0.8; }
.seckill-top .discount-tag {
    background: rgba(255,255,255,0.25);
    color: #fff;
    font-size: 10px;
    padding: 1px 4px;
    border-radius: 4px;
    margin-left: 6px;
    font-weight: 500;
}

.grab-btn {
    border: 1px solid rgba(255,255,255,0.8);
    background: rgba(255,255,255,0.1);
    color: white;
    font-size: 12px;
    padding: 4px 12px;
    border-radius: 12px;
    backdrop-filter: blur(4px);
}
.grab-btn.disabled {
    background: rgba(0,0,0,0.1);
    border-color: rgba(255,255,255,0.3);
    color: rgba(255,255,255,0.6);
}

.seckill-mid {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
}
.white-tag {
    background: white;
    color: #FF3D7F;
    font-size: 10px;
    padding: 1px 6px;
    border-radius: 4px;
    margin-right: 8px;
    font-weight: 600;
}
.seckill-title {
    font-size: 14px;
    font-weight: 500;
    opacity: 0.95;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.seckill-bottom {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    opacity: 0.9;
    margin-bottom: 6px;
    align-items: center;
}
.progress-info { display: flex; align-items: center; gap: 4px; }
.time-info { display: flex; align-items: center; }

.progress-bar-track {
    width: 100%;
    height: 6px;
    background: rgba(255,255,255,0.3);
    border-radius: 3px;
    overflow: hidden;
}
.progress-bar-fill {
    height: 100%;
    background: white;
    border-radius: 3px;
}

/* 代金券进度条区域 - 已售/剩余样式 */
.voucher-progress-section {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
}
.voucher-progress-section .progress-bar-track {
    flex: 1;
    height: 6px;
    background: rgba(255,255,255,0.3);
    border-radius: 3px;
    overflow: hidden;
}
.voucher-progress-section .progress-bar-fill {
    height: 100%;
    background: white;
    border-radius: 3px;
}
.voucher-progress-section .progress-label {
    font-size: 11px;
    color: rgba(255,255,255,0.9);
    white-space: nowrap;
}
.voucher-progress-section .progress-label.left {
    min-width: fit-content;
}
.voucher-progress-section .progress-label.right {
    min-width: fit-content;
    text-align: right;
}

/* 商品区域 - 原有样式 */
.product-body { 
  background: linear-gradient(135deg, #FFFBF5, #FFF8F0); 
  border: 1px solid #FFE5D2; 
  border-radius: 10px; 
  padding: 14px; 
  display: flex; 
  justify-content: space-between; 
  align-items: center;
  position: relative;
}
.product-body.has-expired {
  background: #FAFAFA;
  border-color: #eee;
}
.product-info { flex: 1; margin-right: 12px; }

.price-row { display: flex; align-items: baseline; margin-bottom: 6px; }
.currency { font-size: 16px; font-weight: 700; color: #ee0a24; }
.main-price { 
  font-size: 32px; 
  font-weight: 700; 
  color: #ee0a24; 
  line-height: 1;
  font-family: 'DIN Alternate', 'Helvetica Neue', Arial, sans-serif;
}
.original-price { font-size: 13px; color: #999; text-decoration: line-through; margin-left: 8px; }

.product-title { display: flex; align-items: center; gap: 4px; }
.product-tag { flex-shrink: 0; }
.title-text { 
  font-size: 14px; 
  font-weight: 500; 
  color: #333; 
  overflow: hidden; 
  text-overflow: ellipsis; 
  white-space: nowrap; 
  max-width: 150px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.seckill-time { 
  display: inline-flex; 
  align-items: center; 
  gap: 3px; 
  background: #fff0f0; 
  color: #ee0a24; 
  font-size: 11px; 
  padding: 3px 8px; 
  border-radius: 4px; 
  margin-top: 8px; 
  font-weight: 500; 
}

/* 渐变按钮 */
.action-btn.gradient {
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 20px;
  border: none;
  cursor: pointer;
  background: linear-gradient(135deg, #ff6b6b, #ee0a24);
  color: white;
  box-shadow: 0 4px 12px rgba(238, 10, 36, 0.3);
  transition: all 0.2s;
  white-space: nowrap;
  flex-shrink: 0;
}
.action-btn.gradient:active {
  transform: scale(0.96);
  box-shadow: 0 2px 8px rgba(238, 10, 36, 0.2);
}

/* 印章效果 */
.stamp-overlay {
  width: 70px;
  height: 70px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.stamp-overlay::before {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  border: 3px solid #ccc;
  border-radius: 50%;
  transform: rotate(-15deg);
}
.stamp-text {
  font-size: 12px;
  font-weight: 700;
  color: #ccc;
  transform: rotate(-15deg);
  text-align: center;
  line-height: 1.2;
}

/* ===== Voucher Card V2 Styles (Orange Gradient) ===== */
.voucher-card-v2-body {
    background: linear-gradient(135deg, #ff9500 0%, #ffb347 50%, #ffc980 100%);
    border-radius: 12px;
    padding: 16px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    box-shadow: 0 4px 12px rgba(255, 149, 0, 0.2);
}

.voucher-card-v2-body.has-expired {
    background: linear-gradient(135deg, #bbb 0%, #ccc 100%);
    box-shadow: none;
}

.voucher-v2-price-section {
    flex: 1;
}

.voucher-v2-current-price {
    display: flex;
    align-items: baseline;
    color: #fff;
    margin-bottom: 4px;
}

.voucher-v2-current-price .price-symbol {
    font-size: 16px;
    font-weight: 500;
}

.voucher-v2-current-price .price-value {
    font-size: 38px;
    font-weight: 700;
    line-height: 1;
    font-family: 'DIN Alternate', sans-serif;
}

.voucher-v2-original-info {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
}

.voucher-v2-original-info .original-price {
    font-size: 14px;
    color: rgba(255,255,255,0.8);
    text-decoration: line-through;
}

.voucher-v2-original-info .discount-badge {
    background: rgba(255,255,255,0.25);
    color: #fff;
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 500;
}

.voucher-v2-sold-info {
    font-size: 12px;
    color: rgba(255,255,255,0.9);
    margin-bottom: 6px;
}

.voucher-v2-progress-bar {
    width: 70%;
    height: 6px;
    background: rgba(255,255,255,0.3);
    border-radius: 3px;
    overflow: hidden;
}

.voucher-v2-progress-bar .progress-fill {
    height: 100%;
    background: rgba(255,255,255,0.9);
    border-radius: 3px;
}

.voucher-v2-action-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
}

.voucher-v2-buy-btn {
    background: #fff;
    color: #ff5000;
    border: none;
    padding: 10px 20px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.voucher-v2-buy-btn:active {
    transform: scale(0.98);
}

.voucher-v2-disabled-btn {
    background: rgba(255,255,255,0.5);
    color: #999;
    padding: 10px 20px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 600;
}

.voucher-v2-stock {
    font-size: 12px;
    color: rgba(255,255,255,0.9);
}

/* Voucher Header (Title and Validity - at top) */
.voucher-v2-header {
    margin-bottom: 10px;
}

.voucher-v2-header .title-text {
    font-size: 16px;
    font-weight: 600;
    color: #333;
}

/* Voucher Footer (Title, Time, Validity) */
.voucher-v2-footer {
    margin-top: 12px;
    padding-top: 10px;
    border-top: 1px solid #f0f0f0;
}

.voucher-v2-title {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
}

.voucher-v2-tag {
    flex-shrink: 0;
}

.voucher-v2-footer .title-text {
    font-size: 14px;
    font-weight: 500;
    color: #333;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.voucher-v2-time, .voucher-v2-validity {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #999;
    margin-top: 4px;
}

.voucher-v2-time {
    color: #ff5000;
}
</style>
