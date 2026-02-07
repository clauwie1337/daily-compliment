import type { Compliment, ComplimentsData } from "./types";
import { sortComplimentsStable } from "./validate";
import { toUtcDayKey, type DayKey } from "../date";
import { fnv1a32, hashToIndex } from "../hash";

export type PickStrategy =
  | {
      kind: "daily";
      /** Explicit day key override (useful in tests). */
      day?: DayKey;
    }
  | {
      kind: "next-unseen";
    };

export type PickInput = {
  data: ComplimentsData;

  /** A stable, per-device seed (random UUID stored locally). */
  deviceSeed: string;

  /** For daily strategy; defaults to new Date(). */
  now?: Date;

  /** Optional set of already-seen compliment ids for this device. */
  seenIds?: ReadonlySet<string>;

  /** Default: { kind: "daily" } */
  strategy?: PickStrategy;
};

export type PickResult = {
  compliment: Compliment;

  /**
   * Whether we had to ignore seenIds because everything was already seen.
   * Caller can use this to decide to reset persisted state.
   */
  exhausted: boolean;

  /** Deterministic day key used for selection when in daily mode. */
  dayKey?: DayKey;
};

export function pickCompliment(input: PickInput): PickResult {
  const strategy = input.strategy ?? { kind: "daily" as const };
  const seen = input.seenIds ?? new Set<string>();

  const compliments = sortComplimentsStable(input.data.compliments);
  if (compliments.length === 0) throw new Error("No compliments available");

  const dayKey =
    strategy.kind === "daily"
      ? strategy.day ?? toUtcDayKey(input.now ?? new Date())
      : undefined;

  const salt = strategy.kind === "daily" ? `daily:${dayKey}` : "next-unseen";
  const start = hashToIndex(fnv1a32(`${input.deviceSeed}|${salt}`), compliments.length);

  // Find first not-yet-seen, scanning forward from deterministic start index.
  for (let offset = 0; offset < compliments.length; offset++) {
    const c = compliments[(start + offset) % compliments.length]!;
    if (!seen.has(c.id)) {
      return {
        compliment: c,
        exhausted: false,
        dayKey,
      };
    }
  }

  // Everything was seen; fall back deterministically to start index.
  return {
    compliment: compliments[start]!,
    exhausted: true,
    dayKey,
  };
}
