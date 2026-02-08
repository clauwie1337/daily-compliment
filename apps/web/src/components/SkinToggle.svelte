<script lang="ts">
  import { onMount } from 'svelte';

  type Skin = 'default' | 'bathroom';

  const STORAGE_KEY = 'dc:skin';

  let skin: Skin = 'default';

  function apply(next: Skin) {
    skin = next;

    try {
      if (next === 'default') localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }

    const root = document.documentElement;
    if (next === 'default') root.removeAttribute('data-skin');
    else root.setAttribute('data-skin', next);
  }

  onMount(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      skin = saved === 'bathroom' ? 'bathroom' : 'default';
    } catch {
      skin = 'default';
    }
  });
</script>

<div class="skin" role="radiogroup" aria-label="Style">
  <button
    type="button"
    class:selected={skin === 'default'}
    role="radio"
    aria-checked={skin === 'default'}
    aria-label="Default style"
    title="Default"
    data-testid="skin-default"
    on:click={() => apply('default')}
  >
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M12 2l1.6 4.7L18 8.3l-4.4 1.6L12 14l-1.6-4.1L6 8.3l4.4-1.6L12 2Zm7 9l.9 2.6L22 14l-2.1.4L19 17l-.9-2.6L16 14l2.1-.4L19 11ZM5 12l1.2 3.4L9 16l-2.8.6L5 20l-1.2-3.4L1 16l2.8-.6L5 12Z"
      />
    </svg>
  </button>

  <button
    type="button"
    class:selected={skin === 'bathroom'}
    role="radio"
    aria-checked={skin === 'bathroom'}
    aria-label="Bathroom wisdom style"
    title="Bathroom wisdom"
    data-testid="skin-bathroom"
    on:click={() => apply('bathroom')}
  >
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm0 2v14h14V5H5Zm2 2h4v4H7V7Zm6 0h4v4h-4V7ZM7 13h4v4H7v-4Zm6 0h4v4h-4v-4Z"
      />
    </svg>
  </button>
</div>

<style>
  .skin {
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

  :global(:root[data-theme='dark']) .skin {
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

  @media (prefers-color-scheme: dark) {
    :global(:root:not([data-theme])) .skin {
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
</style>
