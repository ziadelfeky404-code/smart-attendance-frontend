import { expect, test } from '@playwright/test';
import { ensureDoctorSession, loginAs, logout, openStudentSectionWithActiveSession } from '../utils/auth';
import { deployedUrlProtected, deployedUrlProtectionReason } from '../utils/deployment';

test.skip(deployedUrlProtected, deployedUrlProtectionReason);

test.describe('Attendance OTP Smoke', () => {
  test('doctor can open attendance and student can reach the OTP step', async ({ page }) => {
    await loginAs(page, 'doctor');
    const sessionReady = await ensureDoctorSession(page);
    test.skip(!sessionReady, 'Current database does not expose a doctor section that can open an attendance session.');
    await logout(page);

    await loginAs(page, 'student');
    const activeStudentSession = await openStudentSectionWithActiveSession(page);
    test.skip(!activeStudentSession, 'Current database does not expose an active attendance session for the seeded student account.');

    const sendOtpButton = page.getByTestId('student-send-otp-button');
    await expect(sendOtpButton).toBeVisible();
    await sendOtpButton.click();

    const otpOutcome = await expect
      .poll(async () => {
        if (await page.getByTestId('student-otp-input').isVisible().catch(() => false)) {
          return 'input';
        }

        if (await page.getByTestId('student-otp-error').isVisible().catch(() => false)) {
          return 'error';
        }

        return 'pending';
      }, { timeout: 20_000 })
      .not.toBe('pending')
      .then(async () => {
        if (await page.getByTestId('student-otp-input').isVisible().catch(() => false)) {
          return 'input';
        }

        return 'error';
      });

    if (otpOutcome === 'input') {
      await expect(page.getByTestId('student-otp-input')).toBeVisible();
      return;
    }

    const otpError = page.getByTestId('student-otp-error');
    await expect(otpError).toBeVisible();
    await expect(otpError).toContainText(/active otp/i);
  });
});
