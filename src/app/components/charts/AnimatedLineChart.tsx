import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { useId } from "react";

interface AnimatedLineChartProps {
  data: Array<{ name: string; value: number; }>;
  color?: string;
  filled?: boolean;
}

export function AnimatedLineChart({ data, color = "#00D9FF", filled = false }: AnimatedLineChartProps) {
  // Use React's useId to ensure unique, stable IDs across renders
  const uniqueId = useId();
  const gradientId = `areaGradient-${uniqueId}`;

  if (filled) {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
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
          <Area 
            type="monotone"
            dataKey="value" 
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            animationDuration={1000}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
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
        <Line 
          type="monotone"
          dataKey="value" 
          stroke={color}
          strokeWidth={3}
          dot={{ fill: color, r: 4 }}
          activeDot={{ r: 6 }}
          animationDuration={1000}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}