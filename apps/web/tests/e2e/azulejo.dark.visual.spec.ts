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

  const rootVars = await page.evaluate(() => {
    const s = getComputedStyle(document.documentElement);
    return {
      accent1: s.getPropertyValue('--dc-accent-1').trim(),
      accent2: s.getPropertyValue('--dc-accent-2').trim(),
      accent3: s.getPropertyValue('--dc-accent-3').trim(),
    };
  });

  expect(rootVars.accent1).toBe('#60a5fa');
  expect(rootVars.accent2).toBe('#34d399');
  expect(rootVars.accent3).toBe('#fbbf24');

  const card = page.getByTestId('compliment-card');
  await expect(card).toBeVisible();

  const box = await card.boundingBox();
  expect(box).not.toBeNull();
  if (box) {
    const ratio = box.width / box.height;
    expect(ratio).toBeGreaterThan(0.98);
    expect(ratio).toBeLessThan(1.02);
  }

  // Screenshot only the tile/card to avoid CI diffs from page-level gradients/noise.
  await expect(card).toHaveScreenshot('azulejo-dark.png');
});
