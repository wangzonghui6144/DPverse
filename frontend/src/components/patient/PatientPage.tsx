import React, { memo, useCallback, useRef, useMemo, useState } from 'react'
import { usePatientData } from '../../hooks/useDataLoader'
import { useAppStore } from '../../stores/appStore'
import { CANCER_LABELS } from '../../types'
import type { Patient } from '../../types'
import { Users, Search, ChevronDown, X, Dna } from 'lucide-react'
import { useVirtualizer } from '@tanstack/react-virtual'
import ReactEChartsCore from 'echarts-for-react/esm/core'
import * as echarts from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([BarChart, GridComponent, TooltipComponent, CanvasRenderer])

const PatientRow = memo(function PatientRow({
  patient, onClick, style,
}: {
  patient: Patient
  onClick: (patient: Patient) => void
  style: React.CSSProperties
}) {
  const highImpactMuts = patient.mutations.filter((m) => m.impact === 'HIGH').slice(0, 5)

  return (
    <div
      style={style}
      onClick={() => onClick(patient)}
      className="flex items-center gap-4 px-4 py-3 border-t border-slate-100 dark:border-slate-800
                 hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer transition-colors"
    >
      <div className="w-20 flex-shrink-0">
        <span className="font-mono text-sm text-primary-600 dark:text-primary-400 font-medium">
          {patient.id}
        </span>
      </div>
      <div className="w-24 flex-shrink-0">
        <span className="text-sm text-slate-700 dark:text-slate-300">
          {CANCER_LABELS[patient.cancerType]}
        </span>
      </div>
      <div className="w-16 flex-shrink-0">
        <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
          {patient.subType}
        </span>
      </div>
      <div className="w-12 flex-shrink-0 text-sm text-slate-500">{patient.age}岁</div>
      <div className="w-8 flex-shrink-0 text-sm text-slate-500">{patient.gender}</div>
      <div className="w-16 flex-shrink-0">
        <span className={`text-xs px-2 py-0.5 rounded font-medium
          ${patient.stage === 'IV' ? 'bg-red-100 text-red-700' :
            patient.stage === 'III' ? 'bg-amber-100 text-amber-700' :
            'bg-medical-100 text-medical-700'}`}
        >
          Stage {patient.stage}
        </span>
      </div>
      <div className="w-20 flex-shrink-0 text-sm text-slate-500">
        {patient.mutations.length} 突变
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex gap-1 overflow-hidden">
          {highImpactMuts.map((m, i) => (
            <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 truncate">
              {m.gene}
            </span>
          ))}
          {patient.mutations.filter((m) => m.impact === 'HIGH').length > 5 && (
            <span className="text-xs text-slate-400">
              +{patient.mutations.filter((m) => m.impact === 'HIGH').length - 5}
            </span>
          )}
        </div>
      </div>
      <div className="w-6 flex-shrink-0 text-slate-400">
        <ChevronDown className="w-4 h-4" />
      </div>
    </div>
  )
})

function PatientDetailPanel({ patient, onClose }: { patient: Patient; onClose: () => void }) {
  const barOption = useMemo(() => {
    const topMutations = patient.mutations
      .filter((m) => m.impact === 'HIGH')
      .slice(0, 15)
    return {
      tooltip: { trigger: 'axis' as const },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category' as const,
        data: topMutations.map((m) => m.gene),
        axisLabel: { fontSize: 9, color: '#94a3b8', rotate: 45 },
      },
      yAxis: {
        type: 'value' as const,
        name: 'VAF',
        axisLabel: { color: '#94a3b8' },
        max: 1,
      },
      series: [{
        type: 'bar',
        data: topMutations.map((m) => ({
          value: m.vaf,
          itemStyle: {
            color: m.impact === 'HIGH' ? '#ef4444' : '#f59e0b',
            borderRadius: [4, 4, 0, 0],
          },
        })),
      }],
    }
  }, [patient])

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Dna className="w-5 h-5 text-primary-500" />
            患者详情: {patient.id}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><span className="stat-label">癌种</span><p className="font-semibold">{CANCER_LABELS[patient.cancerType]}</p></div>
            <div><span className="stat-label">亚型</span><p className="font-semibold">{patient.subType}</p></div>
            <div><span className="stat-label">分期</span><p className="font-semibold">Stage {patient.stage}</p></div>
            <div><span className="stat-label">突变总数</span><p className="font-semibold">{patient.mutations.length}</p></div>
          </div>
          <div>
            <h4 className="section-title mb-2">高影响突变VAF分布</h4>
            <ReactEChartsCore echarts={echarts} option={barOption} style={{ height: 250 }} />
          </div>
          <div>
            <h4 className="section-title mb-2">全部突变</h4>
            <div className="max-h-48 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="pb-2 font-medium">基因</th>
                    <th className="pb-2 font-medium">类型</th>
                    <th className="pb-2 font-medium">影响</th>
                    <th className="pb-2 font-medium">VAF</th>
                  </tr>
                </thead>
                <tbody>
                  {patient.mutations.map((m, i) => (
                    <tr key={i} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="py-1.5 font-mono text-sm">{m.gene}</td>
                      <td className="py-1.5 text-sm">{m.type}</td>
                      <td className="py-1.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded
                          ${m.impact === 'HIGH' ? 'bg-red-100 text-red-700' : m.impact === 'MODERATE' ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-600'}`}
                        >
                          {m.impact}
                        </span>
                      </td>
                      <td className="py-1.5 font-mono text-sm">{(m.vaf * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PatientPage() {
  const { patients, totalPatients, loadMore, hasMore } = usePatientData()
  const searchQuery = useAppStore((s) => s.filters.searchQuery)
  const setSearchQuery = useAppStore((s) => s.setSearchQuery)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const parentRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: hasMore ? patients.length + 1 : patients.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,
    overscan: 10,
  })

  const handlePatientClick = useCallback((patient: Patient) => {
    setSelectedPatient(patient)
  }, [])

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-primary-500" />
            数字孪生患者
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {totalPatients.toLocaleString()} 位患者 · 支持虚拟滚动浏览
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="搜索患者ID或基因..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700
                     bg-white dark:bg-slate-900 text-slate-900 dark:text-white w-80 outline-none
                     focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Table header */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center gap-4 px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-500 uppercase tracking-wider">
          <div className="w-20 flex-shrink-0">患者ID</div>
          <div className="w-24 flex-shrink-0">癌种</div>
          <div className="w-16 flex-shrink-0">亚型</div>
          <div className="w-12 flex-shrink-0">年龄</div>
          <div className="w-8 flex-shrink-0">性别</div>
          <div className="w-16 flex-shrink-0">分期</div>
          <div className="w-20 flex-shrink-0">突变数</div>
          <div className="flex-1">关键突变</div>
          <div className="w-6 flex-shrink-0" />
        </div>

        <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
          <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
            {rowVirtualizer.getVirtualItems().map((virtualItem) => {
              const patient = patients[virtualItem.index]
              if (!patient) {
                return (
                  <div key="load-more" style={{ height: virtualItem.size, ...virtualItem.start ? { position: 'absolute', top: 0, transform: `translateY(${virtualItem.start}px)` } : {} }}>
                    {hasMore && (
                      <div className="flex justify-center py-4">
                        <button
                          onClick={loadMore}
                          className="px-4 py-2 text-sm text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950 rounded-lg"
                        >
                          加载更多...
                        </button>
                      </div>
                    )}
                  </div>
                )
              }

              return (
                <PatientRow
                  key={patient.id}
                  patient={patient}
                  onClick={handlePatientClick}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                />
              )
            })}
          </div>
        </div>
      </div>

      {/* Patient detail modal */}
      {selectedPatient && (
        <PatientDetailPanel
          patient={selectedPatient}
          onClose={() => setSelectedPatient(null)}
        />
      )}
    </div>
  )
}
