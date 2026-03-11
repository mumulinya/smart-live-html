<template>
  <router-view v-slot="{ Component }">
    <keep-alive :key="cacheVersion" :include="includeViews">
      <component :is="Component" :key="componentKey" />
    </keep-alive>
  </router-view>
</template>

<script setup>
import { computed, nextTick, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const props = defineProps({
  cacheVersion: {
    type: [Number, String],
    default: 0,
  },
  baseInclude: {
    type: Array,
    default: () => [],
  },
});

const router = useRouter();
const route = useRoute();
const dynamicInclude = ref([]);
const pendingRestoreRouteName = ref('');
const scrollSnapshots = new Map();

const normalizeRouteName = (name) => {
  if (name === null || name === undefined) return '';
  return String(name);
};

const componentKey = computed(() => normalizeRouteName(route.name) || route.path || '');

const normalizeKeepAliveFor = (meta) => {
  if (!Array.isArray(meta?.keepAliveFor)) return [];
  return meta.keepAliveFor.map((item) => String(item));
};

const resolveKeepAliveViewName = (routeLike) => {
  if (routeLike?.meta?.keepAliveViewName) {
    return String(routeLike.meta.keepAliveViewName);
  }
  return normalizeRouteName(routeLike?.name);
};

const resolveScrollSelector = (routeLike, fallback = '') => {
  if (routeLike?.meta?.keepAliveScrollEl) {
    return String(routeLike.meta.keepAliveScrollEl);
  }
  return fallback || '';
};

const resolveScrollTarget = (selector = '') => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return null;
  if (!selector) return window;
  return document.querySelector(selector) || null;
};

const readScrollSnapshot = (routeLike) => {
  const selector = resolveScrollSelector(routeLike, '');
  const target = resolveScrollTarget(selector);
  if (!target) return null;

  if (target === window) {
    const top = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    const left = window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0;
    return { top, left, selector: '' };
  }

  return {
    top: Number(target.scrollTop) || 0,
    left: Number(target.scrollLeft) || 0,
    selector,
  };
};

const applyScrollSnapshot = (routeLike, snapshot) => {
  if (!snapshot) return;

  const top = Number(snapshot.top);
  const left = Number(snapshot.left);
  if (!Number.isFinite(top) || top < 0 || !Number.isFinite(left) || left < 0) return;

  const selector = resolveScrollSelector(routeLike, snapshot.selector || '');
  const target = resolveScrollTarget(selector);
  if (!target) return;

  if (target === window) {
    window.scrollTo(left, top);
    return;
  }

  target.scrollTop = top;
  target.scrollLeft = left;
};

const restoreScrollSnapshot = (routeLike, snapshot) => {
  if (!snapshot) return;

  const run = () => applyScrollSnapshot(routeLike, snapshot);

  nextTick(() => {
    run();

    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => {
        run();
        requestAnimationFrame(() => {
          run();
        });
      });
    }

    setTimeout(run, 80);
  });
};

const resolveRecordByName = (routeName) => {
  if (!routeName) return null;
  return router.getRoutes().find((record) => normalizeRouteName(record.name) === routeName) || null;
};

const resolveKeepAliveForByName = (routeName, metaFallback = null) => {
  if (!routeName) return [];
  const record = resolveRecordByName(routeName);
  if (record) {
    return normalizeKeepAliveFor(record.meta);
  }
  return normalizeKeepAliveFor(metaFallback);
};

const resolveKeepAliveViewNameByRouteName = (routeName) => {
  if (!routeName) return '';
  const record = resolveRecordByName(routeName);
  if (record) {
    return resolveKeepAliveViewName(record);
  }
  return routeName;
};

const addDynamicView = (viewName) => {
  if (!viewName) return;
  if (!dynamicInclude.value.includes(viewName)) {
    dynamicInclude.value.push(viewName);
  }
};

const removeDynamicView = (viewName) => {
  if (!viewName) return;
  dynamicInclude.value = dynamicInclude.value.filter((item) => item !== viewName);
};

const removeAncestorsForRoute = (routeName) => {
  if (!routeName) return;

  const queue = [routeName];
  const visited = new Set();

  while (queue.length > 0) {
    const childName = queue.shift();

    for (const record of router.getRoutes()) {
      const parentName = normalizeRouteName(record.name);
      if (!parentName || visited.has(parentName)) continue;

      const allowedChildren = normalizeKeepAliveFor(record.meta);
      if (!allowedChildren.includes(childName)) continue;

      visited.add(parentName);
      removeDynamicView(resolveKeepAliveViewNameByRouteName(parentName));
      scrollSnapshots.delete(parentName);
      queue.push(parentName);
    }
  }
};

const includeViews = computed(() => {
  const merged = [...props.baseInclude, ...dynamicInclude.value]
    .map((item) => String(item || '').trim())
    .filter(Boolean);
  return [...new Set(merged)];
});

const removeGuard = router.beforeEach((to, from) => {
  const fromName = normalizeRouteName(from.name);
  const toName = normalizeRouteName(to.name);
  if (!fromName || !toName) return true;

  // Same-view navigation (query/params change) should not mutate cache chain.
  if (fromName === toName) return true;

  const fromViewName = resolveKeepAliveViewName(from);
  if (!fromViewName) return true;

  const fromAllowedChildren = resolveKeepAliveForByName(fromName, from.meta);
  const toAllowedChildren = resolveKeepAliveForByName(toName, to.meta);

  const isForwardAllowed = fromAllowedChildren.includes(toName);
  const isBackToParent = toAllowedChildren.includes(fromName);

  if (isForwardAllowed) {
    addDynamicView(fromViewName);
    const snapshot = readScrollSnapshot(from);
    if (snapshot) {
      scrollSnapshots.set(fromName, snapshot);
    }
    return true;
  }

  removeDynamicView(fromViewName);

  if (isBackToParent) {
    pendingRestoreRouteName.value = toName;
  } else {
    scrollSnapshots.delete(fromName);
    removeAncestorsForRoute(fromName);
  }

  return true;
});

const removeAfterEach = router.afterEach((to) => {
  const toName = normalizeRouteName(to.name);
  if (!toName) return;
  if (pendingRestoreRouteName.value !== toName) return;

  const snapshot = scrollSnapshots.get(toName);
  if (snapshot) {
    restoreScrollSnapshot(to, snapshot);
  }

  pendingRestoreRouteName.value = '';
});

onUnmounted(() => {
  if (typeof removeGuard === 'function') {
    removeGuard();
  }
  if (typeof removeAfterEach === 'function') {
    removeAfterEach();
  }
});
</script>