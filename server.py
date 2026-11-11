#!/usr/bin/env python3
"""
Simple HTTP Server for hosting the Scribe Sigil website on local network.
Run this script and access the website from any device on your local network.
"""

import http.server
import socketserver
import socket
import os
import sys

# Configuration
PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))


def get_local_ip():
    """Get the local IP address of this machine."""
    try:
        # Create a socket to determine the local IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        # Connect to an external address (doesn't actually send data)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except Exception:
        return "127.0.0.1"


class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Custom request handler to serve files from the specified directory."""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def end_headers(self):
        # Add headers to prevent caching during development
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.send_header('Expires', '0')
        super().end_headers()


def main():
    """Start the HTTP server."""
    # Change to the directory containing this script
    os.chdir(DIRECTORY)
    
    # Get local IP address
    local_ip = get_local_ip()
    
    # Create server
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        print("=" * 60)
        print("🌐 Scribe Sigil Server Started!")
        print("=" * 60)
        print(f"\n📂 Serving files from: {DIRECTORY}\n")
        print("Access your website at:")
        print(f"  • Local:   http://localhost:{PORT}")
        print(f"  • Network: http://{local_ip}:{PORT}")
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
