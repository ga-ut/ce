# CE

CE is a small Custom Elements runtime with function components, signals, scoped rendering, optional routing, and a static-site CLI that can emit Declarative Shadow DOM snapshots.

## Repository Layout

- `packages/ce`: publishable `@ga-ut/ce` package
- `apps/playground`: interactive playground app
- `docs`: API notes, release notes, data schema docs, and the generated docs site
- `docs/site/pages.mjs`: docs site implementation consumed by the CE CLI

## Setup

```bash
bun install
```

## Web Runtime

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

## Static Site CLI

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

Generate static HTML:

```bash
npx @ga-ut/ce build --entry ./pages.mjs --out ./dist
```

The CLI imports the page entry, calls `renderStatic` for each page component, and writes complete HTML files. The default component output uses Declarative Shadow DOM. Use `mode: "light-dom"` on a page when global document CSS should apply to the generated content.

## Docs Site

The local docs site is generated through the package CLI:

```bash
npm run docs:build
```

That command runs:

```bash
npm run build
node dist/cli/index.mjs build --entry docs/site/pages.mjs --out docs/site
```

The generated pages live in `docs/site/*.html`. Source content lives in `docs/site/content/*.html`, and page assembly lives in `docs/site/pages.mjs`.

## Playground

```bash
bun run preview:playground
```

Default URL: `http://127.0.0.1:4173`

## Entry Points

- `@ga-ut/ce`: core-only package root
- `@ga-ut/ce/core`: core-only entrypoint
- `@ga-ut/ce/web`: browser runtime helpers and static snapshot helpers
- `ce-cli`: package binary for static page generation

## Quality Gates

- Source/runtime changes: `npm run lint && npm test && npm run build`
- Runtime event behavior: also run `npm run test:events`
- Docs and docs tooling: `npm run docs:validate`
- Package entry metadata: `npm run build && npm run pack:check`

## Release Notes

- API details: [`docs/api.md`](./docs/api.md)
- Release checklist: [`docs/release.md`](./docs/release.md)
- Data schema: [`docs/data/schema.md`](./docs/data/schema.md)
