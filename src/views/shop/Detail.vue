<template>
  <PageLayout :loading="isLoading" skeleton-type="detail" class="shop-detail-page">

    <!-- Static Header (Match Image) -->
    <div class="static-header">
       <div class="nav-bar-transparent">
          <div class="nav-btn-round" @click="goBack"><i class="el-icon-arrow-left"></i></div>
          <div class="nav-btn-round"><i class="el-icon-share"></i></div>
       </div>
       
       <div class="header-carousel">
           <van-swipe :autoplay="4000" indicator-color="white" style="height: 100%;">
                <van-swipe-item v-for="(img, index) in gallery" :key="index" @click="handlePreviewImage(index)">
                    <img :src="img" style="width: 100%; height: 100%; object-fit: cover;">
                </van-swipe-item>
                <!-- Fallback if empty -->
                <van-swipe-item v-if="gallery.length === 0">
                    <img :src="shop.cover || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4'" style="width: 100%; height: 100%; object-fit: cover;">
                </van-swipe-item>
           </van-swipe>
       </div>
       <div class="header-dark-mask"></div>
       <div class="image-count-badge" v-if="gallery.length > 0">
           <i class="el-icon-picture-outline"></i> {{gallery.length}}
       </div>
       
       <div class="header-content-overlay">
           <h1 class="shop-title-large">{{shop.name}}</h1>
           <div class="shop-score-row">
               <van-rate :model-value="shop.score ? shop.score/10 : 0" readonly color="#FF9900" void-icon="star" void-color="#eee" size="12px" allow-half />
               <span class="score-val">{{shop.score ? (shop.score/10).toFixed(1) : 0}}</span>
               <span class="comment-num">{{shop.comments}}条评价</span>
           </div>
           
           <div class="shop-addr-row" @click="openMap">
               <span class="addr-txt">{{shop.address}}</span>
               <i class="el-icon-arrow-right"></i>
           </div>
           
           <div class="shop-time-row">
               <span class="status-badge">营业中</span>
               <span class="time-txt">营业时间 {{shop.openHours}}</span>
           </div>
           
           <div class="follow-btn-pos" @click="toggleFollow">
               <div class="red-follow-btn" :class="{followed: shop.isFollowed}">
                   <template v-if="!shop.isFollowed">+ 关注</template>
                   <template v-else>已关注</template>
               </div>
           </div>
       </div>
    </div>

       <van-tabs v-model:active="activeTab" scrollspy sticky color="#ff2442" title-active-color="#ff2442" line-width="20px" offset-top="44">
          <van-tab title="代金券">
             <div id="voucher" class="section-block">
          <div class="section-title">
             <span class="icon-text text-orange">券</span> 
             <span class="title-text">代金券</span>
          </div>
       <div class="voucher-list" v-if="vouchers.length>0">
          
          <!-- Seckill Vouchers -->
          <template v-for="v in vouchers.filter(x => x.type === 1)" :key="'seckill-' + v.id">
             <div class="voucher-card-v2 seckill" @click="toVoucherDetail(v)">
                <div class="voucher-card-header">
                   <div class="voucher-title-row">
                      <span class="voucher-title">{{v.title || (v.actualValue + '元代金券')}}</span>
                      <span class="voucher-flash-tag"><i class="el-icon-time"></i> 限时抢</span>
                   </div>
                   <div class="voucher-shops" v-if="shop.name">
                      <span class="shop-label">适用商铺：</span>
                      <span class="shop-names">{{shop.name}}</span>
                   </div>
                   <div class="voucher-time" v-if="v.beginTime && v.endTime">
                      <i class="el-icon-time"></i> {{formatSeckillTime(v)}}
                   </div>
                   <div class="voucher-validity" v-if="getValidityText(v)">
                      <i class="el-icon-calendar"></i> {{getValidityText(v)}}
                   </div>
                </div>
                <div class="voucher-card-body gradient-pink">
                   <div class="voucher-price-section">
                      <div class="voucher-current-price">
                         <span class="price-symbol">¥</span>
                         <span class="price-value">{{v.payValue}}</span>
                      </div>
                      <div class="voucher-original-info">
                         <span class="original-price">¥{{v.actualValue}}</span>
                         <span class="discount-badge">{{(v.payValue/v.actualValue*10).toFixed(1)}}折</span>
                      </div>
                      <div class="voucher-sold-info">
                         已售{{v.sold || 0}}张
                      </div>
                      <div class="voucher-progress-bar">
                         <div class="progress-fill" :style="{width: getStockPercent(v) + '%'}"></div>
                      </div>
                   </div>
                   <div class="voucher-action-section">
                      <button class="voucher-buy-btn" @click.stop="doSeckill(v)" :disabled="isNotBegin(v) || isEnd(v) || v.stock < 1">
                         {{ isEnd(v) ? '已结束' : (isNotBegin(v) ? '待开始' : (v.stock < 1 ? '已抢光' : '限时抢购')) }}
                      </button>
                      <div class="voucher-stock">剩{{v.stock}}张</div>
                   </div>
                </div>
             </div>
          </template>
          
          <!-- Normal Vouchers -->
          <template v-for="v in vouchers.filter(x => x.type !== 1)" :key="'normal-' + v.id">
             <div class="voucher-card-v2 normal" @click="toVoucherDetail(v)">
                <div class="voucher-card-header">
                   <div class="voucher-title-row">
                      <span class="voucher-title">{{v.title || (v.actualValue + '元代金券')}}</span>
                   </div>
                   <div class="voucher-subtitle">
                      <span>{{v.subTitle || '周一至周五均可使用'}}</span>
                   </div>
                   <div class="voucher-usage-time">
                      <i class="el-icon-time"></i> {{v.subTitle || '周一至周五均可使用'}}
                   </div>
                   <div class="voucher-validity" v-if="getValidityText(v)">
                      <i class="el-icon-calendar"></i> {{getValidityText(v)}}
                   </div>
                </div>
                <div class="voucher-card-body gradient-orange">
                   <div class="voucher-price-section">
                      <div class="voucher-current-price">
                         <span class="price-symbol">¥</span>
                         <span class="price-value">{{v.payValue}}</span>
                      </div>
                      <div class="voucher-original-info">
                         <span class="original-price">¥{{v.actualValue}}</span>
                         <span class="discount-badge">{{(v.payValue/v.actualValue*10).toFixed(1)}}折</span>
                      </div>
                      <div class="voucher-sold-info">
                         已售{{v.sold || 0}}张
                      </div>
                      <div class="voucher-progress-bar">
                         <div class="progress-fill" :style="{width: getStockPercent(v) + '%'}"></div>
                      </div>
                   </div>
                   <div class="voucher-action-section">
                      <button class="voucher-buy-btn" @click.stop="doBuy(v)">立即抢购</button>
                      <div class="voucher-stock">剩{{v.stock}}张</div>
                   </div>
                </div>
             </div>
          </template>
       </div>
       <div class="voucher-list" v-else>
           <div class="empty-tip">暂无优惠券</div>
       </div>
       </div> <!-- End #voucher -->
          </van-tab>
       
       <van-tab title="团购">
       <div class="shop-divider"></div>

       <!-- Group Buy Section -->
       <div id="groupbuy" class="section-block" style="background: white; padding: 16px;">
          <div class="section-title" style="margin-bottom: 16px;">
             <span class="icon-text text-orange" style="background: #FFF5E2; color: #FF9900; padding: 2px 6px; border-radius: 4px; font-size: 12px; margin-right: 6px;">团</span>
             <span class="title-text" style="font-weight: 600; font-size: 16px;">团购套餐</span>
          </div>
          <div class="empty-placeholder" style="padding: 20px 0; text-align: center; color: #999;">暂无团购套餐</div>
       </div>
       
       <div class="shop-divider"></div>
       </van-tab>
       
       <van-tab title="评价">
       <!-- Comments Section -->
       <div id="review" class="section-block" style="background: white; padding: 16px;">
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
                <div class="comment-content" @click="toReviewDetail(c)">{{c.content}}</div>
                <div class="comment-images" v-if="c.images && c.images.length">
                   <img v-for="(img, idx) in c.images" :key="idx" :src="img" @click.stop="previewImage(c.images, idx)">
                </div>
                <div class="comment-stats">
                   <div class="comment-interactions">
                   <span class="comment-time">{{formatDate(c.createTime)}}</span>
                   <div class="comment-actions">
                      <div class="c-action-btn" @click.stop="handleCommentLike(c, true)">
                         <svg viewBox="0 0 24 24" width="16" height="16">
                           <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" :fill="c.isLike ? '#ff2442' : '#999'"></path>
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
                <!-- Replies -->
                <div class="comment-replies" v-if="c.comments > 0">
                   <!-- Initial Expand Button -->
                   <div class="reply-expand" v-if="!c.showReplies" @click.stop="toggleReplies(c)">
                       展开{{c.comments}}条回复 <i class="el-icon-arrow-down"></i>
                   </div>

                   <!-- Reply List -->
                   <template v-if="c.showReplies">
                      <div class="reply-item" v-for="r in c.replies" :key="r.id">
                          <div class="reply-avatar" @click.stop="toUserDetail(r.userId)">
                             <img :src="r.userIcon || r.icon || '/imgs/icons/default-icon.png'" alt="">
                          </div>
                          <div class="reply-main">
                             <div class="reply-header">
                                <span class="reply-user" @click.stop="toUserDetail(r.userId)">{{r.nickName || '匿名用户'}}</span>
                                <!-- Remove time from here -->
                             </div>
                             <div class="reply-content">
                                  <span v-if="r.replyToName" class="reply-target">回复 @{{r.replyToName}}</span>
                                  {{r.content}}
                             </div>
                             <!-- Images in replies -->
                             <div class="comment-images" v-if="r.images && r.images.length">
                                <img v-for="(img, idx) in r.images" :key="idx" :src="img" @click.stop="previewImage(r.images, idx)">
                             </div>

                             <div class="reply-actions">
                                  <span class="reply-time" style="margin-right: 10px;">{{formatDate(r.createTime)}}</span>
                                  
                                  <div class="c-action-btn" @click.stop="handleCommentLike(r)">
                                     <svg viewBox="0 0 24 24" width="16" height="16">
                                       <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" :fill="r.isLike ? '#ff2442' : '#999'"></path>
                                     </svg>
                                     <span v-if="r.liked > 0">{{r.liked}}</span>
                                  </div>
                                  <div class="c-action-btn" @click.stop="handleCommentReply(r, c.id)">
                                     <i class="el-icon-chat-dot-square"></i>
                                  </div>
                                   <div class="c-action-btn delete-btn" v-if="user && user.id === r.userId" @click.stop="handleCommentDelete(r)">
                                     <i class="el-icon-delete"></i>
                                  </div>
                             </div>
                          </div>
                      </div>
                      
                      <!-- Load More / Collapse Button -->
                      <div class="reply-expand" 
                           v-if="c.replies.length > 0" 
                           @click.stop="toggleReplies(c)">
                           <template v-if="c.replies.length < Number(c.comments)">
                              展开更多回复 <i class="el-icon-arrow-down"></i>
                           </template>
                           <template v-else>
                              收起回复 <i class="el-icon-arrow-up"></i>
                           </template>
                      </div>
                   </template>
                </div>
                 </div>
             </div>
             </div>

          
          <div class="view-all" @click="viewAllComments">
             查看全部{{comments.length}}条评价 <i class="el-icon-arrow-right"></i>
          </div>
       </div>

       </div> <!-- End #review -->
       </van-tab>
       
       <div class="shop-divider"></div>

       <van-tab title="详情">
       <!-- Detail Section -->
       <div id="detail" class="section-block" style="background: white; padding: 16px;">
           <div class="section-title" style="margin-bottom: 16px; font-weight: 600; font-size: 16px;">商家信息</div>
           <div class="info-cell" style="display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #f5f5f5;">
              <i class="el-icon-location-outline" style="font-size: 16px; color: #666;"></i>
              <span style="flex: 1; margin: 0 10px; font-size: 14px; color: #333;">{{shop.address}}</span>
              <a :href="'tel:'+shop.phone" class="cell-action" style="color: #FF9900; font-size: 18px;"><i class="el-icon-phone-outline"></i></a>
           </div>
           <div class="info-cell" style="display: flex; align-items: center; padding: 12px 0;">
              <i class="el-icon-time" style="font-size: 16px; color: #666;"></i>
              <span style="margin-left: 10px; font-size: 14px; color: #333;">营业时间：{{shop.openHours}}</span>
           </div>
       </div>
       </van-tab>
       </van-tabs>
    
    <div style="height: 60px;"></div>

    <!-- Foot Bar - Local Service Style -->
    <div class="foot-bar">
       <div class="foot-left">
          <div class="foot-icon-btn" @click="toggleStar" :class="{active: shop.isStared, animate: starAnimating}">
             <i :class="shop.isStared ? 'el-icon-star-on' : 'el-icon-star-off'"></i>
             <span>收藏</span>
          </div>
          <div class="foot-icon-btn" @click="callShop">
             <i class="el-icon-phone-outline"></i>
             <span>电话</span>
          </div>
       </div>
       <div class="foot-right">
          <div class="foot-main-btn" @click="writeComment">写评价</div>
       </div>
    </div>
    
     <div class="image-preview" v-if="showPreview" @click="closePreview">
        <div class="preview-close" @click.stop="closePreview"><i class="el-icon-close"></i></div>
        <div class="preview-swiper" @click.stop>
           <van-swipe :initial-swipe="previewIndex" @change="(idx) => previewIndex = idx" style="height: 100vh; width: 100vw;">
              <van-swipe-item v-for="(img, idx) in previewList" :key="idx" style="display: flex; align-items: center; justify-content: center;">
                 <img :src="img" class="preview-img" style="max-width: 100%; max-height: 100%; object-fit: contain;">
              </van-swipe-item>
           </van-swipe>
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

   <!-- All Reviews Bottom Sheet Popup -->
   <div class="review-popup-overlay" v-if="showReviewPopup" @click="showReviewPopup = false">
      <div class="review-popup-sheet" @click.stop>
         <div class="review-popup-header">
            <span class="review-popup-title">评价列表 ({{shop.comments || 0}})</span>
            <i class="el-icon-close review-popup-close" @click="showReviewPopup = false"></i>
         </div>
         <div class="review-popup-body" @scroll="onPopupScroll">
            <div v-if="allComments.length === 0 && !allCommentsLoading" class="empty-reviews">
               <i class="el-icon-chat-round"></i>
               <p>暂无评论</p>
            </div>
            
            <div class="comment-box" v-for="c in allComments" :key="c.id">
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
                  <div class="comment-content" @click="toReviewDetail(c)">{{c.content}}</div>
                  <div class="comment-images" v-if="c.images && c.images.length">
                     <img v-for="(img, idx) in c.images" :key="idx" :src="img" @click.stop="previewImage(c.images, idx)">
                  </div>
                  <div class="comment-interactions">
                     <span class="comment-time">{{formatDate(c.createTime)}}</span>
                     <div class="comment-actions">
                        <div class="c-action-btn" @click.stop="handleCommentLike(c)">
                           <svg viewBox="0 0 24 24" width="16" height="16">
                             <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" :fill="c.isLike ? '#ff2442' : '#999'"></path>
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
                   <div class="comment-replies" v-if="c.comments > 0">
                      <!-- Initial Expand Button -->
                      <div class="reply-expand" v-if="!c.showReplies" @click.stop="toggleReplies(c)">
                          展开{{c.comments}}条回复 <i class="el-icon-arrow-down"></i>
                      </div>

                      <!-- Reply List -->
                      <template v-if="c.showReplies">
                         <div class="reply-item" v-for="r in c.replies" :key="r.id">
                             <div class="reply-avatar" @click.stop="toUserDetail(r.userId)">
                                <img :src="r.userIcon || r.icon || '/imgs/icons/default-icon.png'" alt="">
                             </div>
                             <div class="reply-main">
                                <div class="reply-header">
                                   <span class="reply-user" @click.stop="toUserDetail(r.userId)">{{r.nickName || '匿名用户'}}</span>
                                   <!-- Time moved to bottom actions if needed, or keep here -->
                                </div>
                                <div class="reply-content">
                                     <span v-if="r.replyToName" class="reply-target">回复 @{{r.replyToName}}:</span>
                                     {{r.content}}
                                </div>
                                <div class="comment-images" v-if="r.images && r.images.length">
                                   <img v-for="(img, idx) in r.images" :key="idx" :src="img" @click.stop="previewImage(r.images, idx)">
                                </div>
                                <div class="reply-actions">
                                     <span class="reply-time" style="margin-right: 10px;">{{formatDate(r.createTime)}}</span>
                                     
                                     <div class="c-action-btn" @click.stop="handleCommentLike(r)">
                                        <svg viewBox="0 0 24 24" width="16" height="16">
                                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" :fill="r.isLike ? '#ff2442' : '#999'"></path>
                                        </svg>
                                        <span v-if="r.liked > 0">{{r.liked}}</span>
                                     </div>
                                     <div class="c-action-btn" @click.stop="handleCommentReply(r)">
                                        <i class="el-icon-chat-dot-square"></i>
                                     </div>
                                      <div class="c-action-btn delete-btn" v-if="user.id === r.userId" @click.stop="handleCommentDelete(r)">
                                        <i class="el-icon-delete"></i>
                                     </div>
                                </div>
                             </div>
                         </div>
                         
                         <!-- Load More / Collapse Button -->
                         <div class="reply-expand" 
                              v-if="c.replies.length > 0" 
                              @click.stop="toggleReplies(c)">
                              <template v-if="c.replies.length < Number(c.comments)">
                                 展开更多回复 <i class="el-icon-arrow-down"></i>
                              </template>
                              <template v-else>
                                 收起回复 <i class="el-icon-arrow-up"></i>
                              </template>
                         </div>
                      </template>
                   </div>
               </div>
            </div>
            
            <div v-if="allCommentsLoading" class="loading-more">加载中...</div>
            <div v-if="allCommentsNoMore && allComments.length > 0" class="no-more-reviews">没有更多评论了</div>
         </div>
         <!-- Bottom Input Bar in Popup -->
         <div class="popup-bottom-bar" @click="writeCommentFromPopup">
            <div class="popup-input-placeholder">发条评论，和大家一起讨论</div>
            <el-button type="primary" size="small" round>发布</el-button>
         </div>
      </div>
   </div>

  </PageLayout>
</template>

<script>
import { getShopDetail, getShopVouchers, buyVoucherAPI, seckillVoucherAPI } from '@/api/shop';

import { isStar, toggleStar, getComments, likeComment, addComment, removeComment, isFollowed, followUser } from '@/api/interaction';
import { getReviewList, likeReviewComment } from '@/api/reviews';
import { uploadFile } from '@/api/common';
import { showConfirmDialog } from 'vant';
import { getCurrentUser } from '@/api/user';
import '@/assets/css/blog-detail.css'; // Import blog styles to reuse reply CSS

import PageLayout from '@/components/PageLayout/PageLayout.vue';

export default {
  name: 'ShopDetail',
  components: { PageLayout },
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

       // Follow state
       isFollowed: false,

       // Comment interaction
       showCommentPublish: false,
       commentText: '',
       commentRating: 5,
       replyToComment: null,
       selectedImages: [],
       
       // Review popup
       showReviewPopup: false,
       allComments: [],
       allCommentsPage: 1,
       allCommentsNoMore: false,
       allCommentsLoading: false
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
     toReviewDetail(comment) {
         if (!comment || !comment.id) return;
         this.$router.push({
             name: 'ReviewDetail',
             query: { id: comment.id }
         });
     },
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
                 this.gallery = rawImgs.map(img => {
                     if(img.startsWith('http')) return img;
                     return this.fileURL + img;
                 });
                 if (!this.shop.cover && this.gallery.length > 0) {
                     this.shop.cover = this.gallery[0];
                 }
              }
              
              // Ensure cover has prefix if it exists and is relative
              if (this.shop.cover && !this.shop.cover.startsWith('http')) {
                  this.shop.cover = this.fileURL + this.shop.cover;
              }
               // isStared and isFollowed come from shop data directly
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
            // Sort: Seckill vouchers (type === 1) first
            this.vouchers = (data || []).sort((a, b) => {
               if(a.type === 1 && b.type !== 1) return -1;
               if(a.type !== 1 && b.type === 1) return 1;
               return 0;
            });
            this.onDataLoaded();
        }).catch(err => {
           console.error("Voucher fetch error", err);
           this.onDataLoaded();
        });
        
            getReviewList({ sourceId: id, sourceType: 2, current: 1 }).then(res => {
               let list = [];
               if(Array.isArray(res)) list = res;
               else if(res && Array.isArray(res.list)) list = res.list;
               else if(res && Array.isArray(res.data)) list = res.data;
               else if(res && res.data && Array.isArray(res.data.records)) list = res.data.records;
               
               const processedList = (list || []).map(c => ({
                  ...c,
                  userIcon: c.userIcon ? (c.userIcon.startsWith('http') ? c.userIcon : this.fileURL + c.userIcon) : '',
                  images: c.images ? c.images.split(',').filter(x=>x).map(i => i.startsWith('http') ? i : this.fileURL + i) : [],
                  rating: c.score || c.rating || 5, 
                  isLike: c.isLike || false,
                  liked: c.liked || 0,
                  // Map API count to UI comments count
                  comments: c.replyCount || c.comments || c.childCount || 0, 
                  showReplies: false, 
                  replies: [],
                  replyPage: 1
               }));

               // Extract AI Comment
               const aiIdx = processedList.findIndex(c => c.isAIGenerated);
               if(aiIdx > -1) {
                  this.aiComment = processedList[aiIdx];
                  processedList.splice(aiIdx, 1);
               }

               // Filter roots
               const roots = processedList.filter(c => !c.answerId || c.answerId === 0 || c.answerId === '0');
               this.comments = roots.slice(0, 3);
               this.onDataLoaded();
            }).catch(err => {
               this.onDataLoaded();
            });
         },
         loadComments() {
            getReviewList({ sourceId: this.shop.id, sourceType: 2, current: 1 }).then(res => {
               let list = [];
               if(Array.isArray(res)) list = res;
               else if(res && Array.isArray(res.list)) list = res.list;
               else if(res && Array.isArray(res.data)) list = res.data;
               else if(res && res.data && Array.isArray(res.data.records)) list = res.data.records;
               
               const processedList = (list || []).map(c => ({
                  ...c,
                  userIcon: c.userIcon ? (c.userIcon.startsWith('http') ? c.userIcon : this.fileURL + c.userIcon) : '',
                  images: c.images ? c.images.split(',').filter(x=>x).map(i => i.startsWith('http') ? i : this.fileURL + i) : [],
                  rating: c.score || c.rating || 5,
                  isLike: c.isLike || false,
                  liked: c.liked || 0,
                  comments: c.replyCount || c.comments || c.childCount || 0, 
                  showReplies: false, 
                  replies: [],
                  replyPage: 1
               }));

               const aiIdx = processedList.findIndex(c => c.isAIGenerated);
               if(aiIdx > -1) {
                  this.aiComment = processedList[aiIdx];
                  processedList.splice(aiIdx, 1);
               }

               const roots = processedList.filter(c => !c.answerId || c.answerId === 0 || c.answerId === '0');
               this.comments = roots.slice(0, 3);
            });
         },
         toggleReplies(comment) {
             if (!comment.showReplies) {
                 // Expand
                 comment.showReplies = true;
                 if (!comment.replies || comment.replies.length === 0) {
                      comment.replyPage = 1;
                      this.fetchReplies(comment);
                 }
             } else {
                 // Already expanded
                 if (comment.replies.length < comment.comments) {
                      // Load More
                      comment.replyPage = (comment.replyPage || 1) + 1;
                      this.fetchReplies(comment);
                 } else {
                      // Collapse
                      comment.showReplies = false;
                 }
             }
         },
         fetchReplies(comment) {
             getComments({ 
                 sourceId: comment.id, 
                 sourceType: 7, 
                 current: comment.replyPage || 1, 
                 size: 10 
             }).then(res => {
                 let list = [];
                 if (Array.isArray(res)) list = res;
                 else if (res && Array.isArray(res.data)) list = res.data;
                 else if (res && res.data && Array.isArray(res.data.records)) list = res.data.records;
                 
                 if (list) {
                     const newReplies = list.map(r => ({
                         ...r,
                         userIcon: r.userIcon ? (r.userIcon.startsWith('http') ? r.userIcon : this.fileURL + r.userIcon) : '',
                         images: r.images ? r.images.split(',').filter(x=>x).map(i => i.startsWith('http') ? i : this.fileURL + i) : [],
                         liked: r.liked || 0,
                         isLike: r.isLike || false
                     }));
                     
                     if (comment.replyPage === 1) {
                         comment.replies = newReplies;
                     } else {
                         comment.replies = [...comment.replies, ...newReplies];
                     }
                     
                     // Count Correction Logic
                     if (res && res.data && res.data.total) {
                          comment.comments = res.data.total;
                     }
                     if (list.length < 10) {
                         if (comment.replies.length < comment.comments) {
                             comment.comments = comment.replies.length;
                         }
                     }
                 }
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
      checkFollowStatus(id) {
         if(!localStorage.getItem('token')) return;
         isFollowed({ sourceId: id, sourceType: 2 }).then(res => {
            const val = (typeof res === 'object' && res !== null && res.data !== undefined) ? res.data : res;
            this.isFollowed = !!val;
         });
      },
      toggleFollow() {
         if(!localStorage.getItem('token')) {
            this.$message.warning("请先登录");
            this.$router.push('/user/login');
            return;
         }
         
         const newStatus = !this.shop.isFollowed;
         
         followUser({
            sourceId: this.shop.id,
            sourceType: 2,
            isFollow: newStatus
         }).then(() => {
            this.shop.isFollowed = newStatus;
            this.$message.success(newStatus ? "关注成功" : "已取消关注");
         }).catch(() => {
            this.$message.error('操作失败');
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
           this.$router.push('/user/profile');
        } else {
           this.$router.push(`/user/profile/${userId}`);
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
     formatSeckillTime(v) {
        if(!v.beginTime || !v.endTime) return '';
        const format = (str) => {
            const d = new Date(str);
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const h = String(d.getHours()).padStart(2, '0');
            const min = String(d.getMinutes()).padStart(2, '0');
            return `${m}.${day} ${h}:${min}`;
        };
        return `${format(v.beginTime)} - ${format(v.endTime)}`;
      },
      getValidityText(v) {
         if (v.validityType === 1) {
            const start = v.useStartTime?.split(' ')[0] || '';
            const end = v.useEndTime?.split(' ')[0] || '';
            return `${start} 至 ${end} 有效`;
         } else if (v.validityType === 2) {
            return `领取/购买后 ${v.validDays} 天内有效`;
         }
         return '';
      },
      getStockPercent(v) {
         if (!v.stock || !v.totalStock) return 0;
         return Math.round((v.stock / v.totalStock) * 100);
      },
      toVoucherDetail(v) {
        this.$router.push({ path: '/voucher/detail', query: { id: v.id } });
     },
     doBuy(v) {
        if(!localStorage.getItem('token')) return this.$router.push('/user/login');
        
        buyVoucherAPI(v.id).then(res => {
            this.$message.success("抢购成功，订单ID: " + (res.data || res));
        }).catch(err => {
            console.error(err);
            let msg = "抢购失败";
            if (typeof err === 'string') msg = err;
            else if (err && err.errorMsg) msg = err.errorMsg;
            else if (err && err.response && err.response.data && err.response.data.errorMsg) msg = err.response.data.errorMsg;
            else if (err && err.message) msg = err.message;
            
            this.$message.error(msg);
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
            let msg = "抢购失败";
            if (typeof err === 'string') msg = err;
            else if (err && err.errorMsg) msg = err.errorMsg;
            else if (err && err.response && err.response.data && err.response.data.errorMsg) msg = err.response.data.errorMsg;
            else if (err && err.message) msg = err.message;
            
            this.$message.error(msg);
        });
     },
     handleCommentLike(c, isReview = false) {
        if(!this.user.id) return this.$router.push('/user/login');
        const oldState = c.isLike;
        c.isLike = !c.isLike;
        c.liked = c.isLike ? (c.liked + 1) : (c.liked - 1);
        
        const likeFunc = isReview ? likeReviewComment : likeComment; likeFunc(c.id).catch(() => {
           c.isLike = oldState;
           c.liked = c.isLike ? (c.liked + 1) : (c.liked - 1);
        });
     },
     handleCommentReply(c, rootId) {
        if(!this.user.id) return this.$router.push('/user/login');
        this.replyToComment = c;
        this.replyRootId = rootId || null;
        this.commentText = '';
        this.showCommentPublish = true;
     },
     writeComment() {
        if(!this.user || !this.user.id) {
           this.$message.warning("请先登录");
           return this.$router.push('/user/login');
        }
        this.$router.push({
            path: '/review/publish',
            query: { shopId: this.shop.id }
        });
     },
     closeCommentModal() {
        this.showCommentPublish = false;
        this.commentText = '';
        this.selectedImages = [];
        this.replyToComment = null;
        this.replyRootId = null;
        this.commentRating = 5;
     },
     callShop() {
        if(this.shop.phone) {
           window.location.href = 'tel:' + this.shop.phone;
        } else {
           this.$message.warning("暂无联系方式");
        }
     },
     writeCommentFromPopup() {
        if(!this.user || !this.user.id) {
           this.$message.warning("请先登录");
           return this.$router.push('/user/login');
        }
        this.replyToComment = null;
        this.commentText = '';
        this.commentRating = 5;
        this.selectedImages = [];
        this.showCommentPublish = true;
        this.$nextTick(() => {
           if(this.$refs.commentTextarea) {
              this.$refs.commentTextarea.focus();
           }
        });
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

           images: this.selectedImages.map(img => img.rawUrl).join(',')
         };

         if (this.replyToComment) {
             if (this.replyRootId) {
                 // Level 2: Reply to Comment (Sub-reply)
                 data.sourceType = 5;
                 data.sourceId = this.replyToComment.id;
                 data.answerId = this.replyToComment.id;
                 data.parentId = this.replyRootId; // Pass Review ID as parent
             } else {
                 // Level 1: Comment on Review (Reply to Evaluation)
                 data.sourceType = 7; 
                 data.sourceId = this.replyToComment.id; // Review ID
                 delete data.answerId;
             }
             delete data.rating;
         }

         addComment(data).then(() => {
            this.$message.success("发布成功");
            this.closeCommentModal();
            this.loadComments();
            // Also refresh popup comments if open
            if(this.showReviewPopup) {
               this.allComments = [];
               this.allCommentsPage = 1;
               this.allCommentsNoMore = false;
               this.loadAllComments();
            }
         });
     },
     handleCommentDelete(c) {
        showConfirmDialog({
           title: '提示',
           message: '确定删除该评论吗？',
           confirmButtonText: '确认',
           cancelButtonText: '取消',
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
     
     // Review Popup Methods
     viewAllComments() {
        this.showReviewPopup = true;
        this.allComments = [];
        this.allCommentsPage = 1;
        this.allCommentsNoMore = false;
        this.loadAllComments();
     },
      loadAllComments() {
         if(this.allCommentsLoading || this.allCommentsNoMore) return;
         this.allCommentsLoading = true;
         
         getReviewList({ sourceId: this.shop.id, sourceType: 2, current: this.allCommentsPage }).then(res => {
            let list = [];
            if(Array.isArray(res)) list = res;
            else if(res && Array.isArray(res.list)) list = res.list;
            else if(res && Array.isArray(res.data)) list = res.data;
            else if(res && res.data && Array.isArray(res.data.records)) list = res.data.records;
            
            if(!list || list.length === 0) {
               this.allCommentsNoMore = true;
            } else {
               const processed = list.filter(c => !c.isAIGenerated).map(c => ({
                  ...c,
                  userIcon: c.userIcon ? (c.userIcon.startsWith('http') ? c.userIcon : this.fileURL + c.userIcon) : '',
                  images: c.images ? c.images.split(',').filter(x=>x).map(i => i.startsWith('http') ? i : this.fileURL + i) : [],
                  clickedLike: false,
                  // Reply logic
                  comments: c.replyCount || c.comments || c.childCount || 0,
                  showReplies: false,
                  replies: [],
                  replyPage: 1
               }));
               
               // Filter root comments
               const roots = processed.filter(c => !c.answerId || c.answerId === 0 || c.answerId === '0');
               
               if(this.allCommentsPage === 1) {
                  this.allComments = roots;
               } else {
                  this.allComments = [...this.allComments, ...roots];
               }
               
               // Check if end
               if(list.length < 10) {
                  this.allCommentsNoMore = true;
               } else {
                  this.allCommentsPage++;
               }
            }
         }).finally(() => {
            this.allCommentsLoading = false;
         });
      },
     onPopupScroll(e) {
        const { scrollTop, clientHeight, scrollHeight } = e.target;
        if(scrollTop + clientHeight >= scrollHeight - 50) {
           this.loadAllComments();
        }
     },
     
     handlePreviewImage(index) {
        if(!this.gallery || this.gallery.length === 0) return;
        this.previewList = this.gallery;
        this.previewIndex = index;
        this.showPreview = true;
     },
     
     previewImage(list, index) {
        if(!list || list.length === 0) return;
        this.previewList = list;
        this.previewIndex = index;
        this.showPreview = true;
     },
     
     closePreview() {
        this.showPreview = false;
        this.previewList = [];
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
/* Static Header Styles */
.static-header {
   position: relative;
   height: 260px;
   background: #333;
   color: white;
   overflow: hidden;
}
.nav-bar-transparent {
   position: absolute;
   top: 0; left: 0; right: 0;
   height: 44px;
   display: flex;
   justify-content: space-between;
   align-items: center;
   padding: 0 16px;
   z-index: 10;
}
.nav-btn-round {
   width: 32px; height: 32px;
   background: rgba(0,0,0,0.3);
   border-radius: 50%;
   display: flex; align-items: center; justify-content: center;
   color: white;
   font-size: 18px;
}
.header-carousel {
   position: absolute;
   top: 0; left: 0; right: 0; bottom: 0;
   z-index: 1;
}
.image-count-badge {
    position: absolute;
    right: 16px;
    bottom: 130px; /* Moved higher to avoid overlap with Follow button */
    background: rgba(0,0,0,0.5);
    color: white;
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 10px;
    z-index: 20;
    pointer-events: none;
}
.header-bg-image {
   position: absolute;
   top: 0; left: 0; right: 0; bottom: 0;
   background-size: cover;
   background-position: center;
   filter: blur(2px);
   opacity: 0.8;
}
.header-dark-mask {
   position: absolute;
   top: 0; left: 0; right: 0; bottom: 0;
   background: rgba(0,0,0,0.4);
   z-index: 2;
   pointer-events: none;
}
.header-content-overlay {
   position: absolute;
   left: 0; right: 0; bottom: 0; 
   padding: 16px;
   z-index: 5;
   /* Gradient from bottom */
   background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
   pointer-events: none; /* Let clicks pass through to image */
}
/* Re-enable pointer events for interactive elements inside overlay */
.header-content-overlay > * {
   pointer-events: auto;
}
.shop-title-large {
   font-size: 24px;
   font-weight: 700;
   margin-bottom: 8px;
   text-shadow: 0 1px 3px rgba(0,0,0,0.5);
}
.shop-score-row {
   display: flex; align-items: center; gap: 6px;
   font-size: 12px; color: #fff;
   margin-bottom: 10px;
}
.score-val { color: #feeb5d; font-weight: 600; font-size: 14px; }
.shop-addr-row {
   display: flex; align-items: center;
   color: rgba(255,255,255,0.9);
   font-size: 13px;
   margin-bottom: 6px;
}
.addr-txt { flex: 1; margin-right: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.shop-time-row {
   display: flex; align-items: center;
   font-size: 12px;
   color: rgba(255,255,255,0.8);
   margin-bottom: 10px;
}
.status-badge {
    background: #00B96B;
    color: white;
    padding: 1px 4px;
    border-radius: 2px;
    font-size: 10px;
    margin-right: 6px;
}
.follow-btn-pos {
   position: absolute;
   right: 16px;
   bottom: 80px; /* Moved up from 60px */
}
.red-follow-btn {
    background: #ff2442;
    color: white;
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(255, 36, 66, 0.4);
}
.red-follow-btn.followed {
    background: rgba(255,255,255,0.2);
    border: 1px solid rgba(255,255,255,0.5);
    box-shadow: none;
}
.section-block { background: white; }

.shop-detail-page { min-height: 100vh; display: flex; flex-direction: column; background: #f0f2f5; padding-bottom: 60px; }

/* Loading */
.loading-mask { position: fixed; inset: 0; background: white; z-index: 999; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.loading-mask.hidden { display: none; }
.loading-spinner { width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #FF6B00; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

/* Header */
.header { height: 48px; background: rgba(255,255,255,0.9); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: space-between; padding: 0 16px; position: sticky; top: 0; z-index: 100; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
.header-title { font-weight: 600; font-size: 17px; max-width: 70%; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }

/* Container */
.shop-info-container { flex: 1; overflow-y: auto; overflow-x: hidden; position: relative; padding-bottom: 70px; }

/* Hero Section - Immersive Header */
.hero-section { position: relative; width: 100%; height: 240px; background: #333; overflow: hidden; }
.hero-img { width: 100%; height: 100%; object-fit: cover; }
.hero-placeholder { width: 100%; height: 240px; background: linear-gradient(135deg, #667eea, #764ba2); }
.hero-gradient { position: absolute; left: 0; right: 0; bottom: 0; height: 120px; background: linear-gradient(to top, rgba(0,0,0,0.7), transparent); z-index: 5; pointer-events: none; }
.hero-content { position: absolute; left: 0; right: 0; bottom: 0; padding: 16px; display: flex; justify-content: space-between; align-items: flex-end; z-index: 10; }
.hero-info-left { flex: 1; }
.hero-shop-name { color: white; font-size: 22px; font-weight: 700; margin-bottom: 6px; text-shadow: 0 2px 8px rgba(0,0,0,0.3); }
.hero-shop-rating { display: flex; align-items: center; gap: 6px; }
.hero-shop-rating :deep(.el-rate__icon) { color: white !important; }
.hero-score { color: white; font-weight: 600; font-size: 14px; }
.hero-count { color: rgba(255,255,255,0.8); font-size: 12px; }

/* Follow Button in Header */
.hero-follow-btn { flex-shrink: 0; margin-left: 12px; }
.hero-follow-btn button { border: none; border-radius: 16px; padding: 6px 14px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.3s; }
.hero-follow-btn button.not-followed { background: #FF6B00; color: white; }
.hero-follow-btn button.followed { background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.5); }

/* Floating Info Card */
.floating-info-card { background: white; border-radius: 16px 16px 0 0; margin-top: -20px; position: relative; z-index: 15; padding: 16px; box-shadow: 0 -4px 16px rgba(0,0,0,0.08); }
.info-card-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.info-card-tags { display: flex; gap: 8px; }
.info-card-price { color: #FF6B00; font-weight: 600; font-size: 15px; }
.info-card-divider { height: 1px; background: #f0f0f0; margin: 12px 0; }
.info-card-address { display: flex; align-items: center; padding: 10px 0; cursor: pointer; }
.info-card-address i { color: #FF6B00; font-size: 16px; }
.info-card-address .address-text { flex: 1; margin: 0 10px; font-size: 14px; color: #333; line-height: 1.4; }
.info-card-address .el-icon-arrow-right { color: #ccc; }
.info-card-time { display: flex; align-items: center; padding: 8px 0; font-size: 14px; color: #666; }
.info-card-time i { color: #999; margin-right: 8px; }
.info-card-time .time-label { font-weight: 500; margin-right: 8px; }
.info-card-time .time-value { color: #333; }
.info-card-phone { display: flex; align-items: center; padding: 8px 0; font-size: 14px; color: #666; }
.info-card-phone i { color: #999; margin-right: 8px; }
.info-card-phone .call-btn { margin-left: auto; color: #FF6B00; background: #FFF5F0; padding: 4px 12px; border-radius: 12px; font-size: 12px; text-decoration: none; }

/* Section Gap */
.section-gap { height: 12px; background: #f0f2f5; }

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
.voucher-date-info { font-size: 10px; color: #999; margin-bottom: 4px; }
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

/* Foot Bar - Local Service Style */
.foot-bar { height: 60px; background: white; border-top: 1px solid #f5f5f5; display: flex; align-items: center; padding: 0 16px; padding-bottom: env(safe-area-inset-bottom); box-shadow: 0 -2px 10px rgba(0,0,0,0.02); z-index: 100; position: fixed; bottom: 0; left: 0; right: 0; }

.foot-left { display: flex; align-items: center; gap: 24px; margin-right: 20px; flex-shrink: 0; }
.foot-icon-btn { display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 10px; color: #333; gap: 3px; cursor: pointer; min-width: 32px; }
.foot-icon-btn i { font-size: 22px; color: #333; transition: all 0.2s; }
.foot-icon-btn.active i { color: #FF9900; }
.foot-icon-btn.active span { color: #FF9900; }
.foot-icon-btn:active i { transform: scale(0.9); }

.foot-right { flex: 1; display: flex; align-items: center; }
.foot-main-btn { width: 100%; height: 40px; background: linear-gradient(135deg, #FF9900, #FF5500); border-radius: 20px; color: white; font-size: 15px; font-weight: 600; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 10px rgba(255, 107, 0, 0.3); transition: all 0.2s; }
.foot-main-btn:active { transform: scale(0.98); box-shadow: 0 2px 5px rgba(255, 107, 0, 0.2); }

/* Preview Overlay */
.image-preview { position: fixed; inset: 0; background: black; z-index: 1000; display: flex; flex-direction: column; justify-content: center; }
.preview-swiper { width: 100%; height: 60vh; display: flex; align-items: center; justify-content: center; }
.preview-img { max-width: 100%; max-height: 100%; }
.preview-close { position: absolute; top: 20px; right: 20px; color: white; font-size: 30px; z-index: 1001; }
.preview-indicator { position: absolute; bottom: 40px; width: 100%; text-align: center; color: white; font-size: 16px; }

/* Comment Pop Modal - Modern Social App Style */
.comment-pop-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); z-index: 2000; display: flex; flex-direction: column; justify-content: flex-end; }
.comment-pop-box { background: #fff; border-radius: 16px 16px 0 0; padding: 20px; animation: slideUp 0.3s ease-out; max-height: 80vh; overflow-y: auto; }

/* Header */
.pop-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.pop-title { flex: 1; font-size: 16px; font-weight: 600; color: #333; text-align: center; }
.pop-close { font-size: 22px; color: #999; cursor: pointer; padding: 4px; }
.pop-close:hover { color: #333; }

/* Textarea Container */
.pop-textarea { background: #F7F8FA; border-radius: 12px; padding: 12px; margin-bottom: 16px; }
.pop-textarea textarea { width: 100%; min-height: 100px; border: none; outline: none; resize: none; font-size: 15px; line-height: 1.6; background: transparent; color: #333; padding: 0; }
.pop-textarea textarea::placeholder { color: #bbb; }

/* Image Preview */
.pop-images { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
.pop-image-item { width: 70px; height: 70px; position: relative; border-radius: 8px; overflow: hidden; }
.pop-image-item img { width: 100%; height: 100%; object-fit: cover; }
.pop-image-item i { position: absolute; top: 4px; right: 4px; width: 20px; height: 20px; background: rgba(0,0,0,0.6); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; cursor: pointer; }
.pop-image-add { width: 70px; height: 70px; border: 1px dashed #ddd; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #ccc; font-size: 24px; cursor: pointer; transition: all 0.2s; }
.pop-image-add:hover { border-color: #FF6B00; color: #FF6B00; }

/* Bottom Toolbar */
.pop-toolbar { display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 1px solid #f0f0f0; }
.pop-toolbar-left { display: flex; align-items: center; gap: 16px; }
.pic-icon { cursor: pointer; transition: opacity 0.2s; width: 24px; height: 24px; }
.pic-icon:hover path { fill: #FF6B00; }
.pop-rating-inline { display: flex; align-items: center; margin-left: 0; }

/* Pill-Shaped Send Button */
.pop-toolbar .el-button--primary {
    background: linear-gradient(135deg, #FF7B00, #FF5500) !important;
    border: none !important;
    border-radius: 20px !important;
    padding: 8px 24px !important;
    font-size: 14px !important;
    font-weight: 500 !important;
    box-shadow: 0 4px 12px rgba(255, 107, 0, 0.3) !important;
    transition: all 0.3s !important;
}
.pop-toolbar .el-button--primary:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(255, 107, 0, 0.4) !important; }
.pop-toolbar .el-button--primary:disabled { background: #ccc !important; box-shadow: none !important; }

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

/* Review Popup Bottom Sheet */
.review-popup-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: flex-end; }
.review-popup-sheet { width: 100%; height: 75vh; background: white; border-radius: 16px 16px 0 0; display: flex; flex-direction: column; animation: slideUp 0.3s ease; }
@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
.review-popup-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #f0f0f0; flex-shrink: 0; }
.review-popup-title { font-size: 16px; font-weight: 600; }
.review-popup-close { font-size: 22px; color: #999; cursor: pointer; padding: 4px; }
.review-popup-close:hover { color: #333; }
.review-popup-body { flex: 1; overflow-y: auto; padding: 0 16px 20px; }
.review-popup-body .comment-box { padding: 16px 0; border-bottom: 1px solid #f5f5f5; }
.review-popup-body .comment-box:last-child { border-bottom: none; }
.empty-reviews { text-align: center; padding: 60px 20px; color: #999; }
.empty-reviews i { font-size: 48px; margin-bottom: 12px; color: #ddd; }
.loading-more { text-align: center; padding: 15px; color: #999; font-size: 13px; }
.no-more-reviews { text-align: center; padding: 15px; color: #ccc; font-size: 12px; }

/* Popup Bottom Input Bar */
.popup-bottom-bar { display: flex; align-items: center; padding: 12px 16px; border-top: 1px solid #f0f0f0; background: white; flex-shrink: 0; gap: 12px; }
.popup-input-placeholder { flex: 1; background: #f5f5f5; padding: 10px 16px; border-radius: 20px; color: #999; font-size: 14px; }

/* Ensure comment modal is above review popup */
.comment-pop-overlay { z-index: 1100 !important; }

/* ===== Voucher Card V2 Styles ===== */
.voucher-card-v2 {
    background: #fff;
    border-radius: 12px;
    margin-bottom: 12px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.voucher-card-header {
    padding: 14px 16px 10px;
}

.voucher-title-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
}

.voucher-card-v2 .voucher-title {
    font-size: 17px;
    font-weight: 600;
    color: #333;
}

.voucher-flash-tag {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    background: linear-gradient(135deg, #ff6b6b, #ff2d55);
    color: #fff;
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 10px;
    font-weight: 500;
}

.voucher-shops {
    font-size: 13px;
    color: #666;
    margin-bottom: 4px;
}

.voucher-shops .shop-label {
    color: #999;
}

.voucher-shops .shop-names {
    color: #333;
}

.voucher-time, .voucher-usage-time {
    font-size: 12px;
    color: #ff5000;
    display: flex;
    align-items: center;
    gap: 4px;
}

.voucher-card-v2 .voucher-subtitle {
    font-size: 13px;
    color: #999;
    margin-bottom: 4px;
}

.voucher-card-body {
    padding: 16px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    border-radius: 12px;
    margin: 0 10px 10px;
}

.voucher-card-body.gradient-pink {
    background: linear-gradient(135deg, #ff6b9d 0%, #ff8a9d 50%, #ffb5c5 100%);
}

.voucher-card-body.gradient-orange {
    background: linear-gradient(135deg, #ff9500 0%, #ffb347 50%, #ffc980 100%);
}

.voucher-price-section {
    flex: 1;
}

.voucher-current-price {
    display: flex;
    align-items: baseline;
    color: #fff;
    margin-bottom: 4px;
}

.voucher-current-price .price-symbol {
    font-size: 16px;
    font-weight: 500;
}

.voucher-current-price .price-value {
    font-size: 42px;
    font-weight: 700;
    line-height: 1;
}

.voucher-original-info {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
}

.voucher-original-info .original-price {
    font-size: 14px;
    color: rgba(255,255,255,0.8);
    text-decoration: line-through;
}

.voucher-original-info .discount-badge {
    background: rgba(255,255,255,0.25);
    color: #fff;
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 500;
}

.voucher-sold-info {
    font-size: 12px;
    color: rgba(255,255,255,0.9);
    margin-bottom: 6px;
}

.voucher-progress-bar {
    width: 70%;
    height: 6px;
    background: rgba(255,255,255,0.3);
    border-radius: 3px;
    overflow: hidden;
}

.voucher-progress-bar .progress-fill {
    height: 100%;
    background: rgba(255,255,255,0.9);
    border-radius: 3px;
    transition: width 0.3s ease;
}

.voucher-action-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
}

.voucher-buy-btn {
    background: #fff;
    color: #ff5000;
    border: none;
    padding: 10px 20px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    transition: transform 0.2s, box-shadow 0.2s;
}

.voucher-buy-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.voucher-buy-btn:active {
    transform: scale(0.98);
}

.voucher-buy-btn:disabled {
    background: rgba(255,255,255,0.6);
    color: #999;
    cursor: not-allowed;
}

.voucher-stock {
    font-size: 12px;
    color: rgba(255,255,255,0.9);
}

.voucher-validity {
    font-size: 12px;
    color: #666;
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 4px;
}
</style>
