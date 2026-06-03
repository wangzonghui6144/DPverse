import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { Loader2 } from 'lucide-react'

// Lazy load pages for better initial load performance
const DashboardPage = lazy(() => import('./components/dashboard/DashboardPage'))
const PathwayPage = lazy(() => import('./components/pathway/PathwayPage'))
const MOAPage = lazy(() => import('./components/moa/MOAPage'))
const PatientPage = lazy(() => import('./components/patient/PatientPage'))
const GenePage = lazy(() => import('./components/gene/GenePage'))
const AIPage = lazy(() => import('./components/ai/AIPage'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        <span className="text-sm text-slate-500">加载中...</span>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={
            <Suspense fallback={<PageLoader />}>
              <DashboardPage />
            </Suspense>
          } />
          <Route path="/pathway" element={
            <Suspense fallback={<PageLoader />}>
              <PathwayPage />
            </Suspense>
          } />
          <Route path="/moa" element={
            <Suspense fallback={<PageLoader />}>
              <MOAPage />
            </Suspense>
          } />
          <Route path="/patients" element={
            <Suspense fallback={<PageLoader />}>
              <PatientPage />
            </Suspense>
          } />
          <Route path="/genes" element={
            <Suspense fallback={<PageLoader />}>
              <GenePage />
            </Suspense>
          } />
          <Route path="/ai" element={
            <Suspense fallback={<PageLoader />}>
              <AIPage />
            </Suspense>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
