import type { Page } from '@playwright/test';

/**
 * Waits for the ComplimentIsland circle-fit rAF pass to complete.
 *
 * The app updates `document.documentElement.dataset.dcFitSeq` after each fit.
 */
export async function waitForFitComplete(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const v = document.documentElement.dataset.dcFitSeq;
    return typeof v === 'string' && /^\d+$/.test(v);
  });
}
