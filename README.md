# Smart Live App

[![Vue](https://img.shields.io/badge/Vue-3.x-42b883?logo=vue.js&logoColor=white)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-4.x-646cff?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Vant](https://img.shields.io/badge/Vant-4.x-07c160)](https://vant-ui.github.io/vant/)
[![Element Plus](https://img.shields.io/badge/Element_Plus-2.x-409eff)](https://element-plus.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

## 📖 项目简介

**Smart Live App** 是一个基于 **Vue 3 + Vite** 构建的现代化本地生活前端项目。

它完整模拟了类似大众点评/美团的核心业务流程，覆盖了从「**找店** → **搜索** → **领券** → **下单** → **评价**」到「**社交互动** → **即时通讯** → **AI 智能助手**」的全链路场景。

项目主打移动端 H5 体验，代码结构清晰，技术栈前沿，非常适合用于：
- 🌟 **全栈项目联调**：作为后端 API 的配套前端
- 📚 **Vue 3 学习实践**：深入理解 Composition API、Pinia/Vuex、Vue Router 等核心技术
- 💼 **开源作品集**：展示复杂业务场景下的前端架构能力

## ✨ 核心功能

### 🏠 首页聚合
- **多Tab信息流**：支持“热门”、“关注”、“分类”等多种信息流展示
- **沉浸式导航**：不仅有底部各个频道导航，顶部还包含定位、天气与搜索入口

### 🗺️ 地图找店 services
- **LBS 服务**：精准定位当前位置
- **可视化找店**：基于高德地图的周边商家展示
- **智能筛选**：支持按距离、评分、人均价格等多维度筛选

### 🔍 全局搜索
- **综合搜索**：聚合店铺、代金券、博客笔记、用户等多种结果
- **搜索历史**：本地存储搜索记录，支持一键清空
- **热门推荐**：展示热门搜索词

### 🏬 商家与交易
- **商家详情**：展示商家相册、基本信息、评分及推荐菜
- **代金券体系**：
  - 普通代金券购买
  - **限时秒杀**：倒计时、库存扣减动画
- **订单流程**：
  - 下单支付模拟
  - 订单状态管理（待支付、待使用、已完成、退款）
  - 订单评价入口

### ⭐ 多媒体评价
- **多维评分**：口味、环境、服务等细分打分
- **富文本评价**：支持发布图文内容
- **视频评价**：支持上传短视频，丰富评价形式
- **草稿箱**：未发布的评价自动保存，随时继续编辑
- **匿名评价**：保护用户隐私

### 👥 社交与互动
- **UGC 社区**：用户发布探店笔记、生活动态
- **互动体系**：点赞、收藏、关注、评论
- **评论定位**：点击消息通知可直接跳转到具体评论位置

### 💬 即时通讯 (IM)
- **实时聊天**：基于 WebSocket 的私信功能
- **消息通知**：未读消息红点统计
- **系统通知**：点赞、评论等互动消息推送

### 🤖 AI 智能助手
- **流式对话**：基于 SSE (Server-Sent Events) 的打字机效果回复
- **多模态推荐**：AI 根据上下文推荐店铺卡片、代金券卡片
- **会话管理**：支持多会话切换、历史记录查询、会话搜索
- **Markdown 渲染**：支持富文本格式的 AI 回复

### 👤 用户中心
- **安全登录**：支持密码显隐、**滑块验证码**校验
- **个人主页**：展示获赞数、粉丝数、关注数及个人动态
- **我的资产**：钱包余额、积分管理、优惠券包
- **设置管理**：个人资料修改、收货地址管理

## 🛠️ 技术栈

| 类别 | 技术 | 说明 |
| --- | --- | --- |
| **核心框架** | Vue 3 | 使用 Composition API 构建逻辑 |
| **构建工具** | Vite 4 | 极速冷启动与热更新 |
| **路由管理** | Vue Router 4 | 单页面应用路由控制 |
| **UI 组件库** | Vant 4 | 移动端核心组件库 |
| **PC 组件库** | Element Plus | 辅助管理后台或部分PC场景组件 |
| **HTTP 请求** | Axios | 统一请求拦截、响应处理 |
| **CSS 预处理** | CSS Variables | 原生 CSS 变量定制主题 |
| **Markdown** | markdown-it | 用于 AI 回复的 Markdown 渲染 |
| **验证码** | vue3-puzzle-vcode | 登录页滑块拼图验证 |
| **状态管理** | Vue Reactive / Store | 响应式状态管理 |

## 📁 项目结构

```bash
smart-live-app/
├── src/
│   ├── api/           #后端接口定义
│   ├── assets/        # 静态资源 (图片, 样式)
│   ├── components/    # 公共组件 (Layout, 骨架屏等)
│   ├── config/        # 全局配置
│   ├── router/        # 路由配置
│   ├── store/         # 状态管理
│   ├── utils/         # 工具函数 (Request, Date, Storage)
│   ├── views/         # 页面视图
│   │   ├── ai/        # AI 助手相关页面
│   │   ├── blog/      # 博客笔记
│   │   ├── chat/      # 消息聊天
│   │   ├── comment/   # 评论列表
│   │   ├── draft/     # 评价草稿箱
│   │   ├── home/      # 首页
│   │   ├── map/       # 地图找店
│   │   ├── order/     # 订单中心
│   │   ├── review/    # 评价发布
│   │   ├── search/    # 全局搜索
│   │   ├── shop/      # 店铺详情
│   │   ├── user/      # 用户中心 (登录, 个人页等)
│   │   └── voucher/   # 代金券详情
│   ├── App.vue        # 根组件
│   ├── main.js        # 入口文件
│   └── style.css      # 全局通用样式
├── docs/              # 项目文档资料
├── public/            # 公共静态资源
├── .env.*             # 环境变量配置
├── index.html         # HTML 模板
├── package.json       # 项目依赖配置
└── vite.config.js     # Vite 构建配置
```

## 🚀 快速开始

### 1. 环境准备

确保你的本地环境已安装：
- Node.js >= 16.0.0
- npm >= 7.0.0 或 yarn >= 1.22.0

### 2. 安装依赖

```bash
# 推荐使用 npm
npm install

# 或者使用 yarn
yarn install
```

### 3. 启动开发服务器

```bash
npm run dev
```

启动后访问：http://localhost:5173

### 4. 构建生产版本

```bash
npm run build
```

## 🔧 环境变量配置

项目根目录下包含 `.env.example` 模板文件。请复制并重命名为 `.env.local` 进行本地配置：

```properties
# 后端 API 基础地址
VITE_API_BASE_URL=/app-dev-api

# MinIO 文件服务配置 (用于图片上传/回显)
VITE_MINIO_URL=http://your-minio-host
VITE_MINIO_PORT=9000
VITE_FILE_PREFIX=/smart-live

# WebSocket 服务地址 (用于 IM 和 AI)
VITE_WS_HOST=your-ws-host
```

## 📝 代码规范

本项目严格遵循 Vue 3 风格指南，建议安装 VS Code 插件：
- **Volar**: Vue 3 语法高亮与智能提示
- **ESLint**: 代码质量检查
- **Prettier**: 代码格式化

## 🤝 贡献指南

我们非常欢迎社区贡献！如果您发现 Bug 或有新的功能建议：

1. Fork 本仓库
2. 创建您的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 📄 许可证

本项目采用 **MIT License** 开源许可证。详情请参阅 [LICENSE](./LICENSE) 文件。

---

**如果觉得这个项目不错，请给个 Star ⭐ 支持一下！**