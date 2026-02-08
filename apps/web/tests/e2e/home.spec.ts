import fs from 'node:fs';
import path from 'node:path';
import type { ComplimentsData } from '@daily-compliment/core';
import { expect, test } from './fixtures';

function loadData(): ComplimentsData {
  const repoRoot = path.resolve(import.meta.dirname, '../../../../');
  const dataPath = path.join(repoRoot, 'packages/core/data/compliments.en.json');
  return JSON.parse(fs.readFileSync(dataPath, 'utf8')) as ComplimentsData;
}

test('home loads and shows a compliment', async ({ page }) => {
  const data = loadData();
  const deviceSeed = 'e2e';
  const day = '2026-02-07' as const;

  // We pin the initial compliment deterministically.
  const expectedFirst = data.compliments.find((c) => c.id === 'en-0003');
  if (!expectedFirst) throw new Error('Expected en-0003 to exist in dataset');

  await page.goto(`/?dc_seed=${deviceSeed}&dc_day=${day}&dc_id=${expectedFirst.id}`);
  await expect(page).toHaveTitle(/Daily Compliment/);
  await expect(page.getByRole('heading', { name: 'Daily Compliment' })).toBeVisible();

  await expect(page.getByTestId('compliment')).toHaveText(expectedFirst.text);

  await page.getByTestId('next').click();

  const secondText = await page.getByTestId('compliment').innerText();
  expect(secondText).not.toBe(expectedFirst.text);

  const allTexts = new Set(data.compliments.map((c) => c.text));
  expect(allTexts.has(secondText)).toBe(true);
});
