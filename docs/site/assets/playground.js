const PLAYGROUND_IS_WORKSPACE_DOCS_PATH = window.location.pathname.includes('/docs/site/');
// Prefer the canonical workspace build output first; keep root dist paths as compatibility bridges.
const DIST_MODULE_PATH_CANDIDATES = PLAYGROUND_IS_WORKSPACE_DOCS_PATH
  ? [
      '../../packages/ce/dist/web/index.mjs',
      '../../dist/web/index.mjs',
      '../dist/web/index.mjs',
      './dist/web/index.mjs',
      '../../packages/ce/dist/index.mjs',
      '../../dist/index.mjs',
      '../dist/index.mjs',
      './dist/index.mjs',
    ]
  : [
      './dist/web/index.mjs',
      '../dist/web/index.mjs',
      '../../dist/web/index.mjs',
      '../../packages/ce/dist/web/index.mjs',
      './dist/index.mjs',
      '../dist/index.mjs',
      '../../dist/index.mjs',
      '../../packages/ce/dist/index.mjs',
    ];

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
  fine: {
    label: 'Fine-grained counter',
    source: {
      html: `<main class="demo-shell">
  <ce-counter label="Likes" initial="10" step="1"></ce-counter>
  <ce-counter label="Cart" initial="2" step="2"></ce-counter>
  <ce-counter label="Alerts" initial="0" step="5"></ce-counter>
</main>`,
      css: `body {
  margin: 0;
  padding: 1rem;
  font-family: Inter, system-ui, sans-serif;
  background: #f7f8fb;
  color: #172033;
}

.demo-shell {
  display: grid;
  gap: 0.75rem;
  max-width: 680px;
}`,
      js: `(async () => {
  const { CE, html } = window.__PLAYGROUND_CE_RUNTIME__ ?? {};
  if (!(CE && html)) {
    throw new Error('CE runtime is unavailable in playground preview.');
  }

  const renderCounts = new WeakMap();

  CE.define({
    name: 'ce-counter',
    state: {
      label: 'Counter',
      count: 0,
    },
    onConnect() {
      const initial = Number(this.getAttribute('initial') ?? 0);

      this.setState({
        label: this.getAttribute('label') ?? 'Counter',
        count: Number.isFinite(initial) ? initial : 0,
      });

      const value = this.shadowRoot?.querySelector('.value');
      const boundValue = value?.querySelector('[data-ce-bind]');
      if (!(value && boundValue)) return;

      const flash = () => {
        value.classList.remove('is-patched');
        void value.getBoundingClientRect();
        value.classList.add('is-patched');
      };

      new MutationObserver(flash).observe(boundValue, {
        characterData: true,
        childList: true,
        subtree: true,
      });
    },
    render() {
      const calls = (renderCounts.get(this) ?? 0) + 1;
      renderCounts.set(this, calls);

      return html\`
        <style>
          :host {
            display: block;
          }

          .counter {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 0.75rem;
            align-items: center;
            border: 1px solid #d7dce5;
            border-radius: 8px;
            background: #fff;
            padding: 0.85rem;
          }

          strong {
            display: block;
            font-size: 0.95rem;
          }

          .meta {
            color: #5b6475;
            font-size: 0.82rem;
          }

          .value {
            position: relative;
            display: inline-grid;
            min-width: 3rem;
            place-items: center;
            font-size: 1.55rem;
            font-weight: 750;
            border-radius: 8px;
            transition: background-color 140ms ease, color 140ms ease;
          }

          .value.is-patched {
            animation: patch-pulse 520ms ease-out;
          }

          .controls {
            display: flex;
            gap: 0.35rem;
          }

          button {
            width: 2rem;
            height: 2rem;
            border: 1px solid #1f6feb;
            border-radius: 8px;
            background: #1f6feb;
            color: white;
            cursor: pointer;
            font: inherit;
          }

          button[decrement] {
            background: #fff;
            color: #172033;
            border-color: #c9d1dc;
          }

          @keyframes patch-pulse {
            0% {
              background: #fff3bf;
              box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.36);
              transform: scale(1);
            }
            35% {
              background: #fde68a;
              box-shadow: 0 0 0 8px rgba(245, 158, 11, 0.12);
              transform: scale(1.06);
            }
            100% {
              background: transparent;
              box-shadow: 0 0 0 14px rgba(245, 158, 11, 0);
              transform: scale(1);
            }
          }
        </style>

        <section class="counter">
          <div>
            <strong>\${this.bind('label')}</strong>
            <div class="meta">render calls: \${calls} · highlighted value is patched</div>
          </div>
          <div>
            <div class="value">\${this.bind('count')}</div>
            <div class="controls">
              <button decrement="click" type="button" aria-label="decrement">-</button>
              <button increment="click" type="button" aria-label="increment">+</button>
            </div>
          </div>
        </section>
      \`;
    },
    handlers: {
      increment() {
        const step = Number(this.getAttribute('step') ?? 1);
        this.setState({ count: this.state.count + (Number.isFinite(step) ? step : 1) });
      },
      decrement() {
        const step = Number(this.getAttribute('step') ?? 1);
        this.setState({ count: this.state.count - (Number.isFinite(step) ? step : 1) });
      },
    },
  });
})();`,
    },
  },
  todo: {
    label: 'Todo list',
    source: {
      html: `<ce-todo-list></ce-todo-list>`,
      css: `body {
  margin: 0;
  padding: 1rem;
  font-family: Inter, system-ui, sans-serif;
  background: #f6f7fb;
  color: #172033;
}`,
      js: `(async () => {
  const { CE, html } = window.__PLAYGROUND_CE_RUNTIME__ ?? {};
  if (!(CE && html)) {
    throw new Error('CE runtime is unavailable in playground preview.');
  }

  CE.define({
    name: 'ce-todo-list',
    state: {
      items: ['Review fine-grained patch', 'Ship docs playground'],
    },
    render() {
      return html\`
        <style>
          .todo {
            display: grid;
            gap: 0.75rem;
            max-width: 520px;
            border: 1px solid #d7dce5;
            border-radius: 8px;
            background: #fff;
            padding: 1rem;
          }

          h2 {
            margin: 0;
            font-size: 1rem;
          }

          .composer {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 0.5rem;
          }

          input {
            min-width: 0;
            border: 1px solid #c9d1dc;
            border-radius: 8px;
            padding: 0.55rem 0.65rem;
            font: inherit;
          }

          button {
            border: 1px solid #1f6feb;
            border-radius: 8px;
            background: #1f6feb;
            color: white;
            padding: 0.55rem 0.75rem;
            cursor: pointer;
            font: inherit;
          }

          ul {
            display: grid;
            gap: 0.35rem;
            margin: 0;
            padding-left: 1.1rem;
          }
        </style>

        <section class="todo">
          <h2>Todo list</h2>
          <div class="composer">
            <input name="item" placeholder="New task" autocomplete="off" />
            <button addItem="click" type="button">Add</button>
          </div>
          <ul>
            \${this.state.items.map((item) => html\`<li>\${item}</li>\`).join('')}
          </ul>
        </section>
      \`;
    },
    handlers: {
      addItem() {
        const input = this.shadowRoot?.querySelector('input');
        const value = input?.value.trim();
        if (!value) return;

        this.setState({ items: [...this.state.items, value] });
        input.value = '';
      },
    },
  });
})();`,
    },
  },
  products: {
    label: 'Product cards',
    source: {
      html: `<main class="product-grid">
  <ce-product-card name="Starter" price="$19" stock="8"></ce-product-card>
  <ce-product-card name="Team" price="$49" stock="3"></ce-product-card>
  <ce-product-card name="Scale" price="$99" stock="1"></ce-product-card>
</main>`,
      css: `body {
  margin: 0;
  padding: 1rem;
  font-family: Inter, system-ui, sans-serif;
  background: #f6f7fb;
  color: #172033;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
}`,
      js: `(async () => {
  const { CE, html } = window.__PLAYGROUND_CE_RUNTIME__ ?? {};
  if (!(CE && html)) {
    throw new Error('CE runtime is unavailable in playground preview.');
  }

  CE.define({
    name: 'ce-product-card',
    state: {
      name: 'Product',
      price: '$0',
      stock: 0,
      selected: 0,
    },
    onConnect() {
      const stock = Number(this.getAttribute('stock') ?? 0);
      this.setState({
        name: this.getAttribute('name') ?? 'Product',
        price: this.getAttribute('price') ?? '$0',
        stock: Number.isFinite(stock) ? stock : 0,
      });
    },
    render() {
      return html\`
        <style>
          .product {
            display: grid;
            gap: 0.7rem;
            border: 1px solid #d7dce5;
            border-radius: 8px;
            background: #fff;
            padding: 1rem;
          }

          h2 {
            margin: 0;
            font-size: 1rem;
          }

          .price {
            font-size: 1.4rem;
            font-weight: 750;
          }

          .meta {
            color: #5b6475;
            font-size: 0.86rem;
          }

          button {
            border: 1px solid #1f6feb;
            border-radius: 8px;
            background: #1f6feb;
            color: #fff;
            padding: 0.55rem 0.75rem;
            cursor: pointer;
            font: inherit;
          }
        </style>

        <article class="product">
          <h2>\${this.bind('name')}</h2>
          <div class="price">\${this.bind('price')}</div>
          <div class="meta">Stock: \${this.bind('stock')}</div>
          <div class="meta">Selected: \${this.bind('selected')}</div>
          <button add="click" type="button">Add one</button>
        </article>
      \`;
    },
    handlers: {
      add() {
        if (this.state.selected >= this.state.stock) return;
        this.setState({ selected: this.state.selected + 1 });
      },
    },
  });
})();`,
    },
  },
  tabs: {
    label: 'Tabs',
    source: {
      html: `<ce-profile-tabs></ce-profile-tabs>`,
      css: `body {
  margin: 0;
  padding: 1rem;
  font-family: Inter, system-ui, sans-serif;
  background: #f6f7fb;
  color: #172033;
}`,
      js: `(async () => {
  const { CE, html } = window.__PLAYGROUND_CE_RUNTIME__ ?? {};
  if (!(CE && html)) {
    throw new Error('CE runtime is unavailable in playground preview.');
  }

  const copy = {
    summary: 'A compact custom element with local state and scoped styles.',
    usage: 'Use attributes for setup and handlers for local interactions.',
    release: 'Keep public entrypoints stable and validate before publishing.',
  };

  CE.define({
    name: 'ce-profile-tabs',
    state: {
      active: 'summary',
      body: copy.summary,
    },
    render() {
      return html\`
        <style>
          .tabs {
            max-width: 560px;
            border: 1px solid #d7dce5;
            border-radius: 8px;
            background: #fff;
            padding: 1rem;
          }

          .tab-list {
            display: flex;
            gap: 0.4rem;
            margin-bottom: 0.8rem;
            flex-wrap: wrap;
          }

          button {
            border: 1px solid #c9d1dc;
            border-radius: 8px;
            background: #fff;
            padding: 0.45rem 0.65rem;
            cursor: pointer;
            font: inherit;
          }

          button[aria-current='true'] {
            border-color: #1f6feb;
            color: #1f6feb;
            font-weight: 700;
          }

          p {
            margin: 0;
            color: #344054;
          }
        </style>

        <section class="tabs">
          <div class="tab-list">
            <button showSummary="click" type="button" aria-current="\${this.state.active === 'summary'}">Summary</button>
            <button showUsage="click" type="button" aria-current="\${this.state.active === 'usage'}">Usage</button>
            <button showRelease="click" type="button" aria-current="\${this.state.active === 'release'}">Release</button>
          </div>
          <p>\${this.bind('body')}</p>
        </section>
      \`;
    },
    handlers: {
      showSummary() {
        this.setState({ active: 'summary', body: copy.summary });
      },
      showUsage() {
        this.setState({ active: 'usage', body: copy.usage });
      },
      showRelease() {
        this.setState({ active: 'release', body: copy.release });
      },
    },
  });
})();`,
    },
  },
};

const CE_PRESET_KEYS = new Set(['ce', 'fine', 'todo', 'products', 'tabs']);

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

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function highlightHtml(source) {
  return escapeHtml(source)
    .replace(/(&lt;\/?)([\w-]+)/g, '$1<span class="tok-tag">$2</span>')
    .replace(/([\w:-]+)(=)(&quot;.*?&quot;|'.*?')/g, '<span class="tok-attr">$1</span>$2<span class="tok-string">$3</span>');
}

function highlightCss(source) {
  return escapeHtml(source)
    .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="tok-comment">$1</span>')
    .replace(/(^|[{};\n]\s*)([.#]?[\w-][^{\n]*)(?=\s*\{)/g, '$1<span class="tok-selector">$2</span>')
    .replace(/([\w-]+)(\s*:)/g, '<span class="tok-prop">$1</span>$2')
    .replace(/(:\s*)([^;\n}]+)/g, (_match, prefix, value) => `${prefix}<span class="tok-string">${value}</span>`);
}

function highlightJs(source) {
  return escapeHtml(source)
    .replace(/(\/\/.*$)/gm, '<span class="tok-comment">$1</span>')
    .replace(/('(?:\\.|[^'])*'|`(?:\\.|[^`])*`|&quot;(?:\\.|[^&])*?&quot;)/g, '<span class="tok-string">$1</span>')
    .replace(/\b(const|let|var|function|return|if|else|for|of|await|async|new|class|this|throw)\b/g, '<span class="tok-keyword">$1</span>')
    .replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="tok-number">$1</span>');
}

function highlightSource(source, language) {
  if (language === 'html') return highlightHtml(source);
  if (language === 'css') return highlightCss(source);
  return highlightJs(source);
}

function updateLineNumbers(editor) {
  const lineNumbers = editor
    .closest('.code-editor')
    ?.querySelector('.code-editor__lines');
  if (!lineNumbers) return;

  const count = Math.max(editor.value.split('\n').length, 1);
  lineNumbers.textContent = Array.from({ length: count }, (_, index) => index + 1).join('\n');
  lineNumbers.scrollTop = editor.scrollTop;
}

function updateHighlight(editor) {
  const code = editor
    .closest('.code-editor')
    ?.querySelector('.code-editor__highlight code');
  if (!code) return;

  code.innerHTML = highlightSource(editor.value, editor.dataset.editor ?? 'js');
  code.parentElement.scrollTop = editor.scrollTop;
  code.parentElement.scrollLeft = editor.scrollLeft;
}

function setupCodeEditor(editor) {
  updateLineNumbers(editor);
  updateHighlight(editor);

  editor.addEventListener('input', () => {
    updateLineNumbers(editor);
    updateHighlight(editor);
  });

  editor.addEventListener('scroll', () => {
    const lineNumbers = editor
      .closest('.code-editor')
      ?.querySelector('.code-editor__lines');
    if (lineNumbers) {
      lineNumbers.scrollTop = editor.scrollTop;
    }

    const highlight = editor
      .closest('.code-editor')
      ?.querySelector('.code-editor__highlight');
    if (highlight) {
      highlight.scrollTop = editor.scrollTop;
      highlight.scrollLeft = editor.scrollLeft;
    }
  });

  editor.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;

    event.preventDefault();
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    editor.value = `${editor.value.slice(0, start)}  ${editor.value.slice(end)}`;
    editor.selectionStart = start + 2;
    editor.selectionEnd = start + 2;
    updateLineNumbers(editor);
    updateHighlight(editor);
  });
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

  let activePresetKey = 'fine';
  const editors = [htmlEditor, cssEditor, jsEditor];

  for (const editor of editors) {
    setupCodeEditor(editor);
  }

  const applySource = async (source, options = {}) => {
    const includeCeRuntime = options.includeCeRuntime ?? CE_PRESET_KEYS.has(activePresetKey);
    const runtime = includeCeRuntime ? await loadCeRuntimeModuleSource() : null;

    preview.srcdoc = buildPreviewDocument({
      ...source,
      runtimeModuleSource: runtime?.moduleSource ?? '',
    });

    status.textContent = `Rendered at ${new Date().toLocaleTimeString()}`;
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
    for (const editor of editors) {
      updateLineNumbers(editor);
      updateHighlight(editor);
    }
    activePresetKey = presetKey;
    await applySource(preset.source, {
      includeCeRuntime: CE_PRESET_KEYS.has(presetKey),
    });

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
    void applyPreset('fine');
  });

  for (const button of Array.from(presetButtons)) {
    button.addEventListener('click', () => {
      void applyPreset(button.getAttribute('data-playground-preset') || 'basic');
    });
  }

  void applyPreset('fine');
}

setupPlayground();
