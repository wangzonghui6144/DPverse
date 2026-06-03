"""Pathway API routes"""

from fastapi import APIRouter, Query
from typing import Optional
from app.data.generator import generator
import numpy as np

router = APIRouter(prefix="/api", tags=["pathways"])


@router.get("/pathways")
async def get_pathways(
    cancer_type: Optional[str] = Query(None, alias="cancer_type"),
    category: Optional[str] = None,
):
    """Get all pathways with optional filters"""
    pathways = generator.pathways

    if category:
        pathways = [p for p in pathways if p['category'] == category]

    # Convert to camelCase
    return [{
        'id': p['id'],
        'name': p['name'],
        'category': p['category'],
        'description': p['description'],
        'genes': p['genes'],
        'downstreamEffects': p['downstream_effects'],
    } for p in pathways]


@router.get("/pathways/activity")
async def get_pathway_activity(
    cancer_type: str = Query(..., alias="cancer_type"),
):
    """Get pathway activity scores for a specific cancer type"""
    # Aggregate activity scores across all patients of this cancer type
    patients = [p for p in generator.patients if p['cancer_type'] == cancer_type]

    if not patients:
        return {}

    # Average pathway activities across the cohort
    avg_activities = {}
    for pathway in generator.pathways:
        pw_id = pathway['id']
        scores = [
            p['apsp']['pathway_activities'].get(pw_id, 0)
            for p in patients
        ]
        avg_activities[pw_id] = round(float(np.mean(scores)), 4) if scores else 0

    return avg_activities
