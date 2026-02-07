import { describe, expect, test } from "vitest";
import { validateComplimentsData } from "./validate";

describe("validateComplimentsData", () => {
  test("accepts a minimal valid dataset", () => {
    const res = validateComplimentsData({
      schemaVersion: 1,
      locale: "en",
      compliments: [{ id: "en-0001", text: "Hello" }],
    });
    expect(res.ok).toBe(true);
    expect(res.issues).toEqual([]);
  });

  test("rejects non-object root", () => {
    const res = validateComplimentsData(null);
    expect(res.ok).toBe(false);
  });

  test("rejects duplicate ids", () => {
    const res = validateComplimentsData({
      schemaVersion: 1,
      locale: "en",
      compliments: [
        { id: "en-0001", text: "A" },
        { id: "en-0001", text: "B" },
      ],
    });
    expect(res.ok).toBe(false);
    expect(res.issues.some((i) => i.message.includes("duplicate id"))).toBe(true);
  });

  test("rejects invalid tags and duplicate tags", () => {
    const res = validateComplimentsData({
      schemaVersion: 1,
      locale: "en",
      compliments: [{ id: "en-0001", text: "A", tags: ["Work", "work"] }],
    });
    expect(res.ok).toBe(false);
    expect(res.issues.some((i) => i.path.includes("tags"))).toBe(true);
  });
});
