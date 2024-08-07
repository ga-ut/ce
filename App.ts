import { CE, html, type CEInstance } from "@/ce";

interface MainAppState {
  count: number;
}

CE.define<MainAppState>({
  name: "main-app",
  state: { count: 0 },
  render() {
    return html` <div>Count: ${this.bind("count")}</div>
      <button add="click">+</button> <button minus="click">-</button>`;
  },
  add(this: CEInstance<MainAppState>) {
    this.setState({ count: this.state.count + 1 });
  },
  minus(this: CEInstance<MainAppState>) {
    this.setState({ count: this.state.count - 1 });
  },
});
