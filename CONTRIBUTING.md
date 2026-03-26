# Contributing Guide

感谢你参与 Smart Live App 的开源共建。

## 开始之前

- 确保本地 Node.js 版本 >= 18。
- 先执行 `npm install` 安装依赖。
- 执行 `npm run dev` 确认项目可正常启动。

## 分支与提交流程

1. 从 `main` 拉取最新代码并创建新分支。  
   分支命名建议：`feat/xxx`、`fix/xxx`、`docs/xxx`
2. 在新分支完成开发并自测。
3. 提交前至少执行一次 `npm run build`，确保可构建。
4. 发起 Pull Request 到 `main`。

## Commit 建议

建议使用清晰的提交前缀：

- `feat:` 新功能
- `fix:` 缺陷修复
- `refactor:` 重构
- `docs:` 文档更新
- `style:` 仅样式调整
- `chore:` 工程化或杂项

示例：

```bash
git commit -m "feat: support Enter key to submit login form"
```

## Pull Request 清单

请在 PR 描述中尽量包含以下内容：

- 变更目的和背景
- 关键实现说明
- 影响范围（页面/模块）
- 验证方式（手测步骤或命令输出）
- 截图或录屏（UI 改动建议附上）

## Issue 建议

提交 Issue 时建议提供：

- 复现步骤
- 实际结果与期望结果
- 浏览器与设备信息
- 控制台报错或接口报错截图

## 代码风格

- 保持现有代码风格和目录结构。
- 优先小步提交，避免“大而全”PR。
- 不要在 PR 中夹带无关重构。

## 安全与隐私

- 不要提交真实密钥、生产地址、账号密码。
- 涉及配置请使用 `.env.local`，并同步更新 `.env.example`。
