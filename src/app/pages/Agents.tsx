import { useState, useEffect, useCallback } from "react";
import { Header } from "../components/layout/Header";
import { BottomNav } from "../components/layout/BottomNav";
import { motion } from "motion/react";
import {
  Brain, Cpu, Zap, TrendingUp, Clock, CheckCircle2, XCircle,
  Play, Pause, RefreshCw, MessageSquare, BarChart3,
} from "lucide-react";
import { GradientCard } from "../components/ui/GradientCard";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { useNavigate } from "react-router";
import {
  getAgentStatus,
  setAgentStatus,
  type Agent,
} from "../lib/api";

const AGENT_GRADIENTS: Record<string, "cyan" | "magenta" | "yellow" | "green"> = {
  "agent-chief-001": "cyan",
  "agent-code-002": "magenta",
  "agent-mem-003": "yellow",
  "agent-val-004": "green",
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "active":     return <Badge className="bg-green-500/10 text-green-400 border-green-500/20">Aktif</Badge>;
    case "idle":       return <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">Beklemede</Badge>;
    case "error":      return <Badge className="bg-red-500/10 text-red-400 border-red-500/20">Hata</Badge>;
    case "processing": return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">İşliyor</Badge>;
    default:           return <Badge>Bilinmiyor</Badge>;
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "active":     return <CheckCircle2 className="w-4 h-4 text-green-400" />;
    case "idle":       return <Clock className="w-4 h-4 text-yellow-400" />;
    case "error":      return <XCircle className="w-4 h-4 text-red-400" />;
    case "processing": return <Zap className="w-4 h-4 text-blue-400 animate-pulse" />;
    default:           return <Clock className="w-4 h-4" />;
  }
};

export default function Agents() {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    try {
      const data = await getAgentStatus();
      setAgents(data);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchAgents();
    const iv = setInterval(fetchAgents, 8_000);
    return () => clearInterval(iv);
  }, [fetchAgents]);

  async function handleToggle(agent: Agent) {
    const newStatus = agent.status === "active" || agent.status === "processing" ? "idle" : "active";
    setTogglingId(agent.id);
    try {
      await setAgentStatus(agent.id, newStatus);
      setAgents((prev) => prev.map((a) => a.id === agent.id ? { ...a, status: newStatus as Agent["status"] } : a));
    } catch {}
    finally { setTogglingId(null); }
  }

  async function handleRefresh(agentId: string) {
    setRefreshingId(agentId);
    await fetchAgents();
    setRefreshingId(null);
  }

  const activeAgents = agents.filter((a) => a.status === "active").length;
  const totalTasks = agents.reduce((s, a) => s + a.tasks, 0);
  const avgProgress = agents.length > 0 ? Math.round(agents.reduce((s, a) => s + a.progress, 0) / agents.length) : 0;

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h2 className="text-2xl font-bold mb-2">
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Agent</span> Yönetimi
          </h2>
          <p className="text-muted-foreground">ZEN agentlarını izle, durdur ve yönet</p>
        </motion.div>

        {/* Özet */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Aktif Agent", value: `${activeAgents}/${agents.length}`, icon: Brain, gradient: "cyan" as const },
            { label: "Ortalama İlerleme", value: `${avgProgress}%`, icon: TrendingUp, gradient: "magenta" as const },
            { label: "Toplam Görev", value: totalTasks, icon: CheckCircle2, gradient: "yellow" as const },
            { label: "Sistem Durumu", value: activeAgents > 0 ? "Aktif" : "Beklemede", icon: Zap, gradient: "green" as const },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <GradientCard gradient={stat.gradient} className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-background/50">
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{loading ? "—" : stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </GradientCard>
            </motion.div>
          ))}
        </div>

        {/* Agent Kartları */}
        <div className="grid lg:grid-cols-2 gap-4">
          {loading ? (
            [1, 2, 3, 4].map((n) => (
              <div key={n} className="h-48 rounded-2xl border border-border/30 animate-pulse bg-muted/10" />
            ))
          ) : (
            agents.map((agent, i) => {
              const gradient = AGENT_GRADIENTS[agent.id] ?? "cyan";
              const isToggling = togglingId === agent.id;
              const isRefreshing = refreshingId === agent.id;
              const isRunning = agent.status === "active" || agent.status === "processing";

              return (
                <motion.div key={agent.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.1 }}>
                  <GradientCard gradient={gradient} className="p-5">
                    {/* Başlık */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-background/50">
                          <Brain className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{agent.name}</h3>
                          <p className="text-xs text-muted-foreground">{agent.protocol} Protokolü</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(agent.status)}
                        {getStatusBadge(agent.status)}
                      </div>
                    </div>

                    {/* İlerleme */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">İlerleme</span>
                        <span className="text-sm font-semibold">{agent.progress}%</span>
                      </div>
                      <Progress value={agent.progress} className="h-2" />
                    </div>

                    {/* İstatistikler */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="p-3 rounded-lg bg-background/30">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                          <span className="text-xs text-muted-foreground">Tamamlanan</span>
                        </div>
                        <p className="text-lg font-bold">{agent.tasks}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-background/30">
                        <div className="flex items-center gap-2 mb-1">
                          <Cpu className="w-4 h-4 text-primary" />
                          <span className="text-xs text-muted-foreground">Durum</span>
                        </div>
                        <p className="text-sm font-bold capitalize">{agent.status}</p>
                      </div>
                    </div>

                    {/* Eylemler */}
                    <div className="flex items-center justify-between pt-3 border-t border-border/50">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span>ID: {agent.id.slice(-3)}</span>
                      </div>
                      <div className="flex gap-1">
                        {/* Pause / Resume */}
                        <button
                          onClick={() => handleToggle(agent)}
                          disabled={isToggling}
                          title={isRunning ? "Durdur" : "Başlat"}
                          className="p-1.5 rounded-lg bg-background/50 hover:bg-background transition-colors disabled:opacity-50"
                        >
                          {isToggling ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : isRunning ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </button>

                        {/* Yenile */}
                        <button
                          onClick={() => handleRefresh(agent.id)}
                          disabled={isRefreshing}
                          title="Yenile"
                          className="p-1.5 rounded-lg bg-background/50 hover:bg-background transition-colors disabled:opacity-50"
                        >
                          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                        </button>

                        {/* Chat */}
                        <button
                          onClick={() => navigate("/chat")}
                          title="Chat"
                          className="p-1.5 rounded-lg bg-background/50 hover:bg-background transition-colors"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </GradientCard>
                </motion.div>
              );
            })
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
