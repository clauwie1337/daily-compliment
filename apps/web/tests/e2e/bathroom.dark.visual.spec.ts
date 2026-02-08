import { expect, test } from './fixtures';

test('bathroom wisdom dark visual', async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('dc:skin', 'bathroom');
      localStorage.setItem('dc:theme', 'dark');
    } catch {
      // ignore
    }
  });

  await page.goto('/?dc_id=en-0009');

  await expect(page.getByTestId('compliment-card')).toBeVisible();

  // Give the circle-fitting rAF a moment.
  await page.waitForTimeout(50);

  await expect(page).toHaveScreenshot('bathroom-dark.png');
});
