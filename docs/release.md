# Release, Verification, and Rollback

## CI gate
- Tag release only when `lint + test + build` pass.
- Suggested workflow included at `.github/workflows/release-check.yml`.

## Pre-publish verification
1. `bun install`
2. `npm run lint`
3. `npm run test`
4. `npm run build`
5. `npm run test:events`
6. `npm run docs:build`
7. `npm run docs:validate`
8. `npm run pack:check` (`packages/ce` workspace `npm pack --dry-run`)

## Publish
- Public package: `cd packages/ce && npm publish --access public`
- Organization/private policy can override access mode.

## Release notes
Must include:
- Breaking changes (if any)
- Migration guide
- Affected API list

### Initial publish checklist (v0.1.0)
1. Confirm the package has not already been published:
   - `npm view @ga-ut/ce version`
2. Confirm consumers use named web-runtime imports:
   - `import { define, html, signal } from "@ga-ut/ce/web";`
3. Confirm consumers do not use legacy object definitions.
4. Use `ce-cli build --entry ./pages.mjs --out ./dist` for static page generation when a site is built from CE page components.
5. Publish from a matching `v0.1.0` tag only.
6. Run validation gates in this repository before publish.

## Post-release smoke test
Validate with sample app:
- Route transitions
- State updates
- Event handling
- Static page generation through `ce-cli`

Also confirm the published Pages status board shows the latest status dataset timestamp.

## Rollback / safety
- If issue is found, publish immediate patch (`x.y.(z+1)`) with fix.
- Keep rollback playbook in release PR for reproducibility.
