import { useState, useEffect } from "react";
import { GradientCard } from "../ui/GradientCard";
import { AnimatedLineChart } from "../charts/AnimatedLineChart";
import { TrendingUp } from "lucide-react";
import { getPerformanceData, type ChartData } from "../../lib/api";

export function PerformanceChart() {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getPerformanceData()
      .then((d) => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

  const lastValue = data[data.length - 1]?.value ?? 0;
  const firstValue = data[0]?.value ?? lastValue;
  const trend = lastValue - firstValue;

  return (
    <GradientCard gradient="magenta" className="p-6" disableAnimation>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Performans</h3>
          <p className="text-sm text-muted-foreground">Son 7 günlük aktivite</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-green-400/20">
          <TrendingUp className="w-4 h-4 text-green-400" />
          <span className="text-sm text-green-400">
            {trend >= 0 ? "+" : ""}{trend.toFixed(0)}%
          </span>
        </div>
      </div>

      <div className="w-full" style={{ height: "300px" }}>
        {loading ? (
          <div className="h-full w-full animate-pulse rounded-xl bg-muted/20" />
        ) : (
          <AnimatedLineChart data={data} color="#FF00E5" filled />
        )}
      </div>
    </GradientCard>
  );
}
