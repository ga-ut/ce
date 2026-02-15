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

## Operations
- Pages URL: https://ga-ut.github.io/ce/
- Status data refresh cycle: Weekly (every Monday 10:00 KST) and immediately after release
- Operational owner (status updates): Operations Team (release duty)

### Status data update → validation → deployment (Ops quick procedure)
1. Update the status dataset and changelog source used by the Pages site.
2. Validate locally (`npm run lint`, `npm run test`, `npm run build`) and verify status board rendering.
3. Deploy to Pages and confirm the published board reflects the latest status data.
