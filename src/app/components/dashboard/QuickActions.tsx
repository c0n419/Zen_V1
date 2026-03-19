import { useState } from "react";
import { GradientCard } from "../ui/GradientCard";
import { Play, RefreshCw, TrendingUp, MessageSquare, Zap, Database, X, Send } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { sendTaskToAgent, getAgentStatus } from "../../lib/api";
import { useNavigate } from "react-router";

export function QuickActions() {
  const navigate = useNavigate();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [taskModal, setTaskModal] = useState(false);
  const [taskInput, setTaskInput] = useState("");
  const [taskResult, setTaskResult] = useState<string | null>(null);
  const [autonomousMode, setAutonomousMode] = useState(false);

  async function handleNewTask() {
    setTaskModal(true);
    setTaskResult(null);
  }

  async function submitTask() {
    if (!taskInput.trim()) return;
    setLoadingAction("Yeni Görev");
    try {
      const agents = await getAgentStatus();
      const chief = agents.find((a) => a.name === "Chief Agent") ?? agents[0];
      if (chief) {
        const result = await sendTaskToAgent(chief.id, taskInput.trim());
        setTaskResult(result.reply);
        setTaskInput("");
      }
    } catch {
      setTaskResult("Hata: Görev gönderilemedi.");
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleSync() {
    setLoadingAction("Senkronize");
    try {
      await getAgentStatus();
      await new Promise((r) => setTimeout(r, 800));
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleAutonomous() {
    const newMode = !autonomousMode;
    setAutonomousMode(newMode);
    setLoadingAction("Otonom Mod");
    try {
      const agents = await getAgentStatus();
      const chief = agents.find((a) => a.name === "Chief Agent") ?? agents[0];
      if (chief) {
        await sendTaskToAgent(
          chief.id,
          newMode
            ? "Otonom modu aktif et. Sistemi izle ve gerekli görevleri otomatik başlat."
            : "Otonom modu kapat. Manuel mod'a geç."
        );
      }
    } catch {}
    finally { setLoadingAction(null); }
  }

  const actions = [
    {
      icon: Play,
      label: "Yeni Görev",
      color: "#00D9FF",
      onClick: handleNewTask,
    },
    {
      icon: RefreshCw,
      label: "Senkronize",
      color: "#8B5CF6",
      onClick: handleSync,
    },
    {
      icon: TrendingUp,
      label: "Raporlar",
      color: "#FBBF24",
      onClick: () => navigate("/analytics"),
    },
    {
      icon: MessageSquare,
      label: "Chat",
      color: "#10B981",
      onClick: () => navigate("/chat"),
    },
    {
      icon: Zap,
      label: autonomousMode ? "Otonom: Açık" : "Otonom Mod",
      color: autonomousMode ? "#10B981" : "#00D9FF",
      onClick: handleAutonomous,
    },
    {
      icon: Database,
      label: "Aktiviteler",
      color: "#FF00E5",
      onClick: () => navigate("/activity"),
    },
  ];

  return (
    <>
      <GradientCard gradient="none" className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold">Hızlı Aksiyonlar</h3>
          <p className="text-sm text-muted-foreground">Sık kullanılan işlemler</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {actions.map((action) => {
            const Icon = action.icon;
            const isLoading = loadingAction === action.label;

            return (
              <motion.button
                key={action.label}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={isLoading}
                onClick={action.onClick}
                className="relative group p-4 rounded-xl border border-border hover:border-primary/50 bg-background/40 backdrop-blur-sm transition-all overflow-hidden disabled:opacity-60 disabled:cursor-wait"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex flex-col items-center gap-2">
                  <div
                    className="p-3 rounded-xl group-hover:scale-110 transition-transform"
                    style={{
                      background: `linear-gradient(135deg, ${action.color}20, ${action.color}10)`,
                      boxShadow: `0 0 20px ${action.color}20`,
                    }}
                  >
                    <Icon
                      className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`}
                      style={{ color: action.color }}
                    />
                  </div>
                  <span className="text-xs text-center text-foreground group-hover:text-primary transition-colors leading-tight">
                    {isLoading ? "..." : action.label}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </GradientCard>

      {/* Görev Modal */}
      <AnimatePresence>
        {taskModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setTaskModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg"
            >
              <GradientCard gradient="cyan" className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Chief Agent'a Görev Gönder</h3>
                  <button
                    onClick={() => { setTaskModal(false); setTaskResult(null); setTaskInput(""); }}
                    className="p-1.5 rounded-lg hover:bg-background/50 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <textarea
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                  placeholder="Görevi tanımla... (örn: Sistemi analiz et ve özet rapor oluştur)"
                  rows={4}
                  className="w-full resize-none rounded-xl bg-background/60 border border-border/50 px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 mb-4"
                />

                {taskResult && (
                  <div className="mb-4 p-4 rounded-xl bg-background/50 border border-border/30">
                    <p className="text-xs text-muted-foreground mb-1">Chief Agent yanıtı:</p>
                    <p className="text-sm whitespace-pre-wrap">{taskResult}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={submitTask}
                    disabled={!taskInput.trim() || loadingAction === "Yeni Görev"}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    {loadingAction === "Yeni Görev" ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {loadingAction === "Yeni Görev" ? "Gönderiliyor..." : "Gönder"}
                  </button>
                  <button
                    onClick={() => navigate("/chat")}
                    className="px-4 py-3 rounded-xl border border-border hover:bg-muted/50 transition-colors text-sm"
                  >
                    Chat'e Git
                  </button>
                </div>
              </GradientCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
