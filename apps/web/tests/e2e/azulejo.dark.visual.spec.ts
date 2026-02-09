import { expect, test } from './fixtures';

test('azulejo dark visual', async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('dc:skin', 'azulejo');
      localStorage.setItem('dc:theme', 'dark');
    } catch {
      // ignore
    }
  });

  await page.goto('/?dc_seed=visual&dc_day=2026-02-07&dc_id=en-0003');
  await expect(page.getByTestId('compliment-card')).toHaveScreenshot('azulejo-dark.png');
});
