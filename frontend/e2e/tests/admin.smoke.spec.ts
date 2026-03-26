import { expect, test } from '@playwright/test';
import { loginAs, navigateUsingAppLink } from '../utils/auth';
import { deployedUrlProtected, deployedUrlProtectionReason } from '../utils/deployment';

test.skip(deployedUrlProtected, deployedUrlProtectionReason);

test.describe('Admin Smoke', () => {
  test('admin dashboard and core admin navigation render', async ({ page }) => {
    await loginAs(page, 'admin');
    await expect(page.getByTestId('admin-quick-actions')).toBeVisible();

    const adminLinks = [
      { testId: 'nav-link-admin-students', path: '/admin/students' },
      { testId: 'nav-link-admin-reports', path: '/admin/reports' },
      { testId: 'nav-link-admin-risk', path: '/admin/risk', readyTestId: 'admin-risk-page' },
    ];

    for (const link of adminLinks) {
      await navigateUsingAppLink(page, link.testId, link.path, link.readyTestId);
    }

    await expect(page.getByTestId('admin-risk-stats')).toBeVisible();
    await expect(page.getByTestId('admin-risk-critical-card')).toBeVisible();
  });
});
