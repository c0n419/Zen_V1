import { useState, useEffect } from "react";
import { Header } from "../components/layout/Header";
import { BottomNav } from "../components/layout/BottomNav";
import { MetricCard } from "../components/ui/MetricCard";
import { AgentStatusCard } from "../components/dashboard/AgentStatusCard";
import { PerformanceChart } from "../components/dashboard/PerformanceChart";
import { TaskDistribution } from "../components/dashboard/TaskDistribution";
import { SystemMetrics } from "../components/dashboard/SystemMetrics";
import { RecentActivity } from "../components/dashboard/RecentActivity";
import { QuickActions } from "../components/dashboard/QuickActions";
import { StatusStories } from "../components/dashboard/StatusStories";
import { Brain, Zap, Database, Target } from "lucide-react";
import { motion } from "motion/react";
import { getDashboardMetrics, type DashboardMetrics } from "../lib/api";

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

  useEffect(() => {
    getDashboardMetrics()
      .then(setMetrics)
      .catch(() => {/* metrikleri yükleyemedik, varsayılan göster */});

    const interval = setInterval(() => {
      getDashboardMetrics().then(setMetrics).catch(() => {});
    }, 30_000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Hero Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h2 className="text-2xl font-bold mb-2">
            Hoş Geldin,{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Ninja
            </span>
          </h2>
          <p className="text-muted-foreground">ZEN v3.0 Multi-Agent Framework Dashboard</p>
        </motion.div>

        {/* Status Stories */}
        <div className="mb-6">
          <StatusStories />
        </div>

        {/* Quick Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            title="Aktif Agentlar"
            value={metrics?.activeAgents.value ?? "—"}
            change={metrics?.activeAgents.change}
            icon={Brain}
            gradient="cyan"
          />
          <MetricCard
            title="Tamamlanan"
            value={metrics?.completedTasks.value ?? "—"}
            change={metrics?.completedTasks.change}
            icon={Target}
            gradient="magenta"
            subtitle="Görev"
          />
          <MetricCard
            title="Başarı Oranı"
            value={metrics?.successRate.value ?? "—"}
            change={metrics?.successRate.change}
            icon={Zap}
            gradient="yellow"
          />
          <MetricCard
            title="Hafıza Kuralı"
            value={metrics?.memoryRules.value ?? "—"}
            change={metrics?.memoryRules.change}
            icon={Database}
            gradient="green"
            subtitle="KR-XXX"
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <QuickActions />
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <AgentStatusCard />
          </div>
          <div className="lg:col-span-1">
            <TaskDistribution />
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <PerformanceChart />
          <SystemMetrics />
        </div>

        {/* Recent Activity */}
        <div className="grid lg:grid-cols-1 gap-6">
          <RecentActivity />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
