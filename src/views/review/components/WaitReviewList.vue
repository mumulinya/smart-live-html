<template>
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
                            <span class="order-id">
                                <van-icon name="orders-o" style="margin-right: 4px;" />
                                订单号: {{order.id}}
                            </span>
                            <span class="status-badge">待评价</span>
                         </div>
                         
                         <!-- Content Body -->
                         <div class="card-body" @click="toReview(order)">
                             <!-- Image -->
                             <div class="product-img">
                                 <img :src="getImage(order)" alt="Shop Image" v-if="getImage(order)">
                                 <div class="img-placeholder" v-else>
                                     <van-icon name="shop-o" size="24" color="#ccc"/>
                                 </div>
                             </div>
                             
                             <!-- Details -->
                             <div class="product-info">
                                 <div class="shop-name-row">{{order.shopName || '未知店铺'}}</div>
                                 <div class="product-desc-row">商品编号: {{order.voucherId || (order.id && order.id.length > 4 ? order.id.slice(-4) : order.id)}}</div>
                                 <div class="price-row">
                                     <span class="price-val">¥{{formatPrice(order.price || order.payValue)}}</span>
                                     <span class="quantity">x1</span>
                                 </div>
                             </div>
                         </div>

                         <!-- Footer Action -->
                         <div class="card-footer">
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
</template>

<script>
import { getOrderList } from '@/api/order';
import { fileURL } from '@/utils/request';

export default {
    name: 'WaitReviewList',
    data() {
        return {
            loading: false, 
            refreshing: false,
            loadingMore: false,
            finished: false,
            list: [],
            page: 1,
            size: 10,
            fileURL: fileURL
        }
    },
    methods: {
        getImage(order) {
            // Priority: shopIcon -> image -> shopImage?
            // User said: backend sends "shop image"
            let img = order.shopIcon || order.image || order.shopImage;
            if (img && typeof img === 'string') {
                if (img.startsWith('http')) return img;
                return this.fileURL + img;
            }
            return null;
        },
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
                    reviewStatus: 0 // Unreviewed
                };
                
                const res = await getOrderList(params);
                let data = res.data || res || [];
                if(data.records) data = data.records;
                
                // Client-side filter to be safe
                data = data.filter(item => !item.reviewStatus || item.reviewStatus === 0);
                
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
                    voucherId: order.voucherId,
                    shopName: order.shopName
                }
            });
        }
    }
}
</script>

<style scoped>
.review-list { padding: 12px; }

.order-card {
    background: white; border-radius: 12px; padding: 0; margin-bottom: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.02);
    border: 1px solid #eee;
}

/* Header */
.card-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 10px 12px;
    border-bottom: 1px solid #fafafa;
    font-size: 12px;
}
.order-id { color: #666; display: flex; align-items: center; }
.status-badge { 
    background: #ff6600; color: white; 
    padding: 2px 8px; border-radius: 10px; 
    font-size: 11px; transform: scale(0.9);
}

/* Body */
.card-body {
    padding: 12px;
    display: flex;
    align-items: flex-start;
}
.product-img {
    width: 64px; height: 64px;
    border-radius: 6px;
    overflow: hidden;
    background: #f8f8f8;
    margin-right: 12px;
    flex-shrink: 0;
}
.product-img img { width: 100%; height: 100%; object-fit: cover; }
.img-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }

.product-info { flex: 1; display: flex; flex-direction: column; justify-content: space-between; height: 64px; }
.shop-name-row { font-size: 15px; font-weight: bold; color: #333; margin-bottom: 4px; }
.product-desc-row { font-size: 12px; color: #999; margin-bottom: auto; }
.price-row { margin-top: 4px; display: flex; align-items: baseline; }
.price-val { color: #ff4400; font-weight: bold; font-size: 16px; margin-right: 4px; font-family: 'DINAlternate-Bold'; }
.quantity { color: #999; font-size: 12px; }

/* Footer */
.card-footer {
    padding: 0 12px 12px 12px;
    display: flex;
    justify-content: flex-end;
}
.review-btn {
    background: #ff6600; color: white; border: none;
    padding: 6px 18px; border-radius: 18px; font-size: 13px; font-weight: 500;
}
.review-btn:active { opacity: 0.9; }
</style>
