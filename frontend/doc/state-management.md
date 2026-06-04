# DPverse State Management

## 为什么选择 Zustand

- **轻量**：单文件实现，无 boilerplate
- **简洁 API**：基于 hooks，无需 Provider 包裹
- **性能**：选择性订阅，仅在使用的状态变化时重渲染
- **TypeScript 友好**：完整的类型推导

## Store 设计

### dataStore（业务数据）

```typescript
interface DataState {
  // Dashboard 摘要
  summary: DashboardSummary | null

  // 患者数据（分页加载）
  patients: Patient[]
  totalPatients: number
  patientPage: number
  pageSize: number         // 默认 50

  // 通路数据
  pathways: Pathway[]      // ~500 条

  // 基因数据
  genes: Gene[]            // ~560 条

  // APSP 缓存（按 patientId 索引）
  apspCache: Record<string, APSPData>

  // MOA 虚拟试验结果
  moaResults: MOAResult[]  // 18 MOA × 25 cancer = 450 条

  // 计算任务队列
  tasks: ComputationTask[]

  // 加载/错误状态
  loading: Record<string, boolean>
  error: Record<string, string | null>
}
```

**关键设计决策**：
- `apspCache` 使用 object 而非 Map，确保 Zustand 的 immer 不可变更新正常工作
- `loading/error` 使用 key-value 模式，支持多个并发加载状态
- `patients` 使用 append 模式（`appendPatients`），支持无限滚动

### appStore（UI 状态）

```typescript
interface AppState {
  // 主题
  theme: 'light' | 'dark'

  // 选中的癌种（影响全局数据过滤）
  selectedCancer: CancerType

  // 侧边栏
  sidebarOpen: boolean

  // 多维筛选器
  filters: FilterState {
    selectedCancers: CancerType[]
    selectedPathways: string[]
    selectedGenes: string[]
    selectedMOAClasses: MOAClass[]
    pathwayCategoryFilter: PathwayCategory | null
    activityRange: [number, number]
    mutationImpactFilter: ('HIGH' | 'MODERATE' | 'LOW')[]
    searchQuery: string
  }

  // 钻取状态（通路分析页专用）
  drillLevel: 1 | 2 | 3 | 4
  selectedPathway: string | null
  selectedGene: string | null
  selectedPatient: string | null

  // WebSocket 连接状态
  wsConnected: boolean
}
```

## 状态流向

```
                ┌──────────────┐
                │   appStore   │
                │  (UI State)  │
                └──────┬───────┘
                       │ 筛选条件、癌种选择
                       ▼
                ┌──────────────┐
                │  useDataLoader│
                │  (Custom Hook)│
                └──────┬───────┘
                       │ 数据加载/生成
                       ▼
                ┌──────────────┐
                │   dataStore  │
                │ (Data State) │
                └──────┬───────┘
                       │ 订阅更新
                       ▼
                ┌──────────────┐
                │  Components  │
                │  (React UI)  │
                └──────────────┘
```

## 性能优化

### 1. 选择器粒度

始终在最细粒度级别订阅状态：

```typescript
// ✅ 好的做法：只订阅需要的字段
const selectedCancer = useAppStore((s) => s.selectedCancer)
const patients = useDataStore((s) => s.patients)

// ❌ 避免：订阅整个 store
const appStore = useAppStore()
```

### 2. 派生状态

通过 `useMemo` 从 store 数据派生计算值，而不是存储在 store 中：

```typescript
// ✅ 派生计算
const filteredPatients = useMemo(() =>
  patients.filter((p) => p.cancerType === selectedCancer),
[patients, selectedCancer])

// ❌ 不要在 store 中存储可计算的值
```

### 3. 批量更新

Zustand 的 `set()` 自动批量合并更新，无需额外优化。

## 与 WebSocket 的集成

WebSocket 消息通过 `useWebSocket` hook 桥接到 store：

```
WebSocket.onmessage
  → wsService.handlers['task_update']
  → useWebSocket.subscribe 回调
  → dataStore.updateTask(taskId, update)
  → Header 中的 Bell 图标更新（activeTasks 计数变化）
```

## 数据初始化流程

```
AppLayout mount
  ├── useInitializeData()
  │   ├── setLoading('init', true)
  │   ├── await 600ms (simulate API delay)
  │   ├── initGlobalData()  // 单例模式，仅执行一次
  │   │   ├── generatePathways() → 500 pathways
  │   │   ├── generateGenes() → ~560 genes
  │   │   └── generatePatients() → 2000 patients
  │   ├── 批量写入 dataStore
  │   └── setLoading('init', false)
  │
  └── useWebSocket()
      ├── wsService.connect()
      └── 订阅 task_update, task_complete, task_error
```
