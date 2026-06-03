"""
DAGG (Data-driven Analysis of Genotype-to-phenotype Graphs) Engine

Simulates the core AI algorithm that converts genomic mutation data
into pathway activity profiles (APSPs).

In a production system, this would use:
- Causal Bayesian networks
- Graph neural networks
- Multi-omics integration
- Real TCGA/ICGC genomic datasets

This implementation provides a statistically-principled simulation
that mirrors the behavior of the real DAGG algorithm.
"""

import numpy as np
import time
import asyncio
from typing import Dict, List, Callable, Optional
from app.core.config import TOTAL_PATHWAYS, TOTAL_CELL_FUNCTIONS


class DAGGEngine:
    """
    DAGG Algorithm Engine

    The DAGG algorithm works in three stages:
    1. Genotype Layer: Map mutations to gene-level effects
    2. Pathway Layer: Propagate gene effects through signaling networks
    3. Phenotype Layer: Aggregate pathway activities into cell function profiles
    """

    def __init__(self):
        # Gene -> Pathway adjacency matrix (which genes affect which pathways)
        self.gene_pathway_matrix: Dict[str, List[str]] = {}
        # Pathway -> Cell Function mapping
        self.pathway_function_matrix: Dict[str, List[str]] = {}
        # Causal effect strengths
        self.effect_strengths: Dict[str, float] = {}

    def setup_causal_network(self, pathways: List[Dict], genes: List[Dict]):
        """Initialize the causal network structure"""
        pathway_ids = [p['id'] for p in pathways]
        cell_func_ids = [f'CF_{i+1:04d}' for i in range(TOTAL_CELL_FUNCTIONS)]

        # Build gene -> pathway mapping
        for gene in genes:
            self.gene_pathway_matrix[gene['symbol']] = gene.get('pathway_ids', [])

        # Build pathway -> cell function mapping
        for pw_id in pathway_ids:
            n_funcs = np.random.randint(5, 20)
            affected = list(np.random.choice(cell_func_ids, size=n_funcs, replace=False))
            self.pathway_function_matrix[pw_id] = affected

    def compute_mutation_impact(self, mutations: List[Dict]) -> Dict[str, float]:
        """
        Stage 1: Compute gene-level impact from mutations.

        Maps each mutation to a quantitative impact score based on:
        - Mutation type (nonsense > frameshift > missense > silent)
        - Variant allele frequency (VAF)
        - Gene type (oncogene vs TSG)
        """
        gene_impacts: Dict[str, float] = {}

        type_weights = {
            'nonsense': 0.9, 'frameshift': 0.85, 'splice': 0.7,
            'missense': 0.5, 'inframe': 0.4, 'amp': 0.8, 'del': -0.8,
        }

        for mut in mutations:
            gene = mut['gene']
            base_impact = type_weights.get(mut['type'], 0.3)
            vaf_factor = mut.get('vaf', 0.3)
            impact = base_impact * vaf_factor

            if gene in gene_impacts:
                gene_impacts[gene] = max(gene_impacts[gene], impact,
                                         key=abs) if abs(impact) > abs(gene_impacts[gene]) else gene_impacts[gene]
            else:
                gene_impacts[gene] = impact

        return gene_impacts

    def propagate_to_pathways(self, gene_impacts: Dict[str, float]) -> Dict[str, float]:
        """
        Stage 2: Propagate gene impacts to pathway activities.

        Uses the gene-pathway adjacency matrix with dampened
        propagation to simulate network effects.
        """
        pathway_activities: Dict[str, float] = {}

        for gene, impact in gene_impacts.items():
            if gene not in self.gene_pathway_matrix:
                continue
            pathways = self.gene_pathway_matrix[gene]
            for pw_id in pathways:
                # Dampening factor: impact spreads across pathways
                dampened = impact / (len(pathways) ** 0.5 + 1)
                pathway_activities[pw_id] = pathway_activities.get(pw_id, 0) + dampened

        # Normalize to [-1, 1] using tanh
        for pw_id in pathway_activities:
            pathway_activities[pw_id] = float(np.tanh(pathway_activities[pw_id] * 1.5))

        return pathway_activities

    def aggregate_cell_functions(self, pathway_activities: Dict[str, float]) -> Dict[str, float]:
        """
        Stage 3: Aggregate pathway activities into cell function profiles.

        Each pathway contributes to multiple cell functions with
        varying weights, creating the full 500-dim APSP.
        """
        cell_functions: Dict[str, float] = {}

        for pw_id, activity in pathway_activities.items():
            if pw_id not in self.pathway_function_matrix:
                continue
            affected_functions = self.pathway_function_matrix[pw_id]
            for cf_id in affected_functions:
                weight = 1.0 / len(affected_functions)
                cell_functions[cf_id] = cell_functions.get(cf_id, 0) + activity * weight

        # Add controlled noise
        for cf_id in cell_functions:
            noise = np.random.normal(0, 0.05)
            cell_functions[cf_id] = float(np.clip(cell_functions[cf_id] + noise, -1, 1))

        return cell_functions

    def compute_apsp(self, patient: Dict, pathways: List[Dict]) -> Dict:
        """
        Full DAGG pipeline: mutations -> APSP
        """
        # Reset random for this computation
        np.random.seed(hash(patient['id']) % (2**31))

        # Stage 1
        gene_impacts = self.compute_mutation_impact(patient.get('mutations', []))

        # Stage 2
        pathway_activities = self.propagate_to_pathways(gene_impacts)

        # Fill missing pathways with near-zero values
        for pw in pathways:
            if pw['id'] not in pathway_activities:
                pathway_activities[pw['id']] = float(np.random.normal(0, 0.1))

        # Stage 3
        cell_functions = self.aggregate_cell_functions(pathway_activities)

        # Fill missing cell functions
        for i in range(TOTAL_CELL_FUNCTIONS):
            cf_id = f'CF_{i+1:04d}'
            if cf_id not in cell_functions:
                cell_functions[cf_id] = float(np.random.normal(0, 0.15))

        return {
            'patient_id': patient['id'],
            'pathway_activities': pathway_activities,
            'cell_functions': cell_functions,
            'signature': f"APSP_{patient['id']}",
        }

    async def compute_batch(
        self,
        patients: List[Dict],
        pathways: List[Dict],
        progress_callback: Optional[Callable[[int, str], None]] = None,
    ) -> List[Dict]:
        """
        Batch compute APSPs for multiple patients.
        Supports async progress reporting via callback.
        """
        results = []
        total = len(patients)

        for i, patient in enumerate(patients):
            # Simulate computation time (real DAGG would be heavier)
            await asyncio.sleep(0.01)

            apsp = self.compute_apsp(patient, pathways)
            results.append(apsp)

            if progress_callback:
                progress = int((i + 1) / total * 100)
                if asyncio.iscoroutinefunction(progress_callback):
                    await progress_callback(progress, f'Processing patient {patient["id"]} ({i+1}/{total})')
                else:
                    progress_callback(progress, f'Processing patient {patient["id"]} ({i+1}/{total})')

        return results

    def simulate_moa_trial(
        self,
        patients: List[Dict],
        moa_class: str,
        cancer_type: str,
    ) -> Dict:
        """
        Simulate a virtual MOA clinical trial.

        Uses pathway activity patterns to predict drug response
        based on mechanism of action.
        """
        # Filter patients
        cohort = [
            p for p in patients
            if p['cancer_type'] == cancer_type
        ]

        responders = 0
        for patient in cohort:
            # Response prediction based on pathway activities
            activities = patient['apsp']['pathway_activities']
            pw_values = list(activities.values())

            if not pw_values:
                continue

            # Simplified response model:
            # - High pathway variance indicates targetable dependencies
            # - Some MOAs work better in specific pathway contexts
            variance = np.var(pw_values)
            mean_activity = np.mean(pw_values)

            # Different MOAs have different response criteria
            response_prob = 0.3 + variance * 0.4

            if moa_class in ('ICI', 'CAR_T'):
                response_prob += max(0, mean_activity) * 0.2
            elif moa_class in ('TKI', 'EGFR', 'ALK', 'BRAF'):
                response_prob += variance * 0.3
            elif moa_class == 'PARP':
                response_prob += 0.1  # HRD-dependent

            response_prob = np.clip(response_prob, 0.1, 0.8)

            if np.random.random() < response_prob:
                responders += 1

        total = len(cohort) if cohort else 1
        response_rate = responders / total

        return {
            'moa_class': moa_class,
            'cancer_type': cancer_type,
            'total_patients': total,
            'responders': responders,
            'non_responders': total - responders,
            'response_rate': round(response_rate, 4),
        }


# Singleton
dag_engine = DAGGEngine()
