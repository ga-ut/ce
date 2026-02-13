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

## Publish
- Public package: `npm publish --access public`
- Organization/private policy can override access mode.

## Release notes
Must include:
- Breaking changes (if any)
- Migration guide
- Affected API list

## Post-release smoke test
Validate with sample app:
- Route transitions
- State updates
- Event handling

## Rollback / safety
- If issue is found, publish immediate patch (`x.y.(z+1)`) with fix.
- Keep rollback playbook in release PR for reproducibility.
