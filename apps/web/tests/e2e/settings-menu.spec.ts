import { expect, test } from './fixtures';

// Guard against z-index/stacking-context regressions where the settings dropdown
// renders behind the hero card.

test('settings menu renders above the compliment card', async ({ page }) => {
  await page.goto('/?dc_seed=settings&dc_day=2026-02-07&dc_id=en-0003');

  const settings = page.getByLabel('Settings', { exact: true });
  await settings.click();

  const panel = page.getByRole('menu', { name: 'Settings menu' });
  await expect(panel).toBeVisible();

  // Pick a point well inside the panel and ensure it's the top-most element.
  const ok = await page.evaluate(() => {
    const p = document.querySelector('.panel') as HTMLElement | null;
    if (!p) return false;
    const r = p.getBoundingClientRect();
    const x = Math.floor(r.left + r.width / 2);
    const y = Math.floor(r.top + r.height / 2);
    const el = document.elementFromPoint(x, y);
    if (!el) return false;
    return !!(el.closest('.panel') && p.contains(el.closest('.panel')));
  });

  expect(ok).toBe(true);
});
