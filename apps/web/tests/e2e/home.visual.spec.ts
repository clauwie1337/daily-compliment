import { expect, test } from './fixtures';

test('home visual', async ({ page }) => {
  // Pin the content so dataset growth doesn't invalidate the visual baseline.
  await page.goto('/?dc_seed=visual&dc_day=2026-02-07&dc_id=en-0003');
  await expect(page.locator('main')).toHaveScreenshot('home-main.png');
});
