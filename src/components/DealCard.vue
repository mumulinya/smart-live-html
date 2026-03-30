<template>
  <div class="deal-card-wrapper" @click="onClick">
    <!-- VOUCHER LAYOUT -->
    <div v-if="biz === 'voucher'" class="voucher-card">
      <div class="v-row-top">
        <!-- 券左侧 -->
        <div class="v-left">
          <template v-if="displayImage">
            <img :src="displayImage" class="v-img" alt="券图" />
            <div class="v-img-overlay">
              <span class="v-discount-text">{{ discountText }}</span>
            </div>
          </template>
          <template v-else>
            <div class="v-color-block" :style="{ background: isSeckill ? 'linear-gradient(160deg,#FF4757,#FF8C69)' : 'linear-gradient(160deg,#FF8C42,#FFB347)' }">
              <span class="v-icon">🎫</span>
              <div class="v-discount-large">{{ discountText || '特惠券' }}</div>
              <div class="v-discount-small">折扣券</div>
            </div>
          </template>
          <div v-if="isSeckill && !hideBadge" class="seckill-badge-right">⚡秒杀</div>
          <!-- 排名勋章 -->
          <div v-if="rank !== null" class="v-rank-badge" :class="rankClass">
            {{ rank }}
          </div>
        </div>

        <!-- 虚线撕边 -->
        <div class="v-divider">
          <div class="v-dash-line"></div>
          <div class="v-hole-top"></div>
          <div class="v-hole-bottom"></div>
        </div>

        <!-- 右侧内容 -->
        <div class="v-right">
          <div class="v-title" v-html="titleHtml"></div>
          <div class="v-price-row">
            <span class="v-price">¥{{ price }}</span>
            <span class="v-origin" v-if="originalPrice">¥{{ originalPrice }}</span>
          </div>
          <div class="v-date">📅 {{ validityText }}</div>
          <div class="v-seckill-time" v-if="seckillPeriodText">⏰ {{ seckillPeriodText }}</div>
          
          <div class="v-progress-bar" v-if="showStock">
            <div class="p-header">
              <span class="p-sold-text">
                已售{{ sold }}张
              </span>
              <span class="p-remain-text">剩余{{ Math.max(0, total - sold) }}张</span>
            </div>
            <div class="p-track">
              <div class="p-fill" :style="{ width: progressPct + '%', background: isHot ? 'linear-gradient(90deg,#FF4757,#FF6B81)' : 'linear-gradient(90deg,#FF6B00,#FF9A3C)' }"></div>
            </div>
          </div>
          
          <div class="v-countdown" v-if="isSeckill && status === 'active' && !isExpired">
            <span class="cd-label">距结束</span>
            <div class="cd-timer">
              <template v-if="countdown.d > 0">
                <span class="cd-box">{{ countdown.d }}</span><span class="cd-text">天</span>
              </template>
              <span class="cd-box">{{ countdown.h }}</span><span class="cd-text">时</span>
              <span class="cd-box">{{ countdown.m }}</span><span class="cd-text">分</span>
              <span class="cd-box">{{ countdown.s }}</span><span class="cd-text">秒</span>
            </div>
          </div>


        </div>
      </div>

      <div class="v-row-bottom">
        <button class="action-btn" :style="btnStyle" :disabled="statusConfig.disabled" @click.stop="onActionClick">
          {{ statusConfig.label }}
        </button>
      </div>
    </div>

    <!-- GROUP BUY LAYOUT -->
    <div v-else class="group-card">
      <!-- 顶部大图 -->
      <div class="g-top" :style="{ background: isSeckill ? 'linear-gradient(135deg,#FF4757,#FF8C69)' : 'linear-gradient(135deg,#FF6B00,#FFB347)' }">
        <template v-if="displayImage">
          <img :src="displayImage" class="g-img" alt="团购图" />
        </template>
        <template v-else>
          <div class="g-fallback">🍲</div>
        </template>
        <div class="g-overlay"></div>
        
        <div v-if="isSeckill && !hideBadge" class="seckill-badge-right-group">⚡ 秒杀</div>


        <!-- 排名勋章 -->
        <div v-if="rank !== null" class="g-rank-badge" :class="rankClass">
          {{ rank }}
        </div>
        
        <div class="g-title-row">
          <div class="g-title" v-html="titleHtml"></div>
          <div class="g-sold">已售{{ sold }}件</div>
        </div>
      </div>
      
      <!-- 下方内容 -->
      <div class="g-bottom">
        <div class="g-desc">{{ item.desc || item.subTitle || '超值团购套餐' }}</div>
        
        <div class="g-action-row">
          <div class="g-price-wrap">
            <span class="g-price">¥{{ price }}</span>
            <span class="g-origin" v-if="originalPrice">¥{{ originalPrice }}</span>
            <span class="g-discount-tag" v-if="discountText">{{ discountText }}</span>
          </div>
          <div class="g-btn-group">
            <button class="action-btn small" :style="btnStyle" :disabled="statusConfig.disabled" @click.stop="onActionClick">
              {{ statusConfig.label }}
            </button>
          </div>
        </div>
        
        <div class="g-info-row">
          <div class="g-date-block">
            <div class="g-date">📅 {{ validityText }}</div>
            <div class="g-seckill-time" v-if="seckillPeriodText">⏰ {{ seckillPeriodText }}</div>
          </div>
          <div v-if="showStock" class="g-stock">剩余{{ Math.max(0, total - sold) }}件</div>
        </div>
        


        <div class="v-countdown g-countdown" v-if="isSeckill && status === 'active' && !isExpired">
          <span class="cd-label">距结束</span>
          <div class="cd-timer">
            <template v-if="countdown.d > 0">
              <span class="cd-box">{{ countdown.d }}</span><span class="cd-text">天</span>
            </template>
            <span class="cd-box">{{ countdown.h }}</span><span class="cd-text">时</span>
            <span class="cd-box">{{ countdown.m }}</span><span class="cd-text">分</span>
            <span class="cd-box">{{ countdown.s }}</span><span class="cd-text">秒</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { fileURL } from '@/utils/request';

export default {
  name: 'DealCard',
  emits: ['click', 'action'],
  props: {
    item: { type: Object, required: true },
    biz: { type: String, default: 'voucher' },
    rank: { type: [Number, String], default: null },
    hideBadge: { type: Boolean, default: false }
  },
  data() {
    return {
      now: Date.now(),
      timer: null
    };
  },
  computed: {
    rankClass() {
      const r = Number(this.rank);
      if (r === 1) return 'gold';
      if (r === 2) return 'silver';
      if (r === 3) return 'bronze';
      return '';
    },
    title() {
      if (this.item.title || this.item.name) return this.item.title || this.item.name;
      const amount = Number(this.item.originalPrice || this.item.price || 0);
      return this.biz === 'group' ? `${amount}元团购套餐` : `${amount}元代金券`;
    },
    titleHtml() {
      return this.sanitizeTitleHtml(this.title);
    },
    displayImage() {
      let img = this.item.coverImg || '';
      if (!img) return '';
      if (Array.isArray(img)) img = img[0];
      if (typeof img === 'string' && img.includes(',')) {
        img = img.split(',')[0];
      }
      return img.startsWith('http') ? img : fileURL + img;
    },
    price() {
      const n = Number(this.item.price || 0);
      return Number.isInteger(n) ? n : n.toFixed(2);
    },
    originalPrice() {
      const n = Number(this.item.originalPrice || 0);
      return n > 0 ? (Number.isInteger(n) ? n : n.toFixed(2)) : null;
    },
    discountText() {
      if (this.item.discount) return this.item.discount; 
      const payValue = Number(this.item.price);
      const actualValue = Number(this.item.originalPrice);
      if (!payValue || !actualValue || actualValue <= 0) return '';
      return `${(payValue / actualValue * 10).toFixed(1).replace('.0', '')}折`;
    },
    sold() { 
      const s = this.item.sold;
      return (s !== undefined && s !== null) ? s : (this.item.sell || this.item.soldCount || 0); 
    },
    total() { 
      const t = this.item.total;
      return (t !== undefined && t !== null) ? t : (this.item.stock || this.item.totalStock || 0) + Number(this.sold); 
    },
    showStock() { return this.isSeckill && (this.item.total !== undefined || this.item.stock !== undefined || this.item.totalStock !== undefined); },
    progressPct() {
      if (!this.total) return 0;
      return Math.min((this.sold / this.total) * 100, 100);
    },

    validityText() {
      const validityType = Number((this.item.validityType ?? this.item.validity_type) || 0);
      const useStart = this.formatDate(this.item.useStartTime ?? this.item.use_start_time);
      const useEnd = this.formatDate(this.item.useEndTime ?? this.item.use_end_time);

      if (validityType === 1) {
        if (useStart && useEnd) return `${useStart}至${useEnd}可用`;
        if (useStart) return `${useStart}起可用`;
        if (useEnd) return `${useEnd}到期`;
      }

      if (validityType === 2) {
        const days = Number((this.item.validDays ?? this.item.valid_days) || 0);
        if (Number.isFinite(days) && days > 0) return `购买后${days}天有效`;
      }

      if (useStart && useEnd) return `${useStart}至${useEnd}可用`;
      if (useStart) return `${useStart}起可用`;
      if (useEnd) return `${useEnd}到期`;
      if (this.item.validDate) return this.item.validDate;
      return '长期有效';
    },
    seckillPeriodText() {
      if (!this.isSeckill) return '';
      const start = this.formatDate(this.item.beginTime ?? this.item.begin_time, true);
      const end = this.formatDate(this.item.endTime ?? this.item.end_time, true);
      if (start && end) return `${start} - ${end}`;
      if (start) return `${start}开抢`;
      if (end) return `${end}结束`;
      return '';
    },
    endTimeMs() { 
      const rawEndTime = this.item.endTime ?? this.item.end_time;
      if (!rawEndTime) return 0;
      const val = (!isNaN(rawEndTime) && !isNaN(parseFloat(rawEndTime))) ? Number(rawEndTime) : rawEndTime;
      return new Date(val).getTime() || 0;
    },
    isExpired() { return this.endTimeMs > 0 && this.now >= this.endTimeMs; },
    status() {
      if (this.item.status === 'ended' || this.isExpired) return 'ended';
      if (this.item.status === 'soldout' || (this.total > 0 && this.sold >= this.total)) return 'soldout';
      const rawBeginTime = this.item.beginTime ?? this.item.begin_time;
      if (this.isSeckill && rawBeginTime) {
          const val = (!isNaN(rawBeginTime) && !isNaN(parseFloat(rawBeginTime))) ? Number(rawBeginTime) : rawBeginTime;
          const beginTimeMs = new Date(val).getTime();
          if (this.now < beginTimeMs) return 'upcoming';
      }
      return 'active';
    },
    statusConfig() {
      if (this.status === 'upcoming') {
          return { label: '等待开抢', bg: '#f0f0f0', color: '#bbb', disabled: true };
      }
      if (this.status === 'ended') {
          return { label: '已结束', bg: '#f0f0f0', color: '#bbb', disabled: true };
      }
      if (this.status === 'soldout') {
          return { label: '已抢完', bg: '#f0f0f0', color: '#bbb', disabled: true };
      }
      return { 
          label: '立即抢购',
          bg: 'linear-gradient(90deg,#FF6B00,#FF9A3C)',
          color: '#fff', 
          disabled: false 
      };
    },
    btnStyle() {
      return {
        background: this.statusConfig.disabled ? '#f0f0f0' : this.statusConfig.bg,
        color: this.statusConfig.disabled ? '#bbb' : this.statusConfig.color,
        cursor: this.statusConfig.disabled ? 'not-allowed' : 'pointer',
        boxShadow: this.statusConfig.disabled ? 'none' : '0 3px 10px rgba(255,107,0,0.3)'
      };
    },
    countdown() {
      if (!this.endTimeMs || this.now >= this.endTimeMs) return { d: 0, h: '00', m: '00', s: '00' };
      const left = this.endTimeMs - this.now;
      const d = Math.floor(left / 86400000);
      const h = String(Math.floor((left % 86400000) / 3600000)).padStart(2, '0');
      const m = String(Math.floor((left % 3600000) / 60000)).padStart(2, '0');
      const s = String(Math.floor((left % 60000) / 1000)).padStart(2, '0');
      return { d, h, m, s };
    }
  },
  mounted() {
    if (this.isSeckill) {
      this.timer = setInterval(() => { this.now = Date.now(); }, 1000);
    }
  },
  beforeUnmount() {
    if (this.timer) clearInterval(this.timer);
  },
  methods: {
    escapeHtml(value) {
      return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },
    sanitizeInlineStyle(styleText) {
      if (!styleText) return '';
      const allowedProps = new Set([
        'color',
        'font-size',
        'font-weight',
        'font-style',
        'text-decoration',
        'background-color'
      ]);

      return styleText
        .split(';')
        .map((chunk) => chunk.trim())
        .filter(Boolean)
        .map((chunk) => {
          const index = chunk.indexOf(':');
          if (index < 0) return '';
          const prop = chunk.slice(0, index).trim().toLowerCase();
          const value = chunk.slice(index + 1).trim();
          if (!allowedProps.has(prop)) return '';
          if (!value || /url\s*\(|expression\s*\(|javascript:/i.test(value)) return '';
          return `${prop}: ${value}`;
        })
        .filter(Boolean)
        .join('; ');
    },
    sanitizeTitleHtml(value) {
      const raw = String(value ?? '');
      if (!/<[^>]+>/.test(raw)) {
        return this.escapeHtml(raw);
      }
      if (typeof document === 'undefined') {
        return this.escapeHtml(raw);
      }

      const container = document.createElement('div');
      container.innerHTML = raw;
      const allowedTags = new Set(['span', 'strong', 'b', 'em', 'i', 'u', 'br']);

      const walk = (node) => {
        Array.from(node.childNodes).forEach((child) => {
          if (child.nodeType !== 1) return;

          const tag = child.tagName.toLowerCase();
          if (!allowedTags.has(tag)) {
            const children = Array.from(child.childNodes);
            child.replaceWith(...children);
            children.forEach((nested) => walk(nested));
            return;
          }

          Array.from(child.attributes).forEach((attr) => {
            if (attr.name !== 'style') {
              child.removeAttribute(attr.name);
            }
          });

          const safeStyle = this.sanitizeInlineStyle(child.getAttribute('style'));
          if (safeStyle) child.setAttribute('style', safeStyle);
          else child.removeAttribute('style');

          walk(child);
        });
      };

      walk(container);
      return container.innerHTML;
    },
    formatDate(value, withTime = false) {
      if (value === undefined || value === null || value === '') return '';
      const val = (!isNaN(value) && !isNaN(parseFloat(value))) ? Number(value) : value;
      const date = new Date(val);
      if (Number.isNaN(date.getTime())) return '';

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      if (!withTime) return `${year}-${month}-${day}`;

      const hour = String(date.getHours()).padStart(2, '0');
      const minute = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day} ${hour}:${minute}`;
    },
    onClick() {
      this.$emit('click', this.item);
    },
    onActionClick() {
      if (this.statusConfig.disabled) return;
      this.$emit('action', this.item);
    }
  }
};
</script>

<style scoped>
@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes bellShake {
  0%,100% { transform: rotate(0); }
  20% { transform: rotate(-18deg); }
  40% { transform: rotate(18deg); }
  60% { transform: rotate(-12deg); }
  80% { transform: rotate(8deg); }
}

.deal-card-wrapper {
  animation: fadeSlideIn 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) both;
  margin-bottom: 14px;
  width: 100%;
}

/* Base Card Styles */
.voucher-card, .group-card {
  background: #ffffff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  will-change: transform, box-shadow;
}

.deal-card-wrapper:active .voucher-card,
.deal-card-wrapper:active .group-card {
  transform: scale(0.98);
}

/* VOUCHER CARD */
.v-row-top { display: flex; }
.v-left {
  width: 100px;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.v-img {
  width: 100%; height: 100%;
  object-fit: cover;
  display: block;
}
.v-img-overlay {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
  padding: 16px 8px 8px;
  display: flex;
  justify-content: center;
}
.v-discount-text { color: #fff; font-size: 16px; font-weight: 800; text-shadow: 0 2px 4px rgba(0,0,0,0.3); }

.v-icon { font-size: 32px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1)); }
.v-discount-large {
  color: #fff;
  font-size: 18px; font-weight: 800; margin-top: 6px;
  text-shadow: 0 1px 2px rgba(0,0,0,0.15);
}
.v-discount-small {
  color: rgba(255,255,255,0.85);
  font-size: 11px; margin-top: 2px; font-weight: 500;
}

/* Glassmorphism Badges */
.seckill-badge-right {
  position: absolute;
  top: 8px; right: 0;
  background: rgba(255, 71, 87, 0.85);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  color: #fff;
  font-size: 10px;
  padding: 3px 6px 3px 8px;
  border-radius: 10px 0 0 10px;
  font-weight: 800;
  box-shadow: -2px 2px 8px rgba(255, 71, 87, 0.3);
}

.v-divider {
  width: 14px;
  background: #f8f9fa;
  flex-shrink: 0;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.v-dash-line {
  width: 1px; height: 100%;
  background: repeating-linear-gradient(to bottom, #dcdcdc 0, #dcdcdc 6px, transparent 6px, transparent 12px);
}
.v-hole-top, .v-hole-bottom {
  position: absolute;
  width: 18px; height: 18px;
  background: #f8f9fa;
  border-radius: 50%;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.03);
}
.v-hole-top { top: -9px; }
.v-hole-bottom { bottom: -9px; }

.v-right {
  flex: 1;
  padding: 14px 14px 14px 10px;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.v-title {
  font-size: 16px; font-weight: 700; color: #1a1a1a;
  margin-bottom: 8px; line-height: 1.35;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.v-price-row { display: flex; align-items: baseline; gap: 8px; margin-bottom: 4px; }
.v-price { font-size: 26px; font-weight: 800; color: #FF4757; line-height: 1; letter-spacing: -0.5px; }
.v-origin { font-size: 12px; color: #b0b0b0; text-decoration: line-through; }
.v-date { font-size: 11px; color: #a0a0a0; margin-top: auto; }
.v-seckill-time { font-size: 11px; color: #ff6b00; margin-top: 4px; line-height: 1.3; }

.v-progress-bar { margin-top: 10px; }
.p-header {
  display: flex; justify-content: space-between;
  font-size: 11px; color: #999; margin-bottom: 4px;
}
.p-sold-text { font-weight: 500; }
.p-track {
  height: 6px; background: #f0f0f0; border-radius: 4px; overflow: hidden;
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.05);
}
.p-fill { 
  height: 100%; border-radius: 4px; 
  transition: width 0.5s ease-out;
}

.v-countdown { 
  display: flex; 
  align-items: center; 
  gap: 8px; 
  margin-top: 10px;
  background: rgba(255, 71, 87, 0.04);
  padding: 6px 10px;
  border-radius: 8px;
  width: fit-content;
}
.cd-label { 
  font-size: 11px; 
  color: #666; 
  font-weight: 600; 
  flex-shrink: 0;
}
.cd-timer {
  display: flex;
  align-items: center;
  gap: 3px;
}
.cd-box {
  background: linear-gradient(135deg, #FF4757, #ff6b81);
  color: #fff; 
  font-size: 11px;
  min-width: 20px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px; 
  font-weight: 800;
  box-shadow: 0 2px 4px rgba(255,71,87,0.2);
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
}
.cd-text { color: #888; font-size: 10px; font-weight: 500; margin: 0 1px; }

.v-row-bottom {
  display: flex;
  border-top: 1px dashed #f0f0f0;
  padding: 10px 14px;
  gap: 10px;
  background: #fafafa;
}

/* Buttons */
.action-btn {
  flex: 1; height: 38px; border-radius: 19px; border: none;
  font-size: 14px; font-weight: 800; letter-spacing: 0.5px;
  transition: all 0.2s ease;
}
.action-btn:active:not(:disabled) { transform: scale(0.96); }
.action-btn.small {
  height: 34px; padding: 0 14px; font-size: 12px; flex: none; min-width: 76px;
}

/* GROUP BUY CARD */
.g-top {
  position: relative; height: 160px; overflow: hidden;
}
.g-img {
  width: 100%; height: 100%; object-fit: cover; display: block;
  transition: transform 0.5s ease;
}
.deal-card-wrapper:hover .g-img { transform: scale(1.05); }

.g-fallback {
  display: flex; align-items: center; justify-content: center; height: 100%; font-size: 64px;
  background: linear-gradient(135deg, hsl(30, 100%, 70%), hsl(40, 100%, 65%));
}
.g-overlay {
  position: absolute; bottom: 0; left: 0; right: 0; height: 80px;
  background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
}

.seckill-badge-right-group {
  position: absolute; top: 12px; right: 0;
  background: rgba(255, 71, 87, 0.85); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.4); box-shadow: -2px 2px 8px rgba(255, 71, 87, 0.3);
  color: #fff; font-size: 11px; padding: 4px 10px 4px 12px; border-radius: 12px 0 0 12px; font-weight: 800; z-index: 3;
}


.g-title-row {
  position: absolute; bottom: 12px; left: 14px; right: 14px;
  display: flex; justify-content: space-between; align-items: flex-end; z-index: 2;
}
.g-title {
  color: #fff; font-size: 16px; font-weight: 800;
  text-shadow: 0 2px 6px rgba(0,0,0,0.5); letter-spacing: 0.5px;
}
.g-sold { color: rgba(255,255,255,0.9); font-size: 12px; font-weight: 500; text-shadow: 0 1px 3px rgba(0,0,0,0.4); }

.g-bottom { padding: 14px; }
.g-desc { font-size: 13px; color: #888; margin-bottom: 12px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

.g-action-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.g-price-wrap { display: flex; align-items: baseline; gap: 6px; flex: 1; min-width: 0; }
.g-price { font-size: 26px; font-weight: 800; color: #FF4757; letter-spacing: -0.5px; }
.g-origin { font-size: 13px; color: #b0b0b0; text-decoration: line-through; }
.g-discount-tag {
  font-size: 10px; color: #FF6B00; border: 1px solid rgba(255,107,0,0.4); background: rgba(255,107,0,0.05);
  padding: 2px 6px; border-radius: 6px; font-weight: 700; white-space: nowrap;
}
.g-btn-group { display: flex; gap: 8px; }

.g-info-row {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-top: 14px; padding-top: 10px; border-top: 1px dashed #eaeaea;
  flex-wrap: wrap; gap: 8px;
}
.g-date-block { min-width: 0; flex: 1; }
.g-date { font-size: 12px; color: #a0a0a0; font-weight: 500; }
.g-seckill-time { font-size: 11px; color: #ff6b00; line-height: 1.3; margin-top: 4px; word-break: break-all; }
.g-stock { font-size: 12px; color: #999; font-weight: 500; }

/* Rank & Hot Score */
.v-rank-badge, .g-rank-badge {
  position: absolute; top: 0; left: 0;
  width: 32px; height: 34px;
  background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
  color: #fff; display: flex; align-items: center; justify-content: center;
  font-size: 16px; font-weight: 900;
  border-radius: 0 0 16px 0; z-index: 10;
  box-shadow: 2px 2px 8px rgba(0,0,0,0.2);
}
.v-rank-badge.gold, .g-rank-badge.gold { background: linear-gradient(135deg, #FFD700, #F59E0B); color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,0.2); }
.v-rank-badge.silver, .g-rank-badge.silver { background: linear-gradient(135deg, #E2E8F0, #94A3B8); color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,0.2); }
.v-rank-badge.bronze, .g-rank-badge.bronze { background: linear-gradient(135deg, #FCD34D, #B45309); color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,0.2); }


</style>
