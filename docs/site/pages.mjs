import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { derived, html, renderStatic, signal } from '../../dist/web/index.mjs';

const siteRoot = path.dirname(new URL(import.meta.url).pathname);
const contentRoot = path.join(siteRoot, 'content');

const pageMeta = [
  { key: 'index', path: 'index.html', title: 'Overview', navLabel: 'Overview' },
  { key: 'usage', path: 'usage.html', title: 'Usage', navLabel: 'Usage' },
  { key: 'api', path: 'api.html', title: 'API', navLabel: 'API' },
  { key: 'components', path: 'components.html', title: 'Components', navLabel: 'Components' },
  { key: 'roadmap', path: 'roadmap.html', title: 'Roadmap', navLabel: 'Roadmap' },
  { key: 'release', path: 'release.html', title: 'Release', navLabel: 'Release' },
  { key: 'playground', path: 'playground.html', title: 'Playground', navLabel: 'Playground' },
];

const docNavGroups = [
  {
    label: 'Start',
    items: [
      { path: 'index.html', label: 'Overview', key: 'index' },
      { path: 'usage.html', label: 'Usage guide', key: 'usage' },
      { path: 'playground.html', label: 'Playground', key: 'playground' },
    ],
  },
  {
    label: 'Reference',
    items: [
      { path: 'api.html', label: 'Public API', key: 'api' },
      { path: 'components.html', label: 'Component model', key: 'components' },
      { path: 'roadmap.html', label: 'Roadmap', key: 'roadmap' },
    ],
  },
  {
    label: 'Project',
    items: [
      { path: 'release.html', label: 'Release process', key: 'release' },
    ],
  },
];

function slugify(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/&[^;]+;/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'section';
}

function addHeadingIds(content) {
  const seen = new Map();

  return content.replace(/<(h[23])([^>]*)>([\s\S]*?)<\/\1>/g, (match, tag, attrs, body) => {
    if (/\sid=/.test(attrs)) return match;

    const baseId = slugify(body);
    const count = seen.get(baseId) ?? 0;
    seen.set(baseId, count + 1);
    const id = count ? `${baseId}-${count + 1}` : baseId;

    return `<${tag}${attrs} id="${id}">${body}</${tag}>`;
  });
}

function extractToc(content) {
  const items = [];
  const headingPattern = /<(h[23])[^>]*\sid="([^"]+)"[^>]*>([\s\S]*?)<\/\1>/g;
  let match;

  while ((match = headingPattern.exec(content))) {
    items.push({
      id: match[2],
      depth: match[1] === 'h3' ? 3 : 2,
      label: match[3].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(),
    });
  }

  return items;
}

function renderTopNav(activeKey) {
  return pageMeta
    .map(({ path: href, navLabel, key }) => {
      const current = key === activeKey ? ' aria-current="page"' : '';
      return `<a href="${href}"${current}>${navLabel}</a>`;
    })
    .join('\n              ');
}

function renderSideNav(activeKey) {
  return docNavGroups
    .map((group) => {
      const items = group.items
        .map(({ path: href, label, key }) => {
          const current = key === activeKey ? ' aria-current="page"' : '';
          return `<li><a href="${href}"${current}>${label}</a></li>`;
        })
        .join('\n                ');

      return `<section class="docs-nav-group">
              <h2>${group.label}</h2>
              <ul>
                ${items}
              </ul>
            </section>`;
    })
    .join('\n            ');
}

function renderToc(items) {
  if (items.length === 0) return '';

  const links = items
    .map(({ id, depth, label }) => `<li><a href="#${id}" data-depth="${depth}">${label}</a></li>`)
    .join('\n                ');

  return `<nav class="generated-toc" aria-label="On this page">
              <h2>On this page</h2>
              <ul>
                ${links}
              </ul>
            </nav>`;
}

async function renderStaticBlocks() {
  const productBadge = await renderStatic(
    function ProductBadge({ props }) {
      const selected = signal(false);
      const label = derived(() => selected() ? 'Selected' : props.label);

      return html`
        <style>
          button {
            border: 1px solid #2563eb;
            border-radius: 8px;
            background: #fff;
            color: #1d4ed8;
            font: inherit;
            font-weight: 700;
            padding: 0.55rem 0.75rem;
          }
        </style>
        <button onclick=${() => selected.update((value) => !value)}>
          ${label}
        </button>
      `;
    },
    {
      props: {
        label: 'In stock',
      },
    }
  );

  return new Map([
    ['product-badge', productBadge],
  ]);
}

function applyStaticBlocks(content, staticBlocks) {
  return content.replace(
    /<!--\s*CE_STATIC:([\w-]+)\s*-->/g,
    (match, key) => staticBlocks.get(key) ?? match
  );
}

function DocsPage({ props }) {
  return html`
    <div class="site-page">
      <header class="site-header">
        <div class="site-header__inner">
          <h1 class="site-title">CE Docs Site</h1>
          <nav class="site-nav" aria-label="Primary navigation">
            ${props.topNav}
          </nav>
        </div>
      </header>
      <div class="site-shell">
        <div class="docs-layout">
          <aside class="docs-sidebar" aria-label="Documentation sections">
            ${props.sideNav}
          </aside>
          <div class="docs-main">
            <main>
              ${props.content}
            </main>
            <footer class="site-footer">
              <p>CE docs describe the runtime surface, component model, release gates, and playground examples in-place.</p>
            </footer>
          </div>
          <aside class="docs-toc" aria-label="On this page">
            ${props.toc}
          </aside>
        </div>
      </div>
    </div>
  `;
}

const staticBlocks = await renderStaticBlocks();

export const pages = await Promise.all(
  pageMeta.map(async (page) => {
    const sourceContent = await readFile(path.join(contentRoot, page.path), 'utf8');
    const contentWithBlocks = applyStaticBlocks(sourceContent, staticBlocks);
    const content = addHeadingIds(contentWithBlocks);
    const toc = renderToc(extractToc(content));
    const scripts = page.key === 'playground'
      ? '    <script defer src="assets/playground.js?v=20260607-js-visible"></script>\n'
      : '';

    return {
      path: page.path,
      title: `CE Docs Site | ${page.title}`,
      component: DocsPage,
      mode: 'light-dom',
      head: `    <link rel="stylesheet" href="assets/styles.css?v=20260607-static-docs" />\n${scripts}`,
      props: {
        topNav: renderTopNav(page.key),
        sideNav: renderSideNav(page.key),
        content,
        toc,
      },
    };
  })
);
