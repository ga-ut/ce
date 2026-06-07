import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";

import { build } from "esbuild";
import { JSDOM } from "jsdom";

let workspace;
let moduleUrl;

const globalKeys = [
  "window",
  "document",
  "customElements",
  "HTMLElement",
  "Node",
  "Element",
  "Event",
  "EventTarget",
  "MouseEvent",
  "FocusEvent",
  "MutationObserver",
];

const previousGlobals = new Map();

function installDomGlobals(dom) {
  globalKeys.forEach((key) => {
    previousGlobals.set(key, globalThis[key]);
    globalThis[key] = dom.window[key];
  });
}

function restoreDomGlobals() {
  globalKeys.forEach((key) => {
    const previousValue = previousGlobals.get(key);
    if (typeof previousValue === "undefined") {
      delete globalThis[key];
      return;
    }

    globalThis[key] = previousValue;
  });
}

test.before(async () => {
  workspace = await mkdtemp(path.join(tmpdir(), "ce-event-test-"));
  const outfile = path.join(workspace, "ce.bundle.mjs");

  await build({
    entryPoints: [path.resolve("packages/ce/src/web/index.ts")],
    outfile,
    bundle: true,
    format: "esm",
    platform: "browser",
  });

  moduleUrl = pathToFileURL(outfile).href;
});

test.after(async () => {
  if (workspace) {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("inline handlers are called once after structural rerenders", async () => {
  const dom = new JSDOM("<!doctype html><body></body>", {
    url: "http://localhost/",
  });

  installDomGlobals(dom);

  try {
    const { define, html, signal } = await import(moduleUrl);

    let calls = 0;

    define(function EventRerender() {
      const count = signal(0);

      return () => html`
        <button onclick=${() => {
          calls += 1;
          count.update((value) => value + 1);
        }}>increment</button>
        <span>${count()}</span>
      `;
    });

    const element = document.createElement("event-rerender");
    document.body.append(element);

    const button = element.shadowRoot.querySelector("button");
    button.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true, composed: true }));
    button.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true, composed: true }));

    assert.equal(calls, 2);
  } finally {
    restoreDomGlobals();
    dom.window.close();
  }
});

test("non-bubbling focus handlers still fire after rerenders", async () => {
  const dom = new JSDOM("<!doctype html><body></body>", {
    url: "http://localhost/",
  });

  installDomGlobals(dom);

  try {
    const { define, html, signal } = await import(moduleUrl);

    let calls = 0;

    define(function EventFocus() {
      const count = signal(0);

      return () => html`
        <input onfocus=${() => {
          calls += 1;
          count.update((value) => value + 1);
        }} />
        <span>${count()}</span>
      `;
    });

    const element = document.createElement("event-focus");
    document.body.append(element);

    const input = element.shadowRoot.querySelector("input");
    input.dispatchEvent(new dom.window.FocusEvent("focus", { composed: true }));

    assert.equal(calls, 1);
  } finally {
    restoreDomGlobals();
    dom.window.close();
  }
});
