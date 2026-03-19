import { ArrowUp, ArrowDown, LucideIcon } from "lucide-react";
import { GradientCard } from "./GradientCard";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: LucideIcon;
  gradient?: "cyan" | "magenta" | "yellow" | "green" | "none";
  subtitle?: string;
}

export function MetricCard({ 
  title, 
  value, 
  change, 
  icon: Icon,
  gradient = "cyan",
  subtitle 
}: MetricCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <GradientCard gradient={gradient} glow className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <h3 className="text-3xl font-semibold text-foreground">{value}</h3>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className={`
            p-3 rounded-xl
            ${gradient === "cyan" && "bg-[#00D9FF]/20"}
            ${gradient === "magenta" && "bg-[#FF00E5]/20"}
            ${gradient === "yellow" && "bg-[#FBBF24]/20"}
            ${gradient === "green" && "bg-[#10B981]/20"}
          `}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
      
      {change !== undefined && (
        <div className="flex items-center gap-1">
          {isPositive && <ArrowUp className="w-4 h-4 text-green-400" />}
          {isNegative && <ArrowDown className="w-4 h-4 text-red-400" />}
          <span className={`text-sm ${
            isPositive ? "text-green-400" : isNegative ? "text-red-400" : "text-muted-foreground"
          }`}>
            {isPositive && "+"}{change}%
          </span>
          <span className="text-sm text-muted-foreground ml-1">son 7 gün</span>
        </div>
      )}
    </GradientCard>
  );
}
