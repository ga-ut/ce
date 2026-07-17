export const gaUiFoundations = `
:host {
  box-sizing: border-box;
  color: var(--ga-text-primary);
  font-family: var(--ga-font-sans);
  font-size: var(--ga-font-size-md);
  line-height: var(--ga-line-normal);
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

:host([hidden]) {
  display: none !important;
}

*,
*::before,
*::after {
  box-sizing: inherit;
}

button,
input,
textarea,
select {
  color: inherit;
  font: inherit;
}

button {
  -webkit-tap-highlight-color: transparent;
}

::selection {
  background: color-mix(in srgb, var(--ga-color-accent) 24%, transparent);
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
`;
