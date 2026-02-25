<template>
  <PageLayout :loading="loading" skeleton-type="detail" class="order-detail-page">
    <div class="header">
      <div class="header-back-btn" @click="goBack"><i class="el-icon-arrow-left"></i></div>
      <div class="header-title">订单详情</div>
    </div>

    <div class="detail-content" v-if="order.id">
       <!-- Status Header - Hidden for Cancelled (4) -->
       <div class="status-card" v-if="order.status !== 4">
          <div class="status-text">{{getOrderStatusText(order.status)}}</div>
          
          <!-- Status 1: Unpaid -->
          <div class="status-desc" v-if="order.status===1">
             <div class="count-down" v-if="order.countDownStr">
                <i class="el-icon-time"></i> 支付剩余时间: {{order.countDownStr}}
             </div>
             <div v-else>订单待支付，请尽快付款</div>
          </div>
          
          <!-- Status 2: Paid/Unused -->
          <div class="status-desc" v-if="order.status===2">请前往门店出示二维码使用</div>
          
          <!-- Status 3: Used -->
          <div class="status-desc" v-if="order.status===3">订单已完成，期待您的评价</div>
          
          <!-- Status 4: Cancelled - Description removed as requested -->

          <!-- Status 5: Refunding -->
          <div class="status-desc" v-if="order.status===5">退款处理中</div>

          <!-- Status 6: Refunded -->
          <div class="status-desc" v-if="order.status===6">退款已完成</div>
       </div>

       <!-- Order Info Section -->
       <div class="info-section">
          <div class="section-title">订单信息</div>
          <div class="info-list">
             <div class="info-item">
                <span class="label">订单号:</span>
                <span class="value">{{order.id}}</span>
             </div>
             <div class="info-item">
                <span class="label">下单时间:</span>
                <span class="value">{{order.createTime}}</span>
             </div>
             <div class="info-item">
                <span class="label">订单状态:</span>
                <span class="value">{{getOrderStatusText(order.status)}}</span>
             </div>
             <div class="info-item" v-if="order.status!==1">
                <span class="label">支付方式:</span>
                <span class="value">{{getPayTypeText(order.payType)}}</span>
             </div>
             <div class="info-item" v-if="order.payTime">
                <span class="label">支付时间:</span>
                <span class="value">{{order.payTime}}</span>
             </div>
          </div>
       </div>

       <div class="divider"></div>

       <!-- Voucher Info Section -->
       <div class="info-section">
          <div class="section-title">商品信息</div>
          <div class="info-list">
             <div class="info-item">
                <span class="label">商品名称:</span>
                <span class="value">{{order.name || order.title || '未知商品'}}</span>
             </div>
             <div class="info-item">
                <span class="label">副标题:</span>
                <span class="value">{{order.subTitle}}</span>
             </div>
             <div class="info-item">
                <span class="label">支付金额:</span>
                <span class="value">￥{{formatPrice(order.price || order.payValue)}}</span>
             </div>
             <div class="info-item">
                <span class="label">抵扣金额:</span>
                <span class="value">￥{{formatPrice(order.originalPrice || order.actualValue || order.value)}}</span>
             </div>
             <div class="info-item">
                <span class="label">使用规则:</span>
                <span class="value">{{order.rule}}</span>
             </div>
          </div>
       </div>
    </div>

    <!-- Actions -->
    <div class="footer-actions" v-if="order.id">
       <button class="btn btn-primary big-btn" v-if="order.status===1" @click="toPay">立即支付</button>
       <button class="btn btn-outline big-btn" v-if="order.status===1" @click="doCancel">取消订单</button>
       
       <button class="btn btn-primary big-btn" v-if="order.status===2" @click="showQrCode">立即使用</button>
       <button class="btn btn-danger big-btn" v-if="order.status===2" @click="doRefund">申请退款</button>
       
       <button class="btn btn-outline big-btn" v-if="order.status===3" disabled>已完成</button>
       <button class="btn btn-outline big-btn" v-if="order.status===4" disabled>已取消</button>
       <button class="btn btn-outline big-btn" v-if="order.status===5" disabled>退款中</button>
       <button class="btn btn-outline big-btn" v-if="order.status===6" disabled>已退款</button>
    </div>

    <!-- QR Modal -->
    <div class="qr-modal" v-if="qrVisible" @click="qrVisible = false">
       <div class="qr-content" @click.stop>
          <div class="qr-title">请向商家出示此码</div>
          <div class="qr-box">
              <div class="qr-placeholder-code">
                 <i class="el-icon-full-screen"></i>
              </div>
          </div>
          <div class="qr-code-text">{{order.code || '2849 1948 1111'}}</div>
       </div>
    </div>
  </PageLayout>
</template>

<script>
import { cancelOrder, refundOrder, getOrderDetail } from '@/api/order';

import PageLayout from '@/components/PageLayout/PageLayout.vue';

export default {
  name: 'OrderDetail',
  components: { PageLayout },
  data() {
    return {
       orderId: '',
       order: {},
       loading: false,
       qrVisible: false,
       timer: null
    }
  },
  created() {
     this.orderId = this.$route.query.id;
     this.queryDetail();
  },
  beforeUnmount() {
     if(this.timer) clearInterval(this.timer);
  },
  methods: {
     goBack() {
        this.$router.go(-1);
     },
      currentTimestamp() {
        return new Date().getTime();
      },
      startTimer() {
         if(this.timer) clearInterval(this.timer);
         if(this.order.status !== 1) return;

         const updateTimer = () => {
             let end = 0;
             if(this.order.expireTime) {
                  end = new Date(this.order.expireTime).getTime();
             } else if(this.order.createTime) {
                  // Default 15 min if not specified
                  end = new Date(this.order.createTime).getTime() + 15 * 60 * 1000;
             }
             
             if(end > 0) {
                 const now = new Date().getTime();
                 const diff = end - now;
                 if(diff > 0) {
                     const m = Math.floor(diff / 60000);
                     const s = Math.floor((diff % 60000) / 1000);
                     this.order.countDownStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                 } else {
                     this.order.countDownStr = '00:00';
                     // Optionally auto-cancel or refresh
                 }
             }
         };
         
         updateTimer(); // run immediately
         this.timer = setInterval(updateTimer, 1000);
      },
     queryDetail() {
        this.loading = true;
        if(this.orderId) {
            getOrderDetail(this.orderId).then(res => {
                const data = res.data || res; // Adapt to various response wrappers
                if(data && (data.id || data.orderId)) {
                    this.order = data;
                    // Ensure ID matches string format for checks
                    if(!this.order.id) this.order.id = this.orderId;
                    this.startTimer();
                } else {
                    this.$message.error('订单不存在');
                    this.useMockData(); // Fallback for demo purposes if API returns empty
                }
            }).catch(e => {
                console.error("API failed:", e);
                this.$message.error('获取订单详情失败，显示模拟数据');
                this.useMockData();
            }).finally(() => {
                this.loading = false;
            });
        } else {
            this.useMockData();
            this.loading = false;
            this.startTimer();
        }
     },
     getOrderStatusText(status) {
        const statusMap = {
          '1': '待支付',
          '2': '已支付',
          '3': '已核销',
          '4': '已取消',
          '5': '退款中',
          '6': '已退款',
          '7': '已过期'
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
        // Create a mock order that matches the requested ID to avoid confusion
        const now = new Date().getTime();
        this.order = { 
           id: this.orderId || 'MOCK_ID', 
           userId: 1010,
           voucherId: 13,
           createTime: new Date().toISOString(),
           expireTime: new Date(now + 15 * 60 * 1000).toISOString(), 
           status: 1, 
           title: '模拟-80元代金券', 
           subTitle: 'API调用失败时的模拟数据',
           rule: '周一至周日可用',
           payValue: 80.00, 
           actualValue: 100.00, 
           price: 80.00, 
           value: 100.00,
           shopName: '模拟店铺'
        };
        this.startTimer();
     },
      formatPrice(p) {
         if(p === undefined || p === null || isNaN(p)) return '0.00';
         return Number(p).toFixed(2);
      },
     showQrCode() {
        this.qrVisible = true;
     },
      toPay() {
         if(!this.orderId) return;
         this.$router.push({
            path: '/pay/checkout',
            query: {
               bizType: 'order',
               bizId: this.orderId,
               amount: this.order.payValue || this.order.price || this.order.amount || this.order.totalAmount || this.order.payAmount,
               title: this.order.title || '订单支付'
            }
         });
      },
     doCancel() {
        this.$confirm('确定要取消订单吗?', '提示', { type: 'warning' }).then(() => {
           cancelOrder(this.orderId).then(() => {
              this.$message.success('取消成功');
              // Update status local/storage or go back
              this.order.status = 4;
              sessionStorage.setItem('currentOrder', JSON.stringify(this.order));
              // And ideally refresh list on back
           });
        });
     },
     doRefund() {
        this.$confirm('确定要申请退款吗?', '提示', { type: 'warning' }).then(() => {
           refundOrder(this.orderId).then(() => {
              this.$message.success('退款申请成功');
              this.order.status = 5;
              sessionStorage.setItem('currentOrder', JSON.stringify(this.order));
           });
        });
     }
  }
}
</script>

<style scoped>
.order-detail-page { min-height: 100vh; background: white; padding-bottom: 70px; }
.header { height: 50px; background: white; display: flex; align-items: center; padding: 0 15px; border-bottom: 1px solid #eee; position: sticky; top: 0; z-index: 10; }
.header-title {
  font-weight: bold;
  font-size: 18px;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  max-width: 60%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
}

.detail-content { padding: 20px; }
.status-card { background: linear-gradient(135deg, #ff9966, #ff5e62); color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 4px 10px rgba(255, 94, 98, 0.3); }
.status-text { font-size: 20px; font-weight: bold; margin-bottom: 10px; }
.status-desc { font-size: 14px; opacity: 0.9; }
.count-down { display: flex; align-items: center; }
.count-down i { margin-right: 5px; }

.info-section { margin-bottom: 20px; }
.section-title { font-size: 16px; font-weight: bold; color: #333; margin-bottom: 15px; }

.info-list { margin-bottom: 10px; }
.info-item { display: flex; margin-bottom: 10px; font-size: 14px; line-height: 1.5; }
.label { width: 80px; color: #666; flex-shrink: 0; }
.value { flex: 1; color: #333; }

.divider { height: 1px; background: #eee; margin: 20px 0; }

.footer-actions { position: fixed; bottom: 0; left: 0; right: 0; padding: 15px; background: white; border-top: 1px solid #eee; display: flex; gap: 10px; }
.big-btn { flex: 1; height: 40px; border: none; border-radius: 20px; font-size: 16px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.btn-primary { background: linear-gradient(90deg, #ff6633, #ff8c66); color: white; }
.btn-outline { background: white; border: 1px solid #ddd; color: #666; }
.btn-danger { background: #fee; border: 1px solid #fbc4c4; color: #f56c6c; }

.qr-modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 100; display: flex; align-items: center; justify-content: center; }
.qr-content { width: 80%; background: white; padding: 20px; border-radius: 10px; text-align: center; }
.qr-title { font-weight: bold; margin-bottom: 15px; }
.qr-box { width: 200px; height: 200px; background: #f5f5f5; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; }
.qr-placeholder-code { font-size: 50px; color: #999; }
.qr-code-text { font-size: 18px; letter-spacing: 2px; font-weight: bold; }
</style>
