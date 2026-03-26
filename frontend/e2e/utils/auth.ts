import { expect, Page } from '@playwright/test';
import { testUsers, type UserRole } from './test-users';

const DEFAULT_UI_TIMEOUT = 30_000;
const DEFAULT_NAV_TIMEOUT = 45_000;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function expectNoFatalError(page: Page) {
  await expect(page.locator('body')).not.toContainText(/Application error|Unhandled Runtime Error|This page could not be found/i);
}

export async function loginAs(page: Page, role: UserRole) {
  const credentials = testUsers[role];
  const dashboardTestId =
    role === 'admin' ? 'admin-dashboard' : role === 'doctor' ? 'doctor-dashboard' : 'student-dashboard';
  const dashboardPath = role === 'admin' ? '/admin' : role === 'doctor' ? '/doctor' : '/student';
  const dashboard = page.getByTestId(dashboardTestId);

  await page.goto('/login', { waitUntil: 'domcontentloaded' });

  const loginForm = page.getByTestId('login-form');
  const loginReady = await loginForm.waitFor({ state: 'visible', timeout: DEFAULT_UI_TIMEOUT }).then(() => true).catch(() => false);

  if (!loginReady) {
    if (await dashboard.isVisible().catch(() => false)) {
      await expectNoFatalError(page);
      return;
    }

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('login-page')).toBeVisible({ timeout: DEFAULT_UI_TIMEOUT });
    await expect(loginForm).toBeVisible({ timeout: DEFAULT_UI_TIMEOUT });
  }

  await page.waitForTimeout(250);

  const emailInput = page.getByTestId('login-email');
  const passwordInput = page.getByTestId('login-password');

  await emailInput.click();
  await emailInput.fill('');
  await emailInput.pressSequentially(credentials.email);
  await expect(emailInput).toHaveValue(credentials.email);

  await passwordInput.click();
  await passwordInput.fill('');
  await passwordInput.pressSequentially(credentials.password);
  await expect(passwordInput).toHaveValue(credentials.password);

  await page.getByTestId('login-submit').click();
  if (!(await dashboard.waitFor({ state: 'visible', timeout: DEFAULT_NAV_TIMEOUT }).then(() => true).catch(() => false))) {
    const dashboardLink = page.locator(`a[href="${dashboardPath}"]`).first();
    if (await dashboardLink.isVisible().catch(() => false)) {
      await dashboardLink.click();
    }
  }

  await expect(dashboard).toBeVisible({ timeout: DEFAULT_NAV_TIMEOUT });
  await expectNoFatalError(page);
}

export async function logout(page: Page) {
  await page.getByTestId('profile-menu-button').click();
  await page.getByTestId('logout-button').click();
  await expect(page.getByTestId('login-page')).toBeVisible();
}

export async function ensureDoctorSession(page: Page) {
  const dashboard = page.getByTestId('doctor-dashboard');
  if (!(await dashboard.isVisible().catch(() => false))) {
    const dashboardLink = page.locator('a[href="/doctor"]').first();
    await expect(dashboardLink).toBeVisible();
    await dashboardLink.click();
  }

  await expect(page.getByTestId('doctor-dashboard')).toBeVisible();
  await expect(page.getByTestId('doctor-open-session-form')).toBeVisible();

  const existingSessions = page.getByTestId('doctor-active-sessions');
  if (await existingSessions.isVisible().catch(() => false)) {
    const qrButton = existingSessions.getByRole('button', { name: /QR/i }).first();
    if (await qrButton.isVisible().catch(() => false)) {
      await qrButton.click();
      const qrModal = page.getByTestId('doctor-qr-modal');
      await expect(qrModal).toBeVisible({ timeout: 15_000 }).catch(() => null);
      const isVisible = await qrModal.isVisible().catch(() => false);
      if (isVisible) {
        await qrModal.getByRole('button', { name: /إغلاق|close/i }).click();
        await expect(qrModal).toBeHidden({ timeout: 10_000 }).catch(() => null);
      }
      return isVisible;
    }
  }

  const select = page.getByTestId('doctor-section-select');
  const options = select.locator('option');
  const optionCount = await expect
    .poll(async () => options.count(), { timeout: 10_000 })
    .toBeGreaterThan(1)
    .then(() => options.count())
    .catch(() => 0);

  if (optionCount <= 1) {
    return false;
  }

  await select.selectOption({ index: 1 });
  await page.getByTestId('doctor-open-session-button').click();
  const qrModal = page.getByTestId('doctor-qr-modal');
  if (!(await qrModal.isVisible().catch(() => false))) {
    await expect(qrModal).toBeVisible({ timeout: 15_000 }).catch(() => null);
  }

  const isVisible = await qrModal.isVisible().catch(() => false);
  if (isVisible) {
    await qrModal.getByRole('button', { name: /إغلاق|close/i }).click();
    await expect(qrModal).toBeHidden({ timeout: 10_000 }).catch(() => null);
  }

  return isVisible;
}

export async function openStudentSectionWithActiveSession(page: Page) {
  await page.goto('/student/attendance', { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('student-attendance-page')).toBeVisible();

  const sectionButtons = page.getByTestId('student-section-option');
  const totalSections = await expect
    .poll(async () => sectionButtons.count(), { timeout: 15_000 })
    .toBeGreaterThan(0)
    .then(() => sectionButtons.count());
  expect(totalSections).toBeGreaterThan(0);

  for (let index = 0; index < totalSections; index += 1) {
    await sectionButtons.nth(index).click();

    const sendOtpButton = page.getByTestId('student-send-otp-button');
    if (await sendOtpButton.waitFor({ state: 'visible', timeout: 10_000 }).then(() => true).catch(() => false)) {
      return true;
    }

    if (await page.getByTestId('student-attendance-error').isVisible().catch(() => false)) {
      await page.getByTestId('student-back-to-sections-button').click();
      await expect(page.getByTestId('student-sections-list')).toBeVisible();
    }
  }

  return false;
}

export async function navigateUsingAppLink(
  page: Page,
  linkTestId: string,
  expectedPath: string,
  readyTestId?: string,
) {
  const link = page.getByTestId(linkTestId);
  await expect(link).toBeVisible({ timeout: DEFAULT_UI_TIMEOUT });
  await expect(link).toHaveAttribute('href', expectedPath);

  await Promise.all([
    page.waitForURL((url) => url.pathname === expectedPath, { timeout: DEFAULT_NAV_TIMEOUT }),
    link.click(),
  ]);

  await expect(page).toHaveURL(new RegExp(`${escapeRegExp(expectedPath)}$`), { timeout: DEFAULT_NAV_TIMEOUT });

  if (readyTestId) {
    await expect(page.getByTestId(readyTestId)).toBeVisible({ timeout: DEFAULT_NAV_TIMEOUT });
  } else {
    await expect(page.locator('main')).toBeVisible({ timeout: DEFAULT_NAV_TIMEOUT });
  }

  await expectNoFatalError(page);
}
