import { expect, test } from './fixtures';
import { waitForFitComplete } from './helpers/waitForFitComplete';

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

  const card = page.getByTestId('compliment-card');
  await expect(card).toBeVisible();

  await waitForFitComplete(page);

  await expect(card).toHaveScreenshot('bathroom-dark.png');
});
