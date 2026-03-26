const path = require('path');
const { spawn } = require('child_process');

const frontendDir = path.resolve(__dirname, '..');
const apiUrl = process.env.PLAYWRIGHT_LOCAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5100/api';
const frontendPort = process.env.PLAYWRIGHT_LOCAL_FRONTEND_PORT || '3100';
const nodeOptions = [process.env.NODE_OPTIONS, '--max-old-space-size=4096']
  .filter(Boolean)
  .join(' ');

const child = spawn(`npm run dev -- --port ${frontendPort}`, {
  cwd: frontendDir,
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    NEXT_PUBLIC_API_URL: apiUrl,
    NEXT_TELEMETRY_DISABLED: '1',
    NODE_OPTIONS: nodeOptions,
  },
});

for (const signal of ['SIGINT', 'SIGTERM', 'SIGBREAK']) {
  process.on(signal, () => child.kill(signal));
}

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
