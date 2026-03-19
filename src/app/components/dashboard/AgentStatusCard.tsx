import { useState, useEffect } from "react";
import { GradientCard } from "../ui/GradientCard";
import { Activity, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { motion } from "motion/react";
import { getAgentStatus, type Agent } from "../../lib/api";

const statusConfig = {
  active: { color: "text-green-400", bg: "bg-green-400/20", icon: CheckCircle2, label: "Aktif" },
  idle: { color: "text-muted-foreground", bg: "bg-muted/20", icon: Activity, label: "Beklemede" },
  error: { color: "text-red-400", bg: "bg-red-400/20", icon: AlertCircle, label: "Hata" },
  processing: { color: "text-yellow-400", bg: "bg-yellow-400/20", icon: Clock, label: "İşleniyor" },
};

function SkeletonRow() {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-background/40 border border-border/50 animate-pulse">
      <div className="flex items-center gap-3 flex-1">
        <div className="w-8 h-8 rounded-lg bg-muted/40" />
        <div className="space-y-1 flex-1">
          <div className="h-3 w-28 rounded bg-muted/40" />
          <div className="h-2 w-20 rounded bg-muted/30" />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="h-3 w-8 rounded bg-muted/40" />
        <div className="h-5 w-16 rounded-md bg-muted/40" />
      </div>
    </div>
  );
}

export function AgentStatusCard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchAgents() {
      try {
        setLoading(true);
        setError(null);
        const data = await getAgentStatus();
        if (!cancelled) setAgents(data);
      } catch (err) {
        if (!cancelled) setError("Agent verileri alınamadı");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAgents();
    const interval = setInterval(fetchAgents, 10_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <GradientCard gradient="cyan" className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Agent Durumu</h3>
          <p className="text-sm text-muted-foreground">Multi-Agent Framework</p>
        </div>
        <Activity className="w-5 h-5 text-primary" />
      </div>

      <div className="space-y-3">
        {loading && (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        )}

        {error && !loading && (
          <div className="text-sm text-red-400 text-center py-4">{error}</div>
        )}

        {!loading && !error && agents.map((agent, index) => {
          const config = statusConfig[agent.status] ?? statusConfig.idle;
          const Icon = config.icon;

          return (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 rounded-xl bg-background/40 backdrop-blur-sm border border-border/50 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className={`p-2 rounded-lg ${config.bg}`}>
                  <Icon className={`w-4 h-4 ${config.color}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{agent.name}</p>
                  <p className="text-xs text-muted-foreground">{agent.protocol} Protokolü</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Görev</p>
                  <p className="text-sm font-medium">{agent.tasks}</p>
                </div>
                <div className={`px-2 py-1 rounded-md ${config.bg}`}>
                  <span className={`text-xs ${config.color}`}>{config.label}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </GradientCard>
  );
}
