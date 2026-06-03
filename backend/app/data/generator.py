"""
Synthetic data generator for DPverse.
Generates realistic pan-cancer patient data with genomic mutations,
pathway activities, and cell function profiles.
"""

import random
import numpy as np
from typing import Dict, List, Optional
from app.core.config import (
    CANCER_TYPES, PATHWAY_CATEGORIES, MOA_CLASSES,
    TOTAL_PATIENTS, TOTAL_PATHWAYS, TOTAL_CELL_FUNCTIONS,
    MIN_MUTATIONS, MAX_MUTATIONS,
)

# Seed for reproducibility
random.seed(42)
np.random.seed(42)


class DataGenerator:
    """Generate synthetic DPverse data"""

    def __init__(self):
        self.pathways: List[Dict] = []
        self.genes: List[Dict] = []
        self.patients: List[Dict] = []
        self.moa_results: List[Dict] = []
        self._generated = False

    def generate_all(self):
        if self._generated:
            return
        self.pathways = self._generate_pathways()
        self.genes = self._generate_genes()
        self.patients = self._generate_patients()
        self.moa_results = self._generate_moa_results()
        self._generated = True

    def _generate_pathways(self) -> List[Dict]:
        """Generate ~500 signaling pathways"""
        pathways = []
        pw_id = 0

        pathway_prefixes = {
            'RTK': ['EGFR', 'FGFR', 'PDGFR', 'VEGFR', 'IGF1R', 'MET', 'KIT', 'RET', 'ERBB', 'FLT'],
            'RAS': ['KRAS', 'NRAS', 'HRAS', 'RAS-GEF', 'RAS-GAP', 'RAS-RGL', 'RAL'],
            'PI3K': ['PIK3CA', 'AKT', 'PTEN', 'PDK1', 'TSC', 'RICTOR', 'RAPTOR'],
            'MAPK': ['BRAF', 'MEK', 'ERK', 'MAP3K', 'MAP2K', 'JNK', 'p38'],
            'JAK_STAT': ['JAK', 'STAT', 'SOCS', 'PIAS', 'PTP', 'IL6R'],
            'WNT': ['WNT', 'Frizzled', 'DVL', 'GSK3B', 'APC', 'AXIN', 'TCF'],
            'NOTCH': ['NOTCH', 'DLL', 'JAG', 'RBPJ', 'MAML', 'HES', 'HEY'],
            'HEDGEHOG': ['SHH', 'PTCH', 'SMO', 'GLI', 'SUFU', 'DHH', 'IHH'],
            'TGFB': ['TGFB', 'TGFBR', 'SMAD', 'BMP', 'ACVR', 'TGIF'],
            'CELL_CYCLE': ['CDK', 'Cyclin', 'RB', 'E2F', 'p21', 'p16', 'p27'],
            'APOPTOSIS': ['BCL2', 'BAX', 'Caspase', 'CYCS', 'APAF1', 'BID', 'BAD'],
            'DNA_REPAIR': ['BRCA1', 'BRCA2', 'ATM', 'ATR', 'RAD51', 'CHEK', 'FANC'],
            'ANGIOGENESIS': ['VEGF', 'HIF1A', 'ANGPT', 'TIE', 'PDGF', 'FGF', 'EPH'],
            'EMT': ['SNAI1', 'TWIST', 'ZEB', 'CDH1', 'VIM', 'FN1', 'MMP'],
            'METABOLISM': ['GLUT', 'HK2', 'LDHA', 'PKM', 'GLS', 'IDH', 'SDH'],
            'IMMUNE': ['PD-L1', 'CTLA4', 'TCR', 'MHC', 'CD28', 'LAG3', 'TIM3'],
            'EPIGENETIC': ['DNMT', 'HDAC', 'EZH2', 'KDM', 'SETD2', 'SWI/SNF'],
            'STRESS': ['HSP90', 'HIF', 'NRF2', 'ATF4', 'XBP1', 'CHOP'],
        }

        for cat in PATHWAY_CATEGORIES:
            prefixes = pathway_prefixes.get(cat, ['GENE'])
            count = 25 + random.randint(0, 14)  # 25-39 per category
            for i in range(count):
                pw_id += 1
                name_prefix = prefixes[i % len(prefixes)]
                pathways.append({
                    'id': f'PW_{pw_id:04d}',
                    'name': f'{name_prefix}信号轴_{i+1}',
                    'category': cat,
                    'description': f'{cat}相关信号通路，调控细胞增殖、分化和存活',
                    'genes': [f'{name_prefix}_{j}' for j in range(3 + random.randint(0, 7))],
                    'downstream_effects': random.sample(
                        ['细胞增殖', '凋亡', '迁移', '代谢重编程', '免疫逃逸', '血管生成'],
                        k=2 + random.randint(0, 3)
                    ),
                })

        return pathways

    def _generate_genes(self) -> List[Dict]:
        """Generate gene catalog"""
        known_genes = [
            'TP53', 'KRAS', 'EGFR', 'PIK3CA', 'BRAF', 'PTEN', 'APC', 'RB1',
            'NF1', 'ATM', 'BRCA1', 'BRCA2', 'ALK', 'ROS1', 'MET', 'RET',
            'ERBB2', 'MYC', 'AKT1', 'MTOR', 'CTNNB1', 'NOTCH1', 'SMAD4',
            'CDKN2A', 'ARID1A', 'KMT2D', 'KMT2C', 'FAT1', 'KEAP1',
            'STK11', 'NFE2L2', 'TERT', 'IDH1', 'IDH2', 'FGFR1',
            'FGFR2', 'FGFR3', 'PDGFRA', 'KIT', 'FLT3', 'JAK2', 'STAT3',
            'CDH1', 'VHL', 'TSC1', 'TSC2', 'MSH2', 'MSH6', 'MLH1', 'PMS2',
            'POLE', 'POLD1', 'ESR1', 'AR', 'BCL2', 'MCL1',
            'CCND1', 'CCNE1', 'CDK4', 'CDK6', 'EZH2', 'DNMT3A', 'TET2',
            'ASXL1', 'RUNX1', 'SF3B1', 'SRSF2', 'U2AF1',
        ]

        genes = []
        for sym in known_genes:
            genes.append({
                'symbol': sym,
                'name': f'{sym} gene',
                'chromosome': str(1 + random.randint(0, 21)),
                'mutation_frequency': random.random() * 0.5,
                'is_oncogene': random.random() > 0.5,
                'is_tsg': random.random() > 0.6,
                'pathway_ids': random.sample(
                    [p['id'] for p in self.pathways],
                    k=1 + random.randint(0, 4)
                ),
                'drugs': [f'{sym}-Inhibitor'] if random.random() > 0.5 else [],
            })

        # Additional novel genes
        for i in range(500):
            sym = f'GENE_{i:03d}'
            genes.append({
                'symbol': sym,
                'name': f'Novel Gene {i}',
                'chromosome': str(1 + random.randint(0, 21)),
                'mutation_frequency': random.random() * 0.3,
                'is_oncogene': random.random() > 0.5,
                'is_tsg': random.random() > 0.7,
                'pathway_ids': random.sample(
                    [p['id'] for p in self.pathways],
                    k=1 + random.randint(0, 3)
                ),
                'drugs': [],
            })

        return genes

    def _generate_patients(self) -> List[Dict]:
        """Generate ~2000 digital twin patients"""
        patients = []
        mutation_types = ['missense', 'nonsense', 'frameshift', 'inframe', 'splice', 'amp', 'del']
        impacts = ['HIGH', 'MODERATE', 'LOW']
        stages = ['I', 'II', 'III', 'IV']
        stage_weights = [0.15, 0.25, 0.3, 0.3]

        known_pool = ['TP53', 'KRAS', 'EGFR', 'PIK3CA', 'BRAF', 'PTEN', 'APC', 'RB1']
        pathway_ids = [p['id'] for p in self.pathways]

        for i in range(TOTAL_PATIENTS):
            cancer_type = random.choice(CANCER_TYPES)
            num_mutations = random.randint(MIN_MUTATIONS, MAX_MUTATIONS)

            mutations = []
            for _ in range(num_mutations):
                mutations.append({
                    'gene': f'GENE_{random.randint(0, 499):03d}',
                    'type': random.choice(mutation_types),
                    'impact': random.choices(impacts, weights=[0.3, 0.5, 0.2])[0],
                    'vaf': round(random.random() * 0.8 + 0.1, 3),
                })

            # Add known gene mutations
            for gene in known_pool:
                if random.random() > 0.7:
                    mutations.append({
                        'gene': gene,
                        'type': random.choice(mutation_types),
                        'impact': 'HIGH',
                        'vaf': round(random.random() * 0.5 + 0.3, 3),
                    })

            # Generate APSP: pathway activity scores
            pathway_activities = {}
            for pw in self.pathways:
                core = np.sin(i * 0.1 + hash(pw['id']) * 0.01) * 0.5
                noise = np.random.normal(0, 0.3)
                pathway_activities[pw['id']] = round(float(np.clip(core + noise, -1, 1)), 4)

            # Generate cell function scores
            cell_functions = {}
            for cf in range(TOTAL_CELL_FUNCTIONS):
                cell_functions[f'CF_{cf+1:04d}'] = round(
                    float(np.random.normal(0, 0.5)),
                    4
                )

            patients.append({
                'id': f'PT_{i+1:05d}',
                'cancer_type': cancer_type,
                'sub_type': random.choice(['A', 'B', 'C', 'NOS']),
                'age': random.randint(30, 85),
                'gender': random.choice(['M', 'F']),
                'stage': random.choices(stages, weights=stage_weights)[0],
                'mutations': mutations,
                'apsp': {
                    'patient_id': f'PT_{i+1:05d}',
                    'pathway_activities': pathway_activities,
                    'cell_functions': cell_functions,
                    'signature': f'APSP_SIG_{i}',
                },
                'predicted_response': [],
            })

        return patients

    def _generate_moa_results(self) -> List[Dict]:
        """Generate MOA virtual trial results"""
        results = []

        for moa in MOA_CLASSES:
            for cancer in CANCER_TYPES:
                cancer_patients = [
                    p for p in self.patients
                    if p['cancer_type'] == cancer
                ]
                if not cancer_patients:
                    continue

                total = len(cancer_patients)
                response_rate = 0.1 + random.random() * 0.6
                responders = int(total * response_rate)

                # Subtype breakdown
                subtypes = {}
                for pt in cancer_patients:
                    st = pt['sub_type']
                    if st not in subtypes:
                        subtypes[st] = {'total': 0, 'responders': 0}
                    subtypes[st]['total'] += 1
                    if random.random() < response_rate:
                        subtypes[st]['responders'] += 1

                results.append({
                    'moa_class': moa,
                    'cancer_type': cancer,
                    'total_patients': total,
                    'responders': responders,
                    'non_responders': total - responders,
                    'response_rate': round(responders / total, 4),
                    'biomarker_enrichment': {
                        'TP53_mut': round(random.random() * 3, 2),
                        'KRAS_mut': round(random.random() * 2, 2),
                        'TMB_H': round(random.random() * 4, 2),
                        'PDL1_pos': round(random.random() * 2.5, 2),
                    },
                    'sub_type_breakdown': subtypes,
                })

        return results

    def get_summary(self) -> Dict:
        total_mutations = sum(len(p['mutations']) for p in self.patients)
        unique_cancers = len(set(p['cancer_type'] for p in self.patients))

        import datetime
        return {
            'totalPatients': len(self.patients),
            'cancerTypes': unique_cancers,
            'pathways': len(self.pathways),
            'cellFunctions': TOTAL_CELL_FUNCTIONS,
            'totalMutations': total_mutations,
            'avgPathwayCoverage': 0.85,
            'computedAt': datetime.datetime.now().isoformat(),
        }


# Singleton
generator = DataGenerator()
