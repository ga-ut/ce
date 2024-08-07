import { CE, html, type CEInstance } from "@/ce";

interface MainAppState {
  count: number;
}

const globalState = {
  count: 0,
};

CE.define({
  name: "counter-button-group",
  state: globalState,
  render() {
    return html`<button add="click">+</button>
      <button minus="click">-</button>`;
  },
  add(this: CEInstance<MainAppState>) {
    this.setState({ count: this.state.count + 1 });
  },
  minus(this: CEInstance<MainAppState>) {
    this.setState({ count: this.state.count - 1 });
  },
});

CE.define<MainAppState>({
  name: "main-app",
  state: globalState,
  render() {
    return html` <div>Count: ${this.bind("count")}</div>
      <counter-button-group></counter-button-group>`;
  },
});
