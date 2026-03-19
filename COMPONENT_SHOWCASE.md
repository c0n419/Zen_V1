# ZEN v3.0 Component Showcase

Bu dokümanda tüm component'lerin kullanım örnekleri bulunmaktadır.

## 🎨 UI Components

### GradientCard

Temel kart component'i. 4 farklı gradient ve glow seçeneği.

```tsx
import { GradientCard } from "./components/ui/GradientCard";

// Cyan gradient with glow
<GradientCard gradient="cyan" glow className="p-6">
  <h3>Başlık</h3>
  <p>İçerik</p>
</GradientCard>

// Gradient seçenekleri: "cyan" | "magenta" | "yellow" | "green" | "none"
```

### MetricCard

KPI gösterimi için kullanılan kart.

```tsx
import { MetricCard } from "./components/ui/MetricCard";
import { Brain } from "lucide-react";

<MetricCard
  title="Aktif Agentlar"
  value="4/5"
  change={12.5}           // Pozitif: yeşil ↑, Negatif: kırmızı ↓
  icon={Brain}
  gradient="cyan"
  subtitle="Sistem"      // Opsiyonel
/>
```

## 📊 Chart Components

### GradientBarChart

Bar chart with gradient fill.

```tsx
import { GradientBarChart } from "./components/charts/GradientBarChart";

const data = [
  { name: 'Pzt', value: 65 },
  { name: 'Sal', value: 78 },
  // ...
];

<div className="h-64">
  <GradientBarChart data={data} color="#00D9FF" />
</div>
```

### AnimatedLineChart

Line veya area chart.

```tsx
import { AnimatedLineChart } from "./components/charts/AnimatedLineChart";

const data = [
  { name: 'Pzt', value: 65 },
  // ...
];

// Line chart
<AnimatedLineChart data={data} color="#00D9FF" />

// Area chart (filled)
<AnimatedLineChart data={data} color="#FF00E5" filled />
```

### DonutChart

Halka grafik with center label.

```tsx
import { DonutChart } from "./components/charts/DonutChart";

const data = [
  { name: 'Code Expert', value: 35, color: '#00D9FF' },
  { name: 'Research', value: 25, color: '#8B5CF6' },
  // ...
];

<div className="h-64">
  <DonutChart 
    data={data} 
    centerLabel="Toplam" 
    centerValue="100" 
  />
</div>
```

## 🎯 Dashboard Components

### StatusStories

Instagram-style agent status viewer.

```tsx
import { StatusStories } from "./components/dashboard/StatusStories";

<StatusStories />

// Mock data içerisinde tanımlı
// Backend'den veri çekerek customize edilebilir
```

### AgentStatusCard

Agent listesi ve durumları.

```tsx
import { AgentStatusCard } from "./components/dashboard/AgentStatusCard";

<AgentStatusCard />

// Her agent için gösterir:
// - İsim ve protokol
// - Durum (active, idle, error, processing)
// - Görev sayısı
// - Status badge
```

### PerformanceChart

7 günlük performans grafiği.

```tsx
import { PerformanceChart } from "./components/dashboard/PerformanceChart";

<PerformanceChart />

// Area chart ile görselleştirme
// Değişim yüzdesi gösterimi
```

### TaskDistribution

Görev dağılımı donut chart.

```tsx
import { TaskDistribution } from "./components/dashboard/TaskDistribution";

<TaskDistribution />

// Donut chart + legend
// Her kategori için renk ve yüzde
```

### SystemMetrics

Sistem kaynak kullanımı.

```tsx
import { SystemMetrics } from "./components/dashboard/SystemMetrics";

<SystemMetrics />

// GPU, RAM, Disk metrikleri
// Animated progress bars
// Real-time değerler
```

### RecentActivity

Son aktivite log'ları.

```tsx
import { RecentActivity } from "./components/dashboard/RecentActivity";

<RecentActivity />

// Her aktivite için:
// - Type (success, error, info, warning)
// - Başlık ve açıklama
// - Zaman damgası
// - Agent bilgisi
```

### QuickActions

Hızlı erişim butonları.

```tsx
import { QuickActions } from "./components/dashboard/QuickActions";

<QuickActions />

// 6 aksiyon butonu:
// - Yeni Görev
// - Senkronize
// - Raporlar
// - Terminal
// - Otonom Mod
// - Hafıza
```

## 🎭 Layout Components

### Header

Üst navigasyon bar.

```tsx
import { Header } from "./components/layout/Header";

<Header />

// İçerir:
// - Menu butonu
// - ZEN v3.0 logo
// - Search butonu
// - Notification butonu (badge ile)
```

### BottomNav

Alt navigasyon (mobile-optimized).

```tsx
import { BottomNav } from "./components/layout/BottomNav";

<BottomNav />

// 5 tab:
// - Ana Sayfa (active)
// - Aktivite
// - Agents
// - Analiz
// - Ayarlar

// Animated tab indicator
```

## 🎨 Gradient & Color System

### Gradient Presets

```tsx
// Cyan (Primary)
className="bg-gradient-to-br from-[#00D9FF] to-[#0EA5E9]"

// Magenta (Accent)
className="bg-gradient-to-br from-[#FF00E5] to-[#8B5CF6]"

// Yellow (Warning)
className="bg-gradient-to-br from-[#FBBF24] to-[#F59E0B]"

// Green (Success)
className="bg-gradient-to-br from-[#10B981] to-[#059669]"
```

### Glow Effects

```tsx
// Cyan glow
className="shadow-[0_0_20px_rgba(0,217,255,0.3)]"

// Magenta glow
className="shadow-[0_0_20px_rgba(255,0,229,0.3)]"

// Yellow glow
className="shadow-[0_0_20px_rgba(251,191,36,0.3)]"
```

### Glassmorphism

```tsx
className="
  backdrop-blur-md 
  bg-card/60 
  border 
  border-border/50
  rounded-2xl
"
```

## 🎬 Animation Patterns

### Fade In (Stagger)

```tsx
import { motion } from "motion/react";

{items.map((item, index) => (
  <motion.div
    key={item.id}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
  >
    {item.content}
  </motion.div>
))}
```

### Scale on Hover

```tsx
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
  Click me
</motion.button>
```

### Progress Animation

```tsx
<motion.div
  initial={{ width: 0 }}
  animate={{ width: `${percentage}%` }}
  transition={{ duration: 1 }}
  className="h-2 bg-primary rounded-full"
/>
```

### Pulse Effect

```tsx
<motion.div
  animate={{ scale: [1, 1.2, 1] }}
  transition={{ duration: 2, repeat: Infinity }}
  className="w-4 h-4 rounded-full bg-primary"
/>
```

## 📦 Barrel Exports

Tüm component'leri tek bir yerden import edebilirsiniz:

```tsx
import {
  // Layout
  Header,
  BottomNav,
  
  // UI
  GradientCard,
  MetricCard,
  
  // Charts
  GradientBarChart,
  AnimatedLineChart,
  DonutChart,
  
  // Dashboard
  StatusStories,
  AgentStatusCard,
  PerformanceChart,
  TaskDistribution,
  SystemMetrics,
  RecentActivity,
  QuickActions,
} from "./components";
```

## 🎯 Best Practices

### Responsive Design

```tsx
// Mobile-first approach
<div className="
  grid 
  grid-cols-1 
  md:grid-cols-2 
  lg:grid-cols-3 
  gap-4
">
  {/* Content */}
</div>
```

### Consistent Spacing

```tsx
// Standard spacing system
mb-4   // 16px
mb-6   // 24px
gap-4  // 16px
gap-6  // 24px
p-6    // 24px padding
```

### Icon Usage

```tsx
import { IconName } from "lucide-react";

// Standard icon size
<IconName className="w-5 h-5" />

// Large icon
<IconName className="w-6 h-6" />
```

---

**Not**: Tüm component'ler responsive ve accessible tasarlanmıştır. Mock data ile çalışır, backend entegrasyonu sonrası gerçek veri kullanacaktır.
