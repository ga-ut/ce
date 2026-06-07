import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot =
  process.env.CE_REPO_ROOT ??
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const siteFiles = [
  'docs/site/index.html',
  'docs/site/usage.html',
  'docs/site/components.html',
  'docs/site/roadmap.html',
  'docs/site/api.html',
  'docs/site/release.html',
];

const expectedLinks = [
  'api.html',
  'release.html',
];

const filesWithReferenceLinks = [
  'docs/site/index.html',
  'docs/site/usage.html',
  'docs/site/components.html',
  'docs/site/roadmap.html',
  'docs/site/release.html',
];

test('pages docs references use internal HTML doc pages', async () => {
  for (const relativePath of siteFiles) {
    const fullPath = path.join(repoRoot, relativePath);
    const content = await readFile(fullPath, 'utf8');

    assert.doesNotMatch(
      content,
      /https:\/\/github\.com\/ga-ut\/ce\/blob\/main\/docs\/(?:api|release)\.md|\.\.\/(?:api|release)\.md/,
      `${relativePath} should link to internal docs site pages instead of GitHub markdown or parent traversal.`
    );
  }

  for (const relativePath of filesWithReferenceLinks) {
    const fullPath = path.join(repoRoot, relativePath);
    const content = await readFile(fullPath, 'utf8');

    for (const expected of expectedLinks) {
      assert.match(content, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  }
});

test('usage docs include generated declarative shadow DOM snapshots', async () => {
  const content = await readFile(path.join(repoRoot, 'docs/site/usage.html'), 'utf8');

  assert.doesNotMatch(content, /CE_STATIC:/);
  assert.match(content, /<product-badge label="In stock"><template shadowrootmode="open">/);
  assert.match(content, /<button>\s*In stock\s*<\/button>/);
  assert.doesNotMatch(content, /data-ce-event|data-ce-signal/);
});
