import { motion } from "motion/react";
import { ReactNode } from "react";

interface GradientCardProps {
  children: ReactNode;
  className?: string;
  gradient?: "cyan" | "magenta" | "yellow" | "green" | "none";
  glow?: boolean;
  disableAnimation?: boolean;
}

export function GradientCard({ 
  children, 
  className = "", 
  gradient = "none",
  glow = false,
  disableAnimation = false
}: GradientCardProps) {
  const gradientClasses = {
    cyan: "from-[#00D9FF]/20 to-[#0EA5E9]/10 border-[#00D9FF]/30",
    magenta: "from-[#FF00E5]/20 to-[#8B5CF6]/10 border-[#FF00E5]/30",
    yellow: "from-[#FBBF24]/20 to-[#F59E0B]/10 border-[#FBBF24]/30",
    green: "from-[#10B981]/20 to-[#059669]/10 border-[#10B981]/30",
    none: "from-card/60 to-card/40 border-border"
  };

  const glowClasses = {
    cyan: "shadow-[0_0_20px_rgba(0,217,255,0.3)]",
    magenta: "shadow-[0_0_20px_rgba(255,0,229,0.3)]",
    yellow: "shadow-[0_0_20px_rgba(251,191,36,0.3)]",
    green: "shadow-[0_0_20px_rgba(16,185,129,0.3)]",
    none: ""
  };

  const Component = disableAnimation ? "div" : motion.div;
  const animationProps = disableAnimation ? {} : {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 }
  };

  return (
    <Component
      {...animationProps}
      className={`
        relative overflow-hidden rounded-2xl border backdrop-blur-md
        bg-gradient-to-br ${gradientClasses[gradient]}
        ${glow ? glowClasses[gradient] : ""}
        ${className}
      `}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      {children}
    </Component>
  );
}