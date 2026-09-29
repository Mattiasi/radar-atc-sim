import http.server
import json
import subprocess
import threading
import sys
import os
import time

PORT = 8765
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
test_result = None

class TestServerHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT_DIR, **kwargs)

    def do_POST(self):
        global test_result
        if self.path == '/test-results':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            test_result = json.loads(post_data.decode('utf-8'))
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(b'{"status":"ok"}')
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        pass # suppress default HTTP logging

def run_server(httpd):
    httpd.serve_forever()

def main():
    global test_result
    httpd = http.server.HTTPServer(('127.0.0.1', PORT), TestServerHandler)
    server_thread = threading.Thread(target=run_server, args=(httpd,), daemon=True)
    server_thread.start()
    print(f"HTTP server started on http://127.0.0.1:{PORT}")

    edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    url = f"http://127.0.0.1:{PORT}/scratch/test_ils_suite.html"
    
    cmd = [
        edge_path,
        "--headless",
        "--disable-gpu",
        "--no-first-run",
        "--no-default-browser-check",
        url
    ]
    print(f"Launching Edge headless: {' '.join(cmd)}")
    proc = subprocess.Popen(cmd)

    start_time = time.time()
    while test_result is None and (time.time() - start_time) < 25:
        time.sleep(0.5)

    proc.terminate()
    try:
        proc.wait(timeout=2)
    except Exception:
        proc.kill()
    httpd.shutdown()

    if test_result is None:
        print("ERROR: Test timed out after 25 seconds with no results received.")
        sys.exit(1)

    print("\n--- TEST RUN RESULTS ---")
    if 'logs' in test_result:
        print("--- BROWSER LOGS ---")
        for line in test_result['logs']:
            print("  ", line)
        print("--------------------")

    if test_result.get('success'):
        for r in test_result.get('results', []):
            print(f"PASS: {r.get('message')}")
        print("\n>>> ALL TESTS PASSED SUCCESSFULLY! <<<")
        sys.exit(0)
    else:
        print(f"FAILED: {test_result.get('error')}")
        print(test_result.get('stack', ''))
        sys.exit(1)

if __name__ == '__main__':
    main()
