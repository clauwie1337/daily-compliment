#!/usr/bin/env node
/**
 * Validate compliment datasets.
 *
 * Intended usage:
 *   node --experimental-strip-types scripts/validate-data.ts
 *
 * Or wire via a TS runner (tsx/ts-node) if preferred.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { assertValidComplimentsData } from "../packages/core/src/compliments/validate.ts";

function listJsonFiles(dir: string): string[] {
  const out: string[] = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...listJsonFiles(p));
    else if (ent.isFile() && ent.name.endsWith(".json")) out.push(p);
  }
  return out;
}

function main() {
  const repoRoot = path.resolve(import.meta.dirname, "..");
  const dataDir = path.join(repoRoot, "packages", "core", "data");

  if (!fs.existsSync(dataDir)) {
    console.error(`No data directory found at: ${dataDir}`);
    process.exit(1);
  }

  const files = listJsonFiles(dataDir);
  if (files.length === 0) {
    console.error(`No .json files found under: ${dataDir}`);
    process.exit(1);
  }

  let ok = true;
  for (const file of files) {
    try {
      const raw = fs.readFileSync(file, "utf8");
      const parsed = JSON.parse(raw) as unknown;
      assertValidComplimentsData(parsed);
      console.log(`OK  ${path.relative(repoRoot, file)}`);
    } catch (err) {
      ok = false;
      console.error(`ERR ${path.relative(repoRoot, file)}`);
      console.error(String(err));
    }
  }

  process.exit(ok ? 0 : 2);
}

main();
