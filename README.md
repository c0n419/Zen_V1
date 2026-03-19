# ZEN v3.0 — Multi-Agent Dashboard

> Smith Protokolü ile çalışan, Ollama tabanlı çok ajanlı yapay zeka yönetim paneli.

![ZEN Dashboard](https://img.shields.io/badge/ZEN-v3.0-00D9FF?style=for-the-badge)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi)
![Ollama](https://img.shields.io/badge/Ollama-Local_LLM-black?style=for-the-badge)

## Özellikler

- **4 Özel AI Ajan** — Chief Agent (Smith), Code Expert (Kanso), Memory Retriever (Mushin), Kintsugi Validator
- **Gerçek Zamanlı Metrikler** — GPU / RAM / Disk kullanımı (psutil)
- **Canlı Chat Arayüzü** — Her ajanla ayrı sohbet geçmişi, çok turlu konuşma
- **WebSocket Dashboard** — 5 saniyede bir canlı güncelleme
- **Ajan Yönetimi** — Durdur/Başlat, görev gönder, durum izle
- **Aktivite Akışı** — Tüm ajan eylemlerinin kaydı ve arama
- **Ayarlar** — Karanlık mod, vurgu rengi, localStorage kalıcılığı
- **Dark Theme + Neon Gradients** — Modern, göz alıcı tasarım

## Mimari

```
ZEN React Frontend (port 5173)
        │
        │ HTTP REST + WebSocket
        ▼
ZEN Bridge API — FastAPI (port 8000)
  ├── GET  /api/agents/status
  ├── POST /api/agents/{id}/task
  ├── GET  /api/agents/{id}/history
  ├── PATCH /api/agents/{id}/status
  ├── GET  /api/system/metrics
  ├── GET  /api/activities/recent
  ├── GET  /api/metrics/dashboard
  ├── GET  /api/performance/weekly
  ├── GET  /api/tasks/distribution
  └── WS   /ws/dashboard
        │
        │ OpenAI-compatible REST API
        ▼
Ollama Local LLM Server (port 11434)
  └── Model: rnj-1:8b (Gemma3 8.3B)
```

## Hızlı Başlangıç

### Gereksinimler

- Node.js 18+
- Python 3.10+
- [Ollama](https://ollama.com) kurulu ve çalışıyor olmalı

### 1. Ollama Kurulumu

```bash
# Ollama'yı kur (zaten kuruluysa atla)
curl -fsSL https://ollama.com/install.sh | sh

# Model indir (veya mevcut modelinizi backend/.env içinde belirtin)
ollama pull gemma3:8b
```

### 2. Backend Kurulumu

```bash
cd backend

# Sanal ortam oluştur
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Bağımlılıkları kur
pip install -r requirements.txt

# Ortam değişkenlerini ayarla
# .env dosyasını düzenle: OLLAMA_MODEL=<modeliniz>

# Backend'i başlat
uvicorn main:app --reload --port 8000
```

### 3. Frontend Kurulumu

```bash
# Proje kök dizininde
npm install

# Frontend'i başlat
npm run dev
```

### 4. Dashboard'u Aç

```
http://localhost:5173
```

## 📦 Component'ler

### Layout
- `Header` - Üst navigasyon bar
- `BottomNav` - Alt navigasyon (mobil-optimized)

### UI
- `GradientCard` - Gradient border kartlar
- `MetricCard` - KPI metrikleri

### Charts
- `GradientBarChart` - Bar grafik
- `AnimatedLineChart` - Line/Area grafik
- `DonutChart` - Halka grafik

### Dashboard
- `StatusStories` - Agent status viewer
- `AgentStatusCard` - Agent listesi
- `PerformanceChart` - 7 günlük performans
- `TaskDistribution` - Görev dağılımı
- `SystemMetrics` - GPU/RAM/Disk metrikleri
- `RecentActivity` - Son aktiviteler
- `QuickActions` - Hızlı erişim butonları

## 🎨 Tasarım Sistemi

### Renk Paleti

```css
Primary (Cyan):    #00D9FF
Secondary (Purple): #8B5CF6
Accent (Magenta):  #FF00E5
Success (Green):   #10B981
Warning (Yellow):  #FBBF24
Background:        #0A0A14
Card:              #1A1A2E
```

### Gradient Presets

- **Cyan**: `from-[#00D9FF] to-[#0EA5E9]`
- **Magenta**: `from-[#FF00E5] to-[#8B5CF6]`
- **Yellow**: `from-[#FBBF24] to-[#F59E0B]`
- **Green**: `from-[#10B981] to-[#059669]`

## 📖 Dokümantasyon

- 📋 **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - Proje özeti ve tamamlanan işler
- 🔌 **[INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)** - Backend entegrasyon rehberi
- 🎨 **[COMPONENT_SHOWCASE.md](./COMPONENT_SHOWCASE.md)** - Component kullanım örnekleri

## 🔌 Backend Entegrasyonu

Dashboard şu anda mock data kullanıyor. Backend hazır olduğunda:

1. `/src/app/lib/api.ts` dosyasındaki API fonksiyonlarını güncelle
2. Environment variables'ı ayarla (`.env`)
3. WebSocket connection'ı aktif et (opsiyonel)

Detaylı bilgi için: [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)

## 🛠 Teknoloji Stack

- **Frontend**: React 18.3.1 + TypeScript
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts 2.15
- **Animations**: Motion (Framer Motion)
- **Icons**: Lucide React
- **Build**: Vite 6.3

## 📂 Proje Yapısı

```
/src/
├── app/
│   ├── App.tsx              # Ana dashboard
│   ├── components/          # Tüm component'ler
│   │   ├── layout/
│   │   ├── ui/
│   │   ├── charts/
│   │   └── dashboard/
│   └── lib/
│       └── api.ts           # API client
├── styles/
│   ├── theme.css            # ZEN tasarım sistemi
│   ├── index.css            # Custom utilities
│   └── fonts.css
└── imports/                 # Figma imports
```

## 🎯 Öne Çıkan Özellikler

### 1. Instagram-style Status Stories
Agent durumlarını modern story formatında gösterir.

### 2. Gradient Glow Effects
Neon tema ile göz alıcı visual efektler.

### 3. Animated Charts
Smooth animasyonlarla professional data visualization.

### 4. Glassmorphism Cards
Backdrop blur + transparent kartlar ile modern görünüm.

### 5. Live Indicators
Pulsing dots ve progress rings ile real-time feedback.

## 📱 Responsive Breakpoints

- **Mobile**: < 768px (Single column)
- **Tablet**: 768px - 1024px (2 columns)
- **Desktop**: > 1024px (3-4 columns)

## 🤝 Backend Beklentileri

### REST API Endpoints

```
GET /api/agents/status
GET /api/metrics/dashboard
GET /api/performance/weekly
GET /api/activities/recent
GET /api/tasks/distribution
GET /api/system/metrics
```

### WebSocket (Opsiyonel)

```
ws://localhost:8000/ws/dashboard
```

Real-time updates için WebSocket kullanımı önerilir.

## 🔄 Development Workflow

```bash
# Development mode
pnpm dev

# Type checking
pnpm tsc

# Build production
pnpm build

# Preview production build
pnpm preview
```

## 📝 Kullanım Örnekleri

### Component Import

```tsx
import { 
  MetricCard, 
  GradientCard,
  StatusStories 
} from "./components";

function Dashboard() {
  return (
    <>
      <StatusStories />
      <MetricCard 
        title="Aktif Agentlar" 
        value="4/5" 
        gradient="cyan" 
      />
    </>
  );
}
```

### API Kullanımı

```tsx
import { getAgentStatus } from "./lib/api";

// Component içinde
const agents = await getAgentStatus();
```

## ⚡ Performance

- Lazy loading ile optimize edilmiş bundle size
- Motion animations ile smooth UX
- Responsive images
- Custom scrollbar (lightweight)
- Memoization ready

## 🎯 Roadmap

- [ ] React Query entegrasyonu
- [ ] Dark/Light mode toggle
- [ ] Export functionality (PDF/CSV)
- [ ] Advanced filtering
- [ ] Agent detail pages
- [ ] Settings page
- [ ] User authentication
- [ ] Multi-language support

## 📄 Lisans

Bu proje ZEN v3.0 Multi-Agent Framework'ün bir parçasıdır.

## 👤 Geliştirici

Dashboard: Figma Make AI
Backend: Claude Code (size ait)

---

**Durum**: ✅ Production Ready - Backend entegrasyonu bekliyor
**Versiyon**: 1.0.0
**Son Güncelleme**: 10 Mart 2026

## 🆘 Yardım

Sorularınız için:
- 📖 [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)
- 🎨 [COMPONENT_SHOWCASE.md](./COMPONENT_SHOWCASE.md)
- 📋 [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)
