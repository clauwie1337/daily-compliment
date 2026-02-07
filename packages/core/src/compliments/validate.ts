import type { Compliment, ComplimentsData } from "./types";

export type ValidationIssue = {
  path: string;
  message: string;
};

export type ValidationResult = {
  ok: boolean;
  issues: ValidationIssue[];
};

type ValidateOpts = {
  /** Minimum number of compliments required (default 1). */
  minCount?: number;
};

const DEFAULT_OPTS: Required<ValidateOpts> = {
  minCount: 1,
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

const LOCALE_RE = /^[a-z]{2,3}(?:-[A-Z]{2})?$/;
const TAG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ID_RE = /^[a-z]{2,3}(?:-[A-Z]{2})?-[0-9]{4,}$/;

export function validateComplimentsData(
  input: unknown,
  opts: ValidateOpts = {}
): ValidationResult {
  const { minCount } = { ...DEFAULT_OPTS, ...opts };
  const issues: ValidationIssue[] = [];

  if (!isRecord(input)) {
    return { ok: false, issues: [{ path: "", message: "Expected an object at root" }] };
  }

  if (input.schemaVersion !== 1) {
    issues.push({ path: "schemaVersion", message: "schemaVersion must be 1" });
  }

  if (!isNonEmptyString(input.locale)) {
    issues.push({ path: "locale", message: "locale must be a non-empty string" });
  } else if (!LOCALE_RE.test(input.locale)) {
    issues.push({ path: "locale", message: `locale looks invalid: ${input.locale}` });
  }

  if (!Array.isArray(input.compliments)) {
    issues.push({ path: "compliments", message: "compliments must be an array" });
    return { ok: false, issues };
  }

  if (input.compliments.length < minCount) {
    issues.push({
      path: "compliments",
      message: `compliments must contain at least ${minCount} item(s)`,
    });
  }

  const seenIds = new Set<string>();

  input.compliments.forEach((c: unknown, i: number) => {
    const basePath = `compliments[${i}]`;

    if (!isRecord(c)) {
      issues.push({ path: basePath, message: "compliment must be an object" });
      return;
    }

    if (!isNonEmptyString(c.id)) {
      issues.push({ path: `${basePath}.id`, message: "id must be a non-empty string" });
    } else {
      if (!ID_RE.test(c.id)) {
        issues.push({
          path: `${basePath}.id`,
          message: `id must match ${ID_RE} (got ${c.id})`,
        });
      }
      if (seenIds.has(c.id)) {
        issues.push({ path: `${basePath}.id`, message: `duplicate id: ${c.id}` });
      }
      seenIds.add(c.id);
    }

    if (!isNonEmptyString(c.text)) {
      issues.push({
        path: `${basePath}.text`,
        message: "text must be a non-empty string",
      });
    } else if (c.text.trim().length > 280) {
      issues.push({
        path: `${basePath}.text`,
        message: "text is too long (max 280 chars)",
      });
    }

    if (c.tags !== undefined) {
      if (!isStringArray(c.tags)) {
        issues.push({ path: `${basePath}.tags`, message: "tags must be string[]" });
      } else {
        const tagSet = new Set<string>();
        c.tags.forEach((t, j) => {
          if (!TAG_RE.test(t)) {
            issues.push({
              path: `${basePath}.tags[${j}]`,
              message: `tag must match ${TAG_RE} (got ${t})`,
            });
          }
          if (tagSet.has(t)) {
            issues.push({
              path: `${basePath}.tags[${j}]`,
              message: `duplicate tag: ${t}`,
            });
          }
          tagSet.add(t);
        });
      }
    }

    if (c.weight !== undefined) {
      if (typeof c.weight !== "number" || !Number.isFinite(c.weight)) {
        issues.push({
          path: `${basePath}.weight`,
          message: "weight must be a finite number",
        });
      } else if (!Number.isInteger(c.weight) || c.weight < 1 || c.weight > 10) {
        issues.push({
          path: `${basePath}.weight`,
          message: "weight must be an integer between 1 and 10",
        });
      }
    }

    // Guard against accidental extra keys? Not enforced yet.
  });

  return { ok: issues.length === 0, issues };
}

export function assertValidComplimentsData(
  input: unknown,
  opts?: ValidateOpts
): asserts input is ComplimentsData {
  const res = validateComplimentsData(input, opts);
  if (res.ok) return;

  const lines = res.issues.map((i) => `- ${i.path || "<root>"}: ${i.message}`);
  throw new Error(`Invalid compliments data:\n${lines.join("\n")}`);
}

export function sortComplimentsStable(compliments: readonly Compliment[]): Compliment[] {
  // Ensure deterministic picking regardless of JSON ordering.
  return [...compliments].sort((a, b) => a.id.localeCompare(b.id));
}
