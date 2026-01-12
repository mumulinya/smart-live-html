<template>
  <div class="shop-detail-page">
    <div class="loading-mask" :class="{ hidden: !isLoading }">
       <div class="loading-spinner"></div>
       <div class="loading-text">加载中...</div>
    </div>

    <div class="header">
      <div class="header-back-btn" @click="goBack"><i class="el-icon-arrow-left"></i></div>
      <div class="header-title">{{shop.name}}</div>
      <div class="header-share">...</div>
    </div>

    <div class="shop-info-container" v-if="shop.id">
       <!-- Top Gallery/Cover -->
       <div class="shop-header-gallery" v-if="gallery.length > 0">
           <div class="header-gallery-wrapper">
               <img v-for="(img, idx) in gallery" :key="idx" :src="img" @click="previewImage(gallery, idx)">
           </div>
           <div class="gallery-count">{{gallery.length}}张</div>
       </div>
       <div class="top-placeholder" v-else></div>
       
       <div class="info-box">
          <div class="shop-title">{{shop.name}}</div>
          <div class="shop-rate">
             <el-rate disabled :model-value="shop.score/10" text-color="#F63" show-score :max="5" score-template="{value}"></el-rate>
             <span>{{shop.comments}}条</span>
             <span>￥{{shop.avgPrice}}/人</span>
          </div>
          <div class="shop-rate-detail">
             <span class="detail-tag">口味 {{(shop.score/10).toFixed(1)}}</span>
             <span class="detail-tag">环境 {{(shop.score/10).toFixed(1)}}</span>
             <span class="detail-tag">服务 {{(shop.score/10).toFixed(1)}}</span>
          </div>
          
          <div class="shop-address-row">
             <div class="address-icon"><i class="el-icon-map-location"></i></div>
             <div class="address-text">{{shop.address || '暂无详细地址'}}</div>
             <div class="address-action" @click="openMap"><i class="el-icon-location"></i></div>
          </div>
       </div>

       <!-- Removed duplicate gallery from here -->
       <div class="shop-divider"></div>
       
       <div class="shop-time">
          <i class="el-icon-watch"></i>
          <span class="time-label">营业时间</span>
          <span class="time-value">{{shop.openHours || '10:00-22:00'}}</span>
          <a class="time-more">详情 <i class="el-icon-arrow-right"></i></a>
       </div>

       <div class="shop-divider"></div>

       <!-- Vouchers -->
       <div class="voucher-list" v-if="vouchers.length>0">
          <div class="section-title">
             <span class="icon-text text-orange">券</span> 
             <span class="title-text">代金券</span>
          </div>
          <div class="voucher-item" v-for="v in vouchers" :key="v.id">
             <!-- Left: Icon -->
             <div class="ticket-stub" :class="{seckill: v.type === 1}">
                <div class="ticket-val">¥{{v.payValue}}</div>
                <div class="ticket-type">{{ v.type === 1 ? '秒杀券' : '代金券' }}</div>
             </div>
             <!-- Middle: Info -->
             <div class="voucher-info">
                <div class="voucher-title">{{v.title}}</div>
                <div class="voucher-sub">{{v.subTitle}}</div>
                
                <!-- Normal Voucher Meta -->
                <div class="voucher-meta" v-if="v.type !== 1">
                   <span class="current-price">¥{{v.payValue}}</span>
                   <span class="orig-price" v-if="v.actualValue">¥{{v.actualValue}}</span>
                   <span class="discount-tag" v-if="v.actualValue">{{(v.payValue*10/v.actualValue).toFixed(1)}}折</span>
                </div>
                <!-- Seckill Meta -->
                <div class="seckill-meta" v-else>
                   <div class="seckill-price-row">
                      <span class="current-price text-red">¥{{v.payValue}}</span>
                      <span class="orig-price">¥{{v.actualValue}}</span>
                   </div>
                   <div class="seckill-progress">
                      <div class="progress-txt">剩余 {{v.stock}} 张</div>
                   </div>
                </div>
             </div>
             <!-- Right: Button -->
             <div class="voucher-action">
                 <template v-if="v.type === 1">
                    <div class="seckill-timer" v-if="isNotBegin(v)">
                       {{formatTime(v)}} 开始
                    </div>
                    <div class="buy-btn seckill-btn" 
                         :class="{disabled: isNotBegin(v) || v.stock < 1}" 
                         @click="doSeckill(v)">
                       {{ isNotBegin(v) ? '待开始' : (v.stock < 1 ? '已抢光' : '限时抢购') }}
                    </div>
                 </template>
                 <template v-else>
                    <div class="buy-btn" @click="doBuy(v)">抢购</div>
                    <div class="sold-count">{{v.sold || 0}}已售</div>
                 </template>
             </div>
          </div>
       </div>
       <div class="voucher-list" v-else>
           <div class="empty-tip">暂无优惠券</div>
       </div>
       
       <div class="shop-divider"></div>
       
       <!-- Comments -->
       <div class="comments-section">
          <div class="section-header">
             <div class="section-title">网友评价 <span class="count">({{comments.length || 0}})</span></div>
          </div>
          
          <div class="empty-comments" v-if="comments.length === 0 && !aiComment">
             <div class="empty-text">暂无评价，快来抢沙发～</div>
          </div>
          
          <!-- AI Comment -->
          <div class="comment-box ai-generated-comment" v-if="aiComment">
             <div class="comment-icon ai-comment-icon"><i class="el-icon-magic-stick"></i></div>
             <div class="comment-info ai-comment-info">
                <div class="comment-user">
                   智评助手
                   <span class="ai-verified">官方认证</span>
                </div>
                <div class="comment-content">{{aiComment.content}}</div>
                <div class="comment-stats"><span class="ai-time">{{formatDate(aiComment.createTime)}}</span> <span class="ai-tag">AI生成</span></div>
             </div>
          </div>
          
          <div class="comment-box" v-for="c in comments.slice(0, 3)" :key="c.id">
             <div class="comment-icon"><img :src="c.userIcon || '/imgs/icons/default-icon.png'"></div>
             <div class="comment-info">
                <div class="comment-user">{{c.nickName || '匿名用户'}} <span>Lv{{c.userLevel || 1}}</span></div>
                <div class="comment-rating">
                   <el-rate :model-value="c.rating" disabled size="small"></el-rate>
                   <span class="score">{{c.rating}}分</span>
                </div>
                <div class="comment-content">{{c.content}}</div>
                <div class="comment-images" v-if="c.images && c.images.length">
                   <img v-for="(img, idx) in c.images" :key="idx" :src="img" @click="previewImage(c.images, idx)">
                </div>
                <div class="comment-stats">
                   {{formatDate(c.createTime)}} · 浏览{{c.viewCount || 0}} · {{c.liked || 0}}点赞
                </div>
             </div>
             </div>

          
          <div class="view-all" @click="viewAllComments">
             查看全部{{comments.length}}条评价 <i class="el-icon-arrow-right"></i>
          </div>
       </div>

    </div>

    <!-- Foot Bar -->
    <div class="foot-bar">
       <div class="foot-item" @click="toggleStar" :class="{active: isStared, animate: starAnimating}">
          <i :class="isStared ? 'el-icon-star-on' : 'el-icon-star-off'"></i>
          <span>{{isStared ? '已收藏' : '收藏'}}</span>
       </div>
       <div class="foot-item action-big" @click="writeComment">
          <i class="el-icon-edit-outline"></i>
          <span>写评价</span>
       </div>
    </div>
    
    <!-- Image Preview Overlay -->
    <div class="image-preview" v-if="showPreview" @click="closePreview">
       <div class="preview-close" @click.stop="closePreview"><i class="el-icon-close"></i></div>
       <div class="preview-swiper">
          <img :src="previewList[previewIndex]" class="preview-img">
       </div>
       <div class="preview-indicator">{{previewIndex+1}} / {{previewList.length}}</div>
    </div>

  </div>
</template>

<script>
import { getShopDetail, getShopVouchers, buyVoucherAPI, seckillVoucherAPI } from '@/api/shop';
import { isStar, toggleStar, getComments } from '@/api/interaction';
import { getCurrentUser } from '@/api/user';

export default {
  name: 'ShopDetail',
  data() {
    return {
       isLoading: true,
       shop: {},
       gallery: [],
       vouchers: [],
       comments: [],
       isStared: false,
       starAnimating: false,
       user: null,
       dataLoadedCount: 0,
       // Preview
       showPreview: false,
       previewList: [],
       previewIndex: 0,
       aiComment: null
    }
  },
  computed: {
     fileURL() {
        return this.$fileURL || '';
     }
  },
  created() {
     const id = this.$route.query.id;
     if(!id) {
        this.$message.error("参数错误");
        this.isLoading = false;
        return;
     }
     
     this.fetchData(id);
     this.checkLogin();
  },
  methods: {
     fetchData(id) {
        // 1. Shop Detail
        getShopDetail(id).then(res => {
           let data = res;
           if(res && res.data) data = res.data;
           
           if(data) {
              this.shop = data;
              // Parse images
              if(this.shop.images) {
                 const rawImgs = this.shop.images.split(',');
                 this.gallery = rawImgs.map(img => this.fileURL + img);
                 // Main image fallback if needed, but we use gallery now
              }
              this.checkStarStatus(id);
           }
           this.onDataLoaded();
        }).catch(err => {
           console.error(err);
           this.onDataLoaded();
        });
        
        // 2. Vouchers
        getShopVouchers(id).then(res => {
           let data = res;
           if(res && res.data) data = res.data;
           this.vouchers = data || [];
           this.onDataLoaded();
        }).catch(err => {
           console.error("Voucher fetch error", err);
           this.onDataLoaded();
        });
        
        // 3. Comments
        getComments({ sourceId: id, sourceType: 2, current: 1 }).then(res => {
           let list = [];
           if(Array.isArray(res)) list = res;
           else if(res && Array.isArray(res.list)) list = res.list;
           else if(res && Array.isArray(res.data)) list = res.data;
           else if(res && res.data && Array.isArray(res.data.records)) list = res.data.records;
           
           this.comments = (list || []).map(c => {
               if(c.userIcon) c.userIcon = this.fileURL + c.userIcon;
               if(c.images && typeof c.images === 'string') {
                  c.images = c.images.split(',').filter(x=>x).map(img => this.fileURL + img);
               } else if (!c.images) {
                  c.images = [];
               }
               return c;
           });

           // Extract AI Comment
           const aiIdx = this.comments.findIndex(c => c.isAIGenerated);
           if(aiIdx > -1) {
              this.aiComment = this.comments[aiIdx];
              this.comments.splice(aiIdx, 1);
           } else {
              this.aiComment = null;
           }

           this.onDataLoaded();
        }).catch(err => {
           this.onDataLoaded();
        });
     },
     onDataLoaded() {
        this.dataLoadedCount++;
        if(this.dataLoadedCount >= 3) {
           this.isLoading = false;
        }
     },
     goBack() {
        this.$router.go(-1);
     },
     checkLogin() {
        const token = localStorage.getItem('token');
        if(token) {
           getCurrentUser().then(res => this.user = res);
        }
     },
     checkStarStatus(id) {
        if(!localStorage.getItem('token')) return;
        isStar({ sourceId: id, sourceType: 2 }).then(res => {
           const val = (typeof res === 'object' && res !== null && res.data !== undefined) ? res.data : res;
           this.isStared = !!val;
        });
     },
     toggleStar() {
        if(!localStorage.getItem('token')) {
           this.$message.warning("请先登录");
           this.$router.push('/user/login');
           return;
        }
        
        const isCollection = !this.isStared;
        // Animation
        this.starAnimating = true;
        
        toggleStar({
           sourceId: this.shop.id,
           sourceType: 2,
           isCollection: isCollection
        }).then(() => {
           this.isStared = isCollection;
           this.$message.success(isCollection ? "收藏成功" : "已取消收藏");
           setTimeout(() => this.starAnimating = false, 300);
        }).catch(() => {
           this.starAnimating = false;
        });
     },
     previewImage(list, index) {
        this.previewList = list;
        this.previewIndex = index;
        this.showPreview = true;
     },
     closePreview() {
        this.showPreview = false;
     },
     writeComment() {
        if(!localStorage.getItem('token')) {
            this.$message.warning("请先登录");
            this.$router.push('/user/login');
            return;
        }
        // Redirect to comment list page for writing
        this.viewAllComments();
     },
     viewAllComments() {
        this.$router.push({
           path: '/comment/list',
           query: { id: this.shop.id, type: 2 } // 2=Shop
        });
     },
     openMap() {
        if (!this.shop.x || !this.shop.y) {
           this.$message.warning("该店铺暂无经纬度信息");
           return;
        }
        this.$router.push({
           path: '/map',
           query: { 
              center: `${this.shop.x},${this.shop.y}`, 
              shopId: this.shop.id 
           }
        });
     },
     isNotBegin(v) {
        return new Date(v.beginTime).getTime() > new Date().getTime();
     },
     isEnd(v) {
        return new Date(v.endTime).getTime() < new Date().getTime();
     },
     formatTime(v) {
        let b = new Date(v.beginTime);
        let e = new Date(v.endTime);
        return (b.getMonth() + 1) + "." + b.getDate() + " " + b.getHours() + ":" + String(b.getMinutes()).padStart(2,'0');
     },
     formatDate(time) {
        if(!time) return '';
        const date = new Date(time);
        return `${date.getFullYear()}.${date.getMonth()+1}.${date.getDate()}`;
     },
     doBuy(v) {
        if(!localStorage.getItem('token')) return this.$router.push('/user/login');
        
        buyVoucherAPI(v.id).then(res => {
            this.$message.success("抢购成功，订单ID: " + (res.data || res));
        });
     },
     doSeckill(v) {
        if(!localStorage.getItem('token')) return this.$router.push('/user/login');
        if(this.isNotBegin(v)) return this.$message.warning("抢购未开始");
        if(this.isEnd(v)) return this.$message.warning("抢购已结束");
        if(v.stock < 1) return this.$message.warning("已抢光");
        
        seckillVoucherAPI(v.id).then(res => {
            this.$message.success("秒杀成功，订单ID: " + (res.data || res));
            v.stock--; // Simple optimist update
        }).catch(err => {
            console.error(err);
            this.$message.error(err.message || "抢购失败");
        });
     }
  }
}
</script>

<style scoped>
.shop-detail-page { height: 100vh; display: flex; flex-direction: column; background: #f0f2f5; }

/* Loading */
.loading-mask { position: fixed; inset: 0; background: white; z-index: 999; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.loading-mask.hidden { display: none; }
.loading-spinner { width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #FF6B00; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

/* Header */
.header { height: 48px; background: rgba(255,255,255,0.9); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: space-between; padding: 0 16px; position: sticky; top: 0; z-index: 100; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
.header-title { font-weight: 600; font-size: 17px; max-width: 70%; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }

/* Container */
.shop-info-container { flex: 1; overflow-y: auto; overflow-x: hidden; position: relative; padding-bottom: 58px; }
.shop-header-gallery { height: 200px; position: relative; width: 100%; overflow: hidden; }
.header-gallery-wrapper { display: flex; width: 100%; height: 100%; overflow-x: auto; scroll-snap-type: x mandatory; }
.header-gallery-wrapper img { width: 100%; height: 100%; object-fit: cover; flex-shrink: 0; scroll-snap-align: center; }
.gallery-count { position: absolute; right: 15px; bottom: 35px; background: rgba(0,0,0,0.6); color: white; padding: 2px 10px; border-radius: 12px; font-size: 11px; z-index: 5; }

.top-placeholder { height: 100px; background: linear-gradient(135deg, #333, #555); }

/* Info Card - adjusted margin to overlap images */
.info-box { background: white; border-radius: 12px 12px 0 0; margin-top: -20px; padding: 20px 16px; position: relative; z-index: 10; min-height: 100px; }

.shop-title { font-size: 22px; font-weight: 700; color: #333; margin-bottom: 8px; }
.shop-rate { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #666; margin-bottom: 6px; }
.shop-rate-detail { font-size: 12px; color: #999; display: flex; gap: 8px; margin-bottom: 15px; }
.detail-tag { background: #f7f7f7; padding: 2px 6px; border-radius: 4px; }
.shop-address-row { display: flex; align-items: center; padding-top: 15px; border-top: 1px solid #f5f5f5; }
.address-icon { color: #ccc; }
.address-text { flex: 1; margin: 0 8px; font-size: 14px; color: #333; line-height: 1.4; }
.address-action { padding-left: 15px; border-left: 1px solid #eee; color: #409EFF; font-size: 20px; }

/* Removed old gallery styles */


.shop-divider { height: 10px; background: #f0f2f5; }

/* Time */
.shop-time { background: white; padding: 14px 16px; display: flex; align-items: center; font-size: 14px; }
.time-label { margin: 0 8px; font-weight: 500; }
.time-value { flex: 1; color: #333; }
.time-more { font-size: 12px; color: #999; }

/* Vouchers */
.voucher-list { background: white; padding: 16px; }
.section-title { font-size: 16px; font-weight: 700; margin-bottom: 15px; display: flex; align-items: center; }
.icon-text { background: linear-gradient(90deg, #FF6B00, #FF9000); color: white; padding: 1px 4px; border-radius: 4px; font-size: 11px; margin-right: 6px; }

.voucher-item { display: flex; margin-bottom: 12px; background: #FFFBF5; border: 1px solid #FFE5D2; border-radius: 8px; overflow: hidden; position: relative; }
.voucher-item::before, .voucher-item::after { content: ''; position: absolute; width: 10px; height: 10px; background: white; border-radius: 50%; top: 50%; border: 1px solid #FFE5D2; }
.voucher-item::before { left: -6px; margin-top: -5px; clip-path: polygon(50% 0, 100% 0, 100% 100%, 50% 100%); }
.voucher-item::after { right: -6px; margin-top: -5px; clip-path: polygon(0 0, 50% 0, 50% 100%, 0 100%); }

.ticket-stub { width: 70px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #FFF5F0; border-right: 1px dashed #FFCAB0; color: #FF4400; }
.ticket-stub.seckill { background: #FF4400; color: white; border-right: 1px dashed rgba(255,255,255,0.3); }

.ticket-val { font-size: 16px; font-weight: bold; }
.ticket-type { font-size: 10px; }

.voucher-info { flex: 1; padding: 10px 12px; display: flex; flex-direction: column; justify-content: center; }
.voucher-title { font-weight: 600; font-size: 14px; color: #333; }
.voucher-sub { font-size: 11px; color: #999; margin: 4px 0; }
.voucher-meta { display: flex; align-items: baseline; gap: 6px; }
.current-price { color: #FF4400; font-weight: bold; font-size: 15px; }
.orig-price { text-decoration: line-through; color: #999; font-size: 11px; }
.discount-tag { border: 1px solid #FF4400; color: #FF4400; font-size: 10px; padding: 0 2px; border-radius: 2px; transform: scale(0.9); }

.seckill-meta { margin-top: 4px; }
.seckill-price-row { display: flex; align-items: baseline; gap: 6px; margin-bottom: 4px; }
.text-red { color: #FF4400; font-weight: bold; font-size: 15px;}
.seckill-progress { font-size: 10px; color: #FF4400; background: #FFE5D2; display: inline-block; padding: 1px 6px; border-radius: 8px; }

.voucher-action { width: 85px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding-right: 10px; }
.buy-btn { background: #FF4400; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; cursor: pointer; }
.buy-btn.seckill-btn { background: linear-gradient(90deg, #FF6B00, #FF4400); box-shadow: 0 2px 6px rgba(255,68,0,0.3); }
.buy-btn.disabled { background: #ccc; cursor: not-allowed; box-shadow: none; }
.sold-count { font-size: 10px; color: #999; margin-top: 4px; }
.seckill-timer { font-size: 10px; color: #F63; margin-bottom: 4px; }

.empty-tip { text-align: center; color: #999; font-size: 13px; padding: 10px 0; }
.empty-text { text-align: center; color: #999; padding: 20px; font-size: 13px; }

/* Comments */
.comments-section { background: white; padding: 16px 16px 0; margin-bottom: 0; }
.section-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 16px; }
.section-more { font-size: 12px; color: #999; }
.count { font-size: 12px; color: #999; font-weight: normal; }

.comment-box { display: flex; padding-bottom: 16px; border-bottom: 1px solid #f5f5f5; margin-bottom: 16px; }
.comment-box:last-child { border-bottom: none; }
.comment-icon { width: 36px; height: 36px; border-radius: 50%; overflow: hidden; margin-right: 12px; flex-shrink: 0; }
.comment-icon img { width: 100%; height: 100%; object-fit: cover; }
.comment-info { flex: 1; }
.comment-user { font-weight: 500; font-size: 14px; margin-bottom: 4px; }
.comment-user span { font-size: 10px; color: #F63; background: #fff5f5; padding: 1px 4px; border-radius: 4px; margin-left: 5px; }
.comment-rating { display: flex; align-items: center; margin-bottom: 5px; }
.score { color: #F63; font-size: 12px; margin-left: 5px; }
.comment-content { font-size: 14px; line-height: 1.5; margin-bottom: 8px; }
.comment-images { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 8px; }
.comment-images img { width: 80px; height: 80px; object-fit: cover; border-radius: 4px; cursor: pointer; }
.comment-stats { font-size: 12px; color: #999; }

.view-all { text-align: center; padding: 12px 0; color: #666; font-size: 14px; border-top: 1px solid #f5f5f5; cursor: pointer; }

/* Foot Bar */
.foot-bar { height: 56px; background: white; border-top: 1px solid #eee; display: flex; padding-bottom: env(safe-area-inset-bottom); }
.foot-item { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 10px; color: #666; transition: all 0.2s; }
.foot-item i { font-size: 20px; margin-bottom: 2px; }
.foot-item.active i, .foot-item.active span { color: #FF6B00; }
.foot-item.action-big { flex: 1.5; background: #FF6B00; color: white; margin: 8px 16px; border-radius: 20px; flex-direction: row; gap: 6px; font-size: 14px; }
.foot-item.action-big i { font-size: 16px; margin: 0; color: white; }

/* Preview Overlay */
.image-preview { position: fixed; inset: 0; background: black; z-index: 1000; display: flex; flex-direction: column; justify-content: center; }
.preview-swiper { width: 100%; height: 60vh; display: flex; align-items: center; justify-content: center; }
.preview-img { max-width: 100%; max-height: 100%; }
.preview-close { position: absolute; top: 20px; right: 20px; color: white; font-size: 30px; z-index: 1001; }
.preview-indicator { position: absolute; bottom: 40px; width: 100%; text-align: center; color: white; font-size: 16px; }

@keyframes pop { 50% { transform: scale(1.2); } }
.animate i { animation: pop 0.3s ease; }
  /* AI Comment Styles */
  .ai-generated-comment {
     background: #f7f9fc;
     border: 1px solid #e0e6ed;
     border-radius: 12px;
     margin-bottom: 15px;
     padding: 16px;
     box-shadow: 0 4px 12px rgba(24, 144, 255, 0.05);
  }
  .ai-comment-icon {
     background: linear-gradient(135deg, #6366f1, #3b82f6);
     border-radius: 50%;
     color: white;
     display: flex; align-items: center; justify-content: center;
     width: 36px; height: 36px;
  }
  .ai-verified {
     background: linear-gradient(90deg, #f59e0b, #d97706);
     color: white;
     font-size: 10px;
     padding: 2px 6px;
     border-radius: 4px;
     margin-left: 8px;
     font-weight: 500;
     display: inline-flex; align-items: center;
  }
  .ai-time { color: #94a3b8; font-size: 12px; }
  .ai-tag {
     background: #eff6ff;
     color: #3b82f6;
     border: 1px solid #bfdbfe;
     padding: 1px 8px;
     border-radius: 12px;
     font-size: 10px;
     margin-left: 10px;
     font-weight: 500;
  }
</style>
