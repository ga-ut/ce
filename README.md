# CE
Custom Element library.

## Repository Layout
- Root: private Bun workspace orchestrator, docs, tests, and CI/workflow files
- `packages/ce`: publishable `@ga-ut/ce` library package
- `apps/playground`: demo app workspace that owns the former root `App.ts`

## Workspace Setup
```bash
bun install
```

## Playground Preview
```bash
bun run preview:playground
```

Default URL: `http://127.0.0.1:4173`

## Usage (Web)
```ts
import { CE, html } from "@ga-ut/ce/web";
```

## Public API
Detailed signatures and compatibility policy are documented in [`docs/api.md`](./docs/api.md).

## Packaging
- Publishable package: `packages/ce`
- Source entry points: `packages/ce/src/index.ts`, `packages/ce/src/core/index.ts`, `packages/ce/src/web/index.ts`
- Canonical outputs: `packages/ce/dist` (mirrored to root `dist` during root builds for docs/Pages compatibility)
- Outputs: ESM + CJS + type declarations via `tsup`

## Breaking change (v2.0.0)
- Root entrypoint no longer exposes the web runtime API.
- Before:
  - `import { CE, html } from "@ga-ut/ce";`
- After:
  - `import { CE, html } from "@ga-ut/ce/web";`

## Quality gates
- `bun run lint`
- `bun run test`
- `bun run build`
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

## Library distribution
- Playground deployment (GitHub Pages) and library distribution (npm) are separate.
- Users consume the package via `npm i @ga-ut/ce` or `bun add @ga-ut/ce` after publish.
- This repository includes `.github/workflows/npm-publish.yml`, which validates from the Bun workspace root and publishes the `packages/ce` workspace on GitHub Release (`v*` tags) when `NPM_TOKEN` is configured.

## Docs Playground
- `docs/site/playground.html` includes an **Active Work** board sourced from `docs/data/roadmap.json`.
- Playground presets now include **CE + Shadow DOM** example that imports `@ga-ut/ce/web` and demonstrates `CE.define`-based custom element rendering.
- Items with `status: "in-progress"` are rendered as current CE repository tasks for quick visibility during reviews.
- Update roadmap data first, then run `npm run docs:validate` before publishing docs changes.
