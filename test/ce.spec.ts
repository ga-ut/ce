import { beforeEach, describe, expect, it, vi } from "vitest";
import { CE, html } from "../src";

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
