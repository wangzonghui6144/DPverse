"""
DPverse Backend - FastAPI Application

泛癌种功能数字化病人库
Pan-cancer Functional Digital Patient Library
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.data.generator import generator
from app.core.dag_engine import dag_engine
from app.api.routes import patients, pathways, genes, moa
import json
import time
import asyncio

# Initialize FastAPI app
app = FastAPI(
    title="DPverse API",
    description="Pan-cancer Functional Digital Patient Library - DAGG Engine API",
    version="2.4.1",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(patients.router)
app.include_router(pathways.router)
app.include_router(genes.router)
app.include_router(moa.router)


@app.on_event("startup")
async def startup_event():
    """Initialize data and DAGG engine on startup"""
    print("[DPverse] Generating synthetic patient data...")
    generator.generate_all()

    print("[DPverse] Setting up DAGG causal network...")
    dag_engine.setup_causal_network(generator.pathways, generator.genes)

    summary = generator.get_summary()
    print(f"[DPverse] Ready! {summary['totalPatients']} patients, "
          f"{summary['pathways']} pathways, "
          f"{summary['cancerTypes']} cancer types")


@app.get("/api/summary")
async def get_summary():
    """Get dashboard summary statistics"""
    return generator.get_summary()


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "DPverse", "version": "2.4.1"}


from pydantic import BaseModel
from typing import List, Optional

class ComputeRequest(BaseModel):
    type: str = 'batch_apsp'
    cancerTypes: List[str] = []
    moaClasses: List[str] = []

@app.post("/api/compute")
async def submit_computation(request: ComputeRequest):
    """Submit a computation task (returns task_id for WebSocket tracking)"""
    task_id = f"task_{int(time.time())}_{hash(str(request)) % 10000:04d}"
    return {"taskId": task_id, "status": "queued"}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time computation updates"""
    await websocket.accept()
    print(f"[WS] Client connected")

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            if message.get('type') == 'ping':
                await websocket.send_json({'type': 'pong', 'timestamp': time.time()})
                continue

            if message.get('type') == 'compute_submit':
                task_id = message.get('taskId', f'task_{int(time.time())}')
                compute_type = message.get('computeType', 'batch_apsp')
                cancer_types = message.get('cancerTypes', [])

                patients = generator.patients
                if cancer_types:
                    patients = [p for p in patients if p['cancer_type'] in cancer_types]

                dag_engine.setup_causal_network(generator.pathways, generator.genes)

                await websocket.send_json({
                    'type': 'task_update',
                    'taskId': task_id,
                    'payload': {
                        'taskId': task_id, 'type': compute_type,
                        'status': 'running', 'progress': 0,
                        'message': f'Starting computation for {len(patients)} patients...',
                    },
                    'timestamp': time.strftime('%Y-%m-%dT%H:%M:%SZ'),
                })

                # Process with progress updates
                async def progress_callback(progress: int, msg: str):
                    try:
                        await websocket.send_json({
                            'type': 'task_update',
                            'taskId': task_id,
                            'payload': {
                                'taskId': task_id, 'type': compute_type,
                                'status': 'running', 'progress': progress,
                                'message': msg,
                            },
                            'timestamp': time.strftime('%Y-%m-%dT%H:%M:%SZ'),
                        })
                    except Exception:
                        pass

                batch = patients[:100]
                results = await dag_engine.compute_batch(
                    batch, generator.pathways, progress_callback=progress_callback)

                await websocket.send_json({
                    'type': 'task_complete',
                    'taskId': task_id,
                    'payload': {
                        'taskId': task_id, 'type': compute_type,
                        'status': 'completed', 'progress': 100,
                        'message': f'Completed! Processed {len(results)} patients.',
                        'result': {'totalProcessed': len(results)},
                    },
                    'timestamp': time.strftime('%Y-%m-%dT%H:%M:%SZ'),
                })

    except WebSocketDisconnect:
        print(f"[WS] Client disconnected")
    except Exception as e:
        print(f"[WS] Error: {e}")
        try:
            await websocket.close()
        except Exception:
            pass
