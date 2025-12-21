type CEInstance<T, K> = {
  state: T;
  setState: (newState: Partial<T>) => void;
  bind: (key: keyof T) => {
    key: string;
    content: T;
    state: { [key: string]: T };
  };
  handlers?: K;
} & HTMLElement;

class Router {
  private entryElement: HTMLElement | null = null;

  constructor() {
    window.addEventListener("popstate", () => this.renderCurrent());
    window.addEventListener("hashchange", () => this.renderCurrent());
  }

  setEntryElement(entryElement: HTMLElement) {
    this.entryElement = entryElement;
    this.renderCurrent();
  }

  renderCurrent() {
    if (!this.entryElement) return;

    const path = this.getCurrentPath();
    const componentName = CE.routes.get(path);

    if (!componentName) return;

    const component = document.createElement(componentName);
    this.entryElement.innerHTML = "";
    this.entryElement.append(component);
  }

  private getCurrentPath() {
    const hash = window.location.hash.replace(/^#/, "");
    const path = hash || window.location.pathname || "/";

    if (!path || path === "/index.html") return "/";

    return path;
  }
}

function cloneStateValue<T>(value: T): T {
  if (Array.isArray(value)) {
    return ([...value] as unknown) as T;
  }

  if (value && typeof value === "object") {
    return ({ ...(value as any) } as unknown) as T;
  }

  return value;
}

export class CE {
  static entryPoint: string;
  static entryElement: HTMLElement | null;

  static routes = new Map<string, string>();

  static listeners = new Map();

  static router = new Router();

  static navigate = (path: string) => {
    if (path.startsWith("#")) {
      window.location.hash = path;
    } else {
      window.history.pushState({}, "", path);
    }

    CE.router.renderCurrent();
  };

  static setEntryPoint = (entryPoint: string) => {
    this.entryPoint = entryPoint;
    const root = document.createElement(entryPoint);
    this.entryElement = root;

    document.body.append(root);
    this.router.setEntryElement(root);
  };

  static define<
    T extends object,
    K extends { [key: string]: (this: CEInstance<T, K>) => void }
  >(params: {
    name: string;
    state: T | (() => T);
    cloneState?: boolean;
    route?: string;
    onConnect?: () => void;
    onDisconnect?: () => void;
    onAdopt?: () => void;
    onAttributeChange?: (
      this: CEInstance<T, K>,
      name: string,
      oldValue: any,
      newValue: any
    ) => void;
    render: (this: CEInstance<T, K>) => string;
    handlers?: K;
  }) {
    const {
      name,
      state,
      cloneState = false,
      onConnect = () => {},
      onDisconnect = () => {},
      onAdopt = () => {},
      onAttributeChange = () => {},
      route,
      render,
      handlers,
    } = params;

    if (route) {
      CE.routes.set(route, name);
    }

    customElements.define(
      name,
      class extends HTMLElement {
        private _state: T;

        constructor() {
          super();
          const initialState = typeof state === "function" ? state() : state;

          this._state =
            cloneState && initialState && typeof initialState === "object"
              ? cloneStateValue(initialState)
              : initialState;
          this.attachShadow({ mode: "open" });
        }

        connectedCallback() {
          this.render();
          this.mapping();
          onConnect.call(this);
        }

        disconnectedCallback() {
          onDisconnect.call(this);
        }

        adoptedCallback() {
          onAdopt.call(this);
        }

        attributeChangedCallback(name: string, oldValue: any, newValue: any) {
          onAttributeChange.call(this, name, oldValue, newValue);
        }

        mapping() {
          const objectId = this.getAttribute("render-object-id");
          const attributes = this.getAttributeNames();
          const state = objectId ? Address.getObj(objectId) : this._state;

          if (!state) return;

          attributes.forEach((attribute) => {
            if (attribute === "render-object-id") return;

            const existingListeners: Map<string, HTMLElement[]> =
              CE.listeners.get(state) ?? new Map();
            const prevState = existingListeners.get(attribute) ?? [];

            existingListeners.set(attribute, [...prevState, this]);
            CE.listeners.set(state, existingListeners);
          });
        }

        bind(key: keyof T) {
          return {
            key,
            content: this._state[key],
            state: this._state,
          };
        }

        setState(newState: Partial<T>) {
          if (this._state && typeof this._state === "object") {
            Object.assign(this._state as object, newState);
          } else {
            this._state = newState as T;
          }
          const listener = CE.listeners.get(this._state) ?? new Map();

          for (const key in newState) {
            const arr = listener.get(key) as [];
            if (arr) {
              arr.forEach((a: any) => {
                a.shadowRoot.innerHTML = this._state[key];
              });
            }
          }
        }

        get state(): T {
          return this._state;
        }

        private render() {
          const content = render.call(this);
          if (content) {
            this.shadowRoot.innerHTML = content;
          }
          this.registerEventHandlers({ ...handlers });
        }

        private registerEventHandlers(eventHandlers: {
          [key: string]: (this: CEInstance<T, K>) => void;
        }) {
          for (const [handlerName, handler] of Object.entries(eventHandlers)) {
            if (typeof handler === "function") {
              const targetElements = this.shadowRoot?.querySelectorAll(
                `[${handlerName}]`
              );

              targetElements.forEach((targetElement) => {
                const eventName = targetElement.getAttribute(handlerName);
                targetElement.addEventListener(eventName, handler.bind(this));
              });
            }
          }
        }
      }
    );
  }
}

CE.define({
  name: "render-value",
  state: undefined,
  render() {
    this.shadowRoot.innerHTML = this.innerHTML;
    this.innerHTML = "";

    return "";
  },
});

export function html<T>(
  strings: TemplateStringsArray,
  ...values: (
    | string
    | { key: string; content: T; state: { [key: string]: T } }
  )[]
): string {
  return strings.reduce((result: string, str: string, index: number) => {
    const value = values[index];
    if (!value) return result + str;

    const attribute = value && typeof value === "object" ? value.key : "";
    const objectId =
      value && typeof value === "object" ? Address.getAddress(value.state) : "";

    return (
      result +
      str +
      (typeof value === "object"
        ? `<render-value render-object-id=${objectId} ${attribute}>${value.content}</render-value>`
        : value)
    );
  }, "");
}

class Address {
  static id = 0;

  static address = new Map();
  static idToObj = new Map();

  static getAddress(obj: object) {
    const address = this.address.get(obj);

    if (!address) {
      this.address.set(obj, String(this.id));
      this.idToObj.set(String(this.id), obj);
      this.id += 1;
    }

    return this.address.get(obj);
  }

  static getObj(id: string) {
    return this.idToObj.get(id);
  }
}
