<template>
  <PageLayout :loading="pageLoading" skeleton-type="detail" class="blog-detail-page">
    <!-- 顶部固定用户信息栏 -->
    <div class="fixed-top-bar">
      <div class="top-back-btn" @click="goBack"><i class="el-icon-arrow-left"></i></div>
      <div class="top-user-section" @click="toOtherInfo" v-if="blog.id">
        <img class="top-user-avatar" :src="blog.icon || '/imgs/icons/default-icon.png'">
        <div class="top-user-info">
          <span class="top-user-name">{{blog.name}}</span>
          <span class="top-user-tag" v-if="blog.userTag">{{blog.userTag}}</span>
        </div>
      </div>
      <div class="top-actions">
        <button class="top-follow-btn" :class="{followed: followed}" @click.stop="toggleFollow" v-if="user && user.id !== blog.userId && blog.id">
          {{followed ? '已关注' : '关注'}}
        </button>
        <el-popover
            v-if="isOwner"
            placement="bottom-end"
            trigger="click"
            v-model:visible="showMenu"
            popper-class="more-menu-popover"
            :width="120"
            :show-arrow="false"
        >
            <template #reference>
                <i class="el-icon-more top-more-icon"></i>
            </template>
            <div class="more-menu-list">
                <div class="menu-item" @click="handleSticky">
                    <i class="el-icon-top"></i> {{ blog.pin ? '取消置顶' : '置顶' }}
                </div>
                <div class="menu-item" @click="handleEdit">
                    <i class="el-icon-edit-outline"></i> 编辑
                </div>
                <div class="menu-item delete" @click="handleDelete">
                    <i class="el-icon-delete"></i> 删除
                </div>
                <div class="menu-item" @click="goHome">
                    <i class="el-icon-s-home"></i> 回到首页
                </div>
            </div>
        </el-popover>
      </div>
    </div>

    <!-- 可滚动内容区域 -->
    <div class="scroll-container" ref="scrollContainer" @scroll.passive="onMainScroll">
       <div v-if="!blog.id && !pageLoading" class="empty-state">
           <i class="el-icon-warning-outline"></i>
           <p>内容不存在或已被删除</p>
       </div>

       <div v-if="blog.id" class="content-wrapper">
          <!-- 沉浸式图片轮播区 -->
          <div class="immersive-swiper" 
               v-if="blog.images && blog.images.length > 0"
               @touchstart="onTouchStart"
               @touchmove="onTouchMove"
               @touchend="onTouchEnd"
          >
            <div class="swiper-container">
              <el-carousel 
                ref="imageCarousel"
                height="100%" 
                :autoplay="false" 
                arrow="never" 
                indicator-position="none"
                @change="onCarouselChange"
              >
                 <el-carousel-item v-for="(img, i) in blog.images" :key="i">
                    <div class="swiper-slide-inner">
                       <img 
                         :src="img" 
                         class="swiper-image" 
                         @click="previewImage(blog.images, i)" 
                         @load="onImageLoad"
                         @error="(e) => e.target.src = '/imgs/default-placeholder.png'"
                       >
                    </div>
                 </el-carousel-item>
              </el-carousel>
            </div>
            <!-- 右下角数字指示器 -->
            <div class="image-counter">{{currentImageIndex + 1}}/{{blog.images.length}}</div>
          </div>
          
          <!-- 无图片时显示默认占位图 -->
          <div class="no-image-placeholder" v-else>
             <img src="/imgs/default-placeholder.png" class="placeholder-image">
          </div>

          <!-- 博客文字内容 -->
          <div class="blog-content-section">
            <div class="title-with-status">
               <h1 class="blog-title" v-if="blog.title">{{blog.title}}</h1>
               <div class="detail-status-tag status-pending" v-if="user && user.id === blog.userId && blog.status === 0">审核中</div>
               <div class="detail-status-tag status-rejected" v-if="user && user.id === blog.userId && (blog.status === 2 || blog.status === 3)">审核未通过</div>
            </div>
            <div class="blog-text" v-html="blog.content"></div>
            <div class="blog-meta">
               <span class="meta-time">{{formatDate(blog.createTime)}}</span>
               <span class="meta-location" v-if="blog.ipLocation">· {{blog.ipLocation}}</span>
            </div>
          </div>

          <!-- 关联店铺卡片 (POI Card) -->
          <div class="poi-card modern-poi" v-if="shop.id" @click="toShopDetail">
             <div class="poi-thumbnail">
                <img :src="shop.image || '/imgs/default-placeholder.png'" @error="(e) => e.target.src = '/imgs/default-placeholder.png'">
             </div>
             <div class="poi-info">
                <div class="poi-name">{{shop.name}}</div>
                <div class="poi-rating">
                   <div class="star-icons">
                      <van-rate v-model="commentRating" :size="12" color="#FF9900" void-icon="star" void-color="#eee" readonly />
                   </div>
                   <span class="rating-score">{{(shop.score/10).toFixed(1)}}</span>
                </div>
                <div class="poi-price">¥{{shop.avgPrice}}/人</div>
             </div>
             <div class="poi-arrow">
                <div class="arrow-circle"><i class="el-icon-arrow-right"></i></div>
             </div>
          </div>

          <!-- 点赞用户列表 -->
          <div class="like-section modern-like" v-if="likes && likes.length > 0">
             <div class="like-container">
                 <div class="like-icon-btn" :class="{'is-liked': blog.isLike}" @click="addLike">
                     <svg viewBox="0 0 24 24" width="22" height="22">
                         <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" :fill="blog.isLike ? '#ff2442' : '#bbbbbb'"></path>
                     </svg>
                 </div>
                 <div class="like-avatars">
                    <div class="like-avatar-item" v-for="(u, index) in likes.slice(0, 8)" :key="u.id" :style="{ zIndex: 10 - index }" @click="toUserDetail(u.id)">
                       <img :src="u.icon || '/imgs/icons/default-icon.png'">
                    </div>
                 </div>
                 <div class="like-count-text">{{blog.liked}}人点赞</div>
             </div>
          </div>

          <div class="section-line"></div>

          <!-- 评论区域 -->
          <div class="comments-section" ref="commentsSection">
             <div class="comments-header-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <div class="comments-header" style="margin-bottom: 0;">网友评论 ({{blog.comments || 0}})</div>
                <div class="comments-sort-group" style="display: flex; gap: 15px; font-size: 14px; color: #999;">
                    <span
                      class="comments-sort-btn"
                      :class="{ 'active': commentSortType === 'latest' }"
                      style="cursor: pointer;"
                      @click="onCommentSortChange('latest')"
                    >
                      最新
                    </span>
                    <span style="width: 1px; height: 14px; background: #ddd; margin: 3px 0;"></span>
                    <span
                      class="comments-sort-btn"
                      :class="{ 'active': commentSortType === 'hot' }"
                      style="cursor: pointer;"
                      @click="onCommentSortChange('hot')"
                    >
                      最热
                    </span>
                </div>
             </div>
             
             <div class="comment-list" v-if="(comments && comments.length > 0) || (aiComment && aiComment.content)">
                <!-- AI 评论 -->
                <div class="comment-box ai-generated-comment" v-if="aiComment && aiComment.content">
                   <div class="comment-icon ai-comment-icon"><i class="el-icon-magic-stick"></i></div>
                   <div class="comment-info ai-comment-info">
                      <div class="comment-user">
                         智评助手
                         <span class="ai-verified"><i class="el-icon-check"></i> 官方认证</span>
                      </div>
                      <div class="comment-content">{{aiComment.content}}</div>
                      <div class="comment-stats"><span class="ai-highlight">{{aiComment.createTime}}</span></div>
                   </div>
                   <div class="ai-generated-badge">AI生成</div>
                </div>

                <!-- 用户评论 -->
                <div class="comment-box" v-for="c in comments" :key="c.id">
                   <div class="comment-icon" @click.stop="toUserDetail(c.userId)">
                      <img :src="c.userIcon || '/imgs/icons/default-icon.png'">
                   </div>
                   <div class="comment-info">
                      <div class="comment-user" @click.stop="toUserDetail(c.userId)">
                         {{c.nickName || '匿名用户'}} <span>Lv{{c.userLevel || 1}}</span>
                      </div>
                      <div class="comment-content">{{c.content}}</div>
                      <div class="comment-images" v-if="c.images && c.images.length">
                         <img v-for="(img, idx) in c.images" :key="idx" :src="img" @click="previewImage(c.images, idx)">
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
                            <div class="c-action-btn delete-btn" v-if="user.id === c.userId" @click.stop="handleCommentDelete(c)">
                               <i class="el-icon-delete"></i>
                            </div>
                         </div>
                      </div>

                      <!-- 回复列表 -->
                      <div class="comment-replies" v-if="c.comments > 0">
                           <!-- Initial Expand Button (Only show if NOT expanded) -->
                           <div class="reply-expand" v-if="!c.showReplies" @click.stop="toggleReplies(c)">
                               展开{{c.comments}}条回复 <i class="el-icon-arrow-down"></i>
                           </div>

                           <!-- Reply List (Show if expanded) -->
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
                                     <div class="comment-images" v-if="r.images && r.images.length">
                                        <img v-for="(img, idx) in r.images" :key="idx" :src="img" @click.stop="previewImage(r.images, idx)">
                                     </div>
                                     <div class="reply-actions">
                                          <!-- Add time here -->
                                          <span class="reply-time" style="margin-right: 10px;">{{formatDate(r.createTime)}}</span>

                                          <div class="c-action-btn" @click.stop="handleCommentLike(r)">
                                             <svg viewBox="0 0 24 24" width="16" height="16">
                                               <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" :fill="r.isLike ? '#ff2442' : '#999'"></path>
                                             </svg>
                                             <span v-if="r.liked > 0">{{r.liked}}</span>
                                          </div>
                                           <div class="c-action-btn delete-btn" v-if="user.id === r.userId" @click.stop="handleCommentDelete(r)">
                                             <i class="el-icon-delete"></i>
                                          </div>
                                     </div>
                                  </div>
                              </div>
                              
                              <!-- Load More / Collapse Button (Show at BOTTOM) -->
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
             <div v-if="comments.length === 0 && !(aiComment && aiComment.content) && !commentsLoading && commentsNoMore" class="no-comments">暂无评论，快来发表第一条评论吧～</div>
             <div class="comment-load-state" v-if="commentsLoading">加载中...</div>
             <div class="comment-load-state comment-load-end" v-else-if="commentsNoMore && comments.length > 0">没有更多评论了</div>
             <div ref="commentLoadTrigger" class="comment-load-trigger" v-if="!commentsNoMore"></div>
          </div>
         
      </div> <!-- End of content-wrapper -->
    </div> <!-- End of scroll-container -->

    <!-- 新版小红书式底部固定内联操作栏 (Sticky Bottom Bar) -->
    <div class="sticky-bottom-bar" :class="{ 'is-focused': isInputFocus }">
       <!-- 展开输入的真实区域 -->
       <div class="inline-input-container" v-show="isInputFocus">
         <div class="inline-textarea-wrapper">
             <textarea 
               ref="inlineTextarea"
               v-model="commentText" 
               :placeholder="replyToComment ? ('回复 @' + replyToComment.nickName) : '说点什么...'" 
               :maxlength="500"
               rows="3"
               @focus="onInlineFocus"
             ></textarea>
         </div>
         <!-- 图片缩略图预览区 -->
         <div class="inline-images" v-if="selectedImages.length > 0">
            <div class="inline-image-item" v-for="(img, idx) in selectedImages" :key="idx">
               <img :src="img.url">
               <i class="el-icon-close" @click="removeImage(idx)"></i>
            </div>
            <div class="inline-image-add" @click="$refs.imageInput.click()" v-if="selectedImages.length < 9">
               <i class="el-icon-plus"></i>
            </div>
         </div>
         <!-- 工具栏 (表情、图片、发送、取消) -->
         <div class="inline-toolbar">
            <div class="inline-toolbar-left">
               <span class="toolbar-icon" @click="insertAt">@</span>
               <svg class="toolbar-icon pic-icon" @click="$refs.imageInput.click()" viewBox="0 0 1024 1024" width="22" height="22">
                  <path d="M896 160H128c-35.2 0-64 28.8-64 64v576c0 35.2 28.8 64 64 64h768c35.2 0 64-28.8 64-64V224c0-35.2-28.8-64-64-64z m0 640H128V224h768v576z" fill="#666"></path>
                  <path d="M320 512c53 0 96-43 96-96s-43-96-96-96-96 43-96 96 43 96 96 96z" fill="#666"></path>
                  <path d="M896 736l-192-192-128 96-192-160-256 256v64h768z" fill="#666"></path>
               </svg>
               <input type="file" ref="imageInput" multiple accept="image/*" @change="handleImageUpload" style="display:none">
               <van-icon
                 name="smile-o"
                 class="emoji-icon emoji-toggle"
                 :class="{ active: showEmojiPanel }"
                 @click="toggleEmojiPanel"
               />
            </div>
            <div class="inline-toolbar-right">
               <el-button class="cancel-btn" size="small" round @click="closeInlineInput">取消</el-button>
               <el-button class="send-btn" type="primary" size="small" :disabled="!commentText.trim()" round @click="publishComment">发送</el-button>
            </div>
         </div>
         <div class="emoji-panel" v-show="showEmojiPanel">
            <div class="emoji-grid">
               <span class="emoji-item" v-for="emoji in emojis" :key="emoji" @click="insertEmoji(emoji)">{{emoji}}</span>
            </div>
         </div>
       </div>

       <!-- 未聚焦时的紧凑底栏 -->
       <div class="compact-bottom-bar" v-show="!isInputFocus">
          <div class="compact-input-placeholder" @click="openInlineInput">
            <i class="el-icon-edit"></i>
            <span>说点什么...</span>
          </div>
          <div class="compact-actions">
            <div class="action-item" @click="addLike">
              <svg viewBox="0 0 24 24" width="22" height="22">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" :fill="blog.isLike ? '#ff2442' : '#333'"></path>
              </svg>
              <span>{{formatCompactCount(blog.liked)}}</span>
            </div>
            <div class="action-item" @click="toggleStar">
              <i :class="blog.isStared ? 'el-icon-star-on active' : 'el-icon-star-off'"></i>
              <span>{{formatCompactCount(blog.stared)}}</span>
            </div>
            <div class="action-item" @click="scrollToComments">
              <i class="el-icon-chat-dot-round"></i>
              <span>{{formatCompactCount(blog.comments)}}</span>
            </div>
            <div class="action-item action-share" @click="showShare = true">
              <i class="el-icon-share"></i>
              <span>分享</span>
            </div>
          </div>
       </div>
    </div>
    
    <!-- All Reviews Bottom Sheet Popup -->
    <div class="review-popup-overlay" v-if="showReviewPopup" @click="showReviewPopup = false">
       <div class="review-popup-sheet" @click.stop>
          <div class="review-popup-header">
             <span class="review-popup-title">全部评论 ({{blog.comments || 0}})</span>
             <i class="el-icon-close review-popup-close" @click="showReviewPopup = false"></i>
          </div>
          <div class="review-popup-body" @scroll.passive="onPopupScroll">
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
                   <div class="comment-content">{{c.content}}</div>
                   <div class="comment-images" v-if="c.images && c.images.length">
                      <img v-for="(img, idx) in c.images" :key="idx" :src="img" @click="previewImage(c.images, idx)">
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
                      <!-- Initial Expand Button -->
                      <div class="reply-expand-btn" v-if="!c.showReplies" @click.stop="toggleReplies(c)">
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
                                     <div class="c-action-btn delete-btn" v-if="user.id === r.userId" @click.stop="handleCommentDelete(r)">
                                        <i class="el-icon-delete"></i>
                                     </div>
                                </div>
                             </div>
                         </div>
                         
                         <!-- Load More / Collapse Button -->
                         <div class="reply-expand-btn" 
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
             <div v-if="allCommentsNoMore" class="no-more-reviews">没有更多评论了</div>
          </div>
          <!-- Bottom Input Bar in Popup -->
          <div class="popup-bottom-bar" @click.stop>
             <input
               ref="popupCommentInput"
               v-model="commentText"
               class="popup-input-editor"
               :placeholder="replyToComment ? ('回复 @' + replyToComment.nickName) : '发条评论，和大家一起讨论'"
               maxlength="500"
               @focus="handlePopupInputFocus"
               @click.stop
             />
             <el-button
               type="primary"
               size="small"
               round
               :disabled="!commentText.trim()"
               @click.stop="publishCommentFromPopup"
             >发布</el-button>
          </div>
       </div>
    </div>
    
    <!-- 图片预览 -->
    <el-image-viewer v-if="showImagePreview" :url-list="previewImages" :initial-index="currentPreviewIndex" @close="closeImagePreview" hide-on-click-modal />

    <!-- Custom Delete Dialog -->
    <van-dialog
      v-model:show="showDeleteDialog"
      title="提示"
      show-cancel-button
      confirm-button-color="#576b95"
      @confirm="confirmDelete"
      class="custom-delete-dialog"
    >
      <div class="delete-dialog-content">
        <van-icon name="warning" color="#ff9900" size="36" />
        <div class="delete-dialog-text">确定删除这篇笔记吗？删除后不可恢复</div>
      </div>
    </van-dialog>

    <!-- Share Sheet -->
    <van-share-sheet
      v-model:show="showShare"
      title="立即分享给好友"
      :options="shareOptions"
      @select="onShareSelect"
    />
  </PageLayout>
</template>

<script>
import { getBlogDetail, deleteBlog, pinBlog } from '@/api/blog';
import { getShopDetail } from '@/api/shop';
import { getLikeList, isFollowed, followUser, likeBlog, getComments, addComment, likeComment, replyComment, removeComment, toggleStar, getChildComments } from '@/api/interaction';
import { getCurrentUser } from '@/api/user';
import { uploadFile } from '@/api/common';
import '@/assets/css/blog-detail.css';
import { ElImageViewer } from 'element-plus';
import { showConfirmDialog } from 'vant';
import { throttle } from '@/utils/throttle';

import PageLayout from '@/components/PageLayout/PageLayout.vue';

export default {
  name: 'BlogDetail',
  components: { ElImageViewer, PageLayout },
  data() {
    return {
       blog: {},
       shop: {},
       user: {},
       likes: [],
       comments: [],
       commentsPage: 1,
       commentsPageSize: 10,
       commentSortType: 'hot', // 默认最热
       commentsNoMore: false,
       commentsLoading: false,
       commentLoadArmed: false,
       commentObserver: null,
       aiComment: null,
       followed: false,
       pageLoading: true, // 初始为 true，确保骨架屏立即显示
       
       // Carousel
       currentImageIndex: 0,
       carouselHeight: '400px',
       touchStartX: 0,
       touchEndX: 0,
       
       // Comment UI
       isInputFocus: false,
       showEmojiPanel: false,
       commentText: '',
       commentRating: 5,
       selectedImages: [], // {file, url}
       emojis: [
          '\uD83D\uDE00', '\uD83D\uDE03', '\uD83D\uDE04', '\uD83D\uDE01', '\uD83D\uDE06',
          '\uD83D\uDE05', '\uD83D\uDE02', '\uD83E\uDD23', '\uD83D\uDE0A', '\uD83D\uDE42',
          '\uD83D\uDE09', '\uD83D\uDE0D', '\uD83E\uDD70', '\uD83D\uDE18', '\uD83D\uDE0B',
          '\uD83D\uDE0E', '\uD83E\uDD29', '\uD83E\uDD14', '\uD83E\uDD2D', '\uD83D\uDE2E',
          '\uD83D\uDE31', '\uD83D\uDE2D', '\uD83D\uDE22', '\uD83D\uDE24', '\uD83D\uDE21',
          '\uD83E\uDD2C', '\uD83D\uDE37', '\uD83E\uDD22', '\uD83D\uDC4D', '\uD83D\uDC4E',
          '\uD83D\uDC4F', '\uD83D\uDE4C', '\uD83D\uDE4F', '\uD83E\uDD1D', '\uD83D\uDC4C',
          '\u2764\uFE0F', '\uD83E\uDDE1', '\uD83D\uDC9B', '\uD83D\uDC9A', '\uD83D\uDC99',
          '\uD83D\uDC9C', '\uD83D\uDDA4', '\uD83D\uDC94', '\uD83D\uDD25', '\u2728',
          '\uD83C\uDF1F', '\uD83C\uDF89', '\uD83C\uDF8A', '\uD83D\uDCAF', '\uD83D\uDE80'
       ],
       
       // Preview
       showImagePreview: false,
       previewImages: [],
       currentPreviewIndex: 0,
       replyToComment: null,
       showMenu: false,
       
       // Review popup
       showReviewPopup: false,
       allComments: [],
       allCommentsPage: 1,
       allCommentsNoMore: false,
       allCommentsLoading: false,

       // Delete Dialog
       showDeleteDialog: false,
       
       // Share Sheet
       showShare: false,
       shareOptions: [
          { name: '微信', icon: 'wechat' },
          { name: '朋友圈', icon: 'wechat-moments' },
          { name: '微博', icon: 'weibo' },
          { name: 'QQ', icon: 'qq' },
          { name: '复制链接', icon: 'link' },
          { name: '系统分享', icon: 'poster' }, // using a generic icon for native share
       ]
    }
  },
  computed: {
     fileURL() {
        return this.$fileURL || '';
     },
     isOwner() {
         return this.user && this.blog && this.user.id === this.blog.userId;
     }
  },
  created() {
     this.onPopupScroll = throttle(this.onPopupScroll, 120);
     const id = this.$route.query.id;
     if(id) {
        this.pageLoading = true;
        this.queryBlogById(id).finally(() => this.pageLoading = false);
        this.loadComments(id);

        const token = localStorage.getItem("token");
        if(token) {
           this.queryLoginUser();
        }
     }
  },
  mounted() {
     this.setupCommentObserver();
     window.addEventListener('scroll', this.onWindowScroll, { passive: true });
  },
  beforeUnmount() {
     if (this.commentObserver) {
        this.commentObserver.disconnect();
        this.commentObserver = null;
     }
     if (typeof this.onPopupScroll?.cancel === 'function') {
        this.onPopupScroll.cancel();
     }
     window.removeEventListener('scroll', this.onWindowScroll);
  },
  methods: {
     onCommentSortChange(type) {
         if (!type || this.commentSortType === type) return;
         this.commentSortType = type;
         if (!this.blog || !this.blog.id) return;
         this.loadComments(this.blog.id, true).then(() => {
             if (this.showReviewPopup) {
                 this.loadAllComments(true);
             }
         });
     },
     getCommentSortParams() {
         return {
             sort: this.commentSortType
         };
     },
     goBack() { this.$router.go(-1); },
     toOtherInfo() {
        if(this.user && this.user.id === this.blog.userId) {
           this.$router.push('/user/profile');
        } else {
           this.$router.push(`/user/profile/${this.blog.userId}`);
        }
     },
     onShareSelect(option) {
         this.showShare = false;
         const shareUrl = window.location.href;
         const shareTitle = this.blog.title || 'SmartLive 笔记分享';
         const shareText = this.blog.content ? this.blog.content.replace(/<[^>]+>/g, '').substring(0, 50) + '...' : '快来看看这篇有趣的笔记吧！';

         if (option.name === '复制链接') {
              navigator.clipboard.writeText(shareUrl).then(() => {
                  this.$message.success('链接已复制到剪贴板');
              }).catch(() => {
                  this.$message.error('复制失败，请手动复制浏览器地址栏');
              });
         } else if (option.name === '系统分享' || option.name === '微信' || option.name === '朋友圈' || option.name === '微博' || option.name === 'QQ') {
             // 尝试调用系统底层 Web Share API (Safari, Chrome for Android)
             if (navigator.share) {
                 navigator.share({
                     title: shareTitle,
                     text: shareText,
                     url: shareUrl,
                 }).catch((error) => console.log('分享失败或用户取消', error));
             } else {
                 if(option.name !== '系统分享') {
                     // 网页端没实现SDK分享时，降级处理为复制链接
                     navigator.clipboard.writeText(shareUrl).then(() => {
                         this.$message.success('已复制链接，请前往对应 App 粘贴发送');
                     });
                 } else {
                    this.$message.warning('当前环境不支持系统原生分享');
                 }
             }
         }
     },
      toUserDetail(userId) {
         if(!userId) return;
         if(this.user && String(this.user.id) === String(userId)) {
            this.$router.push('/user/profile');
         } else {
            this.$router.push(`/user/profile/${userId}`);
         }
      },
      toShopDetail() {
        if(this.shop.id) this.$router.push({ path: '/shop/detail', query: { id: this.shop.id } });
     },
      formatDate(time) {
         if(!time) return '';
         const d = new Date(time);
         const hours = String(d.getHours()).padStart(2, '0');
         const minutes = String(d.getMinutes()).padStart(2, '0');
         return `${d.getFullYear()}.${d.getMonth()+1}.${d.getDate()} ${hours}:${minutes}`;
      },
      formatCompactCount(value) {
         const num = Number(value || 0);
         if (!Number.isFinite(num) || num <= 0) return '0';
         if (num >= 10000) {
            const wan = (num / 10000).toFixed(num >= 100000 ? 0 : 1).replace(/\.0$/, '');
            return `${wan}万`;
         }
         return String(num);
      },
     
     // API Calls
      async queryBlogById(id) {
        try {
           let res = await getBlogDetail(id);
           // Adapter: unwrap if strictly needed. Usually 'request.js' handles standard structure, 
           // but seeing previous issues, let's be safe.
           // However, for single object returns, often it's just the object.
           // If 'res' has 'data' property that is the object, extract it.
           // BUT be careful not to mistake a blog property named 'data' (unlikely).
           // If res.id exists, it's the blog. If res.data && res.data.id, it's nested.
           let blogData = res;
           if (!res.id && res.data) blogData = res.data;

           this.blog = blogData;
           if(this.blog.images) {
              const imgs = typeof this.blog.images === 'string' ? this.blog.images.split(',') : this.blog.images;
              this.blog.images = imgs.map(i => i.startsWith('http') ? i : this.$fileURL + i);
           }
           if(this.blog.icon) this.blog.icon = this.$fileURL + this.blog.icon;
           
           if(this.blog.shopId) this.queryShopById(this.blog.shopId);
           
           // Check follow status if user is already logged in
           if(this.user.id && this.user.id !== this.blog.userId) {
               this.checkFollowStatus();
           }
           
           this.queryLikeList(id);
        } catch(e) { console.error(e); }
     },
     async queryShopById(id) {
        getShopDetail(id).then(res => {
           let shopData = res;
           if (!res.id && res.data) shopData = res.data;
           
           this.shop = shopData;
           if(this.shop.images) this.shop.image = this.$fileURL + this.shop.images.split(',')[0];
        });
     },
     queryLikeList(id) {
        getLikeList({ sourceType: 3, sourceId: id }).then(res => {
           let list = res;
           if (Array.isArray(res)) list = res;
           else if (res && Array.isArray(res.data)) list = res.data;
           
           this.likes = list || [];
           this.likes.forEach(u => u.icon = u.icon ? this.$fileURL + u.icon : '');
        });
     },
     queryLoginUser() {
        getCurrentUser().then(res => {
           this.user = res.data || res || {};
           if (this.user.data) this.user = this.user.data; // Double check
           
           if(this.user.icon) this.user.icon = this.$fileURL + this.user.icon;
           
           // Check follow status if both blog and user are loaded
           if(this.blog.userId && this.user.id && this.user.id !== this.blog.userId) {
               this.checkFollowStatus();
           }
        }).catch(() => {});
     },
     
     // Interactions
     checkFollowStatus() {
        isFollowed({ sourceId: this.blog.userId, sourceType: 1 }).then(res => {
            this.followed = res.data;
            this.followStatusLoaded = true;
        }).catch(() => {
            this.followStatusLoaded = true;
        });
     },
     toggleFollow() {
        if(!this.user.id) return this.$router.push('/user/login');
        const newStatus = !this.followed;
        followUser({
           sourceId: this.blog.userId,
           sourceType: 1,
           isFollow: newStatus
        }).then(() => {
           this.followed = newStatus;
           this.$message.success(newStatus ? '已关注' : '已取消关注');
        });
     },
     addLike() {
        if(!this.user.id) return this.$router.push('/user/login');
        
        // Optimistic update
        const originalLike = this.blog.isLike;
        const originalCount = this.blog.liked;
        
        this.blog.isLike = !this.blog.isLike;
        this.blog.liked = this.blog.isLike ? (this.blog.liked + 1) : (this.blog.liked - 1);
        
        likeBlog({ sourceType: 3, sourceId: this.blog.id }).then(() => {
           this.queryLikeList(this.blog.id);
        }).catch(() => {
           // Revert
           this.blog.isLike = originalLike;
           this.blog.liked = originalCount;
           this.$message.error('操作失败');
        });
     },
     
     // Comments
     loadComments(id, reset = true) {
        if (!id) return Promise.resolve();
        if (this.commentsLoading) return Promise.resolve();
        if (!reset && this.commentsNoMore) return Promise.resolve();

        if (reset) {
           this.comments = [];
           this.aiComment = null;
           this.commentsPage = 1;
           this.commentsNoMore = false;
           this.commentLoadArmed = false;
        }

        this.commentsLoading = true;

        return getComments({
           sourceId: id,
           sourceType: 3,
           current: this.commentsPage,
           size: this.commentsPageSize,
           ...this.getCommentSortParams()
        }).then(res => {
           let list = [];
           if (Array.isArray(res)) list = res;
           else if (res && Array.isArray(res.list)) list = res.list;
           else if (res && Array.isArray(res.data)) list = res.data;
           else if (res && res.data && Array.isArray(res.data.records)) list = res.data.records;

           const rawList = list || [];
           if (rawList.length === 0) {
              this.commentsNoMore = true;
              return;
           }

           const aiComment = rawList.find(c => c.isAIGenerated);
           if (reset && aiComment) {
              this.aiComment = {
                 ...aiComment,
                 createTime: this.formatDate(aiComment.createTime)
              };
           }

           const roots = rawList
              .filter(c => !c.isAIGenerated)
              .map(c => ({
                 ...c,
                 userIcon: c.userIcon ? (c.userIcon.startsWith('http') ? c.userIcon : this.fileURL + c.userIcon) : '',
                 images: c.images ? c.images.split(',').filter(x => x).map(i => i.startsWith('http') ? i : this.fileURL + i) : [],
                 isLike: c.isLike || false,
                 liked: c.liked || 0,
                 comments: c.replyCount || c.comments || c.childCount || 0,
                 showReplies: false,
                 replies: [],
                 replyPage: 1
              }))
              .filter(c => !c.answerId || c.answerId === 0 || c.answerId === '0');

           if (roots.length > 0) {
              const existingIds = new Set(this.comments.map(c => String(c.id)));
              const nextList = roots.filter(c => !existingIds.has(String(c.id)));
              this.comments = [...this.comments, ...nextList];
           }

           if (rawList.length < this.commentsPageSize) {
              this.commentsNoMore = true;
           } else {
              this.commentsPage += 1;
           }
        }).catch(err => {
           console.error('Failed to load comments:', err);
        }).finally(() => {
           this.commentsLoading = false;
           this.$nextTick(() => this.observeCommentLoadTrigger());
        });
     },
      loadMoreComments() {
         if (!this.blog.id || this.commentsLoading || this.commentsNoMore || !this.commentLoadArmed) return;
         this.loadComments(this.blog.id, false);
      },
      onMainScroll(e) {
         const target = e && e.target ? e.target : null;
         const top = (target && typeof target.scrollTop === 'number') ? target.scrollTop : 0;
         if (!this.commentLoadArmed && top > 0) {
            this.commentLoadArmed = true;
            this.observeCommentLoadTrigger();
         }
         if (this.commentLoadArmed && target) {
            const remain = target.scrollHeight - target.scrollTop - target.clientHeight;
            if (remain < 180) {
               this.loadMoreComments();
            }
         }
      },
      onWindowScroll() {
         if (!this.commentLoadArmed && window.scrollY > 0) {
            this.commentLoadArmed = true;
            this.observeCommentLoadTrigger();
         }
         if (!this.commentLoadArmed || this.commentsLoading || this.commentsNoMore) return;
         const triggerEl = this.$refs.commentLoadTrigger;
         if (!triggerEl || typeof triggerEl.getBoundingClientRect !== 'function') return;
         const rect = triggerEl.getBoundingClientRect();
         const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
         if (rect.top - viewportHeight < 180) {
            this.loadMoreComments();
         }
      },
     scrollToComments() {
        this.$nextTick(() => {
           if (this.$refs.commentsSection && this.$refs.commentsSection.scrollIntoView) {
              this.$refs.commentsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
           }
        });
     },
     setupCommentObserver() {
        if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
        if (this.commentObserver) {
           this.commentObserver.disconnect();
        }
         this.commentObserver = new IntersectionObserver((entries) => {
            if (entries.some(entry => entry.isIntersecting)) {
               this.loadMoreComments();
            }
         }, {
            root: null,
            rootMargin: '0px 0px 220px 0px',
            threshold: 0
         });
        this.observeCommentLoadTrigger();
     },
     observeCommentLoadTrigger() {
        if (!this.commentObserver) return;
        this.commentObserver.disconnect();
        if (this.$refs.commentLoadTrigger) {
           this.commentObserver.observe(this.$refs.commentLoadTrigger);
        }
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
                   // Optional: Clear replies to reset? Or keep cached.
                   // comment.replies = []; 
                   // comment.replyPage = 1;
              }
          }
      },

      fetchReplies(comment) {
          // Use getChildComments as per user request/API definition
          getChildComments({
              id: comment.id,
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
                      isLike: r.isLike || false,
                      comments: r.replyCount || r.comments || 0,
                      showReplies: false,
                      replies: [],
                      replyPage: 1
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
      viewAllComments() {
         this.scrollToComments();
      },
      loadAllComments(reset = false) {
         if(reset) {
            this.allCommentsPage = 1;
            this.allComments = [];
            this.allCommentsNoMore = false;
         }

         if(this.allCommentsLoading || this.allCommentsNoMore) return;
         this.allCommentsLoading = true;
         
         getComments({ sourceId: this.blog.id, sourceType: 3, current: this.allCommentsPage, ...this.getCommentSortParams() }).then(res => {
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
               
               // Filter root comments and append
               const roots = processed.filter(c => !c.answerId || c.answerId === 0 || c.answerId === '0');
               
               if(this.allCommentsPage === 1) {
                  this.allComments = roots;
               } else {
                  this.allComments = [...this.allComments, ...roots];
               }
               
               // Check if we reached the end
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
      handlePopupInputFocus() {
         if(!this.user || !this.user.id) {
            this.$message.warning("请先登录");
            if(this.$refs.popupCommentInput) {
               this.$refs.popupCommentInput.blur();
            }
            this.$router.push('/user/login');
         }
      },
      publishCommentFromPopup() {
         if(!this.user || !this.user.id) {
            this.$message.warning("请先登录");
            return this.$router.push('/user/login');
         }
         this.selectedImages = [];
         this.showEmojiPanel = false;
         this.isInputFocus = false;
         this.publishComment();
      },
     checkLogin() {
        if(!this.user.id) this.$router.push('/user/login');
        else this.openInlineInput();
     },
     openInlineInput() {
        this.isInputFocus = true;
        this.showEmojiPanel = false;
        this.$nextTick(() => {
           if(this.$refs.inlineTextarea) {
              this.$refs.inlineTextarea.focus();
           }
        });
     },
     closeInlineInput() {
        this.isInputFocus = false;
        this.showEmojiPanel = false;
        this.commentText = '';
        this.selectedImages = [];
        this.replyToComment = null;
     },
     onInlineFocus() {
        this.isInputFocus = true;
        this.showEmojiPanel = false;
     },
     toggleEmojiPanel() {
        this.showEmojiPanel = !this.showEmojiPanel;
        this.$nextTick(() => {
           if (!this.$refs.inlineTextarea) return;
           if (this.showEmojiPanel) this.$refs.inlineTextarea.blur();
           else this.$refs.inlineTextarea.focus();
        });
     },
     insertAt() {
         this.commentText += '@';
         if(this.$refs.inlineTextarea) this.$refs.inlineTextarea.focus();
     },
     insertEmoji(emoji) {
         this.commentText += emoji;
         if(!this.showEmojiPanel && this.$refs.inlineTextarea) {
             this.$nextTick(() => {
                 this.$refs.inlineTextarea.focus();
             });
         }
     },
     // Comment Publish
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
             // Heuristic: if it contains /smart-live, split there
             // Or generic split
             try {
                const urlObj = new URL(path);
                path = urlObj.pathname;
             } catch(e) {
                // simple split if URL parsing fails
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
        if (!this.commentText.trim()) {
           this.$message.error('请输入评价内容');
           return;
        }

        const data = {
           content: this.commentText,
           sourceId: this.blog.id,
           sourceType: 3, // Blog type
           userId: this.user.id,
           parentId: 0,
           answerId: 0,
           images: this.selectedImages.map(i => i.rawUrl).join(',')
        };

        if (this.replyToComment) {
             data.sourceType = 5;
             data.answerId = this.replyToComment.id; // Reply/Comment ID
             // For sourceType 5, sourceId is usually the parent comment ID or the reply ID we are targeting.
             // Based on ReviewDetail, we use replyToComment.id as sourceId.
             data.sourceId = this.replyToComment.id;
             data.parentId = this.blog.id; // The main resource ID
             
             delete data.rating;
        }

        addComment(data).then(() => {
           this.$message.success("发布成功");
           this.closeInlineInput();
           // Reload
           this.loadComments(this.blog.id); // Reload comments for the current blog
           this.queryBlogById(this.blog.id); // Refresh blog details to update comment count
           // Also refresh popup comments if open
           if(this.showReviewPopup) {
              this.allComments = [];
              this.allCommentsPage = 1;
              this.allCommentsNoMore = false;
              this.loadAllComments();
           }
        }).catch(err => {
           this.$message.error('发布失败，请重试');
           console.error(err);
        });
     },
     
     // Preview
     previewImage(list, idx) {
        this.previewImages = list || [];
        this.currentPreviewIndex = idx;
        this.showImagePreview = true;
     },
     closeImagePreview() {
        this.showImagePreview = false;
     },
     handleCommentLike(c) {
        if(!this.user.id) return this.$router.push('/user/login');
        const oldState = c.isLike;
        c.isLike = !c.isLike;
        c.liked = c.isLike ? (c.liked + 1) : (c.liked - 1);
        
        likeComment(c.id).then(() => {
           // Success
        }).catch(() => {
           c.isLike = oldState;
           c.liked = c.isLike ? (c.liked + 1) : (c.liked - 1);
        });
     },
      handleCommentReply(c) {
         if(!this.user.id) return this.$router.push('/user/login');
         this.replyToComment = c;
         this.commentText = ''; // Dont prefill, use placeholder
         if (this.showReviewPopup) {
            this.$nextTick(() => {
               if (this.$refs.popupCommentInput) {
                  this.$refs.popupCommentInput.focus();
               }
            });
         } else {
            this.openInlineInput();
         }
      },
     handleCommentDelete(c) {
        showConfirmDialog({
           title: '提示',
           message: '确定删除该评论吗？',
           confirmButtonText: '确认',
           cancelButtonText: '取消',
        }).then(() => {
           // Use fallback values if sourceType/sourceId are missing
           const sourceType = c.sourceType || 3; // Default to blog type
           const sourceId = c.sourceId || this.blog.id;
           
            removeComment({ id: c.id, sourceType, sourceId }).then(() => {
               this.$message.success('删除成功');
               this.loadComments(this.blog.id);
               this.queryBlogById(this.blog.id);
            }).catch(err => {
              console.error('删除失败', err);
              this.$message.error('删除失败，请重试');
           });
        }).catch(() => {});
     },
     
     // Star/Collection
      // Star/Collection
     toggleStar() {
        if(!this.user.id) return this.$router.push('/user/login');
        const newStatus = !this.blog.isStared;
        
        // Optimistic update
        const originalStatus = this.blog.isStared;
        const originalCount = this.blog.stared;
        
        this.blog.isStared = newStatus;
        this.blog.stared = newStatus ? (this.blog.stared || 0) + 1 : Math.max((this.blog.stared || 0) - 1, 0);
        
        toggleStar({
           sourceId: this.blog.id,
           sourceType: 3,
           isStar: newStatus
        }).then(() => {
           this.$message.success(newStatus ? '已收藏' : '已取消收藏');
        }).catch(() => {
           // Revert
           this.blog.isStared = originalStatus;
           this.blog.stared = originalCount;
           this.$message.error('操作失败');
        });
     },
     
     // Carousel
     onCarouselChange(index) {
        this.currentImageIndex = index;
     },
     onImageLoad(e) {
        // Auto adjust height based on image ratio
        const img = e.target;
        const ratio = img.naturalHeight / img.naturalWidth;
        const width = window.innerWidth;
        const height = Math.min(width * ratio, window.innerHeight * 0.7);
        this.carouselHeight = height + 'px';
     },
     
     // Touch swipe handlers
     onTouchStart(e) {
        this.touchStartX = e.touches[0].clientX;
     },
     onTouchMove(e) {
        this.touchEndX = e.touches[0].clientX;
     },
     onTouchEnd() {
        const diff = this.touchStartX - this.touchEndX;
        const threshold = 50; // 最小滑动距离
        
        if (Math.abs(diff) > threshold) {
           if (diff > 0) {
              // 向左滑动，下一张
              this.$refs.imageCarousel?.next();
           } else {
              // 向右滑动，上一张
              this.$refs.imageCarousel?.prev();
           }
        }
        
        // 重置
        this.touchStartX = 0;
        this.touchEndX = 0;
     },
     goToImage(index) {
        this.$refs.imageCarousel?.setActiveItem(index);
     },
      handleSticky() {
          this.showMenu = false;
          if (this.blog.id) {
             const newStatus = !this.blog.pin;
             pinBlog({ id: this.blog.id, pin: newStatus }).then(() => {
                this.blog.pin = newStatus;
                this.$message.success(newStatus ? '置顶成功' : '取消置顶成功');
             });
          }
      },
      handleEdit() {
          this.showMenu = false;
          this.$router.push({ path: '/blog/edit', query: { id: this.blog.id } });
      },
      handleDelete() {
          this.showMenu = false;
          this.showDeleteDialog = true;
      },
      confirmDelete() {
         deleteBlog(this.blog.id).then(() => {
            this.$message.success('删除成功');
            this.$router.push('/user/info');
         }).catch(() => {
            this.$message.error('删除失败');
         });
      },
      goHome() {
          this.showMenu = false;
          this.$router.push('/');
      }
  }
}
</script>

<style scoped>
/* Page Layout */
.blog-detail-page { 
  height: 100vh; 
  display: flex; 
  flex-direction: column; 
  background: white; 
}

/* Fixed Top Bar */
.fixed-top-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 50px;
  background: white;
  display: flex;
  align-items: center;
  padding: 0 12px;
  z-index: 100;
  border-bottom: 1px solid #f0f0f0;
}
.top-back-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #333;
  cursor: pointer;
}
.top-user-section {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  margin-left: 8px;
}
.top-user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}
.top-user-info {
  display: flex;
  flex-direction: column;
}
.top-user-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}
.top-user-tag {
  font-size: 10px;
  color: #999;
  display: flex;
  align-items: center;
  gap: 4px;
}
.top-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.top-follow-btn {
  padding: 5px 14px;
  border-radius: 16px;
  font-size: 12px;
  border: 1px solid #ff2442;
  background: #ff2442;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}
.top-follow-btn.followed {
  background: white;
  color: #999;
  border-color: #ddd;
}
/* Scroll Container */
.scroll-container {
  flex: 1;
  overflow-y: auto;
  margin-top: 50px;
  padding-bottom: 70px;
}
.content-wrapper {
  min-height: 100%;
}

/* ============ Immersive Swiper ============ */
.immersive-swiper {
  position: relative;
  width: 100%;
  background: #f5f5f5;
}
.swiper-container {
  width: 100%;
  padding-top: 100%; /* 1:1 Aspect Ratio */
  position: relative;
}
.swiper-container .el-carousel {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}
.swiper-slide-inner {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
}
.swiper-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
}
.image-counter {
  position: absolute;
  right: 12px;
  bottom: 12px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 12px;
  z-index: 10;
  font-weight: 500;
}

/* No Image Placeholder */
/* No Image Placeholder */
.no-image-placeholder {
  width: 100%;
  padding-top: 100%; /* 1:1 比例 */
  position: relative;
  background: #f5f5f5;
}
.placeholder-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* ============ Blog Content Section ============ */
.blog-content-section {
  padding: 16px 15px 20px;
  background: white;
}
.blog-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px 0;
  line-height: 1.4;
}
.blog-text {
  font-size: 15px;
  color: #666;
  line-height: 1.6;
  word-break: break-word;
}
.blog-meta {
  margin-top: 20px;
  font-size: 12px;
  color: #999;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* ============ POI Card (Shop) ============ */
.poi-card {
  margin: 12px 15px;
  padding: 12px;
  background: white;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}
.poi-card:active {
  transform: scale(0.98);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.poi-thumbnail {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  background: #eee;
}
.poi-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.poi-info {
  flex: 1;
  min-width: 0;
}
.poi-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}
.poi-rating {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 2px;
}
.star-icons {
  display: flex;
  gap: 1px;
}
.star-icons i {
  font-size: 12px;
  color: #ffb800;
}
.star-icons .el-icon-star-off {
  color: #ddd;
}
.rating-score {
  font-size: 12px;
  color: #ff6633;
  font-weight: 600;
}
.poi-price {
  font-size: 12px;
  color: #999;
}
.poi-arrow {
  color: #ccc;
  font-size: 16px;
  flex-shrink: 0;
}

/* Like Section */
.like-section {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  gap: 12px;
  background: white;
}
.like-icon-btn {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.like-avatars {
  display: flex;
  align-items: center;
  gap: 0;
  flex-wrap: wrap;
}
.like-avatar-item {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  overflow: hidden;
  margin-left: -6px;
  border: 2px solid white;
  cursor: pointer;
}
.like-avatar-item:first-child {
  margin-left: 0;
}
.like-avatar-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.like-count-text {
  font-size: 13px;
  color: #666;
  margin-left: 8px;
}

/* Section Line */
.section-line {
  height: 1px;
  background: #f0f0f0;
  margin: 12px 15px;
}

/* Comments Section */
.comments-section {
  padding: 15px;
  background: white;
}
.comments-header {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 15px;
}
.view-all-btn {
  text-align: center;
  padding: 15px 0;
  color: #666;
  font-size: 14px;
  border-top: 1px solid #f5f5f5;
  cursor: pointer;
  margin-top: 10px;
}
.no-comments {
  text-align: center;
  padding: 30px;
  color: #999;
  font-size: 14px;
}

/* Fixed Bottom Bar */
.fixed-bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: white;
  border-top: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  padding: 0 12px;
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 100;
  gap: 12px;
}
.bottom-comment-input {
  flex: 1;
  height: 36px;
  background: #f5f5f5;
  border-radius: 18px;
  display: flex;
  align-items: center;
  padding: 0 15px;
  gap: 8px;
  color: #999;
  font-size: 14px;
  cursor: pointer;
}
.bottom-comment-input i {
  font-size: 16px;
}
.bottom-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}
.bottom-action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}
.bottom-action-item i {
  font-size: 22px;
  color: #333;
}
.bottom-action-item i.active {
  color: #ff2442;
}
.bottom-action-item span {
  font-size: 10px;
  color: #666;
  margin-top: 2px;
}

/* Like Icon SVG */
.like-icon {
  display: block;
}
.like-icon-small {
  display: block;
  flex-shrink: 0;
}

/* AI Comment Styles */
.ai-generated-comment {
  background: linear-gradient(135deg, #f8fbff 0%, #f0f7ff 100%);
  border: 1px solid #e1eeff;
  border-radius: 12px;
  margin: 12px 0;
  padding: 16px;
  position: relative;
}
.ai-generated-badge {
  position: absolute;
  top: 12px;
  right: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 10px;
  padding: 4px 8px;
  border-radius: 10px;
  font-weight: 600;
}
.ai-comment-icon {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-right: 10px;
  float: left;
}
.ai-comment-info {
  overflow: hidden;
}
.ai-verified {
  color: #667eea;
  font-size: 12px;
  background: rgba(102, 126, 234, 0.1);
  padding: 2px 6px;
  border-radius: 8px;
  margin-left: 5px;
}
.ai-highlight {
  color: #667eea;
  font-weight: 600;
  font-size: 12px;
}

/* Comment Pop Modal */
.comment-pop-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
}
.comment-pop-box {
  background: white;
  width: 100%;
  border-radius: 16px 16px 0 0;
  padding: 20px;
  max-height: 80vh;
  overflow-y: auto;
  box-sizing: border-box;
}
.pop-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.pop-title {
  font-size: 14px;
  color: #666;
}
.pop-close {
  font-size: 20px;
  color: #999;
  cursor: pointer;
  padding: 5px;
}
.pop-textarea textarea {
  width: 100%;
  border: none;
  outline: none;
  resize: none;
  font-size: 16px;
  line-height: 1.6;
  min-height: 80px;
  padding: 0;
}
.pop-textarea textarea::placeholder {
  color: #ccc;
}
.pop-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 10px 0;
}
.pop-image-item {
  width: 60px;
  height: 60px;
  position: relative;
}
.pop-image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 6px;
}
.pop-image-item i {
  position: absolute;
  top: -4px;
  right: -4px;
  background: rgba(0,0,0,0.6);
  color: white;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  cursor: pointer;
}
.pop-image-add {
  width: 60px;
  height: 60px;
  border: 1px dashed #ddd;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ccc;
  font-size: 18px;
  cursor: pointer;
}
.pop-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0 0 0;
  margin-top: 10px;
  border-top: 1px solid #f0f0f0;
}
.pop-toolbar-left {
  display: flex;
  align-items: center;
  gap: 20px;
}
.pic-icon {
  cursor: pointer;
  flex-shrink: 0;
  display: block;
  width: 24px;
  height: 24px;
}
.pic-icon:hover path {
  fill: #ff6633;
}

.emoji-toggle.active {
  color: #ff2442;
}

.emoji-panel {
  margin-top: 10px;
  background: #f7f8fa;
  border: 1px solid #eceef2;
  border-radius: 12px;
  padding: 10px;
  max-height: 220px;
  overflow-y: auto;
}

.emoji-panel .emoji-grid {
  grid-template-columns: repeat(8, minmax(0, 1fr)) !important;
  gap: 10px !important;
}

.emoji-panel .emoji-item {
  font-size: 24px;
  line-height: 1;
  padding: 4px 0;
}

.emoji-panel .emoji-item:active {
  transform: scale(1.12);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 100px 0;
  color: #999;
}
.empty-state i {
  font-size: 60px;
  margin-bottom: 20px;
  color: #ddd;
}

/* More Menu Popover */
.more-menu-popover {
    padding: 0 !important;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
}
.more-menu-list {
    display: flex;
    flex-direction: column;
}
.menu-item {
    height: 44px;
    display: flex;
    align-items: center;
    padding: 0 16px;
    font-size: 14px;
    color: #333;
    cursor: pointer;
    transition: background 0.2s;
}
.menu-item:hover {
    background: #f5f5f5;
}
.menu-item i {
    margin-right: 8px;
    font-size: 16px;
}
.menu-item.delete {
    color: #ff2442;
}
.top-more-icon {
    font-size: 20px;
    color: #333;
    cursor: pointer;
    margin-left: 12px;
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

/* Custom Delete Dialog Styles */
.delete-dialog-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px 20px 10px;
  gap: 12px;
}
.delete-dialog-text {
  font-size: 15px;
  color: #666;
  text-align: center;
  margin-top: 8px;
}
:deep(.custom-delete-dialog .van-dialog__header) {
  padding-top: 20px;
  font-weight: 600;
}

/* Status Badges */
.title-with-status {
   display: flex;
   align-items: center;
   flex-wrap: wrap;
   gap: 8px;
   margin-bottom: 8px;
}
.title-with-status .blog-title {
   margin-bottom: 0;
}
.detail-status-tag {
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 11px;
    color: #fff;
    font-weight: 500;
    line-height: 1.2;
}
.status-pending {
    background: rgba(255, 153, 0, 0.85);
}
.status-rejected {
    background: rgba(255, 36, 66, 0.85);
}
</style>
