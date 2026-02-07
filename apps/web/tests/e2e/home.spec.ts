import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { pickCompliment, type ComplimentsData } from '@daily-compliment/core';

function loadData(): ComplimentsData {
  const repoRoot = path.resolve(import.meta.dirname, '../../../../');
  const dataPath = path.join(repoRoot, 'packages/core/data/compliments.en.json');
  return JSON.parse(fs.readFileSync(dataPath, 'utf8')) as ComplimentsData;
}

test('home loads and shows a compliment', async ({ page }) => {
  const data = loadData();
  const deviceSeed = 'e2e';
  const day = '2026-02-07' as const;

  const first = pickCompliment({
    data,
    deviceSeed,
    strategy: { kind: 'daily', day },
  }).compliment;

  await page.goto(`/?dc_seed=${deviceSeed}&dc_day=${day}`);
  await expect(page).toHaveTitle(/Daily Compliment/);
  await expect(page.getByRole('heading', { name: 'Daily Compliment' })).toBeVisible();

  await expect(page.getByTestId('compliment')).toHaveText(first.text);

  await page.getByTestId('next').click();

  const second = pickCompliment({
    data,
    deviceSeed,
    seenIds: new Set([first.id]),
    strategy: { kind: 'next-unseen' },
  }).compliment;

  await expect(page.getByTestId('compliment')).toHaveText(second.text);
});
