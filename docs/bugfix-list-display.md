# 导航栏消失问题修复

## 问题描述

用户个人中心的收藏列表和关注列表偶尔出现导航栏（返回按钮和标题）消失的问题。

## 问题原因

`PageLayout` 组件使用 `v-show="!loading"` 来控制内容显示，当 `loading=true` 时会隐藏所有内容（包括导航栏）。

问题的根源是：**将 `van-list` 的 `loading` 状态直接传递给了 `PageLayout` 的 `loading` 属性**。

- `van-list` 的 `loading` 状态会在滚动加载时频繁变化（true/false）
- 每次 `loading` 变为 `true` 时，`PageLayout` 就会隐藏整个内容区域
- 导致导航栏闪烁或消失

## 正确的做法

应该区分两种加载状态：

1. **页面初始加载状态** (`pageLoading`)：用于 `PageLayout`，只在页面首次加载时为 `true`
2. **列表滚动加载状态** (`loading`)：用于 `van-list`，在滚动加载更多数据时变化

```vue
<template>
  <PageLayout :loading="pageLoading" skeleton-type="list">
    <van-nav-bar title="标题" left-arrow fixed placeholder />
    
    <van-list
      v-model:loading="loading"
      :finished="finished"
      @load="onLoad"
    >
      <!-- 列表内容 -->
    </van-list>
  </PageLayout>
</template>

<script setup>
const loading = ref(false);      // van-list 的加载状态
const pageLoading = ref(true);   // 页面初始加载状态
const finished = ref(false);

const initUser = async () => {
    // ... 初始化逻辑
    pageLoading.value = false; // 初始化完成后设置为 false
};

onMounted(() => {
    initUser();
});
</script>
```

## 修复方案

### 1. MyFollow.vue（我的关注）

**修改前**：
```javascript
const loading = ref(false);
```

**修改后**：
```javascript
const loading = ref(false);      // van-list 的加载状态
const pageLoading = ref(true);   // 页面初始加载状态
```

**模板修改**：
```vue
<PageLayout :loading="pageLoading" skeleton-type="list">
```

**初始化逻辑**：
```javascript
const initUser = () => {
    const userStr = localStorage.getItem('userInfo');
    if (userStr) {
        const u = JSON.parse(userStr);
        userId.value = u.id;
        pageLoading.value = false; // 初始化完成
    } else {
        getCurrentUser().then(res => {
           const u = res.data || res;
           if (u && u.id) {
               userId.value = u.id;
               localStorage.setItem('userInfo', JSON.stringify(u));
           }
        }).finally(() => {
            pageLoading.value = false; // 初始化完成
        });
    }
};
```

### 2. MyStar.vue（我的收藏）

与 MyFollow.vue 相同的修改方式：
- 添加 `pageLoading` 状态
- 修改 `PageLayout` 绑定
- 在初始化完成后设置 `pageLoading = false`

### 3. UserList.vue（关注/粉丝列表）

**data 修改**：
```javascript
data() {
  return {
    loading: false,      // 列表加载状态
    pageLoading: true,   // 页面初始加载状态
    // ...
  }
}
```

**queryUser 方法**：
```javascript
async queryUser() {
  try {
    // ... 查询逻辑
    this.pageLoading = false; // 初始化完成
    this.resetList();
  } catch(e) {
    console.error(e);
    this.pageLoading = false; // 即使出错也要关闭加载状态
  }
}
```

## 技术要点

### PageLayout 组件的正确使用

`PageLayout` 的 `loading` 属性应该只用于：
- 页面首次进入时的加载
- 需要阻止用户交互的全屏加载

不应该用于：
- 列表的滚动加载
- 局部数据的刷新
- 频繁变化的加载状态

### van-list 组件的 loading 状态

`van-list` 的 `loading` 状态：
- 由组件内部管理
- 在滚动到底部时自动触发 `@load` 事件
- 加载完成后自动重置
- 不应该影响页面的整体显示

### 状态管理最佳实践

```javascript
// ✅ 正确：分离两种加载状态
const pageLoading = ref(true);   // 页面级加载
const loading = ref(false);      // 列表级加载

// ❌ 错误：混用加载状态
const loading = ref(false);      // 既用于页面又用于列表
```

## 测试建议

1. 测试页面首次加载时导航栏是否正常显示
2. 测试滚动加载更多数据时导航栏是否保持显示
3. 测试快速切换标签时导航栏是否稳定
4. 测试网络慢速情况下的表现
5. 测试错误情况下导航栏是否正常

## 相关文件

- `src/views/user/social/MyFollow.vue`
- `src/views/user/content/MyStar.vue`
- `src/views/user/social/UserList.vue`
- `src/components/PageLayout/PageLayout.vue`
