<script lang="ts">
  import { pickCompliment, type ComplimentsData, type DayKey } from '@daily-compliment/core';
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
  let meta = '';

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
    const seed = loadDeviceSeed();
    const seen = new Set(loadSeenIds());

    // Optional day override for deterministic E2E.
    const dayParam = getParam('dc_day');
    const day = dayParam && /^\d{4}-\d{2}-\d{2}$/.test(dayParam) ? (dayParam as DayKey) : undefined;

    const last = loadLastShown();
    const dayKey = day ?? undefined;

    // If we have a last shown for this day, prefer it.
    if (last?.id) {
      const item = complimentsData.compliments.find((c) => c.id === last.id);
      if (item && (!last.dayKey || !dayKey || last.dayKey === dayKey)) {
        seen.add(item.id);
        saveSeenIds([...seen]);
        text = item.text;
        meta = `#${item.id}`;
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
    meta = `#${result.compliment.id}`;
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
    meta = `#${result.compliment.id}`;
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

  <div class="meta" aria-label="compliment-meta">{meta}</div>

  <div class="actions" aria-label="actions">
    <button type="button" on:click={next} data-testid="next">Next</button>
    <button type="button" class="secondary outline" on:click={resetHistory} data-testid="reset">
      Reset
    </button>
  </div>
</article>

<style>
  .quote {
    font-size: clamp(2rem, 4vw, 3rem);
    font-weight: 800;
    line-height: 1.15;
    letter-spacing: -0.015em;
    text-align: center;
    margin: 0;
  }

  .meta {
    margin-top: 0.9rem;
    text-align: center;
    opacity: 0.7;
    font-size: 0.95rem;
  }

  .actions {
    margin-top: 1.25rem;
    display: flex;
    justify-content: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
</style>
