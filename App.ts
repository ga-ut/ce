import { CE, html } from "@/ce";

const countState = {
  count: 0,
};

const userState = {
  users: ["test1", "test2", "test3"],
};

CE.define({
  name: "counter-button-group",
  state: countState,
  render() {
    return html` <div>
      <button add="click">+</button> <button minus="click">-</button>
    </div>`;
  },
  handlers: {
    add() {
      this.setState({ count: this.state.count + 1 });
    },
    minus(this) {
      this.setState({ count: this.state.count - 1 });
    },
  },
});

CE.define({
  name: "user-info",
  state: userState,
  render() {
    return html`<div>
      ${userState.users.reduce((result, user) => {
        return result + html` <div>${user}</div> `;
      }, "")}
    </div>`;
  },
});

CE.define({
  name: "main-app",
  state: countState,
  render() {
    return html`
      <div>Count: ${this.bind("count")}</div>
      <counter-button-group test="1"></counter-button-group>
      <user-info></user-info>
    `;
  },
});
