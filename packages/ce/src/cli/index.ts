#!/usr/bin/env node
// @ts-nocheck
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { renderStatic } from "../web/ce";

type StaticPage = {
  path: string;
  component: Function;
  props?: Record<string, unknown>;
  attributes?: false | Record<string, unknown>;
  title?: string;
  lang?: string;
  head?: string;
  mode?: "declarative-shadow-dom" | "light-dom";
};

const usage = `Usage:
  ce-cli build --entry <file> --out <dir>

Entry module:
  export const pages = [
    { path: "index.html", title: "Home", component: HomePage, props: {} }
  ];
`;

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
    .replace(/>/g, "&gt;");
}

function renderDocument(page: StaticPage, body: string) {
  const lang = page.lang ?? "en";
  const title = page.title ? escapeHtml(page.title) : "";

  return `<!doctype html>
<html lang="${lang}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    ${title ? `<title>${title}</title>` : ""}
${page.head ?? ""}  </head>
  <body>
${body}
  </body>
</html>
`;
}

async function loadPages(entry: string) {
  const entryUrl = pathToFileURL(path.resolve(entry)).href;
  const module = await import(entryUrl);
  const pages = module.pages ?? module.default;

  if (!Array.isArray(pages)) {
    throw new Error("Entry module must export a pages array.");
  }

  return pages as StaticPage[];
}

async function build() {
  const { command, options } = parseArgs(process.argv);

  if (command !== "build" || options.help) {
    console.log(usage);
    process.exit(command === "build" ? 0 : 1);
  }

  const entry = options.entry;
  const outDir = options.out;

  if (typeof entry !== "string" || typeof outDir !== "string") {
    console.error(usage);
    process.exit(1);
  }

  const pages = await loadPages(entry);

  for (const page of pages) {
    if (!page.path || typeof page.component !== "function") {
      throw new Error("Each page must include path and component.");
    }

    const snapshot = await renderStatic(page.component as any, {
      props: page.props,
      attributes: page.attributes ?? (page.mode === "light-dom" ? false : undefined),
      mode: page.mode,
    });
    const html = renderDocument(page, snapshot);
    const outputPath = path.join(path.resolve(outDir), page.path);

    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, html);
  }

  console.log(`Generated ${pages.length} page(s) in ${outDir}.`);
}

build().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
