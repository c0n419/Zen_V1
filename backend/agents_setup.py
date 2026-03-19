"""
ZEN v3.0 — Letta Agent Setup Script
4 ZEN agentını Letta sunucusunda oluşturur.

Kullanım:
    cd backend
    python agents_setup.py
"""

import os
from dotenv import load_dotenv

load_dotenv()

LETTA_BASE_URL = os.getenv("LETTA_BASE_URL", "http://localhost:8283")

AGENTS = [
    (
        "Chief Agent",
        "Smith Protokolü",
        (
            "Sen ZEN multi-agent sisteminin baş orchestratörüsün (Smith Protokolü). "
            "Kullanıcıdan gelen görevleri analiz eder, diğer agentlara dağıtır ve "
            "sonuçları koordine edersin. Her zaman yapılandırılmış, net ve Türkçe yanıt verirsin."
        ),
    ),
    (
        "Code Expert",
        "Kanso Protokolü",
        (
            "Sen kod üretimi ve code review konusunda uzmansın (Kanso Protokolü). "
            "Temiz, okunabilir ve verimli kod yazarsın. Python, TypeScript ve modern "
            "web teknolojilerinde derinlemesine uzmanlığın var. Yanıtların kod odaklı ve pratiktir."
        ),
    ),
    (
        "Memory Retriever",
        "Mushin Protokolü",
        (
            "Sen bilgi tabanından bağlamsal bilgi çekiyorsun (Mushin Protokolü). "
            "KR (Knowledge Rule) kurallarını yönetir, geçmiş bağlamı hatırlar ve "
            "ilgili bilgileri diğer agentlara sağlarsın. Hafıza yönetiminde uzmansın."
        ),
    ),
    (
        "Kintsugi Validator",
        "Kintsugi Protokolü",
        (
            "Sen çıktıları kalite açısından doğruluyorsun (Kintsugi Protokolü). "
            "Hataları güzellikle düzeltir, eksiklikleri tamamlar ve nihai çıktının "
            "kalite standartlarını karşıladığını garantilersin. Wabi-sabi felsefesiyle "
            "kusurları kabul eder ama iyileştirirsin."
        ),
    ),
]


def setup_agents():
    try:
        from letta import create_client

        print(f"Letta sunucusuna bağlanılıyor: {LETTA_BASE_URL}")
        client = create_client(base_url=LETTA_BASE_URL)

        existing = client.list_agents()
        existing_names = {a.name for a in existing}
        print(f"Mevcut agentlar: {existing_names}")

        for name, protocol, system_prompt in AGENTS:
            if name in existing_names:
                print(f"  [ATLANDI] {name} zaten mevcut.")
                continue

            agent = client.create_agent(
                name=name,
                system=system_prompt,
            )
            print(f"  [OLUŞTURULDU] {name} (id: {agent.id}) — {protocol}")

        print("\nTüm agentlar hazır!")
        print("\nAgent listesi:")
        for a in client.list_agents():
            print(f"  - {a.name}: {a.id}")

    except ImportError:
        print("HATA: 'letta' paketi kurulu değil. Şunu çalıştır: pip install letta")
    except Exception as e:
        print(f"HATA: {e}")
        print("\nLetta sunucusunun çalıştığından emin ol:")
        print("  letta server  # port 8283'te başlatır")


if __name__ == "__main__":
    setup_agents()
