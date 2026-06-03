import React, { memo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAppStore } from '../../stores/appStore'
import { CANCER_TYPES, CANCER_LABELS } from '../../types'
import {
  LayoutDashboard, Activity, FlaskConical, Users,
  Dna, MessageSquare, ChevronLeft, Search,
} from 'lucide-react'

const NAV_ITEMS = [
  { path: '/', label: '总览仪表盘', icon: LayoutDashboard },
  { path: '/pathway', label: '通路活性图谱', icon: Activity },
  { path: '/moa', label: 'MOA虚拟试验', icon: FlaskConical },
  { path: '/patients', label: '数字孪生患者', icon: Users },
  { path: '/genes', label: '基因分析', icon: Dna },
  { path: '/ai', label: 'AI分析助手', icon: MessageSquare },
]

export const Sidebar = memo(function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const sidebarOpen = useAppStore((s) => s.sidebarOpen)
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)
  const selectedCancer = useAppStore((s) => s.selectedCancer)
  const setSelectedCancer = useAppStore((s) => s.setSelectedCancer)
  const searchQuery = useAppStore((s) => s.filters.searchQuery)
  const setSearchQuery = useAppStore((s) => s.setSearchQuery)
  const [cancerSearch, setCancerSearch] = React.useState('')
  const [showCancerList, setShowCancerList] = React.useState(false)

  const filteredCancers = CANCER_TYPES.filter((c) =>
    CANCER_LABELS[c].toLowerCase().includes(cancerSearch.toLowerCase()) ||
    c.toLowerCase().includes(cancerSearch.toLowerCase())
  )

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full z-50 transition-all duration-300 flex flex-col
          ${sidebarOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full lg:translate-x-0 lg:w-20'}
          bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <div className={`flex items-center gap-2 ${!sidebarOpen && 'lg:hidden'}`}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-medical-500 flex items-center justify-center">
              <Dna className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-800 dark:text-white text-sm">
              DPverse
            </span>
          </div>
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
          >
            <ChevronLeft className={`w-4 h-4 transition-transform ${!sidebarOpen && 'lg:rotate-180'}`} />
          </button>
        </div>

        {/* Search */}
        {sidebarOpen && (
          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="搜索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700
                         bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white
                         focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
        )}

        {/* Cancer Type Selector */}
        <div className={`px-3 pb-2 ${!sidebarOpen && 'lg:px-2'}`}>
          <button
            onClick={() => setShowCancerList(!showCancerList)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
              bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300
              hover:bg-primary-100 dark:hover:bg-primary-900 transition-colors
              ${!sidebarOpen && 'lg:justify-center lg:px-2'}`}
          >
            <Activity className="w-4 h-4 flex-shrink-0" />
            {sidebarOpen && (
              <>
                <span className="flex-1 text-left truncate">
                  {CANCER_LABELS[selectedCancer]}
                </span>
                <span className="text-xs opacity-60">{selectedCancer}</span>
              </>
            )}
          </button>

          {showCancerList && sidebarOpen && (
            <div className="mt-1 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
              <div className="p-2">
                <input
                  type="text"
                  placeholder="搜索癌种..."
                  value={cancerSearch}
                  onChange={(e) => setCancerSearch(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700
                           bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                />
              </div>
              <div className="max-h-48 overflow-y-auto">
                {filteredCancers.map((cancer) => (
                  <button
                    key={cancer}
                    onClick={() => {
                      setSelectedCancer(cancer)
                      setShowCancerList(false)
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs
                      ${selectedCancer === cancer
                        ? 'bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                  >
                    <span>{CANCER_LABELS[cancer]}</span>
                    <span className="text-slate-400">{cancer}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const active = location.pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${active
                    ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }
                  ${!sidebarOpen && 'lg:justify-center lg:px-2'}`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className={`p-3 border-t border-slate-200 dark:border-slate-800 ${!sidebarOpen && 'lg:hidden'}`}>
          <div className="flex items-center gap-2 px-3 py-2 text-xs text-slate-400">
            <div className="w-2 h-2 rounded-full bg-medical-500 animate-pulse" />
            {sidebarOpen && <span>DAGG Engine v2.4.1</span>}
          </div>
        </div>
      </aside>
    </>
  )
})
