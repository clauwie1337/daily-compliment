import { expect, test } from '@playwright/test';

test('home loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Daily Compliment/);
  await expect(page.getByRole('heading', { name: 'Daily Compliment' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Clicked 0 times/ })).toBeVisible();
});
