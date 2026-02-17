# AGENTS Instructions

## Validation Gate (required before commit)
- For source code changes (`src/**`, `index.ts`, `ce.ts`, `App.ts`): run `npm run lint && npm test && npm run build`.
- For runtime/event behavior changes (`tests/**`, custom event handling): additionally run `npm run test:events`.
- For documentation or docs tooling changes (`docs/**`, `scripts/validate-docs.mjs`, `README.md`): run `npm run docs:validate`.
- For package entry metadata changes (`package.json` fields: `exports`, `main`, `module`, `types`, `files`, `sideEffects`): run `npm run build && npm run pack:check`.

## Failure handling
- Do not bypass failing checks.
- Record failing command, probable cause, and impacted scope in the final report.

## Change-scope matrix (independent task units)
1. **Validation policy documentation only**
   - Files: `AGENTS.md`
   - Risk: none (documentation-only)
   - Minimum check: verify examples/commands are runnable in this repository.

2. **Script orchestration only**
   - Files: `package.json` (`scripts` only)
   - Risk: low (non-functional command aliasing)
   - Minimum check: run added scripts end-to-end.

3. **Package metadata/entry changes**
   - Files: `package.json` (`exports/main/module/types/files/sideEffects`)
   - Risk: medium (consumer import/packaging compatibility)
   - Minimum check: `npm run build && npm run pack:check`.

Keep changes minimal and avoid unrelated refactors.
