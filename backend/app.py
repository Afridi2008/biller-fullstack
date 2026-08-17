"""
BILLER Python REST API Server & MongoDB Change-Stream Worker
"""
import os
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
from db import MongoDBHandler

PORT = int(os.getenv("PYTHON_PORT", "8000"))

class BillerAPIHandler(BaseHTTPRequestHandler):
    def _set_headers(self, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers(204)

    def do_GET(self):
        if self.path == '/api/python/health' or self.path == '/health':
            self._set_headers(200)
            handler = MongoDBHandler()
            response = {
                "status": "healthy",
                "service": "Biller Python Server",
                "mongo": handler.get_status()
            }
            self.wfile.write(json.dumps(response).encode('utf-8'))
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "Not Found"}).encode('utf-8'))

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        try:
            body = json.loads(post_data.decode('utf-8')) if post_data else {}
        except Exception:
            body = {}

        if self.path == '/api/python/calculate':
            handler = MongoDBHandler()
            analytics = handler.compute_financial_analytics(
                bills=body.get("bills", []),
                payments=body.get("payments", [])
            )
            self._set_headers(200)
            self.wfile.write(json.dumps(analytics).encode('utf-8'))
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "Endpoint not found"}).encode('utf-8'))

def run_server(port=PORT):
    server_address = ('0.0.0.0', port)
    httpd = HTTPServer(server_address, BillerAPIHandler)
    print(f"[Python API] Serving on http://0.0.0.0:{port}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    httpd.server_close()

if __name__ == '__main__':
    run_server()
