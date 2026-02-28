# Release, Verification, and Rollback

## CI gate
- Tag release only when `lint + test + build` pass.
- Suggested workflow included at `.github/workflows/release-check.yml`.

## Pre-publish verification
1. `npm ci`
2. `npm run lint`
3. `npm run test`
4. `npm run build`
5. `npm run pack:check` (`npm pack --dry-run`)
6. Confirm the document status board data was refreshed (or explicitly marked as no-change) for this release.

## Publish
- Public package: `npm publish --access public`
- Organization/private policy can override access mode.

## Release notes
Must include:
- Breaking changes (if any)
- Migration guide
- Affected API list

### Migration checklist (v2.0.0)
1. Replace all root imports:
   - Before: `import { CE, html } from "@ga-ut/ce";`
   - After: `import { CE, html } from "@ga-ut/ce/web";`
2. Confirm no package consumer imports web runtime APIs from `@ga-ut/ce` root.
3. Run validation gates in this repository before publish.

## Post-release smoke test
Validate with sample app:
- Route transitions
- State updates
- Event handling

Also confirm the published Pages status board shows the latest status dataset timestamp.

## Rollback / safety
- If issue is found, publish immediate patch (`x.y.(z+1)`) with fix.
- Keep rollback playbook in release PR for reproducibility.
