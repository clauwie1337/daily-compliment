import { expect, test } from './fixtures';

test('bathroom wisdom is the default, but can be toggled', async ({ page }) => {
  await page.goto('/?dc_id=en-0003');

  // New users default to bathroom wisdom.
  await expect(page.locator('html')).toHaveAttribute('data-skin', 'bathroom');

  // Open settings
  await page.locator('summary.settings-button').click();

  // Bathroom option should come first.
  const first = page.locator("[data-testid='skin-bathroom']");
  const second = page.locator("[data-testid='skin-default']");
  await expect(first).toBeVisible();
  await expect(second).toBeVisible();

  const orderOk = await page.evaluate(() => {
    const a = document.querySelector("[data-testid='skin-bathroom']");
    const b = document.querySelector("[data-testid='skin-default']");
    if (!a || !b) return false;
    const pos = a.compareDocumentPosition(b);
    return Boolean(pos & Node.DOCUMENT_POSITION_FOLLOWING);
  });
  expect(orderOk).toBe(true);

  // Tile should be roughly square in this style
  const box = await page.getByTestId('compliment-card').boundingBox();
  expect(box).not.toBeNull();
  if (box) {
    const ratio = box.width / box.height;
    expect(ratio).toBeGreaterThan(0.92);
    expect(ratio).toBeLessThan(1.08);
  }

  // Text should fit within the central circle (diagonal + centered)
  await page.waitForTimeout(50); // allow rAF fitting to run
  const fits = await page.evaluate(() => {
    const root = document.documentElement;
    const quote = document.querySelector('[data-testid="compliment"]');
    const card = document.querySelector('[data-testid="compliment-card"]');
    if (!quote || !card) return { ok: false, reason: 'missing-elements' };

    const ratioRaw = getComputedStyle(root).getPropertyValue('--dc-bathroom-circle-diameter').trim();
    const ratio = Number.parseFloat(ratioRaw);
    const dRatio = Number.isFinite(ratio) && ratio > 0 && ratio <= 1 ? ratio : 0.70;

    const rCard = card.getBoundingClientRect();
    const size = Math.min(rCard.width, rCard.height);
    const diameter = size * dRatio;
    const margin = Math.max(12, Math.round(size * 0.05));
    const maxDiagonal = Math.max(0, diameter - margin);

    const rText = quote.getBoundingClientRect();

    const cardCx = rCard.left + rCard.width / 2;
    const cardCy = rCard.top + rCard.height / 2;
    const textCx = rText.left + rText.width / 2;
    const textCy = rText.top + rText.height / 2;
    const dx = Math.abs(textCx - cardCx);
    const dy = Math.abs(textCy - cardCy);

    const diag = Math.hypot(rText.width, rText.height);

    return {
      ok: diag <= maxDiagonal + 0.5 && dx <= 2 && dy <= 2,
      diag,
      maxDiagonal,
      dx,
      dy,
    };
  });
  expect(fits.ok).toBe(true);

  // Switch to default
  await page.getByTestId('skin-default').click();
  await expect(page.locator('html')).not.toHaveAttribute('data-skin', 'bathroom');

  // Reload and ensure it sticks
  await page.reload();
  await expect(page.locator('html')).not.toHaveAttribute('data-skin', 'bathroom');

  // Switch back to bathroom
  await page.locator('summary.settings-button').click();
  await page.getByTestId('skin-bathroom').click();
  await expect(page.locator('html')).toHaveAttribute('data-skin', 'bathroom');
});
