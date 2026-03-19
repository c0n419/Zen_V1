"""
ZEN v3.0 — System Metrics Collector (Async-Safe)
psutil + GPUtil ile gerçek GPU/RAM/Disk metrikleri (async-safe yapı)
"""

import asyncio
import psutil

try:
    import GPUtil
    GPU_AVAILABLE = True
except ImportError:
    GPU_AVAILABLE = False


def get_gpu_metrics() -> list[dict]:
    """NVIDIA GPU kullanım oranlarını döner. GPU yoksa mock data."""
    if not GPU_AVAILABLE:
        return [
            {"label": "GPU (Simüle)", "value": "0%", "percentage": 0}
        ]

    try:
        gpus = GPUtil.getGPUs()
        if not gpus:
            return [{"label": "GPU bulunamadı", "value": "N/A", "percentage": 0}]

        return [
            {
                "label": gpu.name,
                "value": f"{int(gpu.load * 100)}%",
                "percentage": int(gpu.load * 100),
            }
            for gpu in gpus
        ]
    except Exception:
        return [{"label": "GPU Hatası", "value": "N/A", "percentage": 0}]


def get_ram_metrics() -> dict:
    """RAM kullanım bilgisini döner."""
    mem = psutil.virtual_memory()
    used_gb = mem.used / (1024 ** 3)
    total_gb = mem.total / (1024 ** 3)
    return {
        "value": f"{used_gb:.1f} GB",
        "total": f"{total_gb:.1f} GB",
        "percentage": mem.percent,
    }


async def get_disk_metrics_async() -> dict:
    """Disk I/O hızını döner (MB/s). psutil disk_io_counters() bloke edici olduğu için asyncio.to_thread kullanır."""
    try:
        io1 = await asyncio.to_thread(psutil.disk_io_counters)
        await asyncio.sleep(0.1)
        io2 = await asyncio.to_thread(psutil.disk_io_counters)

        read_mb = (io2.read_bytes - io1.read_bytes) / (1024 ** 2) / 0.1
        write_mb = (io2.write_bytes - io1.write_bytes) / (1024 ** 2) / 0.1
        total_mb = read_mb + write_mb

        # Disk kullanım yüzdesi — bu da bloke edici; to_thread ile
        usage = await asyncio.to_thread(psutil.disk_usage, "/")
        disk_percent = usage.percent

        return {
            "value": f"{total_mb:.1f} MB/s",
            "read": f"{read_mb:.1f} MB/s",
            "write": f"{write_mb:.1f} MB/s",
            "percentage": int(min(disk_percent, 100)),
        }
    except Exception:
        # Fallback: disk_usage da async olmalı
        try:
            usage = await asyncio.to_thread(psutil.disk_usage, "/")
            return {
                "value": "N/A",
                "read": "0 MB/s",
                "write": "0 MB/s",
                "percentage": int(usage.percent),
            }
        except Exception:
            return {
                "value": "N/A",
                "read": "0 MB/s",
                "write": "0 MB/s",
                "percentage": 0,
            }


async def get_all_system_metrics_async() -> dict:
    """Tüm sistem metriklerini tek seferde döner (async-safe)."""
    return {
        "gpu": get_gpu_metrics(),           # zaten blocking değil → senkronically ok
        "ram": get_ram_metrics(),           # psutil virtual_memory → hafif, sync kabul edilebilir
        "disk": await get_disk_metrics_async(),
    }


# Backward compatibility için eski senkronik fonksiyonlar (eski API'ler için)
def get_disk_metrics() -> dict:
    """[DEPRECATED] Disk I/O hızını döner. Async-safe versiyonu `get_disk_metrics_async()` kullan."""
    return asyncio.run(get_disk_metrics_async())


def get_all_system_metrics() -> dict:
    """[DEPRECATED] Tüm sistem metriklerini döner. Async-safe versiyonu `get_all_system_metrics_async()` kullan."""
    return asyncio.run(get_all_system_metrics_async())
