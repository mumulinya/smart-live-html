# PageLayout 组件使用指南

## 📁 组件位置
`src/components/PageLayout/PageLayout.vue`

## 📋 Props

| 属性 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `loading` | Boolean | ✅ | - | 控制是否显示骨架屏 |
| `skeletonType` | String | ❌ | `'general'` | 骨架屏类型：`'list'`, `'profile'`, `'detail'`, `'general'` |

## 🎰 插槽 (Slots)

| 插槽名 | 说明 |
|--------|------|
| `default` | 真实内容（`loading=false` 时显示） |
| `skeleton` | 自定义骨架屏（可选，不传则使用默认骨架） |

---

## 📝 使用示例

### 1️⃣ 基础用法（内置骨架屏）

```vue
<template>
  <PageLayout :loading="isLoading" skeleton-type="list">
    <!-- 真实内容 -->
    <div class="content">
      <div v-for="item in list" :key="item.id">...</div>
    </div>
  </PageLayout>
</template>

<script>
import PageLayout from '@/components/PageLayout/PageLayout.vue';

export default {
  components: { PageLayout },
  data() {
    return {
      isLoading: true,
      list: []
    }
  },
  async created() {
    this.isLoading = true;
    try {
      const res = await fetchData();
      this.list = res.data;
    } finally {
      this.isLoading = false;
    }
  }
}
</script>
```

### 2️⃣ 使用 Promise.all 控制加载状态

```vue
<template>
  <PageLayout :loading="isLoading" skeleton-type="profile">
    <div class="user-profile">
      <div class="header">{{ user.nickName }}</div>
      <div class="stats">{{ stats.followCount }} 关注</div>
    </div>
  </PageLayout>
</template>

<script>
import PageLayout from '@/components/PageLayout/PageLayout.vue';
import { getCurrentUser, getUserStats, getFullUserInfo } from '@/api/user';

export default {
  components: { PageLayout },
  data() {
    return {
      isLoading: true,
      user: {},
      stats: {},
      info: {}
    }
  },
  async created() {
    await this.loadAllData();
  },
  methods: {
    async loadAllData() {
      this.isLoading = true;
      try {
        // 使用 Promise.all 并行请求所有数据
        const [userRes, statsRes, infoRes] = await Promise.all([
          getCurrentUser(),
          getUserStats(userId),
          getFullUserInfo(userId)
        ]);
        
        this.user = userRes.data;
        this.stats = statsRes.data;
        this.info = infoRes.data;
      } catch (err) {
        console.error('加载数据失败:', err);
      } finally {
        this.isLoading = false;
      }
    }
  }
}
</script>
```

### 3️⃣ 自定义骨架屏

```vue
<template>
  <PageLayout :loading="isLoading">
    <!-- 自定义骨架屏插槽 -->
    <template #skeleton>
      <div class="my-custom-skeleton">
        <div class="custom-avatar animate-pulse"></div>
        <div class="custom-rows">
          <div class="row animate-pulse"></div>
          <div class="row animate-pulse"></div>
        </div>
      </div>
    </template>

    <!-- 真实内容 -->
    <div class="real-content">
      ...
    </div>
  </PageLayout>
</template>

<style scoped>
.my-custom-skeleton {
  display: flex;
  gap: 12px;
  padding: 20px;
}
.custom-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #e8e8e8;
}
.custom-rows .row {
  height: 14px;
  margin-bottom: 8px;
  border-radius: 4px;
  background: #e8e8e8;
}
.animate-pulse {
  background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: pulse 1.5s ease-in-out infinite;
}
@keyframes pulse {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
```

---

## 🎨 骨架屏类型预览

| 类型 | 适用场景 |
|------|---------|
| `general` | 通用页面 |
| `list` | 列表页（商品列表、博客列表等） |
| `profile` | 用户个人主页 |
| `detail` | 详情页（博客详情、商品详情等） |

---

## ✅ 最佳实践

1. **使用 Promise.all 合并请求**：减少等待时间
2. **在 finally 中设置 loading=false**：确保无论成功失败都会关闭骨架屏
3. **配合 try-catch 使用**：优雅处理错误
4. **按场景选择骨架类型**：提供更好的用户体验
