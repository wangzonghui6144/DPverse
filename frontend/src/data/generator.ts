// -------------------------------------------------------
// Synthetic data generator for DPverse frontend
// Generates realistic mock data for development
// -------------------------------------------------------

import type {
  Patient, Pathway, Gene, GeneMutation,
  MOAResult, DashboardSummary, PathwayCategory,
} from '../types'
import { CANCER_TYPES, PATHWAY_CATEGORIES, MOA_CLASSES } from '../types'

// Seeded random for reproducibility
let seed = 42
function random(): number {
  seed = (seed * 16807) % 2147483647
  return (seed - 1) / 2147483646
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(random() * arr.length)]
}

function pickWeighted<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0)
  let r = random() * total
  for (let i = 0; i < items.length; i++) {
    r -= weights[i]
    if (r <= 0) return items[i]
  }
  return items[items.length - 1]
}

// Generate pathway names
function generatePathwayName(category: PathwayCategory, index: number): string {
  const prefixes: Record<PathwayCategory, string[]> = {
    RTK: ['EGFR', 'FGFR', 'PDGFR', 'VEGFR', 'IGF1R', 'MET', 'KIT', 'RET'],
    RAS: ['KRAS', 'NRAS', 'HRAS', 'RAS-GEF', 'RAS-GAP'],
    PI3K: ['PIK3CA', 'AKT', 'PTEN', 'PDK1', 'TSC'],
    MAPK: ['BRAF', 'MEK', 'ERK', 'MAP3K', 'MAP2K'],
    JAK_STAT: ['JAK', 'STAT', 'SOCS', 'PIAS'],
    WNT: ['WNT', 'Frizzled', 'DVL', 'GSK3B', 'APC'],
    NOTCH: ['NOTCH', 'DLL', 'JAG', 'RBPJ', 'MAML'],
    HEDGEHOG: ['SHH', 'PTCH', 'SMO', 'GLI', 'SUFU'],
    TGFB: ['TGFB', 'TGFBR', 'SMAD', 'BMP', 'ACVR'],
    CELL_CYCLE: ['CDK', 'Cyclin', 'RB', 'E2F', 'p21'],
    APOPTOSIS: ['BCL2', 'BAX', 'Caspase', 'CYCS', 'APAF1'],
    DNA_REPAIR: ['BRCA1', 'BRCA2', 'ATM', 'ATR', 'RAD51'],
    ANGIOGENESIS: ['VEGF', 'HIF1A', 'ANGPT', 'TIE', 'PDGF'],
    EMT: ['SNAI1', 'TWIST', 'ZEB', 'CDH1', 'VIM'],
    METABOLISM: ['GLUT', 'HK2', 'LDHA', 'PKM', 'GLS'],
    IMMUNE: ['PD-L1', 'CTLA4', 'TCR', 'MHC', 'CD28'],
    EPIGENETIC: ['DNMT', 'HDAC', 'EZH2', 'KDM', 'SETD2'],
    STRESS: ['HSP90', 'HIF', 'NRF2', 'ATF4', 'XBP1'],
  }
  const genes = prefixes[category] || ['GENE']
  if (index < genes.length) {
    return `${genes[index]}信号轴`
  }
  return `${category}_PATHWAY_${index + 1}`
}

// Generate all pathways (~500)
export function generatePathways(): Pathway[] {
  const pathways: Pathway[] = []
  let id = 0
  for (const cat of PATHWAY_CATEGORIES) {
    const count = 25 + Math.floor(random() * 15) // 25-39 pathways per category
    for (let i = 0; i < count; i++) {
      id++
      pathways.push({
        id: `PW_${String(id).padStart(4, '0')}`,
        name: generatePathwayName(cat.key, i),
        category: cat.key,
        description: `${cat.label}相关信号通路，调控细胞增殖、分化和存活等关键生物学过程`,
        genes: Array.from({ length: 3 + Math.floor(random() * 8) }, (_, j) => `GENE_${cat.key}_${i}_${j}`),
        downstreamEffects: [
          '细胞增殖', '细胞凋亡', '细胞迁移',
          '代谢重编程', '免疫逃逸',
        ].slice(0, 2 + Math.floor(random() * 4)),
      })
    }
  }
  return pathways
}

// Generate genes (~3000)
export function generateGenes(pathways: Pathway[]): Gene[] {
  const geneSet = new Map<string, Gene>()
  const symbols = new Set<string>()

  const knownGenes = [
    'TP53', 'KRAS', 'EGFR', 'PIK3CA', 'BRAF', 'PTEN', 'APC', 'RB1',
    'NF1', 'ATM', 'BRCA1', 'BRCA2', 'ALK', 'ROS1', 'MET', 'RET',
    'HER2', 'MYC', 'AKT1', 'MTOR', 'CTNNB1', 'NOTCH1', 'SMAD4',
    'CDKN2A', 'ARID1A', 'KMT2D', 'KMT2C', 'FAT1', 'FAT4', 'KEAP1',
    'STK11', 'NFE2L2', 'CUL3', 'TERT', 'IDH1', 'IDH2', 'FGFR1',
    'FGFR2', 'FGFR3', 'PDGFRA', 'KIT', 'FLT3', 'JAK2', 'STAT3',
    'CDH1', 'VHL', 'TSC1', 'TSC2', 'MSH2', 'MSH6', 'MLH1', 'PMS2',
    'POLE', 'POLD1', 'ERBB2', 'ESR1', 'AR', 'PGR', 'BCL2', 'MCL1',
    'CCND1', 'CCNE1', 'CDK4', 'CDK6', 'EZH2', 'DNMT3A', 'TET2',
    'ASXL1', 'RUNX1', 'SF3B1', 'SRSF2', 'U2AF1', 'ZRSR2',
  ]

  for (const sym of knownGenes) {
    const gene: Gene = {
      symbol: sym,
      name: `${sym} gene`,
      chromosome: `${1 + Math.floor(random() * 22)}`,
      mutationFrequency: random() * 0.5,
      isOncogene: random() > 0.5,
      isTSG: random() > 0.6,
      pathwayIds: pathways.slice(0, 1 + Math.floor(random() * 5)).map((p) => p.id),
      drugs: random() > 0.5 ? [`${sym}-Inhibitor-1`, `${sym}-Inhibitor-2`] : [],
    }
    geneSet.set(sym, gene)
    symbols.add(sym)
  }

  // Generate additional genes
  for (let i = 0; i < 500; i++) {
    const sym = `GENE_${String(i).padStart(3, '0')}`
    geneSet.set(sym, {
      symbol: sym,
      name: `Novel Gene ${i}`,
      chromosome: `${1 + Math.floor(random() * 22)}`,
      mutationFrequency: random() * 0.3,
      isOncogene: random() > 0.5,
      isTSG: random() > 0.7,
      pathwayIds: pathways.slice(0, 1 + Math.floor(random() * 4)).map((p) => p.id),
      drugs: [],
    })
  }

  return Array.from(geneSet.values())
}

// Generate patients (~2000)
export function generatePatients(pathways: Pathway[], count = 2000): Patient[] {
  const patients: Patient[] = []
  const mutationTypes: GeneMutation['type'][] = ['missense', 'nonsense', 'frameshift', 'inframe', 'splice', 'amp', 'del']
  const impacts: GeneMutation['impact'][] = ['HIGH', 'MODERATE', 'LOW']

  for (let i = 0; i < count; i++) {
    const cancerType = pick(CANCER_TYPES)
    const numMutations = 5 + Math.floor(random() * 45) // 5-50 mutations

    const mutations: GeneMutation[] = []
    for (let j = 0; j < numMutations; j++) {
      mutations.push({
        gene: `GENE_${Math.floor(random() * 500).toString().padStart(3, '0')}`,
        type: pick(mutationTypes),
        impact: pickWeighted(impacts, [0.3, 0.5, 0.2]),
        vaf: random() * 0.8 + 0.1,
      })
    }

    // Add some known gene mutations
    const knownPool = ['TP53', 'KRAS', 'EGFR', 'PIK3CA', 'BRAF', 'PTEN', 'APC', 'RB1']
    for (const gene of knownPool) {
      if (random() > 0.7) {
        mutations.push({
          gene,
          type: pick(mutationTypes),
          impact: 'HIGH',
          vaf: random() * 0.5 + 0.3,
        })
      }
    }

    const pathwayActivities: Record<string, number> = {}
    for (const pw of pathways) {
      pathwayActivities[pw.id] = (random() * 2 - 1) * 0.8 // [-0.8, 0.8]
    }

    patients.push({
      id: `PT_${String(i + 1).padStart(5, '0')}`,
      cancerType,
      subType: pick(['A', 'B', 'C', 'NOS']),
      age: 30 + Math.floor(random() * 55),
      gender: random() > 0.45 ? 'M' : 'F',
      stage: pickWeighted(['I', 'II', 'III', 'IV'], [0.15, 0.25, 0.3, 0.3]),
      mutations,
      apsp: {
        patientId: `PT_${String(i + 1).padStart(5, '0')}`,
        pathwayActivities,
        cellFunctions: generateCellFunctions(),
        signature: `APSP_SIG_${i}`,
      },
      predictedResponse: [],
    })
  }
  return patients
}

function generateCellFunctions(): Record<string, number> {
  const functions: Record<string, number> = {}
  for (let i = 0; i < 500; i++) {
    functions[`CF_${String(i + 1).padStart(4, '0')}`] = (random() * 2 - 1)
  }
  return functions
}

// Generate MOA results
export function generateMOAResults(patients: Patient[]): MOAResult[] {
  const results: MOAResult[] = []

  for (const moa of MOA_CLASSES) {
    for (const cancer of CANCER_TYPES) {
      const cancerPatients = patients.filter((p) => p.cancerType === cancer)
      if (cancerPatients.length === 0) continue

      const responders = Math.floor(cancerPatients.length * (0.1 + random() * 0.6))
      const subTypeBreakdown: Record<string, { total: number; responders: number }> = {}

      for (const pt of cancerPatients) {
        if (!subTypeBreakdown[pt.subType]) {
          subTypeBreakdown[pt.subType] = { total: 0, responders: 0 }
        }
        subTypeBreakdown[pt.subType].total++
        if (random() < responders / cancerPatients.length) {
          subTypeBreakdown[pt.subType].responders++
        }
      }

      results.push({
        moaClass: moa.key,
        cancerType: cancer,
        totalPatients: cancerPatients.length,
        responders,
        nonResponders: cancerPatients.length - responders,
        responseRate: responders / cancerPatients.length,
        biomarkerEnrichment: {
          'TP53_mut': random() * 3,
          'KRAS_mut': random() * 2,
          'TMB_H': random() * 4,
          'PDL1_pos': random() * 2.5,
        },
        subTypeBreakdown,
      })
    }
  }

  return results
}

// Generate dashboard summary
export function generateSummary(patients: Patient[], pathways: Pathway[]): DashboardSummary {
  const uniqueCancers = new Set(patients.map((p) => p.cancerType))
  const totalMutations = patients.reduce((sum, p) => sum + p.mutations.length, 0)

  return {
    totalPatients: patients.length,
    cancerTypes: uniqueCancers.size,
    pathways: pathways.length,
    cellFunctions: 500,
    totalMutations,
    avgPathwayCoverage: 0.85,
    computedAt: new Date().toISOString(),
  }
}
