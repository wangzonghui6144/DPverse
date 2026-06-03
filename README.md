# DPverse —— 泛癌种功能数字化病人库

[![React](https://img.shields.io/badge/React-18-61dafb?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?logo=typescript)](https://www.typescriptlang.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![ECharts](https://img.shields.io/badge/ECharts-5-ca3c25?logo=apacheecharts)](https://echarts.apache.org)

**面向药物研发和临床研究的泛癌种数字患者数据库**

基于哲源科技独家数据驱动AI算法DAGG（Data-driven Analysis of Genotype-to-phenotype Graphs），将真实世界肿瘤患者的基因组测序数据转化为500余种细胞功能与信号通路的活性图谱（APSPs），实现从癌种到通路到基因的患者数字孪生建模，支撑虚拟临床试验和新适应症预测。

## 功能特性

### 核心能力
- **通路活性图谱可视化看板** — 四层数据钻取：癌种全景 → 信号通路 → 具体基因 → 数字孪生患者
- **MOA虚拟试验患者响应统计** — 18种药物机制 × 20+癌种的虚拟试验响应率分析
- **AI分析助手** — 自然语言交互式数据查询与分析
- **大规模数据渲染** — 虚拟滚动 + React.memo + useMemo优化，2000+患者 < 200ms响应
- **WebSocket实时推送** — AI计算任务状态实时更新

### 技术栈
| 层级 | 技术 |
|------|------|
| 前端框架 | React 18 + TypeScript |
| 构建工具 | Vite |
| 可视化 | ECharts 5 + D3.js |
| 状态管理 | Zustand |
| 样式 | Tailwind CSS |
| 虚拟滚动 | @tanstack/react-virtual |
| 图标 | Lucide React |
| 后端 | Python FastAPI |
| 实时通信 | WebSocket |
| AI引擎 | DAGG因果网络算法 |

## 快速启动

### 1. 启动后端

```bash
cd backend
python3 run.py --port 8000
```

后端将在 http://localhost:8000 启动，API文档 http://localhost:8000/docs

### 2. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端将在 http://localhost:5173 启动

## 项目结构

```
DPverse/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/        # AppLayout, Header, Sidebar
│   │   │   ├── dashboard/     # 总览仪表盘
│   │   │   ├── pathway/       # 通路活性图谱 (4层钻取)
│   │   │   ├── moa/           # MOA虚拟试验分析
│   │   │   ├── patient/       # 患者管理 (虚拟滚动)
│   │   │   ├── gene/          # 基因分析
│   │   │   └── ai/            # AI分析助手
│   │   ├── stores/            # Zustand状态管理
│   │   ├── hooks/             # 自定义Hooks
│   │   ├── services/          # API + WebSocket
│   │   ├── types/             # TypeScript类型
│   │   └── data/              # 数据生成器
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── api/routes/        # REST + WebSocket路由
│   │   ├── core/              # DAGG算法引擎
│   │   ├── data/              # 合成数据生成
│   │   └── models/            # Pydantic模型
│   └── run.py
└── README.md
```

## DAGG算法说明

DAGG（Data-driven Analysis of Genotype-to-phenotype Graphs）是一个三阶段因果推断引擎：

1. **基因型层** — 将突变映射到基因级效应（突变类型、VAF、癌基因/抑癌基因）
2. **通路层** — 通过因果网络将基因效应传播到信号通路
3. **表型层** — 将通路活性聚合为细胞功能谱（500+维APSP）

## License

Proprietary — 哲源科技
