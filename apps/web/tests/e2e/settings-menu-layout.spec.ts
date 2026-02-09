import { expect, test } from './fixtures';

test('opening settings does not shift header or quote', async ({ page }) => {
  await page.goto('/?dc_id=en-0003');

  const header = page.locator('header.app-header');
  const card = page.getByTestId('compliment-card');
  const summary = page.locator('summary.settings-button');

  await expect(header).toBeVisible();
  await expect(card).toBeVisible();

  const before = {
    header: await header.boundingBox(),
    card: await card.boundingBox(),
  };

  expect(before.header).not.toBeNull();
  expect(before.card).not.toBeNull();

  // Open
  await summary.click();
  await expect(page.getByRole('menu', { name: 'Settings menu' })).toBeVisible();

  const open = {
    header: await header.boundingBox(),
    card: await card.boundingBox(),
  };

  // Close via Esc
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu', { name: 'Settings menu' })).toBeHidden();

  const after = {
    header: await header.boundingBox(),
    card: await card.boundingBox(),
  };

  const tol = 0.5;

  for (const k of ['header', 'card'] as const) {
    const b = before[k];
    const o = open[k];
    const a = after[k];
    if (!b || !o || !a) throw new Error(`Missing bounding box for ${k}`);

    expect(Math.abs(o.y - b.y)).toBeLessThanOrEqual(tol);
    expect(Math.abs(a.y - b.y)).toBeLessThanOrEqual(tol);
  }
});
