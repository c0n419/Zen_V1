"""
ZEN v3.0 — Tool Engine
Agentlara bash, dosya okuma/yazma, HTTP ve sistem erişimi sağlar.
"""

import asyncio
import os
import tempfile
import httpx
import psutil
from pathlib import Path

MAX_OUTPUT = 8000   # char cinsinden max çıktı uzunluğu
MAX_TIMEOUT = 120   # saniye
HOME_DIR = str(Path.home())

# ─── Tool Schemas (OpenAI-uyumlu format) ──────────────────────────────────────

TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "shell",
            "description": (
                "Sistemde bash komutu çalıştırır. "
                "Dosya işlemleri, süreç yönetimi, git, python betiği çalıştırma, "
                "paket kurulumu ve servis kontrolü için kullan."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "command": {
                        "type": "string",
                        "description": "Çalıştırılacak bash komutu"
                    },
                    "cwd": {
                        "type": "string",
                        "description": "Komutun çalışacağı dizin (varsayılan: home dizini)"
                    },
                    "timeout": {
                        "type": "integer",
                        "description": "Zaman aşımı saniye cinsinden (varsayılan: 30, max: 120)"
                    }
                },
                "required": ["command"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "read_file",
            "description": "Bir dosyanın içeriğini okur. Kod inceleme, config okuma ve log analizi için kullan.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "Dosya yolu (mutlak veya göreceli)"
                    },
                    "start_line": {
                        "type": "integer",
                        "description": "Kaçıncı satırdan okumaya başlanacak (1'den başlar)"
                    },
                    "end_line": {
                        "type": "integer",
                        "description": "Kaçıncı satırda okuma biteceği"
                    }
                },
                "required": ["path"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "write_file",
            "description": "Dosyaya içerik yazar. Dosya oluşturur veya üzerine yazar. Kod üretimi ve config güncelleme için kullan.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "Yazılacak dosya yolu"
                    },
                    "content": {
                        "type": "string",
                        "description": "Dosyaya yazılacak içerik"
                    },
                    "append": {
                        "type": "boolean",
                        "description": "True ise dosyanın sonuna ekler, False ise üzerine yazar (varsayılan: false)"
                    }
                },
                "required": ["path", "content"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "list_dir",
            "description": "Bir dizinin içeriğini listeler. Proje yapısını keşfetmek için kullan.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "Listelenecek dizin yolu (varsayılan: home dizini)"
                    },
                    "show_hidden": {
                        "type": "boolean",
                        "description": "Gizli dosyaları da göster (varsayılan: false)"
                    }
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_files",
            "description": "Dosya içinde metin arar (grep) veya ada göre dosya bulur (find). Kod içinde fonksiyon, sınıf ve hata araması için kullan.",
            "parameters": {
                "type": "object",
                "properties": {
                    "pattern": {
                        "type": "string",
                        "description": "Aranacak metin veya regex deseni"
                    },
                    "path": {
                        "type": "string",
                        "description": "Arama yapılacak dizin veya dosya (varsayılan: home)"
                    },
                    "file_pattern": {
                        "type": "string",
                        "description": "Hangi dosya uzantılarında aranacağı (örn: '*.py', '*.ts')"
                    },
                    "find_files": {
                        "type": "boolean",
                        "description": "True ise içerik değil dosya adına göre arar"
                    }
                },
                "required": ["pattern"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "python_eval",
            "description": "Python kodu çalıştırır ve çıktısını döner. Hesaplama, veri analizi ve test scripti için kullan.",
            "parameters": {
                "type": "object",
                "properties": {
                    "code": {
                        "type": "string",
                        "description": "Çalıştırılacak Python kodu"
                    }
                },
                "required": ["code"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "http_request",
            "description": "HTTP isteği gönderir. Lokal servisler, API'ler veya web endpointleriyle etkileşim için kullan.",
            "parameters": {
                "type": "object",
                "properties": {
                    "url": {
                        "type": "string",
                        "description": "İstek gönderilecek URL"
                    },
                    "method": {
                        "type": "string",
                        "description": "HTTP metodu: GET, POST, PUT, DELETE (varsayılan: GET)"
                    },
                    "body": {
                        "type": "string",
                        "description": "İstek gövdesi (JSON string)"
                    },
                    "headers": {
                        "type": "object",
                        "description": "HTTP başlıkları (key-value)"
                    }
                },
                "required": ["url"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_system_info",
            "description": "Sistemin anlık durumunu getirir: CPU, RAM, disk kullanımı ve isteğe bağlı olarak en çok kaynak kullanan süreçler.",
            "parameters": {
                "type": "object",
                "properties": {
                    "include_processes": {
                        "type": "boolean",
                        "description": "En çok kaynak kullanan süreçleri de getir (varsayılan: false)"
                    }
                }
            }
        }
    }
]


# ─── Execution Engine ──────────────────────────────────────────────────────────

async def execute_tool(name: str, args: dict) -> str:
    """Verilen tool'u çalıştırır, sonucu string olarak döner."""
    try:
        if name == "shell":
            return await _shell(args)
        elif name == "read_file":
            return _read_file(args)
        elif name == "write_file":
            return _write_file(args)
        elif name == "list_dir":
            return _list_dir(args)
        elif name == "search_files":
            return await _search_files(args)
        elif name == "python_eval":
            return await _python_eval(args)
        elif name == "http_request":
            return await _http_request(args)
        elif name == "get_system_info":
            return _get_system_info(args)
        else:
            return f"Hata: Bilinmeyen tool '{name}'"
    except Exception as e:
        return f"Tool çalışma hatası [{name}]: {str(e)}"


# ─── Tool Implementations ──────────────────────────────────────────────────────

async def _shell(args: dict) -> str:
    command = args.get("command", "")
    cwd = args.get("cwd", HOME_DIR)
    timeout = min(int(args.get("timeout", 30)), MAX_TIMEOUT)

    if not os.path.isdir(cwd):
        cwd = HOME_DIR

    proc = await asyncio.create_subprocess_shell(
        command,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.STDOUT,
        cwd=cwd,
    )
    try:
        stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=timeout)
    except asyncio.TimeoutError:
        proc.kill()
        return f"Zaman aşımı: komut {timeout} saniyede tamamlanamadı"

    output = stdout.decode("utf-8", errors="replace")
    if len(output) > MAX_OUTPUT:
        output = output[:MAX_OUTPUT] + f"\n\n... [çıktı kesildi, toplam {len(output)} karakter]"

    rc = proc.returncode
    prefix = f"[çıkış kodu: {rc}]\n" if rc != 0 else ""
    return prefix + (output or "(çıktı yok)")


def _read_file(args: dict) -> str:
    path = args.get("path", "")
    start = args.get("start_line")
    end = args.get("end_line")

    try:
        with open(path, "r", errors="replace") as f:
            lines = f.readlines()
        if start or end:
            s = (start or 1) - 1
            e = end or len(lines)
            lines = lines[s:e]
        content = "".join(lines)
        if len(content) > MAX_OUTPUT:
            content = content[:MAX_OUTPUT] + "\n... [kesildi]"
        return content or "(boş dosya)"
    except FileNotFoundError:
        return f"Hata: Dosya bulunamadı: {path}"
    except Exception as e:
        return f"Dosya okuma hatası: {e}"


def _write_file(args: dict) -> str:
    path = args.get("path", "")
    content = args.get("content", "")
    append = args.get("append", False)

    try:
        parent = os.path.dirname(os.path.abspath(path))
        os.makedirs(parent, exist_ok=True)
        mode = "a" if append else "w"
        with open(path, mode, encoding="utf-8") as f:
            f.write(content)
        action = "eklendi" if append else "yazıldı"
        return f"Dosya {action}: {path} ({len(content)} karakter)"
    except Exception as e:
        return f"Dosya yazma hatası: {e}"


def _list_dir(args: dict) -> str:
    path = args.get("path", HOME_DIR)
    show_hidden = args.get("show_hidden", False)

    try:
        entries = []
        for entry in sorted(os.scandir(path), key=lambda e: (not e.is_dir(), e.name)):
            if not show_hidden and entry.name.startswith("."):
                continue
            if entry.is_dir():
                entries.append(f"[DIR]  {entry.name}/")
            else:
                size = entry.stat().st_size
                entries.append(f"[FILE] {entry.name}  ({_fmt_size(size)})")
        return "\n".join(entries) if entries else "(boş dizin)"
    except Exception as e:
        return f"Dizin okuma hatası: {e}"


def _fmt_size(n: int) -> str:
    for u in ["B", "KB", "MB", "GB"]:
        if n < 1024:
            return f"{n:.0f} {u}"
        n /= 1024  # type: ignore[assignment]
    return f"{n:.1f} TB"


async def _search_files(args: dict) -> str:
    pattern = args.get("pattern", "")
    path = args.get("path", HOME_DIR)
    file_pattern = args.get("file_pattern", "")
    find_files = args.get("find_files", False)

    if find_files:
        cmd = f'find {path} -name "{pattern}" 2>/dev/null | head -50'
    elif file_pattern:
        cmd = f'grep -r --include="{file_pattern}" -n "{pattern}" {path} 2>/dev/null | head -100'
    else:
        cmd = f'grep -r -n "{pattern}" {path} 2>/dev/null | head -100'

    return await _shell({"command": cmd})


async def _python_eval(args: dict) -> str:
    code = args.get("code", "")
    with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False) as f:
        f.write(code)
        tmp = f.name
    result = await _shell({"command": f"python3 {tmp}", "timeout": 30})
    try:
        os.unlink(tmp)
    except OSError:
        pass
    return result


async def _http_request(args: dict) -> str:
    url = args.get("url", "")
    method = args.get("method", "GET").upper()
    body = args.get("body")
    headers = args.get("headers", {})

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.request(method, url, content=body, headers=headers)

    text = resp.text
    if len(text) > MAX_OUTPUT:
        text = text[:MAX_OUTPUT] + "\n... [kesildi]"
    return f"HTTP {resp.status_code}\n{text}"


def _get_system_info(args: dict) -> str:
    include_procs = args.get("include_processes", False)
    cpu = psutil.cpu_percent(interval=0.5)
    ram = psutil.virtual_memory()
    disk = psutil.disk_usage("/")
    lines = [
        f"CPU:  {cpu:.1f}%",
        f"RAM:  {ram.percent:.1f}%  "
        f"({ram.used // 1024 // 1024} MB / {ram.total // 1024 // 1024} MB)",
        f"Disk: {disk.percent:.1f}%  "
        f"({disk.used // 1024 // 1024 // 1024:.1f} GB / {disk.total // 1024 // 1024 // 1024:.1f} GB)",
    ]
    if include_procs:
        procs = sorted(
            psutil.process_iter(["pid", "name", "cpu_percent", "memory_percent"]),
            key=lambda p: p.info.get("cpu_percent") or 0,
            reverse=True,
        )[:10]
        lines.append("\nEn çok kaynak kullanan süreçler:")
        for p in procs:
            lines.append(
                f"  PID {p.info['pid']:6}  {p.info['name'][:20]:<20}  "
                f"CPU: {p.info.get('cpu_percent', 0):.1f}%  "
                f"MEM: {p.info.get('memory_percent', 0):.1f}%"
            )
    return "\n".join(lines)
