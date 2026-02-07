import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { FullConfig } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async function globalSetup(_config: FullConfig) {
  void _config;
  const repoRoot = path.resolve(__dirname, '../../');
  const envFile = path.join(repoRoot, '.cache/playwright-deps.env');
  if (!fs.existsSync(envFile)) return;

  const env = fs.readFileSync(envFile, 'utf8');
  for (const line of env.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) process.env[m[1]] = m[2];
  }
}
