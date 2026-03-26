const path = require('path');
const { spawn } = require('child_process');

const serverDir = path.resolve(__dirname, '..', '..', 'server');
const localFrontendUrl = process.env.PLAYWRIGHT_LOCAL_FRONTEND_URL || 'http://127.0.0.1:3100';
const localApiUrl = process.env.PLAYWRIGHT_LOCAL_API_URL || 'http://127.0.0.1:5100/api';
const sharedEnv = {
  ...process.env,
  NODE_ENV: 'test',
  PORT: process.env.PLAYWRIGHT_LOCAL_API_PORT || '5100',
  CLIENT_URL: localFrontendUrl,
  APP_URL: localApiUrl.replace(/\/api\/?$/, ''),
};

const fixtures = spawn('npm run db:fixtures:playwright', {
  cwd: serverDir,
  stdio: 'inherit',
  shell: true,
  env: sharedEnv,
});

fixtures.on('exit', (fixturesCode) => {
  if ((fixturesCode ?? 0) !== 0) {
    process.exit(fixturesCode ?? 1);
  }

  const child = spawn('npm run dev', {
    cwd: serverDir,
    stdio: 'inherit',
    shell: true,
    env: sharedEnv,
  });

  for (const signal of ['SIGINT', 'SIGTERM', 'SIGBREAK']) {
    process.on(signal, () => child.kill(signal));
  }

  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });
});
