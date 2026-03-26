import { expect, test } from '@playwright/test';
import { loginAs, navigateUsingAppLink } from '../utils/auth';
import { deployedUrlProtected, deployedUrlProtectionReason } from '../utils/deployment';

test.skip(deployedUrlProtected, deployedUrlProtectionReason);

test.describe('Student Smoke', () => {
  test('student dashboard, history, and advising pages load', async ({ page }) => {
    await loginAs(page, 'student');
    await expect(page.getByTestId('student-attendance-summary')).toBeVisible();
    await expect(page.getByTestId('student-recent-records')).toBeVisible();

    await navigateUsingAppLink(page, 'nav-link-student-history', '/student/history');

    await navigateUsingAppLink(page, 'nav-link-student-advising', '/student/advising', 'student-advising-page');
    await expect(page.getByTestId('student-risk-card')).toBeVisible();
    await expect(page.getByTestId('student-advisor-card')).toBeVisible();

    await page.getByTestId('student-advising-tab-notifications').click();
    await expect(page.getByTestId('student-notifications-panel')).toBeVisible();
  });
});
