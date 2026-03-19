import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useId } from "react";

interface GradientBarChartProps {
  data: Array<{ name: string; value: number; }>;
  color?: string;
}

export function GradientBarChart({ data, color = "#00D9FF" }: GradientBarChartProps) {
  // Use React's useId to ensure unique, stable IDs across renders
  const uniqueId = useId();
  const gradientId = `barGradient-${uniqueId}`;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.8} />
            <stop offset="100%" stopColor={color} stopOpacity={0.2} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
        <XAxis 
          dataKey="name" 
          stroke="#9CA3AF"
          style={{ fontSize: '12px' }}
        />
        <YAxis 
          stroke="#9CA3AF"
          style={{ fontSize: '12px' }}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#1A1A2E',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            color: '#F5F5F7'
          }}
        />
        <Bar 
          dataKey="value" 
          fill={`url(#${gradientId})`}
          radius={[8, 8, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}