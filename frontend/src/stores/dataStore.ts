import { create } from 'zustand'
import type {
  Patient, Pathway, Gene, MOAResult, DashboardSummary,
  ComputationTask, APSPData,
} from '../types'

interface DataState {
  // Dashboard
  summary: DashboardSummary | null
  setSummary: (summary: DashboardSummary) => void

  // Patients
  patients: Patient[]
  totalPatients: number
  patientPage: number
  pageSize: number
  setPatients: (patients: Patient[], total: number) => void
  appendPatients: (patients: Patient[]) => void
  setPatientPage: (page: number) => void
  selectedPatientDetail: Patient | null
  setSelectedPatientDetail: (patient: Patient | null) => void

  // Pathways
  pathways: Pathway[]
  setPathways: (pathways: Pathway[]) => void

  // Genes
  genes: Gene[]
  setGenes: (genes: Gene[]) => void

  // APSP data cache
  apspCache: Record<string, APSPData>
  setAPSP: (patientId: string, data: APSPData) => void

  // MOA results
  moaResults: MOAResult[]
  setMOAResults: (results: MOAResult[]) => void

  // Computation tasks
  tasks: ComputationTask[]
  addTask: (task: ComputationTask) => void
  updateTask: (taskId: string, update: Partial<ComputationTask>) => void

  // Loading states
  loading: Record<string, boolean>
  setLoading: (key: string, value: boolean) => void
  error: Record<string, string | null>
  setError: (key: string, value: string | null) => void
}

export const useDataStore = create<DataState>((set) => ({
  summary: null,
  setSummary: (summary) => set({ summary }),

  patients: [],
  totalPatients: 0,
  patientPage: 1,
  pageSize: 50,
  setPatients: (patients, total) => set({ patients, totalPatients: total }),
  appendPatients: (patients) => set((s) => ({ patients: [...s.patients, ...patients] })),
  setPatientPage: (page) => set({ patientPage: page }),
  selectedPatientDetail: null,
  setSelectedPatientDetail: (patient) => set({ selectedPatientDetail: patient }),

  pathways: [],
  setPathways: (pathways) => set({ pathways }),

  genes: [],
  setGenes: (genes) => set({ genes }),

  apspCache: {},
  setAPSP: (patientId, data) => set((s) => ({
    apspCache: { ...s.apspCache, [patientId]: data },
  })),

  moaResults: [],
  setMOAResults: (results) => set({ moaResults: results }),

  tasks: [],
  addTask: (task) => set((s) => ({ tasks: [...s.tasks, task] })),
  updateTask: (taskId, update) => set((s) => ({
    tasks: s.tasks.map((t) => t.taskId === taskId ? { ...t, ...update } : t),
  })),

  loading: {},
  setLoading: (key, value) => set((s) => ({
    loading: { ...s.loading, [key]: value },
  })),
  error: {},
  setError: (key, value) => set((s) => ({
    error: { ...s.error, [key]: value },
  })),
}))
