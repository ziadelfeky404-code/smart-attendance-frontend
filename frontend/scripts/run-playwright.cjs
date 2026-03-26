const { spawn } = require('child_process');

const DEFAULT_VERCEL_BASE_URL =
  'https://campusmind-frontend-igufm6ijg-ziadelfeky404-codes-projects.vercel.app';

const args = process.argv.slice(2);
const forwardedArgs = [];
let target = 'local';

for (const arg of args) {
  if (arg === '--local') {
    target = 'local';
    continue;
  }

  if (arg === '--vercel') {
    target = 'vercel';
    continue;
  }

  forwardedArgs.push(arg);
}

const deployedBaseUrl =
  process.env.PLAYWRIGHT_BASE_URL || (target === 'vercel' ? DEFAULT_VERCEL_BASE_URL : undefined);

if (target === 'vercel' && !process.env.PLAYWRIGHT_BASE_URL) {
  console.log(`Using default deployed base URL: ${DEFAULT_VERCEL_BASE_URL}`);
}

function quote(argument) {
  return argument.includes(' ') ? `"${argument}"` : argument;
}

async function detectProtectedDeployment(baseUrl) {
  if (!baseUrl || target !== 'vercel') {
    return { protected: false, reason: '' };
  }

  try {
    const response = await fetch(baseUrl, { redirect: 'manual' });
    const location = response.headers.get('location') || '';
    const body = await response.text();
    const protectedByVercel =
      ([301, 302, 303, 307, 308].includes(response.status) && /https:\/\/vercel\.com\/(?:login|sso-api)/i.test(location)) ||
      (response.status === 401 && /Authentication Required|requires Vercel authentication/i.test(body));

    if (protectedByVercel) {
      return {
        protected: true,
        reason: 'The configured deployed URL is protected by Vercel authentication. Use an unprotected deployment URL or run the local suite.',
      };
    }
  } catch (error) {
    console.warn(`Could not preflight deployed URL ${baseUrl}: ${error.message}`);
  }

  return { protected: false, reason: '' };
}

async function main() {
  const deploymentCheck = await detectProtectedDeployment(deployedBaseUrl);

  if (deploymentCheck.protected) {
    console.log(deploymentCheck.reason);
  }

  const command = ['npx', 'playwright', 'test', ...forwardedArgs].map(quote).join(' ');

  const child = spawn(command, {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      PLAYWRIGHT_TARGET: target,
      ...(deployedBaseUrl ? { PLAYWRIGHT_BASE_URL: deployedBaseUrl } : {}),
      PLAYWRIGHT_DEPLOYMENT_PROTECTED: deploymentCheck.protected ? '1' : '0',
      PLAYWRIGHT_DEPLOYMENT_PROTECTED_REASON: deploymentCheck.reason,
    },
  });

  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
