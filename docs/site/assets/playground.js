const ROADMAP_JSON_PATH_CANDIDATES = ['./data/roadmap.json', '../data/roadmap.json'];
const DIST_MODULE_PATH_CANDIDATES = ['./dist/index.mjs', '../dist/index.mjs'];

let ceRuntimeModuleSourcePromise;

const PLAYGROUND_PRESETS = {
  basic: {
    label: 'Basic HTML/CSS/JS',
    source: {
      html: `<section class="demo-card">\n  <h1>CE Playground</h1>\n  <p>아래 버튼을 눌러 상태를 바꿔보세요.</p>\n  <button id="demo-btn" type="button">Click me</button>\n  <p id="demo-status">Ready</p>\n</section>`,
      css: `:root {\n  font-family: Inter, system-ui, sans-serif;\n}\n\nbody {\n  margin: 0;\n  padding: 1rem;\n  background: #f8fafc;\n}\n\n.demo-card {\n  background: white;\n  border: 1px solid #e5e7eb;\n  border-radius: 10px;\n  padding: 1rem;\n}\n\nbutton {\n  border: 1px solid #2563eb;\n  background: #2563eb;\n  color: #fff;\n  border-radius: 8px;\n  padding: 0.45rem 0.75rem;\n}`,
      js: `const button = document.querySelector('#demo-btn');\nconst status = document.querySelector('#demo-status');\n\nbutton?.addEventListener('click', () => {\n  status.textContent = 'Clicked at ' + new Date().toLocaleTimeString();\n});`,
    },
  },
  ce: {
    label: 'CE + Shadow DOM',
    source: {
      html: `<ce-counter></ce-counter>`,
      css: `body {\n  margin: 0;\n  padding: 1rem;\n  font-family: Inter, system-ui, sans-serif;\n  background: #f8fafc;\n}\n\n.note {\n  color: #4b5563;\n  font-size: 0.9rem;\n}`,
      js: `(async () => {\n  const { CE, html } = window.__PLAYGROUND_CE_RUNTIME__ ?? {};
  if (!(CE && html)) {
    throw new Error('CE runtime is unavailable in playground preview.');
  }\n\n  CE.define({\n    name: 'ce-counter',\n    state: { count: 0 },\n    render() {\n      return html\`\n        <style>\n          .card {\n            background: #fff;\n            border: 1px solid #e5e7eb;\n            border-radius: 12px;\n            padding: 1rem;\n            display: grid;\n            gap: 0.6rem;\n          }\n\n          button {\n            width: fit-content;\n            border: 1px solid #2563eb;\n            background: #2563eb;\n            color: #fff;\n            border-radius: 8px;\n            padding: 0.45rem 0.75rem;\n            cursor: pointer;\n          }\n\n          .count {\n            font-weight: 700;\n            color: #1f2937;\n          }\n        </style>\n        <section class="card">\n          <h2>CE Counter (Shadow DOM)</h2>\n          <p>Count: <span class="count">\${this.bind('count')}</span></p>\n          <button onIncrement="click" type="button">Increment</button>\n          <p class="note">이 스타일은 커스텀 엘리먼트의 shadowRoot 내부에 격리되어 렌더링됩니다.</p>\n        </section>\n      \`;\n    },\n    handlers: {\n      onIncrement() {\n        this.setState({ count: this.state.count + 1 });\n      },\n    },\n  });\n})();`,
    },
  },
};

function escapeScriptContent(source) {
  return source.replace(/<\/script/gi, '<\\/script');
}

async function loadCeRuntimeModuleSource() {
  if (!ceRuntimeModuleSourcePromise) {
    ceRuntimeModuleSourcePromise = (async () => {
      for (const candidate of DIST_MODULE_PATH_CANDIDATES) {
        const response = await fetch(candidate, { headers: { accept: 'text/javascript' } });
        if (response.ok) {
          const moduleSource = await response.text();
          return { moduleSource, path: candidate };
        }
      }

      throw new Error(`Unable to load CE runtime module from: ${DIST_MODULE_PATH_CANDIDATES.join(', ')}`);
    })();
  }

  return ceRuntimeModuleSourcePromise;
}

function buildPreviewDocument({ html, css, js, runtimeModuleSource = '' }) {
  const safeJs = escapeScriptContent(js);
  const safeRuntime = escapeScriptContent(runtimeModuleSource);
  const runtimeBootstrap = safeRuntime
    ? `<script type="module">\n${safeRuntime}\nwindow.__PLAYGROUND_CE_RUNTIME__ = { CE, html };\n<\/script>`
    : '';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>${css}</style>
  </head>
  <body>
    ${html}
    ${runtimeBootstrap}
    <script type="module">
${safeJs}
<\/script>
  </body>
</html>`;
}

function renderRoadmapItems(items, listElement) {
  listElement.innerHTML = '';

  for (const item of items) {
    const row = document.createElement('li');
    row.className = 'work-items__item';
    row.innerHTML = `
      <code>${item.id}</code>
      <span class="work-items__meta">${item.owner} · ${item.milestone} · updated ${item.lastUpdated}</span>
      <span class="work-items__badge">${item.status}</span>
    `;
    listElement.appendChild(row);
  }
}

async function fetchRoadmapPayload() {
  for (const candidate of ROADMAP_JSON_PATH_CANDIDATES) {
    const response = await fetch(candidate, { headers: { accept: 'application/json' } });
    if (response.ok) {
      const payload = await response.json();
      return { payload, path: candidate };
    }
  }

  throw new Error(`Unable to load roadmap JSON from: ${ROADMAP_JSON_PATH_CANDIDATES.join(', ')}`);
}

async function setupRoadmapBoard() {
  const status = document.querySelector('[data-playground-roadmap-status]');
  const list = document.querySelector('[data-playground-roadmap-list]');

  if (!(status && list)) {
    return;
  }

  try {
    const { payload, path } = await fetchRoadmapPayload();
    const items = Array.isArray(payload?.items) ? payload.items : [];
    const activeItems = items.filter((item) => item.status === 'in-progress');

    if (activeItems.length === 0) {
      status.textContent = 'No in-progress roadmap item found. Check roadmap.json for the latest status.';
      status.classList.add('status--error');
      return;
    }

    renderRoadmapItems(activeItems, list);
    status.textContent = `${activeItems.length} active roadmap item(s) loaded from ${path}.`;
    status.classList.add('status--ok');
  } catch (error) {
    status.textContent = `Roadmap data is unavailable. (${String(error)})`;
    status.classList.add('status--error');
  }
}

function setupPlayground() {
  const root = document.querySelector('.playground');
  if (!root) {
    return;
  }

  const status = root.querySelector('[data-playground-status]');
  const preview = root.querySelector('[data-playground-preview]');
  const runButton = root.querySelector('[data-playground-run]');
  const resetButton = root.querySelector('[data-playground-reset]');
  const presetButtons = root.querySelectorAll('[data-playground-preset]');
  const htmlEditor = root.querySelector('[data-editor="html"]');
  const cssEditor = root.querySelector('[data-editor="css"]');
  const jsEditor = root.querySelector('[data-editor="js"]');

  if (!(status && preview && runButton && resetButton && htmlEditor && cssEditor && jsEditor)) {
    return;
  }

  let activePresetKey = 'ce';

  const applySource = async (source, options = {}) => {
    const includeCeRuntime = options.includeCeRuntime ?? activePresetKey === 'ce';
    const runtime = includeCeRuntime ? await loadCeRuntimeModuleSource() : null;

    preview.srcdoc = buildPreviewDocument({
      ...source,
      runtimeModuleSource: runtime?.moduleSource ?? '',
    });

    const pathHint = runtime ? ` (runtime: ${runtime.path})` : '';
    status.textContent = `Rendered at ${new Date().toLocaleTimeString()}${pathHint}`;
    status.classList.add('status--ok');
    status.classList.remove('status--error');
  };

  const currentSource = () => ({
    html: htmlEditor.value,
    css: cssEditor.value,
    js: jsEditor.value,
  });

  const applyPreset = async (presetKey) => {
    const preset = PLAYGROUND_PRESETS[presetKey] ?? PLAYGROUND_PRESETS.basic;

    htmlEditor.value = preset.source.html;
    cssEditor.value = preset.source.css;
    jsEditor.value = preset.source.js;
    activePresetKey = presetKey;
    await applySource(preset.source, { includeCeRuntime: presetKey === 'ce' });

    for (const button of Array.from(presetButtons)) {
      const enabled = button.getAttribute('data-playground-preset') === presetKey;
      button.setAttribute('aria-pressed', String(enabled));
    }

    status.textContent = `${preset.label} preset applied.`;
  };

  runButton.addEventListener('click', async () => {
    try {
      await applySource(currentSource());
    } catch (error) {
      status.textContent = `Render failed: ${String(error)}`;
      status.classList.remove('status--ok');
      status.classList.add('status--error');
    }
  });

  resetButton.addEventListener('click', () => {
    void applyPreset('ce');
  });

  for (const button of Array.from(presetButtons)) {
    button.addEventListener('click', () => {
      void applyPreset(button.getAttribute('data-playground-preset') || 'basic');
    });
  }

  void applyPreset('ce');
}

void setupRoadmapBoard();
setupPlayground();
