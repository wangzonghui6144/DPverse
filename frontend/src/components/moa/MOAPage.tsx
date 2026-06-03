import React, { memo, useMemo, useState } from 'react'
import { useDataStore } from '../../stores/dataStore'
import { MOA_CLASSES, CANCER_LABELS, CANCER_TYPES } from '../../types'
import type { MOAClass, CancerType } from '../../types'
import { FlaskConical, TrendingUp, TrendingDown, Target, Users } from 'lucide-react'
import ReactEChartsCore from 'echarts-for-react/esm/core'
import * as echarts from 'echarts/core'
import { BarChart, PieChart, LineChart } from 'echarts/charts'
import {
  GridComponent, TooltipComponent, TitleComponent, LegendComponent, DataZoomComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([
  BarChart, PieChart, LineChart,
  GridComponent, TooltipComponent, TitleComponent, LegendComponent, DataZoomComponent,
  CanvasRenderer,
])

const StatSummaryCard = memo(function StatSummaryCard({
  label, value, sub, icon: Icon, color,
}: {
  label: string; value: string; sub?: string; icon: React.ElementType; color: string;
}) {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="text-2xl font-bold text-slate-800 dark:text-white">{value}</div>
          <div className="stat-label">{label}</div>
          {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
        </div>
      </div>
    </div>
  )
})

export default function MOAPage() {
  const moaResults = useDataStore((s) => s.moaResults)
  const [selectedMOA, setSelectedMOA] = useState<MOAClass>('ICI')
  const [selectedCancers] = useState<CancerType[]>(
    CANCER_TYPES.slice(0, 8)
  )

  const filteredResults = useMemo(() =>
    moaResults.filter((r) => r.moaClass === selectedMOA),
  [moaResults, selectedMOA])

  const summaryStats = useMemo(() => {
    const relevant = moaResults.filter((r) => r.moaClass === selectedMOA)
    const avgRR = relevant.length > 0
      ? relevant.reduce((s, r) => s + r.responseRate, 0) / relevant.length
      : 0
    const best = relevant.reduce((best, r) => r.responseRate > best.responseRate ? r : best, relevant[0])
    const worst = relevant.reduce((worst, r) => r.responseRate < worst.responseRate ? r : worst, relevant[0])
    return { avgRR, best, worst }
  }, [moaResults, selectedMOA])

  const barOption = useMemo(() => {
    const data = selectedCancers.map((cancer) => {
      const r = filteredResults.find((r) => r.cancerType === cancer)
      return {
        name: CANCER_LABELS[cancer],
        value: r ? r.responseRate * 100 : 0,
        responders: r?.responders || 0,
        total: r?.totalPatients || 0,
      }
    }).sort((a, b) => b.value - a.value)

    return {
      tooltip: {
        trigger: 'axis' as const,
        formatter: (params: Array<{ name: string; data: { responders: number; total: number; value: number } }>) => {
          const d = params[0]
          return d ? `${d.name}<br/>响应率: ${d.data.value.toFixed(1)}%<br/>响应: ${d.data.responders} / ${d.data.total}` : ''
        },
      },
      grid: { left: '3%', right: '4%', bottom: '3%', top: 10, containLabel: true },
      xAxis: {
        type: 'category' as const,
        data: data.map((d) => d.name),
        axisLabel: { rotate: 45, fontSize: 11, color: '#94a3b8' },
      },
      yAxis: {
        type: 'value' as const,
        name: '响应率 (%)',
        max: 100,
        axisLabel: { color: '#94a3b8' },
      },
      series: [{
        type: 'bar',
        data: data.map((d) => ({
          value: d.value,
          itemStyle: {
            color: d.value > 50 ? '#10b981' : d.value > 25 ? '#f59e0b' : '#ef4444',
            borderRadius: [6, 6, 0, 0],
          },
        })),
        label: {
          show: true,
          position: 'top',
          formatter: (p: { value: number }) => `${p.value.toFixed(1)}%`,
          fontSize: 10,
          color: '#94a3b8',
        },
        barMaxWidth: 50,
      }],
    }
  }, [filteredResults, selectedCancers])

  const stackedOption = useMemo(() => {
    const data = selectedCancers.map((cancer) => {
      const r = filteredResults.find((r) => r.cancerType === cancer)
      if (!r) return { name: cancer, responders: 0, nonResponders: 0 }
      return {
        name: CANCER_LABELS[cancer],
        responders: r.responders,
        nonResponders: r.nonResponders,
      }
    })

    return {
      tooltip: { trigger: 'axis' as const },
      legend: {
        data: ['响应者', '非响应者'],
        textStyle: { color: '#94a3b8', fontSize: 11 },
        top: 0,
      },
      grid: { left: '3%', right: '4%', bottom: '3%', top: 30, containLabel: true },
      xAxis: {
        type: 'category' as const,
        data: data.map((d) => d.name),
        axisLabel: { rotate: 45, fontSize: 10, color: '#94a3b8' },
      },
      yAxis: {
        type: 'value' as const,
        name: '患者数',
        axisLabel: { color: '#94a3b8' },
      },
      series: [
        {
          name: '响应者',
          type: 'bar',
          stack: 'total',
          data: data.map((d) => d.responders),
          itemStyle: { color: '#10b981', borderRadius: [0, 0, 0, 0] },
          barMaxWidth: 40,
        },
        {
          name: '非响应者',
          type: 'bar',
          stack: 'total',
          data: data.map((d) => d.nonResponders),
          itemStyle: { color: '#e2e8f0', borderRadius: [4, 4, 0, 0] },
          barMaxWidth: 40,
        },
      ],
    }
  }, [filteredResults, selectedCancers])

  const moaCategoryGroups = useMemo(() => {
    const groups: Record<string, { key: MOAClass; label: string }[]> = {}
    MOA_CLASSES.forEach((m) => {
      if (!groups[m.category]) groups[m.category] = []
      groups[m.category].push(m)
    })
    return groups
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-medical-500" />
            MOA虚拟试验
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            药物作用机制虚拟试验 —— 患者响应统计分析
          </p>
        </div>
      </div>

      {/* MOA Category + Class selectors */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap gap-4">
          {Object.entries(moaCategoryGroups).map(([category, classes]) => (
            <div key={category} className="flex-1 min-w-[200px]">
              <div className="text-xs font-medium text-slate-500 mb-2">{category}</div>
              <div className="flex flex-wrap gap-1.5">
                {classes.map((moa) => (
                  <button
                    key={moa.key}
                    onClick={() => setSelectedMOA(moa.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                      ${selectedMOA === moa.key
                        ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                  >
                    {moa.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatSummaryCard
          label="平均响应率"
          value={`${(summaryStats.avgRR * 100).toFixed(1)}%`}
          icon={Target} color="bg-blue-500"
        />
        <StatSummaryCard
          label="最佳响应癌种"
          value={summaryStats.best ? CANCER_LABELS[summaryStats.best.cancerType] : '-'}
          sub={summaryStats.best ? `${(summaryStats.best.responseRate * 100).toFixed(1)}% 响应率` : ''}
          icon={TrendingUp} color="bg-medical-500"
        />
        <StatSummaryCard
          label="最低响应癌种"
          value={summaryStats.worst ? CANCER_LABELS[summaryStats.worst.cancerType] : '-'}
          sub={summaryStats.worst ? `${(summaryStats.worst.responseRate * 100).toFixed(1)}% 响应率` : ''}
          icon={TrendingDown} color="bg-red-500"
        />
        <StatSummaryCard
          label="覆盖患者数"
          value={filteredResults.reduce((s, r) => s + r.totalPatients, 0).toLocaleString()}
          icon={Users} color="bg-purple-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-5">
          <h4 className="section-title mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            各癌种响应率对比
          </h4>
          <ReactEChartsCore echarts={echarts} option={barOption} style={{ height: 380 }} />
        </div>
        <div className="glass-card p-5">
          <h4 className="section-title mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-500" />
            响应者/非响应者分布
          </h4>
          <ReactEChartsCore echarts={echarts} option={stackedOption} style={{ height: 380 }} />
        </div>
      </div>

      {/* Detailed table */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h4 className="section-title">详细数据表</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50">
                <th className="px-4 py-3 font-medium">癌种</th>
                <th className="px-4 py-3 font-medium">总患者数</th>
                <th className="px-4 py-3 font-medium">响应者</th>
                <th className="px-4 py-3 font-medium">非响应者</th>
                <th className="px-4 py-3 font-medium">响应率</th>
                <th className="px-4 py-3 font-medium">生物标志物富集</th>
              </tr>
            </thead>
            <tbody>
              {filteredResults
                .sort((a, b) => b.responseRate - a.responseRate)
                .map((r) => (
                  <tr key={`${r.moaClass}_${r.cancerType}`} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">
                      {CANCER_LABELS[r.cancerType]}
                    </td>
                    <td className="px-4 py-3 font-mono">{r.totalPatients}</td>
                    <td className="px-4 py-3 font-mono text-medical-600">{r.responders}</td>
                    <td className="px-4 py-3 font-mono text-slate-400">{r.nonResponders}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 max-w-[100px]">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-medical-400 to-medical-500"
                            style={{ width: `${r.responseRate * 100}%` }}
                          />
                        </div>
                        <span className="font-mono font-medium">{(r.responseRate * 100).toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(r.biomarkerEnrichment).slice(0, 3).map(([bm, fold]) => (
                          <span key={bm} className="text-xs px-1.5 py-0.5 rounded bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400">
                            {bm}: {fold.toFixed(1)}x
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
