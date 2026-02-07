import { expect as baseExpect, test as base } from '@playwright/test';

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      const style = document.createElement('style');
      style.setAttribute('data-playwright', 'stability');
      style.textContent = `
        *,
        *::before,
        *::after {
          animation-duration: 0.001s !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.001s !important;
          scroll-behavior: auto !important;
          caret-color: transparent !important;
        }
        html, body {
          font-family: "DejaVu Sans", "Liberation Sans", Arial, sans-serif !important;
        }
      `;
      document.documentElement.appendChild(style);
    });

    await use(page);
  },
});

export const expect = baseExpect;
