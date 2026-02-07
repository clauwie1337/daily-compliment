import { expect, test } from './fixtures';

test('home visual', async ({ page }) => {
  await page.goto('/?dc_seed=visual&dc_day=2026-02-07');
  await expect(page.locator('main')).toHaveScreenshot('home-main.png');
});
