<template>
  <div class="deal-page" :class="{ compact: isCompactHeader, 'seckill-mode': isSeckillMode }">
    <div class="header">
      <div class="header-back-btn" @click="goBack"><i class="el-icon-arrow-left header-back-icon"></i></div>

      <div class="header-title" v-if="!isSearchMode">{{ isSeckillMode ? '秒杀专区' : '优惠专区' }}</div>
      <div class="header-search-input" v-else>
        <i class="el-icon-search input-icon"></i>
        <input
          v-model="searchText"
          placeholder="搜索商家或优惠"
          @keyup.enter="doSearch"
          ref="searchInput"
        >
        <i class="el-icon-close clear-icon" v-if="searchText" @click="clearSearch"></i>
      </div>

      <div class="header-actions">
        <div class="header-search-btn" @click="handleSearchAction">
          <span v-if="isSearchMode">{{ searchText.trim() ? '搜索' : '取消' }}</span>
          <i class="el-icon-search header-search-icon" v-else></i>
        </div>
      </div>
    </div>

    <div class="biz-tabs" v-if="!isSeckillMode">
      <button
        class="biz-tab"
        :class="{ active: biz === 'voucher' }"
        @click="changeBiz('voucher')"
      >
        代金券
      </button>
      <button
        class="biz-tab"
        :class="{ active: biz === 'group' }"
        @click="changeBiz('group')"
      >
        团购
      </button>
    </div>

    <div class="filter-wrapper">
      <div class="meituan-filter-bar" v-if="!isSeckillMode">
        <div class="filter-item" :class="{ active: activeFilterTab === 'distance' }" @click="toggleFilterTab('distance')">
          <div class="filter-text">{{ getDistanceLabel() }} <i class="el-icon-arrow-down"></i></div>
        </div>
        <div class="filter-item" :class="{ active: activeFilterTab === 'shopType' }" @click="toggleFilterTab('shopType')">
          <div class="filter-text">{{ getShopTypeLabel() }} <i class="el-icon-arrow-down"></i></div>
        </div>
        <div class="filter-item" :class="{ active: activeFilterTab === 'sort' }" @click="toggleFilterTab('sort')">
          <div class="filter-text">{{ getSortLabel() }} <i class="el-icon-arrow-down"></i></div>
        </div>
        <div
          class="filter-item filter-item-more"
          :class="{ active: activeFilterTab === 'service' || !!selectedServiceFilter }"
          @click="toggleFilterTab('service')"
        >
          <div class="filter-text">
            <i class="el-icon-s-operation filter-funnel-icon"></i>
            <span>{{ getServiceFilterLabel() }}</span>
          </div>
        </div>
      </div>
      <div class="meituan-filter-bar seckill-filter-bar" v-if="isSeckillMode">
         <div class="filter-item" :class="{ active: activeFilterTab === 'timeSlot' }" @click="toggleFilterTab('timeSlot')">
          <div class="filter-text">{{ getSeckillTimeLabel() }} <i class="el-icon-arrow-down"></i></div>
         </div>
         <div class="filter-item" :class="{ active: activeFilterTab === 'shopType' }" @click="toggleFilterTab('shopType')">
          <div class="filter-text">{{ getShopTypeLabel() }} <i class="el-icon-arrow-down"></i></div>
         </div>
      </div>
      <div class="filter-content" :class="{ show: !!activeFilterTab }">
        <div v-if="activeFilterTab === 'distance' && !isSeckillMode" class="distance-panel">
          <div class="distance-options">
            <div
              class="distance-option"
              :class="{ active: selectedDistance === item.value }"
              v-for="item in distanceOptions"
              :key="item.value || 'all'"
              @click="selectDistance(item.value)"
            >
              {{ item.label }}
            </div>
          </div>
        </div>
        
        <div v-if="activeFilterTab === 'timeSlot' && isSeckillMode" class="time-slot-panel">
          <div class="panel-title">秒杀时段</div>
          <div class="time-slot-options">
            <div
              class="time-slot-option"
              :class="{ active: selectedTimeSlot === item.value }"
              v-for="item in timeSlotOptions"
              :key="item.value || 'all'"
              @click="selectTimeSlot(item.value)"
            >
              {{ item.label }}
            </div>
          </div>
        </div>

        <div v-if="activeFilterTab === 'shopType'" class="shop-type-panel">
          <div class="panel-title">商户分类</div>
          <div class="shop-type-grid">
            <div
              class="shop-type-item"
              :class="{ active: selectedShopType === null }"
              @click="selectShopType(null)"
            >
              全部分类
            </div>
            <div
              class="shop-type-item"
              :class="{ active: Number(selectedShopType) === Number(t.id) }"
              v-for="t in shopTypes"
              :key="t.id"
              @click="selectShopType(Number(t.id))"
            >
              {{ t.name }}
            </div>
          </div>
        </div>
        <div v-if="activeFilterTab === 'sort'" class="sort-panel">
          <div class="panel-title">排序方式</div>
          <div class="sort-options">
            <div
              class="sort-option"
              :class="{ active: selectedSort === item.value }"
              v-for="item in sortOptions"
              :key="item.value"
              @click="selectSort(item.value)"
            >
              {{ item.label }}
            </div>
          </div>
        </div>
        <div v-if="activeFilterTab === 'service'" class="service-panel">
          <div class="panel-title">服务筛选</div>
          <div class="service-option-group">
            <div
              class="service-option"
              :class="{ active: selectedServiceFilter === option.value }"
              v-for="option in serviceFilterOptions"
              :key="option.value || 'all'"
              @click="selectServiceFilter(option.value)"
            >
              {{ option.label }}
            </div>
          </div>
        </div>
      </div>
    </div>
    

    <div class="deal-list" @scroll.passive="onScroll">
      <div v-if="loading && deals.length === 0" class="state-box">加载中...</div>
      <div v-else-if="displayDeals.length === 0" class="empty-state">
        <template v-if="isSeckillMode">
          <div class="empty-illustration">
            <span class="ticket-icon" style="font-size: 52px; line-height: 1;">⚡</span>
          </div>
          <div class="empty-title">暂无秒杀活动</div>
          <div class="empty-subtitle">当前时段暂无秒杀商品，敬请期待</div>
        </template>
        <template v-else>
          <div class="empty-illustration">
            <span class="ticket-icon">🎫</span>
          </div>
          <div class="empty-title">暂无{{ biz === 'voucher' ? '代金券' : '团购' }}</div>
          <div class="empty-subtitle">换个筛选试试，或者先去逛逛热门商家</div>
        </template>
        <div class="empty-actions">
          <button class="empty-btn primary" @click="goHome">去首页逛逛</button>
          <button class="empty-btn" @click="goHotShops">查看热门商家</button>
        </div>
      </div>

      <DealCard
        v-for="(item, idx) in displayDeals"
        :key="'deal-' + (item.id || idx)"
        :item="item"
        :biz="biz"
        :is-seckill="isSeckillMode"
        @click="toProductDetail"
        @action="toProductDetail"
      />

      <div v-if="deals.length > 0" class="load-more-tip">
        <span v-if="loadingMore">加载中...</span>
        <span v-else-if="noMore">已加载全部</span>
      </div>
    </div>
  </div>
</template>

<script>
import DealCard from '@/components/DealCard.vue';
import { searchProducts } from '@/api/search';
import { getShopTypes } from '@/api/shop';
import { locationUtil } from '@/utils/location';
import { throttle } from '@/utils/throttle';

export default {
  name: 'DealListIndex',
  components: {
    DealCard
  },
  data() {
    return {
      biz: 'voucher',
      dealMode: 'normal',
      isSearchMode: false,
      sceneType: 0,
      searchText: '',
      activeFilterTab: '',
      selectedDistance: '',
      selectedShopType: null,
      selectedSort: 'default',
      selectedServiceFilter: '',
      shopTypes: [],
      deals: [],
      loading: false,
      loadingMore: false,
      noMore: false,
      page: 1,
      size: 10,
      dealRequestToken: 0,
      isCompactHeader: false,
      lastScrollTop: 0,
      userLocation: null,
      selectedTimeSlot: '',
      timeSlotOptions: [
        { label: '全部时段', value: '' },
        { label: '10:00 场', value: '10:00' },
        { label: '12:00 场', value: '12:00' },
        { label: '18:00 场', value: '18:00' },
        { label: '20:00 场', value: '20:00' }
      ],
      distanceOptions: [
        { label: '全部距离', value: '' },
        { label: '1km内', value: '1' },
        { label: '3km内', value: '3' },
        { label: '5km内', value: '5' },
        { label: '10km内', value: '10' }
      ],
      sortOptions: [
        { label: '默认排序', value: 'default' },
        { label: '价格从低到高', value: 'price_asc' },
        { label: '价格从高到低', value: 'price_desc' }
      ],
      serviceFilterOptions: [
        { label: '全部服务', value: '' },
        { label: '免预约', value: 'no_reservation' },
        { label: '周末可用', value: 'weekend_available' }
      ]
    };
  },
  computed: {
    isSeckillMode() {
      return this.dealMode === 'seckill';
    },
    displayDeals() {
      let list = (this.deals || []).slice();

      if (this.selectedDistance) {
        const maxDistance = Number(this.selectedDistance) * 1000;
        list = list.filter(item => {
          const d = this.getItemDistance(item);
          if (d === null) return true;
          return d <= maxDistance;
        });
      }

      if (this.selectedServiceFilter) {
        list = list.filter(item => this.matchServiceFilter(item, this.selectedServiceFilter));
      }

      if (this.selectedSort === 'price_asc') {
        list.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
      } else if (this.selectedSort === 'price_desc') {
        list.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
      }

      return list;
    }
  },
  created() {
    this.onScroll = throttle(this.onScroll, 80);
    this.syncFromRoute();
    this.loadShopTypes();
    this.initLocation();
    this.fetchDeals(true);
  },
  beforeUnmount() {
    if (typeof this.onScroll?.cancel === 'function') {
      this.onScroll.cancel();
    }
  },
  watch: {
    '$route.query'() {
      this.syncFromRoute();
      this.fetchDeals(true);
    }
  },
  methods: {
    syncFromRoute() {
      const q = this.$route.query || {};
      const biz = q.biz || q.tab;
      this.biz = biz === 'group' ? 'group' : 'voucher';
      const zone = q.zone === 'seckill' ? 'seckill' : q.zone === 'normal' ? 'normal' : '';
      const rawType = q.type !== undefined ? q.type : q.vt;
      const parsedType = Number(rawType);
      if (zone) {
        this.dealMode = zone;
      } else if (parsedType === 1) {
        this.dealMode = 'seckill';
      } else {
        this.dealMode = 'normal';
      }
      this.sceneType = this.dealMode === 'seckill' ? 1 : 0;

      const dist = q.dist !== undefined ? String(q.dist) : '';
      this.selectedDistance = ['1', '3', '5', '10'].includes(dist) ? dist : '';

      if (q.st === undefined || q.st === null || q.st === '') {
        this.selectedShopType = null;
      } else {
        const parsedShopType = Number(q.st);
        this.selectedShopType = Number.isFinite(parsedShopType) ? parsedShopType : null;
      }

      const sort = String(q.sort || 'default');
      this.selectedSort = ['default', 'price_asc', 'price_desc'].includes(sort)
        ? sort
        : 'default';

      const serviceFilter = typeof q.sf === 'string' ? q.sf : '';
      const validServiceFilter = this.serviceFilterOptions.some(option => option.value === serviceFilter);
      this.selectedServiceFilter = validServiceFilter ? serviceFilter : '';

      const keyword = typeof q.k === 'string' ? q.k : '';
      this.searchText = keyword;
      this.isSearchMode = !!(keyword && keyword.trim());
      this.activeFilterTab = '';
    },
    initLocation() {
      locationUtil.getLocation().then(loc => {
        this.userLocation = loc || null;
      }).catch(() => {
        this.userLocation = null;
      });
    },
    loadShopTypes() {
      getShopTypes().then(res => {
        let data = res;
        if (res && res.data) data = res.data;
        this.shopTypes = Array.isArray(data) ? data : [];
      }).catch(() => {
        this.shopTypes = [];
      });
    },
    buildQuery() {
      const query = { biz: this.biz, zone: this.dealMode };
      query.type = this.sceneType;
      if (this.searchText && this.searchText.trim()) {
        query.k = this.searchText.trim();
      }
      if (this.selectedDistance) {
        query.dist = this.selectedDistance;
      }
      if (this.selectedShopType !== null && this.selectedShopType !== undefined) {
        query.st = this.selectedShopType;
      }
      if (this.selectedSort !== 'default') {
        query.sort = this.selectedSort;
      }
      if (this.selectedServiceFilter) {
        query.sf = this.selectedServiceFilter;
      }
      return query;
    },
    changeBiz(nextBiz) {
      if (this.biz === nextBiz) return;
      this.biz = nextBiz;
      this.$router.replace({ path: '/deal/list', query: this.buildQuery() });
    },
    toggleFilterTab(tab) {
      this.activeFilterTab = this.activeFilterTab === tab ? '' : tab;
      if (this.activeFilterTab) {
        this.isCompactHeader = false;
      }
    },
    selectDistance(val) {
      this.selectedDistance = val;
      this.activeFilterTab = '';
      this.fetchDeals(true);
    },
    selectTimeSlot(val) {
      this.selectedTimeSlot = val;
      this.activeFilterTab = '';
      this.fetchDeals(true);
    },
    selectShopType(value) {
      if (this.selectedShopType === value) {
        this.activeFilterTab = '';
        return;
      }
      this.selectedShopType = value;
      this.activeFilterTab = '';
      this.$router.replace({ path: '/deal/list', query: this.buildQuery() });
    },
    selectSort(value) {
      if (this.selectedSort === value) {
        this.activeFilterTab = '';
        return;
      }
      this.selectedSort = value;
      this.activeFilterTab = '';
      this.$router.replace({ path: '/deal/list', query: this.buildQuery() });
    },
    selectServiceFilter(value) {
      if (this.selectedServiceFilter === value) {
        this.activeFilterTab = '';
        return;
      }
      this.selectedServiceFilter = value;
      this.activeFilterTab = '';
      this.$router.replace({ path: '/deal/list', query: this.buildQuery() });
    },
    getSeckillProgress(item) {
      const total = Number(item && (item.totalStock || item.stock || item.total || 0));
      const sold = Number(item && (item.soldCount || item.sold || item.saleCount || 0));
      if (total > 0 && sold >= 0) {
        const percent = Math.round((sold / total) * 100);
        return Math.max(0, Math.min(100, percent));
      }
      return 45;
    },
    getDistanceLabel() {
      if (!this.selectedDistance) return '距离';
      const found = this.distanceOptions.find(item => item.value === this.selectedDistance);
      return found ? found.label : '距离';
    },
    getShopTypeLabel() {
      if (this.selectedShopType === null || this.selectedShopType === undefined) return '分类';
      const found = this.shopTypes.find(item => Number(item.id) === Number(this.selectedShopType));
      return found ? found.name : '分类';
    },
    getSortLabel() {
      if (!this.selectedSort || this.selectedSort === 'default') return '默认排序';
      const opt = this.sortOptions.find(o => o.value === this.selectedSort);
      return opt ? opt.label : '默认排序';
    },
    getSeckillTimeLabel() {
      if (!this.selectedTimeSlot) return '全部时段';
      const opt = this.timeSlotOptions.find(o => o.value === this.selectedTimeSlot);
      return opt ? opt.label : '全部时段';
    },
    getServiceFilterLabel() {
      if (!this.selectedServiceFilter) return '筛选';
      const found = this.serviceFilterOptions.find(item => item.value === this.selectedServiceFilter);
      return found ? found.label : '筛选';
    },
    matchServiceFilter(item, filterValue) {
      if (!filterValue) return true;
      if (filterValue === 'no_reservation') {
        const noReservation = this.readBooleanByKeys(item, [
          'noReservation',
          'noAppointment',
          'freeReservation',
          'isNoReservation'
        ]);
        const needReservation = this.readBooleanByKeys(item, [
          'needReservation',
          'needAppointment',
          'reservationRequired',
          'isNeedReservation',
          'reserveRequired'
        ]);
        if (noReservation === true || needReservation === false) return true;
        if (noReservation === false || needReservation === true) return false;
        return true;
      }
      if (filterValue === 'weekend_available') {
        const weekendAvailable = this.readBooleanByKeys(item, [
          'weekendAvailable',
          'isWeekendAvailable',
          'supportWeekend',
          'weekendUse',
          'weekendValid'
        ]);
        if (weekendAvailable === null) return true;
        return weekendAvailable;
      }
      return true;
    },
    readBooleanByKeys(obj, keys) {
      if (!obj || !Array.isArray(keys)) return null;
      for (let i = 0; i < keys.length; i += 1) {
        const key = keys[i];
        if (!(key in obj)) continue;
        const parsed = this.parseBoolLike(obj[key]);
        if (parsed !== null) return parsed;
      }
      return null;
    },
    parseBoolLike(value) {
      if (value === null || value === undefined || value === '') return null;
      if (typeof value === 'boolean') return value;
      if (typeof value === 'number') {
        if (value === 1) return true;
        if (value === 0) return false;
        return null;
      }
      if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (!normalized) return null;
        if (['1', 'true', 'yes', 'y', 'on', '是', '支持', '可用'].includes(normalized)) return true;
        if (['0', 'false', 'no', 'n', 'off', '否', '不支持', '不可用'].includes(normalized)) return false;
      }
      return null;
    },
    handleSearchAction() {
      if (this.isSearchMode) {
        if (this.searchText && this.searchText.trim()) {
          this.doSearch();
        } else {
          this.isSearchMode = false;
          this.searchText = '';
          this.$router.replace({ path: '/deal/list', query: this.buildQuery() });
        }
      } else {
        this.isSearchMode = true;
        this.$nextTick(() => {
          if (this.$refs.searchInput) this.$refs.searchInput.focus();
        });
      }
    },
    clearSearch() {
      if (!this.searchText) return;
      this.searchText = '';
    },
    doSearch() {
      this.$router.replace({ path: '/deal/list', query: this.buildQuery() });
    },
    normalizeProductList(res) {
      let list = [];
      if (Array.isArray(res)) list = res;
      else if (res && Array.isArray(res.list)) list = res.list;
      else if (res && Array.isArray(res.data)) list = res.data;
      else if (res && res.data && Array.isArray(res.data.list)) list = res.data.list;
      else if (res && res.data && Array.isArray(res.data.records)) list = res.data.records;
      else if (res && res.data && res.data.data && Array.isArray(res.data.data.list)) list = res.data.data.list;
      else if (res && res.data && res.data.data && Array.isArray(res.data.data.records)) list = res.data.data.records;

      return (list || []).map(item => {
        return {
          ...item,
          // DealCard handles image resolution internally, 
          // but we provide a fallback for safety
          price: Number(item.price || item.payValue || 0),
          originalPrice: Number(item.originalPrice || item.actualValue || 0)
        };
      });
    },
    async fetchDeals(reset = false) {
      if (!reset && (this.loading || this.loadingMore || this.noMore)) return;
      if (reset && this.loadingMore) return;

      if (reset) {
        this.page = 1;
        this.noMore = false;
        this.deals = [];
        this.loading = true;
        this.loadingMore = false;
      } else {
        this.loadingMore = true;
      }

      const filters = {
        category: this.biz === 'group' ? 2 : 1,
        status: 1
      };
      if (this.sceneType === 0 || this.sceneType === 1) {
        filters.activityType = this.sceneType;
      }
      if (this.selectedShopType !== null && this.selectedShopType !== undefined) {
        filters.shopTypeId = this.selectedShopType;
      }

      const params = {
        page: this.page,
        size: this.size,
        keyword: (this.searchText || '').trim(),
        filters,
        lat: this.userLocation && this.userLocation.y ? this.userLocation.y : undefined,
        lon: this.userLocation && this.userLocation.x ? this.userLocation.x : undefined,
        distance: this.selectedDistance ? `${this.selectedDistance}km` : undefined
      };
      const requestToken = ++this.dealRequestToken;

      try {
        const res = await searchProducts(params);
        if (requestToken !== this.dealRequestToken) return;
        const list = this.normalizeProductList(res);
        this.deals = reset ? list : this.deals.concat(list);
        if (list.length < this.size) {
          this.noMore = true;
        } else {
          this.page += 1;
        }
      } catch (e) {
        if (requestToken !== this.dealRequestToken) return;
        if (reset) this.deals = [];
      } finally {
        if (requestToken === this.dealRequestToken) {
          this.loading = false;
          this.loadingMore = false;
        }
      }
    },
    onScroll(e) {
      const el = e.target;
      const currentTop = Math.max(0, el.scrollTop || 0);

      if (currentTop > this.lastScrollTop && currentTop > 36) {
        this.isCompactHeader = true;
      } else if (currentTop < this.lastScrollTop - 8 || currentTop <= 18) {
        this.isCompactHeader = false;
      }
      this.lastScrollTop = currentTop;

      if (this.loading || this.loadingMore || this.noMore) return;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 120) {
        this.fetchDeals(false);
      }
    },
    toProductDetail(item) {
      if (!item || !item.id) return;
      this.$router.push({ path: '/product/detail', query: { id: item.id } });
    },
    goBack() {
      if (this.activeFilterTab) {
        this.activeFilterTab = '';
        return;
      }
      if (this.isSearchMode) {
        this.isSearchMode = false;
        if (this.searchText) {
          this.searchText = '';
          this.$router.replace({ path: '/deal/list', query: this.buildQuery() });
        }
        return;
      }
      this.$router.go(-1);
    },
    goHome() {
      this.$router.push({ path: '/' });
    },
    goHotShops() {
      this.$router.push({ path: '/shop/list' });
    },
    getItemType(item) {
      const t = Number(item && (item.type !== undefined ? item.type : item.activityType));
      return t === 1 ? 1 : 0;
    },
    getDefaultTitle(item) {
      const amount = Number(item && (item.originalPrice || item.price || 0));
      return this.biz === 'group' ? `${amount}元团购套餐` : `${amount}元代金券`;
    },
    getDiscountText(item) {
      const payValue = Number(item && item.price);
      const actualValue = Number(item && item.originalPrice);
      if (!payValue || !actualValue || actualValue <= 0) return '';
      return `${(payValue / actualValue * 10).toFixed(1)}折`;
    },
    getItemDistance(item) {
      const d = Number(item && (item.distance || item.dist || item.shopDistance));
      return Number.isFinite(d) && d >= 0 ? d : null;
    },
    getDistanceText(item) {
      const d = this.getItemDistance(item);
      if (d === null) return '';
      if (d < 1000) return `${Math.round(d)}m`;
      return `${(d / 1000).toFixed(1)}km`;
    },
    formatPrice(value) {
      const n = Number(value || 0);
      return Number.isInteger(n) ? n : n.toFixed(2);
    }
  }
};
</script>

<style scoped>
.deal-page {
  height: 100vh;
  background: #f5f6f8;
  display: flex;
  flex-direction: column;
}

.header {
  height: 56px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
  border-bottom: 1px solid #f1f2f4;
  transition: transform 0.22s ease, opacity 0.22s ease, margin 0.22s ease;
  will-change: transform;
}

.header-back-btn {
  width: 30px;
  cursor: pointer;
  color: #333;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 17px;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  pointer-events: none;
}

.header-search-input {
  flex: 1;
  margin: 0 8px 0 6px;
  position: relative;
  display: flex;
  align-items: center;
}

.header-search-input input {
  width: 100%;
  height: 36px;
  background: #f7f8fa;
  border: 1px solid #eceff3;
  border-radius: 18px;
  padding: 0 32px;
  font-size: 14px;
  outline: none;
  color: #333;
}

.input-icon {
  position: absolute;
  left: 10px;
  color: #999;
  font-size: 14px;
}

.clear-icon {
  position: absolute;
  right: 10px;
  color: #ccc;
  font-size: 14px;
  cursor: pointer;
}

.header-actions {
  min-width: 44px;
  display: flex;
  justify-content: flex-end;
  padding-right: 2px;
}

.header-search-btn {
  font-size: 14px;
  color: #333;
  font-weight: 400;
  cursor: pointer;
  white-space: nowrap;
  padding: 0 2px;
}

.header-search-btn i {
  font-size: 20px;
}

.header-back-icon,
.header-search-icon {
  font-size: 19px;
  font-weight: 600;
  transform: translateY(0.5px);
}

.meituan-filter-bar {
  display: flex;
  align-items: center;
  height: 40px;
  background: #fff;
  border-bottom: 1px solid #f2f2f2;
}
.seckill-filter-bar {
  justify-content: flex-start;
  padding: 0 16px;
  gap: 24px;
}
.biz-tabs {
  display: flex;
  align-items: center;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  padding: 0 12px;
  height: 44px;
  gap: 14px;
  box-sizing: border-box;
  transition: transform 0.22s ease, opacity 0.22s ease, margin 0.22s ease;
  will-change: transform;
}

.biz-tabs button {
  padding: 0;
  outline: none;
}

.biz-tab {
  border: none;
  background: transparent;
  color: #666;
  font-size: 15px;
  font-weight: 500;
  height: 44px;
  position: relative;
  cursor: pointer;
}

.biz-tab.active {
  color: #222;
}

.biz-tab.active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 1px;
  height: 3px;
  border-radius: 2px;
  background: linear-gradient(90deg, #ff9c00 0%, #ff6633 100%);
}

.filter-wrapper {
  position: relative;
  z-index: 20;
}

.meituan-filter-bar {
  display: flex;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  padding: 0 6px;
}

.filter-item {
  flex: 1;
  text-align: center;
  padding: 11px 0;
  font-size: 12px;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.filter-item.active {
  color: #ff6633;
}

.filter-item-more .filter-text {
  display: inline-flex;
  align-items: center;
}

.filter-funnel-icon {
  margin-left: 0;
  margin-right: 2px;
  font-size: 13px;
}

.filter-text i {
  margin-left: 4px;
  font-size: 12px;
}

.filter-content {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background: #fff;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
  z-index: 10;
}
.filter-content.show {
  max-height: 400px;
  overflow-y: auto;
}
.panel-title {
  font-size: 13px;
  color: #999;
  padding: 12px 16px 8px;
}
.distance-options, .sort-options, .service-option-group, .time-slot-options {
  padding: 0 16px 16px;
}
.distance-option, .sort-option, .service-option, .time-slot-option {
  padding: 12px 0;
  font-size: 14px;
  color: #333;
  border-bottom: 1px solid #f5f5f5;
}
.distance-option:last-child, .sort-option:last-child, .service-option:last-child, .time-slot-option:last-child {
  border-bottom: none;
}
.distance-option.active, .sort-option.active, .service-option.active, .time-slot-option.active {
  color: #ff416c;
  font-weight: 500;
}

.shop-type-panel,
.distance-panel,
.sort-panel,
.service-panel {
  padding: 14px;
}

.shop-type-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.shop-type-item {
  background: #f5f5f5;
  border-radius: 4px;
  font-size: 12px;
  color: #333;
  text-align: center;
  padding: 8px 4px;
  cursor: pointer;
}

.shop-type-item.active {
  background: #fff0eb;
  color: #ff6633;
}

.distance-option,
.sort-option {
  padding: 12px 0;
  border-bottom: 1px solid #f6f6f6;
  font-size: 14px;
  color: #333;
  cursor: pointer;
}

.distance-option:last-child,
.sort-option:last-child {
  border-bottom: none;
}

.distance-option.active,
.sort-option.active {
  color: #ff6633;
}

.service-option-group {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.service-option {
  background: #f5f5f5;
  border-radius: 8px;
  font-size: 12px;
  color: #666;
  text-align: center;
  padding: 8px 4px;
  cursor: pointer;
}

.service-option.active {
  background: #fff0eb;
  color: #ff6633;
}

.type-dropdown-mask {
  position: fixed;
  top: 142px;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
  background: rgba(0, 0, 0, 0.35);
}

.deal-page.compact .header {
  transform: translateY(-56px);
  margin-bottom: -56px;
  opacity: 0;
  pointer-events: none;
}

.deal-page.compact .biz-tabs {
  transform: translateY(-44px);
  margin-bottom: -44px;
  opacity: 0;
  pointer-events: none;
}

.deal-page.compact .type-dropdown-mask {
  top: 42px;
}

.deal-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px 10px;
}

.state-box {
  margin-top: 32px;
  text-align: center;
  color: #999;
  font-size: 13px;
}

.empty-state {
  margin-top: 42px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 0 14px;
}

.empty-illustration {
  width: 70px;
  height: 70px;
  border-radius: 20px;
  background: linear-gradient(180deg, #fff4ea 0%, #ffe9d8 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.ticket-icon {
  font-size: 34px;
  line-height: 1;
}

.empty-title {
  font-size: 15px;
  color: #333;
  font-weight: 600;
  margin-bottom: 6px;
}

.empty-subtitle {
  font-size: 12px;
  color: #999;
  line-height: 1.5;
}

.empty-actions {
  margin-top: 14px;
  display: flex;
  gap: 10px;
}

.empty-btn {
  height: 34px;
  border-radius: 17px;
  border: 1px solid #ff8a57;
  background: #fff;
  color: #ff8a57;
  font-size: 13px;
  padding: 0 14px;
  cursor: pointer;
}

.empty-btn.primary {
  border: none;
  color: #fff;
  background: linear-gradient(90deg, #ff9c00 0%, #ff6633 100%);
}

.enter-text {
  color: #ff6633;
  font-size: 12px;
}

.load-more-tip {
  text-align: center;
  color: #999;
  font-size: 12px;
  padding: 8px 0 16px;
}
</style>
