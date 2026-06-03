"""Pydantic models for DPverse API"""

from pydantic import BaseModel
from typing import List, Dict, Optional


class GeneMutation(BaseModel):
    gene: str
    type: str
    impact: str
    vaf: float


class APSPData(BaseModel):
    patient_id: str
    pathway_activities: Dict[str, float]
    cell_functions: Dict[str, float]
    signature: str


class PatientResponse(BaseModel):
    id: str
    cancer_type: str
    sub_type: str
    age: int
    gender: str
    stage: str
    mutations: List[GeneMutation]
    apsp: APSPData
    predicted_response: List[Dict] = []


class PatientListResponse(BaseModel):
    patients: List[PatientResponse]
    total: int
    page: int
    page_size: int


class PathwayResponse(BaseModel):
    id: str
    name: str
    category: str
    description: str
    genes: List[str]
    downstream_effects: List[str]


class GeneResponse(BaseModel):
    symbol: str
    name: str
    chromosome: str
    mutation_frequency: float
    is_oncogene: bool
    is_tsg: bool
    pathway_ids: List[str]
    drugs: List[str]


class MOAResultResponse(BaseModel):
    moa_class: str
    cancer_type: str
    total_patients: int
    responders: int
    non_responders: int
    response_rate: float
    biomarker_enrichment: Dict[str, float]
    sub_type_breakdown: Dict[str, Dict]


class SummaryResponse(BaseModel):
    totalPatients: int
    cancerTypes: int
    pathways: int
    cellFunctions: int
    totalMutations: int
    avgPathwayCoverage: float
    computedAt: str


class ComputeRequest(BaseModel):
    type: str  # 'batch_apsp', 'moa_simulation', 'pathway_analysis'
    cancer_types: List[str] = []
    moa_classes: List[str] = []


class ComputeResponse(BaseModel):
    task_id: str
    status: str = "queued"
