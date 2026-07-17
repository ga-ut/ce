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
    expect(element.hasAttribute("hidden")).toBe(true);
  });
});
