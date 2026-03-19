# ZEN v3.0 Dashboard - Entegrasyon Rehberi

## 📋 Genel Bakış

ZEN v3.0 Multi-Agent Framework için modern, responsive dashboard arayüzü. Dark theme, gradient efektler ve gerçek zamanlı veri görselleştirme ile.

## 🎨 Tasarım Sistemi

### Renk Paleti
- **Primary (Cyan)**: `#00D9FF` - Ana vurgu rengi
- **Secondary (Magenta)**: `#FF00E5` - İkincil vurgu
- **Accent (Purple)**: `#8B5CF6` - Vurgu rengi
- **Success (Green)**: `#10B981` - Başarı bildirimleri
- **Warning (Yellow)**: `#FBBF24` - Uyarılar

### Component'ler

#### Layout
- `Header`: Üst bar (menu, search, notifications)
- `BottomNav`: Alt navigasyon (mobil-friendly)

#### Dashboard Components
- `StatusStories`: Agent durumu story görünümü (Instagram-style)
- `MetricCard`: KPI kartları (animasyonlu, gradientli)
- `AgentStatusCard`: Multi-agent durum listesi
- `PerformanceChart`: 7 günlük performans grafiği
- `TaskDistribution`: Görev dağılımı donut chart
- `SystemMetrics`: Donanım metrikleri (GPU, RAM, Disk)
- `RecentActivity`: Son aktivite log'ları
- `QuickActions`: Hızlı erişim butonları

#### Charts (Recharts)
- `GradientBarChart`: Gradient bar grafik
- `AnimatedLineChart`: Animasyonlu çizgi/alan grafiği
- `DonutChart`: Halka grafik (merkez label ile)

## 🔌 Backend Entegrasyonu

### 1. API Endpoint'leri

Dashboard'da mock data kullanılıyor. Backend'den aşağıdaki endpoint'leri bekliyoruz:

```typescript
// Agent Durumu
GET /api/agents/status
Response: {
  agents: [
    {
      id: string,
      name: string,
      protocol: string,
      status: "active" | "idle" | "error" | "processing",
      tasks: number,
      progress: number
    }
  ]
}

// Metrikler
GET /api/metrics/dashboard
Response: {
  activeAgents: { value: number, change: number },
  completedTasks: { value: number, change: number },
  successRate: { value: number, change: number },
  memoryRules: { value: number, change: number }
}

// Performans Verisi
GET /api/performance/weekly
Response: {
  data: [
    { name: string, value: number }
  ]
}

// Sistem Metrikleri
GET /api/system/metrics
Response: {
  gpu: [
    { label: string, value: string, percentage: number }
  ],
  ram: { value: string, percentage: number },
  disk: { value: string, percentage: number }
}

// Aktiviteler
GET /api/activities/recent?limit=10
Response: {
  activities: [
    {
      id: string,
      type: "success" | "error" | "info" | "warning",
      title: string,
      description: string,
      time: string,
      agent: string
    }
  ]
}

// Görev Dağılımı
GET /api/tasks/distribution
Response: {
  distribution: [
    { name: string, value: number, color: string }
  ]
}
```

### 2. WebSocket (Real-time Updates)

Gerçek zamanlı güncellemeler için:

```typescript
// WebSocket connection
const ws = new WebSocket('ws://localhost:8000/ws/dashboard');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch(data.type) {
    case 'agent_status_update':
      // Agent durumunu güncelle
      break;
    case 'new_activity':
      // Yeni aktivite ekle
      break;
    case 'metric_update':
      // Metrikleri güncelle
      break;
  }
};
```

### 3. Data State Management

React Query veya SWR kullanımı önerilir:

```typescript
// Example with React Query
import { useQuery } from '@tanstack/react-query';

function useAgentStatus() {
  return useQuery({
    queryKey: ['agents', 'status'],
    queryFn: () => fetch('/api/agents/status').then(res => res.json()),
    refetchInterval: 5000 // 5 saniyede bir güncelle
  });
}
```

## 📂 Dosya Yapısı

```
/src/app/
├── App.tsx                          # Ana dashboard
├── components/
│   ├── ui/
│   │   ├── GradientCard.tsx        # Temel kart component
│   │   └── MetricCard.tsx          # Metrik kartı
│   ├── charts/
│   │   ├── GradientBarChart.tsx
│   │   ├── AnimatedLineChart.tsx
│   │   └── DonutChart.tsx
│   ├── dashboard/
│   │   ├── StatusStories.tsx
│   │   ├── AgentStatusCard.tsx
│   │   ├── PerformanceChart.tsx
│   │   ├── TaskDistribution.tsx
│   │   ├── SystemMetrics.tsx
│   │   ├── RecentActivity.tsx
│   │   └── QuickActions.tsx
│   └── layout/
│       ├── Header.tsx
│       └── BottomNav.tsx
```

## 🚀 Geliştirme Önerileri

### Eklenebilecek Özellikler

1. **Dark/Light Mode Toggle**: Theme switcher ekle
2. **Filtreler**: Tarih aralığı, agent bazlı filtreleme
3. **Export**: PDF/CSV export işlevselliği
4. **Detay Sayfaları**: Her agent için detay sayfası
5. **Notifications**: Toast notifications (Sonner kullanılabilir)
6. **Search**: Global arama fonksiyonu
7. **Settings**: Kullanıcı ayarları sayfası

### Responsive Design

- **Mobile**: 375px - 767px (Single column layout)
- **Tablet**: 768px - 1023px (2 column layout)
- **Desktop**: 1024px+ (3-4 column layout)

### Performance

- Lazy loading için React.lazy() kullan
- Büyük listeler için virtualization (react-window)
- Memoization (React.memo, useMemo)

## 🎯 Backend Beklentileri

1. **RESTful API** veya **GraphQL** endpoint'leri
2. **WebSocket** real-time güncellemeler için
3. **JWT Authentication** (opsiyonel)
4. **Rate Limiting** API'ler için
5. **CORS** ayarları

## 📝 Örnek Backend Response

```json
{
  "success": true,
  "data": {
    "agents": [
      {
        "id": "agent-1",
        "name": "Chief Agent",
        "protocol": "Smith",
        "status": "active",
        "tasks": 12,
        "progress": 75
      }
    ]
  },
  "timestamp": "2026-03-10T14:30:00Z"
}
```

## 🔧 Konfigürasyon

Environment variables (.env):

```bash
VITE_API_BASE_URL=http://localhost:8000/api
VITE_WS_URL=ws://localhost:8000/ws
VITE_ENABLE_MOCK=false
```

---

**Not**: Şu anda tüm data mock/static. Backend hazır olduğunda API entegrasyonu yapılabilir.
