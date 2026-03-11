<template>
  <div class="ai-review-generate">
    <div class="input-row">
      <input 
        v-model="description" 
        placeholder="点我写点指导让AI帮您评价..." 
        class="desc-input"
      />
      <button class="ai-btn" :disabled="isGenerating || (!shopId && !sourceId)" @click="handleGenerate">
        <i v-if="isGenerating" class="el-icon-loading"></i>
        <i v-else class="van-icon van-icon-like-o"></i>
        {{ isGenerating ? '生成中' : 'AI帮我写' }}
      </button>
    </div>
  </div>
</template>

<script>
import { generateReview } from "@/api/ai";

export default {
  name: "AiReviewGenerate",
  props: {
    shopId: [Number, String],
    orderId: [Number, String],
    sourceType: [Number, String],
    sourceId: [Number, String],
    score: Number,
    tasteScore: Number,
    envScore: Number,
    serviceScore: Number
  },
  data() {
    return {
      description: "",
      isGenerating: false
    };
  },
  methods: {
    handleGenerate() {
      if (!this.shopId && !this.sourceId) {
        this.$message.warning("缺乏必要信息无法用AI生成");
        return;
      }
      this.isGenerating = true;
      generateReview({
        shopId: this.shopId ? this.shopId : null,
        orderId: this.orderId ? this.orderId : null,
        sourceType: this.sourceType ? Number(this.sourceType) : null,
        sourceId: this.sourceId ? this.sourceId : null,
        score: this.score,
        tasteScore: this.tasteScore,
        envScore: this.envScore,
        serviceScore: this.serviceScore,
        description: this.description
      }).then(res => {
        let content = res.data || res;
        if(res.code === 200 && res.data) {
          content = res.data;
        } else if (res.msg && res.code !== 200) {
           this.$message.error(res.msg);
           return;
        }
        this.$emit('generated', content);
        this.$message.success("AI 生成成功！");
      }).catch(err => {
        console.error(err);
        this.$message.error("请求失败，请稍后重试");
      }).finally(() => {
        this.isGenerating = false;
      });
    }
  }
};
</script>

<style scoped>
.ai-review-generate {
  margin-bottom: 12px;
  background: linear-gradient(90deg, #fff2e8 0%, #ffffff 100%);
  border: 1px solid #ffd8bf;
  border-radius: 8px;
  padding: 10px;
}
.input-row {
  display: flex;
  gap: 8px;
  align-items: center;
}
.desc-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 13px;
  color: #333;
}
.desc-input::placeholder { color: #aaa; }
.ai-btn {
  background: linear-gradient(90deg, #ff7a45, #ff4d4f);
  color: white;
  border: none;
  border-radius: 14px;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  white-space: nowrap;
}
.ai-btn:disabled {
  opacity: 0.6;
}
</style>
