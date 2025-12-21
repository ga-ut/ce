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

type BoundNode = {
  stateObj: object;
  key: string;
  node: HTMLElement;
};

type TrustedValue = { __trusted: string };

const TRUSTED_MARK = "__trusted";

function sanitizeText(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function isTrustedValue(value: unknown): value is TrustedValue {
  return Boolean(value) && typeof value === "object" && TRUSTED_MARK in (value as object);
}

export function trustedHTML(value: string): TrustedValue {
  return { __trusted: value };
}

type SlotDescriptor =
  | { type: "text"; value: string }
  | { type: "trusted"; value: string }
  | {
      type: "binding";
      key: string;
      address: string;
      stateObj: object;
      value: string;
    };

class TemplateResult {
  private template: HTMLTemplateElement;
  private slots: SlotDescriptor[] = [];

  constructor(strings: TemplateStringsArray, values: unknown[]) {
    let html = "";

    strings.forEach((str, index) => {
      html += str;
      const value = values[index];

      if (index >= values.length) return;

      const slotId = this.slots.length;

      if (value && typeof value === "object" && "key" in value && "state" in value) {
        const attribute = (value as any).key;
        const address = Address.getAddress((value as any).state);
        this.slots.push({
          type: "binding",
          key: attribute,
          address,
          stateObj: (value as any).state,
          value: sanitizeText((value as any).content),
        });
        html += `<span data-ce-slot="${slotId}" data-ce-bind-key="${attribute}" data-ce-bind-addr="${address}"></span>`;
      } else if (isTrustedValue(value)) {
        this.slots.push({ type: "trusted", value: value.__trusted });
        html += `<span data-ce-slot="${slotId}"></span>`;
      } else {
        this.slots.push({ type: "text", value: sanitizeText(value) });
        html += `<span data-ce-slot="${slotId}"></span>`;
      }
    });

    this.template = document.createElement("template");
    this.template.innerHTML = html;
  }

  renderInto(root: ShadowRoot, options: { hydrate?: boolean } = {}): BoundNode[] {
    const hydrate = options.hydrate ?? false;
    const boundNodes: BoundNode[] = [];

    if (hydrate && root.childNodes.length) {
      const targets = root.querySelectorAll<HTMLElement>("[data-ce-slot]");
      this.processTargets(targets, boundNodes);
      return boundNodes;
    }

    const fragment = this.template.content.cloneNode(true) as DocumentFragment;
    const targets = fragment.querySelectorAll<HTMLElement>("[data-ce-slot]");
    this.processTargets(targets, boundNodes);
    root.replaceChildren(fragment);
    return boundNodes;
  }

  private processTargets(targets: NodeListOf<HTMLElement>, boundNodes: BoundNode[]) {
    targets.forEach((target) => {
      const slotId = Number(target.dataset.ceSlot ?? "-1");
      const descriptor = this.slots[slotId];
      if (!descriptor) return;

      switch (descriptor.type) {
        case "trusted":
          target.innerHTML = descriptor.value;
          break;
        case "text":
          target.textContent = descriptor.value;
          break;
        case "binding":
          target.dataset.ceBindKey = descriptor.key;
          target.dataset.ceBindAddr = descriptor.address;
          target.textContent = descriptor.value;
          boundNodes.push({
            stateObj: descriptor.stateObj,
            key: descriptor.key,
            node: target,
          });
          break;
      }
    });
  }
}

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

  static listeners = new Map<object, Map<string, Set<HTMLElement>>>();

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
    render: (this: CEInstance<T, K>) => TemplateResult;
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
      render,
      handlers,
    } = params;

    if (route) {
      CE.routes.set(route, name);
    }

    customElements.define(
      name,
      class extends HTMLElement {
        private _state: T = state;
        private boundNodes: BoundNode[] = [];

        constructor() {
          super();
          this.attachShadow({ mode: "open" });
        }

        connectedCallback() {
          this.render();
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

        bind(key: keyof T) {
          return {
            key,
            content: this._state[key],
            state,
          };
        }

        setState(newState: Partial<T>) {
          Object.assign(this._state, newState);
          const listener = CE.listeners.get(this._state) ?? new Map();

          for (const key in newState) {
            const nodes = listener.get(key) as Set<HTMLElement> | undefined;
            if (nodes) {
              nodes.forEach((node) => {
                node.textContent = sanitizeText((this._state as any)[key]);
              });
            }
          }
        }

        get state(): T {
          return this._state;
        }

        private render() {
          const template = render.call(this);
          if (template instanceof TemplateResult) {
            this.unregisterBindings();
            const boundNodes = template.renderInto(this.shadowRoot as ShadowRoot, {
              hydrate: (this.shadowRoot as ShadowRoot).childNodes.length > 0,
            });
            this.boundNodes = boundNodes;
            this.registerBindings(boundNodes);
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
              targetElements?.forEach((targetElement) => {
                const eventName = targetElement.getAttribute(handlerName);
                targetElement.addEventListener(eventName, handler.bind(this));
              });
            }
          }
        }

        private unregisterBindings() {
          this.boundNodes.forEach(({ stateObj, key, node }) => {
            const map = CE.listeners.get(stateObj);
            const targets = map?.get(key);
            targets?.delete(node);

            if (targets && targets.size === 0) {
              map?.delete(key);
            }

            if (map && map.size === 0) {
              CE.listeners.delete(stateObj);
            }
          });
          this.boundNodes = [];
        }

        private registerBindings(boundNodes: BoundNode[]) {
          boundNodes.forEach(({ stateObj, key, node }) => {
            const map = CE.listeners.get(stateObj) ?? new Map();
            const nodes = map.get(key) ?? new Set<HTMLElement>();
            nodes.add(node);
            map.set(key, nodes);
            CE.listeners.set(stateObj, map);
          });
        }
      }
    );
  }
}

export function html<T>(
  strings: TemplateStringsArray,
  ...values: (
    | string
    | number
    | TrustedValue
    | { key: string; content: T; state: { [key: string]: T } }
  )[]
) {
  return new TemplateResult(strings, values);
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
