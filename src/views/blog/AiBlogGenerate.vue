<template>
  <div class="ai-blog-generate">
    <div class="ai-header">
      <div class="ai-title">
        <i class="el-icon-magic-stick"></i> 
        ✨ AI 帮我写博客 
        <span v-if="shopName" class="ai-shop-link"> | {{ shopName }}</span>
      </div>
    </div>
    
    <div class="ai-body">
      <!-- 风格选择 -->
      <div class="style-selector">
        <span class="label">风格偏好：</span>
        <div class="style-tags">
          <span class="tag" :class="{active: style === 0}" @click="style = 0" title="生动叙述探店全程">探店笔记</span>
          <span class="tag" :class="{active: style === 1}" @click="style = 1" title="突出亮点强力推荐">种草推荐</span>
          <span class="tag" :class="{active: style === 2}" @click="style = 2" title="客观指出踩坑经历">避雷测评</span>
        </div>
      </div>

      <!-- 描述输入 -->
      <div class="desc-input-box">
        <textarea 
          v-model="description" 
          placeholder="描述你的体验（选填）" 
          class="desc-input"
          @focus="showPlaceholderExample = true"
          @blur="showPlaceholderExample = false">
        </textarea>
        <!-- 聚焦时显示的示例文本 -->
        <div class="desc-example" v-if="showPlaceholderExample && !description">
          例如：底料很香，但是等位太久了...
        </div>
      </div>

      <button class="generate-btn" :disabled="isGenerating || !shopId" @click="handleGenerate">
        <i v-if="isGenerating" class="el-icon-loading"></i>
        <span>{{ isGenerating ? 'AI奋笔疾书中...' : '✨ 一键生成正文' }}</span>
      </button>
      
      <div v-if="!shopId" class="shop-warning">
        请先在上方关联商户，AI需要商户信息才能生成真实内容哦~
      </div>
    </div>
  </div>
</template>

<script>
import { generateBlog } from "@/api/ai";

export default {
  name: "AiBlogGenerate",
  props: {
    shopId: {
      type: [Number, String],
      default: null
    },
    shopName: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      style: 0,
      description: "",
      isGenerating: false,
      showPlaceholderExample: false
    };
  },
  methods: {
    handleGenerate() {
      if (!this.shopId) {
        this.$message.warning("请先关联商户");
        return;
      }
      this.isGenerating = true;
      generateBlog({
        shopId: Number(this.shopId),
        description: this.description,
        style: this.style
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
.ai-blog-generate {
  background: linear-gradient(180deg, #fffaf8 0%, #ffffff 100%);
  border-radius: 12px;
  padding: 15px;
  margin: 15px 20px;
  border: 1px solid #ffe8e0;
}
.ai-header {
  margin-bottom: 12px;
}
.ai-title {
  color: #ff4d4f;
  font-weight: bold;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 5px;
}
.ai-shop-link {
  color: #666;
  font-weight: normal;
  font-size: 13px;
  margin-left: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}
.style-selector {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
}
.style-selector .label {
  color: #666;
  margin-right: 8px;
}
.style-tags {
  display: flex;
  gap: 8px;
}
.tag {
  padding: 4px 10px;
  background: #f5f5f5;
  color: #666;
  border-radius: 12px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
}
.tag.active {
  background: #ff4d4f;
  color: #fff;
}
.desc-input-box {
  margin-bottom: 12px;
  position: relative;
}
.desc-input {
  width: 100%;
  box-sizing: border-box;
  height: 60px;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 13px;
  resize: none;
  background: #fafafa;
  outline: none;
}
.desc-example {
  position: absolute;
  top: 30px;
  left: 10px;
  font-size: 12px;
  color: #bbb;
  pointer-events: none;
}
.desc-input:focus {
  border-color: #ff4d4f;
  background: #fff;
}
.generate-btn {
  width: 100%;
  background: linear-gradient(90deg, #ff7a45 0%, #ff4d4f 100%);
  color: white;
  border: none;
  border-radius: 20px;
  padding: 10px 0;
  font-size: 15px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: opacity 0.3s;
}
.generate-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.shop-warning {
  margin-top: 8px;
  font-size: 12px;
  color: #ff4d4f;
  text-align: center;
}
</style>
