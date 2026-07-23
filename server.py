import http.server
import socketserver
import socket
import sys

PORT = 8080

def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('8.8.8.8', 80))
        return s.getsockname()[0]
    except Exception:
        return '127.0.0.1'
    finally:
        s.close()

Handler = http.server.SimpleHTTPRequestHandler
Handler.extensions_map.update({
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.css': 'text/css',
    '.html': 'text/html',
    '.webmanifest': 'application/manifest+json',
})

ip = get_local_ip()

with socketserver.TCPServer(("0.0.0.0", PORT), Handler) as httpd:
    print(f"")
    print(f"  StudyPlanner Server Running!")
    print(f"")
    print(f"  PC access:   http://localhost:{PORT}")
    print(f"  Phone access: http://{ip}:{PORT}")
    print(f"")
    print(f"  Make sure your phone is connected to the same WiFi.")
    print(f"  Open the above Phone URL in your phone browser.")
    print(f"  Press Ctrl+C to stop.")
    print(f"")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
