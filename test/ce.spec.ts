import { beforeEach, describe, expect, it, vi } from "vitest";
import { CE } from "../packages/ce/src/web/ce";
import {
  define,
  derived,
  effect,
  html,
  match,
  navigate,
  renderStatic,
  setEntryPoint,
  signal,
} from "../packages/ce/src/web";

const wait = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

describe("CE function component runtime", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    window.history.replaceState({}, "", "/");
    window.location.hash = "";
    CE.routes.clear();
    CE.entryElement = null;
    CE.entryPoint = "";
  });

  it("rejects legacy object definitions", () => {
    expect(() =>
      (define as any)({
        name: "x-legacy-object",
        state: {},
        render: () => "",
      })
    ).toThrow(/named function component/);
  });

  it("defines a named function component without a tag string", async () => {
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

  it("isolates local signals between component instances", async () => {
    define(function XSignalIsolated() {
      const count = signal(0);

      return html`
        <button onclick=${() => count.update((value) => value + 1)}>
          ${count}
        </button>
      `;
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

  it("patches signal text without rerunning render", async () => {
    let renderCount = 0;

    define(function XFineSignal() {
      const count = signal(0);

      renderCount += 1;

      return html`
        <button onclick=${() => count.update((value) => value + 1)}>
          ${count}
        </button>
      `;
    });

    const el = document.createElement("x-fine-signal") as HTMLElement;
    document.body.append(el);

    const button = el.shadowRoot?.querySelector("button") as HTMLButtonElement;
    const sameButton = button;
    button.click();
    await wait();

    expect(el.shadowRoot?.textContent?.trim()).toBe("1");
    expect(el.shadowRoot?.querySelector("button")).toBe(sameButton);
    expect(renderCount).toBe(1);
  });

  it("supports render callbacks for structural signal reads", async () => {
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

  it("runs lifecycle cleanup callbacks when disconnected", async () => {
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

    define(function XEffectScope() {
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

  it("updates signal-backed attributes without rerunning render", async () => {
    let renderCount = 0;

    define(function XSignalAttribute() {
      const active = signal(false);
      const ariaCurrent = derived(() => active());

      renderCount += 1;

      return html`
        <button onclick=${() => active.update((value) => !value)} aria-current="${ariaCurrent}">
          tab
        </button>
      `;
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

  it("renders array interpolations without manual join", async () => {
    define(function XArrayInterpolation() {
      const items = signal([
        { id: "one", label: "One" },
        { id: "two", label: "Two" },
      ]);

      return () => html`
        <button onclick=${() => items().push({ id: "three", label: "Three" })}>add</button>
        <ul>
          ${items().map((item) => html`<li data-id=${item.id}>${item.label}</li>`)}
        </ul>
      `;
    });

    const el = document.createElement("x-array-interpolation") as HTMLElement;
    document.body.append(el);

    expect(el.shadowRoot?.querySelectorAll("li")).toHaveLength(2);

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

  it("switches route components with navigate", async () => {
    setEntryPoint("ce-entry");

    define(
      function XHomePage() {
        return "<p>home</p>";
      },
      { route: "/" }
    );

    define(
      function XUsersPage() {
        return "<p>users</p>";
      },
      { route: "/users" }
    );

    await navigate("/");
    await wait();
    expect(CE.entryElement?.firstElementChild?.tagName.toLowerCase()).toBe("x-home-page");

    await navigate("/users");
    await wait();
    expect(CE.entryElement?.firstElementChild?.tagName.toLowerCase()).toBe("x-users-page");
  });

  it("supports route preload and error fallback", async () => {
    setEntryPoint("ce-route-entry");

    const preload = vi.fn(async () => {});

    define(
      function XPreloadPage() {
        return "<p>preload</p>";
      },
      { route: "/preload", preload }
    );

    define(
      function XErrorPage() {
        return "<p>error</p>";
      },
      {
        route: "/error",
        preload: async () => {
          throw new Error("boom");
        },
        onError: (error) => `<p>${(error as Error).message}</p>`,
      }
    );

    await navigate("/preload");
    expect(preload).toHaveBeenCalledWith("/preload");
    expect(CE.entryElement?.firstElementChild?.tagName.toLowerCase()).toBe("x-preload-page");

    await navigate("/error");
    expect(CE.entryElement?.innerHTML).toContain("boom");
  });

  it("ignores stale preload completion from earlier navigation", async () => {
    setEntryPoint("ce-stale-entry");

    const preloadResolvers: Array<() => void> = [];

    define(
      function XSlowPage() {
        return "<p>slow</p>";
      },
      {
        route: "/slow",
        preload: () =>
          new Promise<void>((resolve) => {
            preloadResolvers.push(resolve);
          }),
      }
    );

    define(
      function XFastPage() {
        return "<p>fast</p>";
      },
      { route: "/fast" }
    );

    const slowNavigation = navigate("/slow");
    await wait();
    await navigate("/fast");

    expect(CE.entryElement?.firstElementChild?.tagName.toLowerCase()).toBe("x-fast-page");

    preloadResolvers[0]?.();
    await slowNavigation;
    await wait();

    expect(CE.entryElement?.firstElementChild?.tagName.toLowerCase()).toBe("x-fast-page");
  });

  it("awaits hash navigation until async preload completes", async () => {
    setEntryPoint("ce-hash-entry");

    let resolvePreload = () => {};
    const preloadPromise = new Promise<void>((resolve) => {
      resolvePreload = resolve;
    });

    define(
      function XHashAsyncPage() {
        return "<p>hash async</p>";
      },
      {
        route: "/hash-async",
        preload: () => preloadPromise,
      }
    );

    const navigation = navigate("#/hash-async");
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

  it("renders a static declarative shadow DOM snapshot without DOM execution", async () => {
    const markup = await renderStatic<{ initial: NumberConstructor }>(
      function XStaticCounter({ props }) {
        const count = signal(props.initial ?? 0);
        const doubled = derived(() => count() * 2);

        return html`
          <button onclick=${() => count.update((value) => value + 1)}>
            ${count}/${doubled}
          </button>
        `;
      },
      {
        props: {
          initial: 2,
        },
      }
    );

    expect(markup).toContain("<x-static-counter initial=\"2\">");
    expect(markup).toContain('<template shadowrootmode="open">');
    expect(markup).toContain("2/4");
    expect(markup).not.toContain("onclick");
    expect(markup).not.toContain("data-ce-event");
    expect(markup).not.toContain("data-ce-signal");
  });

  it("does not run effects while rendering a static snapshot", async () => {
    const spy = vi.fn();

    const markup = await renderStatic(function XStaticEffect() {
      const count = signal(1);

      effect(() => {
        spy(count());
      });

      return html`<p>${count}</p>`;
    });

    expect(markup).toContain("<p>1</p>");
    expect(spy).not.toHaveBeenCalled();
  });

  it("can render a light DOM static snapshot when requested", async () => {
    const markup = await renderStatic<{ label: StringConstructor }>(
      function XLightSnapshot({ props }) {
        return html`<p>${props.label}</p>`;
      },
      {
        mode: "light-dom",
        props: {
          label: "Docs",
        },
      }
    );

    expect(markup).toBe("<x-light-snapshot label=\"Docs\"><p>Docs</p></x-light-snapshot>");
  });
});
