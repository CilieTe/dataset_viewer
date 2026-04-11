# Dataset Viewer - 敏捷开发文档

> 目标：让新需求实现时，能够**5分钟内定位到改动位置**，做**最小幅度修改**

---

## 1. 项目概览

**项目类型**: React + Express 全栈应用  
**核心功能**: 多模型评测数据集的可视化浏览与对比分析  
**技术栈**: React 18 + TypeScript + Tailwind CSS + Express + Multer

```
用户场景：
├── 上传 JSONL 评测数据集
├── 多模型横向对比（并排显示各模型回复）
├── 按指标过滤（METEOR、Tool Accuracy、Evaluation Tags 等）
├── 查看完整对话上下文
└── 导出分析结果
```

---

## 2. 架构分层图

```
┌─────────────────────────────────────────────────────────────┐
│                      前端 (React)                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────────┐  │
│  │  App.tsx │← │useFilters│  │     DataTable.tsx        │  │
│  │ 主容器   │  │状态管理  │  │     数据表格渲染          │  │
│  └────┬─────┘  └────┬─────┘  └───────────┬──────────────┘  │
│       │             │                    │                 │
│  ┌────▼─────────────▼────────────────────▼──────────┐      │
│  │              Sidebar/index.tsx                    │      │
│  │  ┌──────────┬──────────┬──────────┬──────────┐   │      │
│  │  │ Dataset  │ Filter   │ Search   │ Settings │   │      │
│  │  │ Panel    │ Panel    │ Panel    │ Panel    │   │      │
│  │  └──────────┴──────────┴──────────┴──────────┘   │      │
│  └──────────────────────────────────────────────────┘      │
└──────────────────────────┬──────────────────────────────────┘
                           │ API 调用
┌──────────────────────────▼──────────────────────────────────┐
│                    后端 (Express)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ /api/rows    │  │ /api/datasets│  │ /api/upload  │      │
│  │ 分页数据     │  │ 数据集列表   │  │ 文件上传     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              server.ts (核心数据处理)                 │  │
│  │  • loadDatasetFile()    - 加载 JSONL                │  │
│  │  • convertToRows()      - 数据扁平化                │  │
│  │  • getRows()            - 过滤查询                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 文件职责矩阵

### 3.1 按功能定位

| 功能需求 | 前端文件 | 后端文件 | 备注 |
|---------|---------|---------|------|
| **添加新的筛选条件** | `src/types/filters.ts`<br>`src/hooks/useFilters.ts`<br>`src/components/Sidebar/FilterPanel.tsx` | `server.ts`<br>→ `/api/rows` 路由 | 1. 类型定义<br>2. 状态管理<br>3. UI 控件<br>4. API 过滤逻辑 |
| **修改指标显示逻辑** | `src/types/filters.ts`<br>`METRIC_CONFIG`<br>`src/components/DataTable.tsx`<br>`getScoreBackground()` | - | 新增指标需在 METRIC_CONFIG 注册 |
| **修改表格列布局** | `src/components/DataTable.tsx` | - | 修改 colgroup 和表头 |
| **添加 Sidebar 模块** | `src/types/filters.ts`<br>`SidebarModule`<br>`src/components/Sidebar/index.tsx`<br>新增 Panel 组件 | - | 1. 类型扩展<br>2. 渲染逻辑<br>3. 新建 Panel 文件 |
| **修改数据加载逻辑** | - | `server.ts`<br>`loadDatasetFile()`<br>`convertToRows()` | 数据解析和扁平化 |
| **修改搜索逻辑** | `src/components/Sidebar/SearchPanel.tsx` | `server.ts`<br>→ `/api/rows` 中的 search 逻辑 | 前后端需同步修改 |
| **添加新的数据导出格式** | `src/components/DataTable.tsx` 或<br>新增导出按钮组件 | 新增 API 路由 | 建议后端做导出处理 |

### 3.2 核心文件速查

#### 📁 类型定义
```typescript
// src/types/filters.ts
FilterState          // 所有筛选条件的状态接口
METRIC_CONFIG        // 指标配置（范围、步长、标签）
SidebarModule        // Sidebar 模块类型
```

#### 📁 状态管理
```typescript
// src/hooks/useFilters.ts
useFilters()         // 筛选状态 Hook，含 localStorage 持久化
├─ filters           // 当前状态
├─ setXxx()          // 各筛选条件 setter
└─ resetFilters()    // 重置所有筛选
```

#### 📁 组件层级
```
App.tsx
├── Sidebar/index.tsx           // 侧边栏容器
│   ├── SidebarToggle.tsx       // 图标栏切换
│   ├── DatasetPanel.tsx        // 数据集选择
│   ├── FilterPanel.tsx         // 筛选面板 ⭐高频改动
│   ├── SearchPanel.tsx         // 搜索面板
│   ├── SettingsPanel.tsx       // 设置面板
│   ├── EvaluationPanel.tsx     // 评测统计
│   └── EditorPanel.tsx         // 编辑器（预留）
├── DataTable.tsx               // 主表格 ⭐高频改动
├── ConversationDrawer.tsx      // 详情抽屉
└── EvaluationView.tsx          // 评测视图
```

---

## 4. 常见需求改动指南

### 4.1 添加新的筛选维度

**示例：添加 "时间范围" 筛选**

```typescript
// 步骤 1: 类型定义 (src/types/filters.ts)
export interface FilterState {
  // ... 现有字段
  timeRange: [Date, Date];  // ← 新增
}

// 步骤 2: 默认值 (src/hooks/useFilters.ts)
const defaultFilters: FilterState = {
  // ... 现有字段
  timeRange: [new Date(0), new Date()],  // ← 新增
};

// 步骤 3: 添加 setter (src/hooks/useFilters.ts)
const setTimeRange = useCallback((timeRange: [Date, Date]) => {
  setFilters(prev => ({ ...prev, timeRange }));
}, []);

// 步骤 4: UI 控件 (src/components/Sidebar/FilterPanel.tsx)
// 在合适位置添加日期选择器

// 步骤 5: API 过滤 (server.ts → /api/rows)
const timeRange = /* 解析参数 */;
if (timeRange) {
  rows = rows.filter(row => {
    const rowTime = new Date(row.timestamp);  // 假设数据有时间字段
    return rowTime >= timeRange[0] && rowTime <= timeRange[1];
  });
}
```

### 4.2 添加新的指标类型

**示例：添加 "BLEU Score" 指标**

```typescript
// 步骤 1: 配置指标 (src/types/filters.ts)
export const METRIC_CONFIG: Record<string, MetricConfig> = {
  // ... 现有指标
  bleu: { 
    min: 0, 
    max: 1, 
    step: 0.01, 
    label: 'BLEU Score', 
    unit: '' 
  },
};

// 步骤 2: 后端数据解析 (server.ts → convertToRows())
// 确保数据中有 score_bleu_xxx 字段

// 步骤 3: 表格显示样式 (src/components/DataTable.tsx → getScoreBackground())
// 如需特殊样式，添加 bleu 的处理分支

// 步骤 4: 状态显示 (src/components/DataTable.tsx → getStatusDisplay())
// 如需特殊状态显示，添加 bleu 的处理分支
```

### 4.3 修改表格列宽

```typescript
// src/components/DataTable.tsx
// 修改以下三个地方：

// 1. 固定列宽常量
const fixedWidth = 460;  // 180 + 280，修改这里
const modelMinWidth = 320;  // 每列最小宽度

// 2. colgroup 定义
<colgroup>
  <col style={{ width: '180px' }} />      // ← Metadata 列
  <col style={{ width: '280px' }} />      // ← Context 列
  {models.map((model) => (
    <col key={model.suffix} style={{ width: `${100 / modelCount}%` }} />
  ))}
</colgroup>

// 3. 表头定义
<th className="p-3 font-medium">Metadata</th>
<th className="p-3 font-medium">Context</th>
```

### 4.4 添加新的 Sidebar 模块

**示例：添加 "导出" 模块**

```typescript
// 步骤 1: 类型定义 (src/types/filters.ts)
export type SidebarModule = 
  | 'datasets' 
  | 'filters' 
  | 'search' 
  | 'settings' 
  | 'editor' 
  | 'evaluation'
  | 'export';  // ← 新增

// 步骤 2: 创建组件 (src/components/Sidebar/ExportPanel.tsx)
export function ExportPanel({ isDark }: { isDark?: boolean }) {
  // 导出功能实现
}

// 步骤 3: 注册到 Sidebar (src/components/Sidebar/index.tsx)
import { ExportPanel } from './ExportPanel';

const renderPanel = () => {
  switch (activeModule) {
    // ... 现有 case
    case 'export':
      return <ExportPanel isDark={isDark} />;
  }
};

// 步骤 4: 添加切换按钮 (src/components/Sidebar/SidebarToggle.tsx)
// 在图标栏添加导出图标按钮
```

### 4.5 修改数据解析逻辑

**示例：支持新的数据字段**

```typescript
// server.ts → convertToRows()

interface ParsedRow {
  // ... 现有字段
  newField?: string;  // ← 新增字段
}

for (const item of data) {
  // ... 现有处理
  
  const row: ParsedRow = {
    // ... 现有字段
    newField: item.meta?.new_field,  // ← 从原始数据提取
  };
  
  // 如果是模型相关的字段
  if (turn.evaluate) {
    for (const [modelName, output] of Object.entries(turn.evaluate)) {
      const suffix = modelName.replace(/[^a-zA-Z0-9]/g, '_');
      row[`new_metric_${suffix}`] = output.new_metric;  // ← 模型相关字段
    }
  }
}
```

---

## 5. 数据流说明

### 5.1 应用启动时

```
server.ts
  └── loadAllDatasets()           # 扫描 dataset/ 目录
        └── loadDatasetFile()     # 逐个加载 JSONL
              └── convertToRows() # 解析并扁平化数据
                    └── datasets  # 存入内存缓存
```

### 5.2 页面加载时

```
App.tsx (useEffect)
  ├── fetchMetricSources()        # 获取可用指标源
  ├── fetchSummary()              # 获取统计概览
  │     └── /api/schema-summary
  └── fetchData()                 # 获取表格数据
        └── /api/rows
```

### 5.3 筛选条件变化时

```
用户操作
  ↓
FilterPanel.tsx → onXxxChange()
  ↓
useFilters.ts → setXxx() → localStorage 保存
  ↓
App.tsx useEffect 监听 filters 变化
  ↓
fetchData(1, pageSize)  # 重置到第一页
  ↓
setData() → DataTable 重新渲染
```

---

## 6. 扩展点说明

### 6.1 添加新的数据可视化

**位置**: `src/components/EvaluationView.tsx` 或新建组件

**建议**: 将图表逻辑与数据获取分离，通过 props 传入 summary 数据

### 6.2 添加批量操作

**前端**: 在 `DataTable.tsx` 添加多选列，在 `Sidebar` 添加批量操作面板  
**后端**: 新增 `/api/batch` 路由处理批量请求

### 6.3 添加数据导出

**前端**: 在 `FilterPanel.tsx` 或新建 `ExportPanel.tsx` 添加导出按钮  
**后端**: 新增 `/api/export` 路由，支持 CSV/JSON 格式

---

## 7. 调试技巧

### 7.1 前端调试

```typescript
// 查看当前筛选状态
console.log('Current filters:', filters);

// 查看 API 请求
// 浏览器 DevTools → Network → 查看 /api/rows 请求参数
```

### 7.2 后端调试

```typescript
// server.ts 已内置详细日志
console.log(`[API /api/rows] page=${page}, ...`);

// 查看过滤前后的行数变化
console.log(`[API /api/rows] Metric filter: ${beforeCount} -> ${rows.length} rows`);
```

### 7.3 数据结构检查

```typescript
// 查看扁平化后的数据结构
// 浏览器 Console → Network → /api/rows → Preview
// 或访问 http://localhost:3000/api/rows?page=1&page_size=5
```

---

## 8. 注意事项

### 8.1 命名规范

- **模型字段**: `model_${suffix}`, `conversation_${suffix}`, `score_${metric}_${suffix}`
- **指标键名**: 使用 METRIC_CONFIG 中的键，保持一致性
- **后缀生成**: `modelName.replace(/[^a-zA-Z0-9]/g, '_')`

### 8.2 性能考虑

- 数据全部加载到内存，适合万级数据量
- 分页在服务端完成，减少前端渲染压力
- 筛选条件变化时自动重置到第一页

### 8.3 数据格式兼容性

当前支持两种数据格式：
1. `turn.evaluate` - 标准模型评测格式
2. `turn.review.review` - Guide 评测格式（含 guide/G0/G1 等）

添加新格式时，在 `convertToRows()` 中添加处理分支。

---

## 9. 快速参考卡

```
┌────────────────────────────────────────────────────┐
│ 我要修改...              │  去这里                  │
├────────────────────────────────────────────────────┤
│ 添加筛选条件             │  types/ + hooks/ + Panel │
│ 修改指标范围/显示        │  METRIC_CONFIG           │
│ 修改表格样式             │  DataTable.tsx           │
│ 修改 Sidebar 模块        │  Sidebar/index.tsx       │
│ 添加新页面/视图          │  App.tsx + 新组件        │
│ 修改数据解析             │  server.ts               │
│ 修改 API 响应            │  server.ts 路由部分      │
│ 添加键盘快捷键           │  App.tsx useEffect       │
└────────────────────────────────────────────────────┘
```

---

**最后更新**: 2026-04-11  
**维护者**: 请在此处签名
