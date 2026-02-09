import { expect, test } from './fixtures';

test('azulejo visual', async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('dc:skin', 'azulejo');
      localStorage.setItem('dc:theme', 'light');
    } catch {
      // ignore
    }
  });

  await page.goto('/?dc_seed=visual&dc_day=2026-02-07&dc_id=en-0003');

  const root = page.locator('html');
  await expect(root).toHaveAttribute('data-skin', 'azulejo');
  await expect(root).toHaveAttribute('data-theme', 'light');

  const readVars = () =>
    page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      const get = (name: string) => style.getPropertyValue(name).trim();
      return {
        accent1: get('--dc-accent-1'),
        accent2: get('--dc-accent-2'),
        accent3: get('--dc-accent-3'),
        terracotta: get('--dc-azulejo-terracotta'),
      };
    });

  await expect.poll(readVars).toEqual({
    accent1: '#1d4ed8',
    accent2: '#0f766e',
    accent3: '#d97706',
    terracotta: '#c2410c',
  });

  const headerTitle = page.locator('header.app-header .title');
  await expect(headerTitle).toBeVisible();

  const headerGradient = () => headerTitle.evaluate((el) => getComputedStyle(el).backgroundImage);
  await expect.poll(headerGradient).toContain('rgb(29, 78, 216)');
  await expect.poll(headerGradient).toContain('rgb(15, 118, 110)');
  await expect.poll(headerGradient).toContain('rgb(217, 119, 6)');

  const nextButton = page.getByTestId('next');
  await expect(nextButton).toBeVisible();

  const buttonGradient = () => nextButton.evaluate((el) => getComputedStyle(el).backgroundImage);
  await expect.poll(buttonGradient).toContain('rgb(29, 78, 216)');
  await expect.poll(buttonGradient).toContain('rgb(15, 118, 110)');
  await expect.poll(buttonGradient).toContain('rgb(217, 119, 6)');

  const actionsBar = page.locator('.actions-bar');
  await expect(actionsBar).toBeVisible();

  const actionsBg = () => actionsBar.evaluate((el) => getComputedStyle(el).backgroundImage);
  await expect.poll(actionsBg).toContain('rgba(29, 78, 216');
  await expect.poll(actionsBg).toContain('rgba(15, 118, 110');
  await expect.poll(actionsBg).toContain('rgba(194, 65, 12');

  const card = page.getByTestId('compliment-card');
  await expect(card).toBeVisible();

  const box = await card.boundingBox();
  expect(box).not.toBeNull();
  if (box) {
    const ratio = box.width / box.height;
    expect(ratio).toBeGreaterThan(0.98);
    expect(ratio).toBeLessThan(1.02);
  }

  // Avoid full-layout snapshots (flaky in CI); the tile is deterministic.
  await expect(card).toHaveScreenshot('azulejo-main.png');
});
