export const deployedUrlProtected = process.env.PLAYWRIGHT_DEPLOYMENT_PROTECTED === '1';

export const deployedUrlProtectionReason =
  process.env.PLAYWRIGHT_DEPLOYMENT_PROTECTED_REASON ||
  'The configured deployed URL is protected by Vercel authentication. Use an unprotected deployment URL or run the local suite.';
