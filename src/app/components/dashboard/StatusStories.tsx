import { motion } from "motion/react";
import { Brain, Code, Database, Shield, Zap, Plus } from "lucide-react";

interface Story {
  id: string;
  agent: string;
  icon: React.ElementType;
  color: string;
  gradient: string;
  status: "active" | "idle";
  progress: number;
}

const stories: Story[] = [
  { 
    id: "1", 
    agent: "Chief", 
    icon: Brain, 
    color: "#00D9FF",
    gradient: "from-[#00D9FF] to-[#0EA5E9]",
    status: "active",
    progress: 75
  },
  { 
    id: "2", 
    agent: "Code", 
    icon: Code, 
    color: "#8B5CF6",
    gradient: "from-[#8B5CF6] to-[#6D28D9]",
    status: "active",
    progress: 60
  },
  { 
    id: "3", 
    agent: "Memory", 
    icon: Database, 
    color: "#FBBF24",
    gradient: "from-[#FBBF24] to-[#F59E0B]",
    status: "idle",
    progress: 30
  },
  { 
    id: "4", 
    agent: "Kintsugi", 
    icon: Shield, 
    color: "#10B981",
    gradient: "from-[#10B981] to-[#059669]",
    status: "active",
    progress: 90
  },
  { 
    id: "5", 
    agent: "Shinobi", 
    icon: Zap, 
    color: "#FF00E5",
    gradient: "from-[#FF00E5] to-[#C026D3]",
    status: "idle",
    progress: 0
  },
];

export function StatusStories() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
      {/* Add New Story */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex-shrink-0 flex flex-col items-center gap-2 group"
      >
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-border bg-muted/30 flex items-center justify-center group-hover:border-primary/50 transition-colors">
            <Plus className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </div>
        <span className="text-xs text-muted-foreground">Ekle</span>
      </motion.button>

      {/* Agent Stories */}
      {stories.map((story, index) => {
        const Icon = story.icon;
        const isActive = story.status === "active";
        
        return (
          <motion.button
            key={story.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-shrink-0 flex flex-col items-center gap-2 group relative"
          >
            {/* Story Ring */}
            <div className="relative">
              {/* Gradient Border */}
              <svg className="absolute inset-0 w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="3"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  fill="none"
                  stroke={`url(#gradient-${story.id})`}
                  strokeWidth="3"
                  strokeDasharray={`${story.progress * 2.26} ${226 - story.progress * 2.26}`}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
                <defs>
                  <linearGradient id={`gradient-${story.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={story.color} stopOpacity="1" />
                    <stop offset="100%" stopColor={story.color} stopOpacity="0.6" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Agent Icon */}
              <div className="w-20 h-20 rounded-2xl p-[3px]">
                <div 
                  className={`
                    size-full rounded-2xl flex items-center justify-center
                    bg-gradient-to-br ${story.gradient}
                    ${isActive ? 'opacity-100' : 'opacity-50'}
                    group-hover:opacity-100 transition-all
                  `}
                  style={{ boxShadow: isActive ? `0 0 20px ${story.color}40` : 'none' }}
                >
                  <Icon className="w-8 h-8 text-white" />
                </div>
              </div>

              {/* Active Indicator */}
              {isActive && (
                <div 
                  className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background"
                  style={{ backgroundColor: story.color }}
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-full h-full rounded-full"
                    style={{ backgroundColor: story.color }}
                  />
                </div>
              )}
            </div>

            <div className="text-center">
              <span className="text-xs font-medium">{story.agent}</span>
              <p className="text-xs text-muted-foreground">{story.progress}%</p>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
