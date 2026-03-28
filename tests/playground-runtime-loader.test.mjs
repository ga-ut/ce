import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot =
  process.env.CE_REPO_ROOT ??
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const playgroundScriptPath = path.join(repoRoot, 'docs/site/assets/playground.js');

const expectedWebCandidates = [
  '../../packages/ce/dist/web/index.mjs',
  './dist/web/index.mjs',
  '../dist/web/index.mjs',
  '../../dist/web/index.mjs',
];

const expectedRootFallbackCandidates = [
  '../../packages/ce/dist/index.mjs',
  './dist/index.mjs',
  '../dist/index.mjs',
  '../../dist/index.mjs',
];

test('playground runtime loader prioritizes web entrypoint with root fallback', async () => {
  const content = await readFile(playgroundScriptPath, 'utf8');

  for (const candidate of expectedWebCandidates) {
    assert.match(
      content,
      new RegExp(candidate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      `Expected web runtime candidate "${candidate}" to exist in playground loader.`
    );
  }

  for (const candidate of expectedRootFallbackCandidates) {
    assert.match(
      content,
      new RegExp(candidate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      `Expected root fallback runtime candidate "${candidate}" to exist in playground loader.`
    );
  }

  const firstWebCandidateOffset = content.indexOf(expectedWebCandidates[0]);
  const firstRootFallbackCandidateOffset = content.indexOf(expectedRootFallbackCandidates[0]);

  assert.notEqual(firstWebCandidateOffset, -1, 'Web candidate must exist in loader source.');
  assert.notEqual(firstRootFallbackCandidateOffset, -1, 'Root fallback candidate must exist in loader source.');
  assert.ok(
    firstWebCandidateOffset < firstRootFallbackCandidateOffset,
    'Web candidate list must appear before root fallback candidates.'
  );

  assert.match(
    content,
    /window\.__PLAYGROUND_CE_RUNTIME__ = \{ CE, html \};/,
    'Playground runtime bootstrap assignment must remain unchanged.'
  );
});
