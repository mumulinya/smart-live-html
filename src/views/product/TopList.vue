<template>
  <div class="top-list-page">
    <!-- Header -->
    <div class="top-header">
      <div class="header-back" @click="$router.go(-1)"><i class="el-icon-arrow-left"></i></div>
      <div class="header-title">{{ pageTitle }}</div>
      <div class="header-placeholder"></div>
    </div>

    <!-- Product List -->
    <div class="top-list-content" ref="listContainer" @scroll.passive="onScroll">
      <div class="deal-list-container" style="padding: 0 12px 12px;">
        <div v-for="(item, index) in shops" :key="item.id" class="product-list-item">
          <DealCard 
            :item="item" 
            :biz="sourceType === 2 ? 'group' : 'voucher'"
            :rank="index + 1"
            :is-seckill="item.activityType === 1"
            @click="toDetail(item.id)"
            @action="toDetail(item.id)"
          />
          <div v-if="getProductDisplayStatusMeta(item).visible" class="product-list-status">
            <span :class="['biz-status-chip', getStatusToneClass(getProductDisplayStatusMeta(item).tone)]">
              {{ getProductDisplayStatusMeta(item).text }}
            </span>
          </div>
        </div>
      </div>

      <!-- Loading / No More -->
      <div class="list-status" v-if="shops.length > 0">
        <div v-if="isLoading" class="loading-tip"><van-loading size="18px" /> 加载中...</div>
        <div v-else-if="noMore" class="no-more-tip">—— 已经到底了 ——</div>
      </div>

      <!-- Empty -->
      <div v-if="!isLoading && shops.length === 0" class="empty-state">
        <i class="el-icon-food" style="font-size: 48px; color: #ddd;"></i>
        <p>暂无店铺数据</p>
      </div>

      <div ref="loadSentinel" class="io-sentinel" aria-hidden="true"></div>
    </div>
  </div>
</template>

<script>
import { searchShops } from '@/api/search';
import { getProductHotRank } from '@/api/product';
import { locationUtil } from '@/utils/location';
import DealCard from '@/components/DealCard.vue';
import {
  getAuditStatusMeta,
  getBusinessStatusMeta,
  getSingleDisplayStatusMeta,
  getStatusToneClass
} from '@/utils/contentStatus';

export default {
  name: 'TopList',
  components: { DealCard },
  data() {
    return {
      shops: [],
      current: 1,
      isLoading: false,
      noMore: false,
      observer: null,
      location: { x: 113.121416, y: 23.021548 },
      sourceType: 1 // Default to voucher (category)
    }
  },
  computed: {
    pageTitle() {
      return this.sourceType === 2 ? '抢手团购榜' : '抢手好券榜';
    }
  },
  created() {
    const typeAlias = this.$route.query.type;
    if (typeAlias === 'groupBuy') this.sourceType = 2; // Category 2 for group buy
    else if (typeAlias === 'voucher') this.sourceType = 1;

    this.initLocation();
  },
  mounted() {
    this.$nextTick(() => this.setupObserver());
  },
  beforeUnmount() {
    this.destroyObserver();
  },
  methods: {
    getStatusToneClass,
    getProductDisplayStatusMeta(item) {
      return getSingleDisplayStatusMeta('product', item?.status, item?.auditStatus);
    },
    initLocation() {
      locationUtil.getLocation().then(loc => {
        this.location = { x: loc.x, y: loc.y };
        this.loadShops(true);
      }).catch(() => {
        this.loadShops(true);
      });
    },
    loadShops(reset = false) {
      if (reset) {
        this.shops = [];
        this.current = 1;
        this.noMore = false;
      }
      if (this.isLoading || this.noMore) return;

      this.isLoading = true;
      getProductHotRank({
        current: this.current,
        size: 10,
        category: this.sourceType
      }).then(res => {
        let list = [];
        if (Array.isArray(res)) list = res;
        else if (res && Array.isArray(res.list)) list = res.list;
        else if (res && res.data && Array.isArray(res.data.list)) list = res.data.list;
        else if (res && Array.isArray(res.data)) list = res.data;

        if (!list || list.length === 0) {
          this.noMore = true;
        } else {
          list.forEach(s => {
            // Resolve images
            let img = s.coverImg || s.shopLogo || s.images || '';
            if (img && !img.startsWith('http')) {
              img = (this.$fileURL || '') + img.split(',')[0];
            } else if (img) {
              img = img.split(',')[0];
            }
            s.displayImg = img;
            s.imgLoaded = false;
            s.imageError = false;
          });
          this.shops = this.shops.concat(list);
          this.current++;
        }
      }).catch(err => {
        console.error('加载店铺失败', err);
      }).finally(() => {
        this.isLoading = false;
      });
    },
    setupObserver() {
      this.destroyObserver();
      if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
      const sentinel = this.$refs.loadSentinel;
      const root = this.$refs.listContainer;
      if (!sentinel || !root) return;
      this.observer = new IntersectionObserver((entries) => {
        if (entries.some(e => e.isIntersecting)) {
          this.loadShops();
        }
      }, { root, rootMargin: '0px 0px 200px 0px', threshold: 0 });
      this.observer.observe(sentinel);
    },
    destroyObserver() {
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }
    },
    onScroll() {
      // fallback for no IntersectionObserver
      if ('IntersectionObserver' in window) return;
      const el = this.$refs.listContainer;
      if (!el) return;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 80) {
        this.loadShops();
      }
    },
    toDetail(id) {
      this.$router.push({ path: '/product/detail', query: { id } });
    },
    formatDistance(distance) {
      const n = Number(distance);
      if (!Number.isFinite(n) || n <= 0) return '';
      return n < 1000 ? `${n.toFixed(0)}m` : `${(n / 1000).toFixed(1)}km`;
    },
    formatPrice(value) {
      const num = Number(value);
      if (!Number.isFinite(num)) return '0.00';
      if (Number.isInteger(num)) return String(num);
      return num.toFixed(2).replace(/\.?0+$/, '');
    }
  }
}
</script>

<style scoped>
.top-list-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #fff5f0 0%, #f5f5f5 120px);
}

/* Header */
.top-header {
  height: 50px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  background: #fff;
  border-bottom: 1px solid rgba(0,0,0,0.05);
  flex-shrink: 0;
  position: relative;
  z-index: 10;
}
.header-back {
  width: 36px;
  font-size: 20px;
  color: #333;
  cursor: pointer;
  display: flex;
  align-items: center;
}
.header-title {
  position: absolute; left: 50%; transform: translateX(-50%); pointer-events: none;
  font-size: 17px;
  font-weight: 700;
  color: #333;
  white-space: nowrap;
}
.header-placeholder { width: 36px; }

/* List Content */
.top-list-content {
  flex: 1;
  overflow-y: auto;
  padding-top: 12px;
}
.product-list-item {
  margin-bottom: 12px;
}
.product-list-status {
  margin-top: -4px;
  padding: 0 12px 12px;
  border-radius: 0 0 16px 16px;
}
.grab-btn {
  background: linear-gradient(135deg, #ff416c, #ff4b2b);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 10px;
  cursor: pointer;
  white-space: nowrap;
}
.grab-btn:active {
  transform: scale(0.95);
}

/* Status */
.list-status {
  text-align: center;
  padding: 16px 0;
}
.loading-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
  color: #999;
}
.no-more-tip {
  font-size: 12px;
  color: #ccc;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: #999;
}

.io-sentinel { width: 100%; height: 1px; }
</style>
