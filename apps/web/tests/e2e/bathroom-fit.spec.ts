import { expect, test } from './fixtures';

test('bathroom text fit resets so short quotes are not stuck tiny', async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('dc:skin', 'bathroom');
      localStorage.setItem('dc:theme', 'light');
    } catch {
      // ignore
    }
  });

  // A longer quote that may cause shrinking.
  await page.goto('/?dc_id=en-0009');
  await page.waitForTimeout(50);

  const sizeLong = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="compliment"]');
    if (!el) return null;
    return Number.parseFloat(getComputedStyle(el).fontSize);
  });
  expect(sizeLong).not.toBeNull();

  // A shorter quote should be able to grow back.
  await page.goto('/?dc_id=en-0008');
  await page.waitForTimeout(50);

  const sizeShort = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="compliment"]');
    if (!el) return null;
    return Number.parseFloat(getComputedStyle(el).fontSize);
  });
  expect(sizeShort).not.toBeNull();

  if (sizeLong != null && sizeShort != null) {
    // Allow equality (if long didn't shrink), but disallow "stuck smaller" behavior.
    expect(sizeShort).toBeGreaterThanOrEqual(sizeLong);
    // And it should not be comically tiny on desktop.
    expect(sizeShort).toBeGreaterThanOrEqual(18);
  }
});
