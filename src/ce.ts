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
  preload?: (path: string) => Promise<void>;
  onError?: (error: unknown) => string;
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

type RouteDefinition = {
  component: string;
  preload?: (path: string) => Promise<void>;
  onError?: (error: unknown) => string;
};

class Router {
  private entryElement: HTMLElement | null = null;
  private hydrate = true;
  private renderToken = 0;

  constructor() {
    if (typeof window === "undefined") return;

    window.addEventListener("popstate", () => this.renderCurrent());
    window.addEventListener("hashchange", () => this.renderCurrent());
  }

  setEntryElement(entryElement: HTMLElement, options?: { hydrate?: boolean }) {
    this.entryElement = entryElement;
    this.hydrate = options?.hydrate ?? true;
    void this.renderCurrent();
  }

  registerRoute(route: string, routeDefinition: RouteDefinition) {
    CE.routes.set(route, routeDefinition);
  }

  async renderCurrent() {
    if (!this.entryElement) return;

    const token = ++this.renderToken;
    const path = this.getCurrentPath();
    const routeDefinition = CE.routes.get(path);
    if (!routeDefinition) return;

    try {
      if (routeDefinition.preload) {
        await routeDefinition.preload(path);
      }
    } catch (error) {
      if (token !== this.renderToken || path !== this.getCurrentPath()) {
        return;
      }

      if (routeDefinition.onError) {
        this.entryElement.innerHTML = routeDefinition.onError(error);
        return;
      }
      throw error;
    }

    if (token !== this.renderToken || path !== this.getCurrentPath()) {
      return;
    }

    const componentName = routeDefinition.component;
    const currentChild = this.entryElement.firstElementChild as HTMLElement | null;

    if (
      this.hydrate &&
      currentChild &&
      currentChild.tagName.toLowerCase() === componentName
    ) {
      return;
    }

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

const isPlainObject = (value: unknown): value is Record<PropertyKey, unknown> => {
  if (typeof value !== "object" || value === null) return false;

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

const cloneObjectSafely = <T>(value: T, seen = new WeakMap<object, unknown>()): T => {
  if (typeof value !== "object" || value === null) {
    return value;
  }

  if (seen.has(value)) {
    return seen.get(value) as T;
  }

  if (Array.isArray(value)) {
    const clonedArray: unknown[] = [];
    seen.set(value, clonedArray);

    for (const item of value) {
      clonedArray.push(cloneObjectSafely(item, seen));
    }

    return clonedArray as T;
  }

  if (!isPlainObject(value)) {
    return value;
  }

  const clonedObject: Record<PropertyKey, unknown> = {};
  seen.set(value, clonedObject);

  for (const key of Object.keys(value)) {
    clonedObject[key] = cloneObjectSafely(
      (value as Record<PropertyKey, unknown>)[key],
      seen
    );
  }

  return clonedObject as T;
};

const cloneState = <T extends object>(state: T): T => {
  if (typeof structuredClone === "function") {
    try {
      return structuredClone(state);
    } catch {
      return cloneObjectSafely(state);
    }
  }

  return cloneObjectSafely(state);
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

  static routes = new Map<string, RouteDefinition>();
  static definitions = new Map<
    string,
    {
      state: Record<string, any>;
      render: (this: CEInstance<any, any>) => RenderContent | Promise<RenderContent>;
      handlers?: CEHandlers<any>;
    }
  >();
  static router = new Router();

  static async navigate(path: string) {
    if (path.startsWith("#")) {
      window.location.hash = path;
    } else {
      window.history.pushState({}, "", path);
    }

    await CE.router.renderCurrent();
  }

  static setEntryPoint(
    entryPoint: string,
    options?: { rootElement?: HTMLElement; hydrate?: boolean }
  ) {
    this.entryPoint = entryPoint;

    const existingRoot =
      options?.rootElement ?? document.querySelector<HTMLElement>(entryPoint);
    const root = existingRoot ?? document.createElement(entryPoint);

    this.entryElement = root;

    if (!existingRoot) {
      document.body.append(root);
    }

    this.router.setEntryElement(root, { hydrate: options?.hydrate });
  }

  static define<
    T extends Record<string, any>,
    K extends CEHandlers<T> = CEHandlers<T>
  >(params: DefineParams<T, K>) {
    const {
      name,
      state,
      route,
      preload,
      onError,
      render,
      handlers,
      onConnect = () => {},
      onDisconnect = () => {},
      onAdopt = () => {},
      onAttributeChange = () => {},
    } = params;

    CE.definitions.set(name, { state, render, handlers });

    if (route) {
      CE.router.registerRoute(route, {
        component: name,
        preload,
        onError,
      });
    }

    if (customElements.get(name)) {
      return;
    }

    class CEElement extends HTMLElement {
      private _state = cloneState(state);
      private readonly componentId = CE.createInstanceId();
      private renderToken = 0;
      private bindingMap = new Map<string, Set<HTMLElement>>();
      private delegatedHandlers = new Map<
        string,
        { eventName: string; listener: EventListener }
      >();

      constructor() {
        super();
        this.attachShadow({ mode: "open" });
      }

      connectedCallback() {
        void this.renderComponent();
        onConnect.call(this as CEInstance<T, K>);
      }

      disconnectedCallback() {
        this.cleanupEventHandlers();
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

        const requiredDelegatedHandlers = new Set<string>();

        for (const [handlerName, handler] of Object.entries(eventHandlers)) {
          if (typeof handler !== "function") continue;

          const targets = this.shadowRoot.querySelectorAll<HTMLElement>(`[${handlerName}]`);
          for (const target of Array.from(targets)) {
            const eventName = target.getAttribute(handlerName);
            if (!eventName) continue;

            const delegatedHandlerKey = `${handlerName}:${eventName}`;
            requiredDelegatedHandlers.add(delegatedHandlerKey);

            if (this.delegatedHandlers.has(delegatedHandlerKey)) continue;

            const listener: EventListener = (event) => {
              const eventTargets =
                typeof event.composedPath === "function"
                  ? event.composedPath()
                  : [event.target];

              for (const eventTarget of eventTargets) {
                if (!(eventTarget instanceof Element)) continue;

                const registeredEventName = eventTarget.getAttribute(handlerName);
                if (
                  registeredEventName === eventName &&
                  this.shadowRoot?.contains(eventTarget)
                ) {
                  handler.call(this as CEInstance<T, K>);
                  break;
                }
              }
            };

            this.delegatedHandlers.set(delegatedHandlerKey, { eventName, listener });
            this.shadowRoot.addEventListener(eventName, listener, true);
          }
        }

        for (const [delegatedHandlerKey, delegatedHandler] of this.delegatedHandlers) {
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

  static async renderRouteToString(path: string, options?: { entryPoint?: string }) {
    const routeDefinition = CE.routes.get(path) ?? CE.routes.get("/");
    if (!routeDefinition) return "";

    const definition = CE.definitions.get(routeDefinition.component);
    if (!definition) return "";

    let routeMarkup = "";

    try {
      if (routeDefinition.preload) {
        await routeDefinition.preload(path);
      }

      routeMarkup = `<${routeDefinition.component}>${await CE.renderComponentToString(
        definition
      )}</${routeDefinition.component}>`;
    } catch (error) {
      if (!routeDefinition.onError) {
        throw error;
      }

      routeMarkup = routeDefinition.onError(error);
    }

    const entryTag = options?.entryPoint ?? this.entryPoint ?? "div";
    return `<${entryTag}>${routeMarkup}</${entryTag}>`;
  }

  private static async renderComponentToString(definition: {
    state: Record<string, any>;
    render: (this: any) => RenderContent | Promise<RenderContent>;
    handlers?: CEHandlers<any>;
  }) {
    const stateCopy = cloneState(definition.state);
    const componentId = CE.createInstanceId();

    const context = {
      state: stateCopy,
      handlers: definition.handlers,
      setState(newState: Record<string, any>) {
        Object.assign(stateCopy, newState);
      },
      bind(key: string) {
        return {
          __ce_bind: true as const,
          ownerId: componentId,
          key,
          content: stateCopy[key],
        };
      },
    };

    const rendered = definition.render.call(context);
    const resolved = rendered instanceof Promise ? await rendered : rendered;

    if (typeof resolved === "string") {
      return resolved;
    }

    if (typeof document === "undefined") {
      return "";
    }

    return toHtmlString(resolved);
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
