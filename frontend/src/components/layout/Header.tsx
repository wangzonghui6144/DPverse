import { memo } from 'react'
import { useAppStore } from '../../stores/appStore'
import { useDataStore } from '../../stores/dataStore'
import { Sun, Moon, Bell, Database, Wifi, WifiOff, Users, Activity, Dna } from 'lucide-react'

export const Header = memo(function Header() {
  const theme = useAppStore((s) => s.theme)
  const toggleTheme = useAppStore((s) => s.toggleTheme)
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)
  const wsConnected = useAppStore((s) => s.wsConnected)
  const summary = useDataStore((s) => s.summary)
  const tasks = useDataStore((s) => s.tasks)
  const activeTasks = tasks.filter((t) => t.status === 'running' || t.status === 'queued')

  return (
    <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 lg:hidden"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="hidden sm:flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-medical-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">
              DPverse
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              泛癌种功能数字化病人库
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {summary && (
          <div className="hidden md:flex items-center gap-4 mr-4 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>{summary.totalPatients.toLocaleString()} 患者</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              <span>{summary.pathways} 通路</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Dna className="w-3.5 h-3.5" />
              <span>{summary.cancerTypes} 癌种</span>
            </div>
          </div>
        )}

        <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium
          ${wsConnected
            ? 'bg-medical-50 dark:bg-medical-950 text-medical-600 dark:text-medical-400'
            : 'bg-red-50 dark:bg-red-950 text-red-500'
          }`}
        >
          {wsConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          <span className="hidden sm:inline">{wsConnected ? '已连接' : '未连接'}</span>
        </div>

        {activeTasks.length > 0 && (
          <button className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary-500 text-white text-[10px] flex items-center justify-center font-bold">
              {activeTasks.length}
            </span>
          </button>
        )}

        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
    </header>
  )
})
