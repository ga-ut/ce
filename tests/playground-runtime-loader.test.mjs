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

test('playground runtime loader uses the web entrypoint named API', async () => {
  const content = await readFile(playgroundScriptPath, 'utf8');

  for (const candidate of expectedWebCandidates) {
    assert.match(
      content,
      new RegExp(candidate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      `Expected web runtime candidate "${candidate}" to exist in playground loader.`
    );
  }

  assert.doesNotMatch(content, /dist\/index\.mjs/);
  assert.doesNotMatch(content, /__PLAYGROUND_CE_RUNTIME__/);
  assert.doesNotMatch(content, /__PLAYGROUND_CE_MATCH__/);

  assert.match(
    content,
    /window\.__PLAYGROUND_CE_API__ = \{ define, html, signal, derived, effect, match \};/,
    'Playground runtime bootstrap must expose the named web API.'
  );
});
