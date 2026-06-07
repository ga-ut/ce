import { describe, expect, it } from "vitest";
import { define, html, signal } from "../packages/ce/src/web";

describe("CE signal isolation", () => {
  it("does not leak signal updates between component instances", async () => {
    define(function TestCounterIsolation() {
      const count = signal(0);

      return html`<div class="value">${count}</div>
        <button onclick=${() => count.update((value) => value + 1)}>+</button>`;
    });

    const first = document.createElement("test-counter-isolation") as HTMLElement;
    const second = document.createElement("test-counter-isolation") as HTMLElement;

    document.body.append(first, second);

    const firstButton = first.shadowRoot?.querySelector("button");
    firstButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    await Promise.resolve();

    const firstText = first.shadowRoot?.querySelector(".value")?.textContent ?? "";
    const secondText = second.shadowRoot?.querySelector(".value")?.textContent ?? "";

    expect(firstText).toContain("1");
    expect(secondText).toContain("0");
  });
});
