export type Template = HTMLTemplateElement;
export type RenderContent = string | Template;

export type BindToken<T> = {
  __ce_bind: true;
  ownerId: string;
  key: keyof T;
  content: T[keyof T];
};

type CEInstance<T, K> = HTMLElement & {
  state: T;
  setState: (newState: Partial<T>) => void;
  bind: (key: keyof T) => BindToken<T>;
  handlers?: K;
};

type CEHandlers<T> = {
  [key: string]: (this: CEInstance<T, any>) => void;
};

export type DefineParams<
  T extends Record<string, any>,
  K extends CEHandlers<T>
> = {
  name: string;
  state: T;
  route?: string;
  onConnect?: (this: CEInstance<T, K>) => void;
  onDisconnect?: (this: CEInstance<T, K>) => void;
  onAdopt?: (this: CEInstance<T, K>) => void;
  onAttributeChange?: (
    this: CEInstance<T, K>,
    name: string,
    oldValue: string | null,
    newValue: string | null
  ) => void;
  render: (this: CEInstance<T, K>) => RenderContent | Promise<RenderContent>;
  handlers?: K;
};

class Router {
  private entryElement: HTMLElement | null = null;

  constructor() {
    if (typeof window === "undefined") return;

    window.addEventListener("popstate", () => this.renderCurrent());
    window.addEventListener("hashchange", () => this.renderCurrent());
  }

  setEntryElement(entryElement: HTMLElement) {
    this.entryElement = entryElement;
    this.renderCurrent();
  }

  registerRoute(route: string, name: string) {
    CE.routes.set(route, name);
  }

  renderCurrent() {
    if (!this.entryElement) return;

    const componentName = CE.routes.get(this.getCurrentPath());
    if (!componentName) return;

    this.entryElement.innerHTML = "";
    this.entryElement.append(document.createElement(componentName));
  }

  private getCurrentPath() {
    const hashPath = window.location.hash.replace(/^#/, "");
    const path = hashPath || window.location.pathname || "/";

    if (!path || path === "/index.html") return "/";
    return path;
  }
}

const cloneState = <T extends object>(state: T): T => {
  if (typeof structuredClone === "function") {
    return structuredClone(state);
  }

  return JSON.parse(JSON.stringify(state)) as T;
};

const toHtmlString = (content: RenderContent): string => {
  if (typeof content === "string") return content;

  const wrapper = document.createElement("div");
  wrapper.append(content.content.cloneNode(true));
  return wrapper.innerHTML;
};

const isBindToken = <T>(value: unknown): value is BindToken<T> =>
  typeof value === "object" && value !== null && "__ce_bind" in value;

export class CE {
  static entryPoint = "";
  static entryElement: HTMLElement | null = null;

  static routes = new Map<string, string>();
  static router = new Router();

  static navigate(path: string) {
    if (path.startsWith("#")) {
      window.location.hash = path;
    } else {
      window.history.pushState({}, "", path);
    }

    CE.router.renderCurrent();
  }

  static setEntryPoint(entryPoint: string) {
    this.entryPoint = entryPoint;

    const existingRoot = document.querySelector<HTMLElement>(entryPoint);
    const root = existingRoot ?? document.createElement(entryPoint);

    this.entryElement = root;

    if (!existingRoot) {
      document.body.append(root);
    }

    this.router.setEntryElement(root);
  }

  static define<
    T extends Record<string, any>,
    K extends CEHandlers<T> = CEHandlers<T>
  >(params: DefineParams<T, K>) {
    const {
      name,
      state,
      route,
      render,
      handlers,
      onConnect = () => {},
      onDisconnect = () => {},
      onAdopt = () => {},
      onAttributeChange = () => {},
    } = params;

    if (route) {
      CE.router.registerRoute(route, name);
    }

    if (customElements.get(name)) {
      return;
    }

    class CEElement extends HTMLElement {
      private _state = cloneState(state);
      private readonly componentId = CE.createInstanceId();
      private renderToken = 0;
      private bindingMap = new Map<string, Set<HTMLElement>>();

      constructor() {
        super();
        this.attachShadow({ mode: "open" });
      }

      connectedCallback() {
        void this.renderComponent();
        onConnect.call(this as CEInstance<T, K>);
      }

      disconnectedCallback() {
        onDisconnect.call(this as CEInstance<T, K>);
      }

      adoptedCallback() {
        onAdopt.call(this as CEInstance<T, K>);
      }

      attributeChangedCallback(
        attrName: string,
        oldValue: string | null,
        newValue: string | null
      ) {
        onAttributeChange.call(
          this as CEInstance<T, K>,
          attrName,
          oldValue,
          newValue
        );
      }

      get state(): T {
        return this._state;
      }

      bind(key: keyof T): BindToken<T> {
        return {
          __ce_bind: true,
          ownerId: this.componentId,
          key,
          content: this._state[key],
        };
      }

      setState(newState: Partial<T>) {
        this._state = { ...this._state, ...newState };

        for (const key of Object.keys(newState) as (keyof T)[]) {
          const nodes = this.bindingMap.get(String(key));
          if (!nodes) continue;

          for (const node of Array.from(nodes)) {
            node.textContent = String(this._state[key] ?? "");
          }
        }

        void this.renderComponent();
      }

      private indexBindings() {
        this.bindingMap.clear();

        const nodes = this.shadowRoot?.querySelectorAll<HTMLElement>("[data-ce-bind]");
        if (!nodes) return;

        for (const node of Array.from(nodes)) {
          if (node.dataset.ceOwner !== this.componentId) continue;

          const key = node.dataset.ceKey;
          if (!key) continue;

          if (!this.bindingMap.has(key)) {
            this.bindingMap.set(key, new Set());
          }

          this.bindingMap.get(key)?.add(node);
        }
      }

      private registerEventHandlers(eventHandlers?: K) {
        if (!eventHandlers || !this.shadowRoot) return;

        for (const [handlerName, handler] of Object.entries(eventHandlers)) {
          if (typeof handler !== "function") continue;

          const targets = this.shadowRoot.querySelectorAll<HTMLElement>(`[${handlerName}]`);
          for (const target of Array.from(targets)) {
            const eventName = target.getAttribute(handlerName);
            if (!eventName) continue;

            target.addEventListener(eventName, handler.bind(this as CEInstance<T, K>));
          }
        }
      }

      private setLoadingState() {
        if (!this.shadowRoot) return;
        this.shadowRoot.innerHTML = "<span>Loading...</span>";
      }

      private async renderComponent() {
        const token = ++this.renderToken;
        const content = render.call(this as CEInstance<T, K>);

        if (content instanceof Promise) {
          this.setLoadingState();
          const resolved = await content;
          if (token !== this.renderToken || !this.shadowRoot) return;

          this.shadowRoot.innerHTML = toHtmlString(resolved);
        } else if (this.shadowRoot) {
          this.shadowRoot.innerHTML = toHtmlString(content);
        }

        if (token !== this.renderToken) return;

        this.indexBindings();
        this.registerEventHandlers(handlers);
      }
    }

    customElements.define(name, CEElement);
  }

  private static id = 0;

  private static createInstanceId() {
    CE.id += 1;
    return `ce-${CE.id}`;
  }
}

CE.define({
  name: "render-value",
  state: {},
  render() {
    return "";
  },
});

export function html<T>(
  strings: TemplateStringsArray,
  ...values: Array<string | number | BindToken<T>>
): string {
  return strings.reduce((result, str, index) => {
    const value = values[index];
    if (value === undefined || value === null) return result + str;

    if (isBindToken<T>(value)) {
      return (
        result +
        str +
        `<span data-ce-bind data-ce-owner="${value.ownerId}" data-ce-key="${String(value.key)}">${String(value.content)}</span>`
      );
    }

    return result + str + String(value);
  }, "");
}
