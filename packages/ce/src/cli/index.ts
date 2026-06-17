#!/usr/bin/env node
// @ts-nocheck
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const usage = `Usage:
  ce-cli build --entry <file> --out <dir> [--css <file>] [--root <tag>] [--title <title>]
  ce-cli bundle --entry <file> --out <file> [--css <file>]

Bundle entry:
  import { config } from "@ga-ut/ce/web";
  import styles from "ce:styles";
`;

const cliDir = path.dirname(path.resolve(process.argv[1] ?? "."));

function parseArgs(argv: string[]) {
  const command = argv[2];
  const options: Record<string, string | boolean> = {};

  for (let index = 3; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;

    const key = arg.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      options[key] = true;
      continue;
    }

    options[key] = next;
    index += 1;
  }

  return { command, options };
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function assertCustomElementTag(value: string) {
  if (!/^[a-z][a-z0-9._-]*-[a-z0-9._-]*$/.test(value)) {
    throw new Error(`Root element must be a valid custom element tag name: ${value}`);
  }
}

function renderAppShell(rootTag: string, title: string) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body>
    <${rootTag}></${rootTag}>
    <script type="module" src="./app.js"></script>
  </body>
</html>
`;
}

async function build() {
  const { command, options } = parseArgs(process.argv);

  if (!command || options.help) {
    console.log(usage);
    process.exit(command ? 0 : 1);
  }

  if (command === "bundle") {
    await bundle(options);
    return;
  }

  if (command !== "build") {
    console.error(usage);
    process.exit(1);
  }

  const entry = options.entry;
  const outDir = options.out;
  const cssFile = options.css;
  const rootTag = typeof options.root === "string" ? options.root : "ce-app";
  const title = typeof options.title === "string" ? options.title : "CE App";

  if (typeof entry !== "string" || typeof outDir !== "string") {
    console.error(usage);
    process.exit(1);
  }

  assertCustomElementTag(rootTag);

  const cssText = typeof cssFile === "string" ? await readFile(path.resolve(cssFile), "utf8") : "";
  const resolvedOutDir = path.resolve(outDir);
  const bundleOutput = await createBundle(path.resolve(entry), cssText);

  await mkdir(resolvedOutDir, { recursive: true });
  await writeFile(path.join(resolvedOutDir, "app.js"), bundleOutput);
  await writeFile(path.join(resolvedOutDir, "index.html"), renderAppShell(rootTag, title));

  console.log(`Built CE app in ${path.relative(process.cwd(), resolvedOutDir) || "."}.`);
}

function isRelativeSpecifier(specifier: string) {
  return specifier.startsWith("./") || specifier.startsWith("../");
}

async function fileExists(filePath: string) {
  try {
    await readFile(filePath);
    return true;
  } catch {
    return false;
  }
}

async function resolveModule(specifier: string, importer: string) {
  if (specifier === "@ga-ut/ce/web") {
    const bundledWebEntry = path.resolve(cliDir, "../web/index.mjs");
    if (await fileExists(bundledWebEntry)) return bundledWebEntry;
    return path.resolve(cliDir, "../web/index.ts");
  }

  if (!isRelativeSpecifier(specifier)) {
    throw new Error(
      `ce-cli bundle only supports relative imports, "ce:styles", and "@ga-ut/ce/web": ${specifier}`
    );
  }

  const basePath = path.resolve(path.dirname(importer), specifier);
  const candidates = path.extname(basePath)
    ? [basePath]
    : [
        `${basePath}.js`,
        `${basePath}.mjs`,
        `${basePath}.ts`,
        path.join(basePath, "index.js"),
        path.join(basePath, "index.mjs"),
        path.join(basePath, "index.ts"),
      ];

  for (const candidate of candidates) {
    if (await fileExists(candidate)) return candidate;
  }

  throw new Error(`Unable to resolve import "${specifier}" from ${importer}`);
}

function getDefaultImportName(clause: string | undefined) {
  const trimmed = clause?.trim();
  if (!trimmed || trimmed.startsWith("{") || trimmed.startsWith("*")) return null;
  return trimmed.split(",")[0]?.trim() || null;
}

function stripExports(source: string, modulePath: string) {
  if (/\bexport\s+default\b/.test(source)) {
    throw new Error(`ce-cli bundle does not support default exports yet: ${modulePath}`);
  }

  return source
    .replace(/(^|\n)\s*export\s+(?=(const|let|var|function|class)\s)/g, "$1")
    .replace(/(^|\n)\s*export\s*\{[\s\S]*?\};?/g, "$1");
}

function assertSupportedSyntax(source: string, modulePath: string) {
  if (/\bimport\s*\(/.test(source)) {
    throw new Error(`ce-cli bundle does not support dynamic import(): ${modulePath}`);
  }
}

async function createBundle(entryPath: string, cssText: string) {
  const seen = new Set<string>();
  const chunks: string[] = [];
  const importPattern = /(^|\n)\s*import\s+(?:(.*?)\s+from\s+)?["']([^"']+)["'];?/gs;

  const processModule = async (modulePath: string) => {
    const resolvedPath = path.resolve(modulePath);
    if (seen.has(resolvedPath)) return;
    seen.add(resolvedPath);

    const originalSource = await readFile(resolvedPath, "utf8");
    assertSupportedSyntax(originalSource, resolvedPath);

    const imports = Array.from(originalSource.matchAll(importPattern));

    for (const match of imports) {
      const specifier = match[3];
      if (specifier === "ce:styles") continue;
      const dependencyPath = await resolveModule(specifier, resolvedPath);
      await processModule(dependencyPath);
    }

    const transformed = stripExports(
      originalSource.replace(importPattern, (statement, prefix, clause, specifier) => {
        if (specifier === "ce:styles") {
          const bindingName = getDefaultImportName(clause);
          if (!bindingName) {
            throw new Error(
              `Import "ce:styles" with a default binding, for example: import styles from "ce:styles";`
            );
          }
          return `${prefix}const ${bindingName} = ${JSON.stringify(cssText)};`;
        }

        return prefix;
      }),
      resolvedPath
    ).trim();

    if (transformed) {
      chunks.push(`// ${path.relative(process.cwd(), resolvedPath)}\n${transformed}`);
    }
  };

  await processModule(entryPath);

  return `${chunks.join("\n\n")}\n`;
}

async function bundle(options: Record<string, string | boolean>) {
  const entry = options.entry;
  const outFile = options.out;
  const cssFile = options.css;

  if (typeof entry !== "string" || typeof outFile !== "string") {
    console.error(usage);
    process.exit(1);
  }

  const cssText = typeof cssFile === "string" ? await readFile(path.resolve(cssFile), "utf8") : "";
  const output = await createBundle(path.resolve(entry), cssText);
  const outputPath = path.resolve(outFile);

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, output);

  console.log(`Bundled ${path.relative(process.cwd(), outputPath)}.`);
}

build().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
