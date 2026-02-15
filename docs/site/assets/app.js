const TASK_A_JSON_PATH = './task-a.json';

const NAV_ITEMS = [
  { href: 'index.html', label: 'Overview', key: 'index' },
  { href: 'components.html', label: 'Components', key: 'components' },
  { href: 'roadmap.html', label: 'Roadmap', key: 'roadmap' },
  { href: 'usage.html', label: 'Usage', key: 'usage' }
];

function mountShell() {
  const pageKey = document.body.dataset.page ?? '';
  const header = document.createElement('header');
  header.className = 'site-header';

  const navLinks = NAV_ITEMS.map(({ href, label, key }) => {
    const current = key === pageKey ? ' aria-current="page"' : '';
    return `<a href="${href}"${current}>${label}</a>`;
  }).join('');

  header.innerHTML = `
    <div class="site-header__inner">
      <h1 class="site-title">CE Docs Site</h1>
      <nav class="site-nav" aria-label="Primary navigation">${navLinks}</nav>
    </div>
  `;

  const main = document.querySelector('main');
  const shell = document.createElement('div');
  shell.className = 'site-shell';
  if (main) {
    main.parentNode?.insertBefore(header, main);
    main.parentNode?.insertBefore(shell, main);
    shell.appendChild(main);

    const footer = document.createElement('footer');
    footer.className = 'site-footer';
    footer.innerHTML = `
      <p>References: <a href="../api.md">docs/api.md</a> · <a href="../release.md">docs/release.md</a></p>
      <p>Task A data source: <code>${TASK_A_JSON_PATH}</code></p>
    `;
    shell.appendChild(footer);
  }
}

async function renderTaskAStatus() {
  const targets = document.querySelectorAll('[data-task-a-status]');
  if (!targets.length) {
    return;
  }

  try {
    const response = await fetch(TASK_A_JSON_PATH, { headers: { accept: 'application/json' } });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    const keys = payload && typeof payload === 'object' ? Object.keys(payload) : [];
    const message = keys.length
      ? `Task A JSON loaded successfully (${keys.length} top-level keys).`
      : 'Task A JSON loaded successfully.';

    for (const el of targets) {
      el.textContent = message;
      el.classList.add('status--ok');
    }
  } catch (error) {
    for (const el of targets) {
      el.textContent = `Task A JSON is unavailable at ${TASK_A_JSON_PATH}. (${String(error)})`;
      el.classList.add('status--error');
    }
  }
}

mountShell();
void renderTaskAStatus();
