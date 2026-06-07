export type Template = HTMLTemplateElement;
export type RenderContent = string | Template;

export type Signal<T> = {
  readonly __ce_signal: true;
  (): T;
  value: T;
  set: (value: T) => void;
  update: (updater: (value: T) => T) => void;
  subscribe: (listener: (value: T) => void) => () => void;
};

type EffectCleanup = void | (() => void);

type PropDefinition =
  | StringConstructor
  | NumberConstructor
  | BooleanConstructor
  | ((value: string | null) => unknown);

type PropsDefinition = Record<string, PropDefinition>;

type InferProp<T> = T extends StringConstructor
  ? string | undefined
  : T extends NumberConstructor
    ? number | undefined
    : T extends BooleanConstructor
      ? boolean
      : unknown;

type InferProps<T extends PropsDefinition | undefined> =
  T extends PropsDefinition
    ? {
        [K in keyof T]: InferProp<T[K]>;
      }
    : Record<string, never>;

type Lifecycle = {
  connected: (callback: () => void) => void;
  cleanup: (callback: () => void) => void;
  adopted: (callback: () => void) => void;
};

type FunctionDefineContext<P extends PropsDefinition | undefined> = {
  props: InferProps<P>;
  host: HTMLElement;
  lifecycle: Lifecycle;
};

export type DefineOptions<P extends PropsDefinition | undefined = undefined> = {
  props?: P;
  route?: string;
  preload?: (path: string) => Promise<void>;
  onError?: (error: unknown) => string;
};

export type RenderStaticOptions<P extends PropsDefinition | undefined = undefined> = {
  props?: Partial<InferProps<P>>;
  tag?: string;
  attributes?: false | Record<string, unknown>;
  mode?: "declarative-shadow-dom" | "light-dom";
};

export type FunctionComponent<P extends PropsDefinition | undefined = undefined> = (
  context: FunctionDefineContext<P>
) =>
  | RenderContent
  | Promise<RenderContent>
  | (() => RenderContent | Promise<RenderContent>);

type RouteDefinition = {
  component: string;
  preload?: (path: string) => Promise<void>;
  onError?: (error: unknown) => string;
};

type ComponentDefinition<P extends PropsDefinition | undefined = PropsDefinition | undefined> = {
  name: string;
  component: FunctionComponent<P>;
  props?: P;
};

type MatchPredicate<T> = (value: T) => boolean;
type MatchHandler<T, R> = (value: T) => R;

type HtmlValue =
  | string
  | number
  | boolean
  | EventListener
  | Signal<unknown>
  | HtmlValue[]
  | null
  | undefined;

type HtmlRenderContext = {
  eventHandlers: EventListener[];
  signals: Array<Signal<unknown>>;
  dependencies: Set<Signal<unknown>>;
  hasUnslottedDynamic: boolean;
  staticSnapshot: boolean;
};

let activeSignalCollector: Set<Signal<unknown>> | null = null;
let activeLifecycleOwner: Lifecycle | null = null;
let activeHtmlRenderContext: HtmlRenderContext | null = null;
let activeStaticSnapshot = false;

const MUTATING_ARRAY_METHODS = new Set([
  "copyWithin",
  "fill",
  "pop",
  "push",
  "reverse",
  "shift",
  "sort",
  "splice",
  "unshift",
]);

const isPlainObject = (value: unknown): value is Record<PropertyKey, unknown> => {
  if (typeof value !== "object" || value === null) return false;

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null || Array.isArray(value);
};

const createReactiveValue = <T>(
  value: T,
  notify: () => void,
  seen = new WeakMap<object, unknown>()
): T => {
  if (!isPlainObject(value)) return value;

  const objectValue = value as Record<PropertyKey, unknown>;
  if (seen.has(objectValue)) return seen.get(objectValue) as T;

  const proxy = new Proxy(objectValue, {
    get(target, property, receiver) {
      const current = Reflect.get(target, property, receiver);

      if (
        Array.isArray(target) &&
        typeof property === "string" &&
        MUTATING_ARRAY_METHODS.has(property) &&
        typeof current === "function"
      ) {
        return (...args: unknown[]) => {
          const result = current.apply(target, args);
          notify();
          return result;
        };
      }

      return current;
    },
    set(target, property, nextValue, receiver) {
      const previousValue = target[property];
      if (Object.is(previousValue, nextValue)) return true;

      const result = Reflect.set(
        target,
        property,
        createReactiveValue(nextValue, notify, seen),
        receiver
      );
      notify();
      return result;
    },
    deleteProperty(target, property) {
      if (!(property in target)) return true;

      const result = Reflect.deleteProperty(target, property);
      notify();
      return result;
    },
  });

  seen.set(objectValue, proxy);

  for (const key of Object.keys(objectValue)) {
    objectValue[key] = createReactiveValue(objectValue[key], notify, seen);
  }

  return proxy as T;
};

const createSignal = <T>(initialValue: T): Signal<T> => {
  const listeners = new Set<(value: T) => void>();
  let currentValue: T;

  const notify = () => {
    for (const listener of Array.from(listeners)) {
      listener(currentValue);
    }
  };

  const signal = (() => {
    activeSignalCollector?.add(signal as Signal<unknown>);
    return currentValue;
  }) as Signal<T>;

  const setValue = (nextValue: T) => {
    if (Object.is(currentValue, nextValue)) return;

    currentValue = createReactiveValue(nextValue, notify);
    notify();
  };

  Object.defineProperties(signal, {
    __ce_signal: {
      value: true,
    },
    value: {
      get() {
        activeSignalCollector?.add(signal as Signal<unknown>);
        return currentValue;
      },
      set(nextValue: T) {
        setValue(nextValue);
      },
    },
  });

  signal.set = setValue;
  signal.update = (updater) => {
    setValue(updater(currentValue));
  };
  signal.subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };
  signal.toString = () => String(currentValue ?? "");
  signal.valueOf = () => currentValue as any;

  currentValue = createReactiveValue(initialValue, notify);

  return signal;
};

const isSignal = (value: unknown): value is Signal<unknown> =>
  typeof value === "function" &&
  value !== null &&
  "__ce_signal" in value;

const peekSignal = <T>(signal: Signal<T>) => {
  const previousCollector = activeSignalCollector;
  activeSignalCollector = null;

  try {
    return signal.value;
  } finally {
    activeSignalCollector = previousCollector;
  }
};

export function effect(callback: () => EffectCleanup) {
  if (activeStaticSnapshot) return () => {};

  let cleanup: EffectCleanup;
  let dependencyCleanups: Array<() => void> = [];
  let disposed = false;

  const run = () => {
    if (disposed) return;

    if (typeof cleanup === "function") cleanup();
    for (const dependencyCleanup of dependencyCleanups) dependencyCleanup();
    dependencyCleanups = [];

    const dependencies = new Set<Signal<unknown>>();
    const previousCollector = activeSignalCollector;
    activeSignalCollector = dependencies;

    try {
      cleanup = callback();
    } finally {
      activeSignalCollector = previousCollector;
    }

    for (const dependency of dependencies) {
      dependencyCleanups.push(dependency.subscribe(run));
    }
  };

  run();

  const dispose = () => {
    disposed = true;
    if (typeof cleanup === "function") cleanup();
    for (const dependencyCleanup of dependencyCleanups) dependencyCleanup();
    dependencyCleanups = [];
  };

  activeLifecycleOwner?.cleanup(dispose);

  return dispose;
}

const createDerived = <T>(compute: () => T): Signal<T> => {
  if (activeStaticSnapshot) {
    return createSignal(compute());
  }

  const derived = createSignal(undefined as T);

  effect(() => {
    derived.set(compute());
  });

  return derived;
};

const createHtmlRenderContext = (): HtmlRenderContext => ({
  eventHandlers: [],
  signals: [],
  dependencies: new Set(),
  hasUnslottedDynamic: false,
  staticSnapshot: false,
});

const withHtmlRenderContext = <T>(
  callback: () => T,
  options?: { staticSnapshot?: boolean }
) => {
  const previousHtmlContext = activeHtmlRenderContext;
  const previousCollector = activeSignalCollector;
  const context = createHtmlRenderContext();
  context.staticSnapshot = options?.staticSnapshot ?? false;
  activeHtmlRenderContext = context;
  activeSignalCollector = context.dependencies;

  try {
    return {
      value: callback(),
      context,
    };
  } finally {
    activeHtmlRenderContext = previousHtmlContext;
    activeSignalCollector = previousCollector;
  }
};

const getEventAttributeName = (staticSegment: string) => {
  const match = staticSegment.match(/(\s)(on[a-z][\w:-]*)\s*=\s*$/i);
  if (!match) return null;

  return {
    eventName: match[2].slice(2).toLowerCase(),
    staticPrefix: staticSegment.slice(0, -match[0].length) + match[1],
  };
};

const getDynamicAttributeName = (staticSegment: string) => {
  const match = staticSegment.match(/(\s)([\w:-]+)\s*=\s*["']?$/);
  if (!match) return null;

  return {
    attributeName: match[2],
    staticPrefix: staticSegment.slice(0, -match[0].length) + match[1],
  };
};

const isAttributeInterpolation = (staticSegment: string) =>
  /[\w:-]+\s*=\s*["']?$/.test(staticSegment);

const toHtmlString = (content: RenderContent): string => {
  if (typeof content === "string") return content;

  return content.innerHTML;
};

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const escapeAttribute = (value: unknown) =>
  escapeHtml(value).replace(/"/g, "&quot;");

const toKebabCase = (value: string) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();

const inferComponentName = (component: Function) => {
  const tagName = toKebabCase(component.name);

  if (!component.name || !tagName.includes("-")) {
    throw new Error(
      "define() requires a named multi-word function. Example: define(function MyCounter() { ... })"
    );
  }

  return tagName;
};

const getPropAttributeName = (propName: string) => toKebabCase(propName);

const parsePropValue = (
  host: HTMLElement,
  propName: string,
  definition: PropDefinition
) => {
  const attributeName = getPropAttributeName(propName);
  const attributeValue =
    host.getAttribute(attributeName) ?? host.getAttribute(propName);

  if (definition === Boolean) {
    return host.hasAttribute(attributeName) || host.hasAttribute(propName);
  }

  if (attributeValue === null) {
    return undefined;
  }

  if (definition === Number) {
    const value = Number(attributeValue);
    return Number.isFinite(value) ? value : undefined;
  }

  if (definition === String) {
    return attributeValue;
  }

  return definition(attributeValue);
};

class Router {
  private entryElement: HTMLElement | null = null;
  private hydrate = true;
  private renderToken = 0;
  private ignoreNextHashChange = false;

  constructor() {
    if (typeof window === "undefined") return;

    window.addEventListener("popstate", () => {
      void this.renderCurrent();
    });
    window.addEventListener("hashchange", () => {
      if (this.ignoreNextHashChange) {
        this.ignoreNextHashChange = false;
        return;
      }

      void this.renderCurrent();
    });
  }

  setEntryElement(entryElement: HTMLElement, options?: { hydrate?: boolean }) {
    this.entryElement = entryElement;
    this.hydrate = options?.hydrate ?? true;
    void this.renderCurrent();
  }

  registerRoute(route: string, routeDefinition: RouteDefinition) {
    CE.routes.set(route, routeDefinition);
  }

  async navigate(path: string) {
    if (path.startsWith("#")) {
      this.ignoreNextHashChange = true;
      window.location.hash = path;
      await this.renderCurrent();
      return;
    }

    window.history.pushState({}, "", path);
    await this.renderCurrent();
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
      if (token !== this.renderToken || path !== this.getCurrentPath()) return;

      if (routeDefinition.onError) {
        this.entryElement.innerHTML = routeDefinition.onError(error);
        return;
      }
      throw error;
    }

    if (token !== this.renderToken || path !== this.getCurrentPath()) return;

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

export class CE {
  static entryPoint = "";
  static entryElement: HTMLElement | null = null;
  static routes = new Map<string, RouteDefinition>();
  static definitions = new Map<string, ComponentDefinition<any>>();
  static router = new Router();

  static signal<T>(value: T): Signal<T> {
    return createSignal(value);
  }

  static derived<T>(compute: () => T): Signal<T> {
    return createDerived(compute);
  }

  static effect(callback: () => EffectCleanup) {
    return effect(callback);
  }

  static define<P extends PropsDefinition | undefined = undefined>(
    component: FunctionComponent<P>,
    options: DefineOptions<P> = {}
  ) {
    if (typeof component !== "function") {
      throw new Error("define() only accepts a named function component.");
    }

    const name = inferComponentName(component);
    const propDefinitions = options.props;

    CE.definitions.set(name, {
      name,
      component,
      props: propDefinitions,
    });

    if (options.route) {
      CE.router.registerRoute(options.route, {
        component: name,
        preload: options.preload,
        onError: options.onError,
      });
    }

    if (typeof customElements === "undefined" || customElements.get(name)) {
      return;
    }

    class CEElement extends HTMLElement {
      private renderToken = 0;
      private inlineHandlers = new Map<
        HTMLElement,
        { eventName: string; listener: EventListener }
      >();
      private signalCleanups: Array<() => void> = [];
      private renderDependencyCleanups: Array<() => void> = [];
      private lifecycleConnectedCallbacks: Array<() => void> = [];
      private lifecycleCleanupCallbacks: Array<() => void> = [];
      private lifecycleAdoptedCallbacks: Array<() => void> = [];
      private propSignals = new Map<string, Signal<unknown>>();
      private lastHtmlContext: HtmlRenderContext | null = null;
      private componentRender:
        | (() => RenderContent | Promise<RenderContent>)
        | null = null;
      private initialRenderSnapshot: {
        value: RenderContent | Promise<RenderContent>;
        context: HtmlRenderContext;
      } | null = null;
      readonly lifecycle: Lifecycle = {
        connected: (callback) => {
          this.lifecycleConnectedCallbacks.push(callback);
        },
        cleanup: (callback) => {
          this.lifecycleCleanupCallbacks.push(callback);
        },
        adopted: (callback) => {
          this.lifecycleAdoptedCallbacks.push(callback);
        },
      };
      props = this.createReactiveProps();

      constructor() {
        super();
        this.attachShadow({ mode: "open" });
      }

      static get observedAttributes() {
        return Object.keys(propDefinitions ?? {}).map(getPropAttributeName);
      }

      connectedCallback() {
        this.initializeComponent();
        void this.renderComponent();
        for (const callback of this.lifecycleConnectedCallbacks) {
          callback();
        }
      }

      disconnectedCallback() {
        this.cleanupEventHandlers();
        for (const callback of this.lifecycleCleanupCallbacks) {
          callback();
        }
      }

      adoptedCallback() {
        for (const callback of this.lifecycleAdoptedCallbacks) {
          callback();
        }
      }

      attributeChangedCallback(attrName: string) {
        this.updatePropSignal(attrName);
      }

      private createReactiveProps() {
        const target: Record<string, unknown> = {};

        if (!propDefinitions) {
          return target as InferProps<P>;
        }

        for (const [propName, definition] of Object.entries(propDefinitions)) {
          const signal = CE.signal(parsePropValue(this, propName, definition));
          this.propSignals.set(propName, signal);
        }

        return new Proxy(target, {
          get: (_propsTarget, property) => {
            if (typeof property !== "string") return undefined;
            return this.propSignals.get(property)?.();
          },
          set: (_propsTarget, property, value) => {
            if (typeof property !== "string") return true;
            this.propSignals.get(property)?.set(value);
            return true;
          },
          ownKeys: () => Array.from(this.propSignals.keys()),
          getOwnPropertyDescriptor: (_propsTarget, property) => {
            if (typeof property !== "string" || !this.propSignals.has(property)) {
              return undefined;
            }

            return {
              enumerable: true,
              configurable: true,
            };
          },
        }) as InferProps<P>;
      }

      private updatePropSignal(attrName: string) {
        if (!propDefinitions) return;

        for (const [propName, definition] of Object.entries(propDefinitions)) {
          if (getPropAttributeName(propName) !== attrName && propName !== attrName) {
            continue;
          }

          this.propSignals
            .get(propName)
            ?.set(parsePropValue(this, propName, definition));
        }
      }

      private initializeComponent() {
        if (this.componentRender) return;

        const previousOwner = activeLifecycleOwner;
        activeLifecycleOwner = this.lifecycle;

        try {
          const rendered = withHtmlRenderContext(() =>
            component({
              props: this.props as InferProps<P>,
              host: this,
              lifecycle: this.lifecycle,
            })
          );
          const result = rendered.value;

          if (typeof result === "function") {
            this.componentRender = result;
            return;
          }

          this.initialRenderSnapshot = {
            value: result as RenderContent | Promise<RenderContent>,
            context: rendered.context,
          };
          this.componentRender = () =>
            result as RenderContent | Promise<RenderContent>;
        } finally {
          activeLifecycleOwner = previousOwner;
        }
      }

      private registerInlineEventHandlers(eventHandlers: Array<EventListener>) {
        if (!this.shadowRoot) return;

        this.cleanupInlineEventHandlers();

        const targets =
          this.shadowRoot.querySelectorAll<HTMLElement>("[data-ce-event]");

        for (const target of Array.from(targets)) {
          const eventDescriptor = target.dataset.ceEvent;
          if (!eventDescriptor) continue;

          const [handlerIndex, eventName] = eventDescriptor.split(":");
          const handler = eventHandlers[Number(handlerIndex)];
          if (!eventName || typeof handler !== "function") continue;

          const listener: EventListener = (event) => {
            handler.call(this, event);
          };

          target.addEventListener(eventName, listener);
          this.inlineHandlers.set(target, { eventName, listener });
        }
      }

      private cleanupInlineEventHandlers() {
        for (const [target, handler] of this.inlineHandlers) {
          target.removeEventListener(handler.eventName, handler.listener);
        }

        this.inlineHandlers.clear();
      }

      private registerSignalBindings(signals: Array<Signal<unknown>>) {
        if (!this.shadowRoot) return;

        this.cleanupSignalBindings();

        const textTargets =
          this.shadowRoot.querySelectorAll<HTMLElement>("[data-ce-signal]");

        for (const target of Array.from(textTargets)) {
          const signalIndex = Number(target.dataset.ceSignal);
          const signal = signals[signalIndex];
          if (!signal) continue;

          target.textContent = String(peekSignal(signal) ?? "");
          this.signalCleanups.push(
            signal.subscribe((value) => {
              target.textContent = String(value ?? "");
            })
          );
        }

        const attributeTargets =
          this.shadowRoot.querySelectorAll<HTMLElement>("[data-ce-signal-attr]");

        for (const target of Array.from(attributeTargets)) {
          const signalDescriptor = target.dataset.ceSignalAttr;
          if (!signalDescriptor) continue;

          const [signalIndex, attributeName] = signalDescriptor.split(":");
          const signal = signals[Number(signalIndex)];
          if (!signal || !attributeName) continue;

          target.setAttribute(attributeName, String(peekSignal(signal) ?? ""));
          this.signalCleanups.push(
            signal.subscribe((value) => {
              target.setAttribute(attributeName, String(value ?? ""));
            })
          );
        }
      }

      private registerRenderDependencies(dependencies: Set<Signal<unknown>>) {
        this.cleanupRenderDependencies();

        for (const dependency of dependencies) {
          this.renderDependencyCleanups.push(
            dependency.subscribe(() => {
              void this.patchDynamicRender();
            })
          );
        }
      }

      private cleanupSignalBindings() {
        for (const cleanup of this.signalCleanups) cleanup();
        this.signalCleanups = [];
      }

      private cleanupRenderDependencies() {
        for (const cleanup of this.renderDependencyCleanups) cleanup();
        this.renderDependencyCleanups = [];
      }

      private cleanupEventHandlers() {
        this.cleanupInlineEventHandlers();
        this.cleanupSignalBindings();
        this.cleanupRenderDependencies();
      }

      private setLoadingState() {
        if (!this.shadowRoot) return;
        this.shadowRoot.innerHTML = "<span>Loading...</span>";
      }

      private async renderComponent() {
        if (!this.componentRender) return;

        const token = ++this.renderToken;
        const rendered =
          this.initialRenderSnapshot ??
          withHtmlRenderContext(() => this.componentRender?.() ?? "");
        this.initialRenderSnapshot = null;
        const content = rendered.value;

        if (content instanceof Promise) {
          this.setLoadingState();
          const resolved = await content;
          if (token !== this.renderToken || !this.shadowRoot) return;

          this.shadowRoot.innerHTML = toHtmlString(resolved);
        } else if (this.shadowRoot) {
          this.shadowRoot.innerHTML = toHtmlString(content);
        }

        if (token !== this.renderToken) return;

        this.lastHtmlContext = rendered.context;
        this.registerInlineEventHandlers(rendered.context.eventHandlers);
        this.registerSignalBindings(rendered.context.signals);
        this.registerRenderDependencies(rendered.context.dependencies);
      }

      private async patchDynamicRender() {
        if (
          !this.shadowRoot ||
          !this.componentRender ||
          !this.lastHtmlContext ||
          this.lastHtmlContext.hasUnslottedDynamic
        ) {
          await this.renderComponent();
          return;
        }

        const token = ++this.renderToken;
        const rendered = withHtmlRenderContext(() => this.componentRender?.() ?? "");
        const content = rendered.value;

        if (content instanceof Promise || rendered.context.hasUnslottedDynamic) {
          await this.renderComponent();
          return;
        }

        const template = document.createElement("template");
        template.innerHTML = toHtmlString(content);

        const currentSlots =
          this.shadowRoot.querySelectorAll<HTMLElement>("[data-ce-slot]");
        const nextSlots =
          template.content.querySelectorAll<HTMLElement>("[data-ce-slot]");

        if (
          token !== this.renderToken ||
          currentSlots.length === 0 ||
          currentSlots.length !== nextSlots.length
        ) {
          await this.renderComponent();
          return;
        }

        for (const [index, currentSlot] of Array.from(currentSlots).entries()) {
          const nextSlot = nextSlots[index];
          if (!nextSlot || currentSlot.innerHTML === nextSlot.innerHTML) continue;

          currentSlot.innerHTML = nextSlot.innerHTML;
        }

        if (token !== this.renderToken) return;

        this.lastHtmlContext = rendered.context;
        this.registerInlineEventHandlers(rendered.context.eventHandlers);
        this.registerSignalBindings(rendered.context.signals);
        this.registerRenderDependencies(rendered.context.dependencies);
      }
    }

    customElements.define(name, CEElement);
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

  static async navigate(path: string) {
    await CE.router.navigate(path);
  }

  static async renderStatic<P extends PropsDefinition | undefined = undefined>(
    component: FunctionComponent<P>,
    options: RenderStaticOptions<P> = {}
  ) {
    const tagName = options.tag ?? inferComponentName(component);
    const props = (options.props ?? {}) as InferProps<P>;
    const lifecycle: Lifecycle = {
      connected: () => {},
      cleanup: () => {},
      adopted: () => {},
    };
    const previousOwner = activeLifecycleOwner;
    const previousStaticSnapshot = activeStaticSnapshot;
    activeLifecycleOwner = lifecycle;
    activeStaticSnapshot = true;

    try {
      const rendered = withHtmlRenderContext(
        () =>
          component({
            props,
            host: {} as HTMLElement,
            lifecycle,
          }),
        { staticSnapshot: true }
      );
      const result = rendered.value;
      const render =
        typeof result === "function"
          ? result
          : () => result as RenderContent | Promise<RenderContent>;
      const snapshot = withHtmlRenderContext(() => render(), {
        staticSnapshot: true,
      });
      const content = snapshot.value;
      const resolved = content instanceof Promise ? await content : content;
      const markup = toHtmlString(resolved);
      const attributes =
        options.attributes === false
          ? ""
          : serializeHostAttributes(options.attributes ?? props);

      if (options.mode === "light-dom") {
        return `<${tagName}${attributes}>${markup}</${tagName}>`;
      }

      return `<${tagName}${attributes}><template shadowrootmode="open">${markup}</template></${tagName}>`;
    } finally {
      activeLifecycleOwner = previousOwner;
      activeStaticSnapshot = previousStaticSnapshot;
    }
  }
}

export const define = CE.define.bind(CE) as typeof CE.define;
export const signal = CE.signal.bind(CE) as typeof CE.signal;
export const derived = CE.derived.bind(CE) as typeof CE.derived;
export const navigate = CE.navigate.bind(CE) as typeof CE.navigate;
export const setEntryPoint = CE.setEntryPoint.bind(CE) as typeof CE.setEntryPoint;
export const renderStatic = CE.renderStatic.bind(CE) as typeof CE.renderStatic;

export function html(
  strings: TemplateStringsArray,
  ...values: Array<HtmlValue>
): string {
  return strings.reduce((result, str, index) => {
    return result + renderHtmlValue(str, values[index]);
  }, "");
}

const renderHtmlValue = (staticSegment: string, value: HtmlValue): string => {
  if (value === undefined || value === null) return staticSegment;

  if (Array.isArray(value)) {
    if (value.length === 0) return staticSegment;
    return staticSegment + value.map(renderHtmlArrayItem).join("");
  }

  if (isSignal(value)) {
    const signalValue = peekSignal(value);

    if (!activeHtmlRenderContext) {
      return staticSegment + String(signalValue ?? "");
    }

    const attribute = getDynamicAttributeName(staticSegment);

    if (activeHtmlRenderContext.staticSnapshot) {
      return staticSegment + String(signalValue ?? "");
    }

    const signalIndex = activeHtmlRenderContext.signals.push(value) - 1;

    if (attribute) {
      return (
        attribute.staticPrefix +
        `data-ce-signal-attr="${signalIndex}:${attribute.attributeName}" ` +
        `${attribute.attributeName}="${String(signalValue ?? "")}`
      );
    }

    if (isAttributeInterpolation(staticSegment)) {
      return staticSegment + String(signalValue ?? "");
    }

    return (
      staticSegment +
      `<span data-ce-signal="${signalIndex}">${String(signalValue ?? "")}</span>`
    );
  }

  if (typeof value === "function") {
    const eventAttribute = getEventAttributeName(staticSegment);
    if (!eventAttribute || !activeHtmlRenderContext) {
      return staticSegment;
    }

    if (activeHtmlRenderContext.staticSnapshot) {
      return eventAttribute.staticPrefix.trimEnd();
    }

    const eventIndex = activeHtmlRenderContext.eventHandlers.push(value) - 1;

    return (
      eventAttribute.staticPrefix +
      `data-ce-event="${eventIndex}:${eventAttribute.eventName}"`
    );
  }

  if (isAttributeInterpolation(staticSegment)) {
    if (activeHtmlRenderContext) {
      activeHtmlRenderContext.hasUnslottedDynamic = true;
    }

    return staticSegment + String(value);
  }

  if (activeHtmlRenderContext?.staticSnapshot) {
    return staticSegment + String(value);
  }

  return staticSegment + `<span data-ce-slot>${String(value)}</span>`;
};

const serializeHostAttributes = (props: Record<string, unknown>) => {
  const attributes = Object.entries(props)
    .filter(([, value]) => value !== undefined && value !== null && value !== false)
    .map(([name, value]) => {
      const attrName = getPropAttributeName(name);
      if (value === true) return attrName;
      return `${attrName}="${escapeAttribute(value)}"`;
    });

  return attributes.length > 0 ? ` ${attributes.join(" ")}` : "";
};

const renderHtmlArrayItem = (value: HtmlValue): string => {
  if (typeof value === "string") return value;
  return renderHtmlValue("", value);
};

export function match<T>(value: T) {
  return {
    when<R>(predicate: MatchPredicate<T>, handler: MatchHandler<T, R>) {
      if (predicate(value)) {
        return createMatchedResult(handler(value));
      }

      return createMatchBuilder<T, R>(value);
    },
  };
}

const createMatchedResult = <R>(result: R) => ({
  when() {
    return createMatchedResult(result);
  },
  otherwise() {
    return result;
  },
});

const createMatchBuilder = <T, R>(value: T) => ({
  when(predicate: MatchPredicate<T>, handler: MatchHandler<T, R>) {
    if (predicate(value)) {
      return createMatchedResult(handler(value));
    }

    return createMatchBuilder<T, R>(value);
  },
  otherwise(handler: MatchHandler<T, R>) {
    return handler(value);
  },
});
