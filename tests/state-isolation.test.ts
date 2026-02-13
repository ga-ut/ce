import { describe, expect, it } from "vitest";
import { CE, html } from "../ce";

describe("CE state isolation", () => {
  it("does not leak state updates between component instances", async () => {
    const tagName = "test-counter-isolation";

    if (!customElements.get(tagName)) {
      CE.define({
        name: tagName,
        stateFactory: () => ({ count: 0 }),
        render() {
          return html`<div class="value">${String(this.state.count)}</div>
            <button inc="click">+</button>`;
        },
        handlers: {
          inc() {
            this.setState({ count: this.state.count + 1 });
          },
        },
      });
    }

    const first = document.createElement(tagName) as HTMLElement;
    const second = document.createElement(tagName) as HTMLElement;

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
