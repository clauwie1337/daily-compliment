import { expect, test } from './fixtures';

test('bathroom wisdom visual', async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('dc:skin', 'bathroom');
      localStorage.setItem('dc:theme', 'light');
    } catch {
      // ignore
    }
  });

  await page.goto('/?dc_id=en-0009');

  const card = page.getByTestId('compliment-card');
  await expect(card).toBeVisible();

  // Give the circle-fitting rAF a moment.
  await page.waitForTimeout(50);

  await expect(card).toHaveScreenshot('bathroom-main.png');
});
