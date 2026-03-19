import { useState, useEffect } from "react";
import { GradientCard } from "../ui/GradientCard";
import { DonutChart } from "../charts/DonutChart";
import { motion } from "motion/react";
import { getTaskDistribution, type TaskDistributionData } from "../../lib/api";

export function TaskDistribution() {
  const [taskData, setTaskData] = useState<TaskDistributionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getTaskDistribution()
      .then((d) => { if (!cancelled) { setTaskData(d); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

  const total = taskData.reduce((sum, item) => sum + item.value, 0);

  return (
    <GradientCard gradient="yellow" className="p-6" disableAnimation>
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Görev Dağılımı</h3>
        <p className="text-sm text-muted-foreground">Agent bazlı işlem yükü</p>
      </div>

      <div className="w-full mb-6" style={{ height: "280px" }}>
        {loading ? (
          <div className="h-full w-full animate-pulse rounded-full bg-muted/20 mx-auto" style={{ maxWidth: 280 }} />
        ) : (
          <DonutChart data={taskData} centerLabel="Toplam" centerValue={String(total)} />
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {taskData.map((item, index) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-2"
          >
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">{item.name}</p>
              <p className="text-sm font-medium">{item.value}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </GradientCard>
  );
}
