"""
ZEN v3.0 — Ollama Client
Ollama OpenAI-uyumlu API üzerinden ZEN agentlarını yönetir.
"""

import httpx
import uuid
from datetime import datetime, timezone

OLLAMA_BASE_URL = "http://localhost:11434"

AGENTS: list[dict] = [
    {
        "id": "agent-chief-001",
        "name": "Chief Agent",
        "protocol": "Smith",
        "status": "active",
        "tasks": 0,
        "progress": 0,
        "system": (
            "Sen ZEN multi-agent sisteminin baş orchestratörüsün (Smith Protokolü). "
            "Görevleri analiz eder, diğer agentlara yönlendirirsin. "
            "Her zaman yapılandırılmış ve Türkçe yanıt verirsin."
        ),
    },
    {
        "id": "agent-code-002",
        "name": "Code Expert",
        "protocol": "Kanso",
        "status": "active",
        "tasks": 0,
        "progress": 0,
        "system": (
            "Sen kod üretimi ve code review konusunda uzmansın (Kanso Protokolü). "
            "Temiz, okunabilir ve verimli kod yazarsın. Yanıtların her zaman pratik ve özlüdür."
        ),
    },
    {
        "id": "agent-mem-003",
        "name": "Memory Retriever",
        "protocol": "Mushin",
        "status": "idle",
        "tasks": 0,
        "progress": 0,
        "system": (
            "Sen bilgi tabanından bağlamsal bilgi çekiyorsun (Mushin Protokolü). "
            "KR kurallarını yönetir, geçmişi hatırlar ve ilgili bilgileri sağlarsın."
        ),
    },
    {
        "id": "agent-val-004",
        "name": "Kintsugi Validator",
        "protocol": "Kintsugi",
        "status": "active",
        "tasks": 0,
        "progress": 0,
        "system": (
            "Sen çıktıları kalite açısından doğruluyorsun (Kintsugi Protokolü). "
            "Hataları düzeltir, eksiklikleri tamamlar ve kalite standartlarını garantilersin."
        ),
    },
]

# Her agent için ayrı chat geçmişi (in-memory)
_chat_history: dict[str, list[dict]] = {a["id"]: [] for a in AGENTS}

# Sistem geneli aktivite logu
_activity_log: list[dict] = []


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _relative_time(iso_str: str) -> str:
    try:
        dt = datetime.fromisoformat(iso_str)
        diff = int((datetime.now(timezone.utc) - dt).total_seconds())
        if diff < 60:
            return f"{diff} sn önce"
        elif diff < 3600:
            return f"{diff // 60} dk önce"
        elif diff < 86400:
            return f"{diff // 3600} saat önce"
        return f"{diff // 86400} gün önce"
    except Exception:
        return "bilinmiyor"


def _log_activity(activity_type: str, title: str, description: str, agent_name: str):
    _activity_log.insert(0, {
        "id": str(uuid.uuid4())[:8],
        "type": activity_type,
        "title": title,
        "description": description,
        "time": _now_iso(),
        "agent": agent_name,
    })
    if len(_activity_log) > 100:
        _activity_log.pop()


class OllamaClient:
    def __init__(self, base_url: str, model: str, api_key: str | None = None):
        self.base_url = base_url.rstrip("/")
        self.model = model
        headers = {"Content-Type": "application/json"}
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"
        self.client = httpx.AsyncClient(timeout=120.0, headers=headers)

    async def get_agents(self) -> list[dict]:
        return [
            {
                "id": a["id"],
                "name": a["name"],
                "protocol": a["protocol"],
                "status": a["status"],
                "tasks": a["tasks"],
                "progress": a["progress"],
            }
            for a in AGENTS
        ]

    async def set_agent_status(self, agent_id: str, status: str) -> dict:
        """Agent durumunu değiştirir (pause/resume)."""
        agent = next((a for a in AGENTS if a["id"] == agent_id), None)
        if not agent:
            raise ValueError(f"Agent bulunamadı: {agent_id}")
        valid = {"active", "idle", "processing", "error"}
        if status not in valid:
            raise ValueError(f"Geçersiz durum: {status}")
        old_status = agent["status"]
        agent["status"] = status
        _log_activity(
            "info",
            f"Durum değişti — {agent['name']}",
            f"{old_status} → {status}",
            agent["name"],
        )
        return {"id": agent_id, "status": status}

    async def send_message(self, agent_id: str, message: str, max_tokens: int = 1024) -> dict:
        """Belirtilen agenta mesaj gönderir, Ollama'dan yanıt alır ve geçmişi saklar."""
        agent = next((a for a in AGENTS if a["id"] == agent_id), None)
        if not agent:
            raise ValueError(f"Agent bulunamadı: {agent_id}")

        # Kullanıcı mesajını geçmişe ekle
        user_msg = {"role": "user", "content": message, "timestamp": _now_iso()}
        _chat_history[agent_id].append(user_msg)

        agent["status"] = "processing"
        agent["tasks"] += 1

        # Son 10 mesajı bağlam olarak gönder
        history_msgs = [
            {"role": m["role"], "content": m["content"]}
            for m in _chat_history[agent_id][-10:]
            if m["role"] in ("user", "assistant")
        ]

        try:
            resp = await self.client.post(
                f"{self.base_url}/v1/chat/completions",
                json={
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": agent["system"]},
                        *history_msgs,
                    ],
                    "stream": False,
                    "max_tokens": max_tokens,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            reply = data["choices"][0]["message"]["content"]

            # Agent yanıtını geçmişe ekle
            assistant_msg = {"role": "assistant", "content": reply, "timestamp": _now_iso()}
            _chat_history[agent_id].append(assistant_msg)

            agent["status"] = "active"
            agent["progress"] = min(100, agent["progress"] + 5)

            _log_activity(
                "success",
                f"Mesaj tamamlandı — {agent['name']}",
                reply[:100] + ("..." if len(reply) > 100 else ""),
                agent["name"],
            )
            return {"success": True, "reply": reply, "agent": agent["name"]}

        except Exception as e:
            agent["status"] = "error"
            # Başarısız kullanıcı mesajını da geçmişten çıkar
            if _chat_history[agent_id] and _chat_history[agent_id][-1]["role"] == "user":
                _chat_history[agent_id].pop()
            _log_activity("error", f"Mesaj hatası — {agent['name']}", str(e)[:100], agent["name"])
            raise RuntimeError(f"Ollama isteği başarısız: {e}")

    async def get_chat_history(self, agent_id: str) -> list[dict]:
        """Agent'ın chat geçmişini döner."""
        if agent_id not in _chat_history:
            raise ValueError(f"Agent bulunamadı: {agent_id}")
        result = []
        for msg in _chat_history[agent_id]:
            result.append({
                "role": msg["role"],
                "content": msg["content"],
                "timestamp": msg["timestamp"],
                "time": _relative_time(msg["timestamp"]),
            })
        return result

    async def clear_chat_history(self, agent_id: str) -> dict:
        """Agent chat geçmişini temizler."""
        if agent_id not in _chat_history:
            raise ValueError(f"Agent bulunamadı: {agent_id}")
        _chat_history[agent_id] = []
        return {"cleared": True}

    async def get_recent_activities(self, limit: int = 10) -> list[dict]:
        result = []
        for a in _activity_log[:limit]:
            result.append({**a, "time": _relative_time(a["time"])})
        return result

    async def get_dashboard_metrics(self) -> dict:
        active = sum(1 for a in AGENTS if a["status"] == "active")
        total = len(AGENTS)
        completed = sum(a["tasks"] for a in AGENTS)
        success_activities = sum(1 for a in _activity_log if a["type"] == "success")
        total_activities = len(_activity_log) or 1
        success_rate = int((success_activities / total_activities) * 100)

        return {
            "activeAgents": {"value": f"{active}/{total}", "change": 0},
            "completedTasks": {"value": completed, "change": 0},
            "successRate": {"value": f"{success_rate}%", "change": 0},
            "memoryRules": {"value": len(_activity_log), "change": 0},
        }

    async def get_weekly_performance(self) -> list[dict]:
        from datetime import timedelta
        DAYS_TR = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"]
        today = datetime.now(timezone.utc).date()
        daily: dict[str, dict] = {}
        for i in range(7):
            d = today - timedelta(days=6 - i)
            daily[str(d)] = {"total": 0, "success": 0}
        for act in _activity_log:
            try:
                dt = datetime.fromisoformat(act["time"]).date()
                key = str(dt)
                if key in daily:
                    daily[key]["total"] += 1
                    if act["type"] == "success":
                        daily[key]["success"] += 1
            except Exception:
                pass
        result = []
        for key, counts in daily.items():
            day_name = DAYS_TR[datetime.fromisoformat(key).weekday()]
            rate = int((counts["success"] / counts["total"]) * 100) if counts["total"] else 0
            result.append({"name": day_name, "value": rate})
        return result

    async def get_task_distribution(self) -> list[dict]:
        colors = ["#00D9FF", "#8B5CF6", "#FBBF24", "#10B981"]
        total = sum(a["tasks"] for a in AGENTS) or 1
        return [
            {
                "name": a["name"],
                "value": max(1, int((a["tasks"] / total) * 100)),
                "color": colors[i % len(colors)],
            }
            for i, a in enumerate(AGENTS)
        ]

    async def close(self):
        await self.client.aclose()
