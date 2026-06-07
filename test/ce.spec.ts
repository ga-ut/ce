import { beforeEach, describe, expect, it, vi } from "vitest";
import { CE, define, derived, effect, html, match, signal } from "../packages/ce/src/web";

const wait = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

describe("CE library", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    window.history.replaceState({}, "", "/");
  });

  it("isolates state between component instances", async () => {
    CE.define({
      name: "x-isolated-state",
      state: { count: 0 },
      render() {
        return html`<button inc="click">${this.bind("count")}</button>`;
      },
      handlers: {
        inc() {
          this.setState({ count: this.state.count + 1 });
        },
      },
    });

    const one = document.createElement("x-isolated-state") as HTMLElement;
    const two = document.createElement("x-isolated-state") as HTMLElement;
    document.body.append(one, two);

    const oneButton = one.shadowRoot?.querySelector("button") as HTMLButtonElement;
    oneButton.click();

    await wait();

    const oneText = one.shadowRoot?.textContent?.trim();
    const twoText = two.shadowRoot?.textContent?.trim();

    expect(oneText).toBe("1");
    expect(twoText).toBe("0");
  });

  it("updates only changed key bindings", async () => {
    CE.define({
      name: "x-key-reactivity",
      state: { count: 0, label: "A" },
      render() {
        return html`<div id="count">${this.bind("count")}</div><div id="label">${this.bind("label")}</div><button update="click">u</button>`;
      },
      handlers: {
        update() {
          this.setState({ count: this.state.count + 1 });
        },
      },
    });

    const el = document.createElement("x-key-reactivity") as HTMLElement;
    document.body.append(el);

    const button = el.shadowRoot?.querySelector("button") as HTMLButtonElement;
    button.click();
    await wait();

    expect(el.shadowRoot?.querySelector("#count")?.textContent).toContain("1");
    expect(el.shadowRoot?.querySelector("#label")?.textContent).toContain("A");
  });

  it("patches bound state without rerunning render", async () => {
    let renderCount = 0;

    CE.define({
      name: "x-fine-grained-text",
      state: { count: 0 },
      render() {
        renderCount += 1;
        return html`<button update="click">${this.bind("count")}</button>`;
      },
      handlers: {
        update() {
          this.setState({ count: this.state.count + 1 });
        },
      },
    });

    const el = document.createElement("x-fine-grained-text") as HTMLElement;
    document.body.append(el);

    const button = el.shadowRoot?.querySelector("button") as HTMLButtonElement;
    button.click();
    await wait();

    expect(el.shadowRoot?.textContent?.trim()).toBe("1");
    expect(renderCount).toBe(1);
  });

  it("rerenders when changed state has no binding target", async () => {
    CE.define({
      name: "x-unbound-rerender",
      state: { open: false },
      render() {
        return html`
          <button toggle="click">toggle</button>
          ${this.state.open ? "<section>open</section>" : ""}
        `;
      },
      handlers: {
        toggle() {
          this.setState({ open: true });
        },
      },
    });

    const el = document.createElement("x-unbound-rerender") as HTMLElement;
    document.body.append(el);

    const button = el.shadowRoot?.querySelector("button") as HTMLButtonElement;
    button.click();
    await wait();

    expect(el.shadowRoot?.querySelector("section")?.textContent).toBe("open");
  });

  it("updates rendered state after direct assignment", async () => {
    CE.define({
      name: "x-direct-state-assignment",
      state: { count: 0 },
      render() {
        return html`<button onclick=${() => (this.state.count += 1)}>Count: ${this.state.count}</button>`;
      },
    });

    const el = document.createElement("x-direct-state-assignment") as HTMLElement;
    document.body.append(el);

    const button = el.shadowRoot?.querySelector("button") as HTMLButtonElement;
    const sameButton = button;
    button.click();
    await wait();

    expect(el.shadowRoot?.textContent?.trim()).toBe("Count: 1");
    expect(el.shadowRoot?.querySelector("button")).toBe(sameButton);
  });

  it("supports component methods as inline event handlers", async () => {
    CE.define({
      name: "x-method-event-handler",
      state: { count: 0 },
      increment(event: Event) {
        expect(event.type).toBe("click");
        this.state.count += 1;
      },
      render() {
        return html`<button onclick=${this.increment}>${this.state.count}</button>`;
      },
    });

    const el = document.createElement("x-method-event-handler") as HTMLElement;
    document.body.append(el);

    const button = el.shadowRoot?.querySelector("button") as HTMLButtonElement;
    button.click();
    await wait();

    expect(el.shadowRoot?.textContent?.trim()).toBe("1");
  });

  it("updates nested state after direct assignment", async () => {
    CE.define({
      name: "x-direct-nested-state",
      state: { data: { count: 0 } },
      render() {
        return html`<button onclick=${() => (this.state.data.count += 1)}>${this.state.data.count}</button>`;
      },
    });

    const el = document.createElement("x-direct-nested-state") as HTMLElement;
    document.body.append(el);

    const button = el.shadowRoot?.querySelector("button") as HTMLButtonElement;
    button.click();
    await wait();

    expect(el.shadowRoot?.textContent?.trim()).toBe("1");
  });

  it("patches signal output without rerunning render", async () => {
    let renderCount = 0;

    CE.define({
      name: "x-signal-fine-grained",
      state: { count: CE.signal(0) },
      render() {
        renderCount += 1;
        return html`<button onclick=${() => (this.state.count.value += 1)}>${this.state.count}</button>`;
      },
    });

    const el = document.createElement("x-signal-fine-grained") as HTMLElement;
    document.body.append(el);

    const button = el.shadowRoot?.querySelector("button") as HTMLButtonElement;
    const sameButton = button;
    button.click();
    await wait();

    expect(el.shadowRoot?.textContent?.trim()).toBe("1");
    expect(el.shadowRoot?.querySelector("button")).toBe(sameButton);
    expect(renderCount).toBe(1);
  });

  it("isolates signal state between component instances", async () => {
    CE.define({
      name: "x-signal-isolated",
      state: { count: CE.signal(0) },
      render() {
        return html`<button onclick=${() => (this.state.count.value += 1)}>${this.state.count}</button>`;
      },
    });

    const one = document.createElement("x-signal-isolated") as HTMLElement;
    const two = document.createElement("x-signal-isolated") as HTMLElement;
    document.body.append(one, two);

    const oneButton = one.shadowRoot?.querySelector("button") as HTMLButtonElement;
    oneButton.click();
    await wait();

    expect(one.shadowRoot?.textContent?.trim()).toBe("1");
    expect(two.shadowRoot?.textContent?.trim()).toBe("0");
  });

  it("supports callable signals without rerunning render", async () => {
    let renderCount = 0;

    CE.define({
      name: "x-callable-signal",
      state: {},
      setup({ signal }) {
        const count = signal(0);

        return {
          count,
          increment: () => count.update((value) => value + 1),
        };
      },
      render() {
        renderCount += 1;
        return html`<button onclick=${this.increment}>${this.count}</button>`;
      },
    });

    const el = document.createElement("x-callable-signal") as HTMLElement;
    document.body.append(el);

    const button = el.shadowRoot?.querySelector("button") as HTMLButtonElement;
    button.click();
    await wait();

    expect(el.shadowRoot?.textContent?.trim()).toBe("1");
    expect(renderCount).toBe(1);
  });

  it("defines a named function component without an explicit tag string", async () => {
    define(function XNamedCounter() {
      const count = signal(0);
      const doubled = derived(() => count() * 2);

      return html`
        <button onclick=${() => count.update((value) => value + 1)}>
          ${count}/${doubled}
        </button>
      `;
    });

    const el = document.createElement("x-named-counter") as HTMLElement;
    document.body.append(el);

    const button = el.shadowRoot?.querySelector("button") as HTMLButtonElement;
    button.click();
    await wait();

    expect(el.shadowRoot?.textContent?.trim()).toBe("1/2");
  });

  it("supports function component render callbacks for structural signal reads", async () => {
    define(function XFunctionList() {
      const items = signal(["one"]);

      return () => html`
        <button onclick=${() => items().push("two")}>add</button>
        <ul>
          ${items().map((item) => html`<li>${item}</li>`)}
        </ul>
      `;
    });

    const el = document.createElement("x-function-list") as HTMLElement;
    document.body.append(el);

    expect(el.shadowRoot?.querySelectorAll("li")).toHaveLength(1);

    const button = el.shadowRoot?.querySelector("button") as HTMLButtonElement;
    button.click();
    await wait();

    expect(el.shadowRoot?.querySelectorAll("li")).toHaveLength(2);
  });

  it("runs lifecycle cleanup callbacks when a function component disconnects", async () => {
    const cleanup = vi.fn();

    define(function XLifecycleTimer({ lifecycle }) {
      lifecycle.cleanup(cleanup);

      return html`<p>timer</p>`;
    });

    const el = document.createElement("x-lifecycle-timer") as HTMLElement;
    document.body.append(el);
    await wait();

    el.remove();

    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it("reruns effects only when read signals change", async () => {
    const tracked = signal(0);
    const ignored = signal(0);
    const spy = vi.fn();

    define(function XEffectScope({ lifecycle }) {
      lifecycle.cleanup(() => {});

      effect(() => {
        spy(tracked());
      });

      return html`
        <button id="tracked" onclick=${() => tracked.update((value) => value + 1)}>tracked</button>
        <button id="ignored" onclick=${() => ignored.update((value) => value + 1)}>ignored</button>
      `;
    });

    const el = document.createElement("x-effect-scope") as HTMLElement;
    document.body.append(el);

    expect(spy).toHaveBeenCalledTimes(1);

    const ignoredButton = el.shadowRoot?.querySelector("#ignored") as HTMLButtonElement;
    ignoredButton.click();
    await wait();
    expect(spy).toHaveBeenCalledTimes(1);

    const trackedButton = el.shadowRoot?.querySelector("#tracked") as HTMLButtonElement;
    trackedButton.click();
    await wait();
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenLastCalledWith(1);
  });

  it("tracks reactive props in effects and render callbacks", async () => {
    const spy = vi.fn();

    define(
      function XReactiveProfile({ props }) {
        effect(() => {
          spy(props.userId);
        });

        return () => html`<p>User ${props.userId}</p>`;
      },
      {
        props: {
          userId: Number,
        },
      }
    );

    const el = document.createElement("x-reactive-profile") as HTMLElement;
    el.setAttribute("user-id", "41");
    document.body.append(el);
    await wait();

    expect(el.shadowRoot?.textContent?.trim()).toBe("User 41");
    expect(spy).toHaveBeenLastCalledWith(41);

    el.setAttribute("user-id", "42");
    await wait();

    expect(el.shadowRoot?.textContent?.trim()).toBe("User 42");
    expect(spy).toHaveBeenLastCalledWith(42);
  });

  it("passes parsed props into setup", async () => {
    CE.define({
      name: "x-setup-props",
      state: {},
      props: {
        initial: Number,
        label: String,
      },
      setup({ props, signal }) {
        return {
          count: signal(props.initial ?? 0),
          label: signal(props.label ?? "Counter"),
        };
      },
      render() {
        return html`<p>${this.label}: ${this.count}</p>`;
      },
    });

    const el = document.createElement("x-setup-props");
    el.setAttribute("initial", "7");
    el.setAttribute("label", "Likes");
    document.body.append(el);

    await wait();

    expect(el.shadowRoot?.textContent?.trim()).toBe("Likes: 7");
  });

  it("updates derived signals without rerunning render", async () => {
    let renderCount = 0;

    CE.define({
      name: "x-derived-signal",
      state: {},
      setup({ signal, derived }) {
        const count = signal(1);
        const doubled = derived(() => count() * 2);

        return {
          count,
          doubled,
          increment: () => count.update((value) => value + 1),
        };
      },
      render() {
        renderCount += 1;
        return html`<button onclick=${this.increment}>${this.count}/${this.doubled}</button>`;
      },
    });

    const el = document.createElement("x-derived-signal") as HTMLElement;
    document.body.append(el);

    const button = el.shadowRoot?.querySelector("button") as HTMLButtonElement;
    button.click();
    await wait();

    expect(el.shadowRoot?.textContent?.trim()).toBe("2/4");
    expect(renderCount).toBe(1);
  });

  it("updates signal-backed attributes without rerunning render", async () => {
    let renderCount = 0;

    CE.define({
      name: "x-signal-attribute",
      state: {},
      setup({ signal, derived }) {
        const active = signal(false);

        return {
          active,
          ariaCurrent: derived(() => active()),
          toggle: () => active.update((value) => !value),
        };
      },
      render() {
        renderCount += 1;
        return html`<button onclick=${this.toggle} aria-current="${this.ariaCurrent}">tab</button>`;
      },
    });

    const el = document.createElement("x-signal-attribute") as HTMLElement;
    document.body.append(el);

    const button = el.shadowRoot?.querySelector("button") as HTMLButtonElement;
    expect(button.getAttribute("aria-current")).toBe("false");

    button.click();
    await wait();

    expect(button.getAttribute("aria-current")).toBe("true");
    expect(renderCount).toBe(1);
  });

  it("tracks array mutations inside signals", async () => {
    let renderCount = 0;

    CE.define({
      name: "x-signal-array-mutation",
      state: {},
      setup({ signal, derived }) {
        const items = signal(["one"]);
        const count = derived(() => items().length);

        return {
          count,
          pushItem: () => items().push("two"),
          popItem: () => items().pop(),
        };
      },
      render() {
        renderCount += 1;
        return html`
          <button id="push" onclick=${this.pushItem}>push</button>
          <button id="pop" onclick=${this.popItem}>pop</button>
          <p>${this.count}</p>
        `;
      },
    });

    const el = document.createElement("x-signal-array-mutation") as HTMLElement;
    document.body.append(el);

    const push = el.shadowRoot?.querySelector("#push") as HTMLButtonElement;
    const pop = el.shadowRoot?.querySelector("#pop") as HTMLButtonElement;

    push.click();
    await wait();
    expect(el.shadowRoot?.querySelector("p")?.textContent).toBe("2");

    pop.click();
    await wait();
    expect(el.shadowRoot?.querySelector("p")?.textContent).toBe("1");
    expect(renderCount).toBe(1);
  });

  it("renders array interpolations without manual join", async () => {
    CE.define({
      name: "x-array-interpolation",
      state: {},
      setup({ signal }) {
        const items = signal([
          { id: "one", label: "One" },
          { id: "two", label: "Two" },
        ]);

        return {
          items,
          add: () => items().push({ id: "three", label: "Three" }),
        };
      },
      render() {
        return html`
          <button onclick=${this.add}>add</button>
          <ul>
            ${this.items().map((item: { id: string; label: string }) => html`<li data-id=${item.id}>${item.label}</li>`)}
          </ul>
        `;
      },
    });

    const el = document.createElement("x-array-interpolation") as HTMLElement;
    document.body.append(el);

    expect(el.shadowRoot?.querySelectorAll("li")).toHaveLength(2);
    expect(el.shadowRoot?.textContent).toContain("One");
    expect(el.shadowRoot?.textContent).toContain("Two");

    const button = el.shadowRoot?.querySelector("button") as HTMLButtonElement;
    button.click();
    await wait();

    expect(el.shadowRoot?.querySelectorAll("li")).toHaveLength(3);
    expect(el.shadowRoot?.textContent).toContain("Three");
  });

  it("flattens nested array interpolations", () => {
    const markup = html`
      <ul>
        ${[
          html`<li>A</li>`,
          [html`<li>B</li>`, html`<li>C</li>`],
        ]}
      </ul>
    `;

    expect(markup).toContain("<li>A</li>");
    expect(markup).toContain("<li>B</li>");
    expect(markup).toContain("<li>C</li>");
  });

  it("matches render cases with a selector function", () => {
    const result = match({ type: "empty", count: 0 })
      .when(
        (value) => value.type === "empty",
        ({ count }) => html`<p>empty:${count}</p>`
      )
      .otherwise(() => html`<p>fallback</p>`);

    expect(result).toContain("empty:");
    expect(result).toContain(">0<");
  });

  it("matches arbitrary object variants", () => {
    type Shape =
      | { kind: "circle"; radius: number }
      | { kind: "rectangle"; width: number; height: number };

    const area = (shape: Shape) =>
      match(shape)
        .when(
          (value) => value.kind === "circle",
          (value) => (value.kind === "circle" ? Math.PI * value.radius * value.radius : 0)
        )
        .when(
          (value) => value.kind === "rectangle",
          (value) => (value.kind === "rectangle" ? value.width * value.height : 0)
        )
        .otherwise(() => 0);

    const circleArea = area({ kind: "circle", radius: 10 });
    const rectangleArea = area({ kind: "rectangle", width: 20, height: 8 });

    expect(circleArea).toBeCloseTo(314.159);
    expect(rectangleArea).toBe(160);
  });

  it("uses a match fallback when no case matches", () => {
    const result = match({ ok: false })
      .when(
        (value) => value.ok,
        () => html`<p>ok</p>`
      )
      .otherwise(() => html`<p>fallback</p>`);

    expect(result).toContain("fallback");
  });

  it("does not duplicate event handlers after rerender", async () => {
    CE.define({
      name: "x-handler-dedupe",
      state: { count: 0 },
      render() {
        return html`<button tap="click">${this.bind("count")}</button>`;
      },
      handlers: {
        tap() {
          this.setState({ count: this.state.count + 1 });
        },
      },
    });

    const el = document.createElement("x-handler-dedupe") as HTMLElement;
    document.body.append(el);

    const button = () => el.shadowRoot?.querySelector("button") as HTMLButtonElement;
    button().click();
    await wait();
    button().click();
    await wait();

    expect(el.shadowRoot?.textContent?.trim()).toBe("2");
  });

  it("switches route components with navigate", async () => {
    CE.setEntryPoint("ce-entry");

    CE.define({
      name: "x-home-page",
      state: {},
      route: "/",
      render() {
        return "<p>home</p>";
      },
    });

    CE.define({
      name: "x-users-page",
      state: {},
      route: "/users",
      render() {
        return "<p>users</p>";
      },
    });

    CE.navigate("/");
    await wait();
    expect(CE.entryElement?.firstElementChild?.tagName.toLowerCase()).toBe("x-home-page");

    CE.navigate("/users");
    await wait();
    expect(CE.entryElement?.firstElementChild?.tagName.toLowerCase()).toBe("x-users-page");
  });

  it("supports route preload and error fallback on navigation", async () => {
    CE.setEntryPoint("ce-route-entry");

    const preload = vi.fn(async () => {});

    CE.define({
      name: "x-preload-page",
      state: {},
      route: "/preload",
      preload,
      render() {
        return "<p>preload</p>";
      },
    });

    CE.define({
      name: "x-error-page",
      state: {},
      route: "/error",
      preload: async () => {
        throw new Error("boom");
      },
      onError(error) {
        return `<p>${(error as Error).message}</p>`;
      },
      render() {
        return "<p>error</p>";
      },
    });

    await CE.navigate("/preload");
    expect(preload).toHaveBeenCalledWith("/preload");
    expect(CE.entryElement?.firstElementChild?.tagName.toLowerCase()).toBe("x-preload-page");

    await CE.navigate("/error");
    expect(CE.entryElement?.innerHTML).toContain("boom");
  });

  it("ignores stale preload completion from earlier navigation", async () => {
    CE.setEntryPoint("ce-stale-entry");

    const preloadResolvers: Array<() => void> = [];

    CE.define({
      name: "x-slow-page",
      state: {},
      route: "/slow",
      preload: () =>
        new Promise<void>((resolve) => {
          preloadResolvers.push(resolve);
        }),
      render() {
        return "<p>slow</p>";
      },
    });

    CE.define({
      name: "x-fast-page",
      state: {},
      route: "/fast",
      render() {
        return "<p>fast</p>";
      },
    });

    const slowNavigation = CE.navigate("/slow");
    await wait();
    await CE.navigate("/fast");

    expect(CE.entryElement?.firstElementChild?.tagName.toLowerCase()).toBe("x-fast-page");

    preloadResolvers[0]?.();
    await slowNavigation;
    await wait();

    expect(CE.entryElement?.firstElementChild?.tagName.toLowerCase()).toBe("x-fast-page");
  });

  it("awaits hash navigation until async preload render completes", async () => {
    CE.setEntryPoint("ce-hash-entry");

    let resolvePreload = () => {};
    const preloadPromise = new Promise<void>((resolve) => {
      resolvePreload = resolve;
    });

    CE.define({
      name: "x-hash-async-page",
      state: {},
      route: "/hash-async",
      preload: () => preloadPromise,
      render() {
        return "<p>hash async</p>";
      },
    });

    const navigation = CE.navigate("#/hash-async");
    await wait();

    expect(CE.entryElement?.firstElementChild?.tagName.toLowerCase()).not.toBe(
      "x-hash-async-page"
    );

    resolvePreload();
    await navigation;

    expect(CE.entryElement?.firstElementChild?.tagName.toLowerCase()).toBe(
      "x-hash-async-page"
    );
  });

  it("can render a route to string for server output", async () => {
    CE.define({
      name: "x-ssr-page",
      state: { label: "server" },
      route: "/ssr",
      render() {
        return html`<p>${this.bind("label")}</p>`;
      },
    });

    const markup = await CE.renderRouteToString("/ssr", { entryPoint: "ce-entry" });
    expect(markup).toContain("<ce-entry>");
    expect(markup).toContain("<x-ssr-page>");
    expect(markup).toContain("server");
  });

  it("awaits async render output when rendering routes to string", async () => {
    CE.define({
      name: "x-ssr-async-page",
      state: { label: "async-server" },
      route: "/ssr-async",
      async render() {
        await wait();
        return html`<p>${this.bind("label")}</p>`;
      },
    });

    const markup = await CE.renderRouteToString("/ssr-async", { entryPoint: "ce-entry" });
    expect(markup).toContain("<x-ssr-async-page>");
    expect(markup).toContain("async-server");
  });

  it("keeps latest async render result when renders race", async () => {
    const resolveQueue: Array<(value: string) => void> = [];

    CE.define({
      name: "x-async-race",
      state: { step: 0 },
      async render() {
        const text = await new Promise<string>((resolve) => resolveQueue.push(resolve));
        return `<p>${text}</p>`;
      },
      handlers: {
        bump() {
          this.setState({ step: this.state.step + 1 });
        },
      },
    });

    const el = document.createElement("x-async-race") as HTMLElement;
    document.body.append(el);

    const instance = el as HTMLElement & { setState: (state: { step: number }) => void };
    instance.setState({ step: 1 });

    resolveQueue[1]("new");
    await wait();
    resolveQueue[0]("old");
    await wait();

    expect(el.shadowRoot?.textContent).toContain("new");
    expect(el.shadowRoot?.textContent).not.toContain("old");
  });

  it("renders in shadow DOM environment", async () => {
    const spy = vi.fn();

    CE.define({
      name: "x-shadow-check",
      state: { label: "ok" },
      render() {
        return html`<button clicker="click">${this.bind("label")}</button>`;
      },
      handlers: {
        clicker() {
          spy();
        },
      },
    });

    const el = document.createElement("x-shadow-check") as HTMLElement;
    document.body.append(el);

    const button = el.shadowRoot?.querySelector("button") as HTMLButtonElement;
    button.click();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(el.shadowRoot).toBeTruthy();
  });



  it("isolates nested plain object state when fallback clone is used", async () => {
    CE.define({
      name: "x-fallback-nested-isolation",
      state: {
        data: { count: 0 },
        format(value: number) {
          return `${value}`;
        },
      },
      render() {
        return html`<p>${this.state.format(this.state.data.count)}</p><button inc="click">+</button>`;
      },
      handlers: {
        inc() {
          this.state.data.count += 1;
          this.setState({ data: this.state.data });
        },
      },
    });

    const one = document.createElement("x-fallback-nested-isolation") as HTMLElement;
    const two = document.createElement("x-fallback-nested-isolation") as HTMLElement;
    document.body.append(one, two);

    const oneButton = one.shadowRoot?.querySelector("button") as HTMLButtonElement;
    oneButton.click();
    await wait();

    expect(one.shadowRoot?.textContent).toContain("1");
    expect(two.shadowRoot?.textContent).toContain("0");
  });
  it("mounts components when state includes non-cloneable values", async () => {
    CE.define({
      name: "x-non-cloneable-state",
      state: {
        count: 1,
        format(value: number) {
          return `count:${value}`;
        },
      },
      render() {
        return `<p>${this.state.format(this.state.count)}</p>`;
      },
    });

    const el = document.createElement("x-non-cloneable-state") as HTMLElement;

    expect(() => document.body.append(el)).not.toThrow();
    await wait();

    expect(el.shadowRoot?.textContent).toContain("count:1");
  });
});
