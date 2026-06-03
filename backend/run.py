#!/usr/bin/env python3
"""
DPverse Backend Entry Point

Usage:
    python run.py
    python run.py --port 8000 --host 0.0.0.0
"""

import argparse
import uvicorn


def main():
    parser = argparse.ArgumentParser(description='DPverse Backend Server')
    parser.add_argument('--host', default='0.0.0.0', help='Host to bind')
    parser.add_argument('--port', type=int, default=8000, help='Port to bind')
    parser.add_argument('--reload', action='store_true', help='Enable auto-reload')

    args = parser.parse_args()

    print(f"""
    ╔══════════════════════════════════════════╗
    ║          DPverse Backend Server          ║
    ║  泛癌种功能数字化病人库                  ║
    ║  Pan-cancer Digital Patient Library      ║
    ║  DAGG Engine v2.4.1                      ║
    ╚══════════════════════════════════════════╝
    """)
    print(f"  Server: http://{args.host}:{args.port}")
    print(f"  API Docs: http://{args.host}:{args.port}/docs")
    print(f"  WebSocket: ws://{args.host}:{args.port}/ws")
    print()

    uvicorn.run(
        "app.main:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
        log_level="info",
    )


if __name__ == '__main__':
    main()
