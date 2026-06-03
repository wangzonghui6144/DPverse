// ============================================================
// DPverse Core Types
// ============================================================

// 20+ cancer types
export type CancerType =
  | 'LUAD' | 'LUSC' | 'SCLC'        // Lung
  | 'BRCA' | 'TNBC'                  // Breast
  | 'COAD' | 'READ'                  // Colorectal
  | 'STAD' | 'ESCA'                  // Gastric/Esophageal
  | 'LIHC' | 'CHOL'                  // Liver
  | 'PAAD'                          // Pancreatic
  | 'KIRC' | 'KIRP' | 'BLCA'        // Kidney/Bladder
  | 'PRAD'                          // Prostate
  | 'OV' | 'UCEC' | 'CESC'          // Gynecologic
  | 'HNSC' | 'THCA'                  // Head/Neck/Thyroid
  | 'SKCM'                          // Melanoma
  | 'GBM' | 'LGG'                   // Brain
  | 'AML'                           // Leukemia

export const CANCER_TYPES: CancerType[] = [
  'LUAD', 'LUSC', 'SCLC', 'BRCA', 'TNBC', 'COAD', 'READ',
  'STAD', 'ESCA', 'LIHC', 'CHOL', 'PAAD', 'KIRC', 'KIRP',
  'BLCA', 'PRAD', 'OV', 'UCEC', 'CESC', 'HNSC', 'THCA',
  'SKCM', 'GBM', 'LGG', 'AML',
]

export const CANCER_LABELS: Record<CancerType, string> = {
  LUAD: '肺腺癌', LUSC: '肺鳞癌', SCLC: '小细胞肺癌',
  BRCA: '乳腺癌', TNBC: '三阴性乳腺癌',
  COAD: '结肠腺癌', READ: '直肠腺癌',
  STAD: '胃腺癌', ESCA: '食管癌',
  LIHC: '肝细胞癌', CHOL: '胆管癌',
  PAAD: '胰腺癌',
  KIRC: '肾透明细胞癌', KIRP: '肾乳头状细胞癌', BLCA: '膀胱癌',
  PRAD: '前列腺癌',
  OV: '卵巢癌', UCEC: '子宫内膜癌', CESC: '宫颈癌',
  HNSC: '头颈鳞癌', THCA: '甲状腺癌',
  SKCM: '皮肤黑色素瘤',
  GBM: '胶质母细胞瘤', LGG: '低级别胶质瘤',
  AML: '急性髓系白血病',
}

// Signaling pathway categories
export type PathwayCategory =
  | 'RTK' | 'RAS' | 'PI3K' | 'MAPK' | 'JAK_STAT'
  | 'WNT' | 'NOTCH' | 'HEDGEHOG' | 'TGFB'
  | 'CELL_CYCLE' | 'APOPTOSIS' | 'DNA_REPAIR'
  | 'ANGIOGENESIS' | 'EMT' | 'METABOLISM'
  | 'IMMUNE' | 'EPIGENETIC' | 'STRESS'

export const PATHWAY_CATEGORIES: { key: PathwayCategory; label: string; color: string }[] = [
  { key: 'RTK', label: 'RTK信号', color: '#3b82f6' },
  { key: 'RAS', label: 'RAS信号', color: '#ef4444' },
  { key: 'PI3K', label: 'PI3K/AKT', color: '#8b5cf6' },
  { key: 'MAPK', label: 'MAPK通路', color: '#f59e0b' },
  { key: 'JAK_STAT', label: 'JAK/STAT', color: '#06b6d4' },
  { key: 'WNT', label: 'WNT通路', color: '#10b981' },
  { key: 'NOTCH', label: 'NOTCH信号', color: '#f97316' },
  { key: 'HEDGEHOG', label: 'Hedgehog', color: '#6366f1' },
  { key: 'TGFB', label: 'TGF-β信号', color: '#ec4899' },
  { key: 'CELL_CYCLE', label: '细胞周期', color: '#14b8a6' },
  { key: 'APOPTOSIS', label: '凋亡通路', color: '#e11d48' },
  { key: 'DNA_REPAIR', label: 'DNA修复', color: '#0ea5e9' },
  { key: 'ANGIOGENESIS', label: '血管生成', color: '#d946ef' },
  { key: 'EMT', label: 'EMT/MET', color: '#84cc16' },
  { key: 'METABOLISM', label: '代谢重编程', color: '#f43f5e' },
  { key: 'IMMUNE', label: '免疫调控', color: '#0891b2' },
  { key: 'EPIGENETIC', label: '表观遗传', color: '#a855f7' },
  { key: 'STRESS', label: '应激反应', color: '#eab308' },
]

// Pathway definition
export interface Pathway {
  id: string
  name: string
  category: PathwayCategory
  description: string
  genes: string[]
  downstreamEffects: string[]
}

// Gene definition
export interface Gene {
  symbol: string
  name: string
  chromosome: string
  mutationFrequency: number       // 0-1 across population
  isOncogene: boolean
  isTSG: boolean                  // tumor suppressor gene
  pathwayIds: string[]
  drugs: string[]                 // targeted drugs
}

// Patient digital twin
export interface Patient {
  id: string
  cancerType: CancerType
  subType: string
  age: number
  gender: 'M' | 'F'
  stage: 'I' | 'II' | 'III' | 'IV'
  mutations: GeneMutation[]
  apsp: APSPData                   // Activity Profile of Signaling Pathways
  predictedResponse: PredictedResponse[]
}

export interface GeneMutation {
  gene: string
  type: 'missense' | 'nonsense' | 'frameshift' | 'inframe' | 'splice' | 'amp' | 'del'
  impact: 'HIGH' | 'MODERATE' | 'LOW'
  vaf: number                      // variant allele frequency
}

export interface APSPData {
  patientId: string
  pathwayActivities: Record<string, number>   // pathwayId -> activity score (-1 to 1)
  cellFunctions: Record<string, number>       // 500+ cell function scores
  signature: string                           // unique activity signature
}

export interface PredictedResponse {
  drugClass: string
  drugName: string
  responseProbability: number      // 0-1
  mechanism: string
  confidence: number               // 0-1
}

// MOA (Mechanism of Action) types
export type MOAClass =
  | 'TKI'           // Tyrosine Kinase Inhibitor
  | 'ICI'           // Immune Checkpoint Inhibitor
  | 'CHEMO'         // Chemotherapy
  | 'PARP'          // PARP inhibitor
  | 'CDK46'         // CDK4/6 inhibitor
  | 'AR'            // Androgen Receptor
  | 'ER'            // Estrogen Receptor
  | 'HER2'          // HER2 targeted
  | 'EGFR'          // EGFR targeted
  | 'ALK'           // ALK targeted
  | 'BRAF'          // BRAF targeted
  | 'MEK'           // MEK targeted
  | 'PI3K'          // PI3K inhibitor
  | 'MTOR'          // mTOR inhibitor
  | 'VEGF'          // Anti-VEGF
  | 'HDAC'          // HDAC inhibitor
  | 'PROTEASOME'    // Proteasome inhibitor
  | 'CAR_T'         // CAR-T therapy

export const MOA_CLASSES: { key: MOAClass; label: string; category: string }[] = [
  { key: 'TKI', label: '酪氨酸激酶抑制剂', category: '靶向治疗' },
  { key: 'ICI', label: '免疫检查点抑制剂', category: '免疫治疗' },
  { key: 'CHEMO', label: '化学治疗', category: '化疗' },
  { key: 'PARP', label: 'PARP抑制剂', category: '靶向治疗' },
  { key: 'CDK46', label: 'CDK4/6抑制剂', category: '靶向治疗' },
  { key: 'AR', label: '雄激素受体', category: '内分泌治疗' },
  { key: 'ER', label: '雌激素受体', category: '内分泌治疗' },
  { key: 'HER2', label: 'HER2靶向', category: '靶向治疗' },
  { key: 'EGFR', label: 'EGFR靶向', category: '靶向治疗' },
  { key: 'ALK', label: 'ALK靶向', category: '靶向治疗' },
  { key: 'BRAF', label: 'BRAF抑制剂', category: '靶向治疗' },
  { key: 'MEK', label: 'MEK抑制剂', category: '靶向治疗' },
  { key: 'PI3K', label: 'PI3K抑制剂', category: '靶向治疗' },
  { key: 'MTOR', label: 'mTOR抑制剂', category: '靶向治疗' },
  { key: 'VEGF', label: '抗VEGF', category: '靶向治疗' },
  { key: 'HDAC', label: 'HDAC抑制剂', category: '表观遗传' },
  { key: 'PROTEASOME', label: '蛋白酶体抑制剂', category: '靶向治疗' },
  { key: 'CAR_T', label: 'CAR-T细胞疗法', category: '细胞治疗' },
]

export interface MOAResult {
  moaClass: MOAClass
  cancerType: CancerType
  totalPatients: number
  responders: number
  nonResponders: number
  responseRate: number
  biomarkerEnrichment: Record<string, number>  // biomarker -> fold enrichment
  subTypeBreakdown: Record<string, { total: number; responders: number }>
}

// Dashboard summary
export interface DashboardSummary {
  totalPatients: number
  cancerTypes: number
  pathways: number
  cellFunctions: number
  totalMutations: number
  avgPathwayCoverage: number
  computedAt: string
}

// WebSocket message types
export interface WSMessage {
  type: 'task_update' | 'task_complete' | 'task_error' | 'computation_progress'
  taskId: string
  payload: unknown
  timestamp: string
}

export interface ComputationTask {
  taskId: string
  type: 'batch_apsp' | 'moa_simulation' | 'pathway_analysis'
  status: 'queued' | 'running' | 'completed' | 'failed'
  progress: number       // 0-100
  message: string
  startedAt?: string
  completedAt?: string
  result?: unknown
}

// AI Chat
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  metadata?: {
    chartSuggestion?: {
      type: string
      params: Record<string, unknown>
    }
  }
}

// Filter state
export interface FilterState {
  selectedCancers: CancerType[]
  selectedPathways: string[]
  selectedGenes: string[]
  selectedMOAClasses: MOAClass[]
  pathwayCategoryFilter: PathwayCategory | null
  activityRange: [number, number]     // [-1, 1]
  mutationImpactFilter: ('HIGH' | 'MODERATE' | 'LOW')[]
  searchQuery: string
}
