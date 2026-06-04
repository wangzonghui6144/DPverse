# DPverse Component Design

## Component Tree

```
App
└── BrowserRouter
    └── Routes
        └── AppLayout (layout wrapper)
            ├── Sidebar (fixed left nav)
            │   ├── Logo + Brand
            │   ├── Search Input
            │   ├── Cancer Type Selector (dropdown)
            │   ├── Navigation Items (6 routes)
            │   └── Footer (DAGG version indicator)
            ├── Header (sticky top bar)
            │   ├── Mobile Menu Toggle
            │   ├── Brand Info
            │   ├── Quick Stats (patient/pathway/cancer counts)
            │   ├── WebSocket Status Indicator
            │   ├── Task Notification Bell
            │   └── Theme Toggle (dark/light)
            └── <Outlet /> (page content)
                ├── DashboardPage
                │   ├── Hero Section (cancer selector banner)
                │   ├── StatCard × 4 (summary stats grid)
                │   ├── Pathway Heatmap (ECharts)
                │   ├── MOA Response Bar Chart (ECharts)
                │   └── Quick Links × 3 (navigation cards)
                ├── PathwayPage (4-level drill-down)
                │   ├── Breadcrumb + Level Indicator
                │   ├── Search + Category Filter Chips
                │   ├── Level1Heatmap (panoramic pathway activity)
                │   ├── Level2PathwayDetail (radar + bar + gene list)
                │   ├── Level3GeneDetail (scatter + gene info)
                │   └── Level4PatientDetail (APSP bar + mutation table)
                ├── MOAPage
                │   ├── MOA Category/Class Selector
                │   ├── StatSummaryCard × 4
                │   ├── Response Rate Bar Chart (ECharts)
                │   ├── Responder/Non-responder Stacked Bar (ECharts)
                │   └── Detailed Data Table
                ├── PatientPage
                │   ├── Search Input
                │   ├── Virtualized Patient Table
                │   │   └── PatientRow (memo) × N
                │   └── PatientDetailPanel (modal)
                ├── GenePage
                └── AIPage
                    ├── Chat Messages Area
                    ├── Quick Question Chips
                    └── Input Textarea + Send Button
```

## Key Component Details

### 1. Sidebar (176 lines)

**职责**：全局导航 + 癌种选择 + 搜索

**设计要点**：
- 响应式设计：桌面端固定侧边栏（可折叠），移动端 overlay
- 支持收起/展开动画（`transition-all duration-300`）
- 癌种选择器：搜索过滤 + 点击选择，支持 25 种癌种
- 导航项高亮当前路由（active 状态）
- 折叠模式下图标居中显示

**状态依赖**：
- `appStore.sidebarOpen` — 展开/折叠
- `appStore.selectedCancer` — 当前癌种
- `appStore.filters.searchQuery` — 全局搜索词

### 2. DashboardPage (285 lines)

**职责**：总览仪表盘，呈现关键指标和入口

**子组件**：
- `StatCard` (memo) — 统计卡片，展示患者数/通路数/突变数/癌种数
- 通路活性热力图 — 癌种 × 通路类别 的活性矩阵
- MOA 响应率柱状图 — 多 MOA × 多癌种 对比
- Quick Links — 跳转到通路分析/MOA/AI助手的卡片

**性能优化**：
- `StatCard` 使用 `React.memo` 避免不必要的重渲染
- `heatmapOption` 和 `responseBarOption` 通过 `useMemo` 缓存

### 3. PathwayPage — 四层钻取核心 (599 lines)

**这是项目最复杂的组件**，实现了 癌种→通路→基因→患者 的递进钻取：

#### Level 1: 全景热力图
- 通路类别（18类）作为 X 轴
- 各通路在类别内排列作为 Y 轴
- 活性分数 [-1, 1] 映射为蓝-白-红色阶
- 点击热力图格子钻取到 Level 2

#### Level 2: 通路详情
- 雷达图展示该通路在各功能维度的活性分布
- 瀑布图展示关联基因的活性贡献
- 基因列表支持点击钻取到 Level 3

#### Level 3: 基因详情
- 基因基本信息（染色体、突变频率、相关通路、靶向药物）
- 癌基因/抑癌基因标签
- 患者分布散点图（PI3K/AKT vs MAPK 活性空间）
- 点击钻取到 Level 4

#### Level 4: 患者数字孪生
- 患者人口学信息（年龄、性别、分期）
- APSP 信号通路活性柱状图（支持 DataZoom 缩放）
- 高影响突变表格（基因、类型、VAF）

**状态管理**：
- 钻取层级通过本地 `useState` 管理（drillLevel, selectedPathway, selectedGene, selectedPatient）
- 避免污染全局 store，因为钻取状态只在通路页面内有效

### 4. MOAPage (314 lines)

**职责**：MOA 虚拟试验可视化分析

**MOA 分类体系**：
- 靶向治疗：TKI, PARP, CDK46, HER2, EGFR, ALK, BRAF, MEK, PI3K, MTOR, VEGF, PROTEASOME
- 免疫治疗：ICI
- 化疗：CHEMO
- 内分泌治疗：AR, ER
- 表观遗传：HDAC
- 细胞治疗：CAR_T

**图表设计**：
- 柱状图：各癌种响应率排序（绿/黄/红色阶）
- 堆叠柱状图：响应者 vs 非响应者分布
- 详细数据表：带进度条的响应率 + 生物标志物富集标签

### 5. PatientPage — 虚拟滚动 (282 lines)

**职责**：高效展示 2000+ 患者列表

**核心实现**（使用 `@tanstack/react-virtual`）：
```typescript
const rowVirtualizer = useVirtualizer({
  count: hasMore ? patients.length + 1 : patients.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 56,    // 每行固定 56px 高度
  overscan: 10,              // 预渲染 10 行
})
```

**PatientRow (memo)**：每条患者记录使用 `memo` 包裹，仅在数据变化时重渲染。

**PatientDetailPanel (modal)**：点击患者弹出详情面板，展示 VAF 分布柱状图和突变列表。

### 6. AIPage — 对话式分析 (193 lines)

**职责**：自然语言交互式数据查询

**设计要点**：
- 关键字匹配的模拟 AI 响应（通路/基因/药物/患者四个主题）
- 欢迎消息根据当前癌种动态生成
- 4 个快捷提问按钮减少输入成本
- 打字动画（Loader2 旋转图标 + "AI正在分析..." 文字）
- 消息自动滚动到底部

## 样式系统

### 设计 Token（通过 Tailwind 组件层定义）

```css
.glass-card       — 玻璃态卡片（backdrop-blur + 半透明背景）
.gradient-text    — 渐变文字（primary → medical）
.stat-value       — 统计数值（3xl, bold, tracking-tight）
.stat-label       — 统计标签（sm, slate-500）
.section-title    — 区块标题（lg, semibold）
.chip             — 标签（圆角, 主题色）
.chip-active      — 激活标签（实心底色）
```

### 主题系统

- 支持 dark/light 双主题，默认 dark
- 通过 Tailwind `dark:` 前缀实现
- 主题切换通过 `document.documentElement.classList.toggle('dark')` 实现
- 状态保存在 `appStore.theme`
