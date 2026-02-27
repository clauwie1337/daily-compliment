<script lang="ts">
  import { pickCompliment, toUtcDayKey, type ComplimentsData, type DayKey } from '@daily-compliment/core';
  import data from '@daily-compliment/core/data/compliments.en.json';

  import {
    clearHistory,
    loadLastShown,
    loadOrCreateDeviceSeed,
    loadSeenIds,
    migrateStorage,
    saveLastShown,
    saveSeenIds,
    STORAGE_KEYS,
  } from '../lib/storage';

  const complimentsData = data as unknown as ComplimentsData;

  let text = '…';

  let quoteEl: HTMLParagraphElement | null = null;
  let cardEl: HTMLElement | null = null;

  function isCircleFitSkin(): boolean {
    try {
      const skin = document.documentElement.getAttribute('data-skin');
      return skin === 'bathroom' || skin === 'azulejo';
    } catch {
      return false;
    }
  }

  function readSafeCircleDiameterRatio(): number {
    try {
      const raw = getComputedStyle(document.documentElement)
        .getPropertyValue('--dc-safe-circle-diameter')
        .trim();
      const n = Number.parseFloat(raw);
      return Number.isFinite(n) && n > 0 && n <= 1 ? n : 0.7;
    } catch {
      return 0.7;
    }
  }

  let fitSeq = 0;

  async function fitCircleText() {
    if (!quoteEl || !cardEl) return;

    const enabled = isCircleFitSkin();

    // If not in a circle-fit skin, ensure we don't keep an inline override.
    if (!enabled) {
      quoteEl.style.removeProperty('font-size');
      return;
    }

    // Reset any previous inline shrinking so short quotes can grow back.
    quoteEl.style.removeProperty('font-size');

    // Wait a tick so layout is up to date after text change.
    await tick();

    const card = cardEl.getBoundingClientRect();
    const size = Math.min(card.width, card.height);
    if (!Number.isFinite(size) || size <= 0) return;

    const diameterRatio = readSafeCircleDiameterRatio();
    const diameter = size * diameterRatio;
    const margin = Math.max(10, Math.round(size * 0.03));
    const maxDiagonal = Math.max(0, diameter - margin);

    // Start from computed font-size (but cap it so we don't accidentally start huge).
    const computed = getComputedStyle(quoteEl);
    const base = Number.parseFloat(computed.fontSize || '0');
    if (!Number.isFinite(base) || base <= 0) return;

    const startPx = Math.min(base, 56);
    const minPx = 14;

    let px = startPx;
    // Iterate down until the text box diagonal fits inside the circle diameter.
    for (let i = 0; i < 28; i++) {
      quoteEl.style.fontSize = `${px}px`;

      // Force a layout read.
      const r = quoteEl.getBoundingClientRect();
      const diag = Math.hypot(r.width, r.height);

      if (diag <= maxDiagonal) return;
      px = Math.max(minPx, px - 2);
      if (px === minPx) break;
    }

    // Final attempt at minimum size.
    quoteEl.style.fontSize = `${minPx}px`;
  }

  function queueFitCircleText(_dep?: unknown) {
    void _dep;

    // SSR guard (Astro builds render the island on the server too).
    if (typeof window === 'undefined') return;
    if (typeof requestAnimationFrame !== 'function') return;

    const seq = ++fitSeq;

    // Deterministic signal for Playwright: mark this fit as pending, then complete.
    try {
      document.documentElement.dataset.dcFitSeq = `p${seq}`;
    } catch {
      // ignore
    }

    // Use rAF so we measure after layout/styles settle.
    requestAnimationFrame(async () => {
      if (seq !== fitSeq) return;
      await fitCircleText();

      // Deterministic signal for Playwright: a new seq means the latest fit finished.
      try {
        document.documentElement.dataset.dcFitSeq = String(seq);
      } catch {
        // ignore
      }
    });
  }

  function getParam(name: string): string | null {
    try {
      const url = new URL(window.location.href);
      return url.searchParams.get(name);
    } catch {
      return null;
    }
  }

  // Storage helpers live in ../lib/storage (NFR-010).

  function pickInitial() {
    // Optional overrides for deterministic E2E.
    const dayParam = getParam('dc_day');
    const day = dayParam && /^\d{4}-\d{2}-\d{2}$/.test(dayParam) ? (dayParam as DayKey) : undefined;
    const forcedId = getParam('dc_id');
    const seedOverride = getParam('dc_seed');

    const hadSeedBefore = !seedOverride && localStorage.getItem(STORAGE_KEYS.deviceSeed);
    const deterministicMode = !!seedOverride || !!day || !!forcedId;

    const seed = loadOrCreateDeviceSeed(localStorage, { override: seedOverride });
    const seen = new Set(loadSeenIds(localStorage));

    const last = loadLastShown(localStorage);
    const effectiveDayKey = day ?? toUtcDayKey(new Date());

    // If a specific id is forced, show it (useful for visual regression stability).
    if (forcedId) {
      const item = complimentsData.compliments.find((c) => c.id === forcedId);
      if (item) {
        seen.add(item.id);
        saveSeenIds(localStorage, [...seen]);
        saveLastShown(localStorage, { id: item.id, dayKey: effectiveDayKey });
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
        saveSeenIds(localStorage, [...seen]);
        saveLastShown(localStorage, { id: item.id, dayKey: effectiveDayKey });
        text = item.text;
        return;
      }
    }

    // If we have a last shown for this day, prefer it.
    if (last?.id) {
      const item = complimentsData.compliments.find((c) => c.id === last.id);
      if (item && (!last.dayKey || last.dayKey === effectiveDayKey)) {
        seen.add(item.id);
        saveSeenIds(localStorage, [...seen]);
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
    saveSeenIds(localStorage, [...seen]);
    saveLastShown(localStorage, { id: result.compliment.id, dayKey: result.dayKey });

    text = result.compliment.text;
  }

  function next() {
    // Next should be random (not deterministic by seed), while still avoiding repeats per device.
    const seen = new Set(loadSeenIds(localStorage));

    const all = complimentsData.compliments;
    const unseen = all.filter((c) => !seen.has(c.id));

    // If we ran out, reset and start fresh.
    const pool = unseen.length > 0 ? unseen : all;
    if (unseen.length === 0) {
      saveSeenIds(localStorage, []);
      localStorage.removeItem(STORAGE_KEYS.lastShown);
      seen.clear();
    }

    if (pool.length === 0) return;

    const u32 = new Uint32Array(1);
    if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) crypto.getRandomValues(u32);
    const idx = u32[0]! % pool.length;

    const item = pool[idx]!;

    const seen2 = new Set(loadSeenIds(localStorage));
    seen2.add(item.id);
    saveSeenIds(localStorage, [...seen2]);
    saveLastShown(localStorage, { id: item.id });

    text = item.text;
  }

  function resetHistory() {
    clearHistory(localStorage);
    pickInitial();
  }

  import { onMount, onDestroy, tick } from 'svelte';

  $: queueFitCircleText(text);

  let skinObserver: MutationObserver | null = null;
  const onResize = () => queueFitCircleText();

  onMount(() => {
    migrateStorage(localStorage);
    pickInitial();
    queueFitCircleText();

    // Re-fit when a circle-fit skin (bathroom/azulejo) is toggled from the settings menu.
    try {
      skinObserver = new MutationObserver(() => queueFitCircleText());
      skinObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-skin'],
      });
    } catch {
      // ignore
    }

    window.addEventListener('resize', onResize);
  });

  onDestroy(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', onResize);
    }
    skinObserver?.disconnect();
    skinObserver = null;
  });
</script>

<div class="hero">
  <div class="compliment-stack">
    <article class="compliment-card" aria-label="compliment" data-testid="compliment-card" bind:this={cardEl}>
      <blockquote>
        <p class="quote" data-testid="compliment" bind:this={quoteEl}>{text}</p>
      </blockquote>
    </article>
  </div>

  <div class="actions-bar" aria-label="actions">
    <button type="button" class="primary" on:click={next} data-testid="next">Next</button>
    <button type="button" class="secondary outline" on:click={resetHistory} data-testid="reset">Reset</button>
  </div>
</div>

<style>
  .quote {
    font-size: clamp(2rem, 4vw, 3rem);
    font-weight: 850;
    line-height: 1.15;
    letter-spacing: -0.015em;
    text-align: center;
    margin: 0;
    color: var(--dc-quote, var(--dc-text));
  }

  /* Bathroom wisdom: handwritten blue ink on tile */
  :global(:root[data-skin='bathroom']) .quote {
    color: var(--dc-ink, #1d4ed8);
    font-family: ui-rounded, "Segoe Print", "Bradley Hand", "Comic Sans MS", "Apple Chancery", cursive;
    font-weight: 850;
    letter-spacing: -0.01em;
    text-shadow: 0 1px 0 rgba(255, 255, 255, 0.6);

    /* Keep the measured box tight + centered for the circle-fit algorithm */
    display: inline-block;
    max-width: 72%;
    margin-inline: auto;
    text-align: center;
    text-wrap: balance;

    /* Base size (JS may scale down further to fit the circle) */
    font-size: clamp(1.4rem, 3.1vw, 2.25rem);
    line-height: 1.18;
  }

  :global(:root[data-skin='bathroom']) article.compliment-card blockquote {
    display: grid;
    place-items: center;
    width: 100%;
  }

  /* Make the quote container feel like a single square tile (no stacked-card illusion). */
  :global(:root[data-skin='bathroom']) .compliment-stack::before,
  :global(:root[data-skin='bathroom']) .compliment-stack::after {
    content: none;
  }

  :global(:root[data-skin='bathroom']) .compliment-stack {
    width: min(30rem, 100%);
  }

  :global(:root[data-skin='bathroom']) article.compliment-card {
    aspect-ratio: 1 / 1;
    padding: 1.4rem;

    display: grid;
    place-items: center;
  }

  :global(:root[data-skin='bathroom']) article.compliment-card blockquote {
    width: 100%;
  }

  /* Azulejo: crisp “ink” text on ceramic tile */
  :global(:root[data-skin='azulejo']) .quote {
    /* Keep the measured box tight + centered for the circle-fit algorithm */
    display: inline-block;
    max-width: 72%;
    margin-inline: auto;
    text-align: center;
    text-wrap: balance;

    /* Base size (JS may scale down further to fit the circle) */
    font-size: clamp(1.4rem, 3.1vw, 2.25rem);
    line-height: 1.18;
  }

  :global(:root[data-skin='azulejo']) article.compliment-card blockquote {
    display: grid;
    place-items: center;
    width: 100%;
  }

  .hero {
    display: grid;
    gap: 1.25rem;
    justify-items: center;
  }

  .compliment-stack {
    width: min(50rem, 100%);
    position: relative;
  }

  /* Stacked-card illusion */
  .compliment-stack::before,
  .compliment-stack::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 22px;
    pointer-events: none;
  }

  .compliment-stack::before {
    transform: translateY(14px) scale(0.985);
    background: linear-gradient(90deg, rgba(79, 70, 229, 0.18), rgba(219, 39, 119, 0.16), rgba(245, 158, 11, 0.14));
    filter: blur(18px);
    opacity: 0.7;
  }

  .compliment-stack::after {
    transform: translateY(8px) scale(0.992);
    border: 1px solid rgba(15, 23, 42, 0.10);
    background: rgba(255, 255, 255, 0.55);
    opacity: 0.35;
  }

  article.compliment-card {
    position: relative;
    z-index: 1;
  }

  .actions-bar {
    width: min(36rem, 100%);

    display: flex;
    justify-content: center;
    gap: 0.75rem;
    flex-wrap: wrap;

    padding: 0.85rem;
    border-radius: 999px;

    border: 1px solid transparent;
    background:
      linear-gradient(var(--dc-surface), var(--dc-surface)) padding-box,
      linear-gradient(90deg, rgba(79, 70, 229, 0.35), rgba(219, 39, 119, 0.28), rgba(245, 158, 11, 0.22))
        border-box;

    box-shadow: 0 14px 34px rgba(0, 0, 0, 0.10);
  }

  /* Make the pill not stretch full width on mobile */
  .actions-bar :global(button) {
    width: auto;
    margin-bottom: 0;
    min-width: 7rem;
  }
</style>
