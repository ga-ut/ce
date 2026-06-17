# CE Public API

## Import paths

```ts
import {
  config,
  define,
  derived,
  effect,
  html,
  match,
  navigate,
  renderStatic,
  signal,
} from "@ga-ut/ce/web";

import * as core from "@ga-ut/ce";
import * as coreOnly from "@ga-ut/ce/core";
```

The web entrypoint is the public runtime surface for custom elements, signals,
templates, routing, and static rendering helpers. The root and core entrypoints
remain core-only.

## Runtime Config

### `config(options?)`

Configures runtime-wide behavior for CE web components. Global styles are shared
across shadow roots through `adoptedStyleSheets` when the browser supports it,
with a scoped `<style>` fallback for environments that do not.

```ts
import { config, define, html } from "@ga-ut/ce/web";
import styles from "./ce.css?inline";

const homePage = define(function HomePage() {
  return html`<main class="grid gap-4 p-4">Home</main>`;
});

config({
  globalStyles: [styles],
  entryPoint: {
    selector: "ce-app",
    rootElement: document.querySelector("#app")!,
    hydrate: false,
  },
  routes: [
    {
      path: "/",
      tag: homePage,
    },
  ],
});
```

`globalStyles` accepts compiled CSS strings or `CSSStyleSheet` instances. CSS
generation stays with the app toolchain, such as Vite, PostCSS, Tailwind CSS,
UnoCSS, or plain CSS. CE only adopts the resulting stylesheet inside component
shadow roots.

## Component API

### `define(component, options?)`

```ts
define(
  function MyCounter({ props, lifecycle }) {
    const count = signal(props.initial ?? 0);
    const doubled = derived(() => count() * 2);

    lifecycle.cleanup(() => {
      // clear timers, listeners, or requests here
    });

    return html`
      <button onclick=${() => count.update((value) => value + 1)}>
        ${count} / ${doubled}
      </button>
    `;
  },
  {
    props: {
      initial: Number,
    },
  }
);
```

- The function name becomes the custom element tag name:
  `MyCounter` registers `my-counter`.
- `props` are parsed from attributes and tracked reactively.
- `lifecycle.connected`, `lifecycle.cleanup`, and `lifecycle.adopted` register
  instance lifecycle callbacks.
- Inline event handlers use DOM event names, such as `onclick=${handler}`.

### `signal(value)`

```ts
const count = signal(0);

count();
count.value;
count.set(1);
count.update((value) => value + 1);
const unsubscribe = count.subscribe((value) => console.log(value));
```

Signals are callable values with explicit mutation helpers. Reading a signal
inside `derived`, `effect`, or a render callback registers the dependency.

### `derived(compute)`

```ts
const doubled = derived(() => count() * 2);
```

Derived signals recompute when the signals read by `compute` change.

### `effect(callback)`

```ts
effect(() => {
  document.title = `Count ${count()}`;

  return () => {
    document.title = "";
  };
});
```

Effects rerun when their read signals change. Cleanup functions run before the
next effect pass and on component disconnect when the effect is created inside a
component lifecycle scope.

### `html(strings, ...values)`

```ts
html`
  <p>${count}</p>
  <button onclick=${handler} aria-current="${isCurrent}">Save</button>
`;
```

Signals patch text and attribute positions directly. Non-signal render callback
values participate in structural rerenders.

## Router API

### `navigate(path)`

Supports history paths such as `/users` and hash paths such as `#/users`, then
renders the route registered through `config({ routes })`.

```ts
const usersPage = define(function UsersPage() {
  return html`<h1>Users</h1>`;
});

config({
  entryPoint: "ce-entry",
  routes: [
    {
      path: "/users",
      tag: usersPage,
    },
  ],
});

await navigate("/users");
```

## Static Snapshot API

### `renderStatic(component, options?)`

```ts
const markup = await renderStatic<{ initial: NumberConstructor }>(
  function StaticCounter({ props }) {
    const count = signal(props.initial ?? 0);
    const doubled = derived(() => count() * 2);

    return html`
      <button onclick=${() => count.update((value) => value + 1)}>
        ${count} / ${doubled}
      </button>
    `;
  },
  {
    props: {
      initial: 2,
    },
  }
);
```

The default output is Declarative Shadow DOM:

```html
<static-counter initial="2">
  <template shadowrootmode="open">
    <button>2 / 4</button>
  </template>
</static-counter>
```

Static snapshots are intentionally narrow:

- The component function is called once.
- `signal` and `derived` resolve to their current values.
- Event handlers such as `onclick=${handler}` are removed from the static HTML.
- `effect` is skipped to avoid build-time side effects.
- No DOM, `customElements`, `HTMLElement`, or headless browser is required.

Use `mode: "light-dom"` when the static output should be emitted as normal
children instead of Declarative Shadow DOM.

## App Build CLI

Create a browser entry that configures the CE app:

```ts
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

Then generate an app shell and bundled browser module locally or in CI:

```sh
ce-cli build --entry ./src/main.js --out ./dist --css ./src/ce.css
```

The command writes `dist/index.html` and `dist/app.js`.

Use `--root` to choose the generated root custom element tag and `--title` to
set the document title:

```sh
ce-cli build \
  --entry ./src/main.js \
  --out ./dist \
  --css ./src/ce.css \
  --root ce-app \
  --title "CE App"
```

## Browser Bundle CLI

Use `bundle` when you only want one browser ESM file without the generated HTML
shell:

```sh
ce-cli bundle --entry ./src/main.js --out ./dist/app.js --css ./src/ce.css
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

The bundled entry supports static relative imports, `@ga-ut/ce/web`, and
`ce:styles`. It intentionally does not transpile TypeScript, process JSX,
resolve arbitrary `node_modules`, minify, or support dynamic `import()`.
Existing app bundlers can still consume CE normally through `@ga-ut/ce/web`;
the CLI is a small CE-focused path for projects that do not want another
bundler.

## SemVer Policy

- **MAJOR:** public signature changes, component lifecycle behavior changes, or
  routing contract changes.
- **MINOR:** new optional parameters and non-breaking helpers.
- **PATCH:** bug fixes and performance improvements with the same public
  contract.
