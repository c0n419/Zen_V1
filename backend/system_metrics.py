"""
ZEN v3.0 — System Metrics Collector
psutil + GPUtil ile gerçek GPU/RAM/Disk metrikleri
"""

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


def get_disk_metrics() -> dict:
    """Disk I/O hızını döner (MB/s)."""
    try:
        io1 = psutil.disk_io_counters()
        import time
        time.sleep(0.1)
        io2 = psutil.disk_io_counters()

        read_mb = (io2.read_bytes - io1.read_bytes) / (1024 ** 2) / 0.1
        write_mb = (io2.write_bytes - io1.write_bytes) / (1024 ** 2) / 0.1
        total_mb = read_mb + write_mb

        # Disk kullanım yüzdesi (ana partition)
        usage = psutil.disk_usage("/")
        disk_percent = usage.percent

        return {
            "value": f"{total_mb:.1f} MB/s",
            "read": f"{read_mb:.1f} MB/s",
            "write": f"{write_mb:.1f} MB/s",
            "percentage": int(min(disk_percent, 100)),
        }
    except Exception:
        usage = psutil.disk_usage("/")
        return {
            "value": "N/A",
            "read": "0 MB/s",
            "write": "0 MB/s",
            "percentage": int(usage.percent),
        }


def get_all_system_metrics() -> dict:
    """Tüm sistem metriklerini tek seferde döner."""
    return {
        "gpu": get_gpu_metrics(),
        "ram": get_ram_metrics(),
        "disk": get_disk_metrics(),
    }
