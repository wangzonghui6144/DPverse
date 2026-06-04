# DPverse Backend Architecture

## Overview

DPverse 后端基于 Python FastAPI 构建，提供 REST API 和 WebSocket 通信，核心是 DAGG（Data-driven Analysis of Genotype-to-phenotype Graphs）因果网络引擎，将基因组突变数据转化为信号通路活性图谱（APSPs）。

## Tech Stack

| 组件 | 技术 | 版本 | 用途 |
|------|------|------|------|
| Web 框架 | FastAPI | 0.115 | REST API + WebSocket |
| ASGI 服务器 | Uvicorn | 0.30 | 高性能异步服务 |
| WebSocket | websockets | 12.0 | 实时双向通信 |
| 数据验证 | Pydantic | 2.9 | 请求/响应模型 |
| 数值计算 | NumPy | 1.26 | 矩阵运算、统计 |

## Project Structure

```
backend/
├── run.py                          # 启动入口（argparse + uvicorn）
├── requirements.txt                # Python 依赖
└── app/
    ├── __init__.py
    ├── main.py                     # FastAPI 应用初始化 + WebSocket 端点
    ├── core/
    │   ├── __init__.py
    │   ├── config.py               # 全局配置常量
    │   └── dag_engine.py           # DAGG 算法引擎（261行）
    ├── models/
    │   ├── __init__.py
    │   └── patient.py              # Pydantic 数据模型
    ├── data/
    │   └── generator.py            # 合成数据生成器（267行）
    └── api/
        ├── __init__.py
        └── routes/
            ├── __init__.py
            ├── patients.py         # 患者 API
            ├── pathways.py         # 通路 API
            ├── genes.py            # 基因 API
            ├── moa.py              # MOA 虚拟试验 API
            └── ws.py               # WebSocket 路由
```

## Architecture Decisions

### 1. FastAPI 选型理由

- **原生异步支持**：async/await 语法，适合 I/O 密集型 + 计算密集型混合负载
- **自动 API 文档**：Swagger UI (`/docs`) 和 ReDoc 开箱即用
- **WebSocket 一等公民**：原生 WebSocket 端点支持
- **Pydantic 集成**：请求/响应自动验证

### 2. 合成数据策略

由于真实的 DAGG 算法依赖专有数据和模型，当前实现使用**统计原理驱动的合成数据**：

- **Seeded Random**：`random.seed(42)` + `np.random.seed(42)` 确保可复现
- **Realistic Distribution**：突变类型权重、分期分布等基于真实临床数据
- **Deterministic Computation**：同一患者 ID 的 APSP 计算结果确定

### 3. Singleton 模式

核心组件使用模块级单例：

```python
# dag_engine.py
dag_engine = DAGGEngine()

# generator.py
generator = DataGenerator()
```

### 4. 三阶段 DAGG Pipeline

```
Stage 1: Genotype Layer
  突变位点 → 基因级影响评分
  (突变类型权重 × VAF因子)

Stage 2: Pathway Layer
  基因影响 → 通路活性
  (基因-通路邻接矩阵 × 衰减传播)

Stage 3: Phenotype Layer
  通路活性 → 细胞功能谱
  (通路-功能映射 × 加权聚合 + 噪声)
```

## Startup Flow

```
run.py main()
  ├── uvicorn.run("app.main:app")
  │
  └── FastAPI startup_event()
      ├── generator.generate_all()
      │   ├── _generate_pathways() → 500 pathways
      │   ├── _generate_genes() → ~560 genes
      │   ├── _generate_patients() → 2000 patients
      │   └── _generate_moa_results() → 450 MOA results
      │
      ├── dag_engine.setup_causal_network()
      │   ├── 构建 gene→pathway 邻接矩阵
      │   └── 构建 pathway→cell_function 映射
      │
      └── print summary statistics
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/summary` | Dashboard 摘要统计 |
| GET | `/api/health` | 健康检查 |
| GET | `/api/patients` | 患者列表（分页+筛选） |
| GET | `/api/patients/{id}` | 患者详情 |
| GET | `/api/patients/{id}/apsp` | 患者 APSP 数据 |
| GET | `/api/pathways` | 通路列表（按癌种/类别筛选） |
| GET | `/api/pathways/activity` | 通路活性聚合数据 |
| GET | `/api/genes` | 基因列表（按通路/癌种筛选） |
| GET | `/api/moa` | MOA 虚拟试验结果 |
| POST | `/api/compute` | 提交计算任务 |
| WS | `/ws` | WebSocket 实时通信 |

## WebSocket Protocol

### Client → Server

| type | 说明 |
|------|------|
| `ping` | 心跳检测 |
| `compute_submit` | 提交批量计算任务 |

```json
{
  "type": "compute_submit",
  "taskId": "task_1717000000",
  "computeType": "batch_apsp",
  "cancerTypes": ["LUAD", "BRCA"]
}
```

### Server → Client

| type | 说明 |
|------|------|
| `pong` | 心跳响应 |
| `task_update` | 任务进度更新 |
| `task_complete` | 任务完成 |
| `task_error` | 任务错误 |

```json
{
  "type": "task_update",
  "taskId": "task_1717000000",
  "payload": {
    "status": "running",
    "progress": 45,
    "message": "Processing patient PT_00042 (45/100)"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## CORS 配置

开发阶段允许所有来源：

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```
