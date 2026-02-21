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
                @click="openLikeTarget(item)"
              >
                <div class="card-head">
                  <div class="card-user">
                    <img
                      class="user-avatar"
                      :src="getLikeAvatar(item)"
                      alt=""
                      @error="handleAvatarError"
                    />
                    <div class="user-meta">
                      <div class="user-line">
                        <span class="user-name">{{ getLikeAuthorName(item) }}</span>
                        <span class="type-badge">{{ getLikeTypeLabel(item) }}</span>
                      </div>
                      <span class="time-text">{{ formatTime(getItemTime(item)) || '刚刚' }}</span>
                    </div>
                  </div>
                </div>
                <div class="card-body">
                  <div class="card-main">
                    <div class="card-target">{{ getLikeActionText(item) }}</div>
                    <div v-if="getLikeContentText(item)" class="card-title">{{ getLikeContentText(item) }}</div>
                    <div v-else-if="getLikePrimaryText(item)" class="card-title">{{ getLikePrimaryText(item) }}</div>
                    <div v-if="getLikeContentText(item) && getLikePrimaryText(item)" class="card-sub">{{ getLikePrimaryText(item) }}</div>
                    <div v-if="showStats(item)" class="card-stats">
                      <span>点赞 {{ formatCount(getLikeCount(item)) }}</span>
                      <span>评论 {{ formatCount(getCommentCount(item)) }}</span>
                    </div>
                  </div>
                  <img
                    v-if="getLikeCover(item)"
                    class="card-cover"
                    :src="getLikeCover(item)"
                    alt=""
                    @error="handleCoverError"
                  />
                </div>
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
                class="interaction-card"
                @click="openCommentTarget(item)"
              >
                <div class="card-head">
                  <div class="card-user">
                    <img
                      class="user-avatar"
                      :src="getCommentAvatar(item)"
                      alt=""
                      @error="handleAvatarError"
                    />
                    <div class="user-meta">
                      <div class="user-line">
                        <span class="user-name">{{ getCommentAuthorName(item) }}</span>
                        <span class="type-badge">{{ getCommentTypeLabel(item) }}</span>
                      </div>
                      <span class="time-text">{{ formatTime(getItemTime(item)) || '刚刚' }}</span>
                    </div>
                  </div>
                </div>
                <div class="card-body">
                  <div class="card-main">
                    <div v-if="getCommentTargetTitle(item)" class="card-target">
                      评论于：{{ getCommentTargetTitle(item) }}
                    </div>
                    <div class="card-title">{{ getCommentPrimaryText(item) }}</div>
                    <div v-if="getCommentSecondaryText(item)" class="card-sub">{{ getCommentSecondaryText(item) }}</div>
                    <div v-if="showStats(item)" class="card-stats">
                      <span>点赞 {{ formatCount(getLikeCount(item)) }}</span>
                      <span>评论 {{ formatCount(getCommentCount(item)) }}</span>
                    </div>
                  </div>
                  <img
                    v-if="getCommentCover(item)"
                    class="card-cover"
                    :src="getCommentCover(item)"
                    alt=""
                    @error="handleCoverError"
                  />
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
import { likeRecord, getUserComments } from '@/api/interaction';
import { fileURL } from '@/utils/request';
import PageLayout from '@/components/PageLayout/PageLayout.vue';

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
  return toNumber(item.sourceType ?? item.targetType ?? item.type ?? item.bizType ?? item.dataType);
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
  if (t === 4) return '商品评价';
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
  return toText(item.title || item.noteTitle || item.targetTitle || item.reviewTitle || item.shopName || item.productName);
};

const getLikeContentText = (item) => {
  const content = toText(item.content || item.noteContent || item.reviewContent || item.commentContent || item.parentContent || item.subTitle);
  if (!content) return '';
  if (content === getLikePrimaryText(item)) return '';
  return content;
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
  padding: 12px 12px 10px;
  margin-bottom: 10px;
}

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

.card-title {
  font-size: 14px;
  color: #333;
  line-height: 1.5;
  margin-bottom: 6px;
  font-weight: 600;
  word-break: break-word;
}

.card-sub,
.card-title {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
}

.card-title {
  -webkit-line-clamp: 2;
}

.card-sub {
  -webkit-line-clamp: 2;
  word-break: break-word;
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

.card-sub {
  font-size: 12px;
  color: #999;
  line-height: 1.4;
}

.card-stats {
  margin-top: 8px;
  font-size: 11px;
  color: #999;
  display: flex;
  gap: 10px;
}

.card-cover {
  width: 74px;
  height: 74px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
  background: #f2f3f5;
}

</style>

