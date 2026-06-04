# DPverse API & WebSocket Design

## REST API 设计原则

- **资源导向**：URL 命名基于资源（patients, pathways, genes, moa）
- **camelCase 响应**：前端 JavaScript 惯例
- **查询参数筛选**：可选筛选器通过 query params 传递
- **无状态**：每个请求独立，不维持服务端会话

## API 详情

### 1. Dashboard

#### GET /api/summary
获取仪表盘摘要统计。

**Response:**
```json
{
  "totalPatients": 2000,
  "cancerTypes": 25,
  "pathways": 500,
  "cellFunctions": 500,
  "totalMutations": 50000,
  "avgPathwayCoverage": 0.85,
  "computedAt": "2024-01-15T10:00:00"
}
```

#### GET /api/health
```json
{"status": "healthy", "service": "DPverse", "version": "2.4.1"}
```

### 2. Patients

#### GET /api/patients
分页获取患者列表。

**Query Params:**
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| cancer_type | string | - | 癌种筛选（如 LUAD） |
| page | int | 1 | 页码 |
| page_size | int | 50 | 每页数量 |
| search | string | - | 搜索患者 ID 或基因 |

**Response:**
```json
{
  "patients": [...],
  "total": 2000,
  "page": 1,
  "pageSize": 50
}
```

#### GET /api/patients/{patient_id}
获取患者详细信息。

#### GET /api/patients/{patient_id}/apsp
获取患者的信号通路活性图谱。

### 3. Pathways

#### GET /api/pathways
获取通路列表。

**Query Params:**
| 参数 | 类型 | 说明 |
|------|------|------|
| cancer_type | string | 按癌种筛选 |
| category | string | 按通路类别筛选（RTK, RAS, ...） |

#### GET /api/pathways/activity
获取指定癌种的平均通路活性。

**Query Params:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| cancer_type | string | ✓ | 癌种代码 |

**Response:**
```json
{
  "PW_0001": 0.342,
  "PW_0002": -0.156,
  ...
}
```

### 4. Genes

#### GET /api/genes
获取基因列表。

**Query Params:**
| 参数 | 类型 | 说明 |
|------|------|------|
| pathway_id | string | 按通路筛选 |
| cancer_type | string | 按癌种筛选 |

### 5. MOA Virtual Trial

#### GET /api/moa
获取 MOA 虚拟试验结果。

**Query Params:**
| 参数 | 类型 | 说明 |
|------|------|------|
| moa_class | string | MOA 类别筛选（TKI, ICI, ...） |
| cancer_type | string | 癌种筛选 |

**Response:**
```json
[{
  "moaClass": "ICI",
  "cancerType": "SKCM",
  "totalPatients": 80,
  "responders": 50,
  "nonResponders": 30,
  "responseRate": 0.625,
  "biomarkerEnrichment": {
    "TP53_mut": 1.2,
    "TMB_H": 3.8,
    "PDL1_pos": 3.2
  },
  "subTypeBreakdown": {
    "A": {"total": 30, "responders": 20},
    "B": {"total": 50, "responders": 30}
  }
}]
```

### 6. Computation

#### POST /api/compute
提交批量计算任务。

**Request Body:**
```json
{
  "type": "batch_apsp",
  "cancerTypes": ["LUAD", "BRCA"],
  "moaClasses": ["ICI", "TKI"]
}
```

**Response:**
```json
{
  "taskId": "task_1717000000_abcd",
  "status": "queued"
}
```

## WebSocket 协议设计

### 连接建立

```
ws://localhost:8000/ws
```

### 消息格式

所有消息使用 JSON 格式，基础结构：

```json
{
  "type": "message_type",
  "taskId": "unique_task_id",
  "payload": {},
  "timestamp": "ISO 8601"
}
```

### 心跳机制

- **客户端**每 30 秒发送 `{"type": "ping"}`
- **服务端**回复 `{"type": "pong", "timestamp": ...}`

前端实现（`websocket.ts`）：
```typescript
this.heartbeatTimer = setInterval(() => {
  if (this.ws?.readyState === WebSocket.OPEN) {
    this.ws.send(JSON.stringify({ type: 'ping' }))
  }
}, 30000)
```

### 断线重连

采用指数退避策略：
- 第 1 次重连：1s
- 第 2 次重连：2s
- 第 3 次重连：4s
- ...
- 最大延迟：30s
- 最大尝试次数：10 次

### 任务生命周期

```
queued → running → completed/failed
  │         │
  └── task_update (progress: 0)
            │
            ├── task_update (progress: 25)
            ├── task_update (progress: 50)
            ├── task_update (progress: 75)
            │
            └── task_complete (progress: 100, result: {...})
```

### 批量计算流程（WebSocket 端点）

```
1. Client → Server: {"type": "compute_submit", "taskId": "...", "cancerTypes": [...]}
2. Server → Client: {"type": "task_update", "payload": {"status": "running", "progress": 0}}
3. Server: for each patient in batch:
     apsp = dag_engine.compute_apsp(patient, pathways)
4. Server → Client: {"type": "task_update", "payload": {"progress": N, "message": "..."}}
   (每处理一个患者发送一次进度更新)
5. Server → Client: {"type": "task_complete", "payload": {"status": "completed", "result": {...}}}
```

## 错误处理

### HTTP 错误

- 400：参数验证失败
- 404：资源不存在
- 500：服务器内部错误

### WebSocket 错误

```json
{
  "type": "task_error",
  "taskId": "...",
  "payload": {
    "status": "failed",
    "message": "Error description"
  }
}
```

## 性能考虑

1. **批量处理**：`compute_batch` 限制单次最多处理 100 个患者
2. **异步非阻塞**：使用 `async/await` + `asyncio.sleep(0.01)` 模拟计算延迟，不阻塞事件循环
3. **内存管理**：全局 `generator` 单例预加载全部数据到内存（约 50MB）
