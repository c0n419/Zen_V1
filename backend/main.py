"""
ZEN v3.0 — FastAPI Bridge Server
Ollama (yerel LLM) + psutil sistem metrikleri → ZEN Dashboard API

Başlatmak için:
    cd backend
    .venv/bin/uvicorn main:app --reload --port 8000
"""

import asyncio
import json
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from starlette.responses import JSONResponse

from ollama_client import OllamaClient
from system_metrics import get_all_system_metrics

load_dotenv = None
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "rnj-1:8b")
OLLAMA_API_KEY = os.getenv("OLLAMA_API_KEY", None)


# ─── Pydantic Models ──────────────────────────────────────────────────────────

class SetModelRequest(BaseModel):
    model: str

class SendMessageRequest(BaseModel):
    message: str

class SetAgentStatusRequest(BaseModel):
    status: str

class UpdateDashboardMetricsRequest(BaseModel):
    metrics: dict

class SetWeeklyPerformanceRequest(BaseModel):
    performance: dict


# ─── Lifespan & App ───────────────────────────────────────────────────────────

class AppState:
    ollama: OllamaClient = None


app_state = AppState()


@asynccontextmanager
async def lifespan(app: FastAPI):
    app_state.ollama = OllamaClient(
        base_url=OLLAMA_BASE_URL,
        model=OLLAMA_MODEL,
        api_key=OLLAMA_API_KEY,
    )
    print(f"ZEN Bridge API başlatıldı — Ollama: {OLLAMA_BASE_URL} | Model: {OLLAMA_MODEL}")
    yield
    await app_state.ollama.close()


app = FastAPI(title="ZEN v3.0 Bridge API", version="3.0.0", lifespan=lifespan)


def get_ollama() -> OllamaClient:
    if app_state.ollama is None:
        raise RuntimeError("Ollama client başlatılmadı")
    return app_state.ollama


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
    return {
        "status": "ok",
        "ollama": OLLAMA_BASE_URL,
        "model": get_ollama().get_current_model() if app_state.ollama else "uninitialized"
    }


# ─── Model Yönetimi ───────────────────────────────────────────────────────────

@app.get("/api/models")
async def list_models():
    """Ollama'daki mevcut modelleri listeler."""
    return await get_ollama().list_models()


@app.get("/api/config")
async def get_config():
    """Mevcut konfigürasyonu döner."""
    ollama_client = get_ollama()
    return {"model": ollama_client.get_current_model(), "ollama": OLLAMA_BASE_URL}


@app.patch("/api/config/model")
async def set_model(body: SetModelRequest):
    """Aktif modeli değiştirir: {model: 'model_adı'}"""
    model = body.model.strip()
    if not model:
        raise HTTPException(status_code=400, detail="'model' alanı gerekli")
    get_ollama().set_model(model)
    return {"model": model, "status": "ok"}


# ─── Agents ──────────────────────────────────────────────────────────────────

@app.get("/api/agents/status")
async def get_agents_status():
    return await get_ollama().get_agents()


@app.patch("/api/agents/{agent_id}/status")
async def set_agent_status(agent_id: str, body: SetAgentStatusRequest):
    """Agent durumunu değiştirir: {status: 'active'|'idle'|'processing'}"""
    status = body.status
    if not status:
        raise HTTPException(status_code=400, detail="'status' alanı gerekli")
    try:
        return await get_ollama().set_agent_status(agent_id, status)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.post("/api/agents/{agent_id}/stream")
async def stream_task_to_agent(agent_id: str, body: SendMessageRequest):
    """SSE stream: her tool_start/tool_done/reply/done olayını anlık gönderir."""
    message = body.message
    if not message:
        raise HTTPException(status_code=400, detail="'message' alanı gerekli")
    ollama_client = get_ollama()

    async def event_gen():
        try:
            async for chunk in ollama_client.stream_message(agent_id, message):
                yield chunk
        except Exception as e:
            import json as _json
            yield f"data: {_json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_gen(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.post("/api/agents/{agent_id}/task")
async def send_task_to_agent(agent_id: str, body: SendMessageRequest):
    """Agenta mesaj gönderir, Ollama yanıtı döner."""
    message = body.message
    if not message:
        raise HTTPException(status_code=400, detail="'message' alanı gerekli")
    try:
        return await get_ollama().send_message(agent_id, message)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


# ─── Chat geçmişi ─────────────────────────────────────────────────────────────

@app.get("/api/agents/{agent_id}/history")
async def get_chat_history(agent_id: str):
    """Agent'ın tüm chat geçmişini döner."""
    try:
        return await get_ollama().get_chat_history(agent_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.delete("/api/agents/{agent_id}/history")
async def clear_chat_history(agent_id: str):
    """Agent chat geçmişini temizler."""
    try:
        return await get_ollama().clear_chat_history(agent_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ─── Activities ──────────────────────────────────────────────────────────────

@app.get("/api/activities/recent")
async def get_recent_activities(limit: int = 50):
    return await get_ollama().get_recent_activities(limit=limit)


# ─── Metrics ─────────────────────────────────────────────────────────────────

@app.get("/api/metrics/dashboard")
async def get_dashboard_metrics():
    return await get_ollama().get_dashboard_metrics()


@app.get("/api/system/metrics")
async def get_system_metrics():
    try:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, get_all_system_metrics)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/performance/weekly")
async def get_weekly_performance():
    return await get_ollama().get_weekly_performance()


@app.get("/api/tasks/distribution")
async def get_task_distribution():
    return await get_ollama().get_task_distribution()


# ─── WebSocket ───────────────────────────────────────────────────────────────

@app.websocket("/ws/dashboard")
async def websocket_dashboard(websocket: WebSocket):
    """5 saniyede bir sistem + agent durumu push eder."""
    await websocket.accept()
    try:
        while True:
            loop = asyncio.get_event_loop()
            system = await loop.run_in_executor(None, get_all_system_metrics)
            agents = await get_ollama().get_agents()
            metrics = await get_ollama().get_dashboard_metrics()
            await websocket.send_text(json.dumps({
                "type": "dashboard_update",
                "system": system,
                "agents": agents,
                "metrics": metrics,
            }))
            await asyncio.sleep(5)
    except (WebSocketDisconnect, Exception):
        pass
