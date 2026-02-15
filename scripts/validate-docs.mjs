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
    .replace(/[`~!@#$%^&*()+=,.<>/?\\|{}\[\]:;'"!]+/g, '')
    .replace(/\s+/g, '-');
}

function extractHeadingAnchors(markdown) {
  const anchors = new Set();
  const slugCounts = new Map();

  for (const line of markdown.split('\n')) {
    const match = line.match(/^#{1,6}\s+(.+)$/);
    if (!match) continue;

    const baseSlug = toSlug(match[1]);
    const duplicateCount = slugCounts.get(baseSlug) ?? 0;
    const resolvedSlug = duplicateCount === 0 ? baseSlug : `${baseSlug}-${duplicateCount}`;
    slugCounts.set(baseSlug, duplicateCount + 1);
    anchors.add(resolvedSlug);
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

function unescapeMarkdownDestination(text) {
  return text.replace(/\\(.)/g, '$1');
}

function parseMarkdownDestination(rawTarget) {
  const text = rawTarget.trim();
  if (!text) return '';

  if (text.startsWith('<')) {
    const closingBracketIndex = text.indexOf('>');
    if (closingBracketIndex === -1) return '';
    return text.slice(1, closingBracketIndex).trim();
  }

  let destinationEnd = text.length;
  let escaped = false;
  let depth = 0;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (char === '(') {
      depth += 1;
      continue;
    }

    if (char === ')' && depth > 0) {
      depth -= 1;
      continue;
    }

    if (depth === 0 && /\s/.test(char)) {
      destinationEnd = i;
      break;
    }
  }

  return unescapeMarkdownDestination(text.slice(0, destinationEnd));
}

function extractMarkdownLinks(markdown) {
  const links = [];

  for (let i = 0; i < markdown.length; i += 1) {
    if (markdown[i] !== '[') continue;

    const closeBracketIndex = markdown.indexOf(']', i + 1);
    if (closeBracketIndex === -1) continue;

    const openParenIndex = closeBracketIndex + 1;
    if (markdown[openParenIndex] !== '(') continue;

    let cursor = openParenIndex + 1;
    let depth = 1;
    let escaped = false;

    while (cursor < markdown.length && depth > 0) {
      const char = markdown[cursor];

      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '(') {
        depth += 1;
      } else if (char === ')') {
        depth -= 1;
      }

      cursor += 1;
    }

    if (depth !== 0) continue;

    const rawTarget = markdown.slice(openParenIndex + 1, cursor - 1);
    const destination = parseMarkdownDestination(rawTarget);
    if (destination) {
      links.push(destination);
    }

    i = cursor - 1;
  }

  return links;
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
    if (!rawLink || isExternalLink(rawLink)) {
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

    const resolvedPath = linkPathPart.startsWith('/')
      ? path.join(repoRoot, linkPathPart.slice(1))
      : path.resolve(currentDir, linkPathPart);
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
