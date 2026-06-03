import { memo, useMemo, useState, useCallback } from 'react'
import { useDataStore } from '../../stores/dataStore'
import { usePathwayActivityData } from '../../hooks/useDataLoader'
import { PATHWAY_CATEGORIES, CANCER_LABELS } from '../../types'
import type { Pathway } from '../../types'
import {
  Activity, ChevronRight, ArrowLeft, Search, Target, Zap,
} from 'lucide-react'
import ReactEChartsCore from 'echarts-for-react/esm/core'
import * as echarts from 'echarts/core'
import { HeatmapChart, BarChart, ScatterChart, RadarChart, LineChart } from 'echarts/charts'
import {
  GridComponent, TooltipComponent, TitleComponent, VisualMapComponent,
  LegendComponent, DataZoomComponent, RadarComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([
  HeatmapChart, BarChart, ScatterChart, RadarChart, LineChart,
  GridComponent, TooltipComponent, TitleComponent, VisualMapComponent,
  LegendComponent, DataZoomComponent, RadarComponent,
  CanvasRenderer,
])

// Level 1: Cancer-type panoramic heatmap
const Level1Heatmap = memo(function Level1Heatmap({
  pathways, activityScores, onCellClick,
}: {
  pathways: Pathway[]
  activityScores: Record<string, number>
  onCellClick: (pathway: Pathway) => void
}) {
  const categories = PATHWAY_CATEGORIES
  const option = useMemo(() => {
    const pathsByCat: Record<string, Pathway[]> = {}
    categories.forEach((c) => { pathsByCat[c.key] = [] })
    pathways.forEach((pw) => {
      if (pathsByCat[pw.category]) pathsByCat[pw.category].push(pw)
    })

    const xData = categories.map((c) => c.label)
    const maxLen = Math.max(...Object.values(pathsByCat).map((a) => a.length))
    const yData = Array.from({ length: maxLen }, (_, i) => `#${i + 1}`)

    const data: [number, number, number][] = []
    const pathMap: Record<string, Pathway> = {}

    categories.forEach((cat, ci) => {
      pathsByCat[cat.key].forEach((pw, ri) => {
        const score = activityScores[pw.id] || 0
        data.push([ci, ri, score])
        pathMap[`${ci}_${ri}`] = pw
      })
    })

    return {
      tooltip: {
        formatter: (params: { data: number[] }) => {
          const pw = pathMap[`${params.data[0]}_${params.data[1]}`]
          return pw
            ? `${pw.name}<br/>类别: ${PATHWAY_CATEGORIES.find(c => c.key === pw.category)?.label}<br/>活性: ${params.data[2].toFixed(3)}`
            : ''
        },
      },
      grid: { left: 50, right: 30, top: 10, bottom: 80 },
      xAxis: {
        type: 'category', data: xData,
        axisLabel: { rotate: 45, fontSize: 11, color: '#94a3b8' },
      },
      yAxis: {
        type: 'category', data: yData,
        axisLabel: { fontSize: 9, color: '#64748b' },
        inverse: true,
      },
      visualMap: {
        min: -1, max: 1,
        orient: 'horizontal', left: 'center', bottom: 0,
        inRange: { color: ['#1d4ed8', '#e2e8f0', '#dc2626'] },
        text: ['激活', '抑制'], textStyle: { color: '#94a3b8' },
      },
      series: [{
        type: 'heatmap', data,
        label: { show: false },
        emphasis: { itemStyle: { shadowBlur: 8, shadowColor: 'rgba(0,0,0,0.4)' } },
        itemStyle: { borderRadius: [2, 2, 2, 2] },
      }],
    }
  }, [pathways, activityScores])

  return (
    <ReactEChartsCore
      echarts={echarts} option={option}
      style={{ height: 450 }}
      onEvents={{
        click: (params: { data?: number[] }) => {
          if (!params.data) return
          // Find the pathway at this position
          const cats = PATHWAY_CATEGORIES
          const pathsByCat: Record<string, Pathway[]> = {}
          cats.forEach((c) => { pathsByCat[c.key] = [] })
          pathways.forEach((pw) => {
            if (pathsByCat[pw.category]) pathsByCat[pw.category].push(pw)
          })
          const pw = pathsByCat[cats[params.data[0]]?.key]?.[params.data[1]]
          if (pw) onCellClick(pw)
        },
      }}
    />
  )
})

// Level 2: Pathway detail view with radar + bar chart
const Level2PathwayDetail = memo(function Level2PathwayDetail({
  selectedPathway, pathways, activityScores, onGeneClick, onBack,
}: {
  selectedPathway: Pathway
  pathways: Pathway[]
  activityScores: Record<string, number>
  onGeneClick: (gene: string) => void
  onBack: () => void
}) {
  const radarOption = useMemo(() => {
    const categories = PATHWAY_CATEGORIES
    const catScores: Record<string, number[]> = {}
    categories.forEach((c) => { catScores[c.key] = [] })

    pathways.forEach((pw) => {
      catScores[pw.category]?.push(activityScores[pw.id] || 0)
    })

    const avgByCat = Object.entries(catScores).map(([key, scores]) => ({
      name: categories.find((c) => c.key === key)?.label || key,
      value: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
    }))

    return {
      tooltip: {},
      legend: { show: false },
      radar: {
        indicator: avgByCat.map((a) => ({ name: a.name, max: 1, min: -1 })),
        center: ['50%', '55%'],
        radius: '65%',
        axisName: { color: '#94a3b8', fontSize: 10 },
      },
      series: [{
        type: 'radar',
        data: [{ value: avgByCat.map((a) => a.value), name: '通路活性', areaStyle: { opacity: 0.2 } }],
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: { color: '#3b82f6', width: 2 },
        itemStyle: { color: '#3b82f6' },
      }],
    }
  }, [pathways, activityScores])

  const barOption = useMemo(() => {
    const genes = selectedPathway.genes.slice(0, 20)
    return {
      tooltip: { trigger: 'axis' as const },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category' as const,
        data: genes,
        axisLabel: { fontSize: 10, color: '#94a3b8', rotate: 45 },
      },
      yAxis: {
        type: 'value' as const,
        name: '活性贡献',
        axisLabel: { color: '#94a3b8' },
      },
      series: [{
        type: 'bar',
        data: genes.map(() => (Math.random() * 2 - 1)),
        itemStyle: {
          color: (params: { value: number }) => params.value >= 0 ? '#3b82f6' : '#ef4444',
          borderRadius: [4, 4, 0, 0],
        },
      }],
    }
  }, [selectedPathway])

  return (
    <div className="space-y-4 animate-fade-in">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-primary-500 hover:text-primary-600">
        <ArrowLeft className="w-4 h-4" /> 返回全景热力图
      </button>

      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="chip-active">{PATHWAY_CATEGORIES.find(c => c.key === selectedPathway.category)?.label}</span>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">{selectedPathway.name}</h3>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{selectedPathway.description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-4">
          <h4 className="section-title mb-3">通路活性雷达图</h4>
          <ReactEChartsCore echarts={echarts} option={radarOption} style={{ height: 300 }} />
        </div>
        <div className="glass-card p-4">
          <h4 className="section-title mb-3">基因活性贡献瀑布图</h4>
          <ReactEChartsCore
            echarts={echarts} option={barOption} style={{ height: 300 }}
            onEvents={{
              click: (params: { name?: string }) => {
                if (params.name) onGeneClick(params.name)
              },
            }}
          />
        </div>
      </div>

      {/* Gene list */}
      <div className="glass-card p-4">
        <h4 className="section-title mb-3">关联基因 ({selectedPathway.genes.length})</h4>
        <div className="flex flex-wrap gap-2">
          {selectedPathway.genes.map((gene) => (
            <button
              key={gene}
              onClick={() => onGeneClick(gene)}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm
                       text-slate-700 dark:text-slate-300 hover:bg-primary-100 dark:hover:bg-primary-900
                       hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              {gene}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
})

// Level 3: Gene detail
const Level3GeneDetail = memo(function Level3GeneDetail({
  geneName, onBack, onPatientClick,
}: {
  geneName: string
  onBack: () => void
  onPatientClick: (patientId: string) => void
}) {
  const genes = useDataStore((s) => s.genes)
  const gene = genes.find((g) => g.symbol === geneName)

  const scatterOption = useMemo(() => {
    const data = Array.from({ length: 200 }, () => [
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
    ])
    return {
      tooltip: {
        formatter: (params: { data: number[] }) =>
          `患者分布<br/>通路活性X: ${params.data[0].toFixed(3)}<br/>通路活性Y: ${params.data[1].toFixed(3)}`,
      },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'value' as const, name: 'PI3K/AKT活性', axisLabel: { color: '#94a3b8' } },
      yAxis: { type: 'value' as const, name: 'MAPK活性', axisLabel: { color: '#94a3b8' } },
      series: [{
        type: 'scatter',
        data,
        symbolSize: 6,
        itemStyle: {
          color: '#3b82f6',
          opacity: 0.6,
          borderRadius: 4,
        },
        emphasis: { itemStyle: { color: '#ef4444', opacity: 1 } },
      }],
    }
  }, [])

  return (
    <div className="space-y-4 animate-fade-in">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-primary-500">
        <ArrowLeft className="w-4 h-4" /> 返回通路详情
      </button>

      <div className="glass-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">{geneName}</h3>
            {gene && <p className="text-sm text-slate-500 mt-1">{gene.name}</p>}
          </div>
          <div className="flex gap-2">
            {gene?.isOncogene && <span className="chip bg-red-50 text-red-600 border-red-200">癌基因</span>}
            {gene?.isTSG && <span className="chip bg-blue-50 text-blue-600 border-blue-200">抑癌基因</span>}
          </div>
        </div>
        {gene && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div>
              <span className="stat-label">染色体</span>
              <p className="font-mono text-sm">{gene.chromosome}</p>
            </div>
            <div>
              <span className="stat-label">突变频率</span>
              <p className="font-mono text-sm">{(gene.mutationFrequency * 100).toFixed(2)}%</p>
            </div>
            <div>
              <span className="stat-label">相关通路</span>
              <p className="font-mono text-sm">{gene.pathwayIds.length}</p>
            </div>
            <div>
              <span className="stat-label">靶向药物</span>
              <p className="font-mono text-sm">{gene.drugs.length || '暂无'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Patient distribution scatter */}
      <div className="glass-card p-4">
        <h4 className="section-title mb-3">数字孪生患者分布</h4>
        <ReactEChartsCore
          echarts={echarts} option={scatterOption} style={{ height: 350 }}
          onEvents={{
            click: () => {
              const patientId = `PT_${String(Math.floor(Math.random() * 2000) + 1).padStart(5, '0')}`
              onPatientClick(patientId)
            },
          }}
        />
      </div>
    </div>
  )
})

// Level 4: Patient digital twin detail
const Level4PatientDetail = memo(function Level4PatientDetail({
  patientId, onBack,
}: {
  patientId: string
  onBack: () => void
}) {
  const patients = useDataStore((s) => s.patients)
  const pathways = useDataStore((s) => s.pathways)
  const patient = patients.find((p) => p.id === patientId)

  if (!patient) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-slate-500">患者数据加载中...</p>
        <p className="text-sm text-slate-400 mt-1">{patientId}</p>
        <button onClick={onBack} className="mt-4 text-primary-500 text-sm">返回</button>
      </div>
    )
  }

  const barOption = {
    tooltip: { trigger: 'axis' as const },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category' as const,
      data: pathways.slice(0, 50).map((p) => p.name.slice(0, 8)),
      axisLabel: { fontSize: 8, color: '#94a3b8', rotate: 90 },
    },
    yAxis: { type: 'value' as const, name: '活性', axisLabel: { color: '#94a3b8' } },
    dataZoom: [{ type: 'inside' }, { type: 'slider', bottom: 0 }],
    series: [{
      type: 'bar',
      data: pathways.slice(0, 50).map((pw) => patient.apsp.pathwayActivities[pw.id] || 0),
      itemStyle: {
        color: (params: { value: number }) => params.value >= 0 ? '#3b82f6' : '#ef4444',
        borderRadius: [2, 2, 0, 0],
      },
    }],
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-primary-500">
        <ArrowLeft className="w-4 h-4" /> 返回基因分析
      </button>

      <div className="glass-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-primary-500" />
              数字孪生患者: {patient.id}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {CANCER_LABELS[patient.cancerType]} · {patient.subType}型 · Stage {patient.stage}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
          <div><span className="stat-label">年龄</span><p className="font-semibold">{patient.age}岁</p></div>
          <div><span className="stat-label">性别</span><p className="font-semibold">{patient.gender === 'M' ? '男' : '女'}</p></div>
          <div><span className="stat-label">分期</span><p className="font-semibold">Stage {patient.stage}</p></div>
          <div><span className="stat-label">突变数</span><p className="font-semibold">{patient.mutations.length}</p></div>
          <div><span className="stat-label">APSP签名</span><p className="font-mono text-xs">{patient.apsp.signature}</p></div>
        </div>
      </div>

      {/* Pathway activity bar chart */}
      <div className="glass-card p-4">
        <h4 className="section-title mb-3">信号通路活性图谱 (APSP)</h4>
        <ReactEChartsCore echarts={echarts} option={barOption} style={{ height: 350 }} />
      </div>

      {/* Mutations table */}
      <div className="glass-card p-4">
        <h4 className="section-title mb-3">关键基因突变</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 dark:text-slate-400">
                <th className="pb-2 font-medium">基因</th>
                <th className="pb-2 font-medium">突变类型</th>
                <th className="pb-2 font-medium">影响等级</th>
                <th className="pb-2 font-medium">VAF</th>
              </tr>
            </thead>
            <tbody>
              {patient.mutations.filter((m) => m.impact === 'HIGH').slice(0, 20).map((m, i) => (
                <tr key={i} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="py-2 font-mono text-primary-600 dark:text-primary-400">{m.gene}</td>
                  <td className="py-2">{m.type}</td>
                  <td className="py-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium
                      ${m.impact === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}
                    >
                      {m.impact}
                    </span>
                  </td>
                  <td className="py-2 font-mono">{(m.vaf * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
})

// Main Pathway Page
export default function PathwayPage() {
  const { pathways, activityData, selectedCancer } = usePathwayActivityData()
  const activityScores = useMemo(() => activityData(), [activityData])

  const [drillLevel, setDrillLevel] = useState<1 | 2 | 3 | 4>(1)
  const [selectedPathway, setSelectedPathway] = useState<Pathway | null>(null)
  const [selectedGene, setSelectedGene] = useState<string | null>(null)
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredPathways = useMemo(() => {
    let result = pathways
    if (categoryFilter) result = result.filter((p) => p.category === categoryFilter)
    if (searchTerm) {
      const s = searchTerm.toLowerCase()
      result = result.filter((p) => p.name.toLowerCase().includes(s) || p.id.toLowerCase().includes(s))
    }
    return result
  }, [pathways, categoryFilter, searchTerm])

  const handleCellClick = useCallback((pathway: Pathway) => {
    setSelectedPathway(pathway)
    setDrillLevel(2)
  }, [])

  const handleGeneClick = useCallback((gene: string) => {
    setSelectedGene(gene)
    setDrillLevel(3)
  }, [])

  const handlePatientClick = useCallback((patientId: string) => {
    setSelectedPatient(patientId)
    setDrillLevel(4)
  }, [])

  const handleBack = useCallback(() => {
    if (drillLevel === 2) { setDrillLevel(1); setSelectedPathway(null) }
    else if (drillLevel === 3) { setDrillLevel(2); setSelectedGene(null) }
    else if (drillLevel === 4) { setDrillLevel(3); setSelectedPatient(null) }
  }, [drillLevel])

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Activity className="w-4 h-4" />
        <span>通路活性图谱</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-800 dark:text-white font-medium">
          {CANCER_LABELS[selectedCancer]}
        </span>
        {selectedPathway && (
          <>
            <ChevronRight className="w-3 h-3" />
            <span className="text-primary-500">{selectedPathway.name}</span>
          </>
        )}
        {selectedGene && (
          <>
            <ChevronRight className="w-3 h-3" />
            <span className="text-primary-500">{selectedGene}</span>
          </>
        )}
        {selectedPatient && (
          <>
            <ChevronRight className="w-3 h-3" />
            <span className="text-primary-500">{selectedPatient}</span>
          </>
        )}
        {/* Drill level indicator */}
        <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
          L{drillLevel}/4 层级
        </span>
      </div>

      {/* Level 1: Heatmap */}
      {drillLevel === 1 && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="搜索通路..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700
                         bg-white dark:bg-slate-900 text-slate-900 dark:text-white w-64 outline-none
                         focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setCategoryFilter(null)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                  ${!categoryFilter ? 'bg-primary-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
              >
                全部
              </button>
              {PATHWAY_CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setCategoryFilter(cat.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                    ${categoryFilter === cat.key ? 'bg-primary-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="section-title flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                泛癌种通路活性全景热力图
              </h3>
              <span className="text-xs text-slate-400">点击格子钻取到通路详情</span>
            </div>
            <Level1Heatmap
              pathways={filteredPathways}
              activityScores={activityScores}
              onCellClick={handleCellClick}
            />
          </div>
        </>
      )}

      {/* Level 2: Pathway detail */}
      {drillLevel === 2 && selectedPathway && (
        <Level2PathwayDetail
          selectedPathway={selectedPathway}
          pathways={pathways}
          activityScores={activityScores}
          onGeneClick={handleGeneClick}
          onBack={handleBack}
        />
      )}

      {/* Level 3: Gene detail */}
      {drillLevel === 3 && selectedGene && (
        <Level3GeneDetail
          geneName={selectedGene}
          onBack={handleBack}
          onPatientClick={handlePatientClick}
        />
      )}

      {/* Level 4: Patient detail */}
      {drillLevel === 4 && selectedPatient && (
        <Level4PatientDetail
          patientId={selectedPatient}
          onBack={handleBack}
        />
      )}
    </div>
  )
}
