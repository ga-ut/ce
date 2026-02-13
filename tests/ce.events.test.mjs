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
    entryPoints: [path.resolve("ce.ts")],
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

test("handlers are called once after three rerenders", async () => {
  const dom = new JSDOM("<!doctype html><body></body>", {
    url: "http://localhost/",
  });

  installDomGlobals(dom);

  try {
    const { CE } = await import(moduleUrl);

    const tagName = `event-rerender-${Date.now()}`;
    const calls = { click: 0 };

    CE.define({
      name: tagName,
      state: { count: 0 },
      render() {
        return `<button increment="click">increment</button><span>${this.state.count}</span>`;
      },
      handlers: {
        increment() {
          calls.click += 1;
        },
      },
    });

    const element = document.createElement(tagName);
    document.body.append(element);

    element.setState({ count: 1 });
    element.setState({ count: 2 });
    element.setState({ count: 3 });

    const button = element.shadowRoot.querySelector("button");
    button.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true, composed: true }));

    assert.equal(calls.click, 1);
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
    const { CE } = await import(moduleUrl);

    const tagName = `event-focus-${Date.now()}`;
    const calls = { focus: 0 };

    CE.define({
      name: tagName,
      state: { count: 0 },
      render() {
        return `<input onFocus="focus" /><span>${this.state.count}</span>`;
      },
      handlers: {
        onFocus() {
          calls.focus += 1;
        },
      },
    });

    const element = document.createElement(tagName);
    document.body.append(element);

    element.setState({ count: 1 });
    element.setState({ count: 2 });
    element.setState({ count: 3 });

    const input = element.shadowRoot.querySelector("input");
    input.dispatchEvent(new dom.window.FocusEvent("focus", { composed: true }));

    assert.equal(calls.focus, 1);
  } finally {
    restoreDomGlobals();
    dom.window.close();
  }
});
