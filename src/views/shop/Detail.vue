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
       <div class="shop-header-gallery" 
            v-if="gallery.length > 0"
            @touchstart="onTouchStart"
            @touchmove="onTouchMove"
            @touchend="onTouchEnd"
       >
           <el-carousel 
             ref="imageCarousel"
             :height="carouselHeight" 
             :autoplay="false" 
             arrow="never" 
             indicator-position="none"
             @change="onCarouselChange"
           >
              <el-carousel-item v-for="(img, idx) in gallery" :key="idx">
                 <img :src="img" class="full-carousel-img" @click="previewImage(gallery, idx)" @load="onImageLoad">
              </el-carousel-item>
           </el-carousel>
           <!-- 图片序号指示器 -->
           <div class="image-indicator">{{currentImageIndex + 1}}/{{gallery.length}}</div>
           <!-- 底部点状指示器 -->
           <div class="dots-indicator" v-if="gallery.length > 1">
             <span 
               v-for="(img, i) in gallery" 
               :key="i" 
               class="dot" 
               :class="{active: i === currentImageIndex}"
               @click="goToImage(i)"
             ></span>
           </div>
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
             <div class="comment-icon" @click.stop="toUserDetail(c.userId)">
                <img :src="c.userIcon || '/imgs/icons/default-icon.png'">
             </div>
             <div class="comment-info">
                <div class="comment-user" @click.stop="toUserDetail(c.userId)">
                   {{c.nickName || '匿名用户'}} <span>Lv{{c.userLevel || 1}}</span>
                </div>
                <div class="comment-rating">
                   <el-rate :model-value="c.rating" disabled size="small"></el-rate>
                   <span class="score">{{c.rating}}分</span>
                </div>
                <div class="comment-content">{{c.content}}</div>
                <div class="comment-images" v-if="c.images && c.images.length">
                   <img v-for="(img, idx) in c.images" :key="idx" :src="img" @click="previewImage(c.images, idx)">
                </div>
                <div class="comment-stats">
                   <div class="comment-interactions">
                   <span class="comment-time">{{formatDate(c.createTime)}}</span>
                   <div class="comment-actions">
                      <div class="c-action-btn" @click.stop="handleCommentLike(c)">
                         <svg viewBox="0 0 1024 1024" width="16" height="16">
                           <path d="M160 944c0 8.8-7.2 16-16 16h-32c-26.5 0-48-21.5-48-48V528c0-26.5 21.5-48 48-48h32c8.8 0 16 7.2 16 16v448zM96 416c-53 0-96 43-96 96v416c0 53 43 96 96 96h96c17.7 0 32-14.3 32-32V448c0-17.7-14.3-32-32-32H96zM505.6 64c16.2 0 26.4 8.7 31 13.9 4.6 5.2 12.1 16.3 10.3 32.4l-23.5 203.4c-4.9 42.2 8.6 84.6 36.8 116.4 28.3 31.7 68.9 49.9 111.4 49.9h271.2c6.6 0 10.8 3.3 13.2 6.1s5 7.5 4 14l-48 303.4c-6.9 43.6-29.1 83.4-62.7 112C815.8 944.2 773 960 728.9 960h-317c-33.1 0-59.9-26.8-59.9-59.9v-455c0-6.1 1.7-12 5-17.1 69.5-109 106.4-234.2 107-364h41.6z m0-64h-44.9C427.2 0 400 27.2 400 60.7c0 127.1-39.1 251.2-112 355.3v484.1c0 68.4 55.5 123.9 123.9 123.9h317c122.7 0 227.2-89.3 246.3-210.5l47.9-303.4c7.8-49.4-30.4-94.1-80.4-94.1H671.6c-50.9 0-90.5-44.4-84.6-95l23.5-203.4C617.7 55 568.7 0 505.6 0z" :fill="c.isLike ? '#ff2442' : '#999'"></path>
                         </svg>
                         {{c.liked || 0}}
                      </div>
                      <div class="c-action-btn" @click.stop="handleCommentReply(c)">
                         <i class="el-icon-chat-dot-square"></i>
                      </div>
                      <div class="c-action-btn delete-btn" v-if="user && user.id === c.userId" @click.stop="handleCommentDelete(c)">
                         <i class="el-icon-delete"></i>
                      </div>
                   </div>
                </div>

                <!-- Replies -->
                <div class="comment-replies" v-if="c.replies && c.replies.length > 0">
                    <div class="reply-item" v-for="r in c.replies" :key="r.id">
                        <div class="reply-avatar" @click.stop="toUserDetail(r.userId)">
                           <img :src="r.userIcon || r.icon || '/imgs/icons/default-icon.png'" alt="">
                        </div>
                        <div class="reply-main">
                           <div class="reply-header">
                              <span class="reply-user" @click.stop="toUserDetail(r.userId)">{{r.nickName || '匿名用户'}}</span>
                              <span class="reply-time">{{formatDate(r.createTime)}}</span>
                           </div>
                           <div class="reply-content">
                                <span v-if="r.replyToName" class="reply-target">回复 @{{r.replyToName}}</span>
                                {{r.content}}
                           </div>
                           <div class="comment-images" v-if="r.images && r.images.length">
                              <img v-for="(img, idx) in r.images" :key="idx" :src="img" @click.stop="previewImage(r.images, idx)">
                           </div>
                           <div class="reply-actions">
                                <div class="c-action-btn" @click.stop="handleCommentLike(r)">
                                   <svg viewBox="0 0 1024 1024" width="16" height="16">
                                     <path d="M160 944c0 8.8-7.2 16-16 16h-32c-26.5 0-48-21.5-48-48V528c0-26.5 21.5-48 48-48h32c8.8 0 16 7.2 16 16v448zM96 416c-53 0-96 43-96 96v416c0 53 43 96 96 96h96c17.7 0 32-14.3 32-32V448c0-17.7-14.3-32-32-32H96zM505.6 64c16.2 0 26.4 8.7 31 13.9 4.6 5.2 12.1 16.3 10.3 32.4l-23.5 203.4c-4.9 42.2 8.6 84.6 36.8 116.4 28.3 31.7 68.9 49.9 111.4 49.9h271.2c6.6 0 10.8 3.3 13.2 6.1s5 7.5 4 14l-48 303.4c-6.9 43.6-29.1 83.4-62.7 112C815.8 944.2 773 960 728.9 960h-317c-33.1 0-59.9-26.8-59.9-59.9v-455c0-6.1 1.7-12 5-17.1 69.5-109 106.4-234.2 107-364h41.6z m0-64h-44.9C427.2 0 400 27.2 400 60.7c0 127.1-39.1 251.2-112 355.3v484.1c0 68.4 55.5 123.9 123.9 123.9h317c122.7 0 227.2-89.3 246.3-210.5l47.9-303.4c7.8-49.4-30.4-94.1-80.4-94.1H671.6c-50.9 0-90.5-44.4-84.6-95l23.5-203.4C617.7 55 568.7 0 505.6 0z" :fill="r.isLike ? '#ff2442' : '#999'"></path>
                                   </svg>
                                   <span v-if="r.liked > 0">{{r.liked}}</span>
                                </div>
                                <div class="c-action-btn" @click.stop="handleCommentReply(r)">
                                   <i class="el-icon-chat-dot-square"></i>
                                </div>
                                 <div class="c-action-btn delete-btn" v-if="user && user.id === r.userId" @click.stop="handleCommentDelete(r)">
                                   <i class="el-icon-delete"></i>
                                </div>
                           </div>
                        </div>
                    </div>
                </div>
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
       <div class="foot-item" @click="toggleStar" :class="{active: shop.isStared, animate: starAnimating}">
          <i :class="shop.isStared ? 'el-icon-star-on' : 'el-icon-star-off'"></i>
          <span>{{shop.isStared ? '已收藏' : '收藏'}} {{shop.stared || 0}}</span>
       </div>
       <div class="foot-item action-big" @click="writeComment">
          <i class="el-icon-edit-outline"></i>
          <span>写评价</span>
       </div>
    </div>
    
     <div class="image-preview" v-if="showPreview" @click="closePreview">
        <div class="preview-close" @click.stop="closePreview"><i class="el-icon-close"></i></div>
        <div class="preview-swiper">
           <img :src="previewList[previewIndex]" class="preview-img">
        </div>
        <div class="preview-indicator">{{previewIndex+1}} / {{previewList.length}}</div>
     </div>

   <!-- Comment Pop Input -->
   <div class="comment-pop-overlay" v-if="showCommentPublish" @click="closeCommentModal">
      <div class="comment-pop-box" @click.stop>
         <div class="pop-header">
            <span class="pop-title">{{ replyToComment ? ('回复 @' + replyToComment.nickName) : '发表评论' }}</span>
            <i class="el-icon-close pop-close" @click="closeCommentModal"></i>
         </div>
         <div class="pop-textarea">
            <textarea 
               ref="commentTextarea"
               v-model="commentText" 
               placeholder="分享你此刻的想法..." 
               :maxlength="500"
               rows="3"
            ></textarea>
         </div>
         <div class="pop-images" v-if="selectedImages.length > 0">
            <div class="pop-image-item" v-for="(img, idx) in selectedImages" :key="idx">
               <img :src="img.url">
               <i class="el-icon-close" @click="removeImage(idx)"></i>
            </div>
            <div class="pop-image-add" @click="$refs.imageInput.click()" v-if="selectedImages.length < 9">
               <i class="el-icon-plus"></i>
            </div>
         </div>
         <div class="pop-toolbar">
            <div class="pop-toolbar-left">
               <svg class="pic-icon" @click="$refs.imageInput.click()" viewBox="0 0 1024 1024" width="24" height="24">
                  <path d="M896 160H128c-35.2 0-64 28.8-64 64v576c0 35.2 28.8 64 64 64h768c35.2 0 64-28.8 64-64V224c0-35.2-28.8-64-64-64z m0 640H128V224h768v576z" fill="#666"></path>
                  <path d="M320 512c53 0 96-43 96-96s-43-96-96-96-96 43-96 96 43 96 96 96z" fill="#666"></path>
                  <path d="M896 736l-192-192-128 96-192-160-256 256v64h768z" fill="#666"></path>
               </svg>
               <input type="file" ref="imageInput" multiple accept="image/*" @change="handleImageUpload" style="display:none">
               <div class="pop-rating-inline" v-if="!replyToComment">
                   <el-rate v-model="commentRating" :colors="['#99A9BF', '#F7BA2A', '#FF9900']"></el-rate>
               </div>
            </div>
            <el-button type="primary" size="small" :disabled="!commentText.trim()" @click="publishComment">发送</el-button>
         </div>
      </div>
   </div>

  </div>
</template>

<script>
import { getShopDetail, getShopVouchers, buyVoucherAPI, seckillVoucherAPI } from '@/api/shop';
import { isStar, toggleStar, getComments, likeComment, addComment, removeComment } from '@/api/interaction';
import { uploadFile } from '@/api/common';
import { getCurrentUser } from '@/api/user';
import '@/assets/css/blog-detail.css'; // Import blog styles to reuse reply CSS

export default {
  name: 'ShopDetail',
  data() {
    return {
       isLoading: true,
       shop: {},
       gallery: [],
       vouchers: [],
       comments: [],
       // isStared now comes from shop.isStared (API response)
       starAnimating: false,
       user: null,
       dataLoadedCount: 0,
       // Preview
       showPreview: false,
       previewList: [],
       previewIndex: 0,
       aiComment: null,
       
       // Carousel
       currentImageIndex: 0,
       carouselHeight: '220px',
       touchStartX: 0,
       touchEndX: 0,

       // Comment interaction
       showCommentPublish: false,
       commentText: '',
       commentRating: 5,
       replyToComment: null,
       selectedImages: []
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
              // isStared and stared come from shop data directly
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
           
            const processedList = (list || []).map(c => ({
               ...c,
               userIcon: c.userIcon ? (c.userIcon.startsWith('http') ? c.userIcon : this.fileURL + c.userIcon) : '',
               images: c.images ? c.images.split(',').filter(x=>x).map(i => i.startsWith('http') ? i : this.fileURL + i) : []
            }));

            // Extract AI Comment
            const aiIdx = processedList.findIndex(c => c.isAIGenerated);
            if(aiIdx > -1) {
               this.aiComment = processedList[aiIdx];
               processedList.splice(aiIdx, 1);
            }

            // Flatten logic
            const commentMap = {};
            processedList.forEach(c => {
               c.replies = []; 
               commentMap[c.id] = c;
            });
            
            const roots = [];
            
            // Helper to find root ancestor
            const findRoot = (comment) => {
               let curr = comment;
               let depth = 0;
               while(curr && curr.answerId && depth < 20) {
                   curr = commentMap[curr.answerId];
                   depth++;
               }
               return (curr && !curr.answerId) ? curr : null;
            };

            processedList.forEach(c => {
                if (!c.answerId) {
                    roots.push(c);
                } else {
                    const directParent = commentMap[c.answerId];
                    if(directParent) {
                        c.replyToName = directParent.nickName;
                        const root = findRoot(c);
                        if(root) root.replies.push(c);
                        else roots.push(c);
                    } else {
                       roots.push(c);
                    }
                }
            });
            // Sort replies
            roots.forEach(r => {
               if(r.replies && r.replies.length) {
                  r.replies.sort((a,b) => new Date(a.createTime) - new Date(b.createTime));
               }
            });

            this.comments = roots.slice(0, 3);
            this.onDataLoaded();
         }).catch(err => {
            this.onDataLoaded();
         });
     },
     loadComments() {
        getComments({ sourceId: this.shop.id, sourceType: 2, current: 1 }).then(res => {
           let list = [];
           if(Array.isArray(res)) list = res;
           else if(res && Array.isArray(res.list)) list = res.list;
           else if(res && Array.isArray(res.data)) list = res.data;
           else if(res && res.data && Array.isArray(res.data.records)) list = res.data.records;
           
            const processedList = (list || []).map(c => ({
               ...c,
               userIcon: c.userIcon ? (c.userIcon.startsWith('http') ? c.userIcon : this.fileURL + c.userIcon) : '',
               images: c.images ? c.images.split(',').filter(x=>x).map(i => i.startsWith('http') ? i : this.fileURL + i) : []
            }));

            // Extract AI Comment
            const aiIdx = processedList.findIndex(c => c.isAIGenerated);
            if(aiIdx > -1) {
               this.aiComment = processedList[aiIdx];
               processedList.splice(aiIdx, 1);
            }

            // Flatten logic
            const commentMap = {};
            processedList.forEach(c => {
               c.replies = []; 
               commentMap[c.id] = c;
            });
            
            const roots = [];
            
            const findRoot = (comment) => {
               let curr = comment;
               let depth = 0;
               while(curr && curr.answerId && depth < 20) {
                   curr = commentMap[curr.answerId];
                   depth++;
               }
               return (curr && !curr.answerId) ? curr : null;
            };

            processedList.forEach(c => {
                if (!c.answerId) {
                    roots.push(c);
                } else {
                    const directParent = commentMap[c.answerId];
                    if(directParent) {
                        c.replyToName = directParent.nickName;
                        const root = findRoot(c);
                        if(root) root.replies.push(c);
                        else roots.push(c);
                    } else {
                       roots.push(c);
                    }
                }
            });
            roots.forEach(r => {
               if(r.replies && r.replies.length) {
                  r.replies.sort((a,b) => new Date(a.createTime) - new Date(b.createTime));
               }
            });

            this.comments = roots.slice(0, 3);
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
         if(!token) return; // 未登录不调用接口
         getCurrentUser().then(res => {
             let u = res.data || res;
             if(u && u.data) u = u.data;
             this.user = u || {};
         }).catch(()=>{});
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
        
        const newStatus = !this.shop.isStared;
        
        // Optimistic update
        const originalStatus = this.shop.isStared;
        const originalCount = this.shop.stared;
        
        this.shop.isStared = newStatus;
        this.shop.stared = newStatus ? (this.shop.stared || 0) + 1 : Math.max((this.shop.stared || 0) - 1, 0);
        
        // Animation
        this.starAnimating = true;
        
        toggleStar({
           sourceId: this.shop.id,
           sourceType: 2,
           isStar: newStatus
        }).then(() => {
           this.$message.success(newStatus ? "收藏成功" : "已取消收藏");
           setTimeout(() => this.starAnimating = false, 300);
        }).catch(() => {
           // Revert
           this.shop.isStared = originalStatus;
           this.shop.stared = originalCount;
           this.starAnimating = false;
           this.$message.error('操作失败');
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
     toUserDetail(userId) {
        if(!userId) return;
        const token = localStorage.getItem('token');
        if(token && this.user && String(this.user.id) === String(userId)) {
           this.$router.push('/info');
        } else {
           this.$router.push(`/user-info/${userId}`);
        }
     },
     writeComment() {
        if(!localStorage.getItem('token')) {
            this.$message.warning("请先登录");
            this.$router.push('/user/login');
            return;
        }
        this.showCommentPublish = true;
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
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${date.getFullYear()}.${date.getMonth()+1}.${date.getDate()} ${hours}:${minutes}`;
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
     },
     handleCommentLike(c) {
        if(!this.user.id) return this.$router.push('/user/login');
        const oldState = c.isLike;
        c.isLike = !c.isLike;
        c.liked = c.isLike ? (c.liked + 1) : (c.liked - 1);
        
        likeComment(c.id).catch(() => {
           c.isLike = oldState;
           c.liked = c.isLike ? (c.liked + 1) : (c.liked - 1);
        });
     },
     handleCommentReply(c) {
        if(!this.user.id) return this.$router.push('/user/login');
        this.replyToComment = c;
        this.commentText = '';
        this.showCommentPublish = true;
     },
     closeCommentModal() {
        this.showCommentPublish = false;
        this.commentText = '';
        this.selectedImages = [];
        this.replyToComment = null;
        this.commentRating = 5;
     },
     // Image Upload
     async handleImageUpload(e) {
        const files = e.target.files;
        for(let file of files) {
           const formData = new FormData();
           formData.append("file", file);
           let res = await uploadFile(formData);

           // Extract path from response
           let path = res;
           if (res && typeof res === 'object' && res.data) path = res.data;
           if (typeof path !== 'string') path = String(path);
           
           // Strip the fileURL prefix, keep only relative path
           const filePrefix = this.fileURL || '';
           if (path.startsWith(filePrefix)) {
             path = path.substring(filePrefix.length);
           }
           if (path.startsWith('http')) {
             try {
                const urlObj = new URL(path);
                path = urlObj.pathname;
             } catch(e) {
                if(path.includes('/smart-live')) path = path.split('/smart-live')[1];
             }
           }
           // Ensure path starts with / if not empty
           if(path && !path.startsWith('/')) path = '/' + path;
           
           this.selectedImages.push({ file, url: this.fileURL + path, rawUrl: path });
        }
     },
     removeImage(idx) {
        this.selectedImages.splice(idx, 1);
     },
     publishComment() {
         if (!this.commentText.trim()) return this.$message.error('请输入内容');
         
         const data = {
           content: this.commentText,
           rating: this.commentRating,
           sourceId: this.shop.id,
           sourceType: 2, // Shop
           userId: this.user.id,
           parentId: 0,
           answerId: 0,
           images: this.selectedImages.map(img => img.rawUrl).join(',')
         };

         if (this.replyToComment) {
             data.sourceType = 5; 
             data.parentId = this.shop.id; 
             data.answerId = this.replyToComment.id; 
             data.sourceId = this.replyToComment.id; 
             delete data.rating;
         }

         addComment(data).then(() => {
            this.$message.success("发布成功");
            this.closeCommentModal();
            this.loadComments();
         });
     },
     handleCommentDelete(c) {
        this.$confirm('确定要删除这条评论吗？删除后不可恢复。', '删除评论', {
           confirmButtonText: '确定删除',
           cancelButtonText: '取消',
           type: 'warning',
           confirmButtonClass: 'el-button--danger'
        }).then(() => {
           // Use fallback values if sourceType/sourceId are missing
           const sourceType = c.sourceType || 2; // Default to shop type
           const sourceId = c.sourceId || this.shop.id;
           
           removeComment({ id: c.id, sourceType, sourceId }).then(() => {
              this.$message.success('删除成功');
              this.comments = []; // Clear first to force reload
              this.loadComments();
           }).catch(err => {
              console.error('删除失败', err);
              this.$message.error('删除失败，请重试');
           });
        }).catch(() => {});
     },
     
     // Carousel methods
     onCarouselChange(index) {
        this.currentImageIndex = index;
     },
     onImageLoad(e) {
        const img = e.target;
        const ratio = img.naturalHeight / img.naturalWidth;
        const width = window.innerWidth;
        const height = Math.min(width * ratio, 300);
        this.carouselHeight = height + 'px';
     },
     onTouchStart(e) {
        this.touchStartX = e.touches[0].clientX;
     },
     onTouchMove(e) {
        this.touchEndX = e.touches[0].clientX;
     },
     onTouchEnd() {
        const diff = this.touchStartX - this.touchEndX;
        const threshold = 50;
        
        if (Math.abs(diff) > threshold) {
           if (diff > 0) {
              this.$refs.imageCarousel?.next();
           } else {
              this.$refs.imageCarousel?.prev();
           }
        }
        
        this.touchStartX = 0;
        this.touchEndX = 0;
     },
     goToImage(index) {
        this.$refs.imageCarousel?.setActiveItem(index);
     }
  }
}
</script>

<style scoped>
.shop-detail-page { height: 100vh; display: flex; flex-direction: column; background: #f0f2f5; overflow-x: hidden; }

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
.shop-header-gallery { 
  position: relative; 
  width: 100%; 
  background: #f5f5f5; 
}
.full-carousel-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
}
.image-indicator {
  position: absolute;
  right: 12px;
  top: 12px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 10px;
  z-index: 10;
}
.dots-indicator {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 6px;
  z-index: 10;
}
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.3s;
}
.dot.active {
  background: white;
  width: 18px;
  border-radius: 3px;
}

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
.comment-images img { width: 80px; height: 80px; object-fit: cover; border-radius: 4px; cursor: pointer; }

/* Interactions */
.comment-interactions { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; font-size: 12px; color: #999; }
.comment-actions { display: flex; gap: 15px; }
.c-action-btn { display: flex; align-items: center; gap: 3px; cursor: pointer; }
.c-action-btn i { font-size: 14px; }
.delete-btn { color: #ff4d4f; }

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

/* Comment Pop Modal */
.comment-pop-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: flex-end; }
.comment-pop-box { background: white; width: 100%; border-radius: 16px 16px 0 0; padding: 20px; max-height: 80vh; overflow-y: auto; box-sizing: border-box; }
.pop-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.pop-title { font-size: 14px; color: #666; }
.pop-close { font-size: 20px; color: #999; cursor: pointer; padding: 5px; }
.pop-close:hover { color: #333; }
.pop-textarea textarea { width: 100%; border: none; outline: none; resize: none; font-size: 16px; line-height: 1.6; min-height: 80px; padding: 0; }
.pop-textarea textarea::placeholder { color: #ccc; }
.pop-images { display: flex; flex-wrap: wrap; gap: 8px; margin: 10px 0; }
.pop-image-item { width: 60px; height: 60px; position: relative; }
.pop-image-item img { width: 100%; height: 100%; object-fit: cover; border-radius: 6px; }
.pop-image-item i { position: absolute; top: -4px; right: -4px; background: rgba(0,0,0,0.6); color: white; border-radius: 50%; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; font-size: 10px; cursor: pointer; }
.pop-image-add { width: 60px; height: 60px; border: 1px dashed #ddd; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #ccc; font-size: 18px; cursor: pointer; }
.pop-toolbar { display: flex; justify-content: space-between; align-items: top; padding: 15px 0 0 0; margin-top: 10px; border-top: 1px solid #f0f0f0; overflow: visible; }
.pop-toolbar-left { display: flex; align-items: center; gap: 20px; padding-left: 0; margin-left: 0; flex-wrap: wrap; }
.pop-toolbar-left i { font-size: 26px; color: #666; cursor: pointer; line-height: 1; }
.pop-toolbar-left i:hover { color: #ff6633; }
.pic-icon { cursor: pointer; flex-shrink: 0; display: block; width: 24px; height: 24px; }
.pic-icon:hover path { fill: #ff6633; }
.pop-rating-inline { margin-left: 10px; display: flex; align-items: center; }

@keyframes pop { 50% { transform: scale(1.2); } }
.animate i { animation: pop 0.3s ease; }

/* AI Comment Styles */
/* ... existing AI styles ... */
.ai-generated-comment { background: #f7f9fc; border: 1px solid #e0e6ed; border-radius: 12px; margin-bottom: 15px; padding: 16px; box-shadow: 0 4px 12px rgba(24, 144, 255, 0.05); }
.ai-comment-icon { background: linear-gradient(135deg, #6366f1, #3b82f6); border-radius: 50%; color: white; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; }
.ai-verified { background: linear-gradient(90deg, #f59e0b, #d97706); color: white; font-size: 10px; padding: 2px 6px; border-radius: 4px; margin-left: 8px; font-weight: 500; display: inline-flex; align-items: center; }
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
