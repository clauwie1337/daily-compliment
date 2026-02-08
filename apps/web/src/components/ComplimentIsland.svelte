<script lang="ts">
  import { pickCompliment, toUtcDayKey, type ComplimentsData, type DayKey } from '@daily-compliment/core';
  import data from '@daily-compliment/core/data/compliments.en.json';

  type LastShown = {
    dayKey?: string;
    id: string;
  };

  const STORAGE = {
    deviceSeed: 'dc:deviceSeed',
    seenIds: 'dc:seenIds',
    lastShown: 'dc:lastShown',
  };

  const complimentsData = data as unknown as ComplimentsData;

  let text = '…';

  function getParam(name: string): string | null {
    try {
      const url = new URL(window.location.href);
      return url.searchParams.get(name);
    } catch {
      return null;
    }
  }

  function loadSeenIds(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE.seenIds);
      const parsed = raw ? (JSON.parse(raw) as unknown) : [];
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((x) => typeof x === 'string');
    } catch {
      return [];
    }
  }

  function saveSeenIds(ids: string[]) {
    const capped = ids.slice(-500);
    localStorage.setItem(STORAGE.seenIds, JSON.stringify(capped));
  }

  function loadDeviceSeed(): string {
    const override = getParam('dc_seed');
    if (override) return override;

    const existing = localStorage.getItem(STORAGE.deviceSeed);
    if (existing) return existing;

    const seed = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Math.random());
    localStorage.setItem(STORAGE.deviceSeed, seed);
    return seed;
  }

  function loadLastShown(): LastShown | null {
    try {
      const raw = localStorage.getItem(STORAGE.lastShown);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== 'object') return null;
      const obj = parsed as Record<string, unknown>;
      const id = obj.id;
      const dayKey = obj.dayKey;
      if (typeof id !== 'string') return null;
      if (dayKey != null && typeof dayKey !== 'string') return null;
      return { id, dayKey };
    } catch {
      return null;
    }
  }

  function saveLastShown(last: LastShown) {
    localStorage.setItem(STORAGE.lastShown, JSON.stringify(last));
  }

  function pickInitial() {
    // Optional overrides for deterministic E2E.
    const dayParam = getParam('dc_day');
    const day = dayParam && /^\d{4}-\d{2}-\d{2}$/.test(dayParam) ? (dayParam as DayKey) : undefined;
    const forcedId = getParam('dc_id');
    const seedOverride = getParam('dc_seed');

    const hadSeedBefore = !seedOverride && localStorage.getItem(STORAGE.deviceSeed);
    const deterministicMode = !!seedOverride || !!day || !!forcedId;

    const seed = loadDeviceSeed();
    const seen = new Set(loadSeenIds());

    const last = loadLastShown();
    const effectiveDayKey = day ?? toUtcDayKey(new Date());

    // If a specific id is forced, show it (useful for visual regression stability).
    if (forcedId) {
      const item = complimentsData.compliments.find((c) => c.id === forcedId);
      if (item) {
        seen.add(item.id);
        saveSeenIds([...seen]);
        saveLastShown({ id: item.id, dayKey: effectiveDayKey });
        text = item.text;
        return;
      }
    }

    // First-ever visit (no stored seed, no deterministic overrides): show a truly random compliment.
    if (!deterministicMode && !hadSeedBefore && !last?.id && seen.size === 0) {
      const list = complimentsData.compliments;
      if (list.length > 0) {
        const u32 = new Uint32Array(1);
        if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) crypto.getRandomValues(u32);
        const idx = list.length > 0 ? u32[0]! % list.length : 0;
        const item = list[idx]!;

        seen.add(item.id);
        saveSeenIds([...seen]);
        saveLastShown({ id: item.id, dayKey: effectiveDayKey });
        text = item.text;
        return;
      }
    }

    // If we have a last shown for this day, prefer it.
    if (last?.id) {
      const item = complimentsData.compliments.find((c) => c.id === last.id);
      if (item && (!last.dayKey || last.dayKey === effectiveDayKey)) {
        seen.add(item.id);
        saveSeenIds([...seen]);
        text = item.text;
        return;
      }
    }

    const result = pickCompliment({
      data: complimentsData,
      deviceSeed: seed,
      seenIds: seen,
      strategy: { kind: 'daily', day },
    });

    seen.add(result.compliment.id);
    saveSeenIds([...seen]);
    saveLastShown({ id: result.compliment.id, dayKey: result.dayKey });

    text = result.compliment.text;
  }

  function next() {
    const seed = loadDeviceSeed();
    const seen = new Set(loadSeenIds());

    const result = pickCompliment({
      data: complimentsData,
      deviceSeed: seed,
      seenIds: seen,
      strategy: { kind: 'next-unseen' },
    });

    if (result.exhausted) {
      // Reset if we ran out.
      saveSeenIds([]);
      localStorage.removeItem(STORAGE.lastShown);
    }

    const seen2 = new Set(loadSeenIds());
    seen2.add(result.compliment.id);
    saveSeenIds([...seen2]);
    saveLastShown({ id: result.compliment.id });

    text = result.compliment.text;
  }

  function resetHistory() {
    localStorage.removeItem(STORAGE.seenIds);
    localStorage.removeItem(STORAGE.lastShown);
    pickInitial();
  }

  import { onMount } from 'svelte';

  onMount(() => {
    pickInitial();
  });
</script>

<article class="compliment-card" aria-label="compliment">
  <blockquote>
    <p class="quote" data-testid="compliment">{text}</p>
  </blockquote>
</article>

<div class="actions-bar" aria-label="actions">
  <button type="button" class="primary" on:click={next} data-testid="next">Next</button>
  <button type="button" class="secondary outline" on:click={resetHistory} data-testid="reset">Reset</button>
</div>

<style>
  .quote {
    font-size: clamp(2rem, 4vw, 3rem);
    font-weight: 850;
    line-height: 1.15;
    letter-spacing: -0.015em;
    text-align: center;
    margin: 0;
    color: var(--dc-text);
  }

  .actions-bar {
    margin-top: 1.25rem;
    display: flex;
    justify-content: center;
    gap: 0.75rem;
    flex-wrap: wrap;

    padding: 0.75rem;
    border-radius: 999px;
    border: 1px solid rgba(15, 23, 42, 0.10);
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(10px);
    box-shadow: 0 10px 26px rgba(0, 0, 0, 0.08);
  }

  /* Make the pill not stretch full width on mobile */
  .actions-bar :global(button) {
    width: auto;
    margin-bottom: 0;
  }
</style>
