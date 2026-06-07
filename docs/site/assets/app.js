const DOCS_IS_WORKSPACE_PATH = window.location.pathname.includes('/docs/site/');
const CE_MODULE_PATH_CANDIDATES = DOCS_IS_WORKSPACE_PATH
  ? [
      '../../packages/ce/dist/web/index.mjs',
      '../../dist/web/index.mjs',
      '../dist/web/index.mjs',
      './dist/web/index.mjs',
    ]
  : [
      './dist/web/index.mjs',
      '../dist/web/index.mjs',
      '../../dist/web/index.mjs',
      '../../packages/ce/dist/web/index.mjs',
    ];

const NAV_ITEMS = [
  { href: 'index.html', label: 'Overview', key: 'index' },
  { href: 'components.html', label: 'Components', key: 'components' },
  { href: 'roadmap.html', label: 'Roadmap', key: 'roadmap' },
  { href: 'usage.html', label: 'Usage', key: 'usage' },
  { href: 'api.html', label: 'API', key: 'api' },
  { href: 'release.html', label: 'Release', key: 'release' },
  { href: 'playground.html', label: 'Playground', key: 'playground' }
];

async function loadCeModule() {
  for (const candidate of CE_MODULE_PATH_CANDIDATES) {
    try {
      return await import(new URL(candidate, document.baseURI).href);
    } catch (error) {
      if (candidate === CE_MODULE_PATH_CANDIDATES.at(-1)) {
        throw error;
      }
    }
  }

  throw new Error(`Unable to load CE docs runtime from: ${CE_MODULE_PATH_CANDIDATES.join(', ')}`);
}

function defineDocsShell({ define, html }) {
  if (customElements.get('ce-docs-shell')) {
    return;
  }

  define(
    function CeDocsShell({ props }) {
      const navLinks = NAV_ITEMS.map(({ href, label, key }) => {
        const current = key === props.page ? ' aria-current="page"' : '';
        return `<a href="${href}"${current}>${label}</a>`;
      });

      return html`
        <style>
          :host {
            display: block;
          }

          .site-shell {
            max-width: 980px;
            margin: 0 auto;
            padding: 0 1rem 2rem;
          }

          .site-header {
            position: sticky;
            top: 0;
            z-index: 10;
            background: rgba(248, 250, 252, 0.95);
            backdrop-filter: blur(4px);
            border-bottom: 1px solid #e5e7eb;
            margin-bottom: 1.25rem;
          }

          .site-header__inner {
            max-width: 980px;
            margin: 0 auto;
            padding: 0.85rem 1rem;
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: space-between;
            gap: 0.75rem;
          }

          .site-title {
            margin: 0;
            font-size: 1.1rem;
            color: #1f2937;
          }

          .site-nav {
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
          }

          .site-nav a {
            color: #1f2937;
            text-decoration: none;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            padding: 0.35rem 0.7rem;
            font-size: 0.95rem;
          }

          .site-nav a[aria-current="page"] {
            border-color: #2563eb;
            color: #2563eb;
            font-weight: 600;
          }

          .site-footer {
            border-top: 1px solid #e5e7eb;
            margin-top: 1.5rem;
            padding-top: 1rem;
            color: #6b7280;
            font-size: 0.9rem;
          }

          .site-footer a {
            color: #2563eb;
          }
        </style>
        <header class="site-header">
          <div class="site-header__inner">
            <h1 class="site-title">CE Docs Site</h1>
            <nav class="site-nav" aria-label="Primary navigation">${navLinks}</nav>
          </div>
        </header>
        <div class="site-shell">
          <slot></slot>
          <footer class="site-footer">
            <p>References: <a href="api.html">API reference</a> · <a href="release.html">Release process</a></p>
          </footer>
        </div>
      `;
    },
    {
      props: {
        page: String,
      },
    }
  );
}

function mountShell() {
  const main = document.querySelector('main');
  if (!main) return;

  const shell = document.createElement('ce-docs-shell');
  shell.setAttribute('page', document.body.dataset.page ?? '');
  main.parentNode?.insertBefore(shell, main);
  shell.appendChild(main);
}

loadCeModule()
  .then((ceModule) => {
    defineDocsShell(ceModule);
    mountShell();
  })
  .catch((error) => {
    console.error('Failed to mount CE docs shell.', error);
  });
