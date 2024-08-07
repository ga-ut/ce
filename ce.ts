type CustomElementInstance<T> = {
  state: T;
  setState: (newState: Partial<T>) => void;
  getBindState: (key: keyof T) => { key: string; content: T };
};

export class CE {
  static define<T>(params: {
    name: string;
    state: T;
    connectedCallback?: () => void;
    disconnectedCallback?: () => void;
    adoptedCallback?: () => void;
    attributeChangedCallback?: (
      name: string,
      oldValue: any,
      newValue: any
    ) => void;
    render: (this: CustomElementInstance<T>) => string;
    [key: string]: any;
  }) {
    const {
      name,
      state,
      connectedCallback = () => {},
      disconnectedCallback = () => {},
      adoptedCallback = () => {},
      attributeChangedCallback = () => {},
      render,
      ...rest
    } = params;

    const observedAttributes = Object.keys(state) as Array<keyof T>;

    customElements.define(
      name,
      class extends HTMLElement {
        static observedAttributes = observedAttributes;

        private _state: T = state;

        constructor() {
          super();
          this.attachShadow({ mode: "open" });
        }

        connectedCallback() {
          this.render();
          connectedCallback.call(this);
        }

        disconnectedCallback() {
          disconnectedCallback.call(this);
        }

        adoptedCallback() {
          adoptedCallback.call(this);
        }

        attributeChangedCallback(name: string, oldValue: any, newValue: any) {
          attributeChangedCallback.call(this, name, oldValue, newValue);
        }

        getBindState(key: keyof T) {
          return {
            key,
            content: this._state[key],
          };
        }

        setState(newState: Partial<T>) {
          const changedAttributes: (keyof T)[] = [];
          this._state = { ...this._state, ...newState };

          for (const key in newState) {
            if (
              newState.hasOwnProperty(key) &&
              this.constructor["observedAttributes"].includes(key)
            ) {
              changedAttributes.push(key);
            }
          }

          if (changedAttributes.length > 0) {
            this.notify(changedAttributes);
          }
        }

        get state(): T {
          return this._state;
        }

        private render() {
          const content = render.call(this);
          this.shadowRoot!.innerHTML = content;
          this.registerEventHandlers(rest);
        }

        private notify(changedAttributes: (keyof T)[]) {
          for (const key of changedAttributes) {
            const elements = this.shadowRoot?.querySelectorAll(
              `[${String(key)}]`
            );

            elements.forEach((element) => {
              const newValue = this._state[key];
              element.textContent = String(newValue);
            });
          }
        }

        private registerEventHandlers(eventHandlers: {
          [key: string]: () => void;
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

export function html<T>(
  strings: TemplateStringsArray,
  ...values: (string | { key: string; content: T })[]
): string {
  return strings.reduce((result: string, str: string, index: number) => {
    const value = values[index];

    const attribute = value && typeof value === "object" ? value.key : "";
    const content = value && typeof value === "object" ? value.content : value;

    return (
      result +
      str +
      (content !== undefined ? `<span ${attribute}>${content}</span>` : "")
    );
  }, "");
}
