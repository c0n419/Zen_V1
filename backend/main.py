"""
ZEN v3.0 — FastAPI Bridge Server
Ollama (yerel LLM) + psutil sistem metrikleri → ZEN Dashboard API

Başlatmak için:
    cd backend
    .venv/bin/uvicorn main:app --reload --port 8000
"""

import os
import asyncio
import json
from contextlib import asynccontextmanager
from dotenv import load_dotenv

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from ollama_client import OllamaClient
from system_metrics import get_all_system_metrics

load_dotenv()

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "rnj-1:8b")
OLLAMA_API_KEY = os.getenv("OLLAMA_API_KEY", None)

ollama: OllamaClient = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global ollama
    ollama = OllamaClient(
        base_url=OLLAMA_BASE_URL,
        model=OLLAMA_MODEL,
        api_key=OLLAMA_API_KEY,
    )
    print(f"ZEN Bridge API başlatıldı — Ollama: {OLLAMA_BASE_URL} | Model: {OLLAMA_MODEL}")
    yield
    await ollama.close()


app = FastAPI(title="ZEN v3.0 Bridge API", version="3.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Health ──────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "ollama": OLLAMA_BASE_URL, "model": OLLAMA_MODEL}


# ─── Agents ──────────────────────────────────────────────────────────────────

@app.get("/api/agents/status")
async def get_agents_status():
    return await ollama.get_agents()


@app.patch("/api/agents/{agent_id}/status")
async def set_agent_status(agent_id: str, body: dict):
    """Agent durumunu değiştirir: {status: 'active'|'idle'|'processing'}"""
    status = body.get("status", "")
    if not status:
        raise HTTPException(status_code=400, detail="'status' alanı gerekli")
    try:
        return await ollama.set_agent_status(agent_id, status)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.post("/api/agents/{agent_id}/task")
async def send_task_to_agent(agent_id: str, body: dict):
    """Agenta mesaj gönderir, Ollama yanıtı döner."""
    message = body.get("message", "")
    if not message:
        raise HTTPException(status_code=400, detail="'message' alanı gerekli")
    max_tokens = body.get("max_tokens", 1024)
    try:
        return await ollama.send_message(agent_id, message, max_tokens=max_tokens)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


# ─── Chat geçmişi ─────────────────────────────────────────────────────────────

@app.get("/api/agents/{agent_id}/history")
async def get_chat_history(agent_id: str):
    """Agent'ın tüm chat geçmişini döner."""
    try:
        return await ollama.get_chat_history(agent_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.delete("/api/agents/{agent_id}/history")
async def clear_chat_history(agent_id: str):
    """Agent chat geçmişini temizler."""
    try:
        return await ollama.clear_chat_history(agent_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ─── Activities ──────────────────────────────────────────────────────────────

@app.get("/api/activities/recent")
async def get_recent_activities(limit: int = 50):
    return await ollama.get_recent_activities(limit=limit)


# ─── Metrics ─────────────────────────────────────────────────────────────────

@app.get("/api/metrics/dashboard")
async def get_dashboard_metrics():
    return await ollama.get_dashboard_metrics()


@app.get("/api/system/metrics")
async def get_system_metrics():
    try:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, get_all_system_metrics)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/performance/weekly")
async def get_weekly_performance():
    return await ollama.get_weekly_performance()


@app.get("/api/tasks/distribution")
async def get_task_distribution():
    return await ollama.get_task_distribution()


# ─── WebSocket ───────────────────────────────────────────────────────────────

@app.websocket("/ws/dashboard")
async def websocket_dashboard(websocket: WebSocket):
    """5 saniyede bir sistem + agent durumu push eder."""
    await websocket.accept()
    try:
        while True:
            loop = asyncio.get_event_loop()
            system = await loop.run_in_executor(None, get_all_system_metrics)
            agents = await ollama.get_agents()
            metrics = await ollama.get_dashboard_metrics()
            await websocket.send_text(json.dumps({
                "type": "dashboard_update",
                "system": system,
                "agents": agents,
                "metrics": metrics,
            }))
            await asyncio.sleep(5)
    except (WebSocketDisconnect, Exception):
        pass
