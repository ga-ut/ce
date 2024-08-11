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

export class CE {
  static entryPoint: string;

  static setEntryPoint = (entryPoint: string) => {
    this.entryPoint = entryPoint;
    const root = document.createElement(entryPoint);
    document.body.append(root);
  };

  static listeners = new Map();

  static define<
    T,
    K extends { [key: string]: (this: CEInstance<T, K>) => void }
  >(params: {
    name: string;
    state: T;
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
      onConnect = () => {},
      onDisconnect = () => {},
      onAdopt = () => {},
      onAttributeChange = () => {},
      render,
      handlers,
    } = params;

    customElements.define(
      name,
      class extends HTMLElement {
        private _state: T = state;

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

        mapping(){
          const objectId = this.getAttribute('render-object-id');
          const attributes = this.getAttributeNames();
          const state = Address.getObj(objectId);

          attributes.forEach((attribute) => {
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
              arr.forEach((a: any) => a.render())
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

        private notify(changedAttributes: (keyof T)[]) {
          for (const key of changedAttributes) {
            const root = document.querySelector(CE.entryPoint).shadowRoot;

            const elements = root?.querySelectorAll(`[${String(key)}]`);

            elements.forEach((element) => {
              const newValue = this._state[key];
              element.textContent = String(newValue);
            });
          }
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
    const objectId = value && typeof value === 'object' ? Address.getAddress(value.state) : "";

    return (
      result +
      str +
      (typeof value === "object"
        ? `<render-value render-object-id=${objectId} ${attribute}>${value.content}</render-value>`
        : value)
    );
  }, "");
}

class Address{
  static id = 0;

  static address = new Map();
  static idToObj = new Map();

  static getAddress(obj: object){
    const address = this.address.get(obj);

    if(!address){
      this.address.set(obj, String(this.id));
      this.idToObj.set(String(this.id), obj);
      this.id += 1;
    }

    return this.address.get(obj);
  }

  static getObj(id: string){
    return this.idToObj.get(id);
  }
}