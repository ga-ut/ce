/**
 * GA-UT's shared design decisions as portable CSS.
 *
 * The semantic layer deliberately sits above the raw brand colors so the
 * components can support dark surfaces without changing their public API.
 */
export const gaUiTokens = `
:root,
:host {
  --ga-color-porcelain: #f7f5f1;
  --ga-color-ink: #171816;
  --ga-color-accent: #e84d3d;
  --ga-color-celadon: #b9cdbd;
  --ga-color-focus: #246bfe;

  --ga-surface-canvas: #f7f5f1;
  --ga-surface-subtle: #efede7;
  --ga-surface-raised: #fffefa;
  --ga-surface-inverse: #171816;
  --ga-surface-accent: #cf392c;
  --ga-surface-accent-hover: #b92f25;
  --ga-surface-celadon: #dfe9e1;

  --ga-text-primary: #171816;
  --ga-text-secondary: #5f625c;
  --ga-text-tertiary: #74776f;
  --ga-text-inverse: #fffefa;
  --ga-text-accent: #b92f25;

  --ga-border-subtle: #dedbd4;
  --ga-border-strong: #bdbab2;
  --ga-border-inverse: #343630;
  --ga-focus-ring: rgba(36, 107, 254, 0.3);

  --ga-success: #377653;
  --ga-success-surface: #e5eee7;
  --ga-warning: #9a5a14;
  --ga-warning-surface: #f7ead5;
  --ga-danger: #b9342a;
  --ga-danger-surface: #f8e3df;
  --ga-neutral: #5f625c;
  --ga-neutral-surface: #ebe9e3;

  --ga-font-sans: "SUIT Variable", "Pretendard Variable", Pretendard, Inter,
    ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --ga-font-display: "GA-UT Serif", "Iowan Old Style", "Palatino Linotype",
    Palatino, Georgia, serif;
  --ga-font-mono: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  --ga-font-size-xs: 0.75rem;
  --ga-font-size-sm: 0.875rem;
  --ga-font-size-md: 1rem;
  --ga-font-size-lg: 1.125rem;
  --ga-font-size-xl: 1.375rem;
  --ga-font-weight-regular: 450;
  --ga-font-weight-medium: 590;
  --ga-font-weight-semibold: 680;
  --ga-font-weight-bold: 780;
  --ga-line-tight: 1.2;
  --ga-line-normal: 1.5;

  --ga-space-1: 0.25rem;
  --ga-space-2: 0.5rem;
  --ga-space-3: 0.75rem;
  --ga-space-4: 1rem;
  --ga-space-5: 1.25rem;
  --ga-space-6: 1.5rem;
  --ga-space-8: 2rem;
  --ga-space-10: 2.5rem;
  --ga-space-12: 3rem;
  --ga-space-16: 4rem;

  --ga-radius-sm: 0.5rem;
  --ga-radius-md: 0.75rem;
  --ga-radius-lg: 1rem;
  --ga-radius-round: 999px;

  --ga-shadow-xs: 0 1px 2px rgba(23, 24, 22, 0.08);
  --ga-shadow-sm: 0 1px 2px rgba(23, 24, 22, 0.08),
    0 5px 14px rgba(23, 24, 22, 0.05);
  --ga-shadow-focus: 0 0 0 3px var(--ga-focus-ring);

  --ga-duration-fast: 120ms;
  --ga-duration-base: 180ms;
  --ga-ease-out: cubic-bezier(0.2, 0.8, 0.2, 1);
}

:root[data-theme="dark"],
:host([data-theme="dark"]),
:host-context([data-theme="dark"]),
:host-context(.ga-dark),
:host-context(.theme-dark) {
  --ga-surface-canvas: #171816;
  --ga-surface-subtle: #20221f;
  --ga-surface-raised: #282a26;
  --ga-surface-inverse: #f7f5f1;
  --ga-surface-accent: #f06455;
  --ga-surface-accent-hover: #ff7565;
  --ga-surface-celadon: #263a2d;

  --ga-text-primary: #f7f5f1;
  --ga-text-secondary: #c3c4be;
  --ga-text-tertiary: #999c94;
  --ga-text-inverse: #171816;
  --ga-text-accent: #ff8b7e;

  --ga-border-subtle: #363934;
  --ga-border-strong: #50534c;
  --ga-border-inverse: #dedbd4;
  --ga-focus-ring: rgba(36, 107, 254, 0.48);

  --ga-success: #94cba5;
  --ga-success-surface: #22382a;
  --ga-warning: #f0b867;
  --ga-warning-surface: #422f1d;
  --ga-danger: #ff8b7e;
  --ga-danger-surface: #442824;
  --ga-neutral: #c3c4be;
  --ga-neutral-surface: #30322f;

  --ga-shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.28);
  --ga-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.32),
    0 7px 18px rgba(0, 0, 0, 0.18);
}
`;
