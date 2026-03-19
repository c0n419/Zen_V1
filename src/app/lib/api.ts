/**
 * ZEN v3.0 API Client
 * VITE_ENABLE_MOCK=true  → mock data
 * VITE_ENABLE_MOCK=false → gerçek Ollama bridge (port 8000)
 */

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const MOCK_ENABLED = import.meta.env.VITE_ENABLE_MOCK === "true";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Agent {
  id: string;
  name: string;
  protocol: string;
  status: "active" | "idle" | "error" | "processing";
  tasks: number;
  progress: number;
}

export interface Metric {
  value: number | string;
  change: number;
}

export interface Activity {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  description: string;
  time: string;
  agent: string;
}

export interface ChartData {
  name: string;
  value: number;
}

export interface TaskDistributionData {
  name: string;
  value: number;
  color: string;
}

export interface SystemMetrics {
  gpu: { label: string; value: string; percentage: number }[];
  ram: { value: string; total?: string; percentage: number };
  disk: { value: string; read?: string; write?: string; percentage: number };
}

export interface DashboardMetrics {
  activeAgents: Metric;
  completedTasks: Metric;
  successRate: Metric;
  memoryRules: Metric;
}

export interface ToolCall {
  name: string;
  args: Record<string, unknown>;
  result: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  time?: string;
  tool_calls?: ToolCall[];
}

export interface TaskResult {
  success: boolean;
  reply: string;
  agent: string;
  tool_calls?: ToolCall[];
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_AGENTS: Agent[] = [
  { id: "agent-chief-001", name: "Chief Agent", protocol: "Smith", status: "active", tasks: 12, progress: 75 },
  { id: "agent-code-002", name: "Code Expert", protocol: "Kanso", status: "processing", tasks: 8, progress: 60 },
  { id: "agent-mem-003", name: "Memory Retriever", protocol: "Mushin", status: "idle", tasks: 3, progress: 30 },
  { id: "agent-val-004", name: "Kintsugi Validator", protocol: "Kintsugi", status: "active", tasks: 5, progress: 90 },
];

const MOCK_PERFORMANCE: ChartData[] = [
  { name: "Pzt", value: 65 }, { name: "Sal", value: 78 }, { name: "Çar", value: 72 },
  { name: "Per", value: 85 }, { name: "Cum", value: 92 }, { name: "Cmt", value: 88 }, { name: "Paz", value: 95 },
];

const MOCK_ACTIVITIES: Activity[] = [
  { id: "1", type: "success", title: "Görev T-042 Tamamlandı", description: "Code Expert tarafından başarıyla sonuçlandırıldı", time: "2 dk önce", agent: "Code Expert" },
  { id: "2", type: "info", title: "Hafıza Taraması", description: "KR-018 kuralı güncellendi", time: "15 dk önce", agent: "Memory Retriever" },
  { id: "3", type: "warning", title: "Doğrulama Uyarısı", description: "Manuel kontrol gerekiyor", time: "1 saat önce", agent: "Kintsugi Validator" },
];

const MOCK_SYSTEM: SystemMetrics = {
  gpu: [{ label: "RTX 4060 Ti", value: "64%", percentage: 64 }],
  ram: { value: "8.2 GB", percentage: 51 },
  disk: { value: "2.4 MB/s", percentage: 78 },
};

const MOCK_DASHBOARD: DashboardMetrics = {
  activeAgents: { value: "3/4", change: 12.5 },
  completedTasks: { value: 28, change: 8.3 },
  successRate: { value: "94%", change: 3.2 },
  memoryRules: { value: 5, change: -2.1 },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, options);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text || path}`);
  }
  return res.json() as Promise<T>;
}

function mockDelay<T>(data: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

// ─── Agents ──────────────────────────────────────────────────────────────────

export async function getAgentStatus(): Promise<Agent[]> {
  if (MOCK_ENABLED) return mockDelay(MOCK_AGENTS);
  return apiFetch<Agent[]>("/agents/status");
}

export async function setAgentStatus(agentId: string, status: string): Promise<{ id: string; status: string }> {
  if (MOCK_ENABLED) return mockDelay({ id: agentId, status });
  return apiFetch(`/agents/${agentId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

export async function sendTaskToAgent(agentId: string, message: string): Promise<TaskResult> {
  if (MOCK_ENABLED) return mockDelay({ success: true, reply: "Mock yanıt: " + message, agent: "Mock Agent" });
  return apiFetch<TaskResult>(`/agents/${agentId}/task`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
}

// ─── Chat ────────────────────────────────────────────────────────────────────

export async function getChatHistory(agentId: string): Promise<ChatMessage[]> {
  if (MOCK_ENABLED) return mockDelay([]);
  return apiFetch<ChatMessage[]>(`/agents/${agentId}/history`);
}

export async function clearChatHistory(agentId: string): Promise<void> {
  if (MOCK_ENABLED) return mockDelay(undefined);
  await apiFetch(`/agents/${agentId}/history`, { method: "DELETE" });
}

// ─── Dashboard Metrics ───────────────────────────────────────────────────────

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  if (MOCK_ENABLED) return mockDelay(MOCK_DASHBOARD);
  return apiFetch<DashboardMetrics>("/metrics/dashboard");
}

export async function getPerformanceData(): Promise<ChartData[]> {
  if (MOCK_ENABLED) return mockDelay(MOCK_PERFORMANCE);
  return apiFetch<ChartData[]>("/performance/weekly");
}

export async function getRecentActivities(limit = 50): Promise<Activity[]> {
  if (MOCK_ENABLED) return mockDelay(MOCK_ACTIVITIES);
  return apiFetch<Activity[]>(`/activities/recent?limit=${limit}`);
}

export async function getTaskDistribution(): Promise<TaskDistributionData[]> {
  if (MOCK_ENABLED) return mockDelay([
    { name: "Code Expert", value: 35, color: "#00D9FF" },
    { name: "Research", value: 25, color: "#8B5CF6" },
    { name: "Validation", value: 20, color: "#FBBF24" },
    { name: "Memory", value: 20, color: "#10B981" },
  ]);
  return apiFetch<TaskDistributionData[]>("/tasks/distribution");
}

export async function getSystemMetrics(): Promise<SystemMetrics> {
  if (MOCK_ENABLED) return mockDelay(MOCK_SYSTEM);
  return apiFetch<SystemMetrics>("/system/metrics");
}

// ─── WebSocket ────────────────────────────────────────────────────────────────

export function createWebSocketConnection(onMessage: (data: unknown) => void) {
  const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8000/ws/dashboard";
  try {
    const ws = new WebSocket(WS_URL);
    ws.onopen = () => console.log("WS bağlandı");
    ws.onmessage = (e) => { try { onMessage(JSON.parse(e.data)); } catch {} };
    ws.onerror = () => console.error("WS hatası");
    ws.onclose = () => console.log("WS kapandı");
    return ws;
  } catch {
    return null;
  }
}
