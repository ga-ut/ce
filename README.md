# CE

CE is a small Custom Elements runtime with function components, signals, scoped rendering, optional routing, and a dependency-free app bundler.

## Repository Layout

- `packages/ce`: publishable `@ga-ut/ce` package
- `apps/playground`: interactive playground app
- `docs`: API notes, release notes, data schema docs, and the generated docs site
- `docs/site/build.mjs`: docs site build script

## Setup

```bash
bun install
```

## Install In An App

```bash
npm i @ga-ut/ce
```

Browser code should import from the web entrypoint:

```ts
import { config, define, html, signal } from "@ga-ut/ce/web";
```

## Web Runtime

```ts
import { config, define, derived, html, signal } from "@ga-ut/ce/web";
import styles from "./ce.css?inline";

config({
  globalStyles: [styles],
});

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

## App Build CLI

Create a browser entry:

```js
import { config, define, html } from "@ga-ut/ce/web";
import styles from "ce:styles";

const homePageTag = define(function HomePage() {
  return html`<main class="p-4"><h1>CE App</h1></main>`;
});

config({
  globalStyles: [styles],
  entryPoint: "ce-app",
  routes: [{ path: "/", tag: homePageTag }],
});
```

Build the app shell and browser module without installing a global CLI:

```bash
npx --package @ga-ut/ce ce-cli build --entry ./src/main.js --out ./dist --css ./src/ce.css
```

The command writes `dist/index.html` and `dist/app.js`. The generated HTML contains a root custom element, and `app.js` contains the CE runtime, relative app modules, and optional `ce:styles` CSS text.

Use `--root` to choose the generated root custom element tag and `--title` to set the document title.

## Browser Bundle CLI

Use `bundle` when you only want the browser module:

```bash
npx --package @ga-ut/ce ce-cli bundle --entry ./src/main.js --out ./dist/app.js --css ./src/ce.css
```

The bundle command supports static relative imports, `@ga-ut/ce/web`, and a
virtual `ce:styles` import:

```js
import { config } from "@ga-ut/ce/web";
import styles from "ce:styles";
import { routes } from "./routes.js";

config({
  globalStyles: [styles],
  entryPoint: "ce-app",
  routes,
});
```

## Docs Site

The local docs site is generated through a repository-local build script:

```bash
npm run docs:build
```

That command runs:

```bash
npm run build
node docs/site/build.mjs
```

The generated pages live in `docs/site/*.html`. Source content lives in `docs/site/content/*.html`, and page assembly lives in `docs/site/build.mjs`.

Preview the generated docs from the repository root so the playground can load the built CE runtime:

```bash
python3 -m http.server 4175 --bind 127.0.0.1
```

Open `http://127.0.0.1:4175/docs/site/index.html`. The docs playground is at `http://127.0.0.1:4175/docs/site/playground.html`.

## Playground

```bash
bun run preview:playground
```

Default URL: `http://127.0.0.1:4173`

## Entry Points

- `@ga-ut/ce`: core-only package root
- `@ga-ut/ce/core`: core-only entrypoint
- `@ga-ut/ce/web`: browser runtime helpers and static snapshot helpers
- `ce-cli`: package binary for CE app build and browser bundling

## Quality Gates

- Source/runtime changes: `npm run lint && npm test && npm run build`
- Runtime event behavior: also run `npm run test:events`
- Docs and docs tooling: `npm run docs:validate`
- Package entry metadata: `npm run build && npm run pack:check`

## Release Notes

- API details: [`docs/api.md`](./docs/api.md)
- Release checklist: [`docs/release.md`](./docs/release.md)
- Data schema: [`docs/data/schema.md`](./docs/data/schema.md)
