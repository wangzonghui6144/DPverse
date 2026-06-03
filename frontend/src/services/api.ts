import type {
  CancerType, Patient, Pathway, Gene, MOAResult,
  DashboardSummary, APSPData, MOAClass,
} from '../types'

const BASE_URL = '/api'

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`)
  return res.json()
}

// Dashboard
export async function fetchSummary(): Promise<DashboardSummary> {
  return fetchJSON<DashboardSummary>('/summary')
}

// Patients
export async function fetchPatients(params: {
  cancerType?: CancerType
  page?: number
  pageSize?: number
  search?: string
}): Promise<{ patients: Patient[]; total: number }> {
  const searchParams = new URLSearchParams()
  if (params.cancerType) searchParams.set('cancer_type', params.cancerType)
  if (params.page) searchParams.set('page', String(params.page))
  if (params.pageSize) searchParams.set('page_size', String(params.pageSize))
  if (params.search) searchParams.set('search', params.search)
  return fetchJSON(`/patients?${searchParams}`)
}

export async function fetchPatientDetail(patientId: string): Promise<Patient> {
  return fetchJSON(`/patients/${patientId}`)
}

export async function fetchPatientAPSP(patientId: string): Promise<APSPData> {
  return fetchJSON(`/patients/${patientId}/apsp`)
}

// Pathways
export async function fetchPathways(params?: {
  cancerType?: CancerType
  category?: string
}): Promise<Pathway[]> {
  const searchParams = new URLSearchParams()
  if (params?.cancerType) searchParams.set('cancer_type', params.cancerType)
  if (params?.category) searchParams.set('category', params.category)
  const qs = searchParams.toString()
  return fetchJSON(`/pathways${qs ? `?${qs}` : ''}`)
}

export async function fetchPathwayActivity(cancerType: CancerType): Promise<Record<string, number>> {
  return fetchJSON(`/pathways/activity?cancer_type=${cancerType}`)
}

// Genes
export async function fetchGenes(params?: {
  pathwayId?: string
  cancerType?: CancerType
}): Promise<Gene[]> {
  const searchParams = new URLSearchParams()
  if (params?.pathwayId) searchParams.set('pathway_id', params.pathwayId)
  if (params?.cancerType) searchParams.set('cancer_type', params.cancerType)
  const qs = searchParams.toString()
  return fetchJSON(`/genes${qs ? `?${qs}` : ''}`)
}

// MOA
export async function fetchMOAResults(params: {
  moaClass?: MOAClass
  cancerType?: CancerType
}): Promise<MOAResult[]> {
  const searchParams = new URLSearchParams()
  if (params.moaClass) searchParams.set('moa_class', params.moaClass)
  if (params.cancerType) searchParams.set('cancer_type', params.cancerType)
  return fetchJSON(`/moa?${searchParams}`)
}

// Computation
export async function submitComputation(params: {
  type: 'batch_apsp' | 'moa_simulation' | 'pathway_analysis'
  cancerTypes: CancerType[]
  moaClasses?: string[]
}): Promise<{ taskId: string }> {
  return fetchJSON('/compute', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}
