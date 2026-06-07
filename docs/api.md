# CE Public API

## Import paths

```ts
import {
  define,
  derived,
  effect,
  html,
  match,
  navigate,
  renderStatic,
  setEntryPoint,
  signal,
} from "@ga-ut/ce/web";

import * as core from "@ga-ut/ce";
import * as coreOnly from "@ga-ut/ce/core";
```

The web entrypoint is the public runtime surface for custom elements, signals,
templates, routing, and static rendering helpers. The root and core entrypoints
remain core-only.

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

### `setEntryPoint(entryPoint, options?)`

Sets the router mount element. CE reuses an existing matching element or creates
one.

### `navigate(path)`

Supports history paths such as `/users` and hash paths such as `#/users`, then
renders the registered route.

```ts
define(function UsersPage() {
  return html`<h1>Users</h1>`;
}, { route: "/users" });

setEntryPoint("ce-entry");
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

## Static Site CLI

Create an entry module that exports pages:

```ts
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

Then generate static HTML locally or in CI:

```sh
npx @ga-ut/ce build --entry ./pages.mjs --out ./dist
```

The CLI imports the entry, calls `renderStatic` for each page component, and
writes complete HTML files to the output directory.

## SemVer Policy

- **MAJOR:** public signature changes, component lifecycle behavior changes, or
  routing contract changes.
- **MINOR:** new optional parameters and non-breaking helpers.
- **PATCH:** bug fixes and performance improvements with the same public
  contract.
