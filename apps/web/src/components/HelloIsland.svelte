<script lang="ts">
  let count = 0;

  function inc() {
    count += 1;
  }
</script>

<section aria-label="svelte-island">
  <p>Svelte island is working.</p>
  <button type="button" on:click={inc}>Clicked {count} times</button>
</section>

<style>
  section {
    display: grid;
    gap: 0.5rem;
  }

  button {
    width: fit-content;
  }
</style>
