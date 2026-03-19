"""
ZEN v3.0 — Letta API Client & Transformer
Letta /v1/* endpoint'lerinden veri çeker, ZEN formatına dönüştürür.
"""

import httpx
from datetime import datetime, timezone


LETTA_STATUS_MAP = {
    "running": "active",
    "paused": "idle",
    "error": "error",
    "starting": "processing",
    "stopped": "idle",
}

STEP_TYPE_MAP = {
    "success": "success",
    "failed": "error",
    "error": "error",
    "info": "info",
    "warning": "warning",
}


def _relative_time(iso_str: str) -> str:
    """ISO timestamp'i 'X dk önce' formatına çevirir."""
    try:
        dt = datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
        now = datetime.now(timezone.utc)
        diff = int((now - dt).total_seconds())

        if diff < 60:
            return f"{diff} sn önce"
        elif diff < 3600:
            return f"{diff // 60} dk önce"
        elif diff < 86400:
            return f"{diff // 3600} saat önce"
        else:
            return f"{diff // 86400} gün önce"
    except Exception:
        return "bilinmiyor"


class LettaClient:
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip("/")
        self.client = httpx.AsyncClient(timeout=10.0)

    async def get_agents(self) -> list[dict]:
        """Letta /v1/agents → ZEN Agent formatı"""
        try:
            resp = await self.client.get(f"{self.base_url}/v1/agents")
            resp.raise_for_status()
            raw_agents = resp.json()

            result = []
            for i, agent in enumerate(raw_agents):
                raw_status = agent.get("state", agent.get("status", "paused"))
                zen_status = LETTA_STATUS_MAP.get(raw_status, "idle")

                # Protocol adını agent adından çıkar (yoksa varsayılan)
                name = agent.get("name", f"Agent {i+1}")
                protocol_map = {
                    "Chief Agent": "Smith",
                    "Code Expert": "Kanso",
                    "Memory Retriever": "Mushin",
                    "Kintsugi Validator": "Kintsugi",
                }
                protocol = protocol_map.get(name, "Unknown")

                result.append({
                    "id": agent.get("id", str(i + 1)),
                    "name": name,
                    "protocol": protocol,
                    "status": zen_status,
                    "tasks": agent.get("metadata", {}).get("task_count", 0),
                    "progress": agent.get("metadata", {}).get("progress", 0),
                })

            return result
        except Exception as e:
            raise RuntimeError(f"Letta agents fetch failed: {e}")

    async def get_steps(self, limit: int = 10) -> list[dict]:
        """Letta /v1/steps → ZEN Activity formatı"""
        try:
            resp = await self.client.get(
                f"{self.base_url}/v1/steps", params={"limit": limit}
            )
            resp.raise_for_status()
            raw_steps = resp.json()

            # Agent id→name lookup için agents listesini al
            agents_resp = await self.client.get(f"{self.base_url}/v1/agents")
            agents_map: dict[str, str] = {}
            if agents_resp.status_code == 200:
                for a in agents_resp.json():
                    agents_map[a.get("id", "")] = a.get("name", "Unknown Agent")

            result = []
            for step in raw_steps:
                raw_type = step.get("status", step.get("finish_reason", "info"))
                zen_type = STEP_TYPE_MAP.get(raw_type, "info")
                agent_id = step.get("agent_id", "")
                agent_name = agents_map.get(agent_id, "Unknown Agent")

                result.append({
                    "id": step.get("id", ""),
                    "type": zen_type,
                    "title": step.get("title", "Aktivite"),
                    "description": step.get("finish_reason", step.get("description", "")),
                    "time": _relative_time(step.get("created_at", "")),
                    "agent": agent_name,
                })

            return result
        except Exception as e:
            raise RuntimeError(f"Letta steps fetch failed: {e}")

    async def get_dashboard_metrics(self) -> dict:
        """Letta verilerinden özet dashboard metrikleri üretir."""
        try:
            agents_resp = await self.client.get(f"{self.base_url}/v1/agents")
            steps_resp = await self.client.get(
                f"{self.base_url}/v1/steps", params={"limit": 1000}
            )

            agents = agents_resp.json() if agents_resp.status_code == 200 else []
            steps = steps_resp.json() if steps_resp.status_code == 200 else []

            active_count = sum(
                1
                for a in agents
                if LETTA_STATUS_MAP.get(
                    a.get("state", a.get("status", "")), "idle"
                ) == "active"
            )
            total_count = len(agents)

            completed = sum(
                1 for s in steps
                if s.get("status", s.get("finish_reason", "")) == "success"
            )
            failed = sum(
                1 for s in steps
                if s.get("status", s.get("finish_reason", "")) in ("failed", "error")
            )
            total_steps = len(steps)
            success_rate = (
                int((completed / total_steps) * 100) if total_steps > 0 else 0
            )

            memory_rules = sum(
                a.get("metadata", {}).get("memory_rule_count", 0) for a in agents
            )

            return {
                "activeAgents": {"value": f"{active_count}/{total_count}", "change": 0},
                "completedTasks": {"value": completed, "change": 0},
                "successRate": {"value": f"{success_rate}%", "change": 0},
                "memoryRules": {"value": memory_rules, "change": 0},
            }
        except Exception as e:
            raise RuntimeError(f"Letta metrics fetch failed: {e}")

    async def get_weekly_performance(self) -> list[dict]:
        """Son 7 günün başarı oranlarını hesaplar."""
        from datetime import timedelta

        DAYS_TR = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"]

        try:
            resp = await self.client.get(
                f"{self.base_url}/v1/steps", params={"limit": 1000}
            )
            steps = resp.json() if resp.status_code == 200 else []

            today = datetime.now(timezone.utc).date()
            daily: dict[str, dict] = {}

            for i in range(7):
                day = today - timedelta(days=6 - i)
                key = str(day)
                daily[key] = {"total": 0, "success": 0}

            for step in steps:
                try:
                    dt = datetime.fromisoformat(
                        step.get("created_at", "").replace("Z", "+00:00")
                    ).date()
                    key = str(dt)
                    if key in daily:
                        daily[key]["total"] += 1
                        if step.get("status", "") == "success":
                            daily[key]["success"] += 1
                except Exception:
                    pass

            result = []
            for i, (key, counts) in enumerate(daily.items()):
                day_date = datetime.fromisoformat(key).date()
                day_name = DAYS_TR[day_date.weekday()]
                rate = (
                    int((counts["success"] / counts["total"]) * 100)
                    if counts["total"] > 0
                    else 0
                )
                result.append({"name": day_name, "value": rate})

            return result
        except Exception as e:
            raise RuntimeError(f"Letta weekly performance fetch failed: {e}")

    async def get_task_distribution(self) -> list[dict]:
        """Agent bazlı görev dağılımını hesaplar."""
        COLORS = ["#00D9FF", "#8B5CF6", "#FBBF24", "#10B981", "#FF00E5"]

        try:
            agents_resp = await self.client.get(f"{self.base_url}/v1/agents")
            agents = agents_resp.json() if agents_resp.status_code == 200 else []

            result = []
            for i, agent in enumerate(agents):
                task_count = agent.get("metadata", {}).get("task_count", 0)
                result.append({
                    "name": agent.get("name", f"Agent {i+1}"),
                    "value": task_count,
                    "color": COLORS[i % len(COLORS)],
                })

            return result
        except Exception as e:
            raise RuntimeError(f"Letta task distribution fetch failed: {e}")

    async def send_task_to_agent(self, agent_id: str, message: str) -> dict:
        """Chief Agent'a yeni görev gönderir."""
        try:
            resp = await self.client.post(
                f"{self.base_url}/v1/agents/{agent_id}/messages",
                json={"role": "user", "content": message},
            )
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            raise RuntimeError(f"Failed to send task to agent: {e}")

    async def close(self):
        await self.client.aclose()
