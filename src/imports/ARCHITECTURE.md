# ZEN v3.0 — Mimari Rehberi

> Bu belge, ZEN projesinin tüm bileşenlerini ve nasıl çalıştığını açıklar.
> Smith Protokolü ve Zen v3.0 Otonom Yetenekleri dahil edilmiştir.

---

## Bölüm 1: ZEN Nedir? (Smith Protokolü)

ZEN v3.0, "Smith" Protokolü ile yönetilen, yerel (Ollama) ve bulut (OpenRouter) modellerini hibrit kullanan bir **multi-agent framework**'üdür. 

- **Smith Protokolü:** Çekirdek arabirim; çözüm odaklı, öğretici ve donanım farkındalığına sahip (RTX 4060 Ti / GTX 1050 Ti).
- **Otonomluk:** Ajanlar, Shinobi araçlarını kullanarak kendi kodlarını yazıp test edebilirler.
- **Kintsugi:** Hataları onarır, öğrenir ve `MEMORY.md` üzerinden kuralları (`KR-XXX`) kalıcılaştırır.

---

## Bölüm 3: Dizin Yapısı

```
/home/ninja/zen/neuro-agents/
├── ARCHITECTURE.md          ← Mimari Rehberi
├── config.py                ← Konfigürasyon (.env → AppConfig)
├── main.py                  ← Giriş Noktası
├── .env                     ← API Key'ler ve Model Tanımları
│
├── agents/                  ← Uzman Ajanlar (Smith Çekirdeği)
│   ├── base_agent.py        ← Araç (Tool) desteği + process_tools()
│   ├── chief_agent.py       ← Smith Protokolü & Router: classify(task, memory)
│   ├── memory_retriever.py  ← Mushin Memory: KR-XXX Hafıza Taraması
│   ├── code_expert.py       ← Kanso: Otonom Shinobi Döngüsü (max_steps=3)
│   ├── research_analyst.py  ← Shoshin: Araştırma & Sentez
│   ├── kintsugi_validator.py← Kintsugi: Derin Mantıksal Doğrulama
│   └── context_pruner.py    ← Bonsai: Bellek & Kural Yönetimi
│
├── tools/                   ← Shinobi Araç Seti
│   ├── shinobi_tools.py     ← execute_shell, write_file, read_file, list_dir
│   └── __init__.py
│
├── outputs/                 ← Görev Bazlı İzole Dizinler (Kanso)
│   ├── T-001/               ← Örnek: ZENITH Projesi (Sentinel, Archivist, UI)
│   │   ├── sentinel.py
│   │   ├── data/
│   │   └── backups/
│   └── T-XXX/               ← Her yeni görev için benzersiz ID
│
├── flows/                   ← Ajan İş Akışları (Kintsugi Cycle)
├── registry/                ← Model Skorlama & Dispatcher
├── skills/                  ← Ajan Sistem Promptları (Markdown)
└── memory/
    ├── MEMORY.md            ← Kintsugi Kuralları (KR-XXX)
    └── model_scores.json    ← Model Performans Skorları (EMA)
```

---

## Bölüm 4: Teknik Sözleşmeler

### 4a. BaseAgent ve Shinobi Tools (Araç Desteği)

Her ajan `BaseAgent` üzerinden sistem üzerinde işlem yapma (Impact) yeteneğine sahiptir:
- `execute_tool(name, **kwargs)`: Alt seviye araç tetikleyici.
- `process_tools(content)`: Model yanıtındaki `<tool:NAME ... />` etiketlerini parse eder ve çalıştırır.

### 4b. Otonom Döngü (Self-Correction)

`CodeExpert` gibi uzman ajanlar, bir görevi çözerken 3 adıma kadar (max_tool_steps=3) otonom döngüye girer:
`Düşün → Araç Çağır (write/shell) → Gözlemle (Observation) → Tekrar Dene`.

### 4c. Dosya Organizasyonu (Kanso)
- **Kural:** Tüm otonom üretimler `outputs/T-XXX/` dizini altında toplanmalıdır.
- **Dinamik Yollar:** Scriptler statik yollar yerine `os.path.dirname(__file__)` kullanarak konum-bağımsız çalışmalıdır.

---

## Bölüm 8: Geliştirici Rehberi

### Uzman Ajanlar Tablosu

| Ajan | İlke / Protokol | Görev |
|------|-----------------|-------|
| Chief Agent | Smith Protokolü | Çekirdek Arabirim & Router |
| Memory Retriever | Mushin Memory | KR-XXX Hafıza Taraması |
| Code Expert | Kanso | Otonom Kod & Shinobi Tools |
| Validator | Kintsugi | Derin Mantıksal Doğrulama |
| Context Pruner | Bonsai | Bellek & Kural Yönetimi |

---

*ZEN v3.0 — Smith Protokolü ile: %100 Senkronizasyon, Tam Otonomluk.*
