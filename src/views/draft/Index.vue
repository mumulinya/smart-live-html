<template>
  <div class="drafts-container">
    <van-nav-bar
      :title="isMultiSelect ? `已选${selectedCount}项` : '草稿箱'"
      :left-arrow="!isMultiSelect"
      :border="false"
      @click-left="isMultiSelect ? handleCancelMultiSelect() : $router.back()"
    >
      <template #right>
        <span v-if="!isMultiSelect" class="nav-right-text" @click="handleMultiSelect">多选</span>
        <span v-else-if="selectedCount === 0" class="nav-right-text" @click="handleCancelMultiSelect">取消</span>
        <span v-else class="nav-right-text nav-right-text-primary" @click="handleBatchDelete">删除</span>
      </template>
    </van-nav-bar>

    <!-- 多选模式下的底部栏 -->
    <div v-if="isMultiSelect" class="multi-select-footer">
      <van-checkbox v-model="allSelected" @click="handleSelectAll">全选</van-checkbox>
    </div>

    <van-tabs v-model:active="activeTab" sticky offset-top="0">
      <van-tab :title="`全部(${totalCount})`">
        <div class="draft-list" :class="{ 'has-footer': isMultiSelect }">
          <div
            v-for="item in allDrafts"
            :key="item.id"
            class="draft-item"
            :class="{ 'selected': selectedIds.includes(item.id), 'multi-select-mode': isMultiSelect }"
            @click="handleItemClick(item)"
          >
            <van-checkbox
              v-if="isMultiSelect"
              :model-value="selectedIds.includes(item.id)"
              class="draft-checkbox"
              @click.stop="toggleSelect(item.id)"
            />
            <div class="item-content-wrapper">
              <div class="item-header">
                <h3 class="item-title truncate">{{ item.title }}</h3>
              </div>
              <div class="item-sub text-gray-400 text-xs mb-2">
                {{ item.subTitle }}
              </div>

              <div class="item-content mb-2" v-if="item.content || item.images">
                  <div v-if="item.content" class="text-sm text-gray-600 mb-2 line-clamp-2">
                      {{ item.content }}
                  </div>
                  <div v-if="item.images && item.images.length" class="flex gap-2">
                      <van-image
                          v-for="(img, index) in item.images.slice(0, 3)"
                          :key="index"
                          width="80"
                          height="80"
                          fit="cover"
                          radius="4"
                          :src="img"
                      />
                  </div>
              </div>

              <div class="item-footer">
                <span class="footer-text">{{ item.date }} 写{{ item.type === 'review' ? '评价' : '笔记' }}保存草稿</span>
                <div v-if="!isMultiSelect" class="footer-actions">
                  <van-icon name="send-o" class="publish-icon" @click.stop="handlePublish(item)" />
                  <van-icon name="delete" class="delete-icon" @click.stop="handleDelete(item)" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </van-tab>
      
      <van-tab :title="`评价(${reviewCount})`">
         <div class="draft-list" :class="{ 'has-footer': isMultiSelect }">
          <div
            v-for="item in reviewDrafts"
            :key="item.id"
            class="draft-item"
            :class="{ 'selected': selectedIds.includes(item.id), 'multi-select-mode': isMultiSelect }"
            @click="handleItemClick(item)"
          >
            <van-checkbox
              v-if="isMultiSelect"
              :model-value="selectedIds.includes(item.id)"
              class="draft-checkbox"
              @click.stop="toggleSelect(item.id)"
            />
            <div class="item-content-wrapper">
             <div class="item-header">
              <h3 class="item-title truncate">{{ item.title }}</h3>
            </div>
            <div class="item-sub text-gray-400 text-xs mb-2">
              {{ item.subTitle }}
            </div>
             <div class="item-content mb-2" v-if="item.content || item.images?.length">
                <div v-if="item.content" class="text-sm text-gray-600 mb-2 line-clamp-2">
                    {{ item.content }}
                </div>
                <div v-if="item.images && item.images.length" class="flex gap-2">
                    <van-image
                        v-for="(img, index) in item.images.slice(0, 3)"
                        :key="index"
                        width="80"
                        height="80"
                        fit="cover"
                        radius="4"
                        :src="img"
                    />
                </div>
            </div>
            <div class="item-footer">
              <span class="footer-text">{{ item.date }} 写{{ item.type === 'review' ? '评价' : '笔记' }}保存草稿</span>
              <div v-if="!isMultiSelect" class="footer-actions">
                <van-icon name="send-o" class="publish-icon" @click.stop="handlePublish(item)" />
                <van-icon name="delete" class="delete-icon" @click.stop="handleDelete(item)" />
              </div>
            </div>
            </div>
          </div>
        </div>
      </van-tab>
      
      <van-tab :title="`笔记(${noteCount})`">
        <div class="draft-list" :class="{ 'has-footer': isMultiSelect }">
          <div
            v-for="item in noteDrafts"
            :key="item.id"
            class="draft-item"
            :class="{ 'selected': selectedIds.includes(item.id), 'multi-select-mode': isMultiSelect }"
            @click="handleItemClick(item)"
          >
            <van-checkbox
              v-if="isMultiSelect"
              :model-value="selectedIds.includes(item.id)"
              class="draft-checkbox"
              @click.stop="toggleSelect(item.id)"
            />
            <div class="item-content-wrapper">
             <div class="item-header">
              <h3 class="item-title truncate">{{ item.title }}</h3>
            </div>
            <div class="item-sub text-gray-400 text-xs mb-2">
              {{ item.subTitle }}
            </div>
             <div class="item-content mb-2" v-if="item.content || item.images?.length">
                <div v-if="item.content" class="text-sm text-gray-600 mb-2 line-clamp-2">
                    {{ item.content }}
                </div>
                <div v-if="item.images && item.images.length" class="flex gap-2">
                    <van-image
                        v-for="(img, index) in item.images.slice(0, 3)"
                        :key="index"
                        width="80"
                        height="80"
                        fit="cover"
                        radius="4"
                        :src="img"
                    />
                </div>
            </div>
            <div class="item-footer">
              <span class="footer-text">{{ item.date }} 写{{ item.type === 'review' ? '评价' : '笔记' }}保存草稿</span>
              <div v-if="!isMultiSelect" class="footer-actions">
                <van-icon name="send-o" class="publish-icon" @click.stop="handlePublish(item)" />
                <van-icon name="delete" class="delete-icon" @click.stop="handleDelete(item)" />
              </div>
            </div>
            </div>
          </div>
        </div>
      </van-tab>
    </van-tabs>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showDialog, showConfirmDialog } from 'vant'
import { addReview, getUserReviewList, updateReview, removeReview } from '@/api/reviews'
import { saveBlog, getMyBlogs } from '@/api/blog'
import { getCurrentUser } from '@/api/user'
import { fileURL } from '@/utils/request'

const router = useRouter()

const activeTab = ref(0)
const isMultiSelect = ref(false)
const selectedIds = ref([])

// 多选相关的computed
const selectedCount = computed(() => selectedIds.value.length)

// 获取当前tab的数据
const currentTabData = computed(() => {
  if (activeTab.value === 0) return allDrafts.value
  if (activeTab.value === 1) return reviewDrafts.value
  return noteDrafts.value
})

// 是否全选
const allSelected = computed({
  get: () => {
    const current = currentTabData.value
    return current.length > 0 && selectedIds.value.length === current.length &&
      current.every(item => selectedIds.value.includes(item.id))
  },
  set: (value) => {
    // setter required for v-model
  }
})

// 监听tab切换，清空选中状态
watch(activeTab, () => {
  selectedIds.value = []
})

// 草稿数据
const reviewDraftsData = ref([])
const noteDraftsData = ref([])
const userId = ref(null)

// 加载草稿数据
const loadDrafts = () => {
  // 获取当前用户ID
  getCurrentUser().then(res => {
    const user = res.data || res
    if (user && user.id) {
      userId.value = user.id
    }
    // 加载评价草稿（从API，status=1表示草稿）
    loadReviewDrafts()
    // 加载笔记草稿（从API）
    loadNoteDrafts()
  }).catch(err => {
    console.error('获取用户信息失败', err)
  })
}

const loadReviewDrafts = () => {
    getUserReviewList({
        userId: userId.value, // It might be empty initially, but API might handle it or we wait for userId? 
        // Actually getUserReviewList likely needs userId. 
        // But let's check if we can pass it without userId if it's "my" reviews?
        // The API path is /of/user, so it probably expects a userId param.
        // However, loadDrafts calls this immediately. userId might be null.
        // Let's assume the API handles it or we should just pass status=1.
        status: 1,
        current: 1,
        size: 100
    }).then(res => {
        let list = res.data || res
        if (res && res.data && Array.isArray(res.data.records)) list = res.data.records
        reviewDraftsData.value = Array.isArray(list) ? list : []
    }).catch(err => {
        console.error('Failed to load review drafts', err)
    })
}

const loadNoteDrafts = () => {
    getMyBlogs({
        status: 1,
        current: 1,
        size: 100
    }).then(res => {
        let list = res.data || res
        if (res && res.data && Array.isArray(res.data.records)) list = res.data.records
        noteDraftsData.value = Array.isArray(list) ? list : []
    }).catch(err => {
        console.error('Failed to load note drafts', err)
    })
}

const allDrafts = computed(() => {
  const reviewList = reviewDraftsData.value.map(item => {
    // Process images - API returns comma-separated string
    let images = []
    if (item.images) {
      if (typeof item.images === 'string') {
        images = item.images.split(',').filter(x => x).map(img => {
          return img.startsWith('http') ? img : fileURL + (img.startsWith('/') ? '' : '/') + img
        })
      } else if (Array.isArray(item.images)) {
        images = item.images.map(img => {
          return img.startsWith('http') ? img : fileURL + (img.startsWith('/') ? '' : '/') + img
        })
      }
    }
    return {
      ...item,
      type: 'review',
      title: item.shopName || item.title || '评价草稿',
      subTitle: item.content ? '写评价' : '',
      images: images,
      date: formatDate(item.updateTime)
    }
  })
  const noteList = noteDraftsData.value.map(item => {
    // Process images - API returns comma-separated string
    let images = []
    if (item.images) {
      if (typeof item.images === 'string') {
        images = item.images.split(',').filter(x => x).map(img => {
          return img.startsWith('http') ? img : fileURL + (img.startsWith('/') ? '' : '/') + img
        })
      } else if (Array.isArray(item.images)) {
        images = item.images.map(img => {
          return img.startsWith('http') ? img : fileURL + (img.startsWith('/') ? '' : '/') + img
        })
      }
    }
    return {
      ...item,
      type: 'note',
      title: item.title || '笔记草稿',
      subTitle: item.content ? '写笔记' : '',
      images: images,
      date: formatDate(item.updateTime || Date.now())
    }
  })
  return [...reviewList, ...noteList]
})

const reviewDrafts = computed(() => allDrafts.value.filter(item => item.type === 'review'))
const noteDrafts = computed(() => allDrafts.value.filter(item => item.type === 'note'))

// 格式化日期
const formatDate = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const totalCount = computed(() => allDrafts.value.length)
const reviewCount = computed(() => reviewDrafts.value.length)
const noteCount = computed(() => noteDrafts.value.length)

// 组件挂载时加载草稿
onMounted(() => {
  loadDrafts()
})

const handleEdit = (item) => {
  if (item.type === 'review') {
    router.push({
      name: 'ReviewPublish',
      query: { edit: 'true', id: item.id }
    })
  } else if (item.type === 'note') {
    router.push({
      name: 'BlogEdit',
      query: { id: item.id, draft: 'true' }
    })
  } else {
    showToast('未知类型: ' + item.title)
  }
}

const handleDelete = (item) => {
  showDialog({
    title: '提示',
    message: '确定要删除这条草稿吗？',
    showCancelButton: true,
  }).then(() => {
    if (item.type === 'review') {
      // 删除评价草稿（从API）
      if (item.id) {
        removeReview(item.id).then(() => {
          reviewDraftsData.value = reviewDraftsData.value.filter(d => d.id !== item.id)
          localStorage.setItem('review_drafts', JSON.stringify(reviewDraftsData.value))
          showToast('删除成功')
        })
      }
    } else {
      // 删除笔记草稿（从API）
      noteDraftsData.value = noteDraftsData.value.filter(d => d.id !== item.id)
      showToast('删除成功')
    }
  }).catch(() => {
    // cancel
  })
}

const handlePublish = (item) => {
  if (!item.content && !item.images?.length) {
    showToast('草稿内容为空，无法发布')
    return
  }

  if (item.type === 'review') {
    publishReview(item)
  } else if (item.type === 'note') {
    publishNote(item)
  }
}

const publishReview = (item) => {
  showDialog({
    title: '确认发布',
    message: '确定要发布这条评价吗？',
    confirmButtonText: '发布',
    confirmButtonColor: '#ff6600',
    cancelButtonText: '取消',
  }).then(() => {
    const images = item.images ? item.images.map(img => {
      if (img.startsWith(fileURL)) return img.replace(fileURL, '')
      return img
    }).join(',') : ''

    const params = {
      sourceId: item.shopId || 0,
      shopId: item.shopId || 0,
      sourceType: 2,
      content: item.content || '',
      score: 5,
      tasteScore: 5,
      envScore: 5,
      serviceScore: 5,
      images: images,
      isAnonymous: false,
      orderId: 0,
      userId: userId.value
    }

    addReview(params)
      .then(() => {
        // 发布成功后删除草稿
        reviewDraftsData.value = reviewDraftsData.value.filter(d => d.id !== item.id)
        localStorage.setItem('review_drafts', JSON.stringify(reviewDraftsData.value))
        showToast('发布成功')
      })
      .catch(err => {
        console.error('发布评价失败', err)
        showToast('发布失败，请重试')
      })
  }).catch(() => {
    // cancel
  })
}

const publishNote = (item) => {
  showDialog({
    title: '确认发布',
    message: '确定要发布这条笔记吗？',
    confirmButtonText: '发布',
    confirmButtonColor: '#ff6600',
    cancelButtonText: '取消',
  }).then(() => {
    const images = item.images ? item.images.map(img => {
      if (img.startsWith(fileURL)) return img.replace(fileURL, '')
      return img
    }).join(',') : ''

    const data = {
      title: item.title || '',
      content: item.content || '',
      images: images,
      shopId: item.shopId || null,
      status: 0  // 0=发布
    }

    saveBlog(data)
      .then(() => {
        // 发布成功后删除草稿
        noteDraftsData.value = noteDraftsData.value.filter(d => d.id !== item.id)
        showToast('发布成功')
      })
      .catch(err => {
        console.error('发布笔记失败', err)
        showToast('发布失败，请重试')
      })
  }).catch(() => {
    // cancel
  })
}

// 多选模式相关函数
const handleMultiSelect = () => {
  isMultiSelect.value = true
  selectedIds.value = []
}

const handleCancelMultiSelect = () => {
  isMultiSelect.value = false
  selectedIds.value = []
}

const handleItemClick = (item) => {
  if (isMultiSelect.value) {
    toggleSelect(item.id)
  } else {
    handleEdit(item)
  }
}

const toggleSelect = (id) => {
  const index = selectedIds.value.indexOf(id)
  if (index > -1) {
    selectedIds.value.splice(index, 1)
  } else {
    selectedIds.value.push(id)
  }
}

const handleSelectAll = () => {
  const current = currentTabData.value
  if (allSelected.value) {
    // 取消全选
    selectedIds.value = []
  } else {
    // 全选当前tab
    selectedIds.value = current.map(item => item.id)
  }
}

const handleBatchDelete = () => {
  if (selectedIds.value.length === 0) {
    showToast('请选择要删除的草稿')
    return
  }

  showConfirmDialog({
    title: '确认删除',
    message: `确定要删除选中的 ${selectedIds.value.length} 条草稿吗？`,
    confirmButtonText: '删除',
    confirmButtonColor: '#ff4d4f',
    cancelButtonText: '取消',
  }).then(() => {
    // 批量删除
    if (activeTab.value === 1) {
      // 删除评价草稿
      reviewDraftsData.value = reviewDraftsData.value.filter(item => !selectedIds.value.includes(item.id))
      localStorage.setItem('review_drafts', JSON.stringify(reviewDraftsData.value))
    } else if (activeTab.value === 2) {
      // 删除笔记草稿
      noteDraftsData.value = noteDraftsData.value.filter(item => !selectedIds.value.includes(item.id))
    }
    showToast('删除成功')
    // 退出多选模式
    isMultiSelect.value = false
    selectedIds.value = []
  }).catch(() => {
    // cancel
  })
}
</script>

<style scoped>
.drafts-container {
  min-height: 100vh;
  background-color: #f5f6f8;
}

.nav-right-text {
  font-size: 15px;
  color: #333;
  cursor: pointer;
  transition: color 0.2s;
}

.nav-right-text:active {
  color: #666;
}

.nav-right-text-primary {
  color: #ff6600;
  font-weight: 500;
}

.nav-right-text-primary:active {
  color: #e65c00;
}

.draft-list {
  padding: 16px;
  padding-bottom: 80px;
}

.draft-list.has-footer {
  padding-bottom: 160px;
}

.draft-item {
  background: white;
  border-radius: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
  display: flex;
  overflow: hidden;
}

.draft-item.multi-select-mode {
  padding: 12px;
}

.draft-item:active:not(.multi-select-mode) {
  transform: scale(0.98);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.draft-item.selected {
  background: #fff5f0;
  box-shadow: 0 2px 12px rgba(255, 102, 0, 0.15);
}

.draft-checkbox {
  margin-right: 12px;
  display: flex;
  align-items: flex-start;
  padding-top: 8px;
}

:deep(.draft-checkbox .van-checkbox__label) {
  display: none;
}

:deep(.draft-checkbox .van-checkbox__icon) {
  border-color: #ddd;
}

:deep(.draft-checkbox.van-checkbox--checked .van-checkbox__icon) {
  background-color: #ff6600;
  border-color: #ff6600;
}

.item-content-wrapper {
  flex: 1;
  padding: 8px 8px 8px 0;
}

.draft-item:not(.multi-select-mode) .item-content-wrapper {
  padding: 20px;
}

.item-header {
  margin-bottom: 8px;
}

.item-title {
  font-size: 17px;
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1.5;
  margin: 0;
}

.item-sub {
  color: #999;
  font-size: 13px;
  margin-bottom: 16px;
  line-height: 1.4;
}

.item-content {
  margin-bottom: 16px;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.6;
  font-size: 14px;
  color: #666;
  word-break: break-word;
}

/* 图片容器优化 */
.item-content :deep(.flex) {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.item-content :deep(.van-image) {
  border-radius: 8px;
  overflow: hidden;
}

/* Custom Tab Styles */
:deep(.van-tabs__wrap) {
  background: white;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.05);
}

:deep(.van-tabs__nav) {
  background: white;
  padding: 12px 16px 0;
  gap: 8px;
}

:deep(.van-tab) {
  flex: 1;
  padding: 0;
  height: 40px;
  line-height: 40px;
  background: transparent;
  color: #666;
  font-size: 15px;
  border: none;
  border-radius: 20px;
  transition: all 0.2s ease;
  position: relative;
}

:deep(.van-tab--active) {
  color: #ff6600;
  font-weight: 500;
  background: #fff5f0;
}

:deep(.van-tabs__line) {
  display: none;
}

.item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.footer-text {
  font-size: 13px;
  color: #999;
}

.footer-actions {
  display: flex;
  gap: 8px;
}

.publish-icon {
  font-size: 20px;
  color: #ff6600;
  padding: 8px;
  margin: -8px;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.publish-icon:active {
  color: #e65c00;
  background: rgba(255, 102, 0, 0.1);
}

.delete-icon {
  font-size: 20px;
  color: #ccc;
  padding: 8px;
  margin: -8px;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.delete-icon:active {
  color: #ff4d4f;
  background: rgba(255, 77, 79, 0.1);
}

/* 多选底部栏 */
.multi-select-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 16px 20px;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 99;
}

:deep(.multi-select-footer .van-checkbox__label) {
  font-size: 15px;
  color: #333;
}

/* 空状态样式 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: #999;
}

.empty-icon {
  font-size: 64px;
  color: #ddd;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 14px;
  color: #999;
}
</style>
