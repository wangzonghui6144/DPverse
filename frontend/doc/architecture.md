# DPverse Frontend Architecture

## Overview

DPverse 前端是一个基于 React 18 + TypeScript 的单页应用（SPA），专注于泛癌种功能数字化病人库的数据可视化与交互分析。应用采用模块化组件架构，通过 Zustand 进行全局状态管理，ECharts 驱动数据可视化，WebSocket 实现实时通信。

## Tech Stack

| 层级 | 技术选型 | 版本 | 用途 |
|------|---------|------|------|
| 框架 | React | 19.2 | UI 组件框架 |
| 语言 | TypeScript | 6.0 | 类型安全 |
| 构建 | Vite | 8.0 | 开发与构建 |
| 可视化 | ECharts | 6.1 | 核心图表渲染 |
| 可视化 | D3.js | 7.9 | 辅助数据转换 |
| 状态管理 | Zustand | 5.0 | 全局状态 |
| 样式 | Tailwind CSS | 3.4 | 原子化 CSS |
| 路由 | React Router | 7.16 | 客户端路由 |
| 虚拟滚动 | @tanstack/react-virtual | 3.14 | 大数据列表渲染 |
| 动画 | Framer Motion | 12.40 | 过渡动画 |
| 图标 | Lucide React | 1.17 | SVG 图标库 |

## Project Structure

```
frontend/
├── src/
│   ├── main.tsx                    # 应用入口
│   ├── App.tsx                     # 路由配置 + 懒加载
│   ├── index.css                   # Tailwind + 全局样式
│   ├── types/
│   │   └── index.ts                # 核心类型定义（238行）
│   ├── stores/
│   │   ├── dataStore.ts            # 数据状态（患者、通路、基因、MOA）
│   │   └── appStore.ts             # 应用状态（主题、筛选、钻取）
│   ├── hooks/
│   │   ├── useDataLoader.ts        # 数据初始化和分页加载
│   │   └── useWebSocket.ts         # WebSocket 连接管理
│   ├── services/
│   │   ├── api.ts                  # REST API 封装
│   │   └── websocket.ts            # WebSocket 客户端（单例）
│   ├── data/
│   │   └── generator.ts            # 合成数据生成器（260行）
│   └── components/
│       ├── layout/
│       │   ├── AppLayout.tsx        # 布局容器（Sidebar + Header + Outlet）
│       │   ├── Sidebar.tsx          # 侧边栏导航（176行）
│       │   └── Header.tsx           # 顶部状态栏（89行）
│       ├── dashboard/
│       │   └── DashboardPage.tsx    # 总览仪表盘（285行）
│       ├── pathway/
│       │   └── PathwayPage.tsx      # 通路活性图谱（四层钻取，599行）
│       ├── moa/
│       │   └── MOAPage.tsx          # MOA虚拟试验（314行）
│       ├── patient/
│       │   └── PatientPage.tsx      # 患者管理（虚拟滚动，282行）
│       ├── gene/
│       │   └── GenePage.tsx         # 基因分析
│       └── ai/
│           └── AIPage.tsx           # AI分析助手（193行）
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
└── postcss.config.js
```

## Architecture Decisions

### 1. 双 Store 模式 (Separation of Concerns)

将状态分为 `dataStore` 和 `appStore`：
- **dataStore**：管理业务数据（患者、通路、基因、MOA结果、计算任务）
- **appStore**：管理 UI 状态（主题、侧边栏、筛选器、钻取层级、WebSocket 连接）

这种分离避免了单一 store 的膨胀，使状态更新更可预测。

### 2. 组件懒加载 (Code Splitting)

所有页面组件通过 `React.lazy()` 动态导入，配合 `Suspense` 实现代码分割：

```typescript
const DashboardPage = lazy(() => import('./components/dashboard/DashboardPage'))
```

这使得初始包体积最小化，各页面按需加载。

### 3. 性能优化三件套

- **React.memo**：所有展示组件使用 memo 包裹（StatCard, PatientRow, ChatBubble 等）
- **useMemo**：图表配置对象（heatmapOption, barOption 等）全部 memo 化
- **useCallback**：事件处理函数稳定引用（handleCellClick, handleGeneClick 等）

### 4. 前端数据自给自足 (Offline-First)

`data/generator.ts` 使用 seeded PRNG 生成确定性的合成数据，使得前端可以不依赖后端独立运行。这在开发和演示场景中非常重要。同时 API 层 (`services/api.ts`) 也支持从后端获取数据，实现了灵活的数据源切换。

### 5. ECharts 按需引入 (Tree Shaking)

不引入整个 echarts 包，而是按需引入图表类型和组件：

```typescript
import { HeatmapChart, BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
```

这显著减少了打包体积。

## Data Flow

```
用户交互 → AppStore (筛选条件变更)
         → DataStore (触发数据加载)
         → useDataLoader Hook (数据请求/生成)
         → API Service / Generator (数据源)
         → DataStore.setState (更新store)
         → React 重渲染 (订阅组件更新)
         → ECharts 图表更新
```

## Route Design

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | DashboardPage | 总览仪表盘 |
| `/pathway` | PathwayPage | 通路活性图谱（四层钻取） |
| `/moa` | MOAPage | MOA虚拟试验分析 |
| `/patients` | PatientPage | 患者列表（虚拟滚动） |
| `/genes` | GenePage | 基因分析 |
| `/ai` | AIPage | AI分析助手 |

所有路由嵌套在 `AppLayout` 下，共享 Sidebar + Header 布局。
