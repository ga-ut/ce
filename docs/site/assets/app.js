const NAV_ITEMS = [
  { href: 'index.html', label: 'Overview', key: 'index' },
  { href: 'components.html', label: 'Components', key: 'components' },
  { href: 'roadmap.html', label: 'Roadmap', key: 'roadmap' },
  { href: 'usage.html', label: 'Usage', key: 'usage' },
  { href: 'playground.html', label: 'Playground', key: 'playground' }
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
      <p>References: <a href="https://github.com/ga-ut/ce/blob/main/docs/api.md">docs/api.md</a> · <a href="https://github.com/ga-ut/ce/blob/main/docs/release.md">docs/release.md</a></p>
    `;
    shell.appendChild(footer);
  }
}

mountShell();
