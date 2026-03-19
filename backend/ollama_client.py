"""
ZEN v3.0 — Ollama Client
Ollama OpenAI-uyumlu API üzerinden ZEN agentlarını yönetir.

Tool calling:
 1. Native tool_calls (OpenAI format) — model destekliyorsa
 2. Text-based fallback — "TOOL: name {args}" satırlarını parse eder
"""

import re
import json
import httpx
import uuid
from datetime import datetime, timezone

from tools import TOOL_DEFINITIONS, execute_tool

# ─── Aktif model (runtime'da değiştirilebilir) ────────────────────────────────

CURRENT_MODEL: str = "rnj-1:8b"        # backend/.env'den main.py override eder
OLLAMA_BASE_URL: str = "http://localhost:11434"

# ─── Text-based tool call parser ──────────────────────────────────────────────

# Desteklenen format (her satırda):
#   TOOL: shell {"command": "ls -la"}
#   TOOL: read_file {"path": "/home/ninja/file.txt"}
_TOOL_LINE_RE = re.compile(
    r"^TOOL:\s+(\w+)\s+(\{.*?\})\s*$",
    re.MULTILINE,
)


def _parse_text_tool_calls(text: str) -> list[dict]:
    """Metinden TOOL: satırlarını parse eder."""
    calls = []
    for m in _TOOL_LINE_RE.finditer(text):
        try:
            calls.append({
                "name": m.group(1),
                "args": json.loads(m.group(2)),
            })
        except json.JSONDecodeError:
            pass
    return calls


def _strip_tool_lines(text: str) -> str:
    """Metinden TOOL: satırlarını temizler."""
    cleaned = _TOOL_LINE_RE.sub("", text)
    # Birden fazla boş satırı tek boş satıra indir
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    return cleaned.strip()


# ─── Sistem prompt ────────────────────────────────────────────────────────────

_TOOL_INSTRUCTION = """
=== ZEN ARAÇ SİSTEMİ ===
Aşağıdaki araçlara SAHİPSİN. Görevleri yaparken bunları AKTİF OLARAK KULLAN:

  shell          — bash komutu çalıştır
  read_file      — dosya oku
  write_file     — dosya yaz / oluştur
  list_dir       — dizin içeriğini listele
  search_files   — dosya içinde ara (grep) veya dosya bul (find)
  python_eval    — Python kodu çalıştır
  http_request   — HTTP GET/POST isteği
  get_system_info — CPU/RAM/Disk durumu

KRİTİK KURALLAR:
1. Kullanıcıya "şu komutu çalıştırın" veya "şunu deneyin" DEME — komutu kendin çalıştır.
2. Önce araçla bilgi topla, SONRA yorum yap.
3. Paket kurmak için: TOOL: shell {"command": "sudo apt-get install -y <paket>"}
4. Sistem bilgisi için önce kontrol et: TOOL: shell {"command": "which <program> || echo 'bulunamadı'"}

ARAÇ ÇAĞIRMA FORMATI (her çağrı ayrı satırda):
TOOL: <araç_adı> {"argüman": "değer"}

Örnekler:
TOOL: shell {"command": "micro --version 2>&1 || sudo snap install micro --classic"}
TOOL: read_file {"path": "/etc/os-release"}
TOOL: get_system_info {"include_processes": false}
TOOL: shell {"command": "sudo apt-get install -y micro"}

Çalıştırdıktan sonra sonucu Türkçe olarak açıkla.
========================
"""


# ─── Agent tanımları ──────────────────────────────────────────────────────────

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
            "Görevleri analiz eder, araçları kullanarak uygular ve sonuçları raporlarsın."
            + _TOOL_INSTRUCTION
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
            "Dosyaları okuyarak analiz eder, kod üretir, testleri çalıştırır ve sonuçları doğrularsın."
            + _TOOL_INSTRUCTION
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
            "Dosya sistemini tarayarak ilgili bilgileri bulur, geçmişi analiz eder ve özetlersin."
            + _TOOL_INSTRUCTION
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
            "Kodu çalıştırarak test eder, linter çalıştırır, hataları bulur ve düzeltirsin."
            + _TOOL_INSTRUCTION
        ),
    },
]

# Her agent için ayrı chat geçmişi (in-memory)
_chat_history: dict[str, list[dict]] = {a["id"]: [] for a in AGENTS}

# Sistem geneli aktivite logu
_activity_log: list[dict] = []


# ─── Helpers ──────────────────────────────────────────────────────────────────

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
    if len(_activity_log) > 200:
        _activity_log.pop()


# ─── OllamaClient ─────────────────────────────────────────────────────────────

class OllamaClient:
    def __init__(self, base_url: str, model: str, api_key: str | None = None):
        global CURRENT_MODEL, OLLAMA_BASE_URL
        CURRENT_MODEL = model
        OLLAMA_BASE_URL = base_url.rstrip("/")
        self.base_url = OLLAMA_BASE_URL
        self.model = model
        headers = {"Content-Type": "application/json"}
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"
        self.client = httpx.AsyncClient(timeout=180.0, headers=headers)

    # ── Model Yönetimi ──────────────────────────────────────────────────────

    async def list_models(self) -> list[dict]:
        """Ollama'daki mevcut modelleri listeler."""
        try:
            resp = await self.client.get(f"{self.base_url}/api/tags")
            resp.raise_for_status()
            data = resp.json()
            return [
                {
                    "name": m["name"],
                    "size": m.get("size", 0),
                    "modified": m.get("modified_at", ""),
                    "active": m["name"] == self.model,
                }
                for m in data.get("models", [])
            ]
        except Exception as e:
            return [{"name": self.model, "size": 0, "modified": "", "active": True, "error": str(e)}]

    def set_model(self, model_name: str):
        """Aktif modeli değiştirir."""
        global CURRENT_MODEL
        self.model = model_name
        CURRENT_MODEL = model_name
        _log_activity("info", f"Model değişti → {model_name}", "", "Sistem")

    def get_current_model(self) -> str:
        return self.model

    # ── Agent Yönetimi ──────────────────────────────────────────────────────

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
        agent = next((a for a in AGENTS if a["id"] == agent_id), None)
        if not agent:
            raise ValueError(f"Agent bulunamadı: {agent_id}")
        valid = {"active", "idle", "processing", "error"}
        if status not in valid:
            raise ValueError(f"Geçersiz durum: {status}")
        old_status = agent["status"]
        agent["status"] = status
        _log_activity("info", f"Durum değişti — {agent['name']}", f"{old_status} → {status}", agent["name"])
        return {"id": agent_id, "status": status}

    # ── Mesajlaşma (ReAct döngüsü) ──────────────────────────────────────────

    async def send_message(self, agent_id: str, message: str, max_tokens: int = 2048) -> dict:
        """
        Agenta mesaj gönderir. ReAct döngüsü:
          1. Native tool_calls var mı? → çalıştır
          2. Yoksa metin içinde TOOL: satırları var mı? → parse edip çalıştır
          3. Ne varsa çalıştır, sonucu tekrar modele gönder (max 10 tur)
        """
        agent = next((a for a in AGENTS if a["id"] == agent_id), None)
        if not agent:
            raise ValueError(f"Agent bulunamadı: {agent_id}")

        user_msg = {"role": "user", "content": message, "timestamp": _now_iso()}
        _chat_history[agent_id].append(user_msg)

        agent["status"] = "processing"
        agent["tasks"] += 1

        # Bağlam — son 10 user/assistant mesajı
        history_msgs = [
            {"role": m["role"], "content": m["content"]}
            for m in _chat_history[agent_id][-10:]
            if m["role"] in ("user", "assistant")
        ]

        loop_messages: list[dict] = [
            {"role": "system", "content": agent["system"]},
            *history_msgs,
        ]

        collected_tool_calls: list[dict] = []
        final_reply = ""

        try:
            for _turn in range(10):
                resp = await self.client.post(
                    f"{self.base_url}/v1/chat/completions",
                    json={
                        "model": self.model,
                        "messages": loop_messages,
                        "tools": TOOL_DEFINITIONS,
                        "tool_choice": "auto",
                        "stream": False,
                        "max_tokens": max_tokens,
                    },
                )
                resp.raise_for_status()
                data = resp.json()
                choice = data["choices"][0]
                msg = choice["message"]
                content: str = msg.get("content") or ""
                finish = choice.get("finish_reason", "stop")

                # ── 1. Native tool_calls ──────────────────────────────────
                native_calls: list[dict] = msg.get("tool_calls") or []

                # ── 2. Text-based fallback ────────────────────────────────
                text_calls = _parse_text_tool_calls(content) if not native_calls else []

                # Hiç tool call yoksa → son yanıt
                if not native_calls and not text_calls:
                    final_reply = content
                    break

                # ── Native tool_calls işleme ──────────────────────────────
                if native_calls:
                    loop_messages.append({
                        "role": "assistant",
                        "content": content,
                        "tool_calls": native_calls,
                    })
                    for tc in native_calls:
                        fn = tc.get("function", {})
                        tool_name = fn.get("name", "")
                        try:
                            tool_args = json.loads(fn.get("arguments", "{}"))
                        except json.JSONDecodeError:
                            tool_args = {}

                        _log_activity(
                            "info",
                            f"Tool: {tool_name} — {agent['name']}",
                            str(tool_args)[:80],
                            agent["name"],
                        )
                        tool_result = await execute_tool(tool_name, tool_args)
                        collected_tool_calls.append({"name": tool_name, "args": tool_args, "result": tool_result})

                        loop_messages.append({
                            "role": "tool",
                            "tool_call_id": tc.get("id", tool_name),
                            "content": tool_result,
                        })

                # ── Text-based tool_calls işleme ──────────────────────────
                elif text_calls:
                    # Asistan mesajını ekle (TOOL: satırları dahil)
                    loop_messages.append({"role": "assistant", "content": content})

                    # Tool'ları çalıştır
                    results_parts: list[str] = []
                    for call in text_calls:
                        _log_activity(
                            "info",
                            f"Tool: {call['name']} — {agent['name']}",
                            str(call["args"])[:80],
                            agent["name"],
                        )
                        tool_result = await execute_tool(call["name"], call["args"])
                        collected_tool_calls.append({
                            "name": call["name"],
                            "args": call["args"],
                            "result": tool_result,
                        })
                        results_parts.append(
                            f"[{call['name']} sonucu]:\n{tool_result}"
                        )

                    # Sonuçları kullanıcı mesajı olarak gönder (döngü devam etsin)
                    loop_messages.append({
                        "role": "user",
                        "content": (
                            "Tool çalıştırma sonuçları:\n\n"
                            + "\n\n".join(results_parts)
                            + "\n\nBu sonuçlara göre devam et ve Türkçe yanıt ver."
                        ),
                    })

            # Döngü bittiyse (max tur) ama final_reply hâlâ boşsa
            if not final_reply:
                if collected_tool_calls:
                    final_reply = "Tool çalıştırma tamamlandı."
                else:
                    final_reply = content  # son bilinen yanıt

            # Chat geçmişine kaydet
            assistant_msg: dict = {
                "role": "assistant",
                "content": final_reply,
                "timestamp": _now_iso(),
            }
            if collected_tool_calls:
                assistant_msg["tool_calls"] = collected_tool_calls
            _chat_history[agent_id].append(assistant_msg)

            agent["status"] = "active"
            agent["progress"] = min(100, agent["progress"] + 5)

            _log_activity(
                "success",
                f"Tamamlandı — {agent['name']}",
                (final_reply[:100] + "...") if len(final_reply) > 100 else final_reply,
                agent["name"],
            )

            return {
                "success": True,
                "reply": final_reply,
                "agent": agent["name"],
                "tool_calls": collected_tool_calls,
            }

        except Exception as e:
            agent["status"] = "error"
            if _chat_history[agent_id] and _chat_history[agent_id][-1]["role"] == "user":
                _chat_history[agent_id].pop()
            _log_activity("error", f"Mesaj hatası — {agent['name']}", str(e)[:100], agent["name"])
            raise RuntimeError(f"Ollama isteği başarısız: {e}")

    # ── Chat Geçmişi ────────────────────────────────────────────────────────

    async def get_chat_history(self, agent_id: str) -> list[dict]:
        if agent_id not in _chat_history:
            raise ValueError(f"Agent bulunamadı: {agent_id}")
        result = []
        for msg in _chat_history[agent_id]:
            entry: dict = {
                "role": msg["role"],
                "content": msg["content"],
                "timestamp": msg["timestamp"],
                "time": _relative_time(msg["timestamp"]),
            }
            if msg.get("tool_calls"):
                entry["tool_calls"] = msg["tool_calls"]
            result.append(entry)
        return result

    async def clear_chat_history(self, agent_id: str) -> dict:
        if agent_id not in _chat_history:
            raise ValueError(f"Agent bulunamadı: {agent_id}")
        _chat_history[agent_id] = []
        return {"cleared": True}

    # ── Dashboard Metrikleri ────────────────────────────────────────────────

    async def get_recent_activities(self, limit: int = 10) -> list[dict]:
        return [
            {**a, "time": _relative_time(a["time"])}
            for a in _activity_log[:limit]
        ]

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
