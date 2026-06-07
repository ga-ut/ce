# @ga-ut/ce

Custom Elements runtime with function components, signals, scoped rendering, optional routing, and static page generation.

## Install

```bash
npm i @ga-ut/ce
```

## Runtime Usage

```ts
import { define, derived, html, signal } from "@ga-ut/ce/web";

define(function ProductBadge({ props }) {
  const selected = signal(false);
  const label = derived(() => selected() ? "Selected" : props.label);

  return html`
    <button onclick=${() => selected.update((value) => !value)}>
      ${label}
    </button>
  `;
}, {
  props: {
    label: String,
  },
});
```

## Static Pages

Create a page entry:

```js
import { html, signal } from "@ga-ut/ce/web";

function HomePage() {
  const title = signal("CE Static Site");
  return html`<main><h1>${title}</h1></main>`;
}

export const pages = [
  {
    path: "index.html",
    title: "CE Static Site",
    component: HomePage,
  },
];
```

Generate HTML:

```bash
npx @ga-ut/ce build --entry ./pages.mjs --out ./dist
```

The CLI calls `renderStatic` for each page component and writes complete HTML files. Declarative Shadow DOM is the default output mode.

## Entry Points

- `@ga-ut/ce`
- `@ga-ut/ce/core`
- `@ga-ut/ce/web`
- `ce-cli` package binary

## Documentation

- Public API: `docs/api.md`
- Release checklist: `docs/release.md`
