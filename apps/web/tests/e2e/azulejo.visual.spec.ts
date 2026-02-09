import { expect, test } from './fixtures';

test('azulejo visual', async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('dc:skin', 'azulejo');
      localStorage.setItem('dc:theme', 'light');
    } catch {
      // ignore
    }
  });

  await page.goto('/?dc_seed=visual&dc_day=2026-02-07&dc_id=en-0003');

  const box = await page.getByTestId('compliment-card').boundingBox();
  expect(box).not.toBeNull();
  if (box) {
    const ratio = box.width / box.height;
    expect(ratio).toBeGreaterThan(0.98);
    expect(ratio).toBeLessThan(1.02);
  }

  await expect(page.locator('main')).toHaveScreenshot('azulejo-main.png');
});
