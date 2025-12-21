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

type RouteDefinition = {
  path: string;
  component: string;
  preload?: (path: string) => Promise<void>;
  onError?: (error: unknown) => string;
};

class Router {
  private entryElement: HTMLElement | null = null;
  private hydrate = true;

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("popstate", () => this.renderCurrent());
      window.addEventListener("hashchange", () => this.renderCurrent());
    }
  }

  setEntryElement(entryElement: HTMLElement, options?: { hydrate?: boolean }) {
    this.entryElement = entryElement;
    this.hydrate = options?.hydrate ?? true;
    this.renderCurrent();
  }

  async renderCurrent() {
    if (!this.entryElement) return;

    const path = this.getCurrentPath();
    const route = CE.routes.get(path);

    if (!route) return;

    try {
      if (route.preload) {
        await route.preload(path);
      }
    } catch (error) {
      if (route.onError) {
        this.entryElement.innerHTML = route.onError(error);
        return;
      }
      throw error;
    }

    const componentName = route.component;
    const currentChild = this.entryElement.firstElementChild as HTMLElement | null;

    if (
      this.hydrate &&
      currentChild &&
      currentChild.tagName.toLowerCase() === componentName
    ) {
      return;
    }

    const component = document.createElement(componentName);
    this.entryElement.innerHTML = "";
    this.entryElement.append(component);
  }

  private getCurrentPath() {
    if (typeof window === "undefined") return "/";

    const hash = window.location.hash.replace(/^#/, "");
    const path = hash || window.location.pathname || "/";

    if (!path || path === "/index.html") return "/";

    return path;
  }
}

export class CE {
  static entryPoint: string;
  static entryElement: HTMLElement | null;

  static routes = new Map<string, RouteDefinition>();
  static definitions = new Map();

  static listeners = new Map();

  static router = new Router();

  static navigate = async (path: string) => {
    if (typeof window !== "undefined") {
      if (path.startsWith("#")) {
        window.location.hash = path;
      } else {
        window.history.pushState({}, "", path);
      }
    }

    await CE.router.renderCurrent();
  };

  static setEntryPoint = (
    entryPoint: string,
    options?: { rootElement?: HTMLElement; hydrate?: boolean }
  ) => {
    this.entryPoint = entryPoint;
    const existing = options?.rootElement ??
      (typeof document !== "undefined"
        ? (document.querySelector(entryPoint) as HTMLElement | null)
        : null);

    const root = existing ?? (typeof document !== "undefined"
      ? document.createElement(entryPoint)
      : null);

    if (!root) return;

    this.entryElement = root;

    if (!existing && typeof document !== "undefined") {
      document.body.append(root);
    }
    this.router.setEntryElement(root, { hydrate: options?.hydrate });
  };

  static define<
    T extends object,
    K extends { [key: string]: (this: CEInstance<T, K>) => void }
  >(params: {
    name: string;
    state: T;
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
    preload?: (path: string) => Promise<void>;
    onError?: (error: unknown) => string;
    handlers?: K;
  }) {
    const {
      name,
      state,
      onConnect = () => {},
      onDisconnect = () => {},
      onAdopt = () => {},
      onAttributeChange = () => {},
      route,
      preload,
      onError,
      render,
      handlers,
    } = params;

    CE.definitions.set(name, { state, render, handlers });

    if (route) {
      CE.routes.set(route, {
        path: route,
        component: name,
        preload,
        onError,
      });
    }

    if (typeof customElements !== "undefined") {
      customElements.define(
        name,
        class extends HTMLElement {
          private _state: T = JSON.parse(JSON.stringify(state));

          constructor() {
            super();
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
            const state = Address.getObj(objectId);

            if (!state) return;

            attributes.forEach((attribute) => {
              if (attribute === "render-object-id") return;

              const prevState: [] = CE.listeners.get(state) ?? [];

              CE.listeners.set(state, {
                [attribute]: [...prevState, this],
              });
            });
          }

          bind(key: keyof T) {
            return {
              key,
              content: this._state[key],
              state,
            };
          }

          setState(newState: Partial<T>) {
            this._state = { ...this._state, ...newState };
            const listener = CE.listeners.get(state) ?? [];

            for (const key in newState) {
              const arr = listener[key] as [];
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

  static async renderRouteToString(path: string, options?: { entryPoint?: string }) {
    const route = CE.routes.get(path) || CE.routes.get("/");

    if (!route) return "";

    const definition = CE.definitions.get(route.component);

    if (!definition) return "";

    let htmlContent = "";

    try {
      if (route.preload) {
        await route.preload(path);
      }

      htmlContent = `<${route.component}>${CE.renderComponentToString(
        definition
      )}</${route.component}>`;
    } catch (error) {
      if (route.onError) {
        htmlContent = route.onError(error);
      } else {
        throw error;
      }
    }

    const entry = options?.entryPoint ?? this.entryPoint ?? "div";

    return `<${entry}>${htmlContent}</${entry}>`;
  }

  private static renderComponentToString(definition: any) {
    const stateCopy = JSON.parse(JSON.stringify(definition.state));

    const context = {
      _state: stateCopy,
      state: stateCopy,
      bind(key: string) {
        return {
          key,
          content: (stateCopy as any)[key],
          state: stateCopy,
        };
      },
      setState(newState: any) {
        Object.assign(stateCopy, newState);
      },
      handlers: definition.handlers,
    } as any;

    return definition.render.call(context);
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
