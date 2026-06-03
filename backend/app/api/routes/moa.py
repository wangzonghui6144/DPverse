"""MOA Virtual Trial API routes"""

from fastapi import APIRouter, Query
from typing import Optional
from app.data.generator import generator

router = APIRouter(prefix="/api", tags=["moa"])


@router.get("/moa")
async def get_moa_results(
    moa_class: Optional[str] = Query(None, alias="moa_class"),
    cancer_type: Optional[str] = Query(None, alias="cancer_type"),
):
    """Get MOA virtual trial results with optional filters"""
    results = generator.moa_results

    if moa_class:
        results = [r for r in results if r['moa_class'] == moa_class]

    if cancer_type:
        results = [r for r in results if r['cancer_type'] == cancer_type]

    # Convert to camelCase
    return [{
        'moaClass': r['moa_class'],
        'cancerType': r['cancer_type'],
        'totalPatients': r['total_patients'],
        'responders': r['responders'],
        'nonResponders': r['non_responders'],
        'responseRate': r['response_rate'],
        'biomarkerEnrichment': r['biomarker_enrichment'],
        'subTypeBreakdown': r['sub_type_breakdown'],
    } for r in results]
