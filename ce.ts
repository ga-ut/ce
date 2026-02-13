export type Template = HTMLTemplateElement;

export type RenderContent = string | Template;

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
    state?: T | (() => T);
    initialState?: T;
    stateFactory?: () => T;
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
    render: (this: CEInstance<T, K>) => RenderContent | Promise<RenderContent>;
    handlers?: K;
  }) {
    const {
      name,
      state,
      initialState,
      stateFactory,
      onConnect = () => {},
      onDisconnect = () => {},
      onAdopt = () => {},
      onAttributeChange = () => {},
      route,
      render,
      handlers,
    } = params;

    const createState = () => {
      if (typeof stateFactory === "function") {
        return stateFactory();
      }

      if (typeof state === "function") {
        return state();
      }

      const baseState = state ?? initialState;

      if (!baseState) {
        return {} as T;
      }

      if (typeof structuredClone === "function") {
        return structuredClone(baseState);
      }

      return { ...baseState };
    };

    if (route) {
      CE.routes.set(route, name);
    }

    customElements.define(
      name,
      class extends HTMLElement {
        private _state: T;
        private renderCallId = 0;
        private delegatedHandlers = new Map<
          string,
          {
            eventName: string;
            listener: EventListener;
          }
        >();

        constructor() {
          super();
          this._state = createState();
          this.attachShadow({ mode: "open" });
        }

        connectedCallback() {
          void this.render();
          this.mapping();
          onConnect.call(this);
        }

        disconnectedCallback() {
          this.cleanupEventHandlers();
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

            const prevState = CE.listeners.get(state) ?? {};
            const prevElements = prevState[attribute] ?? [];

            CE.listeners.set(state, {
              ...prevState,
              [attribute]: [...prevElements, this],
            });
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
          Object.assign(this._state, newState);
          const listener = CE.listeners.get(this._state) ?? {};

          for (const key in newState) {
            const elements = listener[key] ?? [];

            elements.forEach((element: any) => {
              element.shadowRoot.innerHTML = this._state[key];
            });
          }

          void this.render();
        }

        get state(): T {
          return this._state;
        }

        private setLoadingState() {
          if (!this.shadowRoot) return;
          this.shadowRoot.innerHTML = `<span>Loading...</span>`;
        }

        private hydrateShadowRoot(content: RenderContent) {
          if (!this.shadowRoot) return;

          if (typeof content === "string") {
            if (content === "") return;

            this.shadowRoot.innerHTML = content;
            return;
          }

          const cloned = content.content.cloneNode(true);
          this.shadowRoot.replaceChildren(cloned);
        }

        private async render() {
          const renderId = ++this.renderCallId;
          const content = render.call(this);

          if (content instanceof Promise) {
            this.setLoadingState();
            const resolvedContent = await content;

            if (renderId !== this.renderCallId) return;

            this.hydrateShadowRoot(resolvedContent);
          } else {
            this.hydrateShadowRoot(content);
          }

          if (renderId === this.renderCallId) {
            this.registerEventHandlers({ ...handlers });
          }
        }

        private registerEventHandlers(eventHandlers: {
          [key: string]: (this: CEInstance<T, K>) => void;
        }) {
          if (!this.shadowRoot) return;

          const requiredDelegatedHandlers = new Set<string>();

          for (const [handlerName, handler] of Object.entries(eventHandlers)) {
            if (typeof handler === "function") {
              const targetElements = this.shadowRoot?.querySelectorAll(
                `[${handlerName}]`
              );

              targetElements.forEach((targetElement) => {
                const eventName = targetElement.getAttribute(handlerName);

                if (!eventName) return;

                const delegatedHandlerKey = `${handlerName}:${eventName}`;

                requiredDelegatedHandlers.add(delegatedHandlerKey);

                if (this.delegatedHandlers.has(delegatedHandlerKey)) return;

                const listener: EventListener = (event) => {
                  const eventTargets =
                    typeof event.composedPath === "function"
                      ? event.composedPath()
                      : [event.target];

                  for (const eventTarget of eventTargets) {
                    if (!(eventTarget instanceof Element)) continue;

                    const registeredEventName = eventTarget.getAttribute(
                      handlerName
                    );

                    if (
                      registeredEventName === eventName &&
                      this.shadowRoot?.contains(eventTarget)
                    ) {
                      handler.call(this);
                      break;
                    }
                  }
                };

                this.delegatedHandlers.set(delegatedHandlerKey, {
                  eventName,
                  listener,
                });
                this.shadowRoot?.addEventListener(eventName, listener, true);
              });
            }
          }

          for (const [delegatedHandlerKey, delegatedHandler] of this
            .delegatedHandlers) {
            if (requiredDelegatedHandlers.has(delegatedHandlerKey)) continue;

            this.shadowRoot.removeEventListener(
              delegatedHandler.eventName,
              delegatedHandler.listener,
              true
            );
            this.delegatedHandlers.delete(delegatedHandlerKey);
          }
        }

        private cleanupEventHandlers() {
          if (!this.shadowRoot) return;

          for (const delegatedHandler of this.delegatedHandlers.values()) {
            this.shadowRoot.removeEventListener(
              delegatedHandler.eventName,
              delegatedHandler.listener,
              true
            );
          }

          this.delegatedHandlers.clear();
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
