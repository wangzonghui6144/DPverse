import { create } from 'zustand'
import type { CancerType, FilterState, PathwayCategory, MOAClass } from '../types'

interface AppState {
  // Theme
  theme: 'light' | 'dark'
  toggleTheme: () => void

  // Selected cancer type
  selectedCancer: CancerType
  setSelectedCancer: (cancer: CancerType) => void

  // Sidebar
  sidebarOpen: boolean
  toggleSidebar: () => void

  // Filters
  filters: FilterState
  setCancerFilter: (cancers: CancerType[]) => void
  setPathwayFilter: (pathways: string[]) => void
  setGeneFilter: (genes: string[]) => void
  setMOAClassFilter: (classes: MOAClass[]) => void
  setPathwayCategoryFilter: (category: PathwayCategory | null) => void
  setActivityRange: (range: [number, number]) => void
  setSearchQuery: (query: string) => void
  resetFilters: () => void

  // Drill-down state
  drillLevel: 1 | 2 | 3 | 4
  setDrillLevel: (level: 1 | 2 | 3 | 4) => void
  selectedPathway: string | null
  setSelectedPathway: (pathwayId: string | null) => void
  selectedGene: string | null
  setSelectedGene: (gene: string | null) => void
  selectedPatient: string | null
  setSelectedPatient: (patientId: string | null) => void

  // WebSocket
  wsConnected: boolean
  setWsConnected: (connected: boolean) => void
}

const defaultFilters: FilterState = {
  selectedCancers: [],
  selectedPathways: [],
  selectedGenes: [],
  selectedMOAClasses: [],
  pathwayCategoryFilter: null,
  activityRange: [-1, 1],
  mutationImpactFilter: ['HIGH', 'MODERATE'],
  searchQuery: '',
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'dark',
  toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),

  selectedCancer: 'LUAD',
  setSelectedCancer: (cancer) => set({ selectedCancer: cancer }),

  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  filters: { ...defaultFilters },
  setCancerFilter: (cancers) => set((s) => ({ filters: { ...s.filters, selectedCancers: cancers } })),
  setPathwayFilter: (pathways) => set((s) => ({ filters: { ...s.filters, selectedPathways: pathways } })),
  setGeneFilter: (genes) => set((s) => ({ filters: { ...s.filters, selectedGenes: genes } })),
  setMOAClassFilter: (classes) => set((s) => ({ filters: { ...s.filters, selectedMOAClasses: classes } })),
  setPathwayCategoryFilter: (category) => set((s) => ({ filters: { ...s.filters, pathwayCategoryFilter: category } })),
  setActivityRange: (range) => set((s) => ({ filters: { ...s.filters, activityRange: range } })),
  setSearchQuery: (query) => set((s) => ({ filters: { ...s.filters, searchQuery: query } })),
  resetFilters: () => set({ filters: { ...defaultFilters } }),

  drillLevel: 1,
  setDrillLevel: (level) => set({ drillLevel: level }),
  selectedPathway: null,
  setSelectedPathway: (pathwayId) => set({ selectedPathway: pathwayId }),
  selectedGene: null,
  setSelectedGene: (gene) => set({ selectedGene: gene }),
  selectedPatient: null,
  setSelectedPatient: (patientId) => set({ selectedPatient: patientId }),

  wsConnected: false,
  setWsConnected: (connected) => set({ wsConnected: connected }),
}))
