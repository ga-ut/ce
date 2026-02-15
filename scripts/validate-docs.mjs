#!/usr/bin/env node
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const repoRoot = process.cwd();
const docsRoot = path.join(repoRoot, 'docs');

/** @typedef {{ file: string, message: string }} ValidationError */

const DOC_JSON_REQUIRED_FIELDS = ['id', 'title', 'version'];

async function walkFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const resolved = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return walkFiles(resolved);
      }
      return [resolved];
    })
  );
  return files.flat();
}

function toRepoRelative(filePath) {
  return path.relative(repoRoot, filePath).split(path.sep).join('/');
}

function toSlug(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[`~!@#$%^&*()+=,.<>/?\\|{}\[\]:;'"_-]+/g, '')
    .replace(/\s+/g, '-');
}

function extractHeadingAnchors(markdown) {
  const anchors = new Set();
  for (const line of markdown.split('\n')) {
    const match = line.match(/^#{1,6}\s+(.+)$/);
    if (!match) continue;
    anchors.add(toSlug(match[1]));
  }
  return anchors;
}

async function validateJsonFile(filePath) {
  /** @type {ValidationError[]} */
  const errors = [];
  let parsed;

  try {
    const content = await readFile(filePath, 'utf8');
    parsed = JSON.parse(content);
  } catch (error) {
    errors.push({ file: filePath, message: `Invalid JSON: ${error.message}` });
    return errors;
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    errors.push({ file: filePath, message: 'JSON must be an object at the top level.' });
    return errors;
  }

  const missing = DOC_JSON_REQUIRED_FIELDS.filter((field) => !(field in parsed));
  if (missing.length > 0) {
    errors.push({
      file: filePath,
      message: `Missing required fields: ${missing.join(', ')}`,
    });
  }

  return errors;
}

async function ensurePathExists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

function extractMarkdownLinks(markdown) {
  const matches = markdown.matchAll(/\[[^\]]+\]\(([^)]+)\)/g);
  return [...matches].map((match) => match[1].trim());
}

function isExternalLink(link) {
  return /^https?:\/\//i.test(link) || /^mailto:/i.test(link);
}

async function validateMarkdownLinks(filePath, markdown, headingCache) {
  /** @type {ValidationError[]} */
  const errors = [];
  const links = extractMarkdownLinks(markdown);
  const currentDir = path.dirname(filePath);

  for (const rawLink of links) {
    if (!rawLink || rawLink.startsWith('<') || isExternalLink(rawLink)) {
      continue;
    }

    const [linkPathPart, hashPart] = rawLink.split('#');

    if (!linkPathPart) {
      const currentAnchors = headingCache.get(filePath) ?? extractHeadingAnchors(markdown);
      if (!currentAnchors.has(hashPart)) {
        errors.push({
          file: filePath,
          message: `Broken anchor '#${hashPart}' in '${rawLink}'.`,
        });
      }
      continue;
    }

    const resolvedPath = path.resolve(currentDir, linkPathPart);
    const exists = await ensurePathExists(resolvedPath);

    if (!exists) {
      errors.push({
        file: filePath,
        message: `Broken relative link '${rawLink}' (target not found).`,
      });
      continue;
    }

    if (hashPart && resolvedPath.endsWith('.md')) {
      if (!headingCache.has(resolvedPath)) {
        const targetMarkdown = await readFile(resolvedPath, 'utf8');
        headingCache.set(resolvedPath, extractHeadingAnchors(targetMarkdown));
      }

      const anchors = headingCache.get(resolvedPath);
      if (!anchors?.has(hashPart)) {
        errors.push({
          file: filePath,
          message: `Broken anchor '#${hashPart}' in '${rawLink}'.`,
        });
      }
    }
  }

  return errors;
}

async function main() {
  const allFiles = await walkFiles(docsRoot);
  const jsonFiles = allFiles.filter((file) => file.endsWith('.json'));
  const markdownFiles = allFiles.filter((file) => file.endsWith('.md'));
  /** @type {ValidationError[]} */
  const errors = [];
  const headingCache = new Map();

  for (const file of jsonFiles) {
    errors.push(...(await validateJsonFile(file)));
  }

  for (const file of markdownFiles) {
    const markdown = await readFile(file, 'utf8');
    headingCache.set(file, extractHeadingAnchors(markdown));
    errors.push(...(await validateMarkdownLinks(file, markdown, headingCache)));
  }

  if (errors.length > 0) {
    console.error('❌ Docs validation failed.');
    for (const error of errors) {
      console.error(`- ${toRepoRelative(error.file)}: ${error.message}`);
    }
    process.exit(1);
  }

  console.log(
    `✅ Docs validation passed (${jsonFiles.length} JSON file(s), ${markdownFiles.length} Markdown file(s)).`
  );
}

main().catch((error) => {
  console.error('❌ Unexpected docs validation error.');
  console.error(error);
  process.exit(1);
});
