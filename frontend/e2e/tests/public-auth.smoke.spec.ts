import { expect, test } from '@playwright/test';
import { expectNoFatalError, loginAs } from '../utils/auth';
import { deployedUrlProtected, deployedUrlProtectionReason } from '../utils/deployment';

test.skip(deployedUrlProtected, deployedUrlProtectionReason);

test.describe('Public And Auth Smoke', () => {
  test('homepage and login page load without fatal errors', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('home-page')).toBeVisible();
    await expect(page.getByTestId('home-login-link')).toBeVisible();
    await expectNoFatalError(page);

    await page.getByTestId('home-login-link').click();
    await expect(page.getByTestId('login-page')).toBeVisible();
    await expect(page.getByTestId('login-form')).toBeVisible();
    await expect(page.getByTestId('login-email')).toBeEditable();
    await expect(page.getByTestId('login-password')).toBeEditable();
    await expectNoFatalError(page);
  });

  test('admin can log in through the browser', async ({ page }) => {
    await loginAs(page, 'admin');
    await expect(page.getByTestId('admin-stat-students')).toBeVisible();
    await expect(page.getByTestId('admin-stat-doctors')).toBeVisible();
  });
});
