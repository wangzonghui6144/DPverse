"""WebSocket routes for real-time computation updates"""

import asyncio
import json
import time
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.data.generator import generator
from app.core.dag_engine import dag_engine

router = APIRouter()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print(f"[WS] Client connected")

    try:
        while True:
            # Wait for messages from client
            data = await websocket.receive_text()
            message = json.loads(data)

            if message.get('type') == 'ping':
                await websocket.send_json({'type': 'pong', 'timestamp': time.time()})
                continue

            if message.get('type') == 'compute_submit':
                task_id = message.get('taskId', f'task_{int(time.time())}')
                compute_type = message.get('computeType', 'batch_apsp')
                cancer_types = message.get('cancerTypes', [])

                # Filter patients
                patients = generator.patients
                if cancer_types:
                    patients = [p for p in patients if p['cancer_type'] in cancer_types]

                # Initialize DAGG engine
                dag_engine.setup_causal_network(generator.pathways, generator.genes)

                # Send task started
                await websocket.send_json({
                    'type': 'task_update',
                    'taskId': task_id,
                    'payload': {
                        'taskId': task_id,
                        'type': compute_type,
                        'status': 'running',
                        'progress': 0,
                        'message': f'Starting computation for {len(patients)} patients...',
                    },
                    'timestamp': time.strftime('%Y-%m-%dT%H:%M:%SZ'),
                })

                # Process with progress updates
                async def progress_callback(progress: int, msg: str):
                    await websocket.send_json({
                        'type': 'task_update',
                        'taskId': task_id,
                        'payload': {
                            'taskId': task_id,
                            'type': compute_type,
                            'status': 'running',
                            'progress': progress,
                            'message': msg,
                        },
                        'timestamp': time.strftime('%Y-%m-%dT%H:%M:%SZ'),
                    })

                # Only process a subset for speed
                batch = patients[:100]

                results = await dag_engine.compute_batch(
                    batch,
                    generator.pathways,
                    progress_callback=progress_callback,
                )

                # Send completion
                await websocket.send_json({
                    'type': 'task_complete',
                    'taskId': task_id,
                    'payload': {
                        'taskId': task_id,
                        'type': compute_type,
                        'status': 'completed',
                        'progress': 100,
                        'message': f'Completed! Processed {len(results)} patients.',
                        'result': {
                            'totalProcessed': len(results),
                            'sampleResult': results[0] if results else None,
                        },
                    },
                    'timestamp': time.strftime('%Y-%m-%dT%H:%M:%SZ'),
                })

    except WebSocketDisconnect:
        print(f"[WS] Client disconnected")
    except Exception as e:
        print(f"[WS] Error: {e}")
        try:
            await websocket.close()
        except:
            pass
