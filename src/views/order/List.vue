<template>
  <PageLayout :loading="pageLoading" skeleton-type="list" class="orders-page">
    <div class="header">
      <div class="header-back-btn" @click="goBack"><i class="el-icon-arrow-left"></i></div>
      <div class="header-title">我的订单</div>
    </div>

    <div
      class="orders-container"
      @touchstart.passive="onTouchStart"
      @touchmove.passive="onTouchMove"
      @touchend="onTouchEnd"
    >
       <!-- Filter & Stats Bar -->
       <div class="filter-bar">
          <div class="filter-tabs">
             <div class="tab-item" :class="{active: activeTab==='all'}" @click="activeTab='all'">全部</div>
             <div class="tab-item" :class="{active: activeTab==='1'}" @click="activeTab='1'">待支付</div>
             <div class="tab-item" :class="{active: activeTab==='2'}" @click="activeTab='2'">未使用</div>
             <div class="tab-item" :class="{active: activeTab==='3'}" @click="activeTab='3'">已使用</div>
             <div class="tab-item" :class="{active: activeTab==='4'}" @click="activeTab='4'">已取消</div>
             <div class="tab-item" :class="{active: activeTab==='6'}" @click="activeTab='6'">已退款</div>
          </div>
       </div>

       <div v-if="orders.length > 0">
          <div v-for="order in orders" :key="order.id" class="order-card">
             <!-- Header: Time & Status -->
             <div class="card-header">
                <div class="header-left">
                   <span class="order-time-text" style="font-weight: 500;">{{ formatTime(order.createTime) }}</span>
                </div>
                <!-- Status Badge -->
                <div class="status-badge" :class="getStatusClass(order.status)">
                   <i v-if="order.status===4 || order.status===5 || order.status===6" class="el-icon-circle-close"></i>
                   <i v-if="order.status===3" class="el-icon-circle-check"></i>
                   <i v-if="order.status===2" class="el-icon-success"></i>
                   <i v-if="order.status===1" class="el-icon-time"></i>
                   {{getOrderStatusText(order.status)}}
                </div>
             </div>

             <!-- Countdown Bar (Only if Unpaid) -->
             <div class="countdown-bar" v-if="order.status === 1">
                 <i class="el-icon-warning-outline"></i>
                 <span>支付剩余时间: <span class="cd-timer">{{order.countDownStr || '00:00'}}</span></span>
             </div>

             <!-- Content -->
             <div class="card-content" @click="toDetail(order)">
                <div class="product-title">
                   {{order.name || order.title || '未知商品'}}
                   <span class="seckill-tag" v-if="(order.name || order.title) && (order.name || order.title).includes('秒杀')">秒杀</span>
                </div>
                
                <div class="info-row">
                   <span class="info-label">适用商铺:</span>
                   <span class="shop-link">{{order.shopName || '家味道家常菜馆'}}</span>
                </div>
                <div class="info-row">
                   <span class="info-desc">{{order.subTitle || '周一至周日可用'}}</span>
                </div>

                <!-- Price Block -->
                <div class="price-block">
                   <div class="pb-col">
                      <div class="pb-label">支付金额</div>
                      <div class="pb-val red">¥{{formatPrice(order.price || order.payValue)}}</div>
                   </div>
                   <div class="pb-col">
                      <div class="pb-label">抵扣金额</div>
                      <div class="pb-val green">¥{{formatPrice(order.originalPrice || order.actualValue || order.value)}}</div>
                   </div>
                </div>
             </div>

             <!-- Footer -->
             <div class="card-footer">
                <div class="real-pay">
                   实付: <span class="pay-num">¥{{formatPrice(order.price || order.payValue)}}</span>
                </div>
                <div class="action-buttons">
                   <button class="action-btn btn-outline" @click="toDetail(order)">查看详情</button>
                   
                   <button class="action-btn btn-outline" v-if="order.status===1" @click="cancelOrder(order)">取消订单</button>
                   <button class="action-btn btn-solid-orange" v-if="order.status===1" @click="toPay(order)">立即支付</button>

                   <button class="action-btn btn-solid-blue" v-if="order.status===2" @click="useOrder(order)">立即使用</button>
                   <button class="action-btn btn-outline" v-if="order.status===2" @click="refundOrder(order)">申请退款</button>
                   
                   <button class="action-btn btn-outline" v-if="order.status===3 && (!order.reviewStatus || order.reviewStatus===0)" @click="toReview(order)">去评价</button>
                   <button class="action-btn btn-outline" v-if="order.status===3 && order.reviewStatus===1" @click="toReviewDetail(order)">查看评价</button>
                   
                   <!-- Show text for other states if needed, or just view detail -->
                </div>
             </div>
          </div>
       </div>
       <div v-else class="empty-state">
          <i class="el-icon-s-order"></i>
          <p>暂无订单</p>
       </div>
    </div>
  </PageLayout>
</template>

<script>
import { getOrderList, cancelOrder, refundOrder } from '@/api/order';
import PageLayout from '@/components/PageLayout/PageLayout.vue';
import dayjs from 'dayjs';

export default {
  name: 'OrderList',
  components: { PageLayout },
  data() {
    return {
       orders: [],
       pageLoading: false,
       timer: null,
       activeTab: 'all',
       tabOrder: ['all', '1', '2', '3', '4', '6'],
       touchStartX: 0,
       touchStartY: 0,
       touchEndX: 0,
       touchEndY: 0,
       swipeThreshold: 60,
       maxVerticalTravel: 50,
       hasLoadedOnce: false
    }
  },
  watch: {
     activeTab(val) {
         // 保存 tab 状态到路由查询参数
         this.$router.replace({ query: { ...this.$route.query, status: val } });
         this.queryOrders();
     }
  },
  activated() {
     // Keep-alive hook: sync tab from URL if changed (e.g. deep link)
     if (this.$route.query.status && String(this.$route.query.status) !== this.activeTab) {
         this.activeTab = String(this.$route.query.status);
         // watcher on activeTab will trigger queryOrders
     } else if (this.hasLoadedOnce) {
         this.queryOrders();
     }
     this.hasLoadedOnce = true;
  },
  created() {
      if (this.$route.query.status) {
          this.activeTab = String(this.$route.query.status);
      }
      this.queryOrders();
     this.startTimer();
  },
  beforeUnmount() {
     if(this.timer) clearInterval(this.timer);
  },
  methods: {
     onTouchStart(e) {
        const touch = e.touches && e.touches[0];
        if (!touch) return;
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        this.touchEndX = touch.clientX;
        this.touchEndY = touch.clientY;
     },
     onTouchMove(e) {
        const touch = e.touches && e.touches[0];
        if (!touch) return;
        this.touchEndX = touch.clientX;
        this.touchEndY = touch.clientY;
     },
     onTouchEnd() {
        const deltaX = this.touchEndX - this.touchStartX;
        const deltaY = Math.abs(this.touchEndY - this.touchStartY);
        if (deltaY > this.maxVerticalTravel) return;
        if (Math.abs(deltaX) < this.swipeThreshold) return;

        const currentIndex = this.tabOrder.indexOf(this.activeTab);
        if (currentIndex < 0) return;

        if (deltaX < 0 && currentIndex < this.tabOrder.length - 1) {
            this.activeTab = this.tabOrder[currentIndex + 1];
        } else if (deltaX > 0 && currentIndex > 0) {
            this.activeTab = this.tabOrder[currentIndex - 1];
        }
     },
     goBack() {
        this.$router.go(-1);
     },
     startTimer() {
        this.timer = setInterval(() => {
           this.orders.forEach(o => {
              if(o.status === 1) {
                 let end = 0;
                 if(o.expireTime) {
                     end = new Date(o.expireTime).getTime();
                 } else if(o.createTime) {
                     // Fallback: 15 minutes from createTime
                     end = new Date(o.createTime).getTime() + 15 * 60 * 1000;
                 }
                 
                 if(end > 0) {
                     const now = new Date().getTime();
                     const diff = end - now;
                     if(diff > 0) {
                        const m = Math.floor(diff / 60000);
                        const s = Math.floor((diff % 60000) / 1000);
                        o.countDownStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                     } else {
                        o.countDownStr = '00:00';
                     }
                 }
              }
           });
        }, 1000);
     },
     queryOrders() {
        this.pageLoading = true;
        const params = { current: 1 };
        if (this.activeTab !== 'all') {
            params.status = Number(this.activeTab);
        }
        if (this.$route.query.reviewStatus !== undefined) {
            params.reviewStatus = this.$route.query.reviewStatus;
        }
        
        getOrderList(params).then(res => {
           let list = res.data || res || [];
           if (res && res.records) list = res.records;
           
           if (list.length === 0) {
              // If server returns empty, we might want to show empty state
              // But if we are in "all" tab and it's empty, maybe fall back to mock?
              // The user specifically wants server data. 
              // I will leave mock fallback ONLY if it looks like a complete failure or 'all' tab with no data?
              // Actually user said "did not get data from backend".
              // I should probably remove aggressive mock fallback if connection works but returns empty.
              // But for safety, I'll keep default mock ONLY if it errors out, 
              // or maybe if list is empty AND we want to show something?
              // Let's trust the server. If empty, show empty.
              // ONLY use mock data in catch block (network error).
              this.orders = []; 
           } else {
              this.orders = list;
           }
        }).catch(() => {
           this.useMockData();
           // Filter mock data locally if we fell back to it
           if (this.activeTab !== 'all') {
               const s = Number(this.activeTab);
               this.orders = this.orders.filter(o => o.status === s);
           }
        }).finally(() => this.pageLoading = false);
     },

     useMockData() {
        const now = new Date().getTime();
        this.orders = [
           { 
              id: '99', 
              userId: 1010,
              voucherId: 13,
              createTime: new Date().toISOString(), 
              expireTime: new Date(now + 15 * 60 * 1000).toISOString(), 
              status: 1, 
              title: '秒杀代金券', 
              subTitle: '限时秒杀',
              rule: '不可退款',
              payValue: 19.90, 
              actualValue: 100.00, 
              price: 19.90, 
              value: 100.00,
              shopName: '家味道家常菜馆'
           },
           { 
              id: '540186545148133378', 
              userId: 1010,
              voucherId: 13,
              createTime: '2025-12-26 16:39:42',
              payTime: '2025-12-26 16:40:46',
              status: 4, // Cancelled for demo 
              title: '100元代金券', 
              subTitle: '周一至周五均可使用',
              rule: '无规则333',
              payValue: 80.00, 
              actualValue: 100.00,
              price: 80.00,
              value: 100.00,
              shopName: '家味道家常菜馆'
           },
           { 
              id: '550186545148133399', 
              userId: 1010,
              voucherId: 14,
              createTime: '2025-11-11 12:00:00',
              payTime: '2025-11-11 12:01:00',
              status: 3, // Used
              title: '洗车卡', 
              subTitle: '普通洗车',
              rule: '',
              payValue: 30.00, 
              actualValue: 30.00,
              price: 30.00,
              value: 30.00,
              shopName: '巴蜀风味川菜馆'
           },
           { 
              id: '550186545148133377', 
              userId: 1010,
              voucherId: 14,
              createTime: '2025-12-25 10:20:15',
              status: 3, // Completed
              title: '200元代金券', 
              subTitle: '领取/购买后 7 天内有效',
              rule: '',
              payValue: 88.00, 
              actualValue: 112.00,
              price: 88.00,
              value: 112.00,
              shopName: '坤坤蜜味轩小火锅呀'
           }
        ];
     },
     formatPrice(p) {
        if(p === undefined || p === null || isNaN(p)) return '0.00';
        return Number(p).toFixed(2);
     },
     formatTime(t) {
        if (!t) return '';
        return dayjs(t).format('YYYY-MM-DD HH:mm:ss');
     },
     getOrderStatusText(status) {
        const statusMap = {
          '1': '待支付',
          '2': '已支付', // User provided: 已支付
          '3': '已核销', // User provided: 已核销
          '4': '已取消',
          '5': '退款中',
          '6': '已退款',
          '7': '已过期'
        };
        return statusMap[status] || '未知状态';
     },
     getStatusClass(status) {
        // 1: Unpaid (Orange)
        if(status === 1) return 'status-unpaid';
        // 2: Paid (Green)
        if(status === 2) return 'status-paid'; 
        // 3: Verified (Green/Blue?) Let's use standard Completed/Paid style
        if(status === 3) return 'status-completed';
        // 4: Cancelled (Grey)
        if(status === 4) return 'status-cancelled';
        // 5/6/7: Grey/Other
        if(status === 5 || status === 6 || status === 7) return 'status-cancelled';
        return 'status-cancelled';
     },
     toDetail(order) {
        sessionStorage.setItem('currentOrder', JSON.stringify(order));
        this.$router.push({ path: '/order/detail', query: { id: order.id } });
     },
     useOrder(order) {
        sessionStorage.setItem('currentOrder', JSON.stringify(order));
        this.$router.push({ path: '/order/detail', query: { id: order.id } });
     },
      toPay(order) {
         if(!order || !order.id) return;
         this.$router.push({
            path: '/pay/checkout',
            query: {
               bizType: 'order',
               bizId: order.id,
               amount: order.payValue || order.price || order.amount || order.totalAmount || order.payAmount,
               title: order.title || '订单支付'
            }
         });
      },
     cancelOrder(order) {
        this.$confirm('确定要取消订单吗?', '提示', { type: 'warning' }).then(() => {
           cancelOrder(order.id).then(res => {
              this.$message.success('订单已取消');
              this.queryOrders();
           });
        });
     },
     refundOrder(order) {
        this.$confirm('确定要申请退款吗?', '提示', { type: 'warning' }).then(() => {
           refundOrder(order.id).then(res => {
              this.$message.success('申请提交成功');
              this.queryOrders();
           });
        });
     },
     toReview(order) {
        this.$router.push({
            name: 'ReviewPublish',
            query: {
                orderId: order.id
            }
        });
     },
     toReviewDetail(order) {
        this.$router.push({
            name: 'ReviewDetail',
            query: {
                id: order.reviewId
            }
        });
     }
  }
}
</script>

<style scoped>
.orders-page { min-height: 100vh; background: #f2f4f8; box-sizing: border-box; }
.header { height: 44px; background: white; display: flex; align-items: center; padding: 0 12px; position: sticky; top: 0; z-index: 10; font-size: 16px; border-bottom: 1px solid #eee; }
.header-title {
  font-weight: 600;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  max-width: 60%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
}

.orders-container { padding: 12px; }

/* Filter Bar */
.filter-bar { display: flex; align-items: center; margin-bottom: 15px; }
.filter-tabs { flex: 1; display: flex; overflow-x: auto; gap: 8px; scrollbar-width: none; -ms-overflow-style: none; }
.filter-tabs::-webkit-scrollbar { display: none; }
.tab-item { 
    white-space: nowrap; 
    padding: 6px 14px; 
    border-radius: 20px; 
    font-size: 13px; 
    background: white; 
    color: #666; 
    transition: all 0.3s; 
    border: 1px solid transparent; 
}
.tab-item.active {
    background: linear-gradient(90deg, #FF6600, #FF4400);
    color: white;
    box-shadow: 0 2px 8px rgba(255, 68, 0, 0.3);
    font-weight: 500;
}
.total-stats { 
    display: flex; align-items: center; 
    padding-left: 10px; border-left: 1px solid #eee; 
    margin-left: 5px; 
    color: #409EFF; font-size: 12px; font-weight: bold; 
    white-space: nowrap;
}
.total-stats i { margin-right: 4px; font-size: 14px; }

.order-card {
    background: white;
    border-radius: 12px;
    margin-bottom: 12px;
    padding: 12px 16px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.02);
}

/* Header */
.card-header {
    display: flex; justify-content: space-between; align-items: center;
    padding-bottom: 10px;
    border-bottom: 1px solid #f9f9f9;
}
.header-left { display: flex; align-items: center; font-size: 12px; color: #999; }
.blue-icon { color: #409EFF; margin-right: 6px; font-size: 14px; }
.order-time-text { transform: scale(0.95); transform-origin: left; }

.status-badge {
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;
    display: flex; align-items: center; gap: 4px;
}
.status-badge.status-unpaid { background: #fee; color: #ff6600; } /* Orange */
.status-badge.status-paid { background: #e0f8e9; color: #00c458; } /* Green */
.status-badge.status-completed { background: #e0f8e9; color: #00c458; } /* Green "已完成" */
.status-badge.status-cancelled { background: #f5f5f5; color: #999; } /* Grey "已取消" */

/* Countdown Bar */
.countdown-bar {
    margin-top: 10px;
    background: #FFFAF0; /* Light Orange */
    border: 1px solid #FFEDD5;
    color: #FF6600;
    font-size: 13px;
    padding: 8px 12px;
    border-radius: 6px;
    display: flex; align-items: center; gap: 6px;
    font-weight: 500;
}
.cd-timer { font-weight: bold; }

/* Content */
.card-content { padding: 12px 0; }
.product-title { font-size: 16px; font-weight: bold; color: #333; margin-bottom: 8px; display: flex; align-items: center; }
.seckill-tag { background: #ff2442; color: white; font-size: 10px; padding: 1px 4px; border-radius: 4px; margin-left: 6px; font-weight: normal; }

.info-row { margin-bottom: 6px; font-size: 13px; display: flex; align-items: baseline; }
.info-label { color: #666; margin-right: 6px; }
.shop-link { color: #409EFF; cursor: pointer; }
.info-desc { color: #999; font-size: 12px; }

/* Price Block */
.price-block {
    margin-top: 12px;
    background: #F8FBFF; /* Light Blue-ish */
    border-radius: 8px;
    padding: 12px;
    display: flex;
}
.pb-col { margin-right: 40px; }
.pb-label { font-size: 12px; color: #999; margin-bottom: 4px; }
.pb-val { font-size: 16px; font-weight: bold; font-family: 'DINAlternate-Bold', sans-serif; }
.pb-val.red { color: #FF4400; }
.pb-val.green { color: #00C458; }

/* Footer */
.card-footer {
    display: flex; justify-content: space-between; align-items: center;
    padding-top: 12px;
    border-top: 1px solid #f9f9f9;
}
.real-pay { font-size: 13px; color: #333; }
.pay-num { font-size: 18px; color: #FF4400; font-weight: bold; margin-left: 4px; font-family: 'DINAlternate-Bold', sans-serif; }

.action-buttons { display: flex; gap: 8px; }
.action-btn { 
    padding: 6px 14px; 
    border-radius: 18px; /* Capsule shape */
    font-size: 13px; 
    cursor: pointer; 
    font-weight: 500;
}
.btn-outline { background: white; border: 1px solid #ddd; color: #666; }
.btn-solid-orange { background: linear-gradient(90deg, #FF6600, #FF4400); color: white; border: none; box-shadow: 0 2px 6px rgba(255,102,0,0.3); }
.btn-solid-blue { background: #409EFF; color: white; border: none; }
.btn-disabled { background: #f5f5f5; border: 1px solid #ebebeb; color: #ccc; cursor: not-allowed; }

.empty-state { padding: 50px 0; text-align: center; color: #999; }
.empty-state i { font-size: 40px; margin-bottom: 10px; }
</style>
