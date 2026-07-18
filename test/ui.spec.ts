import { beforeEach, describe, expect, it, vi } from "vitest";
import { gaUiStyles, gaUiTokens } from "../packages/ui/src";

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

const mount = async <T extends HTMLElement>(tagName: string): Promise<T> => {
  const element = document.createElement(tagName) as T;
  document.body.append(element);
  await flush();
  return element;
};

describe("@ga-ut/ui", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("registers the GA-UT component set and exports shared tokens", () => {
    for (const tagName of [
      "ga-button",
      "ga-switch",
      "ga-text-field",
      "ga-badge",
      "ga-feedback",
      "ga-tab",
      "ga-mark",
    ]) {
      expect(customElements.get(tagName), `${tagName} should be registered`).toBeDefined();
    }

    expect(gaUiTokens).toEqual(expect.any(String));
    expect(gaUiTokens).toContain("--ga-");
    expect(gaUiStyles).toContain(gaUiTokens);
    expect(gaUiStyles.length).toBeGreaterThan(1);
  });

  it("forwards button variant and disabled state to the native control", async () => {
    const element = await mount<HTMLElement>("ga-button");

    element.setAttribute("variant", "outline");
    element.setAttribute("disabled", "");
    await flush();

    const button = element.shadowRoot?.querySelector<HTMLButtonElement>(
      'button[part="button"]'
    );

    expect(button).toBeInstanceOf(HTMLButtonElement);
    expect(button?.dataset.variant).toBe("outline");
    expect(button?.disabled).toBe(true);
  });

  it("renders the GA-UT mark as a scalable geometric symbol", async () => {
    const element = await mount<HTMLElement>("ga-mark");
    element.setAttribute("size", "lg");
    await flush();

    const mark = element.shadowRoot?.querySelector<HTMLElement>('[part="mark"]');
    expect(mark?.dataset.size).toBe("lg");
    expect(mark?.querySelector("svg")).toBeInstanceOf(SVGElement);
    expect(mark?.textContent?.trim()).toBe("");
  });

  it("updates a switch and emits a composed ga-change event", async () => {
    const changes: CustomEvent<{ checked: boolean }>[] = [];
    const onChange = (event: Event) => {
      changes.push(event as CustomEvent<{ checked: boolean }>);
    };
    document.body.addEventListener("ga-change", onChange);

    const element = await mount<HTMLElement>("ga-switch");
    const button = element.shadowRoot?.querySelector<HTMLButtonElement>(
      'button[part="switch"][role="switch"]'
    );

    button?.click();
    await flush();

    document.body.removeEventListener("ga-change", onChange);
    expect(element.hasAttribute("checked")).toBe(true);
    expect(button?.getAttribute("aria-checked")).toBe("true");
    expect(changes).toHaveLength(1);
    expect(changes[0]?.detail).toEqual({ checked: true });
    expect(changes[0]?.bubbles).toBe(true);
    expect(changes[0]?.composed).toBe(true);
  });

  it("syncs text input values and emits ga-input", async () => {
    const inputs: CustomEvent<{ value: string }>[] = [];
    const element = await mount<HTMLElement>("ga-text-field");
    element.addEventListener("ga-input", (event) => {
      inputs.push(event as CustomEvent<{ value: string }>);
    });

    const input = element.shadowRoot?.querySelector<HTMLInputElement>('input[part="input"]');
    expect(input).toBeInstanceOf(HTMLInputElement);

    if (!input) throw new Error("ga-text-field did not render its input");
    input.value = "GA-UT";
    input.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    await flush();

    expect(element.getAttribute("value")).toBe("GA-UT");
    expect(inputs).toHaveLength(1);
    expect(inputs[0]?.detail).toEqual({ value: "GA-UT" });
  });

  it("dismisses feedback after emitting ga-dismiss", async () => {
    const onDismiss = vi.fn();
    const element = document.createElement("ga-feedback") as HTMLElement;
    element.setAttribute("dismiss", "");
    element.addEventListener("ga-dismiss", onDismiss);
    document.body.append(element);
    await flush();

    const dismiss = element.shadowRoot?.querySelector<HTMLButtonElement>(
      'button[part="dismiss"]'
    );
    expect(dismiss).toBeInstanceOf(HTMLButtonElement);

    dismiss?.click();
    await flush();

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onDismiss.mock.calls[0]?.[0]).toMatchObject({ cancelable: true });
    expect(element.hasAttribute("hidden")).toBe(true);
  });

  it("keeps feedback visible when ga-dismiss is prevented", async () => {
    const element = document.createElement("ga-feedback") as HTMLElement;
    element.setAttribute("dismiss", "");
    element.addEventListener("ga-dismiss", (event) => event.preventDefault());
    document.body.append(element);
    await flush();

    const dismiss = element.shadowRoot?.querySelector<HTMLButtonElement>(
      'button[part="dismiss"]'
    );
    dismiss?.click();
    await flush();

    expect(element.hasAttribute("hidden")).toBe(false);
  });

  it("uses selected state for a tablist's roving tabindex", async () => {
    const tablist = document.createElement("div");
    tablist.setAttribute("role", "tablist");
    const selected = document.createElement("ga-tab") as HTMLElement;
    const unselected = document.createElement("ga-tab") as HTMLElement;
    const disabled = document.createElement("ga-tab") as HTMLElement;
    selected.setAttribute("selected", "");
    disabled.setAttribute("disabled", "");
    tablist.append(selected, unselected, disabled);
    document.body.append(tablist);
    await flush();

    const selectedControl = selected.shadowRoot?.querySelector<HTMLButtonElement>(
      'button[part="tab"]'
    );
    const unselectedControl = unselected.shadowRoot?.querySelector<HTMLButtonElement>(
      'button[part="tab"]'
    );
    const disabledControl = disabled.shadowRoot?.querySelector<HTMLButtonElement>(
      'button[part="tab"]'
    );

    expect(selectedControl?.tabIndex).toBe(0);
    expect(unselectedControl?.tabIndex).toBe(-1);
    expect(disabledControl?.tabIndex).toBe(-1);
  });

  it("keeps a tablist keyboard-reachable without an explicit selection", async () => {
    const tablist = document.createElement("div");
    tablist.setAttribute("role", "tablist");
    const first = document.createElement("ga-tab") as HTMLElement;
    const second = document.createElement("ga-tab") as HTMLElement;
    tablist.append(first, second);
    document.body.append(tablist);
    await flush();

    const firstControl = first.shadowRoot?.querySelector<HTMLButtonElement>(
      'button[part="tab"]'
    );
    const secondControl = second.shadowRoot?.querySelector<HTMLButtonElement>(
      'button[part="tab"]'
    );

    expect(firstControl?.tabIndex).toBe(0);
    expect(secondControl?.tabIndex).toBe(-1);
  });

  it.each([
    ["ArrowRight", 0, 2],
    ["ArrowLeft", 0, 2],
    ["Home", 2, 0],
    ["End", 0, 2],
  ])("moves tab focus with %s and skips disabled tabs", async (key, startIndex, targetIndex) => {
    const tablist = document.createElement("div");
    tablist.setAttribute("role", "tablist");
    const tabs = Array.from({ length: 3 }, () => document.createElement("ga-tab") as HTMLElement);
    tabs[1]?.setAttribute("disabled", "");
    const wrappers = tabs.map((tab) => {
      const wrapper = document.createElement("span");
      wrapper.append(tab);
      return wrapper;
    });
    tablist.append(...wrappers);
    document.body.append(tablist);
    await flush();

    const startControl = tabs[startIndex]?.shadowRoot?.querySelector<HTMLButtonElement>(
      'button[part="tab"]'
    );
    const targetControl = tabs[targetIndex]?.shadowRoot?.querySelector<HTMLButtonElement>(
      'button[part="tab"]'
    );
    const onActivate = vi.fn();
    targetControl?.addEventListener("click", onActivate);

    startControl?.dispatchEvent(
      new KeyboardEvent("keydown", { key, bubbles: true, composed: true, cancelable: true })
    );
    await flush();

    expect(tabs[targetIndex]?.shadowRoot?.activeElement).toBe(targetControl);
    expect(onActivate).toHaveBeenCalledTimes(1);
  });
});
