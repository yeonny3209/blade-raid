import http.server, os, re, base64
ROOT = os.path.dirname(os.path.abspath(__file__))
CT = {'.js': 'application/javascript; charset=utf-8', '.jpg': 'image/jpeg', '.png': 'image/png', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8'}
def clean(path):
    parts = [re.sub(r'[^A-Za-z0-9_.\-]', '', p) for p in path.split('?')[0].split('/') if p]
    return [p for p in parts if p and p not in ('.', '..')]
class H(http.server.BaseHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'
    def _c(self):
        self.send_header('Access-Control-Allow-Origin', '*'); self.send_header('Access-Control-Allow-Headers', '*'); self.send_header('Access-Control-Allow-Methods', 'POST,OPTIONS,GET')
        self.send_header('Cache-Control', 'no-store')
    def _end(self, code, body=b'', ct='text/plain'):
        self.send_response(code); self._c(); self.send_header('Content-Type', ct); self.send_header('Content-Length', str(len(body))); self.end_headers()
        if body: self.wfile.write(body)
    def do_OPTIONS(self): self._end(204)
    def do_GET(self):
        parts = clean(self.path)
        if not parts: return self._end(200, b'ok')
        fp = os.path.join(ROOT, *parts)
        if not os.path.isfile(fp): return self._end(404, b'nf')
        with open(fp, 'rb') as f: data = f.read()
        self._end(200, data, CT.get(os.path.splitext(fp)[1].lower(), 'application/octet-stream'))
    def do_POST(self):
        n = int(self.headers.get('Content-Length', 0)); body = self.rfile.read(n)
        parts = clean(self.path)
        if len(parts) != 2: return self._end(400)
        if body[:5] == b'data:': body = base64.b64decode(body.split(b',', 1)[1])
        d = os.path.join(ROOT, parts[0]); os.makedirs(d, exist_ok=True)
        tmp = os.path.join(d, parts[1] + '.part')
        with open(tmp, 'wb') as f: f.write(body)
        os.replace(tmp, os.path.join(d, parts[1]))
        self._end(200, b'ok')
    def log_message(self, *a): pass
http.server.ThreadingHTTPServer(('127.0.0.1', 8766), H).serve_forever()
