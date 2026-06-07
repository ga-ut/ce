import { define, html, navigate, setEntryPoint, signal } from "../../packages/ce/src/web";

define(function CounterButtonGroup({ host }) {
  const dispatch = (type: string) => {
    host.dispatchEvent(
      new CustomEvent(type, {
        bubbles: true,
        composed: true,
      })
    );
  };

  return html`<div>
    <button onclick=${() => dispatch("increment")}>+</button>
    <button onclick=${() => dispatch("decrement")}>-</button>
  </div>`;
});

define(function UserInfo() {
  const users = ["test1", "test2", "test3"];

  return html`<div>
    ${users.map((user) => html`<div>${user}</div>`)}
  </div>`;
});

define(
  function MainApp() {
    const count = signal(0);

    return html`
      <nav>
        <button onclick=${() => navigate("#/users")}>View users</button>
      </nav>
      <div>Count: ${count} times</div>
      <counter-button-group
        onincrement=${() => count.update((value) => value + 1)}
        ondecrement=${() => count.update((value) => value - 1)}
      ></counter-button-group>
    `;
  },
  { route: "/" }
);

define(
  function UsersPage() {
    return html`
      <nav>
        <button onclick=${() => navigate("#/")}>Back to home</button>
      </nav>
      <user-info></user-info>
    `;
  },
  { route: "/users" }
);

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

  setEntryPoint("ce-playground-root", {
    rootElement: root,
    hydrate: false,
  });
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountApp, { once: true });
} else {
  mountApp();
}
