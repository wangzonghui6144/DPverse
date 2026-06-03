import { useEffect, useState, useCallback, useRef } from 'react'
import { useDataStore } from '../stores/dataStore'
import { useAppStore } from '../stores/appStore'
import {
  generatePathways, generateGenes, generatePatients,
  generateMOAResults, generateSummary,
} from '../data/generator'
import type { Patient, Pathway, Gene } from '../types'

// Initialize global data once (simulates backend)
let globalDataInitialized = false
let globalPathways: Pathway[] = []
let globalGenes: Gene[] = []
let globalPatients: Patient[] = []

function initGlobalData() {
  if (globalDataInitialized) return
  globalPathways = generatePathways()
  globalGenes = generateGenes(globalPathways)
  globalPatients = generatePatients(globalPathways, 2000)
  globalDataInitialized = true
}

export function useInitializeData() {
  const setPathways = useDataStore((s) => s.setPathways)
  const setGenes = useDataStore((s) => s.setGenes)
  const setSummary = useDataStore((s) => s.setSummary)
  const setMOAResults = useDataStore((s) => s.setMOAResults)
  const setLoading = useDataStore((s) => s.setLoading)
  const setError = useDataStore((s) => s.setError)

  useEffect(() => {
    const load = async () => {
      setLoading('init', true)
      try {
        // Simulate API call delay
        await new Promise((r) => setTimeout(r, 600))

        initGlobalData()
        setPathways(globalPathways)
        setGenes(globalGenes)
        setSummary(generateSummary(globalPatients, globalPathways))
        setMOAResults(generateMOAResults(globalPatients))
        setLoading('init', false)
      } catch (err) {
        setError('init', 'Failed to load data')
        setLoading('init', false)
      }
    }
    load()
  }, [setPathways, setGenes, setSummary, setMOAResults, setLoading, setError])
}

export function usePatientData() {
  const { patients, setPatients, setLoading, pageSize } = useDataStore()
  const selectedCancer = useAppStore((s) => s.selectedCancer)
  const searchQuery = useAppStore((s) => s.filters.searchQuery)
  const [page, setPage] = useState(1)
  const loadingRef = useRef(false)

  const loadPatients = useCallback(async (pageNum: number) => {
    if (loadingRef.current) return
    loadingRef.current = true
    setLoading('patients', true)

    try {
      await new Promise((r) => setTimeout(r, 200)) // simulate network

      initGlobalData()
      let filtered = [...globalPatients]

      if (selectedCancer) {
        filtered = filtered.filter((p) => p.cancerType === selectedCancer)
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        filtered = filtered.filter(
          (p) =>
            p.id.toLowerCase().includes(q) ||
            p.mutations.some((m) => m.gene.toLowerCase().includes(q))
        )
      }

      const start = (pageNum - 1) * pageSize
      const pageData = filtered.slice(start, start + pageSize)

      if (pageNum === 1) {
        setPatients(pageData, filtered.length)
      } else {
        useDataStore.getState().appendPatients(pageData)
      }

      setLoading('patients', false)
      loadingRef.current = false
    } catch {
      setLoading('patients', false)
      loadingRef.current = false
    }
  }, [selectedCancer, searchQuery, pageSize, setPatients, setLoading])

  useEffect(() => {
    setPage(1)
    loadPatients(1)
  }, [selectedCancer, searchQuery])

  const loadMore = useCallback(() => {
    const nextPage = page + 1
    setPage(nextPage)
    loadPatients(nextPage)
  }, [page, loadPatients])

  return {
    patients,
    totalPatients: useDataStore((s) => s.totalPatients),
    loading: useDataStore((s) => s.loading['patients']),
    loadMore,
    hasMore: patients.length < useDataStore.getState().totalPatients,
  }
}

export function usePathwayActivityData() {
  const pathways = useDataStore((s) => s.pathways)
  const selectedCancer = useAppStore((s) => s.selectedCancer)

  // Generate activity scores for the selected cancer
  const activityData = useCallback(() => {
    initGlobalData()
    const scores: Record<string, number> = {}
    // Use consistent values based on cancer type
    const cancerIdx = selectedCancer.charCodeAt(0) + selectedCancer.charCodeAt(1)
    for (const pw of pathways) {
      const idHash = pw.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
      scores[pw.id] = Math.sin((cancerIdx * 0.7 + idHash * 0.3) * 0.5) * 0.7 +
        Math.cos(idHash * 0.2) * 0.3
    }
    return scores
  }, [pathways, selectedCancer])

  return { pathways, activityData, selectedCancer }
}
