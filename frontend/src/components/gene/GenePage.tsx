import { memo, useMemo, useState } from 'react'
import { useDataStore } from '../../stores/dataStore'
import { useAppStore } from '../../stores/appStore'
import { CANCER_LABELS } from '../../types'
import type { Gene } from '../../types'
import { Dna, Search, ArrowUpRight } from 'lucide-react'
import ReactEChartsCore from 'echarts-for-react/esm/core'
import * as echarts from 'echarts/core'
import { BarChart, ScatterChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent, DataZoomComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([BarChart, ScatterChart, GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, CanvasRenderer])

const GeneCard = memo(function GeneCard({
  gene, onClick, rank,
}: {
  gene: Gene; onClick: (gene: Gene) => void; rank: number;
}) {
  return (
    <div
      onClick={() => onClick(gene)}
      className="glass-card p-4 hover:shadow-md transition-all cursor-pointer group hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">#{rank}</span>
            <span className="font-bold text-slate-800 dark:text-white text-lg">{gene.symbol}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{gene.name}</p>
        </div>
        <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-primary-500 transition-colors" />
      </div>
      <div className="flex gap-1.5 mt-3">
        {gene.isOncogene && <span className="chip bg-red-50 text-red-600 border-red-200 text-[10px]">癌基因</span>}
        {gene.isTSG && <span className="chip bg-blue-50 text-blue-600 border-blue-200 text-[10px]">抑癌基因</span>}
      </div>
      <div className="mt-3 space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">突变频率</span>
          <span className="font-mono text-slate-700 dark:text-slate-300">
            {(gene.mutationFrequency * 100).toFixed(2)}%
          </span>
        </div>
        <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-1.5 rounded-full bg-gradient-to-r from-primary-400 to-primary-600"
            style={{ width: `${gene.mutationFrequency * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">相关通路</span>
          <span className="font-mono text-slate-700 dark:text-slate-300">{gene.pathwayIds.length}</span>
        </div>
        {gene.drugs.length > 0 && (
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">靶向药物</span>
            <span className="font-mono text-medical-600">{gene.drugs.length}个</span>
          </div>
        )}
      </div>
    </div>
  )
})

export default function GenePage() {
  const genes = useDataStore((s) => s.genes)
  const selectedCancer = useAppStore((s) => s.selectedCancer)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGene, setSelectedGene] = useState<Gene | null>(null)
  const [sortBy, setSortBy] = useState<'frequency' | 'name'>('frequency')

  const filteredGenes = useMemo(() => {
    let result = [...genes]
    if (searchTerm) {
      const s = searchTerm.toLowerCase()
      result = result.filter((g) => g.symbol.toLowerCase().includes(s))
    }
    if (sortBy === 'frequency') {
      result.sort((a, b) => b.mutationFrequency - a.mutationFrequency)
    } else {
      result.sort((a, b) => a.symbol.localeCompare(b.symbol))
    }
    return result.slice(0, 100)
  }, [genes, searchTerm, sortBy])

  const topGenes = useMemo(() =>
    [...genes].sort((a, b) => b.mutationFrequency - a.mutationFrequency).slice(0, 20),
  [genes])

  const barOption = useMemo(() => ({
    tooltip: { trigger: 'axis' as const },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category' as const,
      data: topGenes.map((g) => g.symbol),
      axisLabel: { rotate: 45, fontSize: 10, color: '#94a3b8' },
    },
    yAxis: {
      type: 'value' as const,
      name: '突变频率',
      axisLabel: { color: '#94a3b8', formatter: (v: number) => `${(v * 100).toFixed(0)}%` },
    },
    series: [{
      type: 'bar',
      data: topGenes.map((g) => ({
        value: g.mutationFrequency,
        itemStyle: {
          color: g.isOncogene ? '#ef4444' : g.isTSG ? '#3b82f6' : '#8b5cf6',
          borderRadius: [4, 4, 0, 0],
        },
      })),
      barMaxWidth: 30,
    }],
  }), [topGenes])

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Dna className="w-6 h-6 text-purple-500" />
          基因突变图谱
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          {genes.length.toLocaleString()} 个基因 · {CANCER_LABELS[selectedCancer]} 队列
        </p>
      </div>

      {/* Top genes bar chart */}
      <div className="glass-card p-5">
        <h4 className="section-title mb-4">高频突变基因 TOP20</h4>
        <ReactEChartsCore echarts={echarts} option={barOption} style={{ height: 350 }} />
      </div>

      {/* Search & filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="搜索基因符号..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700
                     bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none
                     focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'frequency' | 'name')}
          className="px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700
                   bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none"
        >
          <option value="frequency">按突变频率</option>
          <option value="name">按基因名称</option>
        </select>
      </div>

      {/* Gene grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredGenes.map((gene, i) => (
          <GeneCard
            key={gene.symbol}
            gene={gene}
            rank={i + 1}
            onClick={setSelectedGene}
          />
        ))}
      </div>

      {/* Gene detail modal */}
      {selectedGene && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedGene(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">{selectedGene.symbol}</h3>
                <div className="flex gap-2">
                  {selectedGene.isOncogene && <span className="chip bg-red-50 text-red-600">癌基因</span>}
                  {selectedGene.isTSG && <span className="chip bg-blue-50 text-blue-600">抑癌基因</span>}
                </div>
              </div>
              <p className="text-sm text-slate-500 mt-1">{selectedGene.name}</p>

              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                  <div className="text-lg font-bold text-slate-800 dark:text-white">
                    {(selectedGene.mutationFrequency * 100).toFixed(2)}%
                  </div>
                  <div className="stat-label">突变频率</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                  <div className="text-lg font-bold text-slate-800 dark:text-white">
                    {selectedGene.pathwayIds.length}
                  </div>
                  <div className="stat-label">相关通路</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                  <div className="text-lg font-bold text-slate-800 dark:text-white">
                    {selectedGene.chromosome}
                  </div>
                  <div className="stat-label">染色体</div>
                </div>
              </div>

              {selectedGene.drugs.length > 0 && (
                <div className="mt-6">
                  <h4 className="section-title mb-2">靶向药物</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedGene.drugs.map((drug) => (
                      <span key={drug} className="px-3 py-1.5 rounded-lg bg-medical-50 dark:bg-medical-950 text-medical-600 dark:text-medical-400 text-sm">
                        {drug}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
