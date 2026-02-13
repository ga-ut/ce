import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' });
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  customElements: dom.window.customElements,
  HTMLElement: dom.window.HTMLElement,
  HTMLTemplateElement: dom.window.HTMLTemplateElement,
});

const { CE, html } = await import('./.tmp/ce.bundle.mjs');

CE.define({
  name: 'multi-key-state',
  state: {
    first: 'alpha',
    second: 'beta',
  },
  render() {
    return html`${this.bind('first')}${this.bind('second')}`;
  },
});

const getStateListeners = () => Array.from(CE.listeners.values())[0];

test('updates only changed key listeners and cleans up disconnected listener elements', async () => {
  const element = document.createElement('multi-key-state');
  document.body.append(element);

  await Promise.resolve();

  const firstBefore = element.shadowRoot.querySelector('render-value[first]');
  const secondBefore = element.shadowRoot.querySelector('render-value[second]');

  assert.ok(firstBefore);
  assert.ok(secondBefore);
  assert.equal(firstBefore.shadowRoot.innerHTML, 'alpha');
  assert.equal(secondBefore.shadowRoot.innerHTML, 'beta');

  element.setState({ first: 'alpha-2' });

  const firstAfter = element.shadowRoot.querySelector('render-value[first]');
  const secondAfter = element.shadowRoot.querySelector('render-value[second]');

  assert.ok(firstAfter);
  assert.ok(secondAfter);
  assert.equal(firstAfter.shadowRoot.innerHTML, 'alpha-2');
  assert.equal(secondAfter.shadowRoot.innerHTML, 'beta');

  const stateListeners = getStateListeners();
  assert.ok(stateListeners);
  assert.equal(stateListeners.get('first').size, 1);
  assert.equal(stateListeners.get('second').size, 1);

  firstAfter.remove();

  const nextStateListeners = getStateListeners();
  assert.equal(nextStateListeners.has('first'), false);
  assert.equal(nextStateListeners.has('second'), true);

  element.setState({ second: 'beta-2' });

  const secondUpdated = element.shadowRoot.querySelector('render-value[second]');
  assert.ok(secondUpdated);
  assert.equal(secondUpdated.shadowRoot.innerHTML, 'beta-2');
});
