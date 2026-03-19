import { Header } from "../components/layout/Header";
import { BottomNav } from "../components/layout/BottomNav";
import { motion } from "motion/react";
import { 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  Activity,
  Target,
  Zap,
  Clock,
  Calendar,
  Download,
  Filter
} from "lucide-react";
import { GradientCard } from "../components/ui/GradientCard";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { GradientBarChart } from "../components/charts/GradientBarChart";
import { AnimatedLineChart } from "../components/charts/AnimatedLineChart";
import { DonutChart } from "../components/charts/DonutChart";

const weeklyPerformanceData = [
  { name: "Pzt", value: 85 },
  { name: "Sal", value: 92 },
  { name: "Çar", value: 78 },
  { name: "Per", value: 88 },
  { name: "Cum", value: 95 },
  { name: "Cmt", value: 82 },
  { name: "Paz", value: 79 },
];

const monthlyTasksData = [
  { name: "Oca", value: 420 },
  { name: "Şub", value: 380 },
  { name: "Mar", value: 510 },
  { name: "Nis", value: 490 },
  { name: "May", value: 670 },
  { name: "Haz", value: 580 },
];

const agentDistributionData = [
  { name: "Researcher", value: 156, color: "#00D9FF" },
  { name: "Analyzer", value: 89, color: "#8B5CF6" },
  { name: "Task Manager", value: 234, color: "#FBBF24" },
  { name: "Memory", value: 445, color: "#10B981" },
  { name: "API", value: 67, color: "#F59E0B" },
];

const hourlyActivityData = [
  { time: "00:00", value: 12 },
  { time: "03:00", value: 8 },
  { time: "06:00", value: 15 },
  { time: "09:00", value: 45 },
  { time: "12:00", value: 68 },
  { time: "15:00", value: 72 },
  { time: "18:00", value: 54 },
  { time: "21:00", value: 32 },
];

const successRateData = [
  { time: "Week 1", value: 92 },
  { time: "Week 2", value: 88 },
  { time: "Week 3", value: 95 },
  { time: "Week 4", value: 91 },
];

const kpiData = [
  {
    title: "Toplam Görev",
    value: "1,247",
    change: 12.5,
    isPositive: true,
    icon: Target,
    gradient: "cyan" as const
  },
  {
    title: "Başarı Oranı",
    value: "94.2%",
    change: 3.8,
    isPositive: true,
    icon: TrendingUp,
    gradient: "green" as const
  },
  {
    title: "Ortalama Süre",
    value: "2.4 sn",
    change: -15.3,
    isPositive: true,
    icon: Clock,
    gradient: "yellow" as const
  },
  {
    title: "Aktif Agent",
    value: "4/6",
    change: -16.7,
    isPositive: false,
    icon: Activity,
    gradient: "magenta" as const
  },
];

const insights = [
  {
    title: "Peak Performance",
    description: "En yüksek performans 15:00-18:00 arasında görüldü",
    trend: "positive",
    value: "+28%"
  },
  {
    title: "Task Completion",
    description: "Bu hafta %12.5 daha fazla görev tamamlandı",
    trend: "positive",
    value: "+12.5%"
  },
  {
    title: "Response Time",
    description: "Ortalama yanıt süresi %15.3 azaldı",
    trend: "positive",
    value: "-15.3%"
  },
  {
    title: "Error Rate",
    description: "Hata oranı geçen haftaya göre %42 azaldı",
    trend: "positive",
    value: "-42%"
  },
];

export default function Analytics() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />
      
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Analiz</span> ve Raporlar
              </h2>
              <p className="text-muted-foreground">Detaylı performans metrikleri ve trendler</p>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-2 rounded-lg bg-card border border-border hover:bg-card/80 transition-colors flex items-center gap-2">
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">Filtrele</span>
              </button>
              <button className="px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors flex items-center gap-2">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">Rapor İndir</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Time Range Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <GradientCard className="p-4">
            <div className="flex items-center gap-3 overflow-x-auto">
              <Calendar className="w-5 h-5 text-primary" />
              <div className="flex gap-2">
                <Badge className="bg-primary/20 text-primary border-primary/30 cursor-pointer">Bugün</Badge>
                <Badge className="bg-card/50 hover:bg-card border-border cursor-pointer">Bu Hafta</Badge>
                <Badge className="bg-card/50 hover:bg-card border-border cursor-pointer">Bu Ay</Badge>
                <Badge className="bg-card/50 hover:bg-card border-border cursor-pointer">Son 3 Ay</Badge>
              </div>
            </div>
          </GradientCard>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {kpiData.map((kpi, index) => (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <GradientCard gradient={kpi.gradient} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-background/50">
                    <kpi.icon className="w-5 h-5" />
                  </div>
                  <div className={`flex items-center gap-1 text-xs ${kpi.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {kpi.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span>{Math.abs(kpi.change)}%</span>
                  </div>
                </div>
                <p className="text-2xl font-bold mb-1">{kpi.value}</p>
                <p className="text-sm text-muted-foreground">{kpi.title}</p>
              </GradientCard>
            </motion.div>
          ))}
        </div>

        {/* Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-6"
        >
          <h3 className="text-lg font-semibold mb-3">📊 Önemli İçgörüler</h3>
          <div className="grid lg:grid-cols-2 gap-3">
            {insights.map((insight, index) => (
              <GradientCard key={index} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{insight.title}</h4>
                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                  </div>
                  <Badge className="bg-green-500/10 text-green-400 border-green-500/20 ml-3">
                    {insight.value}
                  </Badge>
                </div>
              </GradientCard>
            ))}
          </div>
        </motion.div>

        {/* Analytics Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Tabs defaultValue="performance" className="w-full">
            <TabsList className="w-full justify-start mb-6 bg-card/50 p-1">
              <TabsTrigger value="performance" className="flex-1 sm:flex-none">Performans</TabsTrigger>
              <TabsTrigger value="tasks" className="flex-1 sm:flex-none">Görevler</TabsTrigger>
              <TabsTrigger value="agents" className="flex-1 sm:flex-none">Agentlar</TabsTrigger>
              <TabsTrigger value="activity" className="flex-1 sm:flex-none">Aktivite</TabsTrigger>
            </TabsList>

            <TabsContent value="performance" className="mt-0">
              <div className="grid lg:grid-cols-2 gap-6">
                <GradientCard className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Haftalık Performans</h3>
                    <BarChart3 className="w-5 h-5 text-primary" />
                  </div>
                  <div style={{ height: '300px' }}>
                    <GradientBarChart data={weeklyPerformanceData} />
                  </div>
                  <div className="mt-4 p-3 rounded-lg bg-background/30">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Ortalama</span>
                      <span className="font-semibold">87.3%</span>
                    </div>
                  </div>
                </GradientCard>

                <GradientCard className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Başarı Oranı Trendi</h3>
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  </div>
                  <div style={{ height: '300px' }}>
                    <AnimatedLineChart data={successRateData} />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-background/30">
                      <p className="text-xs text-muted-foreground mb-1">En Yüksek</p>
                      <p className="text-xl font-bold">95%</p>
                    </div>
                    <div className="p-3 rounded-lg bg-background/30">
                      <p className="text-xs text-muted-foreground mb-1">En Düşük</p>
                      <p className="text-xl font-bold">88%</p>
                    </div>
                  </div>
                </GradientCard>
              </div>
            </TabsContent>

            <TabsContent value="tasks" className="mt-0">
              <div className="grid lg:grid-cols-2 gap-6">
                <GradientCard className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Aylık Görev Trendi</h3>
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <div style={{ height: '300px' }}>
                    <GradientBarChart data={monthlyTasksData} />
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-background/30 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Toplam</p>
                      <p className="text-lg font-bold">3,050</p>
                    </div>
                    <div className="p-3 rounded-lg bg-background/30 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Ortalama</p>
                      <p className="text-lg font-bold">508</p>
                    </div>
                    <div className="p-3 rounded-lg bg-background/30 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Büyüme</p>
                      <p className="text-lg font-bold text-green-400">+37%</p>
                    </div>
                  </div>
                </GradientCard>

                <GradientCard className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Görev Kategorileri</h3>
                    <BarChart3 className="w-5 h-5 text-primary" />
                  </div>
                  <div style={{ height: '300px' }}>
                    <DonutChart data={agentDistributionData} />
                  </div>
                  <div className="mt-4 space-y-2">
                    {agentDistributionData.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-background/30">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-sm">{item.name}</span>
                        </div>
                        <span className="text-sm font-semibold">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </GradientCard>
              </div>
            </TabsContent>

            <TabsContent value="agents" className="mt-0">
              <div className="grid lg:grid-cols-2 gap-6">
                <GradientCard className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Agent Performans Dağılımı</h3>
                    <Activity className="w-5 h-5 text-primary" />
                  </div>
                  <div style={{ height: '300px' }}>
                    <DonutChart data={agentDistributionData} />
                  </div>
                </GradientCard>

                <GradientCard className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Agent Karşılaştırma</h3>
                  <div className="space-y-4">
                    {agentDistributionData.map((agent, index) => (
                      <div key={index} className="p-4 rounded-lg bg-background/30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">{agent.name}</span>
                          <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                            {Math.floor(85 + Math.random() * 15)}%
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <div className="flex-1">
                            <div className="flex justify-between mb-1">
                              <span className="text-muted-foreground">Görevler</span>
                              <span className="font-semibold">{agent.value}</span>
                            </div>
                            <div className="h-2 bg-background/50 rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full" 
                                style={{ 
                                  width: `${(agent.value / Math.max(...agentDistributionData.map(a => a.value))) * 100}%`,
                                  backgroundColor: agent.color 
                                }} 
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </GradientCard>
              </div>
            </TabsContent>

            <TabsContent value="activity" className="mt-0">
              <div className="grid lg:grid-cols-2 gap-6">
                <GradientCard className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Saatlik Aktivite</h3>
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div style={{ height: '300px' }}>
                    <AnimatedLineChart data={hourlyActivityData} />
                  </div>
                  <div className="mt-4 p-3 rounded-lg bg-background/30">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Peak Saat</p>
                        <p className="text-lg font-bold">15:00</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Ortalama</p>
                        <p className="text-lg font-bold">38/saat</p>
                      </div>
                    </div>
                  </div>
                </GradientCard>

                <GradientCard className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Aktivite Özeti</h3>
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Toplam İşlem</p>
                          <p className="text-2xl font-bold">12,847</p>
                        </div>
                        <Zap className="w-8 h-8 text-cyan-400" />
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Başarılı</p>
                          <p className="text-2xl font-bold">12,107</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-green-400" />
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Ortalama Süre</p>
                          <p className="text-2xl font-bold">2.4s</p>
                        </div>
                        <Clock className="w-8 h-8 text-yellow-400" />
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-red-500/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Hata Oranı</p>
                          <p className="text-2xl font-bold">5.8%</p>
                        </div>
                        <TrendingDown className="w-8 h-8 text-red-400" />
                      </div>
                    </div>
                  </div>
                </GradientCard>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
}
