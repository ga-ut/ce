import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const repoRoot = '/workspace/ce';
const siteFiles = [
  'docs/site/index.html',
  'docs/site/usage.html',
  'docs/site/components.html',
  'docs/site/roadmap.html',
  'docs/site/assets/app.js',
];

const expectedLinks = [
  'https://github.com/ga-ut/ce/blob/main/docs/api.md',
  'https://github.com/ga-ut/ce/blob/main/docs/release.md',
];

test('pages docs references use GitHub-hosted markdown links (no parent traversal)', async () => {
  for (const relativePath of siteFiles) {
    const fullPath = path.join(repoRoot, relativePath);
    const content = await readFile(fullPath, 'utf8');

    assert.doesNotMatch(
      content,
      /\.\.\/api\.md|\.\.\/release\.md/,
      `${relativePath} should not use ../*.md links because Pages serves site files from repository subpath root.`
    );

    for (const expected of expectedLinks) {
      assert.match(content, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  }
});
