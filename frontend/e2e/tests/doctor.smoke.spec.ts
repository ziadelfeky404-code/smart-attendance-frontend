import { expect, test } from '@playwright/test';
import { loginAs, navigateUsingAppLink } from '../utils/auth';
import { deployedUrlProtected, deployedUrlProtectionReason } from '../utils/deployment';

test.skip(deployedUrlProtected, deployedUrlProtectionReason);

test.describe('Doctor Smoke', () => {
  test('doctor dashboard and advising workspace load', async ({ page }) => {
    await loginAs(page, 'doctor');
    await expect(page.getByTestId('doctor-open-session-form')).toBeVisible();

    await navigateUsingAppLink(page, 'nav-link-doctor-advising', '/doctor/advising', 'doctor-advising-page');
    await expect(page.getByTestId('doctor-advising-students-card')).toBeVisible();
    await expect(page.getByTestId('doctor-advising-sessions-card')).toBeVisible();
  });
});
