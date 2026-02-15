# CE
Custom Element library.

## Public API
Detailed signatures and compatibility policy are documented in [`docs/api.md`](./docs/api.md).

## Packaging
- Entry points: `src/ce.ts`, `src/index.ts`
- Outputs: ESM + CJS + type declarations via `tsup`

## Quality gates
- `npm run lint`
- `npm run test` (runtime tests)
- `npm run docs:validate` (docs JSON fields + internal link integrity)
- `npm run build`

## CI usage
Call `npm run docs:validate` as an optional, independent CI step to separate documentation validation failures from runtime test failures (`npm run test`).

## Release flow
Release/rollback/smoke-test checklist is documented in [`docs/release.md`](./docs/release.md).
