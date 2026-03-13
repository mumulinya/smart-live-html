<template>
  <div class="system-notice-page">
        <div class="header">
      <div class="header-side header-left">
        <div class="header-back-btn" @click="goBack"><i class="el-icon-arrow-left"></i></div>
      </div>
      <div class="header-title">系统消息</div>
      <div class="header-side header-right-box">
        <div class="header-right" @click="markAllRead" :class="{ disabled: unreadCount === 0 }">全部已读</div>
      </div>
    </div>

    <div ref="noticeList" class="notice-list">
      <div class="notice-item" v-for="item in notices" :key="item.noticeId">
        <div class="notice-time">{{ formatTime(item.createdAt) }}</div>
        <div class="notice-card" @click="openNotice(item)">
          <div class="notice-title-row">
            <div class="notice-title">{{ item.title }}</div>
            <span class="notice-status" v-if="!item.read">未读</span>
          </div>

          <div class="notice-content" v-if="item.content && !item.reviewView && !item.noteView">
            {{ item.content }}
          </div>

          <div class="notice-reason" v-if="false"></div>

          <div class="notice-reason notice-reason--filtered" v-if="getNoticeRejectReason(item)">驳回原因：{{ getNoticeRejectReason(item) }}</div>

          <div class="voucher-brief" v-if="item.voucherView && !item.productView">
            <div class="voucher-cover" v-if="item.voucherView.cover">
              <img :src="item.voucherView.cover" alt="voucher" />
            </div>
            <div class="voucher-main">
              <div class="voucher-title">{{ item.voucherView.title }}</div>
              <div class="voucher-sub-title" v-if="item.voucherView.subTitle">{{ item.voucherView.subTitle }}</div>
              <div class="voucher-shop" v-if="item.voucherView.shopName">{{ item.voucherView.shopName }}</div>
              <div class="voucher-rule" v-if="item.voucherView.rules">{{ item.voucherView.rules }}</div>
              <div class="voucher-price-row" v-if="item.voucherView.showPriceRow">
                <span class="voucher-price-label">到手价</span>
                <span class="voucher-price-now" v-if="item.voucherView.payValue">&yen;{{ item.voucherView.payValue }}</span>
                <span class="voucher-price-origin" v-if="item.voucherView.actualValue">&yen;{{ item.voucherView.actualValue }}</span>
              </div>
              <div class="voucher-tags">
                <span class="voucher-tag" v-if="item.voucherView.validity">{{ item.voucherView.validity }}</span>
                <span class="voucher-tag" v-if="item.voucherView.stock">{{ item.voucherView.stock }}</span>
                <span class="voucher-tag" v-if="item.voucherView.period">{{ item.voucherView.period }}</span>
              </div>
            </div>
          </div>

          <div class="product-brief" v-if="item.productView" @click.stop="openNotice(item)">
            <DealCard 
              :item="item.productView.data" 
              :biz="item.productView.biz"
              :isSeckill="item.productView.isSeckill"
            />
          </div>

          <div class="order-brief" v-if="item.orderView" @click.stop="openNotice(item)">
            <div class="order-main">
              <div class="order-cover" v-if="item.orderView.cover">
                <img :src="item.orderView.cover" alt="order" />
              </div>
              <div class="order-info">
                <div class="order-title">{{ item.orderView.title }}</div>
                <div class="order-id">订单号：{{ item.orderView.orderId }}</div>
                <div class="order-expire" v-if="item.orderView.expireTime">到期时间：{{ item.orderView.expireTime }}</div>
                <div class="order-action">
                  <span>立即使用</span>
                  <i class="el-icon-arrow-right"></i>
                </div>
              </div>
            </div>
          </div>


          <div class="review-brief" v-if="item.reviewView">
            <div class="review-score-main" v-if="item.reviewView.showScore">{{ item.reviewView.scoreText }}</div>
            <div class="review-content" v-if="item.reviewView.content">
              {{ item.reviewView.contentLabel }}：“{{ item.reviewView.content }}”
            </div>

            <div class="review-images" v-if="item.reviewView.images.length">
              <img
                v-for="(img, idx) in item.reviewView.images"
                :key="`${item.noticeId}-review-${idx}`"
                :src="img"
                alt="review"
                class="review-image"
                @click.stop="previewReviewImages(item.reviewView.images, idx)"
              />
            </div>

            <div class="review-divider" v-if="item.reviewView.targetPath || item.reviewView.targetTitle"></div>
            <div
              class="review-target-row"
              v-if="item.reviewView.targetPath || item.reviewView.targetTitle"
              @click.stop="openReviewTarget(item)"
            >
              <span class="review-target-type">{{ item.reviewView.targetTypeText }}</span>
              <span class="review-target-title">
                {{ item.reviewView.targetIcon }} {{ item.reviewView.targetTitle || '查看关联目标' }}
              </span>
              <i class="el-icon-arrow-right" v-if="item.reviewView.targetPath"></i>
            </div>
          </div>

          <div class="note-brief" v-if="item.noteView">
            <div class="note-title">{{ item.noteView.title }}</div>
            <div class="note-content" v-if="item.noteView.content">
              内容：“{{ item.noteView.content }}”
            </div>
            <div class="note-images" v-if="item.noteView.images.length">
              <img
                v-for="(img, idx) in item.noteView.images"
                :key="`${item.noticeId}-note-${idx}`"
                :src="img"
                alt="note"
                class="note-image"
                @click.stop="previewReviewImages(item.noteView.images, idx)"
              />
            </div>
            <div class="note-divider" v-if="item.noteView.targetPath"></div>
            <div class="note-target-row" v-if="item.noteView.targetPath" @click.stop="openNoteTarget(item)">
              <span class="note-target-text">📎 查看关联目标</span>
              <i class="el-icon-arrow-right"></i>
            </div>
          </div>

          <div class="notice-footer" v-if="resolvePath(item) && !item.reviewView && !item.noteView">
            <span>查看详情</span>
            <i class="el-icon-arrow-right"></i>
          </div>
        </div>
      </div>

      <div v-if="notices.length === 0" class="empty-state">
        <i class="el-icon-bell"></i>
        <div>暂无系统通知</div>
      </div>
    </div>
  </div>
</template>

<script>
import { showImagePreview } from 'vant';
import DealCard from '@/components/DealCard.vue';
import { wsManager } from '@/utils/websocket';
import { chatStore } from '@/store/chat';
import {
  getSystemNoticeList,
  readAllSystemNotices,
  readSystemNotice,
  resolveSystemNoticeList
} from '@/api/systemNotice';
import {
  addSystemNotice,
  buildSystemNoticePath,
  formatSystemNoticeTime,
  getSystemNotices,
  getSystemUnreadCount,
  replaceSystemNotices,
  markAllSystemNoticesRead,
  markSystemNoticeRead
} from '@/utils/systemNotice';
import { getRejectReasonText } from '@/utils/contentStatus';

export default {
  name: 'SystemNotice',
  components: {
    DealCard
  },
  data() {
    return {
      notices: [],
      initialScrollToLatestDone: false
    };
  },
  computed: {
    unreadCount() {
      return this.notices.reduce((count, item) => count + (item.read ? 0 : 1), 0);
    }
  },
  created() {
    this.loadNotices();
    this.bindWebSocket();
  },
  mounted() {
    this.resetViewportScroll();
  },
  beforeUnmount() {
    wsManager.unregisterCallback('system-notice-page');
  },
  methods: {
    getNoticeRejectReason(item) {
      return getRejectReasonText(item?.auditStatus, item?.rejectReason);
    },
    bindWebSocket() {
      wsManager.registerCallback('system-notice-page', (message) => {
        if (message.type !== 'SYSTEM_MESSAGE' || !message.data) return;
        addSystemNotice(message.data, { defaultRead: false });
        this.refreshLocalState();
      });
    },
    refreshLocalState(options = {}) {
      const list = [...getSystemNotices()].reverse();
      this.notices = list.map((item) => ({
        ...item,
        voucherView: this.buildVoucherView(item),
        productView: this.buildProductView(item),
        orderView: this.buildOrderView(item),
        reviewView: this.buildReviewView(item),
        noteView: this.buildNoteView(item)
      }));
      chatStore.setSystemUnread(getSystemUnreadCount());
      if (options.scrollToLatest && !this.initialScrollToLatestDone) {
        this.scrollToLatest();
      }
    },
    async loadNotices() {
      try {
        const res = await getSystemNoticeList(1);
        const list = resolveSystemNoticeList(res);
        replaceSystemNotices(list);
      } catch (error) {
        console.error('鍔犺浇绯荤粺娑堟伅澶辫触锛屼娇鐢ㄦ湰鍦扮紦瀛樺厹搴?', error);
      }
      this.refreshLocalState({ scrollToLatest: true });
    },
    scrollToLatest() {
      this.$nextTick(() => {
        const listEl = this.$refs.noticeList;
        if (!listEl) return;
        listEl.scrollTop = listEl.scrollHeight;
        this.initialScrollToLatestDone = true;
        this.resetViewportScroll();
      });
    },
    resetViewportScroll() {
      if (typeof window === 'undefined' || typeof document === 'undefined') return;
      this.$nextTick(() => {
        const root = document.scrollingElement || document.documentElement || document.body;
        if (root) root.scrollTop = 0;
        window.scrollTo(0, 0);
      });
    },
    goBack() {
      this.$router.go(-1);
    },
    formatTime(value) {
      return formatSystemNoticeTime(value);
    },
    resolvePath(item) {
      return buildSystemNoticePath(item);
    },
    resolveSourceTargetPath(item) {
      const extra = item?.extraData && typeof item.extraData === 'object' ? item.extraData : {};
      const rawSourceType =
        extra?.sourceType ??
        extra?.source_type ??
        item?.sourceType ??
        item?.source_type ??
        0;
      let sourceType = Number(rawSourceType);
      if (!Number.isFinite(sourceType)) {
        const typeText = String(rawSourceType || '').toLowerCase();
        if (typeText === 'blog') sourceType = 3;
        else if (typeText === 'voucher') sourceType = 4;
        else if (typeText === 'shop') sourceType = 2;
        else if (typeText === 'review') sourceType = 7;
        else if (typeText === 'comment') sourceType = 5;
      }

      const sourceId = [
        extra?.sourceId,
        extra?.source_id,
        extra?.targetId,
        extra?.target_id,
        extra?.blogId,
        extra?.blog_id,
        extra?.shopId,
        extra?.shop_id,
        extra?.voucherId,
        extra?.voucher_id,
        item?.sourceId,
        item?.source_id,
        item?.targetId,
        item?.target_id
      ].find((value) => this.hasNoticeValue(value));

      if (!this.hasNoticeValue(sourceId)) return '';
      const id = String(sourceId);

      if (sourceType === 3) return `/blog/detail?id=${id}`;
      if (sourceType === 4) return `/product/detail?id=${id}`;
      if (sourceType === 2) return `/shop/detail?id=${id}`;
      if (sourceType === 7) return `/review/detail?id=${id}`;
      if (sourceType === 5) return `/comment/list?id=${id}&type=5`;
      return '';
    },
    resolveNoticeOpenPath(item) {
      if (item?.productView?.targetPath) return item.productView.targetPath;
      if (item?.orderView?.targetPath) return item.orderView.targetPath;
      if (item?.reviewView?.targetPath) return item.reviewView.targetPath;
      if (item?.noteView?.targetPath) return item.noteView.targetPath;
      const sourcePath = this.resolveSourceTargetPath(item);
      if (sourcePath) return sourcePath;
      return this.resolvePath(item);
    },
    hasNoticeValue(value) {
      if (value === undefined || value === null) return false;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'object') return Object.keys(value).length > 0;
      if (typeof value === 'string') return value.trim() !== '';
      return true;
    },
    hasPositiveNumber(value) {
      const num = Number(value);
      return Number.isFinite(num) && num > 0;
    },
    buildVoucherView(item) {
      const extra = item?.extraData;
      if (!extra || typeof extra !== 'object') return null;

      const isOrderExpire = extra.action === 'order_expire' || (item.title && (item.title.includes('订单过期') || item.title.includes('订单提醒')));
      if (isOrderExpire) return null;

      const sourceType = Number(item.sourceType || 0);
      const extraSourceType = Number(extra.sourceType || 0);
      const hasPrice = this.hasPositiveNumber(extra.price) || this.hasPositiveNumber(extra.payValue) || this.hasPositiveNumber(extra.originalPrice) || this.hasPositiveNumber(extra.actualValue);
      const hasValidity =
        this.hasPositiveNumber(extra.validityType) ||
        this.hasPositiveNumber(extra.validDays) ||
        this.hasNoticeValue(extra.useStartTime) ||
        this.hasNoticeValue(extra.useEndTime) ||
        this.hasNoticeValue(extra.beginTime) ||
        this.hasNoticeValue(extra.endTime);
      const hasVoucherIdentity = this.hasPositiveNumber(extra.voucherId) || extraSourceType === 4;
      const hasVoucherMeta =
        this.hasNoticeValue(extra.shopImages) ||
        this.hasNoticeValue(extra.subTitle) ||
        this.hasNoticeValue(extra.rules) ||
        this.hasNoticeValue(extra.shopName);
      const isVoucherSource = sourceType === 4 || extraSourceType === 4;

      if (!isVoucherSource && !hasVoucherIdentity && !(hasPrice || hasValidity) && !hasVoucherMeta) return null;

      return {
        title: extra.title ? String(extra.title) : item.title || '',
        subTitle: extra.subTitle ? String(extra.subTitle) : '',
        shopName: extra.shopName ? String(extra.shopName) : '',
        rules: extra.rules ? String(extra.rules) : '',
        payValue: this.formatVoucherAmount(extra.price || extra.payValue),
        actualValue: this.formatVoucherAmount(extra.originalPrice || extra.actualValue),
        showPriceRow: hasPrice,
        validity: this.formatVoucherValidity(extra),
        stock: this.formatVoucherStock(extra.stock),
        period: this.formatVoucherPeriod(extra.beginTime, extra.endTime),
        cover: this.resolveVoucherCover(extra.shopImages)
      };
    },
    buildNoteView(item) {
      const sourceType = Number(item?.sourceType || 0);
      if (sourceType !== 3) return null;

      const extra = item?.extraData && typeof item.extraData === 'object' ? item.extraData : {};
      const title =
        extra.targetTitle ??
        item.targetTitle ??
        extra.title ??
        extra.sourceName ??
        item.sourceName ??
        item.title ??
        '';
      const content = extra.content ?? item.content ?? '';
      const images = this.resolveNoticeImages(extra.images || item.images || extra.targetImages, 9);
      const targetId =
        extra.targetId ??
        item.targetId ??
        extra.targetSourceId ??
        item.targetSourceId ??
        item.sourceId ??
        extra.sourceId ??
        extra.id ??
        null;
      const targetPath = this.hasNoticeValue(targetId)
        ? `/blog/detail?id=${targetId}`
        : (this.resolvePath(item) || '');

      if (!title && !content && images.length === 0) return null;

      return {
        title: String(title || '鏌ョ湅绗旇'),
        content: content ? String(content) : '',
        images,
        targetPath
      };
    },
    buildProductView(item) {
      const extra = item?.extraData;
      if (!extra || typeof extra !== 'object') return null;

      const isProductNew = item.title && (item.title.includes('商品上新') || item.title.includes('新品推荐') || item.title.includes('商品新品'));
      const isActionNew =
        extra.action === 'new' ||
        extra.action === 'shop_new' ||
        extra.subType === 'new' ||
        extra.subType === 'shop_new' ||
        extra.dataType === 'shop_new' ||
        item.action === 'shop_new';

      if (!isProductNew && !isActionNew) return null;

      const title =
        extra.name ||
        item.name ||
        extra.title ||
        item.title ||
        extra.content ||
        item.content;
      const price = extra.price ?? extra.payValue ?? extra.score ?? item.score ?? 0;
      const originalPrice = extra.originalPrice ?? extra.actualValue ?? 0;
      const coverImg = this.resolveVoucherCover(
        extra.coverImg ||
          extra.cover ||
          extra.shopImages ||
          extra.images ||
          item.coverImg ||
          item.cover ||
          item.images
      );
      
      const dealItem = {
        title,
        price,
        originalPrice,
        coverImg,
        sold: extra.sold ?? 0,
        stock: extra.stock ?? 0,
        validDate:
          extra.validDate ||
          (extra.useStartTime || extra.useEndTime || extra.validDays || extra.validityType ? '' : '新品上架'),
        validityType: extra.validityType ?? extra.validity_type,
        useStartTime: extra.useStartTime ?? extra.use_start_time,
        useEndTime: extra.useEndTime ?? extra.use_end_time,
        validDays: extra.validDays ?? extra.valid_days,
        status: 'active',
        discount: extra.discount,
        beginTime: extra.beginTime,
        endTime: extra.endTime,
        activityType: extra.activityType
      };

      const isGroup = extra.category === 2 || extra.productType === 2 || extra.type === 2;
      const isSeckill = extra.activityType === 1;
      
      const productId = [
        extra.productId,
        extra.product_id,
        extra.voucherId,
        extra.voucher_id,
        item.voucherId,
        extra.targetId,
        extra.target_id,
        item.targetId,
        item.target_id,
        extra.id,
        item.id
      ].find(v => this.hasNoticeValue(v));

      const targetPath = productId ? `/product/detail?id=${productId}` : '';

      return {
        data: dealItem,
        biz: isGroup ? 'group' : 'voucher', // use voucher style for products by default
        isSeckill,
        targetPath
      };
    },
    buildOrderView(item) {
      const extra = item?.extraData;
      if (!extra || typeof extra !== 'object') return null;

      const isOrderExpire = extra.action === 'order_expire' || (item.title && (item.title.includes('订单过期') || item.title.includes('订单提醒')));
      if (!isOrderExpire) return null;

      const orderId = extra.id || extra.orderId || item.sourceId;
      const title = extra.title || '订单商品';
      const expireTime = extra.expireTime ? this.formatVoucherDate(extra.expireTime) : '';
      const cover = this.resolveVoucherCover(extra.coverImg || extra.images);

      return {
        orderId,
        title,
        expireTime,
        cover,
        targetPath: orderId ? `/order/detail?id=${orderId}` : ''
      };
    },
    buildReviewView(item) {
      if (this.buildProductView(item)) return null;
      
      const extra = item?.extraData;
      if (!extra || typeof extra !== 'object') return null;

      const sourceType = Number(item.sourceType || 0);
      if (sourceType === 3) return null;
      const hasReviewField =
        this.hasNoticeValue(extra.score) ||
        this.hasNoticeValue(extra.tasteScore) ||
        this.hasNoticeValue(extra.envScore) ||
        this.hasNoticeValue(extra.serviceScore) ||
        this.hasNoticeValue(extra.content) ||
        this.hasNoticeValue(extra.images);

      if (sourceType !== 7 && sourceType !== 5 && !hasReviewField) return null;

      const targetType = Number(
        extra.targetSourceType ??
          extra.targetType ??
          item.targetSourceType ??
          item.targetType ??
          extra.sourceType ??
          (sourceType === 5 ? 5 : 0)
      );
      const targetId = this.resolveReviewTargetId(targetType, item, extra);
      const targetTitle = extra.targetTitle ?? item.targetTitle ?? extra.sourceName ?? item.sourceName ?? '';
      const reviewContent = extra.content ?? item.content ?? '';
      const reviewImages = this.resolveNoticeImages(extra.images || item.images, 9);

      const overall = this.formatReviewScore(extra.score ?? item.score);
      const isCommentNotice = sourceType === 5 || [3, 5, 7].includes(targetType);
      const showScore = !isCommentNotice && Boolean(overall);
      const targetPath = this.buildReviewTargetPath(targetType, targetId, item, extra) || this.resolvePath(item);

      return {
        showScore,
        scoreText: showScore ? `总体评分：⭐ (${overall})` : '',
        contentLabel: isCommentNotice ? '评论内容' : '评价内容',
        content: reviewContent ? String(reviewContent) : '',
        images: reviewImages,
        targetType,
        targetTitle: targetTitle ? String(targetTitle) : '',
        targetTypeText: this.formatReviewTargetType(targetType),
        targetIcon: this.formatReviewTargetIcon(targetType),
        targetPath
      };
    },
    formatReviewTargetType(targetType) {
      if (targetType === 2) return '关联店铺';
      if (targetType === 4) return '关联商品';
      if (targetType === 3) return '博客评论';
      if (targetType === 7) return '评价评论';
      if (targetType === 5) return '回复评论';
      return '关联目标';
    },
    formatReviewTargetIcon(targetType) {
      if (targetType === 2) return '🏠';
      if (targetType === 4) return '🎫';
      if (targetType === 3) return '📝';
      if (targetType === 7) return '⭐';
      if (targetType === 5) return '💬';
      return '🔗';
    },
    buildReviewTargetPath(targetType, targetId, item, extra) {
      if (!this.hasNoticeValue(targetId) && targetType !== 5) return '';
      const id = this.hasNoticeValue(targetId) ? String(targetId) : '';
      if (targetType === 2) return `/shop/detail?id=${id}`;
      if (targetType === 4) return `/product/detail?id=${id}`;
      if (targetType === 3) return `/blog/detail?id=${id}`;
      if (targetType === 7) return `/comment/list?id=${id}&type=7`;
      if (targetType === 5) {
        const replyPath = this.buildReplyCommentTargetPath(item, extra, targetId);
        if (replyPath) return replyPath;
        return this.hasNoticeValue(targetId) ? `/comment/list?id=${id}&type=5` : '';
      }
      return '';
    },
    buildReplyCommentTargetPath(item, extra, replyIdCandidate) {
      const pick = (...values) => values.find((value) => this.hasNoticeValue(value));
      const pickBaseType = (...values) => {
        for (const value of values) {
          const num = Number(value);
          if ([2, 3, 4].includes(num)) return num;
        }
        return 0;
      };
      const baseType = pickBaseType(
        extra?.sourceType,
        extra?.source_type,
        extra?.targetSourceType,
        extra?.target_source_type,
        item?.targetSourceType,
        item?.target_source_type,
        item?.sourceType,
        item?.source_type
      );
      const baseId = pick(
        extra?.sourceId,
        extra?.source_id,
        extra?.targetSourceId,
        extra?.target_source_id,
        extra?.parentId,
        extra?.parent_id,
        item?.targetSourceId,
        item?.target_source_id,
        item?.sourceId,
        item?.source_id,
        item?.parentId,
        item?.parent_id
      );

      if (!this.hasNoticeValue(baseId) || ![2, 3, 4].includes(baseType)) return '';

      const focusReplyId = pick(
        extra?.replyId,
        extra?.reply_id,
        extra?.commentId,
        extra?.comment_id,
        item?.commentId,
        item?.comment_id,
        extra?.id,
        item?.id,
        item?.targetId,
        item?.target_id,
        extra?.targetId,
        extra?.target_id,
        replyIdCandidate
      );
      const focusCommentId = pick(
        extra?.answerId,
        extra?.answer_id,
        item?.answerId,
        item?.answer_id,
        extra?.parentCommentId,
        extra?.parent_comment_id,
        extra?.sourceCommentId,
        extra?.source_comment_id
      );
      const focusRootId = pick(extra?.rootId, extra?.root_id, extra?.topId, extra?.top_id);

      const query = [
        `id=${encodeURIComponent(String(baseId))}`,
        `type=${encodeURIComponent(String(baseType))}`
      ];
      if (this.hasNoticeValue(focusReplyId)) {
        query.push(`focusReplyId=${encodeURIComponent(String(focusReplyId))}`);
      }
      if (this.hasNoticeValue(focusCommentId)) {
        query.push(`focusCommentId=${encodeURIComponent(String(focusCommentId))}`);
      }
      if (this.hasNoticeValue(focusRootId)) {
        query.push(`focusRootId=${encodeURIComponent(String(focusRootId))}`);
      }
      return `/comment/list?${query.join('&')}`;
    },
    resolveReviewTargetId(targetType, item, extra) {
      const getFirstValid = (...values) =>
        values.find((value) => this.hasNoticeValue(value));

      // 评论审核场景下，优先跳转到被评论的目标（博客/店铺/代金券），
      // 避免 sourceId/commentId 被误用为目标 id。
      if (targetType === 3) {
        return getFirstValid(
          extra.blogId,
          item.blogId,
          extra.targetId,
          item.targetId,
          extra.targetSourceId,
          item.targetSourceId,
          extra.parentId,
          item.parentId,
          extra.sourceId,
          item.sourceId,
          extra.id,
          item.id
        ) ?? null;
      }
      if (targetType === 4) {
        return getFirstValid(
          extra.voucherId,
          item.voucherId,
          extra.targetId,
          item.targetId,
          extra.targetSourceId,
          item.targetSourceId,
          extra.parentId,
          item.parentId,
          extra.sourceId,
          item.sourceId,
          extra.id,
          item.id
        ) ?? null;
      }
      if (targetType === 2) {
        return getFirstValid(
          extra.shopId,
          item.shopId,
          extra.targetId,
          item.targetId,
          extra.targetSourceId,
          item.targetSourceId,
          extra.parentId,
          item.parentId,
          extra.sourceId,
          item.sourceId,
          extra.id,
          item.id
        ) ?? null;
      }

      return getFirstValid(
        extra.targetId,
        item.targetId,
        extra.targetSourceId,
        item.targetSourceId,
        extra.id,
        item.id,
        extra.commentId,
        item.commentId,
        extra.answerId,
        item.answerId,
        extra.sourceId,
        item.sourceId,
        extra.parentId,
        item.parentId,
        extra.shopId,
        item.shopId,
        extra.voucherId,
        item.voucherId
      ) ?? null;
    },
    formatVoucherAmount(value) {
      const num = Number(value);
      if (!Number.isFinite(num)) return '';
      if (Number.isInteger(num)) return String(num);
      return num.toFixed(2).replace(/\.?0+$/, '');
    },
    formatReviewScore(value) {
      const num = Number(value);
      if (!Number.isFinite(num)) return '';
      return num.toFixed(1);
    },
    formatVoucherDate(value) {
      if (!value) return '';
      // Handle numeric timestamps (including strings that consist only of digits)
      const isNumeric = !isNaN(value) && !isNaN(parseFloat(value));
      const dateValue = isNumeric ? Number(value) : value;
      
      const date = new Date(dateValue);
      if (Number.isNaN(date.getTime())) return '';
      const year = date.getFullYear();
      const month = `${date.getMonth() + 1}`.padStart(2, '0');
      const day = `${date.getDate()}`.padStart(2, '0');
      return `${year}.${month}.${day}`;
    },
    formatVoucherValidity(extra) {
      const validityType = Number(extra.validityType || 0);
      if (validityType === 2) {
        const days = Number(extra.validDays || 0);
        if (Number.isFinite(days) && days > 0) {
          return `领取后${days}天内可用`;
        }
      }

      const start = this.formatVoucherDate(extra.useStartTime);
      const end = this.formatVoucherDate(extra.useEndTime);
      if (start && end) return `${start} - ${end}可用`;
      if (start) return `${start}起可用`;
      if (end) return `${end}前可用`;
      return '';
    },
    formatVoucherStock(value) {
      const stock = Number(value);
      if (!Number.isFinite(stock) || stock < 0) return '';
      return `库存${stock}`;
    },
    formatVoucherPeriod(beginTime, endTime) {
      const begin = this.formatVoucherDate(beginTime);
      const end = this.formatVoucherDate(endTime);
      if (begin && end) return `上架 ${begin} - ${end}`;
      if (begin) return `上架 ${begin} 起`;
      if (end) return `上架至 ${end}`;
      return '';
    },
    resolveNoticeImageUrl(path) {
      if (!path) return '';
      const value = String(path).trim();
      if (!value) return '';
      if (/^(https?:|data:|blob:)/i.test(value)) return value;
      const prefix = this.$fileURL || '';
      if (!prefix) return value;
      return value.startsWith('/') ? `${prefix}${value}` : `${prefix}/${value}`;
    },
    resolveNoticeImages(images, limit = 9) {
      if (!images) return [];
      const list = Array.isArray(images) ? images : String(images).split(',');
      return list
        .map((item) => this.resolveNoticeImageUrl(item))
        .filter(Boolean)
        .slice(0, limit);
    },
    resolveVoucherCover(shopImages) {
      const images = this.resolveNoticeImages(shopImages, 1);
      return images.length ? images[0] : '';
    },
    previewReviewImages(images, startIndex = 0) {
      if (!Array.isArray(images) || images.length === 0) return;
      showImagePreview({
        images,
        startPosition: startIndex,
        closeable: true,
        loop: false
      });
    },
    async openReviewTarget(item) {
      const path = this.resolveNoticeOpenPath(item);
      if (!path) return;
      await this.markRead(item);
      this.$router.push(path);
    },
    async openNoteTarget(item) {
      const path = this.resolveNoticeOpenPath(item);
      if (!path) return;
      await this.markRead(item);
      this.$router.push(path);
    },
    async markRead(item) {
      if (!item || item.read) return;
      markSystemNoticeRead(item.noticeId);
      item.read = true;
      chatStore.setSystemUnread(getSystemUnreadCount());
      if (!item.noticeId) return;
      try {
        await readSystemNotice(item.noticeId);
      } catch (error) {
        console.error('鍚屾绯荤粺娑堟伅宸茶澶辫触:', error);
      }
    },
    async markAllRead() {
      if (this.unreadCount === 0) return;
      markAllSystemNoticesRead();
      this.refreshLocalState();
      try {
        await readAllSystemNotices();
      } catch (error) {
        console.error('鍚屾鍏ㄩ儴宸茶澶辫触:', error);
      }
    },
    async openNotice(item) {
      await this.markRead(item);
      const path = this.resolveNoticeOpenPath(item);
      if (path) {
        this.$router.push(path);
      }
    }
  }
};
</script>

<style scoped>
.system-notice-page {
  height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  height: 50px;
  min-height: 50px;
  background: #fff;
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr) 72px;
  align-items: center;
  padding-left: calc(8px + env(safe-area-inset-left));
  padding-right: calc(8px + env(safe-area-inset-right));
  position: relative;
  z-index: 10;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
}

.header-side {
  display: flex;
  align-items: center;
  min-width: 0;
}

.header-left {
  justify-content: flex-start;
}

.header-right-box {
  justify-content: flex-end;
}

.header-title {
  font-size: 17px;
  font-weight: 600;
  color: #333;
  line-height: 1;
  padding: 0 8px;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  max-width: 60%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
}

.header-back-btn {
  position: static;
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #333;
  cursor: pointer;
}

.header-right {
  position: static;
  width: auto;
  max-width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  font-size: 13px;
  line-height: 1.2;
  white-space: nowrap !important;
  word-break: keep-all;
  color: #576b95;
  cursor: pointer;
  padding: 0 2px 0 0;
  overflow: visible;
}

.header-right.disabled {
  color: #bbb;
  cursor: default;
}

.notice-list {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 16px 12px calc(16px + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.notice-item {
  margin-bottom: 18px;
}

.notice-time {
  text-align: center;
  font-size: 12px;
  color: #999;
  margin-bottom: 12px;
}

.notice-card {
  background: #fff;
  border-radius: 10px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
  cursor: pointer;
  overflow: hidden;
}

.notice-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.notice-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.notice-status {
  color: #ff4d4f;
  font-size: 12px;
  border: 1px solid #ffd4d4;
  background: #fff5f5;
  border-radius: 10px;
  line-height: 1;
  padding: 4px 8px;
  flex-shrink: 0;
}

.notice-content {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

.notice-reason {
  margin-top: 8px;
  padding: 8px 10px;
  font-size: 13px;
  color: #a35a00;
  background: #fff3e3;
  border-radius: 6px;
  line-height: 1.5;
}

.voucher-brief {
  margin-top: 10px;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #f3e2c9;
  background: linear-gradient(180deg, #fffaf3 0%, #fff 100%);
  display: flex;
  gap: 10px;
}

.voucher-cover {
  width: 72px;
  height: 72px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
  background: #f3f3f3;
}

.voucher-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.voucher-main {
  flex: 1;
  min-width: 0;
}

.voucher-title {
  font-size: 14px;
  color: #1f2d3d;
  font-weight: 600;
  line-height: 1.4;
}

.voucher-sub-title {
  margin-top: 2px;
  font-size: 12px;
  color: #677487;
  line-height: 1.4;
}

.voucher-shop {
  margin-top: 4px;
  font-size: 12px;
  color: #8a95a3;
  line-height: 1.4;
}

.voucher-rule {
  margin-top: 4px;
  font-size: 12px;
  color: #6b7280;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.voucher-price-row {
  margin-top: 8px;
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.voucher-price-label {
  font-size: 12px;
  color: #999;
}

.voucher-price-now {
  font-size: 18px;
  font-weight: 700;
  color: #f56c30;
  line-height: 1;
}

.voucher-price-origin {
  font-size: 12px;
  color: #b5b5b5;
  text-decoration: line-through;
}

.voucher-tags {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.voucher-tag {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  color: #8b5a24;
  background: #fff2df;
  line-height: 1.4;
}

.review-brief {
  margin-top: 10px;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #e6edf7;
  background: #f7faff;
}

.review-score-main {
  font-size: 15px;
  font-weight: 600;
  color: #2b3a55;
  line-height: 1.4;
}

.review-content {
  margin-top: 8px;
  font-size: 14px;
  color: #394a63;
  line-height: 1.6;
  word-break: break-word;
}

.review-images {
  margin-top: 8px;
  display: grid;
  grid-template-columns: repeat(3, 68px);
  gap: 8px;
}

.review-image {
  width: 68px;
  height: 68px;
  border-radius: 6px;
  object-fit: cover;
  background: #eef2f8;
  display: block;
  cursor: zoom-in;
}

.review-divider {
  margin-top: 10px;
  border-top: 1px solid #dbe5f4;
}

.review-target-row {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #2f3b52;
}

.review-target-type {
  padding: 2px 6px;
  border-radius: 999px;
  font-size: 11px;
  color: #60708a;
  background: #edf3fd;
  white-space: nowrap;
}

.review-target-title {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  font-weight: 500;
  color: #2f3b52;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.review-target-row i {
  font-size: 14px;
  color: #9aa8bd;
}

.note-brief {
  margin-top: 10px;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid #dbe6f7;
  background: #f3f7ff;
}

.note-title {
  font-size: 18px;
  font-weight: 700;
  color: #1f2d3d;
  line-height: 1.4;
}

.note-content {
  margin-top: 10px;
  font-size: 15px;
  color: #324766;
  line-height: 1.6;
  word-break: break-word;
}

.note-images {
  margin-top: 10px;
  display: grid;
  grid-template-columns: repeat(3, 82px);
  gap: 8px;
}

.note-image {
  width: 82px;
  height: 82px;
  border-radius: 6px;
  object-fit: cover;
  background: #e9eef6;
  cursor: zoom-in;
}

.note-divider {
  margin-top: 12px;
  border-top: 1px solid #d8e2f2;
}

.note-target-row {
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #2f3b52;
}

.note-target-text {
  font-size: 15px;
  color: #2f3b52;
}

.note-target-row i {
  font-size: 14px;
  color: #9aa8bd;
}

.notice-footer {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f5f5f5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #333;
}

.empty-state {
  padding: 60px 0;
  text-align: center;
  color: #999;
}

.empty-state i {
  font-size: 48px;
  margin-bottom: 10px;
  color: #ddd;
}

.order-brief {
  margin-top: 10px;
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  border: 1px solid #ebeef5;
}

.order-main {
  display: flex;
  align-items: center;
}

.order-cover {
  width: 60px;
  height: 60px;
  margin-right: 12px;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
  background-color: #f9f9f9;
}

.order-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.order-info {
  flex: 1;
  min-width: 0;
}

.order-title {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.order-id, .order-expire {
  font-size: 13px;
  color: #666;
  margin-bottom: 2px;
}

.order-action {
  margin-top: 8px;
  display: flex;
  align-items: center;
  color: #ff6600;
  font-size: 14px;
  font-weight: 500;
}

.order-action i {
  margin-left: 2px;
}
</style>
