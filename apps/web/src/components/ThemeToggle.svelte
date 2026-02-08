<script lang="ts">
  import { onMount } from 'svelte';

  type ThemeMode = 'system' | 'light' | 'dark';

  const STORAGE_KEY = 'dc:theme';

  let mode: ThemeMode = 'system';

  function apply(next: ThemeMode) {
    mode = next;

    try {
      if (next === 'system') localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }

    const root = document.documentElement;
    if (next === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', next);
  }

  onMount(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') {
        mode = saved;
      } else {
        mode = 'system';
      }
    } catch {
      mode = 'system';
    }
  });

  function onKeyDown(e: KeyboardEvent) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();

    const order: ThemeMode[] = ['light', 'system', 'dark'];
    const idx = Math.max(0, order.indexOf(mode));
    const nextIdx = e.key === 'ArrowLeft' ? (idx + order.length - 1) % order.length : (idx + 1) % order.length;
    apply(order[nextIdx]!);
  }
</script>

<div class="theme" role="radiogroup" aria-label="Theme" on:keydown={onKeyDown}>
  <button
    type="button"
    class:selected={mode === 'light'}
    role="radio"
    aria-checked={mode === 'light'}
    aria-label="Light mode"
    title="Light"
    on:click={() => apply('light')}
  >
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M12 18a6 6 0 1 1 0-12 6 6 0 0 1 0 12Zm0-14.5a1 1 0 0 1 1 1V6a1 1 0 1 1-2 0V4.5a1 1 0 0 1 1-1Zm0 14a1 1 0 0 1 1 1V20a1 1 0 1 1-2 0v-1.5a1 1 0 0 1 1-1ZM3.5 11a1 1 0 0 1 1-1H6a1 1 0 1 1 0 2H4.5a1 1 0 0 1-1-1Zm14.5 0a1 1 0 0 1 1-1H20a1 1 0 1 1 0 2h-1.5a1 1 0 0 1-1-1ZM6.34 6.34a1 1 0 0 1 1.41 0l1.06 1.06a1 1 0 1 1-1.41 1.41L6.34 7.75a1 1 0 0 1 0-1.41Zm9.19 9.19a1 1 0 0 1 1.41 0l1.06 1.06a1 1 0 1 1-1.41 1.41l-1.06-1.06a1 1 0 0 1 0-1.41ZM17.66 6.34a1 1 0 0 1 0 1.41L16.6 8.81a1 1 0 1 1-1.41-1.41l1.06-1.06a1 1 0 0 1 1.41 0ZM8.81 15.19a1 1 0 0 1 0 1.41l-1.06 1.06a1 1 0 1 1-1.41-1.41l1.06-1.06a1 1 0 0 1 1.41 0Z"
      />
    </svg>
  </button>

  <button
    type="button"
    class:selected={mode === 'system'}
    role="radio"
    aria-checked={mode === 'system'}
    aria-label="System theme"
    title="System"
    on:click={() => apply('system')}
  >
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M4 5a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-4v2h2a1 1 0 1 1 0 2H9a1 1 0 1 1 0-2h2v-2H7a3 3 0 0 1-3-3V5Zm3-1a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H7Z"
      />
    </svg>
  </button>

  <button
    type="button"
    class:selected={mode === 'dark'}
    role="radio"
    aria-checked={mode === 'dark'}
    aria-label="Dark mode"
    title="Dark"
    on:click={() => apply('dark')}
  >
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M21 14.5A8.5 8.5 0 0 1 9.5 3a1 1 0 0 1 1.1 1.44A6.5 6.5 0 0 0 19.56 13.4 1 1 0 0 1 21 14.5Zm-9 5A6.5 6.5 0 0 0 17.6 15.3 8.5 8.5 0 0 1 8.7 6.4 6.5 6.5 0 0 0 12 19.5Z"
      />
    </svg>
  </button>
</div>

<style>
  .theme {
    display: inline-flex;
    gap: 0.25rem;
    padding: 0.25rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.85);
    border: 1px solid rgba(15, 23, 42, 0.12);
    box-shadow: 0 10px 22px rgba(0, 0, 0, 0.06);
  }

  button {
    width: 2.25rem;
    height: 2.25rem;
    padding: 0;
    margin: 0;
    border-radius: 999px;
    display: inline-grid;
    place-items: center;
    background: transparent;
    border: 1px solid transparent;
    color: var(--dc-muted);
    cursor: pointer;
  }

  button.selected {
    color: var(--dc-text);
    border-color: rgba(15, 23, 42, 0.18);
    background: rgba(248, 250, 252, 0.95);
  }

  button:focus-visible {
    outline: 3px solid rgba(79, 70, 229, 0.35);
    outline-offset: 2px;
  }

  @media (prefers-color-scheme: dark) {
    :global(:root:not([data-theme])) .theme {
      background: rgba(15, 23, 42, 0.55);
      border-color: rgba(148, 163, 184, 0.22);
    }
    :global(:root:not([data-theme])) button {
      color: rgba(226, 232, 240, 0.8);
    }
    :global(:root:not([data-theme])) button.selected {
      color: #ffffff;
      border-color: rgba(226, 232, 240, 0.25);
      background: rgba(2, 6, 23, 0.45);
    }
  }

  :global(:root[data-theme='dark']) .theme {
    background: rgba(15, 23, 42, 0.55);
    border-color: rgba(148, 163, 184, 0.22);
  }

  :global(:root[data-theme='dark']) button {
    color: rgba(226, 232, 240, 0.8);
  }

  :global(:root[data-theme='dark']) button.selected {
    color: #ffffff;
    border-color: rgba(226, 232, 240, 0.25);
    background: rgba(2, 6, 23, 0.45);
  }
</style>
