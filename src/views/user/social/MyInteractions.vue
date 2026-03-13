<template>
  <PageLayout :loading="pageLoading" skeleton-type="list" class="my-interactions-page">
    <van-nav-bar
      title="互动记录"
      left-arrow
      fixed
      placeholder
      z-index="1001"
      @click-left="$router.back()"
      right-text="我的评价"
      @click-right="toReviews"
    />

    <van-tabs
      ref="tabsRef"
      v-model:active="activeTab"
      sticky
      :offset-top="46"
      color="#ff2442"
      :ellipsis="false"
      swipeable
      animated
    >
      <van-tab title="我赞过的" name="likes">
        <div class="inner-page">
          <div class="sub-filter">
            <button
              v-for="f in likeFilters"
              :key="f.value"
              class="filter-chip"
              :class="{ active: likeType === f.value }"
              @click="likeType = f.value"
            >
              {{ f.label }}
            </button>
          </div>

          <van-list
            v-model:loading="likeState.loading"
            :finished="likeState.finished"
            finished-text="没有更多了"
            @load="loadLikes"
          >
            <div v-if="likeState.items.length > 0">
                <div
                  v-for="(item, idx) in likeState.items"
                  :key="`like-${item.id || item.sourceId || idx}`"
                  class="interaction-card"
                  :class="{ 'comment-style-card': [5, 7, 2, 4].includes(getLikeSourceType(item)) }"
                  @click="openLikeTarget(item)"
                >
                <!-- 情况 A：如果是评论 (Type 5)，使用 Feed 流布局 -->
                <template v-if="getLikeSourceType(item) === 5">
                  <!-- 顶部：作者信息 -->
                  <div class="card-author-header">
                    <img
                      class="author-avatar-small"
                      :src="getLikeAvatar(item)"
                      alt=""
                      @error="handleAvatarError"
                    />
                    <div class="author-info-right">
                      <span class="author-name-small">{{ getLikeAuthorName(item) }}</span>
                      
                      <!-- 次层：行为与关联内容 (移到头像右侧) -->
                      <div class="card-context" @click.stop="openLikeBaseTarget(item)">
                        <span class="action-label">在 </span>
                        <span class="target-title-link">《{{ getLikeTargetTitle(item) || '未知内容' }}》</span>
                        <span class="action-label"> 下评论</span>
                      </div>
                    </div>
                  </div>

                  <!-- 内容区 (带缩进) -->
                  <div class="card-content-box indented-content">
                    <div 
                      class="content-text" 
                      :class="{ 'is-short': (getLikeContentText(item) || '').length < 8 }"
                    >
                      {{ getLikeContentText(item) || '暂无内容' }}
                    </div>
                  </div>

                  <!-- 底部：数据与时间 (带缩进) -->
                  <div class="card-footer-info indented-content">
                    <div class="stats-left" v-if="showStats(item)">
                      <span class="stat-item">
                        <van-icon name="like" color="#ff2442" />
                        {{ formatCount(getLikeCount(item)) }}
                      </span>
                      <span class="stat-item">
                        <van-icon name="comment-o" />
                        {{ formatCount(getCommentCount(item)) }}
                      </span>
                    </div>
                    <div class="date-right">
                      {{ formatTime(getItemTime(item))?.split(' ')[0] || '刚刚' }}
                    </div>
                  </div>
                </template>

                <!-- 情况 B：如果是 评价 (Type 7, 2, 4)，使用专属评价布局 -->
                <template v-else-if="[7, 2, 4].includes(getLikeSourceType(item))">
                  <!-- 顶部：作者信息与关联店铺 -->
                  <div class="card-author-header">
                    <img
                      class="author-avatar-small"
                      :src="getLikeAvatar(item)"
                      alt=""
                      @error="handleAvatarError"
                    />
                    <div class="author-info-right flex-center-y">
                      <span class="author-name-small">{{ getLikeAuthorName(item) }}</span>
                      
                      <div class="card-context rating-context" @click.stop="openLikeBaseTarget(item)">
                        <span v-if="getLikeScore(item) > 0" class="rating-stars">
                          <van-rate :model-value="getLikeScore(item)" readonly :size="10" color="#ffb800" void-icon="star" void-color="#eee" />
                        </span>
                        <span class="target-title-link shop-title-link">{{ getLikePrimaryText(item) || '未知店铺' }} <van-icon name="arrow" /></span>
                      </div>
                    </div>
                  </div>

                  <!-- 内容区 (带图或不带图，带缩进) -->
                  <div class="card-content-box indented-content review-content-box">
                    <div class="review-text-wrapper">
                      <div class="content-text review-text" :class="{ 'has-image': getLikeCover(item) }">
                        {{ getLikeContentText(item) || '暂无文字评价' }}
                      </div>
                    </div>
                    
                    <div class="review-image-wrapper" v-if="getLikeCover(item)">
                      <img class="review-thumb-image" :src="getLikeCover(item)" alt="" @error="handleCoverError" />
                    </div>
                  </div>

                  <!-- 底部：数据与时间 (带缩进) -->
                  <div class="card-footer-info indented-content">
                    <div class="stats-left" v-if="showStats(item)">
                      <span class="stat-item">
                        <van-icon name="like" color="#ff2442" />
                        {{ formatCount(getLikeCount(item)) }}
                      </span>
                      <span class="stat-item">
                        <van-icon name="comment-o" />
                        {{ formatCount(getCommentCount(item)) }}
                      </span>
                    </div>
                    <div class="date-right">
                      {{ formatTime(getItemTime(item))?.split(' ')[0] || '刚刚' }}
                    </div>
                  </div>
                </template>

                <!-- 情况 C：如果是笔记 (Type 3)，使用经典 封面+标题 布局 -->
                <template v-else>
                  <!-- 上半部分：封面图 + 标题/副标题 -->
                  <div class="card-top">
                    <img
                      v-if="getLikeCover(item)"
                      class="card-cover"
                      :src="getLikeCover(item)"
                      alt=""
                      @error="handleCoverError"
                    />
                    <div class="card-text">
                      <div v-if="getLikeContentText(item)" class="card-title">{{ getLikeContentText(item) }}</div>
                      <div v-else-if="getLikePrimaryText(item)" class="card-title">{{ getLikePrimaryText(item) }}</div>
                      <div v-if="getLikeContentText(item) && getLikePrimaryText(item)" class="card-sub">{{ getLikePrimaryText(item) }}</div>
                    </div>
                  </div>
                  <!-- 下半部分：作者信息 + 点赞/评论 -->
                  <div class="card-bottom">
                    <div class="card-author">
                      <img
                        class="author-avatar"
                        :src="getLikeAvatar(item)"
                        alt=""
                        @error="handleAvatarError"
                      />
                      <span class="author-name">{{ getLikeAuthorName(item) }}</span>
                    </div>
                    <div class="card-stats" v-if="showStats(item)">
                      <span class="stat-item"><van-icon name="like" color="#ff2442"/> {{ formatCount(getLikeCount(item)) }}</span>
                      <span class="stat-item"><van-icon name="comment-o"/> {{ formatCount(getCommentCount(item)) }}</span>
                    </div>
                  </div>
                </template>
              </div>
            </div>
            <van-empty v-else-if="!likeState.loading" description="暂无赞评记录" />
          </van-list>
        </div>
      </van-tab>

      <van-tab title="我的评论" name="comments">
        <div class="inner-page">
          <div class="sub-filter">
            <button
              v-for="f in commentFilters"
              :key="f.value"
              class="filter-chip"
              :class="{ active: commentType === f.value }"
              @click="commentType = f.value"
            >
              {{ f.label }}
            </button>
          </div>
          <van-list
            v-model:loading="commentState.loading"
            :finished="commentState.finished"
            finished-text="没有更多了"
            @load="loadComments"
          >
            <div v-if="commentState.items.length > 0">
              <div
                v-for="(item, idx) in commentState.items"
                :key="`comment-${item.id || idx}`"
                class="interaction-card comment-card"
                @click="openCommentTarget(item)"
              >
                <!-- 顶部：关联内容标题 -->
                <div class="card-head-simple">
                  <div class="target-link">
                    <span class="action-text">评论了</span>
                    <span class="target-title">《{{ getCommentTargetTitle(item) || '未知内容' }}》</span>
                  </div>
                </div>

                <!-- 时间与状态 -->
                <div class="card-time-row">
                  <span class="time-text">{{ formatTime(getItemTime(item)) || '刚刚' }}</span>
                  <div v-if="getCommentDisplayStatusMeta(item).visible" class="comment-status-pair">
                    <span :class="['biz-status-chip', getStatusToneClass(getCommentDisplayStatusMeta(item).tone)]">
                      {{ getCommentDisplayStatusMeta(item).text }}
                    </span>
                  </div>
                </div>

                <!-- 评论内容 -->
                <div class="card-body-simple">
                  <div class="comment-content">{{ getCommentPrimaryText(item) }}</div>
                  <div v-if="getCommentSecondaryText(item)" class="comment-reply-to">
                    回复: {{ getCommentSecondaryText(item) }}
                  </div>
                  <div v-if="getCommentRejectReason(item)" class="comment-reject-reason">
                    驳回原因：{{ getCommentRejectReason(item) }}
                  </div>
                </div>

                <!-- 底部操作按钮 -->
                <div class="card-actions-row" @click.stop>
                  <div class="action-left">
                    <div v-if="showStats(item)" class="card-stats-simple">
                      <span class="stat-item"><van-icon name="like-o" /> {{ formatCount(getLikeCount(item)) }}</span>
                      <span class="stat-item"><van-icon name="comment-o" /> {{ formatCount(getCommentCount(item)) }}</span>
                    </div>
                  </div>
                  <div class="action-right">
                    <van-button 
                      v-if="getCommentRejectReason(item)"
                      size="mini" 
                      plain 
                      type="default" 
                      round 
                      class="btn-action edit-btn"
                      @click="onEditComment(item)"
                    >修改</van-button>
                    <van-button 
                      size="mini" 
                      plain 
                      type="danger" 
                      round 
                      class="btn-action"
                      @click="onDeleteComment(item)"
                    >删除</van-button>
                  </div>
                </div>
              </div>
            </div>
            <van-empty v-else-if="!commentState.loading" description="暂无评论记录" />
          </van-list>
        </div>
      </van-tab>

    </van-tabs>
  </PageLayout>
</template>

<script setup>
defineOptions({
  name: 'MyInteractions'
});

import { reactive, ref, watch, onMounted, onActivated, onBeforeUnmount, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getCurrentUser } from '@/api/user';
import { likeRecord, getUserComments, removeComment } from '@/api/interaction';
import { fileURL } from '@/utils/request';
import PageLayout from '@/components/PageLayout/PageLayout.vue';
import { showToast, showConfirmDialog } from 'vant';
import {
  getAuditStatusMeta,
  getBusinessStatusMeta,
  getRejectReasonText,
  getSingleDisplayStatusMeta,
  getStatusToneClass
} from '@/utils/contentStatus';

const router = useRouter();
const route = useRoute();
const tabsRef = ref(null);
const INTERACTION_TABS = ['likes', 'comments'];
const normalizeTab = (value) => {
  const tab = Array.isArray(value) ? value[0] : value;
  return INTERACTION_TABS.includes(tab) ? tab : 'likes';
};
const activeTab = ref(normalizeTab(route.query.tab));
const pageLoading = ref(false);
const userId = ref(null);

const likeType = ref('3');
const commentType = ref('all');
const PAGE_SIZE = 10;

const likeFilters = [
  { label: '笔记', value: '3' },
  { label: '评论', value: '5' },
  { label: '评价', value: '7' }
];

const commentFilters = [
  { label: '全部', value: 'all' },
  { label: '博客评论', value: '3' },
  { label: '评价评论', value: '7' },
  { label: '回复评论', value: '5' }
];

const createListState = () => ({
  items: [],
  current: 1,
  loading: false,
  finished: false
});

const likeState = reactive(createListState());
const commentState = reactive(createListState());
const likeRequesting = ref(false);
const commentRequesting = ref(false);

const resetListState = (state) => {
  state.items = [];
  state.current = 1;
  state.loading = false;
  state.finished = false;
};

const extractList = (res) => {
  let data = res?.data ?? res ?? [];
  if (Array.isArray(data?.records)) return data.records;
  if (Array.isArray(data?.list)) return data.list;
  if (Array.isArray(data)) return data;
  return [];
};

const normalizeLikeRecord = (record) => {
  if (!record || typeof record !== 'object') return {};
  const detail = record.data && typeof record.data === 'object' && !Array.isArray(record.data) ? record.data : null;
  const merged = detail ? { ...record, ...detail } : { ...record };
  if (Array.isArray(merged.images)) {
    merged.images = merged.images.filter(Boolean).join(',');
  }
  if (!merged.icon && merged.userIcon) {
    merged.icon = merged.userIcon;
  }
  if (!merged.name) {
    merged.name = merged.nickName || merged.userName || merged.username || '';
  }
  merged.likeTime = record.likeTime || merged.likeTime || merged.createTime || '';
  return merged;
};

const toNumber = (val) => {
  const num = Number(val);
  return Number.isFinite(num) ? num : 0;
};

const toText = (val) => {
  if (val === null || val === undefined) return '';
  return String(val).trim();
};

const hasRouteId = (val) => {
  const text = toText(val);
  return text !== '' && text !== '0' && text !== 'null' && text !== 'undefined';
};

const pickRouteId = (...values) => {
  const found = values.find((val) => hasRouteId(val));
  return hasRouteId(found) ? toText(found) : '';
};

const pickFirst = (val) => {
  if (!val) return '';
  if (Array.isArray(val)) {
    return toText(val.find((x) => toText(x)));
  }
  const str = toText(val);
  if (!str) return '';
  if (str.startsWith('data:') || str.startsWith('blob:') || !str.includes(',')) {
    return str;
  }
  return toText(str.split(',').find((x) => toText(x)));
};

const toImageUrl = (val) => {
  const raw = pickFirst(val);
  if (!raw) return '';
  if (
    raw.startsWith('http://') ||
    raw.startsWith('https://') ||
    raw.startsWith('data:') ||
    raw.startsWith('blob:') ||
    raw.startsWith('/imgs/')
  ) {
    return raw;
  }
  return `${fileURL}${raw.startsWith('/') ? '' : '/'}${raw}`;
};

const getItemTime = (item) => {
  return (
    item.actionTime ||
    item.interactTime ||
    item.likeTime ||
    item.commentTime ||
    item.createTime ||
    item.create_time ||
    item.time ||
    item.updateTime ||
    ''
  );
};

const getDisplayName = (item) => {
  return toText(item.name || item.nickName || item.userName || item.username) || '匿名用户';
};

const getAvatar = (item) => {
  return toImageUrl(item.icon || item.userIcon || item.userAvatar || item.avatar) || '/imgs/icons/default-icon.png';
};

const getCover = (item) => {
  return toImageUrl(item.cover || item.images || item.image || item.shopLogo);
};

const formatCount = (val) => {
  const num = toNumber(val);
  if (num >= 10000) {
    const w = (num / 10000).toFixed(num % 10000 === 0 ? 0 : 1);
    return `${w}w`;
  }
  return `${num}`;
};

const getLikeCount = (item) => {
  return toNumber(item.liked ?? item.likeCount ?? item.likes ?? item.starCount);
};

const getCommentCount = (item) => {
  return toNumber(item.comments ?? item.commentCount ?? item.replyCount);
};

const showStats = (item) => {
  return getLikeCount(item) > 0 || getCommentCount(item) > 0;
};

const handleAvatarError = (event) => {
  if (event?.target) {
    event.target.src = '/imgs/icons/default-icon.png';
  }
};

const handleCoverError = (event) => {
  if (event?.target) {
    event.target.style.display = 'none';
  }
};

const formatTime = (val) => {
  if (!val) return '';
  const d = new Date(String(val).replace(/-/g, '/'));
  if (Number.isNaN(d.getTime())) return String(val);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day} ${h}:${min}`;
};

const refreshTabs = () => {
  const doResize = () => tabsRef.value?.resize?.();
  nextTick(() => {
    doResize();
    requestAnimationFrame(doResize);
    setTimeout(doResize, 120);
  });
};

const handleWindowResize = () => {
  refreshTabs();
};

const toReviews = () => {
  router.push('/review/mine');
};

const ensureTabLoaded = () => {
  if (activeTab.value === 'likes' && likeState.items.length === 0 && !likeState.finished) {
    loadLikes();
  }
  if (activeTab.value === 'comments' && commentState.items.length === 0 && !commentState.finished) {
    loadComments();
  }
};

const getLikeSourceType = (item) => {
  const t = toNumber(item.sourceType ?? item.targetType ?? item.type ?? item.bizType ?? item.dataType);
  if (t !== 5 && activeTab.value === 'likes' && likeType.value === '5') {
    return 5; // Force type 5 when specifically viewing liked comments
  }
  if (t !== 7 && activeTab.value === 'likes' && likeType.value === '7') {
    return 7; // Force type 7 when specifically viewing liked reviews
  }
  return t;
};

const getLikeSourceId = (item) => {
  return item.sourceId ?? item.targetId ?? item.reviewId ?? item.parentId ?? item.id;
};

const getLikeReviewId = (item) => {
  return pickRouteId(item.reviewId, item.review_id, item.id, item.sourceId, item.targetId);
};

const getLikeTypeLabel = (item) => {
  const t = getLikeSourceType(item);
  if (t === 3) return '笔记';
  if (t === 5) return '评论';
  if (t === 7) return '评价';
  if (t === 2) return '店铺评价';
  if (t === 4) return '订单评价';
  return '内容';
};

const getLikeAuthorName = (item) => {
  return getDisplayName(item);
};

const getLikeAvatar = (item) => {
  return getAvatar(item);
};

const getLikeActionText = (item) => {
  return `赞过 ${getLikeAuthorName(item)} 的${getLikeTypeLabel(item)}`;
};

const getLikeCover = (item) => {
  return getCover(item);
};

const getLikePrimaryText = (item) => {
  return toText(
    item.sourceName ||
      item.title ||
      item.noteTitle ||
      item.targetTitle ||
      item.reviewTitle ||
      item.shopName ||
      item.productName
  );
};

const getLikeTargetTitle = (item) => {
  return toText(
    item.sourceName ||
      item.targetTitle ||
      item.blogTitle ||
      item.reviewTitle ||
      item.noteTitle ||
      item.title ||
      item.shopName ||
      item.productName ||
      item.parentTitle
  );
};

const openLikeBaseTarget = (item) => {
  const targetId = item.blogId || item.targetId || item.parentId || item.sourceId || item.reviewId;
  if (!targetId) return;
  const isReview = item.reviewId || item.reviewTitle || item.baseType === 7 || item.targetSourceType === 7 || item.parentSourceType === 7;
  if (isReview) {
    router.push({ path: '/review/detail', query: { id: item.reviewId || targetId } });
  } else {
    router.push({ path: '/blog/detail', query: { id: item.blogId || item.noteId || targetId } });
  }
};

const getLikeContentText = (item) => {
  const content = toText(item.content || item.noteContent || item.reviewContent || item.commentContent || item.parentContent || item.subTitle);
  if (!content) return '';
  if (content === getLikePrimaryText(item)) return '';
  return content;
};

const getLikeScore = (item) => {
  return toNumber(item.score || item.rating || item.star || 0);
};

const openLikeTarget = (item) => {
  const sourceType = getLikeSourceType(item);
  const sourceId = getLikeSourceId(item);
  const reviewId = getLikeReviewId(item);
  if (!sourceId) return;

  if (sourceType === 3) {
    router.push({ path: '/blog/detail', query: { id: sourceId } });
    return;
  }
  if (sourceType === 7 || ((sourceType === 2 || sourceType === 4) && reviewId)) {
    router.push({ path: '/review/detail', query: { id: sourceType === 7 ? sourceId : reviewId } });
    return;
  }
  if (sourceType === 2) {
    router.push({ path: '/shop/detail', query: { id: sourceId } });
    return;
  }
  if (sourceType === 4) {
    router.push({ path: '/product/detail', query: { id: sourceId } });
    return;
  }
  if (sourceType === 5) {
    const route = buildCommentListRoute({
      ...item,
      sourceType: 5,
      commentId: item.commentId ?? item.id
    });
    if (route) {
      router.push(route);
      return;
    }
    router.push({ path: '/comment/list', query: { id: sourceId, type: 5 } });
    return;
  }
  router.push({ path: '/blog/detail', query: { id: sourceId } });
};

const getCommentSourceType = (item) => {
  return toNumber(item.sourceType ?? item.targetType ?? item.type ?? item.dataType);
};

const getCommentTypeLabel = (item) => {
  const t = getCommentSourceType(item);
  if (t === 3) return '博客评论';
  if (t === 7) return '评价评论';
  if (t === 5) return '回复评论';
  return '评论';
};

const getCommentPrimaryText = (item) => {
  return toText(item.content || item.commentContent || item.replyContent) || '暂无评论内容';
};

const getCommentTargetTitle = (item) => {
  return toText(
    item.sourceName ||
      item.targetTitle ||
      item.blogTitle ||
      item.reviewTitle ||
      item.noteTitle ||
      item.title ||
      item.shopName ||
      item.productName ||
      item.parentTitle
  );
};

const getCommentSecondaryText = (item) => {
  const text = toText(item.parentContent || item.targetContent || item.subTitle || item.extraContent);
  if (!text) return '';
  if (text === getCommentPrimaryText(item) || text === getCommentTargetTitle(item)) return '';
  return text;
};

const getCommentAuthorName = (item) => {
  return getDisplayName(item);
};

const getCommentAvatar = (item) => {
  return getAvatar(item);
};

const getCommentCover = (item) => {
  return getCover(item);
};

const getCommentBusinessStatusMeta = (item) => {
  return getBusinessStatusMeta('comment', item?.status);
};

const getCommentAuditStatusMeta = (item) => {
  return getAuditStatusMeta(item?.auditStatus);
};

const getCommentDisplayStatusMeta = (item) => {
  return getSingleDisplayStatusMeta('comment', item?.status, item?.auditStatus);
};

const getCommentRejectReason = (item) => {
  return getRejectReasonText(item?.auditStatus, item?.rejectReason);
};

const getCommentBaseType = (item) => {
  const sourceType = getCommentSourceType(item);
  if ([2, 3, 7].includes(sourceType)) return sourceType;

  const candidates = [
    item.targetSourceType,
    item.target_source_type,
    item.parentSourceType,
    item.parent_source_type,
    item.baseType,
    item.base_type,
    item.bizType
  ];
  for (const val of candidates) {
    const num = toNumber(val);
    if ([2, 3, 7].includes(num)) return num;
  }
  return 0;
};

const getCommentBaseId = (item, baseType) => {
  const sourceType = getCommentSourceType(item);
  if (sourceType === 5) {
    return pickRouteId(
      item.parentId,
      item.parent_id,
      item.targetSourceId,
      item.target_source_id,
      item.targetId,
      item.target_id,
      item.blogId,
      item.reviewId,
      item.shopId
    );
  }

  if (baseType === 7) {
    return pickRouteId(
      item.reviewId,
      item.targetId,
      item.target_id,
      item.sourceId,
      item.source_id,
      item.parentId,
      item.parent_id
    );
  }

  if (baseType === 2) {
    return pickRouteId(
      item.shopId,
      item.targetId,
      item.target_id,
      item.sourceId,
      item.source_id,
      item.parentId,
      item.parent_id
    );
  }

  return pickRouteId(
    item.blogId,
    item.targetId,
    item.target_id,
    item.sourceId,
    item.source_id,
    item.parentId,
    item.parent_id,
    item.reviewId
  );
};

const getCommentFocusQuery = (item) => {
  const sourceType = getCommentSourceType(item);
  const query = {};

  if (sourceType === 5) {
    const focusReplyId = pickRouteId(item.id, item.commentId, item.comment_id, item.sourceId, item.source_id);
    const focusCommentId = pickRouteId(
      item.answerId,
      item.answer_id,
      item.parentCommentId,
      item.parent_comment_id,
      item.rootCommentId,
      item.root_comment_id
    );
    const focusRootId = pickRouteId(item.rootId, item.root_id, item.topId, item.top_id);
    if (focusReplyId) query.focusReplyId = focusReplyId;
    if (focusCommentId) query.focusCommentId = focusCommentId;
    if (focusRootId) query.focusRootId = focusRootId;
    return query;
  }

  const focusCommentId = pickRouteId(item.id, item.commentId, item.comment_id);
  if (focusCommentId) {
    query.focusCommentId = focusCommentId;
    query.focusRootId = focusCommentId;
  }
  return query;
};

const buildCommentListRoute = (item) => {
  const sourceType = getCommentSourceType(item);
  let type = getCommentBaseType(item);
  if (!type && sourceType === 5) type = 3;
  if (![2, 3, 7].includes(type)) type = 3;

  const id = getCommentBaseId(item, type);
  if (id) {
    return {
      path: '/comment/list',
      query: {
        id: String(id),
        type: String(type),
        ...getCommentFocusQuery(item)
      }
    };
  }

  if (sourceType === 5) {
    const fallbackId = pickRouteId(item.sourceId, item.source_id, item.targetId, item.target_id, item.id);
    if (fallbackId) {
      return {
        path: '/comment/list',
        query: {
          id: String(fallbackId),
          type: '5',
          ...getCommentFocusQuery(item)
        }
      };
    }
  }

  return null;
};

const openCommentTarget = (item) => {
  const route = buildCommentListRoute(item);
  if (route) {
    router.push(route);
    return;
  }

  const sourceType = getCommentSourceType(item);
  const targetId = item.targetId ?? item.parentId ?? item.sourceId ?? item.reviewId ?? item.id;
  if (!targetId) return;

  if (sourceType === 3) {
    router.push({ path: '/blog/detail', query: { id: targetId } });
    return;
  }
  if (sourceType === 7) {
    router.push({ path: '/review/detail', query: { id: targetId } });
    return;
  }
  if (sourceType === 5) {
    router.push({ path: '/comment/list', query: { id: targetId, type: 5 } });
    return;
  }
  router.push({ path: '/comment/list', query: { id: targetId } });
};

const loadLikes = async () => {
  if (likeState.finished || likeRequesting.value) return;
  if (!userId.value) {
    likeState.loading = false;
    return;
  }
  likeRequesting.value = true;
  likeState.loading = true;
  try {
    const params = {
      userId: userId.value,
      current: likeState.current,
      size: PAGE_SIZE
    };
    if (likeType.value !== 'all') {
      params.sourceType = Number(likeType.value);
    }
    const list = extractList(await likeRecord(params));
    const normalizedList = list.map(normalizeLikeRecord);
    likeState.items.push(...normalizedList);
    if (list.length < PAGE_SIZE) {
      likeState.finished = true;
    } else {
      likeState.current += 1;
    }
  } catch (err) {
    console.error('load likes failed', err);
    likeState.finished = true;
  } finally {
    likeRequesting.value = false;
    likeState.loading = false;
    refreshTabs();
  }
};

const loadComments = async () => {
  if (commentState.finished || commentRequesting.value) return;
  if (!userId.value) {
    commentState.loading = false;
    return;
  }
  commentRequesting.value = true;
  commentState.loading = true;
  try {
    const params = {
      userId: userId.value,
      current: commentState.current,
      size: PAGE_SIZE
    };
    if (commentType.value !== 'all') {
      params.sourceType = Number(commentType.value);
    }
    const list = extractList(await getUserComments(params));
    commentState.items.push(...list);
    if (list.length < PAGE_SIZE) {
      commentState.finished = true;
    } else {
      commentState.current += 1;
    }
  } catch (err) {
    console.error('load comments failed', err);
    commentState.finished = true;
  } finally {
    commentRequesting.value = false;
    commentState.loading = false;
    refreshTabs();
  }
};

const onDeleteComment = async (item) => {
  try {
    await showConfirmDialog({
      title: '提示',
      message: '确定删除这条评论吗？',
    });
    await removeComment({ id: item.id || item.commentId });
    showToast('删除成功');
    resetListState(commentState);
    loadComments();
  } catch (err) {
    if (err && err !== 'cancel') {
      console.error('delete comment failed', err);
      showToast('删除失败');
    }
  }
};

const onEditComment = (item) => {
  // Redirect to target to edit
  openCommentTarget(item);
};

const initUser = async () => {
  pageLoading.value = true;
  try {
    const cache = localStorage.getItem('userInfo');
    if (cache) {
      const user = JSON.parse(cache);
      if (user?.id) {
        userId.value = user.id;
      }
    }

    if (!userId.value) {
      const res = await getCurrentUser();
      const user = res?.data || res;
      if (user?.id) {
        userId.value = user.id;
        localStorage.setItem('userInfo', JSON.stringify(user));
      }
    }

    if (!userId.value) {
      router.push('/user/login');
      return;
    }
    ensureTabLoaded();
  } catch (err) {
    console.error('init user failed', err);
  } finally {
    pageLoading.value = false;
    refreshTabs();
  }
};

const syncTabToRoute = (tab) => {
  const queryTab = Array.isArray(route.query.tab) ? route.query.tab[0] : route.query.tab;
  if (queryTab === tab) return;
  router
    .replace({
      query: {
        ...route.query,
        tab
      }
    })
    .catch(() => {});
};

watch(
  () => route.query.tab,
  (tabFromQuery) => {
    const nextTab = normalizeTab(tabFromQuery);
    if (nextTab !== activeTab.value) {
      activeTab.value = nextTab;
    }
  }
);

watch(activeTab, () => {
  syncTabToRoute(activeTab.value);
  ensureTabLoaded();
  refreshTabs();
});

watch(likeType, () => {
  likeRequesting.value = false;
  resetListState(likeState);
  if (activeTab.value === 'likes') {
    loadLikes();
  }
});

watch(commentType, () => {
  commentRequesting.value = false;
  resetListState(commentState);
  if (activeTab.value === 'comments') {
    loadComments();
  }
});

onMounted(() => {
  syncTabToRoute(activeTab.value);
  initUser();
  refreshTabs();
  window.addEventListener('resize', handleWindowResize);
});

onActivated(() => {
  ensureTabLoaded();
  refreshTabs();
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleWindowResize);
});
</script>

<style scoped>
.my-interactions-page {
  min-height: 100vh;
  background: #f7f8fa;
}

.inner-page {
  min-height: calc(100vh - 94px);
  padding: 10px 12px 20px;
}

.sub-filter {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.sub-filter::-webkit-scrollbar {
  display: none;
}

.filter-chip {
  border: 1px solid #eee;
  background: #fff;
  color: #666;
  font-size: 12px;
  line-height: 1;
  padding: 8px 12px;
  border-radius: 14px;
  white-space: nowrap;
  cursor: pointer;
}

.filter-chip.active {
  border-color: #ff2442;
  color: #ff2442;
  background: #fff1f4;
}

.interaction-card {
  background: #fff;
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 10px;
}

.card-top {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.card-top .card-cover {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
  background: #f2f3f5;
}

.card-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.card-title {
  font-size: 14px;
  color: #333;
  line-height: 1.5;
  font-weight: 600;
  word-break: break-word;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.card-sub {
  font-size: 12px;
  color: #999;
  line-height: 1.4;
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  word-break: break-word;
}

.card-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-author {
  display: flex;
  align-items: center;
  min-width: 0;
}

.author-avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  margin-right: 6px;
  background: #f2f3f5;
}

.author-name {
  font-size: 12px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 120px;
}

.card-stats {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  color: #999;
}

.stat-item svg {
  flex-shrink: 0;
}

/* 评论卡片新样式 */
.comment-card {
  padding: 16px;
}

.card-head-simple {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 4px;
}

.target-link {
  flex: 1;
  font-size: 13px;
  color: #666;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.action-text {
  color: #999;
}

.target-title {
  color: #576b95; /* 类似链接的颜色 */
  font-weight: 500;
}

.card-time-row {
  margin-bottom: 12px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.card-time-row .time-text {
  font-size: 11px;
  color: #ccc;
}

.comment-status-pair {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.card-body-simple {
  margin-bottom: 16px;
}

.comment-content {
  font-size: 15px;
  color: #333;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}

.comment-reply-to {
  margin-top: 8px;
  padding: 8px 10px;
  background: #f7f8fa;
  border-radius: 4px;
  font-size: 13px;
  color: #666;
  border-left: 3px solid #eee;
}

.comment-reject-reason {
  margin-top: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(245, 108, 108, 0.08);
  color: #f56c6c;
  font-size: 12px;
  line-height: 1.5;
}

.card-actions-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-stats-simple {
  display: flex;
  gap: 12px;
}

.card-stats-simple .stat-item {
  font-size: 13px;
  color: #999;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 评论专项样式 (仅在点赞列表中的评论类型展现) */
.comment-style-card {
  padding: 14px 16px !important;
}

.comment-style-card .card-author-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.comment-style-card .author-avatar-small {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 4px;
  background: #f2f3f5;
}

.comment-style-card .author-info-right {
  display: flex;
  flex-direction: column;
}

.comment-style-card .author-name-small {
  font-size: 13px;
  color: #333;
  font-weight: 500;
  margin-bottom: 2px;
}

.comment-style-card .card-context {
  font-size: 11px;
  color: #999;
  line-height: 1.4;
}

.comment-style-card .target-title-link {
  color: #576b95;
  font-weight: 500;
}

.indented-content {
  padding-left: 20px; /* 缩进与头像对齐差不多 */
}

.comment-style-card .content-text {
  font-size: 15px;
  color: #333;
  line-height: 1.6;
  word-break: break-all;
  white-space: pre-wrap;
  margin-top: 8px;
  margin-bottom: 12px;
}

.comment-style-card .card-footer-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 8px;
}

/* 评价专区样式 */
.flex-center-y {
  justify-content: center;
}

.rating-context {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
}

.rating-context .target-title-link.shop-title-link {
  color: #666; /* 降低蓝色链接突兀感，用中性灰色 */
  display: flex;
  align-items: center;
  gap: 2px;
}

.review-content-box {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.review-text-wrapper {
  flex: 1;
  min-width: 0;
}

.review-image-wrapper {
  flex-shrink: 0;
}

.review-thumb-image {
  width: 60px;
  height: 60px;
  border-radius: 6px;
  object-fit: cover;
  background: #f2f3f5;
  border: 1px solid #f0f0f0;
}

.content-text.review-text {
  -webkit-line-clamp: 3;
  line-clamp: 3;
  display: -webkit-box;
  overflow: hidden;
  text-overflow: ellipsis;
  -webkit-box-orient: vertical;
}

.comment-style-card .stats-left {
  display: flex;
  gap: 12px;
}

.comment-style-card .stats-left .stat-item {
  font-size: 12px;
  color: #bfbfbf;
}

.comment-style-card .date-right {
  font-size: 11px;
  color: #ccc;
}

.action-right {
  display: flex;
  gap: 8px;
}

.btn-action {
  height: 24px !important;
  padding: 0 12px !important;
  font-size: 12px !important;
}

.btn-action.edit-btn {
  color: #666 !important;
  border-color: #ccc !important;
}

.status-tag-mini {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;
  color: #fff;
  white-space: nowrap;
}

.status-tag-mini.status-pending {
  background: #faad14;
}

.status-tag-mini.status-rejected {
  background: #ff4d4f;
}

/* 评论 Tab 保留的旧样式 */
.card-head {
  margin-bottom: 10px;
}
.card-user {
  display: flex;
  align-items: center;
  min-width: 0;
}
.user-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  margin-right: 10px;
  background: #f2f3f5;
}
.user-meta {
  min-width: 0;
  flex: 1;
}
.user-line {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.user-name {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  color: #333;
  font-weight: 600;
}
.type-badge {
  background: #fff2f0;
  color: #ff4d4f;
  border-radius: 10px;
  padding: 2px 8px;
  font-size: 11px;
  line-height: 1.4;
}
.time-text {
  font-size: 11px;
  color: #999;
}
.card-body {
  display: flex;
  gap: 10px;
}
.card-main {
  flex: 1;
  min-width: 0;
}
.card-target {
  font-size: 12px;
  color: #7f8c9b;
  margin-bottom: 6px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.card-body .card-cover {
  width: 74px;
  height: 74px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
  background: #f2f3f5;
}

/* Status Badges */
.interaction-status-tag {
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
