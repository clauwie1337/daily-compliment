// @ts-check
import { defineConfig } from 'astro/config';

import svelte from '@astrojs/svelte';

const site = process.env.ASTRO_SITE;
const base = process.env.ASTRO_BASE ?? '/';

// https://astro.build/config
export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  integrations: [svelte()],
});
