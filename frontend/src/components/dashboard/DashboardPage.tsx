import React, { memo, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDataStore } from '../../stores/dataStore'
import { useAppStore } from '../../stores/appStore'
import { CANCER_LABELS } from '../../types'
import {
  Users, Activity, Dna, FlaskConical, TrendingUp,
  ArrowRight, Zap, Target,
} from 'lucide-react'
import ReactEChartsCore from 'echarts-for-react/esm/core'
import * as echarts from 'echarts/core'
import { HeatmapChart, BarChart, LineChart } from 'echarts/charts'
import {
  GridComponent, TooltipComponent, TitleComponent,
  VisualMapComponent, LegendComponent, DataZoomComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([
  HeatmapChart, BarChart, LineChart,
  GridComponent, TooltipComponent, TitleComponent,
  VisualMapComponent, LegendComponent, DataZoomComponent,
  CanvasRenderer,
])

const StatCard = memo(function StatCard({
  icon: Icon, label, value, trend, color,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  trend?: string
  color: string
}) {
  return (
    <div className="glass-card p-5 hover:shadow-md transition-shadow cursor-pointer group">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend && (
          <span className="flex items-center gap-1 text-xs text-medical-600 dark:text-medical-400 font-medium">
            <TrendingUp className="w-3 h-3" />
            {trend}
          </span>
        )}
      </div>
      <div className="mt-4">
        <div className="stat-value text-slate-800 dark:text-white">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        <div className="stat-label mt-1">{label}</div>
      </div>
    </div>
  )
})

export default function DashboardPage() {
  const navigate = useNavigate()
  const summary = useDataStore((s) => s.summary)
  const pathways = useDataStore((s) => s.pathways)
  const moaResults = useDataStore((s) => s.moaResults)
  const selectedCancer = useAppStore((s) => s.selectedCancer)

  const heatmapOption = useMemo(() => {
    if (pathways.length === 0) return {}

    const categories = [...new Set(pathways.map((p) => p.category))]
    const cancerSamples = ['LUAD', 'BRCA', 'COAD', 'STAD', 'LIHC', 'PAAD', 'KIRC', 'OV', 'GBM', 'SKCM']
    const data: [number, number, number][] = []

    cancerSamples.forEach((_cancer, ci) => {
      const pwByCat: Record<string, number> = {}
      pathways.forEach((pw) => {
        if (!pwByCat[pw.category]) pwByCat[pw.category] = 0
        pwByCat[pw.category]++
      })

      categories.forEach((_cat, cati) => {
        const activity = Math.sin((ci * 0.8 + cati * 0.5)) * 0.6 + Math.cos(cati * 0.3) * 0.4
        data.push([cati, ci, activity])
      })
    })

    return {
      tooltip: {
        position: 'top',
        formatter: (params: { value: number[] }) => {
          const cat = categories[params.value[0]]
          const cancer = cancerSamples[params.value[1]]
          return `${CANCER_LABELS[cancer as keyof typeof CANCER_LABELS] || cancer}<br/>${cat}: ${params.value[2].toFixed(3)}`
        },
      },
      grid: { left: '15%', right: '10%', top: 10, bottom: '15%' },
      xAxis: {
        type: 'category',
        data: categories,
        axisLabel: { rotate: 45, fontSize: 10, color: '#94a3b8' },
        splitArea: { show: true },
      },
      yAxis: {
        type: 'category',
        data: cancerSamples.map((c) => CANCER_LABELS[c as keyof typeof CANCER_LABELS] || c),
        axisLabel: { fontSize: 10, color: '#94a3b8' },
        splitArea: { show: true },
      },
      visualMap: {
        min: -1,
        max: 1,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: 0,
        inRange: { color: ['#3b82f6', '#e2e8f0', '#ef4444'] },
        text: ['激活', '抑制'],
        textStyle: { color: '#94a3b8' },
      },
      series: [{
        type: 'heatmap',
        data,
        label: { show: false },
        emphasis: {
          itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' },
        },
        itemStyle: { borderRadius: 2 },
      }],
    }
  }, [pathways])

  const responseBarOption = useMemo(() => {
    if (moaResults.length === 0) return {}

    const cancerOrder = ['LUAD', 'BRCA', 'COAD', 'STAD', 'LIHC', 'PAAD', 'KIRC']
    const moaOrder = ['ICI', 'TKI', 'CHEMO', 'PARP', 'HER2']
    const series = moaOrder.map((moa) => {
      const data = cancerOrder.map((cancer) => {
        const r = moaResults.find((m) => m.moaClass === moa && m.cancerType === cancer)
        return r ? (r.responseRate * 100).toFixed(1) : 0
      })
      return { name: moa, type: 'bar' as const, data, barGap: '10%' }
    })

    return {
      tooltip: { trigger: 'axis' as const },
      legend: {
        data: moaOrder,
        textStyle: { color: '#94a3b8', fontSize: 11 },
        top: 0,
      },
      grid: { left: '3%', right: '4%', bottom: '3%', top: 30, containLabel: true },
      xAxis: {
        type: 'category' as const,
        data: cancerOrder.map((c) => CANCER_LABELS[c as keyof typeof CANCER_LABELS] || c),
        axisLabel: { color: '#94a3b8', fontSize: 10 },
      },
      yAxis: {
        type: 'value' as const,
        name: '响应率 (%)',
        axisLabel: { color: '#94a3b8' },
        max: 100,
      },
      series,
      color: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'],
    }
  }, [moaResults])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-primary-900 to-slate-900 p-8 text-white">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary-500/20 to-medical-500/20 rounded-full blur-3xl" />
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-2">
            {CANCER_LABELS[selectedCancer]} - 功能数字化病人库
          </h2>
          <p className="text-slate-300 max-w-2xl text-sm leading-relaxed">
            基于DAGG算法将基因组数据转化为500+细胞功能与信号通路的活性图谱，
            实现从癌种到通路到基因的患者数字孪生建模，支撑虚拟临床试验和新适应症预测。
          </p>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => navigate('/pathway')}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Activity className="w-4 h-4" />
              通路分析
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/moa')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <FlaskConical className="w-4 h-4" />
              MOA虚拟试验
            </button>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Users} label="数字孪生患者" value={summary?.totalPatients || 0}
          trend="+12%" color="bg-blue-500"
        />
        <StatCard
          icon={Activity} label="信号通路" value={summary?.pathways || 0}
          color="bg-purple-500"
        />
        <StatCard
          icon={Dna} label="基因组突变" value={summary?.totalMutations.toLocaleString() || 0}
          color="bg-emerald-500"
        />
        <StatCard
          icon={Target} label="支持癌种" value={summary?.cancerTypes || 0}
          trend="全覆盖" color="bg-amber-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Heatmap */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              泛癌种通路活性热力图
            </h3>
            <span className="text-xs text-slate-400">点击进入详细分析</span>
          </div>
          <ReactEChartsCore
            echarts={echarts}
            option={heatmapOption}
            style={{ height: 320 }}
            onEvents={{
              click: () => navigate('/pathway'),
            }}
          />
        </div>

        {/* MOA Response Bar Chart */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-medical-500" />
              MOA虚拟试验响应率
            </h3>
            <span className="text-xs text-slate-400">各癌种对比</span>
          </div>
          <ReactEChartsCore
            echarts={echarts}
            option={responseBarOption}
            style={{ height: 320 }}
            onEvents={{
              click: () => navigate('/moa'),
            }}
          />
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { path: '/pathway', label: '通路活性图谱', desc: '四层数据钻取分析', icon: Activity, color: 'from-primary-500 to-blue-600' },
          { path: '/moa', label: 'MOA虚拟试验', desc: '药物响应预测统计', icon: FlaskConical, color: 'from-medical-500 to-emerald-600' },
          { path: '/ai', label: 'AI分析助手', desc: '自然语言数据查询', icon: Zap, color: 'from-purple-500 to-pink-600' },
        ].map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`glass-card p-5 text-left hover:shadow-lg transition-all group hover:-translate-y-0.5`}
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-3`}>
              <item.icon className="w-5 h-5 text-white" />
            </div>
            <h4 className="font-semibold text-slate-800 dark:text-white group-hover:text-primary-500 transition-colors">
              {item.label}
            </h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{item.desc}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
