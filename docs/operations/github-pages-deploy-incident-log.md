# GitHub Pages Deployment Incident Log

## Date

- 2026-02-15

## Symptoms

- The `actions/deploy-pages@v4` step failed with `Creating Pages deployment failed` and `HttpError: Not Found (404)`.
- The error message included `Ensure GitHub Pages has been enabled`.

## Root Cause

- The workflow completed `upload-pages-artifact`, so artifact creation was not the failing step.
- A `deploy-pages` 404 usually means GitHub Pages is disabled or the Pages source is not set to `GitHub Actions`.
- The primary cause was repository Pages setup, not the `docs/site` or `docs/data` paths.

## Actions Taken

1. Added a preflight check at the start of the `.github/workflows/pages.yml` deploy job.
   - The check calls the GitHub API (`repos.getPages`) to confirm Pages is enabled.
   - If Pages is disabled, the job fails immediately and points operators to the required Settings > Pages source value.
   - If Pages is enabled but `build_type != workflow`, the job fails immediately.
2. Updated deployment failure guidance.
   - The guidance now prioritizes checking Pages enablement and source settings before path troubleshooting.

## Expected Result

- Missing Pages setup is detected before the ambiguous `deploy-pages` 404.
- Operators get a clearer troubleshooting order: settings first, paths second.
