import { CE, html } from "@/ce";

CE.define({
  name: "main-app",
  state: { count: 0 },
  render() {
    return html`<div test1="click">Count: ${this.getBindState("count")}</div> `;
  },
  test1() {
    this.setState({ count: this.state.count + 1 });
  },
});
