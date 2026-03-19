import { useState, useEffect } from "react";
import { GradientCard } from "../ui/GradientCard";
import { Cpu, HardDrive, Zap, Server } from "lucide-react";
import { motion } from "motion/react";
import { getSystemMetrics, type SystemMetrics as SystemMetricsData } from "../../lib/api";

type MetricRow = {
  label: string;
  value: string;
  percentage: number;
  color: string;
  icon: React.ElementType;
};

function buildRows(data: SystemMetricsData): MetricRow[] {
  const rows: MetricRow[] = [];

  data.gpu.forEach((g) =>
    rows.push({ label: g.label, value: g.value, percentage: g.percentage, color: "#00D9FF", icon: Cpu })
  );

  rows.push({ label: "RAM Kullanımı", value: data.ram.value, percentage: data.ram.percentage, color: "#FBBF24", icon: Server });
  rows.push({ label: "Disk I/O", value: data.disk.value, percentage: data.disk.percentage, color: "#10B981", icon: HardDrive });

  return rows;
}

function SkeletonBar() {
  return (
    <div className="space-y-2 animate-pulse">
      <div className="flex justify-between">
        <div className="h-3 w-28 rounded bg-muted/40" />
        <div className="h-3 w-12 rounded bg-muted/40" />
      </div>
      <div className="h-2 w-full rounded-full bg-muted/30" />
    </div>
  );
}

export function SystemMetrics() {
  const [metrics, setMetrics] = useState<MetricRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetch() {
      try {
        setLoading(true);
        setError(null);
        const data = await getSystemMetrics();
        if (!cancelled) setMetrics(buildRows(data));
      } catch {
        if (!cancelled) setError("Sistem metrikleri alınamadı");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetch();
    const interval = setInterval(fetch, 5_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <GradientCard gradient="green" className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Sistem Metrikleri</h3>
          <p className="text-sm text-muted-foreground">Donanım durumu</p>
        </div>
        <Zap className="w-5 h-5 text-primary" />
      </div>

      <div className="space-y-4">
        {loading && (
          <>
            <SkeletonBar />
            <SkeletonBar />
            <SkeletonBar />
            <SkeletonBar />
          </>
        )}

        {error && !loading && (
          <div className="text-sm text-red-400 text-center py-4">{error}</div>
        )}

        {!loading && !error && metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" style={{ color: metric.color }} />
                  <span className="text-sm text-foreground">{metric.label}</span>
                </div>
                <span className="text-sm font-medium">{metric.value}</span>
              </div>

              <div className="relative h-2 bg-background/60 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${metric.percentage}%` }}
                  transition={{ duration: 1, delay: index * 0.1 }}
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${metric.color}80, ${metric.color})`,
                    boxShadow: `0 0 10px ${metric.color}40`,
                  }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </GradientCard>
  );
}
