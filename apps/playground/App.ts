import { CE, html } from "@ga-ut/ce/web";

const createCountState = () => ({
  count: 0,
});

const createUserState = () => ({
  users: ["test1", "test2", "test3"],
});

CE.define({
  name: "counter-button-group",
  state: {},
  render() {
    return html` <div>
      <button increment="click">+</button>
      <button decrement="click">-</button>
    </div>`;
  },
  handlers: {
    increment() {
      this.dispatchEvent(
        new CustomEvent("increment", {
          bubbles: true,
          composed: true,
        })
      );
    },
    decrement() {
      this.dispatchEvent(
        new CustomEvent("decrement", {
          bubbles: true,
          composed: true,
        })
      );
    },
  },
});

CE.define({
  name: "user-info",
  state: createUserState(),
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
  state: createCountState(),
  route: "/",
  render() {
    return html`
      <nav>
        <button toUsers="click">View users</button>
      </nav>
      <div count>Count: ${this.bind("count")} times</div>
      <counter-button-group
        increment="increment"
        decrement="decrement"
      ></counter-button-group>
    `;
  },
  handlers: {
    increment() {
      this.setState({ count: this.state.count + 1 });
    },
    decrement() {
      this.setState({ count: this.state.count - 1 });
    },
    toUsers() {
      CE.navigate("#/users");
    },
  },
});

CE.define({
  name: "users-page",
  state: createUserState(),
  route: "/users",
  render() {
    return html`
      <nav>
        <button toHome="click">Back to home</button>
      </nav>
      <user-info></user-info>
    `;
  },
  handlers: {
    toHome() {
      CE.navigate("#/");
    },
  },
});

const mountApp = () => {
  const existingRoot = document.querySelector<HTMLElement>("[data-ce-playground-root]");
  const root = existingRoot ?? document.createElement("div");

  root.dataset.cePlaygroundRoot = "true";

  if (!existingRoot) {
    document.body.append(root);
  }

  if (!window.location.hash) {
    window.location.hash = "#/";
  }

  CE.setEntryPoint("ce-playground-root", {
    rootElement: root,
    hydrate: false,
  });
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountApp, { once: true });
} else {
  mountApp();
}
