"""Gene API routes"""

from fastapi import APIRouter, Query
from typing import Optional
from app.data.generator import generator

router = APIRouter(prefix="/api", tags=["genes"])


@router.get("/genes")
async def get_genes(
    pathway_id: Optional[str] = Query(None, alias="pathway_id"),
    cancer_type: Optional[str] = Query(None, alias="cancer_type"),
):
    """Get genes with optional pathway/cancer filters"""
    genes = generator.genes

    if pathway_id:
        genes = [g for g in genes if pathway_id in g.get('pathway_ids', [])]

    # Convert to camelCase
    return [{
        'symbol': g['symbol'],
        'name': g['name'],
        'chromosome': g['chromosome'],
        'mutationFrequency': g['mutation_frequency'],
        'isOncogene': g['is_oncogene'],
        'isTSG': g['is_tsg'],
        'pathwayIds': g['pathway_ids'],
        'drugs': g['drugs'],
    } for g in genes]
