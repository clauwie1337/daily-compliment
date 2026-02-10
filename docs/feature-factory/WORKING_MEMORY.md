# Working Memory — Daily Compliment

This is the living scratchpad for decisions, open questions, assumptions, risks, and glossary.

## Decisions (keep short, append-only)
- Static-first app built with **Astro + Svelte islands**.
- No user accounts for MVP; per-device state stored in `localStorage`.
- Deterministic Playwright visual regression; Chromium-only snapshots committed.
- Repo-local Playwright deps approach used because host has **no sudo**.
- Theme + skin are applied **pre-paint** via `<html data-theme>` and `<html data-skin>` to avoid flashes.

## Current Skins
- **Aurora** (internal key: `default`, implemented by *removing* `data-skin`)
- **Bathroom wisdom** (`data-skin='bathroom'`)
- **Azulejo** (`data-skin='azulejo'`)

## Open Questions
- (none currently)

## Assumptions
- Visual snapshots should target the most stable elements (prefer component-level screenshots over full-page when gradients/noise exist).

## Risks / Gotchas
- Repo-local Playwright deps: CI must not use `--with-deps`; local runs use `PW_LOCAL_DEPS=1`.
- GitHub Pages base path must remain correct for `/daily-compliment/`.
- **Noise/gradient layers** can introduce cross-platform pixel diffs; prefer deterministic assertions + element screenshots.
- Workflow noise: the `generate-ai-compliments` workflow has been showing failing runs on push (appears to be a GitHub workflow-file issue). If it becomes a problem, consider fixing/disable-on-push.

## Glossary
- **Skin / Style**: the visual theme applied via `data-skin`.
- **Theme**: light/dark/system applied via `data-theme`.
- **Safe circle**: central circular area intended to remain visually clear for the quote; some skins use JS to shrink text to fit.

## Links
- Live site: https://clauwie1337.github.io/daily-compliment/
- Repo: https://github.com/clauwie1337/daily-compliment
