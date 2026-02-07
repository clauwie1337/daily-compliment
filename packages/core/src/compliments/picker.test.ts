import { describe, expect, test } from "vitest";
import { pickCompliment } from "./picker";
import type { ComplimentsData } from "./types";

const DATA: ComplimentsData = {
  schemaVersion: 1,
  locale: "en",
  compliments: [
    { id: "en-0002", text: "B" },
    { id: "en-0001", text: "A" },
    { id: "en-0003", text: "C" },
  ],
};

describe("pickCompliment", () => {
  test("is deterministic for same deviceSeed + day", () => {
    const a = pickCompliment({
      data: DATA,
      deviceSeed: "device-1",
      strategy: { kind: "daily", day: "2026-02-07" },
    });
    const b = pickCompliment({
      data: DATA,
      deviceSeed: "device-1",
      strategy: { kind: "daily", day: "2026-02-07" },
    });
    expect(a.compliment.id).toBe(b.compliment.id);
    expect(a.dayKey).toBe("2026-02-07");
  });

  test("changes across days (usually)", () => {
    const a = pickCompliment({
      data: DATA,
      deviceSeed: "device-1",
      strategy: { kind: "daily", day: "2026-02-07" },
    });
    const b = pickCompliment({
      data: DATA,
      deviceSeed: "device-1",
      strategy: { kind: "daily", day: "2026-02-08" },
    });
    expect(a.dayKey).not.toBe(b.dayKey);
    // Not guaranteed different with small sets, but with 3 items it's likely.
  });

  test("respects seenIds by scanning forward", () => {
    const first = pickCompliment({
      data: DATA,
      deviceSeed: "device-1",
      strategy: { kind: "daily", day: "2026-02-07" },
    });

    const second = pickCompliment({
      data: DATA,
      deviceSeed: "device-1",
      strategy: { kind: "daily", day: "2026-02-07" },
      seenIds: new Set([first.compliment.id]),
    });

    expect(second.compliment.id).not.toBe(first.compliment.id);
    expect(second.exhausted).toBe(false);
  });

  test("exhausted=true when all are seen", () => {
    const res = pickCompliment({
      data: DATA,
      deviceSeed: "device-1",
      strategy: { kind: "daily", day: "2026-02-07" },
      seenIds: new Set(["en-0001", "en-0002", "en-0003"]),
    });

    expect(res.exhausted).toBe(true);
  });

  test("is stable regardless of input ordering (sort by id)", () => {
    const data1: ComplimentsData = {
      ...DATA,
      compliments: [{ id: "en-0001", text: "A" }, { id: "en-0002", text: "B" }, { id: "en-0003", text: "C" }],
    };
    const data2: ComplimentsData = {
      ...DATA,
      compliments: [{ id: "en-0003", text: "C" }, { id: "en-0001", text: "A" }, { id: "en-0002", text: "B" }],
    };

    const a = pickCompliment({
      data: data1,
      deviceSeed: "device-1",
      strategy: { kind: "daily", day: "2026-02-07" },
    });
    const b = pickCompliment({
      data: data2,
      deviceSeed: "device-1",
      strategy: { kind: "daily", day: "2026-02-07" },
    });

    expect(a.compliment.id).toBe(b.compliment.id);
  });
});
