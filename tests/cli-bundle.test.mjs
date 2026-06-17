import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot =
  process.env.CE_REPO_ROOT ??
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cliPath = path.join(repoRoot, 'dist/cli/index.mjs');

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      reject(new Error(`${command} exited ${code}\n${stdout}\n${stderr}`));
    });
  });
}

test('ce-cli bundle emits a single browser module with injected styles', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'ce-bundle-'));

  try {
    await writeFile(
      path.join(tempDir, 'page.js'),
      `import { define, html } from "@ga-ut/ce/web";

export const homePageTag = define(function HomePage() {
  return html\`<main class="p-4">Home</main>\`;
});
`
    );
    await writeFile(
      path.join(tempDir, 'routes.js'),
      `import { homePageTag } from "./page.js";

export const routes = [
  {
    path: "/",
    tag: homePageTag,
  },
];
`
    );
    await writeFile(
      path.join(tempDir, 'main.js'),
      `import { config } from "@ga-ut/ce/web";
import styles from "ce:styles";
import { routes } from "./routes.js";

config({
  globalStyles: [styles],
  entryPoint: "ce-app",
  routes,
});
`
    );
    await writeFile(path.join(tempDir, 'ce.css'), '.p-4 { padding: 1rem; }');

    const outFile = path.join(tempDir, 'dist/app.js');
    await run(
      process.execPath,
      [
        cliPath,
        'bundle',
        '--entry',
        path.join(tempDir, 'main.js'),
        '--out',
        outFile,
        '--css',
        path.join(tempDir, 'ce.css'),
      ],
      { cwd: repoRoot }
    );

    const output = await readFile(outFile, 'utf8');

    assert.match(output, /\.p-4 \{ padding: 1rem; \}/);
    assert.match(output, /var define = CE\.define\.bind\(CE\)/);
    assert.match(output, /const homePageTag = define\(function HomePage/);
    assert.match(output, /const routes = \[/);
    assert.doesNotMatch(output, /^\s*import\s/m);
    assert.doesNotMatch(output, /ce:styles/);
    assert.doesNotMatch(output, /@ga-ut\/ce\/web/);

    await run(process.execPath, ['--check', outFile], { cwd: repoRoot });
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test('ce-cli build emits an app shell and bundled browser module', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'ce-build-'));

  try {
    await writeFile(
      path.join(tempDir, 'page.js'),
      `import { define, html } from "@ga-ut/ce/web";

export const homePageTag = define(function HomePage() {
  return html\`<main class="p-4">Home</main>\`;
});
`
    );
    await writeFile(
      path.join(tempDir, 'main.js'),
      `import { config } from "@ga-ut/ce/web";
import styles from "ce:styles";
import { homePageTag } from "./page.js";

config({
  globalStyles: [styles],
  entryPoint: "ce-app",
  routes: [
    {
      path: "/",
      tag: homePageTag,
    },
  ],
});
`
    );
    await writeFile(path.join(tempDir, 'ce.css'), '.p-4 { padding: 1rem; }');

    const outDir = path.join(tempDir, 'dist');
    await run(
      process.execPath,
      [
        cliPath,
        'build',
        '--entry',
        path.join(tempDir, 'main.js'),
        '--out',
        outDir,
        '--css',
        path.join(tempDir, 'ce.css'),
        '--root',
        'ce-app',
        '--title',
        'CE Test',
      ],
      { cwd: repoRoot }
    );

    const html = await readFile(path.join(outDir, 'index.html'), 'utf8');
    const js = await readFile(path.join(outDir, 'app.js'), 'utf8');

    assert.match(html, /<title>CE Test<\/title>/);
    assert.match(html, /<ce-app><\/ce-app>/);
    assert.match(html, /<script type="module" src="\.\/app\.js"><\/script>/);
    assert.match(js, /\.p-4 \{ padding: 1rem; \}/);
    assert.match(js, /const homePageTag = define\(function HomePage/);
    assert.doesNotMatch(js, /^\s*import\s/m);
    assert.doesNotMatch(js, /ce:styles/);

    await run(process.execPath, ['--check', path.join(outDir, 'app.js')], { cwd: repoRoot });
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});
