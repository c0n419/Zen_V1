import { useState } from "react";
import { Bell, Search, Menu, X, Home, Activity, MessageSquare, Brain, Settings, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";

const navItems = [
  { icon: Home, label: "Ana Sayfa", path: "/" },
  { icon: Activity, label: "Aktivite", path: "/activity" },
  { icon: MessageSquare, label: "Chat", path: "/chat" },
  { icon: Brain, label: "Agentlar", path: "/agents" },
  { icon: TrendingUp, label: "Analiz", path: "/analytics" },
  { icon: Settings, label: "Ayarlar", path: "/settings" },
];

export function Header() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    // Aktivite sayfasına query parametresiyle git
    navigate(`/activity?q=${encodeURIComponent(searchQuery.trim())}`);
    setSearchOpen(false);
    setSearchQuery("");
  }

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-xl"
      >
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setMenuOpen(!menuOpen); setNotifOpen(false); setSearchOpen(false); }}
              className="p-2 rounded-xl hover:bg-muted/50 transition-colors"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <button onClick={() => navigate("/")} className="text-left">
              <h1 className="text-lg font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                ZEN v3.0
              </h1>
              <p className="text-xs text-muted-foreground">Smith Protokolü</p>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {searchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Aktivite ara..."
                  className="w-48 rounded-xl bg-muted/50 border border-border/50 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button type="button" onClick={() => setSearchOpen(false)} className="p-1.5 hover:text-muted-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <button
                onClick={() => { setSearchOpen(true); setMenuOpen(false); setNotifOpen(false); }}
                className="p-2 rounded-xl hover:bg-muted/50 transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={() => { setNotifOpen(!notifOpen); setMenuOpen(false); }}
              className="relative p-2 rounded-xl hover:bg-muted/50 transition-colors"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Yan Menü */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed top-0 left-0 bottom-0 z-40 w-72 bg-card border-r border-border flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div>
                  <h2 className="font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">ZEN v3.0</h2>
                  <p className="text-xs text-muted-foreground">Multi-Agent Framework</p>
                </div>
                <button onClick={() => setMenuOpen(false)} className="p-2 rounded-xl hover:bg-muted/50 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => { navigate(item.path); setMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted/50 transition-colors text-left group"
                    >
                      <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="text-sm font-medium group-hover:text-primary transition-colors">{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-border">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">N</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Ninja</p>
                    <p className="text-xs text-muted-foreground">Admin</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bildirimler */}
      <AnimatePresence>
        {notifOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setNotifOpen(false)}
              className="fixed inset-0 z-30"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="fixed top-16 right-4 z-40 w-80 bg-card border border-border rounded-2xl shadow-2xl p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">Bildirimler</h3>
                <button onClick={() => setNotifOpen(false)} className="text-xs text-muted-foreground hover:text-foreground">
                  Kapat
                </button>
              </div>
              <div className="space-y-2">
                {[
                  { text: "Chief Agent görevi tamamladı", time: "2 dk önce", color: "bg-green-400" },
                  { text: "Sistem metrikleri güncellendi", time: "5 dk önce", color: "bg-blue-400" },
                  { text: "Memory Retriever beklemede", time: "15 dk önce", color: "bg-yellow-400" },
                ].map((n, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.color}`} />
                    <div>
                      <p className="text-sm">{n.text}</p>
                      <p className="text-xs text-muted-foreground">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => { navigate("/activity"); setNotifOpen(false); }}
                className="w-full mt-3 py-2 text-xs text-primary hover:underline"
              >
                Tüm aktiviteleri gör →
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
