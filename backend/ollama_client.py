"""
ZEN v3.0 — Ollama Client
Ollama OpenAI-uyumlu API üzerinden ZEN agentlari yonetir.

Tool calling:
 1. Native tool_calls (OpenAI format) -- model destekliyorsa
 2. Text-based fallback -- "TOOL: name {args}" satirlarini parse eder
 3. delegate_to_agent -- Chief Agent'in sub-agentlara gorev delege etmesi
"""

import asyncio
import os
import re
import json
import httpx
import uuid
from datetime import datetime, timezone

from tools import TOOL_DEFINITIONS, execute_tool

# ── Aktif model (runtime'da degistirilebilir) ─────────────────────────────────

CURRENT_MODEL: str = "rnj-1:8b"
OLLAMA_BASE_URL: str = "http://localhost:11434"

# Proje dizinleri (sub-agentlara bildirilir)
_PROJECT_DIR = "/home/ninja/İndirilenler/zen_dash"
_BACKEND_DIR = _PROJECT_DIR + "/backend"
_ENV_PATH = _BACKEND_DIR + "/.env"

# History sınırı — bellek tüketimini önler
MAX_HISTORY = 100

# Agent başına kilit — eş zamanlı istek karışıklığını önler
_agent_locks: dict[str, asyncio.Lock] = {}


def _get_lock(agent_id: str) -> asyncio.Lock:
    if agent_id not in _agent_locks:
        _agent_locks[agent_id] = asyncio.Lock()
    return _agent_locks[agent_id]


def _persist_model(model_name: str) -> None:
    """Model değişikliğini .env dosyasına yazar — restart'ta kaybolmasın."""
    try:
        lines: list[str] = []
        found = False
        if os.path.exists(_ENV_PATH):
            with open(_ENV_PATH, "r", encoding="utf-8") as f:
                for line in f:
                    if line.startswith("OLLAMA_MODEL="):
                        lines.append(f"OLLAMA_MODEL={model_name}\n")
                        found = True
                    else:
                        lines.append(line)
        if not found:
            lines.append(f"OLLAMA_MODEL={model_name}\n")
        with open(_ENV_PATH, "w", encoding="utf-8") as f:
            f.writelines(lines)
    except Exception:
        pass


def _trim_history(agent_id: str) -> None:
    """History MAX_HISTORY limitini aşarsa en eski mesajları siler."""
    h = _chat_history[agent_id]
    if len(h) > MAX_HISTORY:
        _chat_history[agent_id] = h[-MAX_HISTORY:]


# ── Text-based tool call parser ───────────────────────────────────────────────

_TOOL_LINE_RE = re.compile(
    r"^TOOL:\s+(\w+)\s+(\{.*?\})\s*$",
    re.MULTILINE,
)


def _parse_text_tool_calls(text: str) -> list[dict]:
    calls = []
    for m in _TOOL_LINE_RE.finditer(text):
        try:
            calls.append({"name": m.group(1), "args": json.loads(m.group(2))})
        except json.JSONDecodeError:
            pass
    return calls


def _strip_tool_lines(text: str) -> str:
    cleaned = _TOOL_LINE_RE.sub("", text)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    return cleaned.strip()


# ── Sistem prompt ─────────────────────────────────────────────────────────────

_TOOL_INSTRUCTION = (
    "\n\n=== ZEN ARAC SISTEMI ===\n"
    "Proje: /home/ninja/İndirilenler/zen_dash  |  Backend: /home/ninja/İndirilenler/zen_dash/backend\n\n"
    "Araclar:\n"
    "  shell            -- bash komutu calistir\n"
    "  read_file        -- dosya oku\n"
    "  write_file       -- dosya yaz/olustur\n"
    "  list_dir         -- dizin listele\n"
    "  search_files     -- grep/find ile ara\n"
    "  python_eval      -- Python calistir\n"
    "  http_request     -- HTTP istegi\n"
    "  get_system_info  -- CPU/RAM/Disk durumu\n"
    "  delegate_to_agent -- Alt gorevi uzman agentina delege et:\n"
    "      agent-code-002 (Code Expert)        -> kod analizi, uretim, test\n"
    "      agent-mem-003  (Memory Retriever)   -> dokuman/bilgi tarama\n"
    "      agent-val-004  (Kintsugi Validator) -> kalite kontrolu, dogrulama\n\n"
    "DELEGE KURALI (Chief Agent): Karmasik gorevlerde ilgili uzmana delege et.\n"
    "KURAL: Kullaniciya komut ONERME -- araclari kendin kullan.\n"
    "PAKET: which apt||which dnf||which yum ile paket yoneticisini tespit et.\n"
    "DEPOLAMA: Kalici dosyalar icin ~/zen_projects/ veya proje dizinini kullan. "
    "/tmp gecicidir, sistem restart'inda silinir.\n\n"
    "ARAC FORMATI (her arac ayri satirda):\n"
    "TOOL: arac_adi {\"arg\": \"deger\"}\n\n"
    "Ornekler:\n"
    "TOOL: shell {\"command\": \"python3 --version\"}\n"
    "TOOL: read_file {\"path\": \"/home/ninja/İndirilenler/zen_dash/backend/tools.py\"}\n"
    "TOOL: delegate_to_agent {\"agent_id\": \"agent-code-002\", \"task\": \"tools.py analiz et\"}\n"
    "TOOL: delegate_to_agent {\"agent_id\": \"agent-val-004\", \"task\": \"requirements.txt dogrula\"}\n"
    "========================\n"
)

# ── Agent tanimlari ───────────────────────────────────────────────────────────

AGENTS: list[dict] = [
    {
        "id": "agent-chief-001",
        "name": "Chief Agent",
        "protocol": "Smith",
        "status": "active",
        "tasks": 0,
        "progress": 0,
        "system": (
            "Sen ZEN multi-agent sisteminin bas orchestratörusun (Smith Protokolu).\n\n"
            "SORUMLULUKLAR:\n"
            "- Gorevleri analiz et, uzman agentlara delege et, sonuclari dogrula.\n"
            "- Code Expert'e kod yazdirirken ciktiyi kontrol et: hata varsa somut duzeltme onerileriyle tekrar delege et.\n"
            "- Kod uretim dongusu: delegate(Code Expert) -> sonucu incele -> hata varsa 'Su hatalar var: ... Duzelt:' seklinde tekrar delege et -> maksimum 2 iterasyon.\n"
            "- Kintsugi Validator'a MUTLAKA kodu calistirip test ettir, sadece review degil.\n"
            "- Sonuclari ozetle: hangi dosyalar olusturuldu, testler gecti mi, hata kaldi mi.\n\n"
            "DELEGASYON KURALLARI:\n"
            "- Kod yazma/degistirme -> Code Expert\n"
            "- Bilgi arama/tarama/arastirma -> Memory Retriever\n"
            "- Test/dogrulama/kalite -> Kintsugi Validator\n"
            "- Sistem komutu/dosya islemi -> direkt shell/read_file/write_file kullan"
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
            "Sen bir yazilim muhendisisin. Gorev: kod yaz, dosyaya kaydet, calistir, ciktiyi raporla (Kanso Protokolu).\n\n"
            "KESIN KURALLAR -- BUNLARI HIC IHLAL ETME:\n"
            "1. Kod istendiyse MUTLAKA write_file ile dosyaya yaz. Sadece kod blogu gosterme, kaydet.\n"
            "2. Kodu yazdiktan sonra MUTLAKA shell ile calistir ve ciktisini goster.\n"
            "3. Cikti hata iceriyorsa kodu duzelt, tekrar kaydet, tekrar calistir. Hata yoksa dur.\n"
            "4. Yanit formatı:\n"
            "   - Dosya yolu: <tam yol>\n"
            "   - Calistirma ciktisi: <shell ciktisi>\n"
            "   - Durum: BASARILI / HATALI\n\n"
            "YASAK:\n"
            "- 'Iste bir ornek kod:' deyip sadece markdown kod blogu gostermek YASAK.\n"
            "- Kodu kaydetmeden rapor vermek YASAK.\n"
            "- Calistirmadan 'calisir' demek YASAK.\n\n"
            "Proje dizini: /home/ninja/İndirilenler/zen_dash"
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
            "Sen bilgi ve kaynak arama uzmanisın (Mushin Protokolu).\n\n"
            "SORUMLULUKLAR:\n"
            "- Dosya sistemi tarama: search_files, list_dir, read_file kullan.\n"
            "- Sistem bilgisi toplama: shell ile paket listesi, servis durumu, log analizi yap.\n"
            "- Buldugun bilgileri SOMUT olarak raporla: dosya yollari, versiyon numaralari, satirlar.\n"
            "- Tahmin etme, bul ve goster.\n\n"
            "Proje dizini: /home/ninja/İndirilenler/zen_dash"
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
            "Sen test ve kalite dogrulama uzmanisın (Kintsugi Protokolu).\n\n"
            "KESIN KURALLAR:\n"
            "1. Dogrulanacak kod/dosya belirtildiyse MUTLAKA once read_file ile oku.\n"
            "2. Kodu MUTLAKA shell ile calistir -- sadece inceleme yeterli degil.\n"
            "3. Hata bulduysan MUTLAKA duzeltilmis kodu write_file ile kaydet, tekrar calistir.\n"
            "4. Yanit formatı:\n"
            "   - Test komutu: <ne calistirdin>\n"
            "   - Cikti: <sonuc>\n"
            "   - Hatalar: <liste veya 'YOK'>\n"
            "   - Duzeltmeler: <yapilan degisiklikler veya 'YOK'>\n"
            "   - Sonuc: GECTI / KALDI\n\n"
            "Proje dizini: /home/ninja/İndirilenler/zen_dash"
            + _TOOL_INSTRUCTION
        ),
    },
]

_chat_history: dict[str, list[dict]] = {a["id"]: [] for a in AGENTS}
_activity_log: list[dict] = []

# SSE streaming — her agent için aktif kuyruk
_agent_stream_queue: dict[str, "asyncio.Queue | None"] = {a["id"]: None for a in AGENTS}


# ── Helpers ───────────────────────────────────────────────────────────────────

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _relative_time(iso_str: str) -> str:
    try:
        dt = datetime.fromisoformat(iso_str)
        diff = int((datetime.now(timezone.utc) - dt).total_seconds())
        if diff < 60:
            return f"{diff} sn once"
        elif diff < 3600:
            return f"{diff // 60} dk once"
        elif diff < 86400:
            return f"{diff // 3600} saat once"
        return f"{diff // 86400} gun once"
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


# ── OllamaClient ──────────────────────────────────────────────────────────────

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

    # ── Model Yonetimi ────────────────────────────────────────────────────────

    async def list_models(self) -> list[dict]:
        try:
            resp = await self.client.get(f"{self.base_url}/api/tags")
            resp.raise_for_status()
            return [
                {
                    "name": m["name"],
                    "size": m.get("size", 0),
                    "modified": m.get("modified_at", ""),
                    "active": m["name"] == self.model,
                }
                for m in resp.json().get("models", [])
            ]
        except Exception as e:
            return [{"name": self.model, "size": 0, "modified": "", "active": True, "error": str(e)}]

    def set_model(self, model_name: str):
        global CURRENT_MODEL
        self.model = model_name
        CURRENT_MODEL = model_name
        _persist_model(model_name)
        _log_activity("info", f"Model degisti -> {model_name}", "", "Sistem")

    def get_current_model(self) -> str:
        return self.model

    # ── Agent Yonetimi ────────────────────────────────────────────────────────

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
            raise ValueError(f"Agent bulunamadi: {agent_id}")
        valid = {"active", "idle", "processing", "error"}
        if status not in valid:
            raise ValueError(f"Gecersiz durum: {status}")
        old_status = agent["status"]
        agent["status"] = status
        _log_activity("info", f"Durum degisti -- {agent['name']}", f"{old_status} -> {status}", agent["name"])
        return {"id": agent_id, "status": status}

    # ── Tool Execution (delegation dahil) ─────────────────────────────────────

    async def _execute_tool_or_delegate(self, agent: dict, tool_name: str, tool_args: dict) -> str:
        """
        Tool'u calistir. delegate_to_agent icin sub-message gonder.
        Dairesel delegasyonu onlemek icin _send_sub_message kullanir.
        SSE kuyruğuna tool_start / tool_done olaylari iter.
        """
        _log_activity(
            "info",
            f"Tool: {tool_name} -- {agent['name']}",
            str(tool_args)[:80],
            agent["name"],
        )

        q = _agent_stream_queue.get(agent["id"])
        if q:
            await q.put({"type": "tool_start", "name": tool_name, "args": tool_args})

        if tool_name == "delegate_to_agent":
            sub_id = tool_args.get("agent_id", "")
            sub_task = tool_args.get("task", "")
            if not sub_id or not sub_task:
                result = "Hata: agent_id ve task zorunlu"
            else:
                sub_agent = next((a for a in AGENTS if a["id"] == sub_id), None)
                if not sub_agent:
                    result = f"Hata: agent bulunamadi: {sub_id}"
                else:
                    try:
                        sub_result = await self._send_sub_message(sub_id, sub_task)
                        tc_count = len(sub_result.get("tool_calls") or [])
                        suffix = f"\n[{tc_count} tool kullanildi]" if tc_count else ""
                        result = f"=== {sub_result['agent']} yaniti ===\n{sub_result['reply']}{suffix}"
                    except Exception as e:
                        result = f"Delege hatasi [{sub_id}]: {e}"
        else:
            result = await execute_tool(tool_name, tool_args)

        if q:
            await q.put({
                "type": "tool_done",
                "name": tool_name,
                "args": tool_args,
                "result": result[:1000],
            })

        return result

    async def _send_sub_message(self, agent_id: str, message: str, max_tokens: int = 1024) -> dict:
        """
        Sub-agent cagirisi -- delegation olmadan, max 8 tur.
        Chief Agent'in sub-agentlari cagirmasi icin kullanilir.
        Ayni agent'a esz zamanli istekleri lock ile seriallastirir.
        """
        agent = next((a for a in AGENTS if a["id"] == agent_id), None)
        if not agent:
            raise ValueError(f"Sub-agent bulunamadi: {agent_id}")

        async with _get_lock(agent_id):
            return await self._send_sub_message_locked(agent, agent_id, message, max_tokens)

    async def _send_sub_message_locked(self, agent: dict, agent_id: str, message: str, max_tokens: int) -> dict:
        agent["status"] = "processing"
        agent["tasks"] += 1

        # Son 8 mesaj — daha geniş bağlam (önceki 4'ten artırıldı)
        history_msgs = [
            {"role": m["role"], "content": m["content"]}
            for m in _chat_history[agent_id][-8:]
            if m["role"] in ("user", "assistant")
        ]

        # Sub-agent araclari -- delegate_to_agent HARIC (daire onleme)
        sub_tools = [t for t in TOOL_DEFINITIONS if t["function"]["name"] != "delegate_to_agent"]

        loop_messages: list[dict] = [
            {"role": "system", "content": agent["system"]},
            *history_msgs,
            {"role": "user", "content": message},
        ]

        collected_tool_calls: list[dict] = []
        final_reply = ""
        last_content = ""

        for _turn in range(8):  # 6'dan 8'e çıkarıldı
            resp = await self.client.post(
                f"{self.base_url}/v1/chat/completions",
                json={
                    "model": self.model,
                    "messages": loop_messages,
                    "tools": sub_tools,
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
            last_content = content

            native_calls: list[dict] = msg.get("tool_calls") or []
            text_calls = _parse_text_tool_calls(content) if not native_calls else []

            if not native_calls and not text_calls:
                final_reply = _strip_tool_lines(content)
                break

            if native_calls:
                loop_messages.append({"role": "assistant", "content": content, "tool_calls": native_calls})
                for tc in native_calls:
                    fn = tc.get("function", {})
                    tname = fn.get("name", "")
                    try:
                        targs = json.loads(fn.get("arguments", "{}"))
                    except json.JSONDecodeError:
                        targs = {}
                    _log_activity("info", f"Tool: {tname} -- {agent['name']}", str(targs)[:60], agent["name"])
                    tr = await execute_tool(tname, targs)
                    collected_tool_calls.append({"name": tname, "args": targs, "result": tr})
                    loop_messages.append({"role": "tool", "tool_call_id": tc.get("id", tname), "content": tr})
            elif text_calls:
                loop_messages.append({"role": "assistant", "content": content})
                parts = []
                for call in text_calls:
                    _log_activity("info", f"Tool: {call['name']} -- {agent['name']}", str(call["args"])[:60], agent["name"])
                    tr = await execute_tool(call["name"], call["args"])
                    collected_tool_calls.append({"name": call["name"], "args": call["args"], "result": tr})
                    parts.append(f"[{call['name']}]:\n{tr}")
                loop_messages.append({
                    "role": "user",
                    "content": "Sonuclar:\n\n" + "\n\n".join(parts) + "\n\nTurkce ozet ver.",
                })

        if not final_reply:
            final_reply = last_content or "Islem tamamlandi."

        # Sub-agent gecmisine kaydet + history limitini uygula
        _chat_history[agent_id].append({"role": "user", "content": message, "timestamp": _now_iso()})
        sub_msg: dict = {"role": "assistant", "content": final_reply, "timestamp": _now_iso()}
        if collected_tool_calls:
            sub_msg["tool_calls"] = collected_tool_calls
        _chat_history[agent_id].append(sub_msg)
        _trim_history(agent_id)

        agent["status"] = "active"
        agent["progress"] = min(100, agent["progress"] + 5)
        _log_activity("success", f"Sub-gorev tamamlandi -- {agent['name']}", final_reply[:80], agent["name"])

        return {"success": True, "reply": final_reply, "agent": agent["name"], "tool_calls": collected_tool_calls}

    # ── Ana mesajlasma (ReAct dongusu) ────────────────────────────────────────

    async def send_message(self, agent_id: str, message: str, max_tokens: int = 2048) -> dict:
        """
        Agenta mesaj gonderir. ReAct dongusu (max 15 tur):
          1. Native tool_calls -> calistir (delegate_to_agent dahil)
          2. Text-based fallback -> TOOL: satirlari parse edip calistir
          3. Max tur sonrasi ozet istegi
        Ayni agent'a esz zamanli istekleri lock ile seriallastirir.
        """
        agent = next((a for a in AGENTS if a["id"] == agent_id), None)
        if not agent:
            raise ValueError(f"Agent bulunamadi: {agent_id}")

        async with _get_lock(agent_id):
            return await self._send_message_locked(agent, agent_id, message, max_tokens)

    async def _send_message_locked(self, agent: dict, agent_id: str, message: str, max_tokens: int) -> dict:
        user_msg = {"role": "user", "content": message, "timestamp": _now_iso()}
        _chat_history[agent_id].append(user_msg)

        agent["status"] = "processing"
        agent["tasks"] += 1

        # Son 12 mesaj — önceki 10'dan artırıldı
        history_msgs = [
            {"role": m["role"], "content": m["content"]}
            for m in _chat_history[agent_id][-12:]
            if m["role"] in ("user", "assistant")
        ]

        loop_messages: list[dict] = [
            {"role": "system", "content": agent["system"]},
            *history_msgs,
        ]

        collected_tool_calls: list[dict] = []
        final_reply = ""
        last_content = ""

        try:
            for _turn in range(15):  # 12'den 15'e çıkarıldı
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
                last_content = content

                native_calls: list[dict] = msg.get("tool_calls") or []
                text_calls = _parse_text_tool_calls(content) if not native_calls else []

                if not native_calls and not text_calls:
                    final_reply = _strip_tool_lines(content)
                    break

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

                        tool_result = await self._execute_tool_or_delegate(agent, tool_name, tool_args)
                        collected_tool_calls.append({"name": tool_name, "args": tool_args, "result": tool_result})
                        loop_messages.append({
                            "role": "tool",
                            "tool_call_id": tc.get("id", tool_name),
                            "content": tool_result,
                        })

                elif text_calls:
                    loop_messages.append({"role": "assistant", "content": content})
                    results_parts: list[str] = []
                    for call in text_calls:
                        tool_result = await self._execute_tool_or_delegate(agent, call["name"], call["args"])
                        collected_tool_calls.append({
                            "name": call["name"],
                            "args": call["args"],
                            "result": tool_result,
                        })
                        results_parts.append(f"[{call['name']} sonucu]:\n{tool_result}")

                    loop_messages.append({
                        "role": "user",
                        "content": (
                            "Tool sonuclari:\n\n"
                            + "\n\n".join(results_parts)
                            + "\n\nSonuclari analiz et ve Turkce ozet ver. "
                            "Baska tool gerekiyorsa cagir, gerekli degilse sadece yanitla."
                        ),
                    })

            # Max tur bittiyse ozet iste
            if not final_reply and collected_tool_calls:
                tool_summary = "\n".join(
                    f"- {tc['name']}: {str(tc.get('result', ''))[:150]}"
                    for tc in collected_tool_calls[-6:]
                )
                try:
                    sum_resp = await self.client.post(
                        f"{self.base_url}/v1/chat/completions",
                        json={
                            "model": self.model,
                            "messages": [
                                {"role": "system", "content": agent["system"]},
                                {
                                    "role": "user",
                                    "content": (
                                        f"Gorev: {message}\n\nTool sonuclari:\n{tool_summary}"
                                        "\n\nTurkce ozet rapor ver. Tool cagirma."
                                    ),
                                },
                            ],
                            "stream": False,
                            "max_tokens": 512,
                        },
                    )
                    if sum_resp.status_code == 200:
                        final_reply = sum_resp.json()["choices"][0]["message"].get("content", "")
                except Exception:
                    pass

            if not final_reply:
                final_reply = last_content or "Islem tamamlandi."

            assistant_msg: dict = {
                "role": "assistant",
                "content": final_reply,
                "timestamp": _now_iso(),
            }
            if collected_tool_calls:
                assistant_msg["tool_calls"] = collected_tool_calls
            _chat_history[agent_id].append(assistant_msg)
            _trim_history(agent_id)

            agent["status"] = "active"
            agent["progress"] = min(100, agent["progress"] + 5)

            _log_activity(
                "success",
                f"Tamamlandi -- {agent['name']}",
                (final_reply[:100] + "...") if len(final_reply) > 100 else final_reply,
                agent["name"],
            )

            # SSE kuyruğuna final reply gönder
            q = _agent_stream_queue.get(agent_id)
            if q:
                await q.put({
                    "type": "reply",
                    "content": final_reply,
                    "tool_calls": collected_tool_calls,
                })

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
            _log_activity("error", f"Mesaj hatasi -- {agent['name']}", str(e)[:100], agent["name"])
            q = _agent_stream_queue.get(agent_id)
            if q:
                await q.put({"type": "error", "message": str(e)})
            raise RuntimeError(f"Ollama istegi basarisiz: {e}")

    # ── SSE Streaming ─────────────────────────────────────────────────────────

    async def stream_message(self, agent_id: str, message: str, max_tokens: int = 2048):
        """
        Async generator — her tool ve final reply için SSE satırı üretir.
        Frontend EventSource veya fetch stream ile bağlanır.
        """
        agent = next((a for a in AGENTS if a["id"] == agent_id), None)
        if not agent:
            yield f"data: {json.dumps({'type': 'error', 'message': f'Agent bulunamadi: {agent_id}'})}\n\n"
            return

        q: asyncio.Queue = asyncio.Queue()
        _agent_stream_queue[agent_id] = q

        async def _run():
            try:
                async with _get_lock(agent_id):
                    await self._send_message_locked(agent, agent_id, message, max_tokens)
            except Exception as e:
                if q:
                    await q.put({"type": "error", "message": str(e)})
            finally:
                _agent_stream_queue[agent_id] = None
                await q.put({"type": "done"})

        asyncio.create_task(_run())

        while True:
            try:
                event = await asyncio.wait_for(q.get(), timeout=30)
            except asyncio.TimeoutError:
                yield "data: {\"type\":\"heartbeat\"}\n\n"
                continue

            yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"
            if event.get("type") in ("done", "error"):
                break

    # ── Chat Gecmisi ──────────────────────────────────────────────────────────

    async def get_chat_history(self, agent_id: str) -> list[dict]:
        if agent_id not in _chat_history:
            raise ValueError(f"Agent bulunamadi: {agent_id}")
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
            raise ValueError(f"Agent bulunamadi: {agent_id}")
        _chat_history[agent_id] = []
        return {"cleared": True}

    # ── Dashboard Metrikleri ──────────────────────────────────────────────────

    async def get_recent_activities(self, limit: int = 10) -> list[dict]:
        return [{**a, "time": _relative_time(a["time"])} for a in _activity_log[:limit]]

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
        DAYS_TR = ["Pzt", "Sal", "Car", "Per", "Cum", "Cmt", "Paz"]
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
