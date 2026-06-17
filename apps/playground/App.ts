import { config, define, html, navigate, signal } from "../../packages/ce/src/web";

define(function UserInfo() {
  const users = ["test1", "test2", "test3"];

  return html`<div>
    ${users.map((user) => html`<div>${user}</div>`)}
  </div>`;
});

function MainApp() {
  const count = signal(0);

  return html`
    <nav>
      <button onclick=${() => navigate("#/users")}>View users</button>
    </nav>
    <div>Count: ${count} times</div>
    <div>
      <button onclick=${() => count.update((value) => value + 1)}>+</button>
      <button onclick=${() => count.update((value) => value - 1)}>-</button>
    </div>
  `;
}

function UsersPage() {
  return html`
    <nav>
      <button onclick=${() => navigate("#/")}>Back to home</button>
    </nav>
    <user-info></user-info>
  `;
}

const mainAppTag = define(MainApp);
const usersPageTag = define(UsersPage);

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

  config({
    entryPoint: {
      selector: "ce-playground-root",
      rootElement: root,
      hydrate: false,
    },
    routes: [
      {
        path: "/",
        tag: mainAppTag,
      },
      {
        path: "/users",
        tag: usersPageTag,
      },
    ],
  });
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountApp, { once: true });
} else {
  mountApp();
}
