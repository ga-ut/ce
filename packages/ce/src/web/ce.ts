export type Template = HTMLTemplateElement;
export type RenderContent = string | Template;

export type BindToken<T> = {
  __ce_bind: true;
  ownerId: string;
  key: keyof T;
  content: T[keyof T];
};

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

type SetupContext<P extends PropsDefinition | undefined> = {
  props: InferProps<P>;
  signal: typeof CE.signal;
  derived: typeof CE.derived;
};

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

type FunctionDefineOptions<P extends PropsDefinition | undefined = undefined> = {
  props?: P;
  route?: string;
  preload?: (path: string) => Promise<void>;
  onError?: (error: unknown) => string;
};

type FunctionComponent<P extends PropsDefinition | undefined = undefined> = (
  context: FunctionDefineContext<P>
) =>
  | RenderContent
  | Promise<RenderContent>
  | (() => RenderContent | Promise<RenderContent>);

type MatchPredicate<T> = (value: T) => boolean;
type MatchHandler<T, R> = (value: T) => R;

type HtmlValue<T> =
  | string
  | number
  | boolean
  | EventListener
  | BindToken<T>
  | Signal<unknown>
  | HtmlValue<T>[]
  | null
  | undefined;

type CEInstance<T, K> = HTMLElement & {
  state: T;
  props: Record<string, unknown>;
  lifecycle: Lifecycle;
  setState: (newState: Partial<T>) => void;
  bind: (key: keyof T) => BindToken<T>;
  handlers?: K;
  [key: string]: any;
};

type CEHandlers<T> = {
  [key: string]: (this: CEInstance<T, any>) => void;
};

export type DefineParams<
  T extends Record<string, any>,
  K extends CEHandlers<T>,
  P extends PropsDefinition | undefined = undefined
> = {
  name: string;
  state: T;
  props?: P;
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
  setup?: (this: CEInstance<T, K>, context: SetupContext<P>) => Record<string, any>;
  render: (this: CEInstance<T, K>) => RenderContent | Promise<RenderContent>;
  handlers?: K;
  [key: string]: any;
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
  if (isSignal(value)) {
    return createSignal(value.value) as T;
  }

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
  if (containsSignal(state)) {
    return cloneObjectSafely(state);
  }

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

let activeSignalCollector: Set<Signal<unknown>> | null = null;
let activeLifecycleOwner: { cleanup: (callback: () => void) => void } | null = null;

const readSignal = <T>(signal: Signal<T>) => {
  activeSignalCollector?.add(signal as Signal<unknown>);
  return signal.value;
};

const peekSignal = <T>(signal: Signal<T>) => {
  const previousCollector = activeSignalCollector;
  activeSignalCollector = null;

  try {
    return signal.value;
  } finally {
    activeSignalCollector = previousCollector;
  }
};

const createSignalValueProxy = <T>(
  value: T,
  notify: () => void,
  seen = new WeakMap<object, unknown>()
): T => {
  if (typeof value !== "object" || value === null) {
    return value;
  }

  if (isSignal(value)) {
    return value;
  }

  if (!Array.isArray(value) && !isPlainObject(value)) {
    return value;
  }

  if (seen.has(value)) {
    return seen.get(value) as T;
  }

  const target = value as Record<PropertyKey, unknown>;

  for (const key of Object.keys(target)) {
    target[key] = createSignalValueProxy(target[key], notify, seen);
  }

  const proxy = new Proxy(target, {
    set(stateTarget, property, nextValue) {
      const previousValue = stateTarget[property];
      if (Object.is(previousValue, nextValue)) return true;

      stateTarget[property] = createSignalValueProxy(nextValue, notify, seen);
      notify();

      return true;
    },
    deleteProperty(stateTarget, property) {
      if (!(property in stateTarget)) return true;

      delete stateTarget[property];
      notify();

      return true;
    },
  });

  seen.set(value, proxy);

  return proxy as T;
};

const createSignal = <T>(initialValue: T): Signal<T> => {
  let currentValue: T;
  const listeners = new Set<(value: T) => void>();
  const notify = () => {
    for (const listener of Array.from(listeners)) {
      listener(currentValue);
    }
  };

  const signal = (() => readSignal(signal)) as Signal<T>;
  currentValue = createSignalValueProxy(initialValue, notify);

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
        if (Object.is(currentValue, nextValue)) return;

        currentValue = createSignalValueProxy(nextValue, notify);
        notify();
      },
    },
  });

  signal.set = (nextValue) => {
    signal.value = nextValue;
  };
  signal.update = (updater) => {
    signal.value = updater(signal.value);
  };
  signal.subscribe = (listener) => {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  };
  signal.toString = () => String(currentValue ?? "");
  signal.valueOf = () => currentValue as any;

  return signal;
};

const createDerived = <T>(compute: () => T): Signal<T> => {
  const derived = createSignal(undefined as T);
  let cleanups: Array<() => void> = [];

  const recompute = () => {
    for (const cleanup of cleanups) {
      cleanup();
    }

    cleanups = [];

    const previousCollector = activeSignalCollector;
    const dependencies = new Set<Signal<unknown>>();
    activeSignalCollector = dependencies;

    try {
      derived.set(compute());
    } finally {
      activeSignalCollector = previousCollector;
    }

    cleanups = Array.from(dependencies).map((dependency) =>
      dependency.subscribe(recompute)
    );
  };

  recompute();

  return derived;
};

export function effect(callback: () => EffectCleanup) {
  const owner = activeLifecycleOwner;
  let effectCleanup: EffectCleanup;
  let dependencyCleanups: Array<() => void> = [];
  let disposed = false;

  const run = () => {
    if (disposed) return;

    if (typeof effectCleanup === "function") {
      effectCleanup();
    }

    for (const cleanup of dependencyCleanups) {
      cleanup();
    }

    dependencyCleanups = [];

    const previousCollector = activeSignalCollector;
    const dependencies = new Set<Signal<unknown>>();
    activeSignalCollector = dependencies;

    try {
      effectCleanup = callback();
    } finally {
      activeSignalCollector = previousCollector;
    }

    dependencyCleanups = Array.from(dependencies).map((dependency) =>
      dependency.subscribe(run)
    );
  };

  run();

  const dispose = () => {
    disposed = true;

    if (typeof effectCleanup === "function") {
      effectCleanup();
    }

    for (const cleanup of dependencyCleanups) {
      cleanup();
    }

    dependencyCleanups = [];
  };

  owner?.cleanup(dispose);

  return dispose;
}

const isSignal = <T = unknown>(value: unknown): value is Signal<T> =>
  (typeof value === "object" || typeof value === "function") &&
  value !== null &&
  "__ce_signal" in value;

const containsSignal = (value: unknown, seen = new WeakSet<object>()): boolean => {
  if (isSignal(value)) return true;
  if (typeof value !== "object" || value === null) return false;
  if (seen.has(value)) return false;

  seen.add(value);

  if (Array.isArray(value)) {
    return value.some((item) => containsSignal(item, seen));
  }

  if (!isPlainObject(value)) return false;

  return Object.keys(value).some((key) =>
    containsSignal((value as Record<string, unknown>)[key], seen)
  );
};

type HtmlRenderContext = {
  eventHandlers: Array<EventListener>;
  signals: Array<Signal<unknown>>;
  dependencies: Set<Signal<unknown>>;
  hasUnslottedDynamic: boolean;
};

let activeHtmlRenderContext: HtmlRenderContext | null = null;

const withHtmlRenderContext = <T>(callback: () => T) => {
  const previousContext = activeHtmlRenderContext;
  const context: HtmlRenderContext = {
    eventHandlers: [],
    signals: [],
    dependencies: new Set(),
    hasUnslottedDynamic: false,
  };
  const previousSignalCollector = activeSignalCollector;

  activeHtmlRenderContext = context;
  activeSignalCollector = context.dependencies;

  try {
    return {
      value: callback(),
      context,
    };
  } finally {
    activeHtmlRenderContext = previousContext;
    activeSignalCollector = previousSignalCollector;
  }
};

const isAttributeInterpolation = (staticSegment: string) => {
  const lastOpenTag = staticSegment.lastIndexOf("<");
  const lastCloseTag = staticSegment.lastIndexOf(">");

  return lastOpenTag > lastCloseTag;
};

const getEventAttributeName = (staticSegment: string) => {
  const match = staticSegment.match(/(\s)(on[a-z][\w:-]*)\s*=\s*$/i);
  if (!match) return null;

  const attributeName = match[2].toLowerCase();
  return {
    attributeName,
    eventName: attributeName.slice(2),
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

export class CE {
  static entryPoint = "";
  static entryElement: HTMLElement | null = null;

  static routes = new Map<string, RouteDefinition>();
  static definitions = new Map<
    string,
    {
      state: Record<string, any>;
      props?: PropsDefinition;
      setup?: (this: any, context: SetupContext<any>) => Record<string, any>;
      render: (this: CEInstance<any, any>) => RenderContent | Promise<RenderContent>;
      handlers?: CEHandlers<any>;
    }
  >();
  static router = new Router();

  static async navigate(path: string) {
    await CE.router.navigate(path);
  }

  static signal<T>(value: T): Signal<T> {
    return createSignal(value);
  }

  static derived<T>(compute: () => T): Signal<T> {
    return createDerived(compute);
  }

  static effect(callback: () => EffectCleanup) {
    return effect(callback);
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
    K extends CEHandlers<T> = CEHandlers<T>,
    P extends PropsDefinition | undefined = undefined
  >(params: DefineParams<T, K, P>): void;
  static define<P extends PropsDefinition | undefined = undefined>(
    component: FunctionComponent<P>,
    options?: FunctionDefineOptions<P>
  ): void;
  static define<
    T extends Record<string, any>,
    K extends CEHandlers<T> = CEHandlers<T>,
    P extends PropsDefinition | undefined = undefined
  >(
    paramsOrComponent: DefineParams<T, K, P> | FunctionComponent<P>,
    options: FunctionDefineOptions<P> = {}
  ) {
    const params = (
      typeof paramsOrComponent === "function"
        ? CE.createFunctionDefineParams(paramsOrComponent, options)
        : paramsOrComponent
    ) as DefineParams<T, K, P>;
    const {
      name,
      state,
      props: propDefinitions,
      route,
      preload,
      onError,
      render,
      setup,
      handlers,
      onConnect = () => {},
      onDisconnect = () => {},
      onAdopt = () => {},
      onAttributeChange = () => {},
    } = params;
    const reservedKeys = new Set([
      "name",
      "state",
      "props",
      "route",
      "preload",
      "onError",
      "render",
      "setup",
      "handlers",
      "onConnect",
      "onDisconnect",
      "onAdopt",
      "onAttributeChange",
    ]);
    const componentMethods = Object.entries(params).filter(
      ([key, value]) => !reservedKeys.has(key) && typeof value === "function"
    ) as Array<[string, Function]>;

    CE.definitions.set(name, {
      state,
      props: propDefinitions,
      setup: setup as ((this: any, context: SetupContext<any>) => Record<string, any>) | undefined,
      render,
      handlers,
    });

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
      private _state: T;
      private readonly componentId = CE.createInstanceId();
      private renderToken = 0;
      private bindingMap = new Map<string, Set<HTMLElement>>();
      private delegatedHandlers = new Map<
        string,
        { eventName: string; listener: EventListener }
      >();
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
      private pendingStateKeys = new Set<string>();
      private stateUpdateQueued = false;
      private lastHtmlContext: HtmlRenderContext | null = null;
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
      private setupInitialized = false;

      constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._state = this.createReactiveState(cloneState(state)) as T;

        for (const [methodName, method] of componentMethods) {
          Object.defineProperty(this, methodName, {
            configurable: true,
            value: method.bind(this),
          });
        }
      }

      connectedCallback() {
        this.initializeSetup();
        void this.renderComponent();
        onConnect.call(this as CEInstance<T, K>);
        for (const callback of this.lifecycleConnectedCallbacks) {
          callback();
        }
      }

      disconnectedCallback() {
        this.cleanupEventHandlers();
        onDisconnect.call(this as CEInstance<T, K>);
        for (const callback of this.lifecycleCleanupCallbacks) {
          callback();
        }
      }

      adoptedCallback() {
        onAdopt.call(this as CEInstance<T, K>);
        for (const callback of this.lifecycleAdoptedCallbacks) {
          callback();
        }
      }

      attributeChangedCallback(
        attrName: string,
        oldValue: string | null,
        newValue: string | null
      ) {
        this.updatePropSignal(attrName);
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

      static get observedAttributes() {
        return Object.keys(propDefinitions ?? {}).map(getPropAttributeName);
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

      private initializeSetup() {
        if (this.setupInitialized) return;

        this.setupInitialized = true;

        if (!setup) return;

        const previousOwner = activeLifecycleOwner;
        activeLifecycleOwner = this.lifecycle;

        let setupResult: Record<string, any> | undefined;
        try {
          setupResult = setup.call(this as CEInstance<T, K>, {
            props: this.props,
            signal: CE.signal,
            derived: CE.derived,
          });
        } finally {
          activeLifecycleOwner = previousOwner;
        }

        for (const [key, value] of Object.entries(setupResult ?? {})) {
          Object.defineProperty(this, key, {
            configurable: true,
            value:
              typeof value === "function" && !isSignal(value)
                ? value.bind(this)
                : value,
          });
        }
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
        Object.assign(this._state, newState);
        this.flushStateUpdates();
      }

      private createReactiveState(value: unknown, rootKey?: string): unknown {
        if (typeof value !== "object" || value === null) {
          return value;
        }

        if (!Array.isArray(value) && !isPlainObject(value)) {
          return value;
        }

        const target = value as Record<PropertyKey, unknown>;

        for (const key of Object.keys(target)) {
          target[key] = this.createReactiveState(target[key], String(rootKey ?? key));
        }

        return new Proxy(target, {
          set: (stateTarget, property, nextValue) => {
            const previousValue = stateTarget[property];
            if (Object.is(previousValue, nextValue)) return true;

            stateTarget[property] = this.createReactiveState(
              nextValue,
              String(rootKey ?? property)
            );
            this.queueStateUpdate(String(rootKey ?? property));

            return true;
          },
          deleteProperty: (stateTarget, property) => {
            if (!(property in stateTarget)) return true;

            delete stateTarget[property];
            this.queueStateUpdate(String(rootKey ?? property));

            return true;
          },
        });
      }

      private queueStateUpdate(key: string) {
        this.pendingStateKeys.add(key);
        if (this.stateUpdateQueued) return;

        this.stateUpdateQueued = true;

        queueMicrotask(() => {
          this.stateUpdateQueued = false;
          const keys = Array.from(this.pendingStateKeys);
          this.pendingStateKeys.clear();
          this.applyStateUpdate(keys);
        });
      }

      private flushStateUpdates() {
        if (this.pendingStateKeys.size === 0) return;

        this.stateUpdateQueued = false;
        const keys = Array.from(this.pendingStateKeys);
        this.pendingStateKeys.clear();
        this.applyStateUpdate(keys);
      }

      private applyStateUpdate(keys: string[]) {
        let needsRender = false;

        for (const key of keys) {
          const nodes = this.bindingMap.get(String(key));
          if (!nodes || nodes.size === 0) {
            needsRender = true;
            continue;
          }

          for (const node of Array.from(nodes)) {
            node.textContent = String(this._state[key as keyof T] ?? "");
          }
        }

        if (needsRender) {
          void this.patchDynamicRender();
        }
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
            handler.call(this as CEInstance<T, K>, event);
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
        for (const cleanup of this.signalCleanups) {
          cleanup();
        }

        this.signalCleanups = [];
      }

      private cleanupRenderDependencies() {
        for (const cleanup of this.renderDependencyCleanups) {
          cleanup();
        }

        this.renderDependencyCleanups = [];
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
        this.cleanupInlineEventHandlers();
        this.cleanupSignalBindings();
        this.cleanupRenderDependencies();
      }

      private setLoadingState() {
        if (!this.shadowRoot) return;
        this.shadowRoot.innerHTML = "<span>Loading...</span>";
      }

      private async renderComponent() {
        const token = ++this.renderToken;
        const rendered = withHtmlRenderContext(() =>
          render.call(this as CEInstance<T, K>)
        );
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
        this.indexBindings();
        this.registerEventHandlers(handlers);
        this.registerInlineEventHandlers(rendered.context.eventHandlers);
        this.registerSignalBindings(rendered.context.signals);
        this.registerRenderDependencies(rendered.context.dependencies);
      }

      private async patchDynamicRender() {
        if (
          !this.shadowRoot ||
          !this.lastHtmlContext ||
          this.lastHtmlContext.hasUnslottedDynamic
        ) {
          await this.renderComponent();
          return;
        }

        const token = ++this.renderToken;
        const rendered = withHtmlRenderContext(() =>
          render.call(this as CEInstance<T, K>)
        );
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
        this.indexBindings();
        this.registerEventHandlers(handlers);
        this.registerInlineEventHandlers(rendered.context.eventHandlers);
        this.registerSignalBindings(rendered.context.signals);
        this.registerRenderDependencies(rendered.context.dependencies);
      }
    }

    customElements.define(name, CEElement);
  }

  private static createFunctionDefineParams<P extends PropsDefinition | undefined>(
    component: FunctionComponent<P>,
    options: FunctionDefineOptions<P>
  ): DefineParams<Record<string, never>, CEHandlers<Record<string, never>>, P> {
    return {
      name: inferComponentName(component),
      state: {},
      props: options.props,
      route: options.route,
      preload: options.preload,
      onError: options.onError,
      render() {
        if (!this.__ceFunctionRender) {
          const previousOwner = activeLifecycleOwner;
          activeLifecycleOwner = this.lifecycle;

          try {
            const result = component({
              props: this.props as InferProps<P>,
              host: this,
              lifecycle: this.lifecycle,
            });

            this.__ceFunctionRender =
              typeof result === "function"
                ? result
                : () => result as RenderContent | Promise<RenderContent>;
          } finally {
            activeLifecycleOwner = previousOwner;
          }
        }

        return this.__ceFunctionRender();
      },
    };
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
    props?: PropsDefinition;
    setup?: (this: any, context: SetupContext<any>) => Record<string, any>;
    render: (this: any) => RenderContent | Promise<RenderContent>;
    handlers?: CEHandlers<any>;
  }) {
    const stateCopy = cloneState(definition.state);
    const componentId = CE.createInstanceId();
    const props = Object.fromEntries(
      Object.keys(definition.props ?? {}).map((key) => [key, undefined])
    );

    const context = {
      state: stateCopy,
      props,
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

    const setupResult = definition.setup?.call(context, {
      props,
      signal: CE.signal,
      derived: CE.derived,
    });

    Object.assign(context, setupResult);

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
  ...values: Array<HtmlValue<T>>
): string {
  return strings.reduce((result, str, index) => {
    return result + renderHtmlValue(str, values[index]);
  }, "");
}

const renderHtmlValue = <T>(staticSegment: string, value: HtmlValue<T>): string => {
  if (value === undefined || value === null) return staticSegment;

  if (Array.isArray(value)) {
    if (isAttributeInterpolation(staticSegment)) {
      if (activeHtmlRenderContext) {
        activeHtmlRenderContext.hasUnslottedDynamic = true;
      }

      return staticSegment + value.map(renderHtmlArrayItem).join("");
    }

    return staticSegment + value.map(renderHtmlArrayItem).join("");
  }

  if (isSignal(value)) {
    const signalValue = peekSignal(value);

    if (!activeHtmlRenderContext) {
      return staticSegment + String(signalValue ?? "");
    }

    const signalIndex = activeHtmlRenderContext.signals.push(value) - 1;
    const attribute = getDynamicAttributeName(staticSegment);

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

    const eventIndex = activeHtmlRenderContext.eventHandlers.push(value) - 1;

    return (
      eventAttribute.staticPrefix +
      `data-ce-event="${eventIndex}:${eventAttribute.eventName}"`
    );
  }

  if (isBindToken<T>(value)) {
    return (
      staticSegment +
      `<span data-ce-bind data-ce-owner="${value.ownerId}" data-ce-key="${String(value.key)}">${String(value.content)}</span>`
    );
  }

  if (isAttributeInterpolation(staticSegment)) {
    if (activeHtmlRenderContext) {
      activeHtmlRenderContext.hasUnslottedDynamic = true;
    }

    return staticSegment + String(value);
  }

  return staticSegment + `<span data-ce-slot>${String(value)}</span>`;
};

const renderHtmlArrayItem = <T>(value: HtmlValue<T>): string => {
  if (typeof value === "string") return value;

  return renderHtmlValue("", value);
};

export function match<T>(value: T) {
  return {
    when<R>(
      predicate: MatchPredicate<T>,
      handler: MatchHandler<T, R>
    ) {
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
  when(
    predicate: MatchPredicate<T>,
    handler: MatchHandler<T, R>
  ) {
    if (predicate(value)) {
      return createMatchedResult(handler(value));
    }

    return createMatchBuilder<T, R>(value);
  },
  otherwise(handler: MatchHandler<T, R>) {
    return handler(value);
  },
});
