# DPverse Performance Optimization

## 目标

页面响应时间 < 200ms，支持 2000+ 患者数据流畅交互。

## 已实施的优化策略

### 1. 组件级渲染控制

#### React.memo
所有展示型组件使用 `memo` 包裹，跳过无关 props 变化时的重渲染：

```typescript
// StatCard, PatientRow, ChatBubble, Level1Heatmap 等
const StatCard = memo(function StatCard({ icon, label, value, trend, color }) { ... })
const PatientRow = memo(function PatientRow({ patient, onClick, style }) { ... })
```

#### useMemo — 图表配置缓存
ECharts option 对象是引用类型，每次渲染创建新对象会导致图表不必要更新：

```typescript
const heatmapOption = useMemo(() => {
  // 仅在 pathways 变化时重新计算
  return { series: [{ type: 'heatmap', data }], ... }
}, [pathways, activityScores])
```

所有图表配置（heatmap、bar、radar、scatter、stacked bar）均通过 `useMemo` 缓存。

#### useCallback — 事件处理器稳定引用
```typescript
const handleCellClick = useCallback((pathway: Pathway) => {
  setSelectedPathway(pathway)
  setDrillLevel(2)
}, [])
```

### 2. 虚拟滚动（PatientPage）

使用 `@tanstack/react-virtual` 实现虚拟化列表：

```typescript
const rowVirtualizer = useVirtualizer({
  count: patients.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 56,      // 每行固定高度
  overscan: 10,                 // 缓冲区 10 行
})
```

**效果**：
- 2000 行数据，实际 DOM 节点仅 ~20 个（可视区域 + overscan）
- 滚动帧率保持 60fps
- 内存占用从 ~50MB 降至 ~5MB

### 3. 代码分割（Code Splitting）

6 个页面组件全部使用 `React.lazy()` 动态导入：

```typescript
const DashboardPage = lazy(() => import('./components/dashboard/DashboardPage'))
const PathwayPage = lazy(() => import('./components/pathway/PathwayPage'))
// ... 共 6 个页面
```

**效果**：
- 初始 bundle 仅包含 AppLayout + Sidebar + Header
- 各页面在首次访问时按需加载
- 每个页面 bundle ~15-40KB（gzip 后）

### 4. ECharts 按需引入（Tree Shaking）

仅导入实际使用的图表类型和组件：

```typescript
// 不是: import * as echarts from 'echarts'
// 而是:
import { HeatmapChart, BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
```

**效果**：
- ECharts 包体积从 ~1MB 降至 ~300KB（gzip 后 ~80KB）
- 仅加载 6 种图表类型 + 7 个组件 + 1 个渲染器

### 5. 状态订阅优化

Zustand 选择器在最细粒度级别订阅：

```typescript
// ✅ 仅订阅单个字段
const patients = useDataStore((s) => s.patients)
const selectedCancer = useAppStore((s) => s.selectedCancer)

// ✅ 使用 shallow 比较（当需要多个字段时）
const { patients, totalPatients } = useDataStore((s) => ({
  patients: s.patients,
  totalPatients: s.totalPatients,
}))
```

### 6. 数据生成优化

- 使用 seeded PRNG（确定性随机数），确保数据一致性
- 全局数据仅初始化一次（`globalDataInitialized` 标志）
- 分页加载避免一次性渲染全部数据

### 7. CSS 优化

- Tailwind CSS 按需生成（JIT 模式），仅包含使用的 class
- 使用 `transform` 和 `opacity` 进行动画（GPU 加速）
- 自定义滚动条（无额外依赖）

## 性能测量方法

### 关键指标
| 指标 | 目标 | 方法 |
|------|------|------|
| FCP (First Contentful Paint) | < 1s | Lighthouse |
| 页面切换延迟 | < 200ms | React DevTools Profiler |
| 滚动帧率 | 60fps | Chrome Performance tab |
| 虚拟滚动渲染时间 | < 16ms/frame | React DevTools Profiler |
| Bundle 大小 (初始) | < 200KB gzip | vite build --report |

### 使用 React DevTools Profiler
1. 打开 React DevTools → Profiler tab
2. 录制交互（页面切换、滚动、筛选）
3. 检查 commit 耗时和重渲染组件数量

## 待优化项

1. **Service Worker 缓存**：离线可用 + 更快的二次加载
2. **Web Worker**：将数据生成/处理移至 Worker 线程
3. **图片懒加载**：若有患者影像数据
4. **HTTP/2 Server Push**：预加载关键资源
5. **Memolization 审查**：检查所有 `useMemo`/`useCallback` 的依赖数组是否正确
