"""Patient API routes"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from app.data.generator import generator
from app.models.patient import PatientListResponse, APSPData

router = APIRouter(prefix="/api", tags=["patients"])


@router.get("/patients")
async def get_patients(
    cancer_type: Optional[str] = Query(None, alias="cancer_type"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    search: Optional[str] = None,
):
    """Get paginated patient list with optional filters"""
    patients = generator.patients

    if cancer_type:
        patients = [p for p in patients if p['cancer_type'] == cancer_type]

    if search:
        s = search.lower()
        patients = [
            p for p in patients
            if s in p['id'].lower() or
               any(s in m['gene'].lower() for m in p['mutations'])
        ]

    total = len(patients)
    start = (page - 1) * page_size
    end = start + page_size
    page_patients = patients[start:end]

    # Convert to camelCase for frontend
    result = []
    for p in page_patients:
        result.append({
            'id': p['id'],
            'cancerType': p['cancer_type'],
            'subType': p['sub_type'],
            'age': p['age'],
            'gender': p['gender'],
            'stage': p['stage'],
            'mutations': p['mutations'],
            'apsp': p['apsp'],
            'predictedResponse': p.get('predicted_response', []),
        })

    return {
        'patients': result,
        'total': total,
        'page': page,
        'pageSize': page_size,
    }


@router.get("/patients/{patient_id}")
async def get_patient_detail(patient_id: str):
    """Get single patient detail"""
    for p in generator.patients:
        if p['id'] == patient_id:
            return {
                'id': p['id'],
                'cancerType': p['cancer_type'],
                'subType': p['sub_type'],
                'age': p['age'],
                'gender': p['gender'],
                'stage': p['stage'],
                'mutations': p['mutations'],
                'apsp': p['apsp'],
                'predictedResponse': p.get('predicted_response', []),
            }
    raise HTTPException(status_code=404, detail="Patient not found")


@router.get("/patients/{patient_id}/apsp")
async def get_patient_apsp(patient_id: str):
    """Get patient APSP data"""
    for p in generator.patients:
        if p['id'] == patient_id:
            return p['apsp']
    raise HTTPException(status_code=404, detail="Patient not found")
