<template>
  <PageLayout :loading="pageLoading" skeleton-type="list" class="orders-page">
    <div class="header">
      <div class="header-back-btn" @click="goBack"><i class="el-icon-arrow-left"></i></div>
      <div class="header-title">我的订单</div>
    </div>

    <div class="orders-container">
       <div v-if="orders.length > 0">
          <div v-for="order in orders" :key="order.id" class="order-item">
             <div class="order-header">
                <div class="order-info-text">
                   <div class="order-no">订单号: {{order.id}}</div>
                   <div class="order-time">{{order.createTime}}</div>
                </div>
                <div class="order-status" :class="getStatusClass(order.status)">{{getOrderStatusText(order.status)}}</div>
             </div>
             <div class="order-content">
                <div class="voucher-title">{{order.title || '未知商品'}}</div>
                <div class="voucher-sub">{{order.subTitle}}</div>
                <div class="voucher-rule-box" v-if="order.rule">{{order.rule}}</div>
                
                <div class="price-row-stacked">
                   <div class="price-col">
                      <div class="price-label">支付金额</div>
                      <div class="price-val red">￥{{formatPrice(order.payValue || order.price)}}</div>
                   </div>
                   <div class="price-col">
                      <div class="price-label">抵扣金额</div>
                      <div class="price-val green">￥{{formatPrice(order.actualValue || order.value)}}</div>
                   </div>
                </div>
             </div>
             <div class="order-footer">
                <div class="footer-left">
                   <div class="real-pay-stacked" v-if="order.status !== 1">
                      <div class="pay-label">实付:</div>
                      <div class="pay-amount">￥{{formatPrice(order.payValue || order.price)}}</div>
                   </div>
                   <div class="countdown-box" v-if="order.status === 1">
                      <div class="pay-label">实付: </div>
                      <div class="pay-amount">￥{{formatPrice(order.payValue || order.price)}}</div>
                      <div class="cd-row"><i class="el-icon-time"></i> {{order.countDownStr || '00:00'}}</div>
                   </div>
                </div>
                <div class="order-actions">
                   <button class="square-btn btn-default" @click="toDetail(order)">查看<br>详情</button>
                   <button class="square-btn btn-primary" v-if="order.status===1" @click="toPay(order)">立即<br>支付</button>
                   <button class="square-btn btn-danger" v-if="order.status===1" @click="cancelOrder(order)">取消<br>订单</button>
                   <button class="square-btn btn-primary" v-if="order.status===2" @click="useOrder(order)">立即<br>使用</button>
                   <button class="square-btn btn-danger" v-if="order.status===2" @click="refundOrder(order)">申请<br>退款</button>
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

export default {
  name: 'OrderList',
  components: { PageLayout },
  data() {
    return {
       orders: [],
       pageLoading: false,
       timer: null
    }
  },
  created() {
     this.queryOrders();
     this.startTimer();
  },
  beforeUnmount() {
     if(this.timer) clearInterval(this.timer);
  },
  methods: {
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
        getOrderList({ current: 1 }).then(res => {
           let list = res.data || res || [];
           if (res && res.records) list = res.records;
           
           if (list.length === 0) {
              this.useMockData();
           } else {
              this.orders = list;
           }
        }).catch(() => {
           this.useMockData();
        }).finally(() => this.pageLoading = false);
     },
     getOrderStatusText(status) {
        const statusMap = {
          '1': '待支付',
          '2': '已支付',
          '3': '已使用',
          '4': '已取消',
          '5': '退款中',
          '6': '已退款'
        };
        return statusMap[status] || '未知状态';
     },
     getPayTypeText(payType) {
        const payTypeMap = {
          '1': '余额支付',
          '2': '支付宝',
          '3': '微信支付'
        };
        return payTypeMap[payType] || '未知支付方式';
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
              value: 100.00 
           },
           { 
              id: '540186545148133378', 
              userId: 1010,
              voucherId: 13,
              createTime: '2025-12-26 16:39:42',
              payTime: '2025-12-26 16:40:46',
              status: 2, 
              title: '100元代金券', 
              subTitle: '周一至周五均可使用',
              rule: '无规则333',
              payValue: 80.00, 
              actualValue: 100.00,
              price: 80.00,
              value: 100.00
           },
           { 
              id: '550186545148133399', 
              userId: 1010,
              voucherId: 14,
              createTime: '2025-11-11 12:00:00',
              payTime: '2025-11-11 12:01:00',
              status: 3, 
              title: '洗车卡', 
              subTitle: '普通洗车',
              rule: '',
              payValue: 30.00, 
              actualValue: 30.00,
              price: 30.00,
              value: 30.00
           }
        ];
     },
      formatPrice(p) {
         if(p === undefined || p === null || isNaN(p)) return '0.00';
         return Number(p).toFixed(2);
      },
     getStatusClass(status) {
        if(status === 1) return 'status-unpaid';
        if(status === 2) return 'status-paid';
        if(status === 3) return 'status-used';
        if(status === 4) return 'status-used'; // Grey
        if(status === 5) return 'status-used';
        if(status === 6) return 'status-used';
        return '';
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
        this.$message.success('跳转支付...');
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
     }
  }
}
</script>

<style scoped>
.orders-page { min-height: 100vh; background: #f5f5f5; box-sizing: border-box; }
.orders-page * { box-sizing: border-box; }
.header { height: 50px; background: white; display: flex; align-items: center; padding: 0 15px; border-bottom: 1px solid #eee; position: sticky; top: 0; z-index: 10; }
.header-title { flex: 1; text-align: center; font-weight: bold; font-size: 18px; }

.orders-container { padding: 10px; }
.order-item { background: white; border-radius: 8px; margin-bottom: 15px; padding: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }

.order-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
.order-info-text { font-size: 12px; color: #999; line-height: 1.5; }
.order-status { padding: 2px 8px; border-radius: 4px; font-size: 12px; background: #eee; color: #999; }
.order-status.status-unpaid { background: #fdf6ec; color: #e6a23c; }
.order-status.status-paid { background: #f0f9eb; color: #67c23a; }
.order-status.status-used { background: #f4f4f5; color: #909399; }

.order-content { padding-bottom: 10px; border-bottom: 1px dashed #eee; margin-bottom: 10px; }
.voucher-title { font-size: 16px; font-weight: bold; color: #333; margin-bottom: 5px; }
.voucher-sub { font-size: 13px; color: #666; margin-bottom: 10px; }
.voucher-rule-box { background: #f8f8f8; padding: 8px 10px; border-radius: 4px; font-size: 12px; color: #999; margin-bottom: 15px; }

.price-row-stacked { display: flex; margin-top: 10px; }
.price-col { margin-right: 30px; display: flex; flex-direction: column; }
.price-label { font-size: 12px; color: #999; margin-bottom: 4px; }
.price-val { font-size: 15px; font-weight: bold; }
.price-val.red { color: #ff0000; }
.price-val.green { color: #67c23a; }

.order-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 10px; }
.footer-left { flex: 1; }
.real-pay-stacked { display: flex; flex-direction: column; }
.countdown-box { display: flex; flex-direction: column; }
.cd-row { color: #ff6633; font-size: 12px; margin-top: 2px; }
.pay-label { font-size: 12px; font-weight: bold; color: #333; margin-bottom: 2px; }
.pay-amount { font-size: 16px; font-weight: bold; color: #333; }

.order-actions { display: flex; gap: 8px; }
.square-btn { min-width: 60px; padding: 6px 4px; border-radius: 6px; font-size: 12px; cursor: pointer; border: 1px solid #ddd; background: white; display: flex; align-items: center; justify-content: center; line-height: 1.25; text-align: center; height: auto; }
.btn-default { border-color: #eee; color: #666; }
.btn-primary { border-color: #409EFF; color: #409EFF; }
.btn-danger { border-color: #F56C6C; color: #F56C6C; }

.empty-state { padding: 50px 0; text-align: center; color: #999; }
.empty-state i { font-size: 40px; margin-bottom: 10px; }
</style>
