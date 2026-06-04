# DPverse Data Models

## 核心数据实体

### Patient（患者）

```
Patient
├── id: string                      # PT_00001
├── cancerType: CancerType          # LUAD, BRCA, ...
├── subType: string                 # A, B, C, NOS
├── age: number                     # 30-85
├── gender: 'M' | 'F'
├── stage: 'I' | 'II' | 'III' | 'IV'
├── mutations: GeneMutation[]       # 5-50 个
├── apsp: APSPData                  # 数字孪生核心
└── predictedResponse: PredictedResponse[]
```

### GeneMutation（基因突变）

```
GeneMutation
├── gene: string                    # TP53, KRAS, GENE_003
├── type: MutationType              # missense | nonsense | frameshift | ...
├── impact: 'HIGH' | 'MODERATE' | 'LOW'
└── vaf: number                     # 0.1-0.9 (变异等位基因频率)
```

### APSPData（通路活性图谱）

```
APSPData
├── patientId: string
├── pathwayActivities: Record<string, number>    # 500 条通路活性 [-1, 1]
├── cellFunctions: Record<string, number>         # 500 个细胞功能指标 [-1, 1]
└── signature: string                             # APSP_SIG_{i}
```

### Pathway（信号通路）

```
Pathway
├── id: string                      # PW_0001
├── name: string                    # EGFR信号轴_1
├── category: PathwayCategory       # RTK, RAS, PI3K, ...
├── description: string
├── genes: string[]                 # 关联基因列表
└── downstreamEffects: string[]     # 下游效应
```

### Gene（基因）

```
Gene
├── symbol: string                  # TP53
├── name: string
├── chromosome: string
├── mutationFrequency: number       # 突变频率 [0-0.5]
├── isOncogene: boolean            # 癌基因
├── isTSG: boolean                 # 抑癌基因
├── pathwayIds: string[]           # 关联通路
└── drugs: string[]                # 靶向药物
```

### MOAResult（MOA虚拟试验结果）

```
MOAResult
├── moaClass: MOAClass             # TKI, ICI, CHEMO, ...
├── cancerType: CancerType
├── totalPatients: number
├── responders: number
├── nonResponders: number
├── responseRate: number           # 响应率 [0-1]
├── biomarkerEnrichment: Record<string, number>  # 生物标志物富集倍数
└── subTypeBreakdown: Record<string, {total, responders}>
```

## 枚举类型

### CancerType（25 种癌种）
```
LUAD  肺腺癌        LUSC  肺鳞癌        SCLC  小细胞肺癌
BRCA  乳腺癌        TNBC  三阴性乳腺癌
COAD  结肠腺癌      READ  直肠腺癌
STAD  胃腺癌        ESCA  食管癌
LIHC  肝细胞癌      CHOL  胆管癌
PAAD  胰腺癌
KIRC  肾透明细胞癌  KIRP  肾乳头状细胞癌  BLCA  膀胱癌
PRAD  前列腺癌
OV    卵巢癌        UCEC  子宫内膜癌    CESC  宫颈癌
HNSC  头颈鳞癌      THCA  甲状腺癌
SKCM  皮肤黑色素瘤
GBM   胶质母细胞瘤  LGG   低级别胶质瘤
AML   急性髓系白血病
```

### PathwayCategory（18 类通路）
```
RTK         受体酪氨酸激酶      RAS         RAS信号
PI3K        PI3K/AKT通路        MAPK        MAPK通路
JAK_STAT    JAK/STAT信号        WNT         WNT通路
NOTCH       NOTCH信号           HEDGEHOG    Hedgehog信号
TGFB        TGF-β信号           CELL_CYCLE  细胞周期
APOPTOSIS   凋亡通路            DNA_REPAIR  DNA修复
ANGIOGENESIS 血管生成           EMT         EMT/MET
METABOLISM  代谢重编程          IMMUNE      免疫调控
EPIGENETIC  表观遗传            STRESS      应激反应
```

### MOAClass（18 种药物机制）
```
靶向治疗: TKI, PARP, CDK46, HER2, EGFR, ALK, BRAF, MEK, PI3K, MTOR, VEGF, PROTEASOME
免疫治疗: ICI
化疗:     CHEMO
内分泌:   AR, ER
表观遗传: HDAC
细胞治疗: CAR_T
```

## 数据规模

| 实体 | 数量 | 说明 |
|------|------|------|
| Patients | 2,000 | 数字孪生患者 |
| Pathways | ~500 | 18 类别 × ~28 通路 |
| Genes | ~564 | 64 已知 + 500 新基因 |
| Cell Functions | 500 | CF_0001 ~ CF_0500 |
| MOA Results | 450 | 18 MOA × 25 癌种 |
| Mutations/Patient | 5-50 | 平均值 ~25 |

## 数据关系

```
CancerType ──1:N──> Patient ──1:N──> GeneMutation
    │                   │
    │                   └──1:1──> APSPData
    │                               ├──1:N──> PathwayActivities
    │                               └──1:N──> CellFunctions
    │
    └──1:N──> MOAResult
                 └──1:1──> MOAClass

PathwayCategory ──1:N──> Pathway ──M:N──> Gene
```

## 前端 TypeScript 类型 vs 后端 Python 模型

前端和后端使用**相同的数据结构**，仅在命名风格上有差异：

| 前端 (TypeScript) | 后端 (Python) |
|-------------------|---------------|
| `camelCase` | `snake_case` |
| 类型定义在 `types/index.ts` | 模型定义在 `models/patient.py` + routes 中的内联转换 |

后端 API 返回时通过手动字段映射转换为 camelCase，前端 API 服务期望 camelCase。
