import { useState, useEffect, useRef } from "react";
import { Header } from "../components/layout/Header";
import { BottomNav } from "../components/layout/BottomNav";
import { GradientCard } from "../components/ui/GradientCard";
import { motion, AnimatePresence } from "motion/react";
import { Send, Trash2, Brain, Code, Database, Shield, Loader2 } from "lucide-react";
import {
  getAgentStatus,
  getChatHistory,
  sendTaskToAgent,
  clearChatHistory,
  type Agent,
  type ChatMessage,
} from "../lib/api";

const AGENT_ICONS: Record<string, React.ElementType> = {
  "agent-chief-001": Brain,
  "agent-code-002": Code,
  "agent-mem-003": Database,
  "agent-val-004": Shield,
};

const AGENT_COLORS: Record<string, string> = {
  "agent-chief-001": "#00D9FF",
  "agent-code-002": "#8B5CF6",
  "agent-mem-003": "#FBBF24",
  "agent-val-004": "#10B981",
};

const AGENT_GRADIENTS: Record<string, "cyan" | "magenta" | "yellow" | "green"> = {
  "agent-chief-001": "cyan",
  "agent-code-002": "magenta",
  "agent-mem-003": "yellow",
  "agent-val-004": "green",
};

const STATUS_DOT: Record<string, string> = {
  active: "bg-green-400",
  idle: "bg-yellow-400",
  processing: "bg-blue-400 animate-pulse",
  error: "bg-red-400",
};

export default function Chat() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedId, setSelectedId] = useState<string>("agent-chief-001");
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Agent listesini yükle
  useEffect(() => {
    getAgentStatus().then(setAgents).catch(() => {});
    const iv = setInterval(() => getAgentStatus().then(setAgents).catch(() => {}), 10_000);
    return () => clearInterval(iv);
  }, []);

  // Seçilen agentın chat geçmişini yükle
  useEffect(() => {
    setHistory([]);
    setError(null);
    getChatHistory(selectedId).then(setHistory).catch(() => {});
  }, [selectedId]);

  // Yeni mesaj gelince en alta kaydır
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, sending]);

  const selectedAgent = agents.find((a) => a.id === selectedId);
  const Icon = AGENT_ICONS[selectedId] ?? Brain;
  const color = AGENT_COLORS[selectedId] ?? "#00D9FF";
  const gradient = AGENT_GRADIENTS[selectedId] ?? "cyan";

  async function handleSend() {
    const msg = input.trim();
    if (!msg || sending) return;

    // Kullanıcı mesajını anında göster
    const userMsg: ChatMessage = {
      role: "user",
      content: msg,
      timestamp: new Date().toISOString(),
      time: "şimdi",
    };
    setHistory((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);
    setError(null);

    try {
      const result = await sendTaskToAgent(selectedId, msg);
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: result.reply,
        timestamp: new Date().toISOString(),
        time: "şimdi",
      };
      setHistory((prev) => [...prev, assistantMsg]);
      // Güncel geçmişi sunucudan çek
      getChatHistory(selectedId).then(setHistory).catch(() => {});
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Bir hata oluştu");
      // Başarısız kullanıcı mesajını kaldır
      setHistory((prev) => prev.filter((m) => m !== userMsg));
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  async function handleClear() {
    await clearChatHistory(selectedId).catch(() => {});
    setHistory([]);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24 flex flex-col">
      <Header />

      <main className="container mx-auto px-4 py-4 max-w-4xl flex-1 flex flex-col">
        {/* Başlık */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
          <h2 className="text-2xl font-bold mb-1">
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Agent</span> Chat
          </h2>
          <p className="text-muted-foreground text-sm">Yerel Ollama modeli ile agentlarla konuş</p>
        </motion.div>

        {/* Agent Seçici */}
        <div className="flex gap-3 mb-4 overflow-x-auto pb-1">
          {agents.map((agent) => {
            const AgentIcon = AGENT_ICONS[agent.id] ?? Brain;
            const agentColor = AGENT_COLORS[agent.id] ?? "#00D9FF";
            const isSelected = agent.id === selectedId;
            return (
              <motion.button
                key={agent.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedId(agent.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                  isSelected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background/40 text-muted-foreground hover:border-primary/40"
                }`}
              >
                <div className="relative">
                  <AgentIcon className="w-4 h-4" style={{ color: agentColor }} />
                  <span
                    className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${STATUS_DOT[agent.status] ?? "bg-muted"}`}
                  />
                </div>
                <span className="text-sm font-medium whitespace-nowrap">{agent.name}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Chat Alanı */}
        <GradientCard gradient={gradient} className="flex-1 flex flex-col p-0 overflow-hidden" disableAnimation>
          {/* Chat header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ background: `${color}20` }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <div>
                <p className="font-semibold text-sm">{selectedAgent?.name ?? "Agent"}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedAgent?.protocol} Protokolü •{" "}
                  <span
                    className={`${
                      selectedAgent?.status === "active"
                        ? "text-green-400"
                        : selectedAgent?.status === "processing"
                        ? "text-blue-400"
                        : "text-muted-foreground"
                    }`}
                  >
                    {selectedAgent?.status === "active"
                      ? "Aktif"
                      : selectedAgent?.status === "processing"
                      ? "İşliyor..."
                      : selectedAgent?.status === "idle"
                      ? "Beklemede"
                      : "Hata"}
                  </span>
                </p>
              </div>
            </div>
            <button
              onClick={handleClear}
              title="Geçmişi temizle"
              className="p-2 rounded-lg hover:bg-background/50 text-muted-foreground hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Mesajlar */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: "50vh" }}>
            {history.length === 0 && !sending && (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <Icon className="w-10 h-10 mb-3 opacity-30" style={{ color }} />
                <p className="text-sm">Mesaj göndererek {selectedAgent?.name ?? "agent"} ile konuşmaya başla</p>
              </div>
            )}

            <AnimatePresence initial={false}>
              {history.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-background/60 border border-border/50 rounded-tl-sm"
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        msg.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground"
                      }`}
                    >
                      {msg.time ?? ""}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing indicator */}
            {sending && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="bg-background/60 border border-border/50 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </motion.div>
            )}

            {error && (
              <div className="text-sm text-red-400 text-center py-2 bg-red-400/10 rounded-xl border border-red-400/20">
                {error}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input alanı */}
          <div className="p-4 border-t border-border/50">
            <div className="flex gap-3 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`${selectedAgent?.name ?? "Agent"}'a mesaj yaz... (Enter: gönder, Shift+Enter: yeni satır)`}
                rows={2}
                disabled={sending}
                className="flex-1 resize-none rounded-xl bg-background/60 border border-border/50 px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 transition-all"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="flex-shrink-0 p-3 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: `linear-gradient(135deg, ${color}, ${color}99)` }}
              >
                {sending ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <Send className="w-5 h-5 text-white" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Model: <span className="text-primary font-mono">rnj-1:8b</span> • Yerel Ollama
            </p>
          </div>
        </GradientCard>
      </main>

      <BottomNav />
    </div>
  );
}
