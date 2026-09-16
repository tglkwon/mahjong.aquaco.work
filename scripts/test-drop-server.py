#!/usr/bin/env python3
"""
Mahjong Project - Mobile Test Drop Receiver Server
Lightweight Python stdlib HTTP server for receiving test photos, videos, and scan frames
from mobile devices via Cloudflare Quick Tunnel and storing them directly into ./uploads.
"""

import http.server
import socketserver
import json
import os
import sys
import time
import secrets
import threading
from urllib.parse import urlparse
from pathlib import Path

DEFAULT_PORT = 8899
RESEARCH_DATA_ROOT = Path(__file__).resolve().parent.parent / "research-data"
DEFAULT_DEVICE = "rex3"
DEVICE_DIR_MAP = {
    "rex3": "rex 3",
    "rex 3": "rex 3",
    "rexx3": "rex 3",
    "rexx 3": "rex 3",
    "jpex": "jp-ex",
    "jp-ex": "jp-ex",
    "jpcolor": "jp-color",
    "jp-color": "jp-color",
}
MAX_FILE_SIZE_BYTES = 1024 * 1024 * 1024  # 1 GB
CHUNK_SIZE_LIMIT = 20 * 1024 * 1024       # 20 MB per chunk

def resolve_device_output_dir(device_name=None):
    if not device_name:
        device_name = SESSION_DATA.get("default_device", DEFAULT_DEVICE)
    norm_key = str(device_name).strip().lower()
    subdir = DEVICE_DIR_MAP.get(norm_key)
    if not subdir:
        import re
        safe_name = re.sub(r'[^a-zA-Z0-9_\- ]', '', str(device_name)).strip()
        subdir = safe_name if safe_name else "rex 3"

    custom = SESSION_DATA.get("custom_output_dir")
    if custom:
        return (custom / subdir).resolve()
    return (RESEARCH_DATA_ROOT / subdir).resolve()

SESSION_DATA = {
    "token": "",
    "default_device": DEFAULT_DEVICE,
    "custom_output_dir": None,
    "completed_file": None,
    "status": "ready",
    "temp_dir": Path(os.environ.get("TEMP", "/tmp")) / "mahjong_mobile_drop",
    "server_instance": None,
    "continuous": True,
}

class MobileDropHTTPHandler(http.server.BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        sys.stderr.write(f"[{time.strftime('%H:%M:%S')}] {args[0]} {args[1]}\n")

    def _send_json(self, status_code, data):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "X-Session-Token, X-Upload-Id, X-Chunk-Index, X-Total-Chunks, X-File-Name, X-Total-Size, X-Target-Device, Content-Type")
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/status":
            self._send_json(200, {
                "status": SESSION_DATA["status"],
                "completed_file": str(SESSION_DATA["completed_file"]) if SESSION_DATA["completed_file"] else None,
                "continuous": SESSION_DATA["continuous"],
                "default_device": SESSION_DATA["default_device"],
                "supported_devices": ["rex 3", "jp-ex", "jp-color"]
            })
            return
        self._send_json(200, {"message": "mahjong mobile test drop server is running."})

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        token = self.headers.get("X-Session-Token", "").strip()
        if token != SESSION_DATA["token"]:
            self._send_json(401, {"error": "유효하지 않거나 일치하지 않는 세션 PIN입니다."})
            return

        if path == "/upload/chunk":
            try:
                upload_id = self.headers.get("X-Upload-Id")
                chunk_index = int(self.headers.get("X-Chunk-Index", "-1"))
                total_chunks = int(self.headers.get("X-Total-Chunks", "-1"))
                total_size = int(self.headers.get("X-Total-Size", "0"))

                if not upload_id or chunk_index < 0 or total_chunks <= 0:
                    self._send_json(400, {"error": "필수 청크 헤더가 누락되었습니다."})
                    return

                if total_size > MAX_FILE_SIZE_BYTES:
                    self._send_json(413, {"error": "파일 크기 초과 (최대 1GB)"})
                    return

                content_len = int(self.headers.get("Content-Length", "0"))
                if content_len > CHUNK_SIZE_LIMIT:
                    self._send_json(413, {"error": "청크 크기 초과"})
                    return

                chunk_data = self.rfile.read(content_len)

                chunk_dir = SESSION_DATA["temp_dir"] / upload_id
                chunk_dir.mkdir(parents=True, exist_ok=True)
                chunk_file = chunk_dir / f"chunk_{chunk_index:05d}.part"
                with open(chunk_file, "wb") as f:
                    f.write(chunk_data)

                SESSION_DATA["status"] = "receiving"
                self._send_json(200, {"success": True, "chunk_index": chunk_index})
            except Exception as e:
                self._send_json(500, {"error": f"청크 저장 오류: {str(e)}"})
            return

        if path == "/upload/complete":
            try:
                content_len = int(self.headers.get("Content-Length", "0"))
                body_raw = self.rfile.read(content_len).decode("utf-8")
                payload = json.loads(body_raw)

                upload_id = payload.get("upload_id")
                raw_file_name = payload.get("file_name", "uploaded_file.bin")

                clean_name = os.path.basename(raw_file_name).replace(" ", "_")
                chunk_dir = SESSION_DATA["temp_dir"] / upload_id
                if not chunk_dir.exists():
                    self._send_json(404, {"error": "청크 디렉터리를 찾을 수 없습니다."})
                    return

                chunk_files = sorted(list(chunk_dir.glob("chunk_*.part")))
                if not chunk_files:
                    self._send_json(400, {"error": "저장된 청크가 없습니다."})
                    return

                out_dir = resolve_device_output_dir(
                    self.headers.get("X-Target-Device") or payload.get("device") or payload.get("target_device")
                )
                out_dir.mkdir(parents=True, exist_ok=True)
                final_path = out_dir / clean_name

                # Prevent overwrite
                stem = final_path.stem
                ext = final_path.suffix
                counter = 1
                while final_path.exists():
                    final_path = out_dir / f"{stem}_{counter}{ext}"
                    counter += 1

                with open(final_path, "wb") as outfile:
                    for cf in chunk_files:
                        with open(cf, "rb") as infile:
                            outfile.write(infile.read())

                # Clean up chunk temp dir
                for cf in chunk_files:
                    try:
                        cf.unlink()
                    except Exception:
                        pass
                try:
                    chunk_dir.rmdir()
                except Exception:
                    pass

                final_size = final_path.stat().st_size
                print(f"\n[SUCCESS] 파일 수신 완료: {final_path.name} -> {out_dir.name} ({final_size} bytes)")
                SESSION_DATA["completed_file"] = final_path

                self._send_json(200, {
                    "success": True,
                    "file_path": str(final_path),
                    "filename": final_path.name,
                    "size_bytes": final_size,
                    "target_device": out_dir.name,
                    "output_dir": str(out_dir),
                    "message": f"파일이 PC {out_dir.name} 디렉터리에 안전하게 저장되었습니다."
                })

                if not SESSION_DATA["continuous"]:
                    def delayed_stop():
                        time.sleep(3)
                        if SESSION_DATA["server_instance"]:
                            SESSION_DATA["server_instance"].shutdown()
                    threading.Thread(target=delayed_stop, daemon=True).start()
                else:
                    SESSION_DATA["status"] = "ready"
            except Exception as e:
                self._send_json(500, {"error": f"파일 병합 실패: {str(e)}"})
            return

        self._send_json(404, {"error": "Not Found"})

class ThreadedHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True

def run_server(port=DEFAULT_PORT, token=None, output_dir=None, device=DEFAULT_DEVICE, continuous=True):
    if not token:
        token = f"{secrets.randbelow(900000) + 100000}"
    SESSION_DATA["token"] = token
    SESSION_DATA["continuous"] = continuous
    SESSION_DATA["default_device"] = device or DEFAULT_DEVICE
    if output_dir:
        SESSION_DATA["custom_output_dir"] = Path(output_dir).resolve()

    initial_out_dir = resolve_device_output_dir(SESSION_DATA["default_device"])
    initial_out_dir.mkdir(parents=True, exist_ok=True)
    SESSION_DATA["temp_dir"].mkdir(parents=True, exist_ok=True)

    server = ThreadedHTTPServer(("127.0.0.1", port), MobileDropHTTPHandler)
    SESSION_DATA["server_instance"] = server

    print(f"SERVER_PORT: {port}")
    print(f"SESSION_TOKEN: {token}")
    print(f"DEFAULT_DEVICE: {SESSION_DATA['default_device']}")
    print(f"OUTPUT_DIR: {initial_out_dir}")
    print(f"MODE: {'CONTINUOUS' if continuous else '1-SHOT'}")
    sys.stdout.flush()

    try:
        server.serve_forever()
    finally:
        server.server_close()
        print("SERVER_STOPPED")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Mahjong Project Mobile Test Drop Server")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help="Port to listen on")
    parser.add_argument("--token", type=str, default="", help="Custom session PIN (6 digits)")
    parser.add_argument("--device", type=str, default=DEFAULT_DEVICE, help="Target device (rex3, jpex, jpcolor)")
    parser.add_argument("--output", type=str, default="", help="Custom output directory base")
    parser.add_argument("--one-shot", action="store_true", help="Shut down after 1 file")
    args = parser.parse_args()

    out_dir = args.output if args.output else None
    run_server(port=args.port, token=args.token, output_dir=out_dir, device=args.device, continuous=not args.one_shot)
