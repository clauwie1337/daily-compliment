import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './fixtures';

test('home has no serious accessibility violations', async ({ page }) => {
  await page.goto('/?dc_seed=a11y&dc_day=2026-02-07');

  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''));

  // Keep this strict; if it becomes noisy we can selectively disable rules.
  expect(serious).toEqual([]);
});
