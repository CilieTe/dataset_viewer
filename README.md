# Local Preference Dataset Viewer

一个用于本地查看和对比 LLM 评估数据集的轻量级 Web 界面，支持多模型输出对比、指标分析和交互式筛选。

![Dataset Viewer Screenshot](./screenshot.png)

---

## 📋 目录

- [功能特性](#-功能特性)
- [快速开始](#-快速开始)
- [项目结构](#-项目结构)
- [数据格式](#-数据格式)
- [使用指南](#-使用指南)
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
| 📱 **响应式 UI** | 基于 Tailwind CSS 的现代化界面 |
| 🚀 **静态导出** | 生成可独立运行的 HTML 文件，便于分享 |

---

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装

```bash
git clone <repository-url>
cd local-preference-dataset-viewer
npm install
```

### 运行开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 构建静态版本

```bash
node build-static.js
```

生成 `viewer-static.html`，可直接在浏览器中打开，无需服务器。

---

## 📁 项目结构

```
local-preference-dataset-viewer/
├── dataset/                    # 数据集目录（放置 JSONL 文件）
├── uploads/                    # 上传文件临时存储
├── src/
│   ├── components/             # React 组件
│   │   ├── Sidebar/            # 侧边栏组件
│   │   │   ├── index.tsx       # 侧边栏主组件
│   │   │   ├── FilterPanel.tsx # 筛选面板
│   │   │   ├── SearchPanel.tsx # 搜索面板
│   │   │   ├── SettingsPanel.tsx # 设置面板
│   │   │   ├── EditorPanel.tsx   # 编辑器面板
│   │   │   └── SidebarToggle.tsx # 侧边栏切换按钮
│   │   ├── DataTable.tsx       # 数据表格组件
│   │   ├── ConversationDrawer.tsx # 对话详情抽屉
│   │   └── SummaryCards.tsx    # 统计概览卡片
│   ├── hooks/                  # 自定义 React Hooks
│   │   └── useFilters.ts       # 筛选状态管理
│   ├── types/                  # TypeScript 类型定义
│   │   └── filters.ts          # 筛选相关类型
│   ├── App.tsx                 # 主应用组件
│   ├── main.tsx                # 应用入口
│   └── index.css               # 全局样式
├── server.ts                   # Express 后端服务
├── build-static.js             # 静态构建脚本
├── index.html                  # 主页面（开发模式）
├── viewer-static.html          # 生成的静态页面
├── package.json
├── tsconfig.json
├── vite.config.ts
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
  "tools": { ... },
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

---

## 📖 使用指南

### 浏览数据

1. 从下拉菜单选择数据集（或选择 "All Datasets" 查看全部）
2. 使用 Previous/Next 按钮分页浏览
3. 点击任意行查看完整对话详情

### 筛选数据

点击左上角的 `[` 按钮或按键盘 `[` 键打开侧边栏：

- **Filters**: 按模型、语言、数据集筛选
- **Search**: 按关键词搜索
- **Settings**: 调整页面大小等设置

### 模型对比

1. 在侧边栏选择要对比的模型
2. 表格会显示各模型的评分和输出
3. 点击行查看详细对比

### 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `[` | 切换侧边栏 |
| `/` | 聚焦搜索框 |
| `Ctrl + ←` | 上一页 |
| `Ctrl + →` | 下一页 |

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

- **前端**: React 18 + TypeScript + Tailwind CSS
- **后端**: Express + TypeScript
- **构建**: Vite + tsx

### 开发命令

```bash
# 启动开发服务器
npm run dev

# 类型检查
npm run lint

# 构建静态版本
node build-static.js
```

### 添加新功能

1. 组件开发：在 `src/components/` 添加新组件
2. 状态管理：使用 `src/hooks/` 中的自定义 hooks
3. API 扩展：在 `server.ts` 中添加新端点
4. 类型定义：更新 `src/types/` 中的类型文件

---

## 🐛 故障排查

### 页面加载但没有数据

- 检查 JSONL 文件是否在 `dataset/` 目录
- 验证 JSONL 格式是否符合要求
- 查看浏览器控制台是否有解析错误

### CORS 错误

- 确保服务器正在运行
- 或使用静态 HTML 导出版本

### 大数据集处理

对于 GB 级别的数据集：
- 拆分为多个 JSONL 文件
- 增加 Node.js 内存限制：`NODE_OPTIONS="--max-old-space-size=4096"`

### 上传失败

- 确保文件扩展名为 `.jsonl`
- 检查文件大小是否超过 50MB 限制
- 验证 JSONL 格式正确

---

## 📝 许可证

MIT License

---

## 🙏 致谢

- React Team
- Tailwind CSS
- METEOR metric creators
