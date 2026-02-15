import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const repoRoot = '/workspace/ce';
const docsRoot = path.join(repoRoot, 'docs');

async function runDocsValidation() {
  return new Promise((resolve) => {
    let output = '';
    const child = spawn('node', ['scripts/validate-docs.mjs'], { cwd: repoRoot });

    child.stdout.on('data', (chunk) => {
      output += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      output += chunk.toString();
    });

    child.on('exit', (code) => {
      resolve({ code, output });
    });
  });
}

test('docs validator supports markdown link titles and escaped destinations', async () => {
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'docs-validate-'));
  const fixtureDir = path.join(docsRoot, `.tmp-validate-${path.basename(tmpDir)}`);

  try {
    await mkdir(fixtureDir, { recursive: true });

    const apiDoc = path.join(fixtureDir, 'api reference.md');
    const guideDoc = path.join(fixtureDir, 'guide.md');

    await writeFile(apiDoc, '# API Reference\n', 'utf8');
    await writeFile(
      guideDoc,
      [
        '# Guide',
        '[Titled link](./api\\ reference.md "Reference")',
        '[Nested parens](./api\\ reference.md#api-reference "Section (docs)")',
      ].join('\n'),
      'utf8'
    );

    const result = await runDocsValidation();
    assert.equal(result.code, 0, result.output);
    assert.match(result.output, /Docs validation passed/);
  } finally {
    await rm(fixtureDir, { recursive: true, force: true });
    await rm(tmpDir, { recursive: true, force: true });
  }
});
