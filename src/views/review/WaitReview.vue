<template>
  <PageLayout :loading="loading" skeleton-type="list" class="wait-review-page">
    <div class="custom-nav">
       <div class="nav-left" @click="$router.go(-1)">
           <van-icon name="arrow-left" color="#333" size="22"/>
       </div>
       <div class="nav-title">待评价</div>
       <div class="nav-right"></div>
    </div>

    <div class="review-list">
        <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
            <van-list
                v-model:loading="loadingMore"
                :finished="finished"
                finished-text="没有更多了"
                @load="onLoad"
            >
                <div v-if="list.length > 0">
                    <div v-for="order in list" :key="order.id" class="order-card">
                         <!-- Header -->
                         <div class="card-header">
                            <span class="order-id">订单号: {{order.id}}</span>
                            <span class="status-text">待评价</span>
                         </div>
                         
                         <!-- Content -->
                         <div class="card-content" @click="toReview(order)">
                            <div class="product-title">
                                {{order.title || '未知商品'}}
                                <span class="seckill-tag" v-if="order.title && order.title.includes('秒杀')">秒杀</span>
                            </div>
                            <div class="info-row">
                                <span class="shop-name">{{order.shopName}}</span>
                            </div>
                            <div class="price-row">
                                <span class="price-val">¥{{formatPrice(order.payValue || order.price)}}</span>
                            </div>
                         </div>

                         <!-- Footer Action -->
                         <div class="card-footer">
                             <div class="spacer"></div>
                             <button class="review-btn" @click.stop="toReview(order)">去评价</button>
                         </div>
                    </div>
                </div>
                <div v-else-if="!loading" class="empty-state">
                    <van-empty description="暂无待评价订单" />
                </div>
            </van-list>
        </van-pull-refresh>
    </div>
  </PageLayout>
</template>

<script>
import PageLayout from '@/components/PageLayout/PageLayout.vue';
import { getOrderList } from '@/api/order';

export default {
    name: 'WaitReview',
    components: { PageLayout },
    data() {
        return {
            loading: false,
            refreshing: false,
            loadingMore: false,
            finished: false,
            list: [],
            page: 1,
            size: 10
        }
    },
    created() {
        // Initial load handled by List component
    },
    methods: {
        formatPrice(p) {
            return Number(p || 0).toFixed(2);
        },
        async onLoad() {
            if (this.refreshing) {
                this.list = [];
                this.refreshing = false;
            }
            
            try {
                const params = {
                    current: this.page,
                    size: this.size,
                    status: 3, // Used
                    commentStatus: 0 // Unreviewed
                };
                
                const res = await getOrderList(params);
                let data = res.data || res || [];
                if(data.records) data = data.records;
                
                // Client-side filter to be safe
                data = data.filter(item => !item.commentStatus || item.commentStatus === 0);
                
                this.list.push(...data);
                this.loadingMore = false;
                
                if (data.length < this.size) {
                    this.finished = true;
                } else {
                    this.page++;
                }
            } catch (error) {
                this.loadingMore = false;
                this.finished = true;
            }
        },
        onRefresh() {
            this.finished = false;
            this.loadingMore = true;
            this.page = 1;
            this.onLoad();
        },
        toReview(order) {
            this.$router.push({
                name: 'ReviewPublish',
                query: {
                    shopId: order.shopId || 1,
                    orderId: order.id,
                    voucherId: order.voucherId, // Strictly pass voucherId
                    shopName: order.shopName
                }
            });
        }
    }
}
</script>

<style scoped>
.wait-review-page { background: #f7f8fa; min-height: 100vh; }
.custom-nav {
    height: 44px; background: white; display: flex; align-items: center; justify-content: space-between; padding: 0 16px;
    position: sticky; top: 0; z-index: 10;
}
.nav-left, .nav-right { width: 40px; display: flex; align-items: center; }
.nav-title { font-size: 17px; font-weight: 600; color: #333; }

.review-list { padding: 12px; }

.order-card {
    background: white; border-radius: 8px; padding: 16px; margin-bottom: 12px;
}
.card-header {
    display: flex; justify-content: space-between; font-size: 12px; color: #999; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #f5f5f5;
}
.status-text { color: #ff9900; }

.card-content { margin-bottom: 12px; }
.product-title { font-size: 16px; font-weight: bold; color: #333; margin-bottom: 6px; }
.seckill-tag { background: #ff2442; color: white; font-size: 10px; padding: 1px 4px; border-radius: 4px; margin-left: 6px; font-weight: normal; vertical-align: middle; }
.shop-name { font-size: 13px; color: #666; }
.price-row { margin-top: 8px; font-weight: bold; font-family: 'DINAlternate-Bold'; color: #333; font-size: 16px; }

.card-footer { display: flex; justify-content: flex-end; }
.review-btn {
    border: 1px solid #ddd; background: white; color: #333;
    padding: 6px 16px; border-radius: 16px; font-size: 13px;
}
.review-btn:active { background: #f5f5f5; }
</style>
