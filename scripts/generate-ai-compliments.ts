#!/usr/bin/env node
/**
 * Generate AI compliments and open a PR (used by GitHub Actions).
 *
 * Intended usage:
 *   OPENAI_API_KEY=... node --experimental-strip-types scripts/generate-ai-compliments.ts --count 20 --tags general
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import { assertValidComplimentsData } from '../packages/core/src/compliments/validate.ts';
import type { Compliment, ComplimentsData } from '../packages/core/src/compliments/types.ts';

type Args = {
  file: string;
  count: number;
  tags: string[];
  locale: string;
  model: string;
};

function parseArgs(argv: string[]): Args {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a?.startsWith('--')) continue;
    const key = a.slice(2);
    const val = argv[i + 1];
    if (val && !val.startsWith('--')) {
      args[key] = val;
      i++;
    } else {
      args[key] = 'true';
    }
  }

  const repoRoot = path.resolve(import.meta.dirname, '..');
  const file = args.file
    ? path.resolve(repoRoot, args.file)
    : path.join(repoRoot, 'packages/core/data/compliments.en.json');

  const count = Number(args.count ?? '20');
  if (!Number.isFinite(count) || count <= 0 || count > 200) {
    throw new Error(`--count must be a number between 1 and 200 (got ${args.count})`);
  }

  const tagsRaw = args.tags ?? 'general';
  const tags = tagsRaw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  if (!tags.length) throw new Error('--tags must be a non-empty comma-separated list');

  const locale = (args.locale ?? 'en').trim();
  const model = (args.model ?? process.env.OPENAI_MODEL ?? 'gpt-4o-mini').trim();

  return { file, count, tags, locale, model };
}

function norm(s: string): string {
  return s.trim().replace(/\s+/g, ' ').toLowerCase();
}

function nextId(existing: string[], locale: string, howMany: number): string[] {
  const prefix = `${locale}-`;
  let max = 0;
  for (const id of existing) {
    if (!id.startsWith(prefix)) continue;
    const n = Number(id.slice(prefix.length));
    if (Number.isFinite(n)) max = Math.max(max, n);
  }

  const out: string[] = [];
  for (let i = 0; i < howMany; i++) {
    const n = max + 1 + i;
    out.push(`${prefix}${String(n).padStart(4, '0')}`);
  }
  return out;
}

async function callOpenAIChatCompletion(input: {
  apiKey: string;
  model: string;
  prompt: string;
  count: number;
  tags: string[];
}): Promise<{ text: string }[]> {
  const body = {
    model: input.model,
    messages: [
      {
        role: 'system',
        content:
          'You produce strict JSON only. No markdown, no commentary. Output must be parseable by JSON.parse.',
      },
      {
        role: 'user',
        content:
          input.prompt
            .replace('{count}', String(input.count))
            .concat(`\n\nUse tags: ${JSON.stringify(input.tags)}\n`),
      },
    ],
    temperature: 0.8,
  };

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`OpenAI error: ${resp.status} ${resp.statusText}\n${text}`);
  }

  const json = (await resp.json()) as any;
  const content = json?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') throw new Error('OpenAI response missing message content');

  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    throw new Error(`Model did not return valid JSON. Raw content:\n${content}`);
  }

  const items = parsed?.compliments;
  if (!Array.isArray(items)) throw new Error('JSON must contain {"compliments": [...]}');

  return items
    .map((c: any) => ({ text: c?.text, tags: c?.tags }))
    .filter((c: any) => typeof c.text === 'string')
    .map((c: any) => ({ text: c.text as string }));
}

function loadPrompt(repoRoot: string): string {
  const p = path.join(repoRoot, 'scripts/prompts/compliments-en.md');
  return fs.readFileSync(p, 'utf8');
}

function loadData(file: string): ComplimentsData {
  const raw = fs.readFileSync(file, 'utf8');
  const parsed = JSON.parse(raw) as unknown;
  assertValidComplimentsData(parsed);
  return parsed as ComplimentsData;
}

function writeData(file: string, data: ComplimentsData) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('Missing OPENAI_API_KEY. Refusing to generate.');
    process.exit(2);
  }

  const repoRoot = path.resolve(import.meta.dirname, '..');
  const prompt = loadPrompt(repoRoot);

  const data = loadData(args.file);
  const existingText = new Set(data.compliments.map((c) => norm(c.text)));
  const existingIds = data.compliments.map((c) => c.id);

  const raw = await callOpenAIChatCompletion({
    apiKey,
    model: args.model,
    prompt,
    count: args.count,
    tags: args.tags,
  });

  const filtered: { text: string }[] = [];
  const newText = new Set<string>();
  for (const item of raw) {
    const text = item.text.trim().replace(/\s+/g, ' ');
    if (!text) continue;
    if (text.length > 280) continue;

    const key = norm(text);
    if (existingText.has(key)) continue;
    if (newText.has(key)) continue;
    newText.add(key);
    filtered.push({ text });
  }

  if (filtered.length === 0) {
    console.error('AI generation produced 0 usable new compliments.');
    process.exit(3);
  }

  const ids = nextId(existingIds, args.locale, filtered.length);
  const additions: Compliment[] = filtered.map((x, idx) => ({
    id: ids[idx]!,
    text: x.text,
    tags: args.tags,
  }));

  const updated: ComplimentsData = {
    ...data,
    locale: args.locale,
    compliments: [...data.compliments, ...additions],
  };

  // Validate final dataset before writing.
  assertValidComplimentsData(updated);

  writeData(args.file, updated);

  console.log(`Added ${additions.length} compliments to ${path.relative(repoRoot, args.file)}`);
  console.log(`First new id: ${additions[0]?.id}`);
  console.log(`Last new id: ${additions.at(-1)?.id}`);
}

main().catch((err) => {
  console.error(String(err));
  process.exit(1);
});
