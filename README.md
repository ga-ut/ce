# CE
Custom Element library.

## Public API
Detailed signatures and compatibility policy are documented in [`docs/api.md`](./docs/api.md).

## Packaging
- Entry points: `src/ce.ts`, `src/index.ts`
- Outputs: ESM + CJS + type declarations via `tsup`

## Quality gates
- `npm run lint`
- `npm run test`
- `npm run build`

## Release flow
Release/rollback/smoke-test checklist is documented in [`docs/release.md`](./docs/release.md).
