#!/usr/bin/env python3
"""
HTTP Server and Real-time Synchronization Relay for Scribe Sigil.
Handles local file hosting, mobile device pairing, and bidirectional sensor/call events.
"""

import http.server
import socketserver
import socket
import os
import sys
import json
import time

# Configuration
PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))


def get_tunnel_url():
    """Read dynamic tunnel URL if present."""
    try:
        tunnel_file = os.path.join(DIRECTORY, "tunnel_url.txt")
        if os.path.exists(tunnel_file):
            with open(tunnel_file, "r") as f:
                url = f.read().strip()
                if url:
                    return url
    except Exception:
        pass
    return "https://average-donkey-31.loca.lt"

# Shared game session state between PC and connected phone
GAME_STATE = {
    "phone_connected": False,
    "last_phone_ping": 0,
    "phase": 1,
    "call_1_triggered": False,
    "call_1_active": False,
    "call_1_ended": False,
    "pc_locked": False,
    "shake_required": False,
    "shake_completed": False,
    "call_2_triggered": False,
    "call_2_active": False,
    "call_2_ended": False,
    "pc_recovered": False,
    "last_update": time.time()
}


def get_local_ip():
    """Get the local IP address of this machine."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except Exception:
        return "127.0.0.1"


class ThreadingServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    """Multithreaded server so requests from tunnel and local PC never block each other."""
    daemon_threads = True
    allow_reuse_address = True


class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Custom request handler with REST API endpoints for device pairing and sync."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_OPTIONS(self):
        """Handle CORS preflight requests."""
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        """Handle GET requests for static files and API queries."""
        global GAME_STATE

        # API: Return local IP, public tunnel link, and mobile link
        if self.path == '/api/ip':
            local_ip = get_local_ip()
            tunnel_url = get_tunnel_url()
            phone_url = f"{tunnel_url}/phone.html" if tunnel_url else f"http://{local_ip}:{PORT}/phone.html"
            payload = {
                "ip": local_ip,
                "port": PORT,
                "local_url": f"http://{local_ip}:{PORT}/phone.html",
                "tunnel_url": f"{tunnel_url}/phone.html" if tunnel_url else None,
                "phone_url": phone_url,
                "phone_connected": (time.time() - GAME_STATE.get("last_phone_ping", 0)) < 10
            }
            self.send_json_response(payload)
            return

        # API: Return current shared game state
        if self.path == '/api/state':
            # Check if phone has timed out (10s without ping)
            is_connected = (time.time() - GAME_STATE.get("last_phone_ping", 0)) < 10
            GAME_STATE["phone_connected"] = is_connected
            self.send_json_response(GAME_STATE)
            return

        # API: Reset game state
        if self.path == '/api/reset':
            for k in list(GAME_STATE.keys()):
                if isinstance(GAME_STATE[k], bool):
                    GAME_STATE[k] = False
                elif isinstance(GAME_STATE[k], (int, float)):
                    GAME_STATE[k] = 0
            GAME_STATE["last_update"] = time.time()
            self.send_json_response({"status": "reset", "state": GAME_STATE})
            return

        # Default: Serve static files
        super().do_GET()

    def do_POST(self):
        """Handle POST requests for state changes and events."""
        global GAME_STATE

        if self.path == '/api/action':
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(content_length)
                data = json.loads(body.decode('utf-8'))
                action = data.get('action', '')

                now = time.time()
                GAME_STATE['last_update'] = now

                if action == 'PHONE_PING':
                    GAME_STATE['last_phone_ping'] = now
                    GAME_STATE['phone_connected'] = True

                elif action == 'TRIGGER_CALL_1':
                    GAME_STATE['call_1_triggered'] = True
                    GAME_STATE['call_1_active'] = True
                    GAME_STATE['call_1_ended'] = False

                elif action == 'CALL_1_ANSWERED':
                    GAME_STATE['call_1_active'] = True

                elif action == 'CALL_1_ENDED':
                    GAME_STATE['call_1_active'] = False
                    GAME_STATE['call_1_ended'] = True

                elif action == 'LOCK_PC':
                    GAME_STATE['pc_locked'] = True
                    GAME_STATE['shake_required'] = True

                elif action == 'SHAKE_COMPLETED':
                    GAME_STATE['shake_completed'] = True
                    GAME_STATE['shake_required'] = False
                    GAME_STATE['call_2_triggered'] = True
                    GAME_STATE['call_2_active'] = True

                elif action == 'CALL_2_ENDED':
                    GAME_STATE['call_2_active'] = False
                    GAME_STATE['call_2_ended'] = True

                elif action == 'UNLOCK_PC':
                    GAME_STATE['pc_locked'] = False
                    GAME_STATE['pc_recovered'] = True

                elif action == 'RESET_STATE':
                    for k in list(GAME_STATE.keys()):
                        if isinstance(GAME_STATE[k], bool):
                            GAME_STATE[k] = False
                        elif isinstance(GAME_STATE[k], (int, float)):
                            GAME_STATE[k] = 0
                    GAME_STATE['last_update'] = now

                self.send_json_response({"status": "success", "action": action, "state": GAME_STATE})
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
            return

        self.send_response(404)
        self.end_headers()

    def send_json_response(self, data):
        """Helper to send JSON response with headers."""
        response_bytes = json.dumps(data).encode('utf-8')
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(response_bytes)))
        self.end_headers()
        self.wfile.write(response_bytes)

    def end_headers(self):
        """Add headers to prevent caching and enable cross-origin access."""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.send_header('Expires', '0')
        super().end_headers()


def main():
    """Start the HTTP server."""
    os.chdir(DIRECTORY)
    local_ip = get_local_ip()

    ThreadingServer.allow_reuse_address = True
    with ThreadingServer(("", PORT), MyHTTPRequestHandler) as httpd:
        print("=" * 60)
        print("🌐 Scribe Sigil Server Started with Mobile Sync Relay (Multi-threaded)!")
        print("=" * 60)
        print(f"\n📂 Serving files from: {DIRECTORY}\n")
        print("Access your website at:")
        print(f"  • PC Desktop:   http://localhost:{PORT}")
        print(f"  • Local Wi-Fi:  http://{local_ip}:{PORT}")
        tunnel_url = get_tunnel_url()
        if tunnel_url:
            print(f"  • Public Link:  {tunnel_url}/phone.html")
        else:
            print(f"  • Phone Link:   http://{local_ip}:{PORT}/phone.html")
        print("\n" + "=" * 60)
        print("Press Ctrl+C to stop the server")
        print("=" * 60 + "\n")

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n🛑 Server stopped.")
            sys.exit(0)


if __name__ == "__main__":
    main()

