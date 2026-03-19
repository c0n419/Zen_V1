import { useState, useEffect } from "react";
import { GradientCard } from "../ui/GradientCard";
import { Clock, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { motion } from "motion/react";
import { getRecentActivities, type Activity } from "../../lib/api";

const typeConfig = {
  success: { color: "text-green-400", bg: "bg-green-400/10", icon: CheckCircle2, border: "border-green-400/30" },
  error: { color: "text-red-400", bg: "bg-red-400/10", icon: AlertCircle, border: "border-red-400/30" },
  info: { color: "text-primary", bg: "bg-primary/10", icon: Info, border: "border-primary/30" },
  warning: { color: "text-yellow-400", bg: "bg-yellow-400/10", icon: AlertCircle, border: "border-yellow-400/30" },
};

function SkeletonActivity() {
  return (
    <div className="p-4 rounded-xl border border-border/30 animate-pulse">
      <div className="flex gap-3">
        <div className="w-5 h-5 rounded-full bg-muted/40 mt-0.5" />
        <div className="flex-1 space-y-2">
          <div className="flex justify-between">
            <div className="h-3 w-36 rounded bg-muted/40" />
            <div className="h-3 w-16 rounded bg-muted/30" />
          </div>
          <div className="h-2 w-48 rounded bg-muted/30" />
          <div className="h-2 w-20 rounded bg-muted/20" />
        </div>
      </div>
    </div>
  );
}

export function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetch() {
      try {
        setLoading(true);
        setError(null);
        const data = await getRecentActivities(10);
        if (!cancelled) setActivities(data);
      } catch {
        if (!cancelled) setError("Aktiviteler alınamadı");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetch();
    const interval = setInterval(fetch, 15_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <GradientCard gradient="none" className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Son Aktiviteler</h3>
          <p className="text-sm text-muted-foreground">Sistem log kayıtları</p>
        </div>
        <Clock className="w-5 h-5 text-muted-foreground" />
      </div>

      <div className="space-y-3">
        {loading && (
          <>
            <SkeletonActivity />
            <SkeletonActivity />
            <SkeletonActivity />
          </>
        )}

        {error && !loading && (
          <div className="text-sm text-red-400 text-center py-4">{error}</div>
        )}

        {!loading && !error && activities.map((activity, index) => {
          const config = typeConfig[activity.type] ?? typeConfig.info;
          const Icon = config.icon;

          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-xl border ${config.border} ${config.bg} backdrop-blur-sm hover:scale-[1.02] transition-transform`}
            >
              <div className="flex gap-3">
                <div className="mt-0.5">
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="text-sm font-medium text-foreground">{activity.title}</h4>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{activity.description}</p>
                  <span className="text-xs text-primary">{activity.agent}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <button className="w-full mt-4 py-2 rounded-xl border border-border hover:bg-muted/50 transition-colors text-sm text-muted-foreground">
        Tüm Logları Görüntüle
      </button>
    </GradientCard>
  );
}
