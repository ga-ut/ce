import { CE, html } from "@/ce";

const createCountState = () => ({
  count: 0,
});

const createUserState = () => ({
  users: ["test1", "test2", "test3"],
});

CE.define({
  name: "counter-button-group",
  stateFactory: createCountState,
  render() {
    return html` <div>
      <button add="click">+</button> <button minus="click">-</button>
    </div>`;
  },
  handlers: {
    add() {
      this.setState({ count: this.state.count + 1 });
    },
    minus() {
      this.setState({ count: this.state.count - 1 });
    },
  },
});

CE.define({
  name: "user-info",
  stateFactory: createUserState,
  render() {
    return html`<div>
      ${this.state.users.reduce((result, user) => {
        return result + html` <div>${user}</div> `;
      }, "")}
    </div>`;
  },
});

CE.define({
  name: "main-app",
  stateFactory: createCountState,
  route: "/",
  render() {
    return html`
      <nav>
        <button to-users="click">View users</button>
      </nav>
      <div count>Count: ${this.bind("count")} times</div>
      <counter-button-group></counter-button-group>
    `;
  },
  handlers: {
    toUsers() {
      CE.navigate("/users");
    },
  },
});

CE.define({
  name: "users-page",
  stateFactory: createUserState,
  route: "/users",
  render() {
    return html`
      <nav>
        <button to-home="click">Back to home</button>
      </nav>
      <user-info></user-info>
    `;
  },
  handlers: {
    toHome() {
      CE.navigate("/");
    },
  },
});
