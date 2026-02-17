const DEFAULT_SOURCE = {
  html: `<section class="demo-card">\n  <h1>CE Playground</h1>\n  <p>아래 버튼을 눌러 상태를 바꿔보세요.</p>\n  <button id="demo-btn" type="button">Click me</button>\n  <p id="demo-status">Ready</p>\n</section>`,
  css: `:root {\n  font-family: Inter, system-ui, sans-serif;\n}\n\nbody {\n  margin: 0;\n  padding: 1rem;\n  background: #f8fafc;\n}\n\n.demo-card {\n  background: white;\n  border: 1px solid #e5e7eb;\n  border-radius: 10px;\n  padding: 1rem;\n}\n\nbutton {\n  border: 1px solid #2563eb;\n  background: #2563eb;\n  color: #fff;\n  border-radius: 8px;\n  padding: 0.45rem 0.75rem;\n}`,
  js: `const button = document.querySelector('#demo-btn');\nconst status = document.querySelector('#demo-status');\n\nbutton?.addEventListener('click', () => {\n  status.textContent = 'Clicked at ' + new Date().toLocaleTimeString();\n});`,
};

function escapeScriptContent(source) {
  return source.replace(/<\/script/gi, '<\\/script');
}

function buildPreviewDocument({ html, css, js }) {
  const safeJs = escapeScriptContent(js);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>${css}</style>
  </head>
  <body>
    ${html}
    <script>
${safeJs}
<\/script>
  </body>
</html>`;
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
  const htmlEditor = root.querySelector('[data-editor="html"]');
  const cssEditor = root.querySelector('[data-editor="css"]');
  const jsEditor = root.querySelector('[data-editor="js"]');

  if (!(status && preview && runButton && resetButton && htmlEditor && cssEditor && jsEditor)) {
    return;
  }

  const applySource = (source) => {
    preview.srcdoc = buildPreviewDocument(source);
    status.textContent = `Rendered at ${new Date().toLocaleTimeString()}`;
    status.classList.add('status--ok');
    status.classList.remove('status--error');
  };

  const currentSource = () => ({
    html: htmlEditor.value,
    css: cssEditor.value,
    js: jsEditor.value,
  });

  const resetEditors = () => {
    htmlEditor.value = DEFAULT_SOURCE.html;
    cssEditor.value = DEFAULT_SOURCE.css;
    jsEditor.value = DEFAULT_SOURCE.js;
    applySource(DEFAULT_SOURCE);
  };

  runButton.addEventListener('click', () => {
    try {
      applySource(currentSource());
    } catch (error) {
      status.textContent = `Render failed: ${String(error)}`;
      status.classList.remove('status--ok');
      status.classList.add('status--error');
    }
  });

  resetButton.addEventListener('click', resetEditors);
  resetEditors();
}

setupPlayground();
