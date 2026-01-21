<template>
  <div class="feed-item" :class="cardBgClass" @click="handleClick">
    
    <!-- ========== 用户笔记卡片 (Blog) ========== -->
    <template v-if="isBlogType">
      <div class="blog-header">
        <van-image round width="36" height="36" :src="item.userAvatar || item.icon" class="avatar" fit="cover">
          <template #error><div class="avatar-placeholder"></div></template>
        </van-image>
        <div class="user-meta">
          <span class="user-name">{{ item.userName || item.name || '匿名用户' }}</span>
          <span class="sub-action">发布了笔记</span>
        </div>
        <span class="time-label">{{ formatTime(item.publishTime || item.time) }}</span>
      </div>
      
      <div class="blog-body">
        <van-image width="60" height="60" :src="item.cover" radius="4" class="blog-cover" fit="cover">
          <template #error><div class="cover-placeholder small"></div></template>
        </van-image>
        <div class="blog-text">{{ item.title || item.content }}</div>
      </div>
      
      <div class="blog-footer">
        <span class="stat-item"><van-icon name="like-o" /> {{ item.likes || 0 }}</span>
        <span class="stat-item"><van-icon name="chat-o" /> {{ item.comments || 0 }}</span>
      </div>
    </template>

    <!-- ========== 商家动态卡片 (Product/Voucher) ========== -->
    <template v-else>
      <div class="product-header">
        <div class="shop-info">
          <van-image round width="32" height="32" :src="item.shopLogo || item.shopIcon" class="shop-avatar" fit="cover">
            <template #error><van-icon name="shop-o" class="shop-icon-fallback" /></template>
          </van-image>
          <div class="shop-meta">
            <span class="shop-name">{{ item.shopName || '店铺' }}</span>
            <span class="action-label" :style="{ color: eventConfig.color }">{{ actionLabel }}</span>
          </div>
        </div>
        <div class="header-right">
          <span class="time-label">{{ formatTime(item.publishTime || item.time) }}</span>
          <div v-if="eventConfig.label" class="status-badge" :style="badgeStyle">
            {{ eventConfig.label }}
          </div>
        </div>
      </div>

      <div class="product-body">
        <div class="product-info">
          <div class="price-row">
            <span class="currency">¥</span>
            <span class="main-price">{{ item.price || item.payValue }}</span>
            <span class="original-price" v-if="item.originalPrice || item.actualValue">¥{{ item.originalPrice || item.actualValue }}</span>
          </div>
          <div class="product-title">
            <van-tag plain :type="isVoucher ? 'primary' : 'success'" size="small" class="product-tag">
              {{ isVoucher ? '代金券' : '团购' }}
            </van-tag>
            <span class="title-text">{{ item.title || item.voucherName }}</span>
          </div>
          <div v-if="isVoucher && item.beginTime && item.endTime" class="seckill-time">
            <van-icon name="clock-o" size="11" />
            {{ formatSeckillTime(item.beginTime) }} - {{ formatSeckillTime(item.endTime) }}
          </div>
        </div>
        
        <button 
          class="action-btn"
          :class="{ disabled: buttonState.disabled }"
          :style="buttonStyle"
          :disabled="buttonState.disabled"
          @click.stop="handleButtonClick"
        >
          {{ buttonState.text }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { getEventConfig, getButtonState } from '@/config/feedStatus';

const props = defineProps({
  item: { type: Object, required: true }
});

const emit = defineEmits(['click', 'action']);

// 判断是否为 Blog 类型
const isBlogType = computed(() => {
  const type = props.item.dataType?.toLowerCase();
  return type === 'blog';
});

// 判断是否为代金券（根据 dataType）
const isVoucher = computed(() => {
  const type = props.item.dataType?.toLowerCase();
  return type === 'voucher' || type === 'shop_new' || type === 'restock';
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

// 按钮样式
const buttonStyle = computed(() => {
  const s = buttonState.value;
  return { color: s.disabled ? s.color : '#fff', backgroundColor: s.bgColor, borderColor: s.bgColor };
});

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

const handleClick = () => emit('click', props.item);
const handleButtonClick = () => { if (!buttonState.value.disabled) emit('action', props.item); };
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
.bg-red { background: linear-gradient(to bottom, #fff5f5, #fff0f0); box-shadow: 0 4px 12px rgba(238,10,36,0.1); }
.bg-orange { background: linear-gradient(to bottom, #fffef5, #fffbe8); box-shadow: 0 4px 12px rgba(255,151,106,0.12); }
.bg-white { background: #fff; }

/* ===== Blog Card ===== */
.blog-header { display: flex; align-items: center; margin-bottom: 12px; }
.avatar { margin-right: 10px; flex-shrink: 0; }
.avatar-placeholder { width: 36px; height: 36px; border-radius: 50%; background: #f0f0f0; }
.user-meta { display: flex; flex-direction: column; flex: 1; }
.user-name { font-size: 14px; font-weight: 600; color: #333; }
.sub-action { font-size: 12px; color: #999; margin-top: 2px; }
.time-label { font-size: 11px; color: #ccc; flex-shrink: 0; }

.blog-body { display: flex; background: #f9f9f9; padding: 10px; border-radius: 6px; margin-bottom: 10px; }
.blog-cover { flex-shrink: 0; margin-right: 10px; }
.cover-placeholder { background: #eee; border-radius: 4px; }
.cover-placeholder.small { width: 60px; height: 60px; }
.blog-text { flex: 1; font-size: 14px; color: #333; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 3; line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }

.blog-footer { display: flex; gap: 20px; }
.stat-item { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #666; }

/* ===== Product Card ===== */
.product-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
.shop-info { display: flex; align-items: center; }
.shop-avatar { margin-right: 8px; flex-shrink: 0; }
.shop-icon-fallback { font-size: 24px; color: #ff6600; background: #fff3e6; border-radius: 50%; padding: 4px; }
.shop-meta { display: flex; flex-direction: column; }
.shop-name { font-size: 15px; font-weight: 600; color: #333; }
.action-label { font-size: 12px; font-weight: 500; margin-top: 2px; }

.header-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.status-badge { font-size: 11px; font-weight: 500; padding: 3px 8px; border-radius: 10px; border: 1px solid; }

.product-body { background: #FFFBF5; border: 1px solid #FFE5D2; border-radius: 8px; padding: 12px; display: flex; justify-content: space-between; align-items: center; }
.product-info { flex: 1; margin-right: 12px; }

.price-row { display: flex; align-items: baseline; margin-bottom: 6px; }
.currency { font-size: 14px; font-weight: 700; color: #ee0a24; }
.main-price { font-size: 26px; font-weight: 700; color: #ee0a24; line-height: 1; }
.original-price { font-size: 12px; color: #999; text-decoration: line-through; margin-left: 6px; }

.product-title { display: flex; align-items: center; gap: 4px; }
.product-tag { flex-shrink: 0; }
.title-text { font-size: 14px; font-weight: 500; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 140px; }

.seckill-time { display: inline-flex; align-items: center; gap: 3px; background: #fff0f0; color: #ee0a24; font-size: 11px; padding: 2px 6px; border-radius: 4px; margin-top: 6px; font-weight: 500; }

.action-btn { padding: 8px 18px; font-size: 13px; font-weight: 500; border-radius: 18px; border: none; cursor: pointer; transition: all 0.2s; white-space: nowrap; flex-shrink: 0; }
.action-btn:not(.disabled):active { opacity: 0.85; transform: scale(0.96); }
.action-btn.disabled { cursor: not-allowed; background-color: #f5f5f5 !important; color: #ccc !important; }
</style>
