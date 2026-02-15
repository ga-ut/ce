# CE Public API & Compatibility Policy

## Stable API (SemVer protected)

### `CE.define(params)`
```ts
CE.define<T, K>(params: {
  name: string;
  state: T;
  route?: string;
  onConnect?: (this: CEInstance<T, K>) => void;
  onDisconnect?: (this: CEInstance<T, K>) => void;
  onAdopt?: (this: CEInstance<T, K>) => void;
  onAttributeChange?: (this: CEInstance<T, K>, name: string, oldValue: string | null, newValue: string | null) => void;
  render: (this: CEInstance<T, K>) => string | HTMLTemplateElement | Promise<string | HTMLTemplateElement>;
  handlers?: K;
})
```
- Registers a custom element once.
- `route` is optional and only used by CE router.
- Each instance receives isolated state cloned from `state`.

### `CE.setEntryPoint(entryPoint: string)`
- Sets the router mount element.
- Reuses an existing element matching selector/tag, or creates one.

### `CE.navigate(path: string)`
- Supports history path (`/users`) and hash path (`#/users`).
- Triggers route render immediately.

### `html(strings, ...values)`
```ts
html<T>(strings: TemplateStringsArray, ...values: Array<string | number | BindToken<T>>): string
```
- Template helper.
- `this.bind(key)` tokens become reactive placeholders.

## Router placement decision
- **Decision**: router remains bundled but optional (used only when `route`, `setEntryPoint`, `navigate` are used).
- Rationale: keep backward compatibility while minimizing forced runtime behavior.

## SemVer policy
- **MAJOR**: signature changes, behavior changes in state lifecycle, routing contract changes.
- **MINOR**: new optional params, new non-breaking helpers.
- **PATCH**: bug fixes/perf improvements with same public contract.
