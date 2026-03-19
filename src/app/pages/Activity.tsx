import { useState, useEffect } from "react";
import { Header } from "../components/layout/Header";
import { BottomNav } from "../components/layout/BottomNav";
import { motion } from "motion/react";
import {
  Activity as ActivityIcon,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Zap,
  Brain,
  Filter,
  Search,
} from "lucide-react";
import { GradientCard } from "../components/ui/GradientCard";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { ScrollArea } from "../components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  getRecentActivities,
  getAgentStatus,
  type Activity as ActivityItem,
  type Agent,
} from "../lib/api";

const getActivityIcon = (type: string) => {
  switch (type) {
    case "success": return <CheckCircle2 className="w-5 h-5 text-green-400" />;
    case "error":   return <XCircle className="w-5 h-5 text-red-400" />;
    case "warning": return <AlertCircle className="w-5 h-5 text-yellow-400" />;
    default:        return <ActivityIcon className="w-5 h-5 text-primary" />;
  }
};

const getActivityBadge = (type: string) => {
  switch (type) {
    case "success": return <Badge className="bg-green-500/10 text-green-400 border-green-500/20">Başarılı</Badge>;
    case "error":   return <Badge className="bg-red-500/10 text-red-400 border-red-500/20">Hata</Badge>;
    case "warning": return <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">Uyarı</Badge>;
    default:        return <Badge className="bg-primary/10 text-primary border-primary/20">Bilgi</Badge>;
  }
};

function ActivityCard({ item }: { item: ActivityItem }) {
  return (
    <GradientCard className="p-4 hover:scale-[1.01] transition-transform cursor-pointer">
      <div className="flex items-start gap-4">
        <div className="p-2 rounded-lg bg-background/50">{getActivityIcon(item.type)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-sm truncate">{item.agent}</p>
            {getActivityBadge(item.type)}
          </div>
          <p className="text-foreground text-sm mb-1">{item.title}</p>
          {item.description && (
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{item.description}</p>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{item.time}</span>
          </div>
        </div>
      </div>
    </GradientCard>
  );
}

function SkeletonCard() {
  return (
    <div className="p-4 rounded-2xl border border-border/30 animate-pulse">
      <div className="flex gap-4">
        <div className="w-9 h-9 rounded-lg bg-muted/40" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-40 rounded bg-muted/40" />
          <div className="h-3 w-56 rounded bg-muted/30" />
          <div className="h-2 w-20 rounded bg-muted/20" />
        </div>
      </div>
    </div>
  );
}

export default function Activity() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getRecentActivities(50), getAgentStatus()])
      .then(([acts, agts]) => { setActivities(acts); setAgents(agts); })
      .catch(() => {})
      .finally(() => setLoading(false));

    const iv = setInterval(() => {
      getRecentActivities(50).then(setActivities).catch(() => {});
      getAgentStatus().then(setAgents).catch(() => {});
    }, 10_000);
    return () => clearInterval(iv);
  }, []);

  const filtered = activities.filter(
    (a) =>
      !search ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.agent.toLowerCase().includes(search.toLowerCase()) ||
      a.description.toLowerCase().includes(search.toLowerCase())
  );

  const successList = filtered.filter((a) => a.type === "success");
  const errorList = filtered.filter((a) => a.type === "error" || a.type === "warning");

  const stats = [
    { label: "Toplam", value: activities.length, icon: Clock, gradient: "cyan" as const },
    { label: "Başarılı", value: activities.filter((a) => a.type === "success").length, icon: CheckCircle2, gradient: "green" as const },
    { label: "Hata", value: activities.filter((a) => a.type === "error" || a.type === "warning").length, icon: XCircle, gradient: "magenta" as const },
    { label: "Aktif Agent", value: agents.filter((a) => a.status === "active").length, icon: Zap, gradient: "yellow" as const },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h2 className="text-2xl font-bold mb-2">
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Aktivite</span> Akışı
          </h2>
          <p className="text-muted-foreground">Gerçek zamanlı sistem aktiviteleri ve agent logları</p>
        </motion.div>

        {/* İstatistikler */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, i) => (
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

        {/* Arama */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-6">
          <GradientCard className="p-4">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Aktivite, agent veya açıklama ara..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-background/50 border-border/50"
                />
              </div>
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="px-4 py-2 rounded-lg bg-muted/30 border border-border/50 text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 text-sm"
                >
                  <Filter className="w-4 h-4" />
                  Temizle
                </button>
              )}
            </div>
          </GradientCard>
        </motion.div>

        {/* Sekmeler */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="w-full justify-start mb-6 bg-card/50 p-1">
              <TabsTrigger value="all" className="flex-1 sm:flex-none">Tümü ({filtered.length})</TabsTrigger>
              <TabsTrigger value="success" className="flex-1 sm:flex-none">Başarılı ({successList.length})</TabsTrigger>
              <TabsTrigger value="error" className="flex-1 sm:flex-none">Hatalar ({errorList.length})</TabsTrigger>
              <TabsTrigger value="agents" className="flex-1 sm:flex-none">Agentlar</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-0">
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-3">
                  {loading ? (
                    [1, 2, 3].map((n) => <SkeletonCard key={n} />)
                  ) : filtered.length === 0 ? (
                    <p className="text-center text-muted-foreground py-12">
                      {search ? "Arama sonucu bulunamadı" : "Henüz aktivite yok"}
                    </p>
                  ) : (
                    filtered.map((item, i) => (
                      <motion.div key={item.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                        <ActivityCard item={item} />
                      </motion.div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="success">
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-3">
                  {successList.length === 0 ? (
                    <p className="text-center text-muted-foreground py-12">Başarılı aktivite yok</p>
                  ) : (
                    successList.map((item, i) => (
                      <motion.div key={item.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                        <GradientCard gradient="green" className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="p-2 rounded-lg bg-background/50">{getActivityIcon(item.type)}</div>
                            <div className="flex-1">
                              <p className="font-semibold text-sm mb-1">{item.agent}</p>
                              <p className="text-sm mb-1">{item.title}</p>
                              {item.description && <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>}
                              <p className="text-xs text-muted-foreground mt-1">{item.time}</p>
                            </div>
                          </div>
                        </GradientCard>
                      </motion.div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="error">
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-3">
                  {errorList.length === 0 ? (
                    <p className="text-center text-muted-foreground py-12">Hata kaydı yok</p>
                  ) : (
                    errorList.map((item, i) => (
                      <motion.div key={item.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                        <GradientCard gradient="magenta" className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="p-2 rounded-lg bg-background/50">{getActivityIcon(item.type)}</div>
                            <div className="flex-1">
                              <p className="font-semibold text-sm mb-1">{item.agent}</p>
                              <p className="text-sm mb-1">{item.title}</p>
                              {item.description && <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>}
                              <p className="text-xs text-muted-foreground mt-1">{item.time}</p>
                            </div>
                          </div>
                        </GradientCard>
                      </motion.div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="agents">
              <div className="grid gap-4">
                {loading ? (
                  [1, 2, 3, 4].map((n) => <SkeletonCard key={n} />)
                ) : (
                  agents.map((agent, i) => {
                    const agentActs = activities.filter((a) => a.agent === agent.name);
                    const agentSuccess = agentActs.filter((a) => a.type === "success").length;
                    const agentErrors = agentActs.filter((a) => a.type === "error").length;
                    const successRate = agentActs.length > 0 ? Math.round((agentSuccess / agentActs.length) * 100) : 0;
                    const gradients: Array<"cyan" | "magenta" | "yellow" | "green"> = ["cyan", "magenta", "yellow", "green"];

                    return (
                      <motion.div key={agent.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                        <GradientCard gradient={gradients[i % 4]} className="p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-background/50">
                                <Brain className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-semibold">{agent.name}</p>
                                <p className="text-sm text-muted-foreground">{agent.protocol} Protokolü</p>
                              </div>
                            </div>
                            <Badge className={
                              agent.status === "active" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                              agent.status === "idle" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" :
                              "bg-red-500/10 text-red-400 border-red-500/20"
                            }>
                              {agent.status === "active" ? "Aktif" : agent.status === "idle" ? "Beklemede" : "Hata"}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <p className="text-2xl font-bold">{agentActs.length}</p>
                              <p className="text-xs text-muted-foreground">Aktivite</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold">{successRate}%</p>
                              <p className="text-xs text-muted-foreground">Başarı</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold">{agentErrors}</p>
                              <p className="text-xs text-muted-foreground">Hata</p>
                            </div>
                          </div>
                        </GradientCard>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
      <BottomNav />
    </div>
  );
}
