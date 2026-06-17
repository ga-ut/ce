# @ga-ut/ce

Custom Elements runtime with function components, signals, scoped rendering, optional routing, and a dependency-free app bundler.

## Install

```bash
npm i @ga-ut/ce
```

You can also run the CLI without installing it globally:

```bash
npx --package @ga-ut/ce ce-cli build --entry ./src/main.js --out ./dist
```

## Runtime Usage

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

## App Build

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

Generate `index.html` and `app.js`:

```bash
npx --package @ga-ut/ce ce-cli build --entry ./src/main.js --out ./dist --css ./src/ce.css
```

The build command bundles static relative imports, `@ga-ut/ce/web`, and optional `ce:styles` CSS into a browser ESM file. Use `--root` to choose the generated root custom element tag and `--title` to set the document title.

## Browser Bundle

Use `bundle` when you only want the browser ESM file:

```bash
npx --package @ga-ut/ce ce-cli bundle --entry ./src/main.js --out ./dist/app.js --css ./src/ce.css
```

Use the virtual `ce:styles` import to inject the CSS file as `globalStyles`:

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

The CLI intentionally does not transpile TypeScript, process JSX, resolve arbitrary `node_modules`, minify, or support dynamic `import()`. Existing app bundlers can still consume CE normally through `@ga-ut/ce/web`; the CLI is a small CE-focused path for projects that do not want another bundler.

## Entry Points

- `@ga-ut/ce`
- `@ga-ut/ce/core`
- `@ga-ut/ce/web`
- `ce-cli` package binary

## Documentation

- Public API: `docs/api.md`
- Release checklist: `docs/release.md`
