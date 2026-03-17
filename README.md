# Local Preference Dataset Viewer

一个用于本地查看和对比 LLM 评估数据集的现代化 Web 界面，支持多模型输出对比、指标分析、交互式筛选和深色模式。

![Dataset Viewer Screenshot](./screenshot.png)

---

## 📋 目录

- [功能特性](#-功能特性)
- [快速开始](#-快速开始)
- [项目结构](#-项目结构)
- [数据格式](#-数据格式)
- [使用指南](#-使用指南)
- [键盘快捷键](#-键盘快捷键)
- [API 文档](#-api-文档)
- [开发指南](#-开发指南)
- [故障排查](#-故障排查)

---

## ✨ 功能特性

| 功能 | 描述 |
|------|------|
| 📊 **多数据集支持** | 同时加载和浏览多个 JSONL 评估数据集 |
| 📤 **文件上传** | 支持拖拽上传 JSONL 文件，自动解析 |
| 🤖 **模型对比** | 并排对比多个模型的输出结果 |
| 📈 **统计分析** | 准确率、胜率、评分排名等多维度统计 |
| 🎯 **头对头对比** | 对比两个特定模型在相同样本上的表现 |
| 💬 **对话视图** | 查看完整的对话上下文（system/user/assistant） |
| 🏷️ **标签筛选** | 按错误标签和类别筛选样本 |
| 🔍 **高级筛选** | 支持模型、语言、数据集、评分范围等多条件筛选 |
| 📝 **评估反馈** | 显示 AI 评估器反馈（G0, G1 等）及分类结果 |
| 🌙 **深色模式** | 完整的深色主题支持，保护眼睛 |
| 📱 **响应式 UI** | 基于 Tailwind CSS 的现代化界面 |
| 🚀 **静态导出** | 生成可独立运行的 HTML 文件，便于分享 |

---

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装

```bash
git clone https://github.com/CilieTe/dataset_viewer.git
cd dataset_viewer
npm install
```

### 运行开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 构建生产版本

```bash
npm run build
```

---

## 📁 项目结构

```
dataset_viewer/
├── dataset/                    # 数据集目录（放置 JSONL 文件）
├── uploads/                    # 上传文件临时存储
├── src/
│   ├── components/             # React 组件
│   │   ├── Sidebar/            # 侧边栏组件
│   │   │   ├── index.tsx       # 侧边栏主组件
│   │   │   ├── DatasetPanel.tsx   # 数据集面板
│   │   │   ├── FilterPanel.tsx    # 筛选面板
│   │   │   ├── SearchPanel.tsx    # 搜索面板
│   │   │   ├── SettingsPanel.tsx  # 设置面板
│   │   │   ├── EvaluationPanel.tsx # 评估面板
│   │   │   ├── EditorPanel.tsx    # 编辑器面板
│   │   │   └── SidebarToggle.tsx  # 侧边栏切换按钮
│   │   ├── DataTable.tsx       # 数据表格组件
│   │   ├── ConversationDrawer.tsx # 对话详情抽屉
│   │   ├── EvaluationView.tsx  # 评估仪表板
│   │   └── SummaryCards.tsx    # 统计概览卡片
│   ├── hooks/                  # 自定义 React Hooks
│   │   └── useFilters.ts       # 筛选状态管理
│   ├── types/                  # TypeScript 类型定义
│   │   └── filters.ts          # 筛选相关类型
│   ├── App.tsx                 # 主应用组件
│   ├── main.tsx                # 应用入口
│   └── index.css               # 全局样式
├── server.ts                   # Express 后端服务
├── index.html                  # 主页面
├── package.json
├── tsconfig.json
├── vite.config.ts
├── postcss.config.js
└── README.md
```

---

## 📄 数据格式

将评估数据集放入 `dataset/` 目录，格式为 JSONL（每行一个 JSON 对象）。

### 数据结构

```json
{
  "id": "dialogue_001",
  "type": "compress",
  "dialog": [
    {
      "turn_index": 0,
      "role": "system",
      "content": "系统提示..."
    },
    {
      "turn_index": 1,
      "role": "user",
      "content": "用户输入..."
    },
    {
      "turn_index": 2,
      "role": "assistant",
      "content": "标准答案...",
      "evaluate": {
        "model-v1": {
          "content": "模型1的输出...",
          "metrics": {
            "meteor": { "score": 0.85 },
            "tool_acc": { "score": 1.0 }
          }
        },
        "model-v2": {
          "content": "模型2的输出...",
          "metrics": {
            "meteor": { "score": 0.72 },
            "tool_acc": { "score": 0.0 }
          }
        }
      }
    }
  ],
  "tools": { },
  "meta": {
    "chat_lang": "en"
  }
}
```

### 必需字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 对话唯一标识 |
| `dialog` | array | 对话轮次数组 |
| `dialog[].role` | string | 角色：`system` / `user` / `assistant` |
| `dialog[].evaluate` | object | 模型输出及指标（仅 assistant 角色） |

### 支持的指标

| 指标 | 说明 | 范围 |
|------|------|------|
| `meteor.score` | METEOR 相似度分数 | 0-1 |
| `tool_acc.score` | 工具调用准确率 | 0 或 1 |
| `match_acc.score` | 响应匹配准确率 | 0-1 |
| `call_halluc_acc.score` | 调用幻觉检测 | 0-1 |
| `ppl.score` | 困惑度 | 0-100 |

---

## 📖 使用指南

### 浏览数据

1. 启动应用后，数据集会自动加载
2. 使用 Previous/Next 按钮分页浏览
3. 点击任意行查看完整对话详情

### 侧边栏模块

点击左侧图标栏的按钮或按键盘 `[` 键打开侧边栏：

- **📁 Datasets**: 选择数据集、上传新文件
- **🔍 Filters**: 按模型、语言、指标源、评分范围筛选
- **🔎 Search**: 按关键词搜索对话内容
- **📊 Evaluation**: 查看统计摘要和模型排名
- **✏️ Editor**: 数据集编辑功能（开发中）
- **⚙️ Settings**: 调整页面大小、切换主题

### 评估仪表板

点击顶部导航的 **Evaluation** 按钮切换到评估视图：

- **Overview**: 统计卡片、模型排名、语言分布
- **Model Comparison**: 选择两个模型进行头对头对比
- **Deep Analysis**: 关键洞察、性能差距分析

### 深色模式

- 点击顶部导航的 🌙/☀️ 图标切换主题
- 支持 Light / Dark / Auto 三种模式
- 主题偏好会自动保存到本地存储

---

## ⌨️ 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `[` | 切换侧边栏面板 |
| `/` | 聚焦搜索框 |
| `Ctrl + ←` | 上一页 |
| `Ctrl + →` | 下一页 |
| `Esc` | 关闭对话详情抽屉 |

---

## 🔌 API 文档

### 端点列表

#### 获取数据集列表
```
GET /api/datasets
```

#### 获取模型列表
```
GET /api/models?dataset={name}
```

#### 获取统计摘要
```
GET /api/schema-summary?dataset={name}&source={metric_source}
```

#### 获取指标来源
```
GET /api/metric-sources
```

#### 分页获取数据
```
GET /api/rows?page={n}&page_size={20}&dataset={name}&models={m1,m2}&languages={en,zh}
```

#### 头对头对比
```
GET /api/compare?modelA={name}&modelB={name}&dataset={name}
```

#### 上传文件
```
POST /api/upload
Content-Type: multipart/form-data

file: <jsonl-file>
```

---

## 🛠️ 开发指南

### 技术栈

- **前端**: React 18 + TypeScript + Tailwind CSS v4
- **后端**: Express + TypeScript
- **构建**: Vite + tsx
- **状态管理**: Zustand (via useFilters hook)

### 开发命令

```bash
# 启动开发服务器（同时启动前端和后端）
npm run dev

# 仅启动前端
npm run dev:client

# 仅启动后端
npm run dev:server

# 类型检查
npm run lint

# 构建生产版本
npm run build
```

### 添加新功能

1. **组件开发**：在 `src/components/` 添加新组件
2. **状态管理**：使用 `src/hooks/useFilters.ts` 或创建新的 hook
3. **API 扩展**：在 `server.ts` 中添加新端点
4. **类型定义**：更新 `src/types/filters.ts` 中的类型
5. **深色模式**：使用 `isDark` prop 和 Tailwind 的 dark: 变体

---

## 🐛 故障排查

### 页面加载但没有数据

- 检查 JSONL 文件是否在 `dataset/` 目录
- 验证 JSONL 格式是否符合要求
- 查看浏览器控制台是否有解析错误

### CORS 错误

- 确保使用 `npm run dev` 启动完整开发服务器
- 前端和后端使用相同的端口（3000）

### 大数据集处理

对于 GB 级别的数据集：
- 拆分为多个 JSONL 文件
- 增加 Node.js 内存限制：`NODE_OPTIONS="--max-old-space-size=4096"`

### 上传失败

- 确保文件扩展名为 `.jsonl`
- 检查文件大小是否超过 50MB 限制
- 验证 JSONL 格式正确

### 深色模式不生效

- 检查浏览器是否支持 `localStorage`
- 清除浏览器缓存后重试
- 检查 `document.documentElement` 是否有 `dark` 类

---

## 📝 更新日志

### v2.0.0 (2025-03-17)

- ✨ 全新设计的侧边栏，支持可折叠面板
- 🌙 完整的深色模式支持
- 📊 新增评估仪表板，包含模型对比和深度分析
- 📁 新增数据集管理面板，支持文件上传
- ⚡ 改进性能和用户体验
- 🎨 更新顶部导航，添加实用快捷操作

### v1.0.0

- 🎉 初始版本发布
- 📊 多数据集支持
- 🤖 模型对比功能
- 🔍 高级筛选

---

## 📄 许可证

MIT License

---

## 🙏 致谢

- [React](https://react.dev/) - 用户界面库
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Vite](https://vitejs.dev/) - 构建工具
- [Express](https://expressjs.com/) - Web 框架
- METEOR metric creators

---

## 🔗 相关链接

- [GitHub 仓库](https://github.com/CilieTe/dataset_viewer)
- [OpenClaw](https://openclaw.ai/) - AI Agent 框架
- [ClawHub](https://clawhub.ai/) - Agent Skill 仓库
