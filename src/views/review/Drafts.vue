<template>
  <PageLayout :loading="false" class="gray-bg">
      <div class="custom-nav">
          <div class="nav-left" @click="$router.go(-1)">
              <van-icon name="arrow-left" color="#333" size="22"/>
          </div>
          <div class="nav-title">我的草稿</div>
          <div class="nav-right"></div>
      </div>
      <div class="draft-list">
          <div v-if="drafts.length === 0" class="empty-state">
              <van-empty description="暂无草稿" />
          </div>
          
          <div class="draft-card" v-for="(item, index) in drafts" :key="item.id" @click="editDraft(item)">
              <div class="card-header">
                  <span class="shop-name">{{ item.shopName || '未命名草稿' }}</span>
                  <span class="time">{{ formatTime(item.updateTime) }}</span>
              </div>
              <div class="card-content">
                  {{ item.content || '暂无内容' }}
              </div>
              <div class="card-images" v-if="item.images && item.images.length">
                  <img v-for="(img, idx) in item.images.slice(0, 3)" :key="idx" :src="img" class="thumb">
                  <span v-if="item.images.length > 3" class="more-count">+{{item.images.length - 3}}</span>
              </div>
              <div class="card-footer">
                   <van-button size="mini" icon="delete" type="danger" plain @click.stop="deleteDraft(index)">删除</van-button>
              </div>
          </div>
      </div>
  </PageLayout>
</template>

<script>
import PageLayout from '@/components/PageLayout/PageLayout.vue';

export default {
  name: 'ReviewDrafts',
  components: { PageLayout },
  data() {
      return {
          drafts: []
      }
  },
  created() {
      this.loadDrafts();
  },
  methods: {
      loadDrafts() {
          const stored = localStorage.getItem('review_drafts');
          if (stored) {
              try {
                  this.drafts = JSON.parse(stored);
                  // Sort by time desc
                  this.drafts.sort((a, b) => b.updateTime - a.updateTime);
              } catch (e) {
                  console.error('Failed to parse drafts', e);
                  this.drafts = [];
              }
          }
      },
      formatTime(timestamp) {
          if (!timestamp) return '';
          const date = new Date(timestamp);
          return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
      },
      editDraft(item) {
          // Go to publish page with draft data
          this.$router.push({
              name: 'ReviewPublish',
              query: {
                  draftId: item.id,
                  shopId: item.shopId
              }
          });
      },
      deleteDraft(index) {
          this.$dialog.confirm({
              title: '提示',
              message: '确定删除这条草稿吗？'
          }).then(() => {
              this.drafts.splice(index, 1);
              localStorage.setItem('review_drafts', JSON.stringify(this.drafts));
              this.$toast('删除成功');
          }).catch(() => {});
      }
  }
}
</script>

<style scoped>
.gray-bg { background: #f7f8fa; min-height: 100vh; }
.custom-nav {
    height: 44px; background: white; display: flex; align-items: center; justify-content: space-between; padding: 0 16px;
    position: sticky; top: 0; z-index: 10;
}
.nav-left, .nav-right { width: 40px; display: flex; align-items: center; }
.nav-title { font-size: 17px; font-weight: 600; color: #333; }
.draft-list { padding: 12px; }
.draft-card {
    background: white; border-radius: 8px; padding: 16px; margin-bottom: 12px;
}
.card-header {
    display: flex; justify-content: space-between; margin-bottom: 8px;
}
.shop-name { font-weight: 600; font-size: 15px; color: #333; }
.time { font-size: 12px; color: #999; }
.card-content {
    font-size: 14px; color: #666; margin-bottom: 8px;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.card-images { display: flex; gap: 8px; margin-bottom: 8px; }
.thumb { width: 60px; height: 60px; object-fit: cover; border-radius: 4px; }
.card-footer { display: flex; justify-content: flex-end; }
</style>
