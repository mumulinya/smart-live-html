<template>
  <div class="top-list-page">
    <!-- Header -->
    <div class="top-header">
      <div class="header-back" @click="$router.go(-1)"><i class="el-icon-arrow-left"></i></div>
      <div class="header-title">本地必吃榜</div>
      <div class="header-placeholder"></div>
    </div>

    <!-- Shop List -->
    <div class="top-list-content" ref="listContainer" @scroll.passive="onScroll">
      <div class="rank-card" v-for="(shop, index) in shops" :key="shop.id" @click="toDetail(shop.id)">
        <div class="rank-badge" :class="{'gold': index === 0, 'silver': index === 1, 'bronze': index === 2}">
          {{ index + 1 }}
        </div>
        <div class="rank-img">
          <img :src="shop.displayImg" v-if="shop.displayImg && !shop.imageError" :class="{'is-loaded': shop.imgLoaded}" loading="lazy" @error="shop.imageError = true" @load="shop.imgLoaded = true" alt="">
          <div class="img-placeholder" v-else><i class="el-icon-goods"></i></div>
        </div>
        <div class="rank-info-new">
          <div class="rank-name">{{ shop.name }}</div>
          <div class="rank-meta-row">
            <span class="rank-score">{{ (Number(shop.score || 0) / 10).toFixed(1) }}</span>
            <van-rate :model-value="Number(shop.score || 0) / 10" readonly allow-half color="#F63" void-icon="star" void-color="#eee" size="11px" class="rank-stars" />
            <span v-if="shop.avgPrice" class="rank-price">人均 ￥{{ shop.avgPrice }}</span>
          </div>
          <div class="rank-addr-row">
            <span class="addr-icon"><i class="el-icon-location-information"></i></span>
            <span v-if="shop.area" class="rank-area">{{ shop.area }}</span>
            <span v-if="shop.distance" class="rank-distance">{{ formatDistance(shop.distance) }}</span>
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
import { getHotRank } from '@/api/shop';
import { locationUtil } from '@/utils/location';

export default {
  name: 'TopList',
  data() {
    return {
      shops: [],
      current: 1,
      isLoading: false,
      noMore: false,
      observer: null,
      location: { x: 113.121416, y: 23.021548 }
    }
  },
  created() {
    this.initLocation();
  },
  mounted() {
    this.$nextTick(() => this.setupObserver());
  },
  beforeUnmount() {
    this.destroyObserver();
  },
  methods: {
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
      getHotRank({
        current: this.current,
        x: this.location.x,
        y: this.location.y
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
            let img = s.shopLogo || s.images || '';
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
        this.noMore = true;
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
      this.$router.push({ path: '/shop/detail', query: { id } });
    },

    formatDistance(distance) {
      const n = Number(distance);
      if (!Number.isFinite(n) || n <= 0) return '';
      return n < 1000 ? `${n.toFixed(0)}m` : `${(n / 1000).toFixed(1)}km`;
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
  padding: 12px;
}

/* Rank Card */
.rank-card {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.04);
  position: relative;
  transition: transform 0.15s;
}
.rank-card:active {
  transform: scale(0.98);
}

/* Rank Badge */
.rank-badge {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #e0e0e0;
  color: #fff;
  font-size: 12px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 12px;
}
.rank-badge.gold { background: linear-gradient(135deg, #FFD700, #FFA500); box-shadow: 0 2px 6px rgba(255, 165, 0, 0.4); }
.rank-badge.silver { background: linear-gradient(135deg, #C0C0C0, #A8A8A8); box-shadow: 0 2px 6px rgba(168, 168, 168, 0.4); }
.rank-badge.bronze { background: linear-gradient(135deg, #CD7F32, #B87333); box-shadow: 0 2px 6px rgba(184, 115, 51, 0.4); }

/* Rank Image */
.rank-img {
  width: 72px;
  height: 72px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
  margin-right: 12px;
  background: #f5f5f5;
  position: relative;
}
.rank-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.rank-img .img-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ccc;
  font-size: 24px;
  background: #eee;
}

/* New Rank Info */
.rank-info-new {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.rank-name {
  font-size: 15px;
  font-weight: 700;
  color: #222;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 4px;
  min-width: 8em; /* Ensure at least 8 chars visually if possible, though nowrap/ellipsis handles the rest */
}
.rank-meta-row {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
  flex-wrap: nowrap;
}
.rank-score {
  font-size: 13px;
  font-weight: 700;
  color: #ff6633;
  margin-right: 8px;
  flex-shrink: 0;
}
.rank-stars {
  margin-right: 12px;
  flex-shrink: 0;
  white-space: nowrap;
}
.rank-price { 
  font-size: 11px;
  color: #666; 
  flex-shrink: 0;
  white-space: nowrap;
  margin-left: -4px;
}

.rank-addr-row {
  display: flex;
  align-items: center;
  font-size: 11px;
  color: #999;
  overflow: hidden;
  white-space: nowrap;
}
.addr-icon {
  margin-right: 2px;
}
.rank-area {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}
.rank-distance {
  margin-left: 6px;
  flex-shrink: 0;
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
