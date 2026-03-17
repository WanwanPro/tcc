import os
import sys
import subprocess
import threading
import time
import socket
import urllib.request
import urllib.error
import shutil

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
LOG_MODE = os.environ.get('START_ALL_LOG_MODE', 'quiet').strip().lower()

NOISY_PATTERNS = [
    '状态已同步到微信小程序后端',
    '状态已同步到system后台',
    '从system后台获取到',
    '映射后状态统计',
    '从system后台获取数据，共',
    'Local: http://',
    'Network: http://',
    'ready in ',
]

IMPORTANT_PATTERNS = [
    '[error]',
    ' error',
    '[warn]',
    ' warn',
    ' failed',
    ' exception',
    ' refused',
    ' exited with code',
    'too many requests',
    ' 429 ',
    ' 500 ',
]

def which(cmd):
    return shutil.which(cmd) is not None

def ensure_dependencies():
    paths = [
        os.path.join(ROOT, 'backend'),
        os.path.join(ROOT, 'System', 'backend'),
        os.path.join(ROOT, 'System', 'frontend'),
    ]
    for p in paths:
        if not os.path.isdir(os.path.join(p, 'node_modules')):
            r = subprocess.run('npm install' if os.name == 'nt' else ['npm', 'install'], cwd=p, shell=(os.name == 'nt'))
            if r.returncode != 0:
                print('[SETUP] npm install failed at', p)
                sys.exit(1)

def find_pids_on_port(port):
    pids = []
    try:
        if os.name == 'nt':
            out = subprocess.check_output('netstat -ano', shell=True, text=True, errors='ignore')
        else:
            out = subprocess.check_output(['sh', '-lc', 'netstat -tunlp'], text=True, errors='ignore')
        for line in out.splitlines():
            if f':{port}' in line and ('LISTEN' in line or 'ESTABLISHED' in line or 'LISTENING' in line):
                parts = line.split()
                pid = parts[-1]
                if pid.isdigit():
                    pids.append(int(pid))
    except Exception:
        pass
    return pids

def free_port(port):
    pids = find_pids_on_port(port)
    for pid in pids:
        try:
            if os.name == 'nt':
                subprocess.run(['taskkill', '/F', '/PID', str(pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            else:
                os.kill(pid, 9)
            print(f'[PORT] Freed port {port} by killing PID {pid}')
        except Exception:
            pass

def should_print_line(line):
    text = line.strip()
    if not text:
        return False

    if LOG_MODE == 'verbose':
        return True

    lowered = text.lower()

    if any(pattern in lowered for pattern in IMPORTANT_PATTERNS):
        return True

    if lowered.startswith('[nodemon]') and ('starting' in lowered or 'app crashed' in lowered):
        return True

    if lowered.startswith('server running') or lowered.startswith('vite v'):
        return True

    if '"get ' in lowered or '"post ' in lowered or '"put ' in lowered or '"delete ' in lowered:
        return False

    if any(pattern in lowered for pattern in NOISY_PATTERNS):
        return False

    return False

def read_stream(name, stream):
    for line in iter(stream.readline, ''):
        if not line:
            break
        s = line.rstrip('\n')
        if s and should_print_line(s):
            print(f'[{name}] {s}')

def start_process(name, cmd, cwd, env=None, use_shell=None):
    e = os.environ.copy()
    if env:
        e.update(env)
    if use_shell is None:
        use_shell = (os.name == 'nt')
    if use_shell and isinstance(cmd, list):
        cmd = ' '.join(cmd)
    p = subprocess.Popen(
        cmd,
        cwd=cwd,
        env=e,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding='utf-8',
        errors='replace',
        shell=use_shell,
    )
    t = threading.Thread(target=read_stream, args=(name, p.stdout), daemon=True)
    t.start()
    return p

def wait_http(url, timeout=60):
    start = time.time()
    while time.time() - start < timeout:
        try:
            with urllib.request.urlopen(url, timeout=5) as resp:
                if resp.status == 200:
                    return True
        except Exception:
            pass
        time.sleep(1)
    return False

def wait_port(host, port, timeout=60):
    start = time.time()
    while time.time() - start < timeout:
        try:
            s = socket.create_connection((host, port), 2)
            s.close()
            return True
        except Exception:
            time.sleep(1)
    return False

def kill_tree(p):
    try:
        if os.name == 'nt':
            subprocess.run(['taskkill', '/F', '/T', '/PID', str(p.pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        else:
            try:
                os.killpg(os.getpgid(p.pid), 9)
            except Exception:
                p.terminate()
    except Exception:
        pass

def find_wechat_cli():
    env_cli = os.environ.get('WECHAT_DEVTOOLS_CLI')
    candidates = []
    if env_cli:
        candidates.append(env_cli)
    if os.name == 'nt':
        local = os.environ.get('LOCALAPPDATA', '')
        candidates += [
            os.path.join(local, 'Programs', '微信开发者工具', 'cli.bat'),
            os.path.join(local, 'Tencent', '微信开发者工具', 'cli.bat'),
            r'C:\Program Files\Tencent\微信开发者工具\cli.bat',
            r'C:\Program Files (x86)\Tencent\微信开发者工具\cli.bat',
        ]
    else:
        candidates += [
            '/Applications/wechatwebdevtools.app/Contents/MacOS/cli',
            '/Applications/微信开发者工具.app/Contents/MacOS/cli',
            os.path.expanduser('~/Applications/微信开发者工具.app/Contents/MacOS/cli'),
        ]
    for c in candidates:
        if c and os.path.exists(c):
            return c
    return None

def main():
    os.chdir(ROOT)
    if not which('node') or not which('npm'):
        print('[ERROR] Node or npm not found in PATH')
        sys.exit(1)
    ensure_dependencies()

    if LOG_MODE == 'verbose':
        print('[INFO] Log mode: verbose')
    else:
        print('[INFO] Log mode: quiet (showing warnings/errors and key startup lines only)')

    services = []

    def register_service(name, process):
        services.append({
            'name': name,
            'process': process
        })

    print('[BOOT] Starting TCC API (backend)')
    free_port(3001)
    tcc_api = start_process(
        'TCC-API',
        ['npm', 'run', 'dev'],
        os.path.join(ROOT, 'backend'),
        env={
            'PORT': '3001',
            'UNIFIED_MONGODB_URI': 'mongodb://localhost:27017/parking_system',
            'MONGODB_URI': 'mongodb://localhost:27017/parking_system',
        }
    )
    register_service('TCC-API', tcc_api)
    if not wait_http('http://localhost:3001/health', 60):
        print('[ERROR] TCC API health check failed')
        kill_tree(tcc_api)
        sys.exit(1)
    print('[READY] TCC API on http://localhost:3001')

    print('[BOOT] Starting Admin API (system backend)')
    free_port(5001)
    admin_api = start_process(
        'ADMIN-API',
        ['npm', 'run', 'dev'],
        os.path.join(ROOT, 'System', 'backend'),
        env={
            'PORT': '5001',
            'UNIFIED_MONGODB_URI': 'mongodb://localhost:27017/parking_admin',
            'MONGODB_URI': 'mongodb://localhost:27017/parking_admin',
        }
    )
    register_service('ADMIN-API', admin_api)
    if not wait_http('http://localhost:5001/api/health', 60):
        print('[ERROR] Admin API health check failed')
        kill_tree(admin_api)
        kill_tree(tcc_api)
        sys.exit(1)
    print('[READY] Admin API on http://localhost:5001')

    print('[BOOT] Starting Admin UI (frontend)')
    admin_ui = start_process('ADMIN-UI', ['npm', 'run', 'dev'], os.path.join(ROOT, 'System', 'frontend'))
    register_service('ADMIN-UI', admin_ui)
    ui_ready = False
    for port in [5002, 5003, 5004, 5173]:
        if wait_port('127.0.0.1', port, 30):
            print(f'[READY] Admin UI on http://localhost:{port}')
            ui_ready = True
            break
    if not ui_ready:
        print('[WARN] Admin UI port not ready within timeout')

    wechat_cli = find_wechat_cli()
    minipath = os.path.join(ROOT, 'frontend', 'miniprogram')
    if wechat_cli and os.path.isdir(minipath):
        print('[BOOT] Opening WeChat DevTools')
        if os.name == 'nt':
            cmd = ['cmd', '/c', wechat_cli, 'open', '--project', minipath]
            wechat = start_process('WECHAT-DEVTOOLS', cmd, ROOT, use_shell=False)
        else:
            wechat = start_process('WECHAT-DEVTOOLS', [wechat_cli, 'open', '--project', minipath], ROOT)
        register_service('WECHAT-DEVTOOLS', wechat)
        print('[READY] WeChat DevTools opened')
    else:
        print('[INFO] WeChat DevTools CLI not found. Open project manually:', minipath)

    try:
        while True:
            for service in services:
                p = service['process']
                rc = p.poll()
                if rc is not None and rc != 0:
                    print(f"[ERROR] Service {service['name']} exited with code {rc}")
                    print('[ERROR] Startup script will stop the remaining services to avoid a half-started environment.')
                    for other in services:
                        kill_tree(other['process'])
                    sys.exit(1)
            time.sleep(2)
    except KeyboardInterrupt:
        print('\n[SHUTDOWN] Terminating services')
        for service in services:
            kill_tree(service['process'])
        sys.exit(0)

if __name__ == '__main__':
    main()
