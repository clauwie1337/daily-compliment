import { expect, test } from './fixtures';

test('bathroom wisdom style toggles and persists', async ({ page }) => {
  await page.goto('/?dc_id=en-0003');

  // Open settings
  await page.locator('summary.settings-button').click();

  // Toggle bathroom style
  await page.getByTestId('skin-bathroom').click();
  await expect(page.locator('html')).toHaveAttribute('data-skin', 'bathroom');

  // Tile should be roughly square in this style
  const box = await page.getByTestId('compliment-card').boundingBox();
  expect(box).not.toBeNull();
  if (box) {
    const ratio = box.width / box.height;
    expect(ratio).toBeGreaterThan(0.92);
    expect(ratio).toBeLessThan(1.08);
  }

  // Reload and ensure it sticks
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-skin', 'bathroom');

  // Switch back to default
  await page.locator('summary.settings-button').click();
  await page.getByTestId('skin-default').click();
  await expect(page.locator('html')).not.toHaveAttribute('data-skin', 'bathroom');
});
