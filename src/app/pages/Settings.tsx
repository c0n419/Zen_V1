import { Header } from "../components/layout/Header";
import { BottomNav } from "../components/layout/BottomNav";
import { motion } from "motion/react";
import { 
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Palette,
  Database,
  Zap,
  Globe,
  Moon,
  Sun,
  Cpu,
  HardDrive,
  Wifi,
  Lock,
  Eye,
  Mail,
  MessageSquare,
  Volume2,
  ChevronRight,
  LogOut,
  Save
} from "lucide-react";
import { GradientCard } from "../components/ui/GradientCard";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";
import { Slider } from "../components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useState, useEffect } from "react";

// localStorage'dan ayarları yükle
function loadSettings() {
  try {
    const s = localStorage.getItem("zen_settings");
    if (s) return JSON.parse(s);
  } catch {}
  return {};
}

export default function Settings() {
  const saved = loadSettings();
  const [notifications, setNotifications] = useState(saved.notifications ?? true);
  const [darkMode, setDarkMode] = useState(saved.darkMode ?? true);
  const [autoSave, setAutoSave] = useState(saved.autoSave ?? true);
  const [soundEffects, setSoundEffects] = useState(saved.soundEffects ?? false);
  const [emailNotif, setEmailNotif] = useState(saved.emailNotif ?? true);
  const [pushNotif, setPushNotif] = useState(saved.pushNotif ?? true);
  const [performance, setPerformance] = useState([saved.performance ?? 75]);
  const [accentColor, setAccentColor] = useState(saved.accentColor ?? "#00D9FF");
  const [saveMsg, setSaveMsg] = useState("");
  const [apiStatus, setApiStatus] = useState<"checking" | "ok" | "error">("checking");

  // Dark mode HTML class toggle
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Accent color CSS variable değiştir
  useEffect(() => {
    document.documentElement.style.setProperty("--accent-color", accentColor);
    // Tailwind primary rengi olarak da uygula (hex → hsl dönüşümü yerine direkt)
    document.documentElement.style.setProperty("--primary", accentColor);
  }, [accentColor]);

  // API bağlantı durumu kontrol et
  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
    fetch(`${API_URL.replace("/api", "")}/health`, { signal: AbortSignal.timeout(3000) })
      .then((r) => setApiStatus(r.ok ? "ok" : "error"))
      .catch(() => setApiStatus("error"));
  }, []);

  function handleSave() {
    const settings = { notifications, darkMode, autoSave, soundEffects, emailNotif, pushNotif, performance: performance[0], accentColor };
    localStorage.setItem("zen_settings", JSON.stringify(settings));
    setSaveMsg("Ayarlar kaydedildi!");
    setTimeout(() => setSaveMsg(""), 2500);
  }

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
          <h2 className="text-2xl font-bold mb-2">
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Ayarlar</span>
          </h2>
          <p className="text-muted-foreground">Sistem tercihlerini ve yapılandırmalarını yönetin</p>
        </motion.div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="w-full justify-start mb-6 bg-card/50 p-1 overflow-x-auto">
            <TabsTrigger value="general" className="flex-shrink-0">Genel</TabsTrigger>
            <TabsTrigger value="notifications" className="flex-shrink-0">Bildirimler</TabsTrigger>
            <TabsTrigger value="appearance" className="flex-shrink-0">Görünüm</TabsTrigger>
            <TabsTrigger value="agents" className="flex-shrink-0">Agentlar</TabsTrigger>
            <TabsTrigger value="security" className="flex-shrink-0">Güvenlik</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="mt-0">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Profile Settings */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <GradientCard gradient="cyan" className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-background/50">
                      <User className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-semibold">Profil Bilgileri</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="username">Kullanıcı Adı</Label>
                      <Input 
                        id="username" 
                        defaultValue="ninja" 
                        className="mt-2 bg-background/50 border-border/50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">E-posta</Label>
                      <Input 
                        id="email" 
                        type="email"
                        defaultValue="ninja@zen.dev" 
                        className="mt-2 bg-background/50 border-border/50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">Rol</Label>
                      <Select defaultValue="admin">
                        <SelectTrigger className="mt-2 bg-background/50 border-border/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="developer">Developer</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </GradientCard>
              </motion.div>

              {/* System Settings */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <GradientCard gradient="magenta" className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-background/50">
                      <SettingsIcon className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-semibold">Sistem Ayarları</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-background/30">
                      <div className="flex items-center gap-3">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Dil</p>
                          <p className="text-xs text-muted-foreground">Arayüz dili</p>
                        </div>
                      </div>
                      <Select defaultValue="tr">
                        <SelectTrigger className="w-32 bg-background/50 border-border/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tr">Türkçe</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="de">Deutsch</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-background/30">
                      <div className="flex items-center gap-3">
                        <Zap className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Otomatik Kaydet</p>
                          <p className="text-xs text-muted-foreground">Değişiklikleri otomatik kaydet</p>
                        </div>
                      </div>
                      <Switch checked={autoSave} onCheckedChange={setAutoSave} />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-background/30">
                      <div className="flex items-center gap-3">
                        <Volume2 className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Ses Efektleri</p>
                          <p className="text-xs text-muted-foreground">Sistem sesleri</p>
                        </div>
                      </div>
                      <Switch checked={soundEffects} onCheckedChange={setSoundEffects} />
                    </div>

                    <div className="p-3 rounded-lg bg-background/30">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Cpu className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Performans Modu</p>
                            <p className="text-xs text-muted-foreground">{performance[0]}%</p>
                          </div>
                        </div>
                      </div>
                      <Slider 
                        value={performance} 
                        onValueChange={setPerformance}
                        max={100}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </GradientCard>
              </motion.div>

              {/* Storage Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <GradientCard gradient="yellow" className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-background/50">
                      <HardDrive className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-semibold">Depolama</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Kullanılan Alan</span>
                        <span className="text-sm font-semibold">6.8 GB / 10 GB</span>
                      </div>
                      <div className="h-3 bg-background/50 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full" style={{ width: "68%" }} />
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-background/30">
                        <div className="flex items-center gap-2">
                          <Database className="w-4 h-4 text-cyan-400" />
                          <span className="text-sm">Agent Hafızası</span>
                        </div>
                        <span className="text-sm font-semibold">3.2 GB</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-background/30">
                        <div className="flex items-center gap-2">
                          <Database className="w-4 h-4 text-magenta-400" />
                          <span className="text-sm">Loglar</span>
                        </div>
                        <span className="text-sm font-semibold">2.1 GB</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-background/30">
                        <div className="flex items-center gap-2">
                          <Database className="w-4 h-4 text-green-400" />
                          <span className="text-sm">Önbellek</span>
                        </div>
                        <span className="text-sm font-semibold">1.5 GB</span>
                      </div>
                    </div>
                  </div>
                </GradientCard>
              </motion.div>

              {/* Connection Status */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <GradientCard gradient="green" className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-background/50">
                      <Wifi className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-semibold">Bağlantı Durumu</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-background/30">
                      <span className="text-sm">Bridge API (port 8000)</span>
                      {apiStatus === "checking" && <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">Kontrol...</Badge>}
                      {apiStatus === "ok" && <Badge className="bg-green-500/10 text-green-400 border-green-500/20">Bağlı</Badge>}
                      {apiStatus === "error" && <Badge className="bg-red-500/10 text-red-400 border-red-500/20">Bağlanamadı</Badge>}
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-background/30">
                      <span className="text-sm">Ollama (port 11434)</span>
                      <Badge className="bg-green-500/10 text-green-400 border-green-500/20">Aktif</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-background/30">
                      <span className="text-sm">Model</span>
                      <Badge className="bg-primary/10 text-primary border-primary/20 font-mono">rnj-1:8b</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-background/30">
                      <span className="text-sm">Mock Mod</span>
                      <Badge className={import.meta.env.VITE_ENABLE_MOCK === "true" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" : "bg-green-500/10 text-green-400 border-green-500/20"}>
                        {import.meta.env.VITE_ENABLE_MOCK === "true" ? "Aktif" : "Kapalı"}
                      </Badge>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-background/30 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Gecikme</p>
                        <p className="text-lg font-bold">12ms</p>
                      </div>
                      <div className="p-3 rounded-lg bg-background/30 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Uptime</p>
                        <p className="text-lg font-bold">99.9%</p>
                      </div>
                    </div>
                  </div>
                </GradientCard>
              </motion.div>
            </div>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="mt-0">
            <div className="grid lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <GradientCard gradient="cyan" className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-background/50">
                      <Bell className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-semibold">Bildirim Tercihleri</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-background/30">
                      <div className="flex items-center gap-3">
                        <Bell className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Bildirimleri Etkinleştir</p>
                          <p className="text-xs text-muted-foreground">Tüm bildirimleri aç/kapat</p>
                        </div>
                      </div>
                      <Switch checked={notifications} onCheckedChange={setNotifications} />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-background/30">
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">E-posta Bildirimleri</p>
                          <p className="text-xs text-muted-foreground">Önemli olaylar için e-posta al</p>
                        </div>
                      </div>
                      <Switch checked={emailNotif} onCheckedChange={setEmailNotif} />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-background/30">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Push Bildirimleri</p>
                          <p className="text-xs text-muted-foreground">Tarayıcı bildirimleri</p>
                        </div>
                      </div>
                      <Switch checked={pushNotif} onCheckedChange={setPushNotif} />
                    </div>
                  </div>
                </GradientCard>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <GradientCard gradient="magenta" className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-background/50">
                      <Zap className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-semibold">Bildirim Tipleri</h3>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: "Agent Durumu", desc: "Agent aktivite bildirimleri" },
                      { label: "Görev Tamamlama", desc: "Tamamlanan görevler" },
                      { label: "Sistem Uyarıları", desc: "Kritik sistem mesajları" },
                      { label: "Performans Alertleri", desc: "Performans eşik uyarıları" },
                      { label: "Güvenlik", desc: "Güvenlik ile ilgili olaylar" },
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-background/30">
                        <div>
                          <p className="font-medium text-sm">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                        <Switch defaultChecked={index < 3} />
                      </div>
                    ))}
                  </div>
                </GradientCard>
              </motion.div>
            </div>
          </TabsContent>

          {/* Appearance */}
          <TabsContent value="appearance" className="mt-0">
            <div className="grid lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <GradientCard gradient="yellow" className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-background/50">
                      <Palette className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-semibold">Tema</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-background/30">
                      <div className="flex items-center gap-3">
                        <Moon className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Karanlık Mod</p>
                          <p className="text-xs text-muted-foreground">Karanlık tema kullan</p>
                        </div>
                      </div>
                      <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                    </div>

                    <div className="p-3 rounded-lg bg-background/30">
                      <p className="font-medium mb-3">Vurgu Rengi</p>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { color: "#00D9FF", name: "Cyan" },
                          { color: "#8B5CF6", name: "Purple" },
                          { color: "#FF00E5", name: "Magenta" },
                          { color: "#FBBF24", name: "Yellow" },
                          { color: "#10B981", name: "Green" },
                          { color: "#F59E0B", name: "Orange" },
                          { color: "#EF4444", name: "Red" },
                          { color: "#3B82F6", name: "Blue" },
                        ].map((theme) => (
                          <button
                            key={theme.name}
                            onClick={() => setAccentColor(theme.color)}
                            className={`aspect-square rounded-lg border-2 transition-all ${accentColor === theme.color ? "border-white scale-110 shadow-lg" : "border-border hover:border-white/50"}`}
                            style={{ backgroundColor: theme.color }}
                            title={theme.name}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Seçili: <span className="font-mono">{accentColor}</span></p>
                    </div>
                  </div>
                </GradientCard>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <GradientCard gradient="green" className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-background/50">
                      <Eye className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-semibold">Görünüm Seçenekleri</h3>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: "Kompakt Mod", desc: "Daha az boşluk kullan" },
                      { label: "Animasyonlar", desc: "UI animasyonlarını göster" },
                      { label: "Gradientler", desc: "Gradient efektleri" },
                      { label: "Blur Efektleri", desc: "Glassmorphism efektleri" },
                      { label: "Smooth Scroll", desc: "Yumuşak kaydırma" },
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-background/30">
                        <div>
                          <p className="font-medium text-sm">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                        <Switch defaultChecked={index !== 0} />
                      </div>
                    ))}
                  </div>
                </GradientCard>
              </motion.div>
            </div>
          </TabsContent>

          {/* Agents Config */}
          <TabsContent value="agents" className="mt-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <GradientCard className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-background/50">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold">Agent Yapılandırması</h3>
                </div>
                <div className="grid lg:grid-cols-2 gap-4">
                  {[
                    { name: "Researcher Agent", status: "active" },
                    { name: "Analyzer Agent", status: "active" },
                    { name: "Task Manager", status: "idle" },
                    { name: "Memory Agent", status: "active" },
                    { name: "API Agent", status: "error" },
                    { name: "Scheduler Agent", status: "paused" },
                  ].map((agent, index) => (
                    <div key={index} className="p-4 rounded-lg bg-background/30 hover:bg-background/40 transition-colors cursor-pointer group">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-background/50">
                            <Cpu className="w-4 h-4" />
                          </div>
                          <p className="font-semibold">{agent.name}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge className={
                          agent.status === "active" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                          agent.status === "error" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                          agent.status === "idle" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" :
                          "bg-gray-500/10 text-gray-400 border-gray-500/20"
                        }>
                          {agent.status === "active" ? "Aktif" :
                           agent.status === "error" ? "Hata" :
                           agent.status === "idle" ? "Beklemede" : "Duraklatıldı"}
                        </Badge>
                        <Switch defaultChecked={agent.status === "active"} />
                      </div>
                    </div>
                  ))}
                </div>
              </GradientCard>
            </motion.div>
          </TabsContent>

          {/* Security */}
          <TabsContent value="security" className="mt-0">
            <div className="grid lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <GradientCard gradient="cyan" className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-background/50">
                      <Shield className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-semibold">Güvenlik</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="current-password">Mevcut Şifre</Label>
                      <Input 
                        id="current-password" 
                        type="password"
                        className="mt-2 bg-background/50 border-border/50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="new-password">Yeni Şifre</Label>
                      <Input 
                        id="new-password" 
                        type="password"
                        className="mt-2 bg-background/50 border-border/50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirm-password">Şifre Tekrar</Label>
                      <Input 
                        id="confirm-password" 
                        type="password"
                        className="mt-2 bg-background/50 border-border/50"
                      />
                    </div>
                    <button className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                      Şifreyi Güncelle
                    </button>
                  </div>
                </GradientCard>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <GradientCard gradient="magenta" className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-background/50">
                      <Lock className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-semibold">Güvenlik Seçenekleri</h3>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: "İki Faktörlü Doğrulama", desc: "2FA ile ekstra güvenlik", enabled: true },
                      { label: "Oturum Zaman Aşımı", desc: "15 dakika inaktivite sonrası", enabled: true },
                      { label: "API Anahtar Doğrulama", desc: "Her API isteğinde doğrula", enabled: true },
                      { label: "IP Beyaz Liste", desc: "Sadece belirli IP'lerden erişim", enabled: false },
                      { label: "Şifreleme", desc: "Hassas veri şifreleme", enabled: true },
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-background/30">
                        <div>
                          <p className="font-medium text-sm">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                        <Switch defaultChecked={item.enabled} />
                      </div>
                    ))}
                  </div>
                </GradientCard>
              </motion.div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 flex gap-3 flex-wrap"
        >
          <button
            onClick={handleSave}
            className="flex-1 min-w-[140px] px-4 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saveMsg || "Değişiklikleri Kaydet"}
          </button>
          <button
            onClick={() => { if (window.confirm("Oturumu kapatmak istiyor musunuz?")) { localStorage.clear(); window.location.href = "/"; } }}
            className="px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive hover:bg-destructive/20 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Çıkış Yap
          </button>
        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
}
