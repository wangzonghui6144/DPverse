"""DPverse Backend Configuration"""

import os

# Cancer types
CANCER_TYPES = [
    'LUAD', 'LUSC', 'SCLC', 'BRCA', 'TNBC', 'COAD', 'READ',
    'STAD', 'ESCA', 'LIHC', 'CHOL', 'PAAD', 'KIRC', 'KIRP',
    'BLCA', 'PRAD', 'OV', 'UCEC', 'CESC', 'HNSC', 'THCA',
    'SKCM', 'GBM', 'LGG', 'AML',
]

CANCER_LABELS = {
    'LUAD': '肺腺癌', 'LUSC': '肺鳞癌', 'SCLC': '小细胞肺癌',
    'BRCA': '乳腺癌', 'TNBC': '三阴性乳腺癌',
    'COAD': '结肠腺癌', 'READ': '直肠腺癌',
    'STAD': '胃腺癌', 'ESCA': '食管癌',
    'LIHC': '肝细胞癌', 'CHOL': '胆管癌',
    'PAAD': '胰腺癌',
    'KIRC': '肾透明细胞癌', 'KIRP': '肾乳头状细胞癌', 'BLCA': '膀胱癌',
    'PRAD': '前列腺癌',
    'OV': '卵巢癌', 'UCEC': '子宫内膜癌', 'CESC': '宫颈癌',
    'HNSC': '头颈鳞癌', 'THCA': '甲状腺癌',
    'SKCM': '皮肤黑色素瘤',
    'GBM': '胶质母细胞瘤', 'LGG': '低级别胶质瘤',
    'AML': '急性髓系白血病',
}

PATHWAY_CATEGORIES = [
    'RTK', 'RAS', 'PI3K', 'MAPK', 'JAK_STAT',
    'WNT', 'NOTCH', 'HEDGEHOG', 'TGFB',
    'CELL_CYCLE', 'APOPTOSIS', 'DNA_REPAIR',
    'ANGIOGENESIS', 'EMT', 'METABOLISM',
    'IMMUNE', 'EPIGENETIC', 'STRESS',
]

MOA_CLASSES = [
    'TKI', 'ICI', 'CHEMO', 'PARP', 'CDK46', 'AR', 'ER',
    'HER2', 'EGFR', 'ALK', 'BRAF', 'MEK', 'PI3K', 'MTOR',
    'VEGF', 'HDAC', 'PROTEASOME', 'CAR_T',
]

# Data generation
TOTAL_PATIENTS = 2000
TOTAL_PATHWAYS = 500
TOTAL_CELL_FUNCTIONS = 500
MIN_MUTATIONS = 5
MAX_MUTATIONS = 50

# Server
HOST = os.environ.get('HOST', '0.0.0.0')
PORT = int(os.environ.get('PORT', '8000'))
