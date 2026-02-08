<script lang="ts">
  import { onMount } from 'svelte';
  import ThemeToggle from './ThemeToggle.svelte';
  import SkinToggle from './SkinToggle.svelte';

  let root: HTMLDetailsElement | null = null;

  function close() {
    if (root) root.open = false;
  }

  onMount(() => {
    function onDocClick(e: MouseEvent) {
      if (!root?.open) return;
      const target = e.target as Node | null;
      if (target && root.contains(target)) return;
      close();
    }

    function onKeyDown(e: KeyboardEvent) {
      if (!root?.open) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        // Return focus to summary button.
        root.querySelector('summary')?.focus();
      }
    }

    document.addEventListener('click', onDocClick, true);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('click', onDocClick, true);
      document.removeEventListener('keydown', onKeyDown);
    };
  });
</script>

<details class="settings" bind:this={root}>
  <summary class="settings-button" aria-label="Settings" title="Settings">
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.35 7.35 0 0 0-1.63-.94l-.36-2.54A.5.5 0 0 0 13.9 1h-3.8a.5.5 0 0 0-.49.42l-.36 2.54c-.58.24-1.12.55-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 7.48a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32a.5.5 0 0 0 .6.22l2.39-.96c.5.39 1.05.7 1.63.94l.36 2.54a.5.5 0 0 0 .49.42h3.8a.5.5 0 0 0 .49-.42l.36-2.54c.58-.24 1.12-.55 1.63-.94l2.39.96a.5.5 0 0 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7Z"
      />
    </svg>
  </summary>

  <div class="panel" role="menu" aria-label="Settings menu">
    <div class="section" aria-label="Appearance">
      <div class="item">
        <div class="item-label">Theme</div>
        <div class="item-control">
          <ThemeToggle />
        </div>
      </div>

      <div class="item">
        <div class="item-label">Style</div>
        <div class="item-control">
          <SkinToggle />
        </div>
      </div>
    </div>

    <!-- Future settings go here as more .item rows. -->
  </div>
</details>

<style>
  details.settings {
    position: relative;
    display: inline-block;
    z-index: 10;
  }

  details.settings[open] {
    z-index: 999;
  }

  summary.settings-button {
    list-style: none;
    cursor: pointer;

    width: 2.5rem;
    height: 2.5rem;
    border-radius: 999px;

    display: inline-grid;
    place-items: center;

    border: 1px solid rgba(15, 23, 42, 0.12);
    background: rgba(255, 255, 255, 0.85);
    box-shadow: 0 10px 22px rgba(0, 0, 0, 0.06);
    color: var(--dc-muted);
  }

  summary.settings-button::-webkit-details-marker {
    display: none;
  }

  summary.settings-button::marker {
    content: "";
  }

  /* Pico adds a chevron via summary::after for <details>. Remove it for our icon-only button. */
  summary.settings-button::after {
    content: none !important;
    display: none !important;
  }

  details[open] summary.settings-button {
    color: var(--dc-text);
    border-color: rgba(15, 23, 42, 0.18);
  }

  summary.settings-button:focus-visible {
    outline: 3px solid rgba(79, 70, 229, 0.35);
    outline-offset: 2px;
  }

  .panel {
    position: absolute;
    top: calc(100% + 0.5rem);
    right: 0;
    min-width: 18rem;
    z-index: 1000;

    padding: 0.85rem;
    border-radius: 16px;

    background: var(--dc-surface);
    border: 1px solid var(--dc-border);
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.18);
  }

  .section {
    display: grid;
    gap: 0.75rem;
  }

  .item {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 0.75rem;
  }

  .item-label {
    font-size: 0.95rem;
    color: var(--dc-muted);
  }

  :global(:root[data-theme='dark']) summary.settings-button {
    background: rgba(15, 23, 42, 0.55);
    border-color: rgba(148, 163, 184, 0.22);
    color: rgba(226, 232, 240, 0.82);
  }

  :global(:root[data-theme='dark']) details[open] summary.settings-button {
    color: #ffffff;
    border-color: rgba(226, 232, 240, 0.25);
  }

  @media (prefers-color-scheme: dark) {
    :global(:root:not([data-theme])) summary.settings-button {
      background: rgba(15, 23, 42, 0.55);
      border-color: rgba(148, 163, 184, 0.22);
      color: rgba(226, 232, 240, 0.82);
    }

    :global(:root:not([data-theme])) details[open] summary.settings-button {
      color: #ffffff;
      border-color: rgba(226, 232, 240, 0.25);
    }
  }
</style>
