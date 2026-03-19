import { Home, Activity, MessageSquare, Brain, Settings } from "lucide-react";
import { motion } from "motion/react";
import { useLocation, useNavigate } from "react-router";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { icon: Home, label: "Ana Sayfa", path: "/" },
  { icon: Activity, label: "Aktivite", path: "/activity" },
  { icon: MessageSquare, label: "Chat", path: "/chat" },
  { icon: Brain, label: "Agentlar", path: "/agents" },
  { icon: Settings, label: "Ayarlar", path: "/settings" },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
      <div className="mx-4 mb-4 rounded-2xl border border-border bg-card/80 backdrop-blur-xl shadow-lg">
        <div className="flex items-center justify-around px-2 py-3">
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            return (
              <motion.button
                key={item.label}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate(item.path)}
                className={`
                  relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all
                  ${isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                  }
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary/10 rounded-xl"
                    transition={{ type: "spring", duration: 0.5 }}
                  />
                )}
                <item.icon className="w-5 h-5 relative z-10" />
                <span className="text-xs relative z-10">{item.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}