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

    <div
      class="tabs-swipe-area"
      @touchstart.passive="onTouchStart"
      @touchmove.passive="onTouchMove"
      @touchend="onTouchEnd"
    >
    <van-tabs v-model:active="activeTab" sticky offset-top="0" background="#f5f6f8">
      
      
      <van-tab :title="`评价(${reviewCount})`">
         <div class="draft-list" :class="{ 'has-footer': isMultiSelect }">
           <div v-if="reviewDrafts.length === 0" class="empty-state">
                <van-icon name="comment-o" class="empty-icon" />
                <div class="empty-text">暂无评价草稿</div>
            </div>
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
                <div class="item-top-row">
                    <div class="left-info">
                         <!-- Order Review Header -->
                        <template v-if="item.reviewType === 'order'">
                            <span class="type-tag order">
                                <van-icon name="bag-o" style="margin-right: 2px; font-size: 14px;" />
                                订单评价 
                            </span>
                        </template>
                         <!-- Shop Review Header -->
                        <template v-else>
                            <span class="type-tag shop">
                                <van-icon name="shop-o" style="margin-right: 2px; font-size: 14px;" />
                                店铺评价 
                            </span>
                        </template>
                    </div>
                         <!-- More action (delete) moved to footer or distinct button, but keeping ellipsis for standard if needed, 
                              User asked to Add Delete button. Usually Delete replaces ellipsis or is explicit.
                              Replacing Ellipsis with Badge or just cleaning up. 
                              User said "Delete button is needed".
                         -->
                        <!-- Status Badge (Fixed position) -->
                    </div>
               
               <!-- Body Content -->
               <div class="item-body-content">
                    <h3 class="item-main-title truncate">{{ item.mainTitle }}</h3>

                     <!-- Rating -->
                     <div class="item-rating-row">
                         <van-rate readonly v-model="item.rating" :size="12" color="#ff9900" void-icon="star" void-color="#eee" />
                     </div>

                    <div class="item-content-text line-clamp-2" v-if="item.content">
                        {{ item.content }}
                    </div>

                    <div v-if="item.images && item.images.length" class="image-grid">
                        <van-image
                            v-for="(img, index) in item.images.slice(0, 3)"
                            :key="index"
                            class="grid-image"
                            fit="cover"
                            :src="img"
                            radius="4"
                        />
                    </div>
                </div>

                <div class="item-footer">
                        <div class="footer-left-info">
                            <span class="date-text">{{ item.date }}</span>
                            <span class="status-badge" :class="item.reviewType">草稿</span>
                        </div>
                    <div v-if="!isMultiSelect" class="action-btns">
                        <van-button round size="small" plain type="danger" class="btn-delete" @click.stop="handleDelete(item)">删除</van-button>
                        <van-button round size="small" class="btn-publish" type="primary" color="#ff6600" icon="guide-o" @click.stop="handlePublish(item)">发布</van-button>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </van-tab>
      
      <van-tab :title="`笔记(${noteCount})`">
        <div class="draft-list" :class="{ 'has-footer': isMultiSelect }">
          <div v-if="noteDrafts.length === 0" class="empty-state">
                <van-icon name="notes-o" class="empty-icon" />
                <div class="empty-text">暂无笔记草稿</div>
            </div>
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
                <div class="item-top-row">
                 <div class="left-info">
                      <span class="type-tag note">笔记草稿</span>
                 </div>
                 
               </div>

               <h3 class="item-main-title truncate">{{ item.mainTitle }}</h3>

             <div class="item-content" v-if="item.content || item.images?.length">
                <div v-if="item.content" class="item-content-text line-clamp-2">
                    {{ item.content }}
                </div>
                <div v-if="item.images && item.images.length" class="image-grid">
                    <van-image
                        v-for="(img, index) in item.images.slice(0, 3)"
                        :key="index"
                        class="grid-image"
                        fit="cover"
                        :src="img"
                         radius="4"
                    />
                </div>
            </div>
            <div class="item-footer">
                        <div class="footer-left-info">
                            <span class="date-text">{{ item.date }}</span>
                            <span class="status-badge note">草稿</span>
                        </div>
              <div v-if="!isMultiSelect" class="action-btns">
                <van-button round size="small" plain type="danger" class="btn-delete" @click.stop="handleDelete(item)">删除</van-button>
                  <van-button round size="small" class="btn-publish" type="primary" color="#ff6600" icon="guide-o" @click.stop="handlePublish(item)">发布</van-button>
              </div>
            </div>
            </div>
          </div>
        </div>
      </van-tab>
    </van-tabs>
    </div>
  </div>
</template>

<script setup>
defineOptions({
  name: 'Drafts'
});
import { ref, computed, watch, onMounted, onActivated } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast, showDialog, showConfirmDialog } from 'vant'
import { addReview, getUserReviewList, removeReview, updateReview } from '@/api/reviews'
import { saveBlog, getMyBlogs, updateBlog, deleteBlog } from '@/api/blog'
import { getCurrentUser } from '@/api/user'
import { fileURL } from '@/utils/request'

const route = useRoute()
const router = useRouter()

const activeTab = ref(0)
const isMultiSelect = ref(false)
const selectedIds = ref([])
const TAB_TO_TYPE = ['review', 'note']
const tabOrder = [0, 1]
const touchStartX = ref(0)
const touchStartY = ref(0)
const touchEndX = ref(0)
const touchEndY = ref(0)
const swipeThreshold = 60
const maxVerticalTravel = 50

const parseRouteTab = () => {
  const type = String(route.query.type || '')
  if (type === 'note') return 1
  if (type === 'review') return 0

  if (route.query.tab !== undefined) {
    const tabIndex = Number(route.query.tab)
    if (Number.isInteger(tabIndex) && tabIndex >= 0 && tabIndex <= 1) {
      return tabIndex
    }
  }
  return 0
}

const syncRouteTab = (tabIndex) => {
  router.replace({
    query: {
      ...route.query,
      tab: String(tabIndex),
      type: TAB_TO_TYPE[tabIndex] || 'review'
    }
  })
}

const onTouchStart = (e) => {
  const touch = e.touches?.[0]
  if (!touch) return
  touchStartX.value = touch.clientX
  touchStartY.value = touch.clientY
  touchEndX.value = touch.clientX
  touchEndY.value = touch.clientY
}

const onTouchMove = (e) => {
  const touch = e.touches?.[0]
  if (!touch) return
  touchEndX.value = touch.clientX
  touchEndY.value = touch.clientY
}

const onTouchEnd = () => {
  if (isMultiSelect.value) return

  const deltaX = touchEndX.value - touchStartX.value
  const deltaY = Math.abs(touchEndY.value - touchStartY.value)
  if (deltaY > maxVerticalTravel) return
  if (Math.abs(deltaX) < swipeThreshold) return

  const currentIndex = tabOrder.indexOf(activeTab.value)
  if (currentIndex < 0) return

  if (deltaX < 0 && currentIndex < tabOrder.length - 1) {
    activeTab.value = tabOrder[currentIndex + 1]
  } else if (deltaX > 0 && currentIndex > 0) {
    activeTab.value = tabOrder[currentIndex - 1]
  }
}

// 多选相关的computed
const selectedCount = computed(() => selectedIds.value.length)

// 获取当前tab的数据
const currentTabData = computed(() => {
  if (activeTab.value === 0) return reviewDrafts.value
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
watch(activeTab, (newVal) => {
  selectedIds.value = []
  syncRouteTab(newVal)
})

// 组件挂载时加载草稿
onMounted(() => {
  activeTab.value = parseRouteTab()
  loadDrafts()
})

// Keep-alive activated hook
onActivated(() => {
   const routeTab = parseRouteTab()
   if (routeTab !== activeTab.value) {
       activeTab.value = routeTab
   }
})
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
        userId: userId.value, 
        status: 3,
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
        status: 3,
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
    
    // Robust shop info extraction
    const sName = item.shopName || item.sourceName || item.shop?.name || '';
    const sIcon = item.shopIcon || item.sourceIcon || item.shop?.icon || item.image || item.shopImage || '';
    
    // Determine Type: Order or Shop
    const isOrderReview = !!(item.orderId && item.orderId !== 0 && item.orderId !== '0');
    
    return {
      ...item,
      type: 'review',
      reviewType: isOrderReview ? 'order' : 'shop',
      orderId: item.orderId,
      rating: item.score || 5, // Rating
      shopName: sName,
      shopIcon: sIcon ? (sIcon.startsWith('http') ? sIcon : fileURL + (sIcon.startsWith('/') ? '' : '/') + sIcon) : '',
      mainTitle: item.title || (isOrderReview ? sName : sName), // Both use shop name usually as title
      images: images,
      date: formatDate(item.updateTime || item.createTime)
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
      mainTitle: item.title || '笔记草稿',
      shopName: '',
      images: images,
      date: formatDate(item.updateTime || item.createTime || Date.now())
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
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const Min = String(date.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d} ${h}:${Min}`
}

const totalCount = computed(() => allDrafts.value.length)
const reviewCount = computed(() => reviewDrafts.value.length)
const noteCount = computed(() => noteDrafts.value.length)

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
  showConfirmDialog({
    title: '提示',
    message: '确定要删除这条草稿吗？',
    confirmButtonColor: '#ff4d4f',
  }).then(async () => {
    if (item.type === 'review') {
      // 删除评价草稿（从API）
      if (item.id) {
        await removeReview(item.id)
          reviewDraftsData.value = reviewDraftsData.value.filter(d => d.id !== item.id)
          localStorage.setItem('review_drafts', JSON.stringify(reviewDraftsData.value))
          showToast('删除成功')
      }
    } else {
      // 删除笔记草稿（调用删除笔记接口）
      if (item.id) {
        await deleteBlog(item.id)
      }
      noteDraftsData.value = noteDraftsData.value.filter(d => d.id !== item.id)
      showToast('删除成功')
    }
  }).catch((err) => {
    if (err === 'cancel' || err === 'close') return
    console.error('Delete draft failed', err)
    showToast('删除失败，请重试')
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
  showConfirmDialog({
    title: '确认发布',
    message: '确定要发布这条评价吗？',
    confirmButtonText: '发布',
    confirmButtonColor: '#ff6600',
  }).then(() => {
    const images = item.images ? item.images.map(img => {
      // 这里的img可能是完整url，需要处理回相对路径或保持url，看后端要求
      // 通常需要去除prefix
      if (img.startsWith(fileURL)) return img.replace(fileURL, '')
      return img
    }).join(',') : ''

    // Determine Source Type
    let sType = 2
    let sId = item.shopId || 0
    
    // 如果存在orderId (或者是voucherId), 则是订单评价
    if (item.orderId && item.orderId !== 0) {
        sType = 4
        // 优先使用 voucherId 或 原有 sourceId (如果是Type 4)，否则如果不传voucherId可能导致问题，但Draft可能没存voucherId?
        // 假设Draft存了sourceId (作为voucherId)
        sId = item.voucherId || (item.sourceType === 4 ? item.sourceId : (item.voucherId || 0))
    }

    const params = {
      sourceId: sId,
      shopId: item.shopId || 0,
      sourceType: sType,
      content: item.content || '',
      score: 5,
      tasteScore: 5,
      envScore: 5,
      serviceScore: 5,
      images: images,
      isAnonymous: false,
      orderId: item.orderId || 0,
      userId: userId.value,
      status: 0, // 0表示发布
      id: item.id // 传递id以更新或删除草稿
    }

    updateReview(params)
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
  showConfirmDialog({
    title: '确认发布',
    message: '确定要发布这条笔记吗？',
    confirmButtonText: '发布',
    confirmButtonColor: '#ff6600',
  }).then(() => {
    const images = item.images ? item.images.map(img => {
      if (img.startsWith(fileURL)) return img.replace(fileURL, '')
      return img
    }).join(',') : ''

    const data = {
      id: item.id,
      title: item.title || '',
      content: item.content || '',
      images: images,
      shopId: item.shopId || null,
      status: 0  // 0=发布
    }

    updateBlog(data)
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
    // 点击卡片进入编辑？或无操作（已有编辑按钮）
    // 设计上通常点击整个卡片进入编辑
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
  }).then(async () => {
    const ids = [...selectedIds.value]
    let successCount = 0

    for (const id of ids) {
      try {
        if (reviewDraftsData.value.some(d => d.id === id)) {
          await removeReview(id)
          reviewDraftsData.value = reviewDraftsData.value.filter(d => d.id !== id)
          successCount++
        } else if (noteDraftsData.value.some(d => d.id === id)) {
          await deleteBlog(id)
          noteDraftsData.value = noteDraftsData.value.filter(d => d.id !== id)
          successCount++
        }
      } catch (err) {
        console.error('Batch delete draft failed', id, err)
      }
    }

    if (successCount === 0) {
      showToast('删除失败，请重试')
    } else if (successCount < ids.length) {
      showToast(`已删除${successCount}条，${ids.length - successCount}条删除失败`)
    } else {
      showToast('删除成功')
    }

    // 退出多选模式
    isMultiSelect.value = false
    selectedIds.value = []
  }).catch((err) => {
    if (err === 'cancel' || err === 'close') return
    console.error('Batch delete failed', err)
    showToast('删除失败，请重试')
  })
}
</script>

<style scoped>
.drafts-container {
  min-height: 100vh;
  background-color: #f5f6f8;
}

.tabs-swipe-area {
  touch-action: pan-y;
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
  padding: 12px;
  padding-bottom: 80px;
}

.draft-list.has-footer {
  padding-bottom: 160px;
}

.draft-item {
  background: white;
  border-radius: 12px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
  display: flex;
  overflow: hidden;
}

.item-content-wrapper {
  flex: 1;
  padding: 16px;
  width: 100%;
}

.item-top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.left-info {
  display: flex;
  align-items: center;
  flex: 1;
  overflow: hidden;
}

.type-tag {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  margin-right: 8px;
  white-space: nowrap;
}

.type-tag.review {
  background-color: #e8f3ff;
  color: #1677ff;
}

.type-tag.note {
  background-color: #fce8ff;
  color: #d02adf;
}

.shop-info {
  display: flex;
  align-items: center;
  overflow: hidden;
  margin-left: 2px;
}

.shop-icon {
  margin-right: 4px;
  border: 1px solid #f0f0f0;
  flex-shrink: 0;
  width: 18px;
  height: 18px;
}

.shop-name {
  font-size: 13px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 140px;
  font-weight: 500;
}

.arrow-icon {
    font-size: 12px;
    color: #ccc;
    margin-left: 2px;
}

.more-icon {
  font-size: 18px;
  color: #ccc;
  padding: 4px;
  margin-right: -4px;
}

.item-main-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.item-content-text {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  margin-bottom: 12px;
}

.image-grid {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  overflow: hidden;
}

.grid-image {
    width: 80px;
    height: 80px;
}

.item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f9f9f9;
}

.date-text {
  font-size: 12px;
  color: #999;
}

.footer-left-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-btns {
  display: flex;
  gap: 8px;
}

.btn-delete {
  padding: 0 12px;
  font-size: 13px;
  height: 30px;
}

.btn-edit {
  padding: 0 12px;
  border-color: #ebedf0;
  color: #666;
  font-size: 13px;
  height: 30px;
}

.btn-publish {
  padding: 0 12px;
  font-size: 13px;
  height: 30px;
}

.multi-select-mode .item-content-wrapper {
  padding-left: 0;
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

/* Checkbox style */
.draft-checkbox {
    margin-left: 12px;
    margin-right: 4px;
    align-self: flex-start;
    margin-top: 16px;
}

/* Updated Card Styles */
.left-info {
    display: flex;
    align-items: center;
    gap: 8px;
}

.type-tag {
    font-size: 13px;
    padding: 2px 0;
    font-weight: 500;
    display: flex;
    align-items: center;
}

/* Order Review: Orange Theme */
.type-tag.order {
    color: #ff6600;
    background: none;
}

/* Shop Review: Blue Theme */
.type-tag.shop {
    color: #1677ff;
    background: none;
}

/* Note Draft: Purple Theme */
.type-tag.note {
    color: #d02adf;
    background: #fce8ff;
    padding: 2px 6px;
}

.status-badge {
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 4px;
    color: white;
    white-space: nowrap;
}

.status-badge.order {
    background: #ff6600;
}
.status-badge.shop {
    background: #1677ff;
}
.status-badge.note {
    background: #d02adf;
}
/* Fallback */
.status-badge:not(.order):not(.shop):not(.note) {
     background: #ff9900; 
}


.item-rating-row {
    margin-bottom: 8px;
}

.btn-wrap {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 12px;
    border: 1px solid #ebedf0;
    border-radius: 15px;
    color: #666;
    font-size: 13px;
    height: 30px;
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
  color: #eee;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 14px;
  color: #999;
}
</style>
