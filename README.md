<div align="center">

<img src="frontend/public/favicon.svg" alt="DPverse Logo" width="120" />

# DPverse —— 泛癌种功能数字化病人库

**Pan-cancer Functional Digital Patient Library**

[![React](https://img.shields.io/badge/React-19.2-61dafb?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![ECharts](https://img.shields.io/badge/ECharts-6.1-ca3c25?style=flat-square&logo=apacheecharts)](https://echarts.apache.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![Zustand](https://img.shields.io/badge/Zustand-5.0-8b5cf6?style=flat-square)](https://zustand.docs.pmnd.rs)
[![D3.js](https://img.shields.io/badge/D3.js-7.9-f9a03c?style=flat-square&logo=d3dotjs)](https://d3js.org)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

</div>

---

## 📖 项目简介

**DPverse** 是面向药物研发和临床研究的泛癌种数字患者数据库。基于哲源科技独家数据驱动 AI 算法 **DAGG**（Data-driven Analysis of Genotype-to-phenotype Graphs），将真实世界肿瘤患者的基因组测序数据转化为 **500 余种细胞功能与信号通路的活性图谱（APSPs）**，实现从癌种到通路到基因的患者数字孪生建模，支撑虚拟临床试验和新适应症预测。

### 核心价值

- 🧬 **数字孪生建模** — 每个患者映射为 500+ 维信号通路活性图谱
- 🔬 **虚拟临床试验** — 18 种药物机制 × 25 种癌种的患者响应预测
- 🎯 **四层数据钻取** — 癌种全景 → 信号通路 → 具体基因 → 数字孪生患者
- ⚡ **实时交互分析** — WebSocket 推送 AI 计算结果，页面响应 < 200ms

---

## 🏗️ 系统架构

```
┌──────────────────────────────────────────────────────────────┐
│                     DPverse Platform                          │
├──────────────────────────┬───────────────────────────────────┤
│        Frontend          │           Backend                 │
│   React 18 + TypeScript  │     Python FastAPI                │
│                          │                                   │
│  ┌──────────────────┐    │   ┌───────────────────────────┐   │
│  │   Dashboard       │    │   │   REST API Routes         │   │
│  │   总览仪表盘       │    │   │   /api/patients           │   │
│  └──────────────────┘    │   │   /api/pathways            │   │
│  ┌──────────────────┐    │   │   /api/genes               │   │
│  │   Pathway View    │    │   │   /api/moa                │   │
│  │   通路活性图谱     │◄───┼──►│   /api/compute            │   │
│  │   四层钻取        │    │   └───────────────────────────┘   │
│  └──────────────────┘    │   ┌───────────────────────────┐   │
│  ┌──────────────────┐    │   │   WebSocket /ws           │   │
│  │   MOA Analysis    │    │   │   实时任务推送             │   │
│  │   虚拟试验分析     │    │   └───────────────────────────┘   │
│  └──────────────────┘    │   ┌───────────────────────────┐   │
│  ┌──────────────────┐    │   │   DAGG Engine             │   │
│  │   Patient View    │    │   │   三阶段因果推断           │   │
│  │   虚拟滚动        │    │   │   Mutations → APSP        │   │
│  └──────────────────┘    │   └───────────────────────────┘   │
│  ┌──────────────────┐    │   ┌───────────────────────────┐   │
│  │   AI Assistant    │    │   │   Data Generator          │   │
│  │   AI分析助手      │    │   │   合成数据引擎             │   │
│  └──────────────────┘    │   └───────────────────────────┘   │
├──────────────────────────┴───────────────────────────────────┤
│  State: Zustand (dataStore + appStore)                       │
│  Charts: ECharts (Heatmap, Bar, Radar, Scatter, Line)        │
│  Style: Tailwind CSS + Glassmorphism + Dark/Light Theme       │
│  Data: Seeded PRNG Synthetic Data (~2000 patients)           │
└──────────────────────────────────────────────────────────────┘
```

---

## ✨ 功能特性

### 🧬 通路活性图谱可视化看板

基于 ECharts 开发的泛癌种信号通路活性图谱仪表盘：

- **全景热力图** — 18 类信号通路 × 500+ 通路指标的活性矩阵，蓝-白-红色阶直观展示激活/抑制状态
- **多维度筛选** — 支持 25 种癌种筛选、18 类通路分类切换、关键词搜索
- **四层钻取** — 点击热力图进入 癌种→通路→基因→患者 的递进分析

```
Level 1: 癌种全景热力图          Level 2: 通路雷达图 + 基因瀑布图
         ↓ 点击格子                          ↓ 点击基因
Level 3: 基因详情 + 患者分布图    Level 4: 患者 APSP + 突变表
```

### 💊 MOA 虚拟试验患者响应统计

药物作用机制虚拟试验可视化模块：

- **18 种 MOA 分类** — 靶向治疗、免疫治疗、化疗、内分泌治疗、表观遗传、细胞治疗
- **响应率对比** — 各癌种响应率排序柱状图（绿/黄/红智能色阶）
- **患者画像** — 响应者/非响应者堆叠条形图
- **生物标志物** — TP53_mut、KRAS_mut、TMB_H、PDL1_pos 富集倍数展示

### 🤖 AI 分析助手

自然语言交互式数据查询与分析：

- 通路活性差异分析
- 基因突变频率查询
- 药物响应预测评估
- 患者库特征统计

### ⚡ 高性能数据渲染

- **React.memo** + **useMemo** + **useCallback** — 精细化控制组件重渲染
- **虚拟滚动** — 基于 `@tanstack/react-virtual`，2000+ 患者 < 200ms 响应
- **代码分割** — `React.lazy()` 按需加载 6 个页面模块
- **ECharts 按需引入** — 仅打包使用的图表类型，减少 ~700KB 体积

### 🔗 WebSocket 实时推送

- 后端 AI 批量计算进度实时同步
- 心跳保活 + 指数退避自动重连
- 任务生命周期管理（queued → running → completed/failed）

---

## 🚀 快速启动

### 环境要求

- **Node.js** ≥ 18
- **Python** ≥ 3.10
- **npm** ≥ 9

### 1. 启动后端

```bash
cd backend
pip install -r requirements.txt
python run.py --port 8000
```

后端将在 http://localhost:8000 启动

| 地址 | 说明 |
|------|------|
| http://localhost:8000 | API 服务 |
| http://localhost:8000/docs | Swagger API 文档 |
| ws://localhost:8000/ws | WebSocket 端点 |

### 2. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端将在 http://localhost:5173 启动

> **提示**：前端内置了合成数据生成器，即使不启动后端也可以独立运行查看效果。但 WebSocket 实时推送、后端 API 等功能需要后端服务支持。

---

## 📁 项目结构

```
DPverse/
├── README.md
├── .gitignore
│
├── frontend/                         # React 前端
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/               # AppLayout, Header, Sidebar
│   │   │   ├── dashboard/            # 总览仪表盘
│   │   │   ├── pathway/              # 通路活性图谱 (四层钻取核心)
│   │   │   ├── moa/                  # MOA 虚拟试验分析
│   │   │   ├── patient/              # 患者管理 (虚拟滚动)
│   │   │   ├── gene/                 # 基因分析
│   │   │   └── ai/                   # AI 分析助手
│   │   ├── stores/                   # Zustand 状态管理
│   │   │   ├── dataStore.ts          # 业务数据状态
│   │   │   └── appStore.ts           # UI 状态
│   │   ├── hooks/                    # 自定义 Hooks
│   │   │   ├── useDataLoader.ts      # 数据加载 + 分页
│   │   │   └── useWebSocket.ts       # WebSocket 连接
│   │   ├── services/                 # API 服务层
│   │   │   ├── api.ts                # REST API 封装
│   │   │   └── websocket.ts          # WebSocket 客户端
│   │   ├── types/                    # TypeScript 类型定义
│   │   ├── data/                     # 前端合成数据生成器
│   │   └── doc/                      # 前端架构文档 📖
│   │       ├── architecture.md       # 前端架构总览
│   │       ├── components.md         # 组件设计详解
│   │       ├── state-management.md   # 状态管理设计
│   │       └── performance.md        # 性能优化策略
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
└── backend/                          # Python 后端
    ├── run.py                        # 启动入口
    ├── requirements.txt
    └── app/
        ├── main.py                   # FastAPI 应用 + WebSocket
        ├── core/
        │   ├── config.py             # 全局配置
        │   └── dag_engine.py         # DAGG 因果网络引擎
        ├── models/                   # Pydantic 数据模型
        ├── data/
        │   └── generator.py          # 合成数据生成器
        ├── api/routes/               # API 路由
        │   ├── patients.py
        │   ├── pathways.py
        │   ├── genes.py
        │   ├── moa.py
        │   └── ws.py
        └── doc/                      # 后端架构文档 📖
            ├── architecture.md       # 后端架构总览
            ├── dagg-engine.md        # DAGG 算法设计
            ├── data-model.md         # 数据模型设计
            └── api-design.md         # API & WebSocket 设计
```

---

## 🔬 DAGG 算法

DAGG（Data-driven Analysis of Genotype-to-phenotype Graphs）是一个三阶段因果推断引擎：

```
输入: 患者基因组突变
  │
  ▼
Stage 1: Genotype Layer (基因型层)
  突变位点 → 基因级影响评分
  • 突变类型权重 (nonsense > frameshift > missense)
  • VAF 克隆性因子
  • 癌基因/抑癌基因方向
  │
  ▼
Stage 2: Pathway Layer (通路层)
  基因影响 → 通路活性
  • 基因-通路邻接矩阵传播
  • 衰减因子 = 1 / (√n + 1)
  • tanh 归一化至 [-1, 1]
  │
  ▼
Stage 3: Phenotype Layer (表型层)
  通路活性 → 500+ 维细胞功能谱
  • 通路-功能加权聚合
  • 高斯噪声模拟生物随机性
  │
  ▼
输出: APSP 活性图谱
  {pathway_activities, cell_functions, signature}
```

> 📖 详细设计见 [backend/app/doc/dagg-engine.md](backend/app/doc/dagg-engine.md)

---

## 📊 数据规模

| 实体 | 数量 |
|------|------|
| 数字孪生患者 | 2,000 |
| 信号通路 | ~500 (18 类别) |
| 基因 | ~564 (64 已知 + 500 新) |
| 细胞功能指标 | 500 |
| 药物作用机制 | 18 |
| 支持癌种 | 25 |
| 每患者突变数 | 5-50 |

---

## 🎨 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端框架 | React 19.2 + TypeScript 6.0 | SPA 应用 |
| 构建工具 | Vite 8.0 | 开发体验与构建 |
| 可视化 | ECharts 6.1 + D3.js 7.9 | 图表渲染与数据转换 |
| 状态管理 | Zustand 5.0 | 轻量全局状态 |
| 样式 | Tailwind CSS 3.4 | 原子化 CSS + 暗色模式 |
| 虚拟滚动 | @tanstack/react-virtual | 大数据列表优化 |
| 动画 | Framer Motion 12.40 | UI 过渡动画 |
| 图标 | Lucide React 1.17 | SVG 图标 |
| 后端框架 | FastAPI 0.115 | 异步 Web 框架 |
| 服务器 | Uvicorn 0.30 | ASGI 高性能服务 |
| 实时通信 | WebSocket (websockets 12.0) | 双向实时推送 |
| 数值计算 | NumPy 1.26 | 矩阵运算 |

---

## 📖 文档

- [前端架构总览](frontend/doc/architecture.md) — 技术选型、项目结构、路由设计
- [组件设计详解](frontend/doc/components.md) — 组件树、四层钻取、样式系统
- [状态管理设计](frontend/doc/state-management.md) — Zustand 双 Store 模式、数据流
- [性能优化策略](frontend/doc/performance.md) — 虚拟滚动、代码分割、渲染优化
- [后端架构总览](backend/app/doc/architecture.md) — API 设计、启动流程
- [DAGG 算法设计](backend/app/doc/dagg-engine.md) — 三阶段因果推断引擎
- [数据模型设计](backend/app/doc/data-model.md) — 实体关系、枚举类型
- [API & WebSocket 设计](backend/app/doc/api-design.md) — 接口规范、通信协议

---

## 🗺️ 路线图

- [x] 通路活性图谱四层钻取
- [x] MOA 虚拟试验响应分析
- [x] AI 分析助手
- [x] WebSocket 实时任务推送
- [x] 虚拟滚动大数据渲染
- [x] 暗色/亮色主题切换
- [ ] 真实 TCGA/ICGC 数据集成
- [ ] 图神经网络增强 DAGG
- [ ] 患者相似度搜索
- [ ] 多组学数据整合
- [ ] Docker 容器化部署
- [ ] 端到端测试覆盖

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request。

---

<div align="center">
  <sub>Built with ❤️ for precision oncology research</sub>
</div>
