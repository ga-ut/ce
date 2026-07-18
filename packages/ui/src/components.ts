import { define, effect, html } from "@ga-ut/ce/web";

import { gaUiStyles } from "./styles";

type Lifecycle = {
  connected: (callback: () => void) => void;
  cleanup: (callback: () => void) => void;
};

const enumValue = <T extends string>(
  value: string | null | undefined,
  allowed: readonly T[],
  fallback: T
): T => (allowed.includes(value as T) ? (value as T) : fallback);

const hostHas = (host: HTMLElement, name: string) => host.hasAttribute(name);

const hostValue = (host: HTMLElement, name: string) =>
  host.getAttribute(name) ?? undefined;

const observeAttributes = (
  host: HTMLElement,
  lifecycle: Lifecycle,
  attributeFilter: string[],
  sync: () => void
) => {
  let observer: MutationObserver | undefined;

  lifecycle.connected(() => {
    sync();
    const Observer = host.ownerDocument?.defaultView?.MutationObserver;
    if (!Observer) return;

    observer?.disconnect();
    observer = new Observer(sync);
    observer.observe(host, { attributes: true, attributeFilter });
  });

  lifecycle.cleanup(() => {
    observer?.disconnect();
    observer = undefined;
  });
};

const listenInShadow = (
  host: HTMLElement,
  lifecycle: Lifecycle,
  eventName: string,
  listener: EventListener
) => {
  let root: ShadowRoot | null = null;

  lifecycle.connected(() => {
    root = host.shadowRoot;
    root?.addEventListener(eventName, listener);
  });

  lifecycle.cleanup(() => {
    root?.removeEventListener(eventName, listener);
    root = null;
  });
};

const dispatchGaEvent = <T>(
  host: HTMLElement,
  name: string,
  detail: T,
  options: { cancelable?: boolean } = {}
) => {
  const EventConstructor = host.ownerDocument?.defaultView?.CustomEvent;
  if (!EventConstructor) return true;

  return host.dispatchEvent(
    new EventConstructor(name, {
      bubbles: true,
      composed: true,
      cancelable: options.cancelable ?? false,
      detail,
    })
  );
};

const gaButtonStyles = `
:host {
  display: inline-flex;
  vertical-align: middle;
}

.button {
  align-items: center;
  border: 1px solid transparent;
  border-radius: var(--ga-radius-sm);
  cursor: pointer;
  display: inline-flex;
  font-weight: var(--ga-font-weight-semibold);
  gap: var(--ga-space-2);
  justify-content: center;
  letter-spacing: -0.012em;
  outline: none;
  position: relative;
  transition: background-color var(--ga-duration-base) var(--ga-ease-out),
    border-color var(--ga-duration-base) var(--ga-ease-out),
    box-shadow var(--ga-duration-base) var(--ga-ease-out),
    color var(--ga-duration-base) var(--ga-ease-out),
    transform var(--ga-duration-fast) var(--ga-ease-out);
  user-select: none;
  white-space: nowrap;
}

.button[data-size="sm"] {
  height: 2rem;
  padding: 0 var(--ga-space-3);
  font-size: var(--ga-font-size-xs);
}

.button[data-size="md"] {
  height: 2.5rem;
  padding: 0 0.95rem;
  font-size: var(--ga-font-size-sm);
}

.button[data-size="lg"] {
  height: 3rem;
  padding: 0 var(--ga-space-5);
  font-size: var(--ga-font-size-md);
}

.button[data-variant="primary"] {
  background: var(--ga-surface-accent);
  box-shadow: var(--ga-shadow-xs);
  color: var(--ga-text-inverse);
}

.button[data-variant="primary"]:not(:disabled):hover {
  background: var(--ga-surface-accent-hover);
  box-shadow: var(--ga-shadow-sm);
  transform: translateY(-1px);
}

.button[data-variant="outline"] {
  background: var(--ga-surface-raised);
  border-color: color-mix(in srgb, var(--ga-color-accent) 58%, var(--ga-border-subtle));
  box-shadow: var(--ga-shadow-xs);
  color: var(--ga-text-accent);
}

.button[data-variant="outline"]:not(:disabled):hover {
  background: color-mix(in srgb, var(--ga-color-accent) 8%, var(--ga-surface-raised));
  border-color: var(--ga-color-accent);
}

.button[data-variant="ghost"] {
  background: transparent;
  color: var(--ga-text-primary);
}

.button[data-variant="ghost"]:not(:disabled):hover {
  background: var(--ga-surface-subtle);
}

.button:focus-visible {
  box-shadow: var(--ga-shadow-focus);
}

.button:not(:disabled):active {
  transform: translateY(0) scale(0.985);
}

.button:disabled {
  cursor: not-allowed;
  opacity: 0.52;
}

.spinner {
  animation: ga-button-spin 700ms linear infinite;
  border: 1.5px solid currentColor;
  border-right-color: transparent;
  border-radius: var(--ga-radius-round);
  display: none;
  height: 0.9em;
  opacity: 0.82;
  width: 0.9em;
}

.button[data-loading="true"] .spinner {
  display: inline-block;
}

@keyframes ga-button-spin {
  to { transform: rotate(360deg); }
}
`;

export const gaButtonTag = define(
  function GaButton({ props, host, lifecycle }) {
    const sync = (variant?: string, size?: string, disabled?: boolean, loading?: boolean) => {
      const button = host.shadowRoot?.querySelector<HTMLButtonElement>("button");
      if (!button) return;

      const isLoading = loading ?? hostHas(host, "loading");
      const isDisabled = disabled ?? hostHas(host, "disabled");
      button.dataset.variant = enumValue(
        variant ?? hostValue(host, "variant"),
        ["primary", "outline", "ghost"] as const,
        "primary"
      );
      button.dataset.size = enumValue(
        size ?? hostValue(host, "size"),
        ["sm", "md", "lg"] as const,
        "md"
      );
      button.dataset.loading = String(isLoading);
      button.disabled = isDisabled || isLoading;
      button.setAttribute("aria-busy", String(isLoading));
    };

    effect(() => sync(props.variant, props.size, props.disabled, props.loading));
    observeAttributes(host, lifecycle, ["variant", "size", "disabled", "loading"], () =>
      sync()
    );

    return `
      <button part="button" class="button" type="button" data-variant="primary" data-size="md" data-loading="false" aria-busy="false">
        <span class="spinner" aria-hidden="true"></span>
        <span part="label" class="label"><slot></slot></span>
      </button>
    `;
  },
  {
    props: {
      variant: String,
      size: String,
      disabled: Boolean,
      loading: Boolean,
    },
    styles: [...gaUiStyles, gaButtonStyles],
  }
);

const gaSwitchStyles = `
:host {
  display: inline-flex;
  vertical-align: middle;
}

.switch {
  align-items: center;
  background: transparent;
  border: 0;
  cursor: pointer;
  display: inline-flex;
  gap: 0.625rem;
  margin: 0;
  outline: none;
  padding: 0;
  text-align: left;
}

.track {
  background: var(--ga-border-strong);
  border: 1px solid color-mix(in srgb, var(--ga-text-primary) 10%, transparent);
  border-radius: var(--ga-radius-round);
  display: inline-flex;
  flex: 0 0 auto;
  height: 1.25rem;
  padding: 0.125rem;
  transition: background-color var(--ga-duration-base) var(--ga-ease-out),
    box-shadow var(--ga-duration-base) var(--ga-ease-out);
  width: 2.25rem;
}

.thumb {
  background: var(--ga-surface-raised);
  border-radius: var(--ga-radius-round);
  box-shadow: 0 1px 3px rgba(23, 24, 22, 0.28);
  display: block;
  height: 0.875rem;
  transform: translateX(0);
  transition: transform var(--ga-duration-base) var(--ga-ease-out);
  width: 0.875rem;
}

.switch[data-checked="true"] .track {
  background: var(--ga-surface-accent);
}

.switch[data-checked="true"] .thumb {
  transform: translateX(1rem);
}

.switch:focus-visible .track {
  box-shadow: var(--ga-shadow-focus);
}

.switch:not(:disabled):hover .track {
  filter: brightness(0.96);
}

.switch:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.label {
  color: var(--ga-text-primary);
  font-size: var(--ga-font-size-sm);
  font-weight: var(--ga-font-weight-medium);
  line-height: var(--ga-line-tight);
}
`;

export const gaSwitchTag = define(
  function GaSwitch({ props, host, lifecycle }) {
    const sync = (checked?: boolean, disabled?: boolean) => {
      const button = host.shadowRoot?.querySelector<HTMLButtonElement>("button");
      if (!button) return;

      const isChecked = checked ?? hostHas(host, "checked");
      const isDisabled = disabled ?? hostHas(host, "disabled");
      button.dataset.checked = String(isChecked);
      button.setAttribute("aria-checked", String(isChecked));
      button.disabled = isDisabled;
    };

    effect(() => sync(props.checked, props.disabled));
    observeAttributes(host, lifecycle, ["checked", "disabled"], () => sync());
    listenInShadow(host, lifecycle, "click", () => {
      if (hostHas(host, "disabled")) return;

      const checked = !hostHas(host, "checked");
      host.toggleAttribute("checked", checked);
      sync(checked, false);
      dispatchGaEvent(host, "ga-change", { checked });
    });

    return `
      <button part="switch" class="switch" type="button" role="switch" aria-checked="false" data-checked="false">
        <span part="track" class="track" aria-hidden="true"><span part="thumb" class="thumb"></span></span>
        <span part="label" class="label"><slot></slot></span>
      </button>
    `;
  },
  {
    props: {
      checked: Boolean,
      disabled: Boolean,
    },
    styles: [...gaUiStyles, gaSwitchStyles],
  }
);

const gaTextFieldStyles = `
:host {
  display: inline-block;
  width: 15rem;
  max-width: 100%;
  vertical-align: middle;
}

.field {
  display: grid;
  gap: 0.4375rem;
}

.label {
  color: var(--ga-text-primary);
  font-size: var(--ga-font-size-xs);
  font-weight: var(--ga-font-weight-semibold);
  letter-spacing: -0.006em;
  line-height: var(--ga-line-tight);
}

.label[data-empty="true"] {
  display: none;
}

.control {
  align-items: center;
  background: var(--ga-surface-raised);
  border: 1px solid var(--ga-border-subtle);
  border-radius: var(--ga-radius-sm);
  box-shadow: var(--ga-shadow-xs);
  display: flex;
  min-height: 2.625rem;
  padding: 0 0.75rem;
  transition: background-color var(--ga-duration-base) var(--ga-ease-out),
    border-color var(--ga-duration-base) var(--ga-ease-out),
    box-shadow var(--ga-duration-base) var(--ga-ease-out);
}

.control:focus-within {
  border-color: var(--ga-color-focus);
  box-shadow: var(--ga-shadow-focus);
}

.control[data-invalid="true"] {
  border-color: var(--ga-danger);
}

.control[data-invalid="true"]:focus-within {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ga-danger) 28%, transparent);
}

.input {
  background: transparent;
  border: 0;
  color: var(--ga-text-primary);
  flex: 1;
  font-size: var(--ga-font-size-sm);
  line-height: 1;
  min-width: 0;
  outline: none;
  padding: 0;
  width: 100%;
}

.input::placeholder {
  color: var(--ga-text-tertiary);
  opacity: 1;
}

.invalid-mark {
  align-items: center;
  background: var(--ga-danger-surface);
  border-radius: var(--ga-radius-round);
  color: var(--ga-danger);
  display: none;
  flex: 0 0 auto;
  font-size: 0.6875rem;
  font-weight: var(--ga-font-weight-bold);
  height: 1rem;
  justify-content: center;
  margin-left: var(--ga-space-2);
  width: 1rem;
}

.control[data-invalid="true"] .invalid-mark {
  display: inline-flex;
}

.control[data-disabled="true"] {
  background: var(--ga-surface-subtle);
  opacity: 0.58;
}
`;

export const gaTextFieldTag = define(
  function GaTextField({ props, host, lifecycle }) {
    const sync = (state?: {
      label?: string;
      value?: string;
      placeholder?: string;
      disabled?: boolean;
      invalid?: boolean;
    }) => {
      const input = host.shadowRoot?.querySelector<HTMLInputElement>("input");
      const label = host.shadowRoot?.querySelector<HTMLElement>("[part='label']");
      const control = host.shadowRoot?.querySelector<HTMLElement>(".control");
      if (!input || !label || !control) return;

      const labelText = state?.label ?? hostValue(host, "label") ?? "";
      const placeholder = state?.placeholder ?? hostValue(host, "placeholder") ?? "";
      const disabled = state?.disabled ?? hostHas(host, "disabled");
      const invalid = state?.invalid ?? hostHas(host, "invalid");
      const value = state?.value ?? hostValue(host, "value") ?? "";

      label.textContent = labelText;
      label.dataset.empty = String(!labelText);
      if (input.value !== value) input.value = value;
      input.placeholder = placeholder;
      input.disabled = disabled;
      input.setAttribute("aria-invalid", String(invalid));
      input.setAttribute("aria-label", labelText || placeholder || "Text field");
      control.dataset.disabled = String(disabled);
      control.dataset.invalid = String(invalid);
    };

    effect(() =>
      sync({
        label: props.label,
        value: props.value,
        placeholder: props.placeholder,
        disabled: props.disabled,
        invalid: props.invalid,
      })
    );
    observeAttributes(
      host,
      lifecycle,
      ["label", "value", "placeholder", "disabled", "invalid"],
      () => sync()
    );
    listenInShadow(host, lifecycle, "input", (event) => {
      const input = event.target as HTMLInputElement;
      if (!input.matches("input")) return;

      host.setAttribute("value", input.value);
      dispatchGaEvent(host, "ga-input", { value: input.value });
    });
    listenInShadow(host, lifecycle, "change", (event) => {
      const input = event.target as HTMLInputElement;
      if (!input.matches("input")) return;

      host.setAttribute("value", input.value);
      dispatchGaEvent(host, "ga-change", { value: input.value });
    });

    return `
      <label part="field" class="field">
        <span part="label" class="label" data-empty="true"></span>
        <span part="control" class="control" data-disabled="false" data-invalid="false">
          <input part="input" class="input" type="text" aria-invalid="false" />
          <span class="invalid-mark" aria-hidden="true">!</span>
        </span>
      </label>
    `;
  },
  {
    props: {
      label: String,
      value: String,
      placeholder: String,
      disabled: Boolean,
      invalid: Boolean,
    },
    styles: [...gaUiStyles, gaTextFieldStyles],
  }
);

const gaBadgeStyles = `
:host {
  display: inline-flex;
  vertical-align: middle;
}

.badge {
  align-items: center;
  background: var(--ga-neutral-surface);
  border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
  border-radius: var(--ga-radius-round);
  color: var(--ga-neutral);
  display: inline-flex;
  font-size: 0.6875rem;
  font-weight: var(--ga-font-weight-semibold);
  gap: 0.375rem;
  letter-spacing: 0.01em;
  line-height: 1;
  min-height: 1.5rem;
  padding: 0 0.5625rem;
  white-space: nowrap;
}

.dot {
  background: currentColor;
  border-radius: var(--ga-radius-round);
  height: 0.375rem;
  opacity: 0.85;
  width: 0.375rem;
}

.badge[data-tone="success"] { background: var(--ga-success-surface); color: var(--ga-success); }
.badge[data-tone="warning"] { background: var(--ga-warning-surface); color: var(--ga-warning); }
.badge[data-tone="danger"] { background: var(--ga-danger-surface); color: var(--ga-danger); }
`;

export const gaBadgeTag = define(
  function GaBadge({ props, host, lifecycle }) {
    const sync = (tone?: string) => {
      const badge = host.shadowRoot?.querySelector<HTMLElement>("[part='badge']");
      if (!badge) return;
      badge.dataset.tone = enumValue(
        tone ?? hostValue(host, "tone"),
        ["success", "warning", "danger", "neutral"] as const,
        "neutral"
      );
    };

    effect(() => sync(props.tone));
    observeAttributes(host, lifecycle, ["tone"], () => sync());

    return `
      <span part="badge" class="badge" data-tone="neutral">
        <span class="dot" aria-hidden="true"></span><slot></slot>
      </span>
    `;
  },
  {
    props: { tone: String },
    styles: [...gaUiStyles, gaBadgeStyles],
  }
);

const gaFeedbackStyles = `
:host {
  display: block;
}

.feedback {
  align-items: start;
  background: var(--ga-neutral-surface);
  border: 1px solid color-mix(in srgb, var(--ga-neutral) 20%, var(--ga-border-subtle));
  border-radius: var(--ga-radius-sm);
  color: var(--ga-text-primary);
  display: grid;
  gap: var(--ga-space-3);
  grid-template-columns: auto minmax(0, 1fr) auto;
  padding: 0.875rem var(--ga-space-4);
}

.signal {
  color: var(--ga-neutral);
  display: block;
  height: 1.25rem;
  margin-top: 0.0625rem;
  width: 1.25rem;
}

.tone-icon {
  display: none;
  height: 100%;
  overflow: visible;
  width: 100%;
}

.feedback[data-tone="neutral"] .tone-neutral,
.feedback[data-tone="success"] .tone-success,
.feedback[data-tone="warning"] .tone-warning,
.feedback[data-tone="danger"] .tone-danger {
  display: block;
}

.copy {
  min-width: 0;
}

.title {
  display: block;
  font-size: var(--ga-font-size-sm);
  font-weight: var(--ga-font-weight-semibold);
  letter-spacing: -0.01em;
  line-height: var(--ga-line-tight);
  margin-bottom: 0.25rem;
}

.title[data-empty="true"] {
  display: none;
}

.content {
  color: var(--ga-text-secondary);
  font-size: var(--ga-font-size-sm);
  line-height: var(--ga-line-normal);
}

.dismiss {
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: var(--ga-radius-sm);
  color: var(--ga-text-secondary);
  cursor: pointer;
  display: inline-flex;
  height: 1.75rem;
  justify-content: center;
  margin: -0.25rem -0.375rem 0 0;
  outline: none;
  padding: 0;
  transition: background-color var(--ga-duration-fast) var(--ga-ease-out),
    color var(--ga-duration-fast) var(--ga-ease-out);
  width: 1.75rem;
}

.dismiss:hover {
  background: color-mix(in srgb, currentColor 10%, transparent);
  color: var(--ga-text-primary);
}

.dismiss:focus-visible {
  box-shadow: var(--ga-shadow-focus);
}

.dismiss svg {
  height: 0.875rem;
  pointer-events: none;
  width: 0.875rem;
}

.feedback[data-tone="success"] { background: var(--ga-success-surface); border-color: color-mix(in srgb, var(--ga-success) 24%, var(--ga-border-subtle)); }
.feedback[data-tone="success"] .signal { color: var(--ga-success); }
.feedback[data-tone="warning"] { background: var(--ga-warning-surface); border-color: color-mix(in srgb, var(--ga-warning) 24%, var(--ga-border-subtle)); }
.feedback[data-tone="warning"] .signal { color: var(--ga-warning); }
.feedback[data-tone="danger"] { background: var(--ga-danger-surface); border-color: color-mix(in srgb, var(--ga-danger) 24%, var(--ga-border-subtle)); }
.feedback[data-tone="danger"] .signal { color: var(--ga-danger); }
`;

export const gaFeedbackTag = define(
  function GaFeedback({ props, host, lifecycle }) {
    const sync = (tone?: string, title?: string, dismiss?: boolean) => {
      const feedback = host.shadowRoot?.querySelector<HTMLElement>("[part='feedback']");
      const titleElement = host.shadowRoot?.querySelector<HTMLElement>("[part='title']");
      const dismissButton = host.shadowRoot?.querySelector<HTMLButtonElement>("[part='dismiss']");
      if (!feedback || !titleElement || !dismissButton) return;

      const resolvedTone = enumValue(
        tone ?? hostValue(host, "tone"),
        ["success", "warning", "danger", "neutral"] as const,
        "neutral"
      );
      const titleText = title ?? hostValue(host, "title") ?? "";
      feedback.dataset.tone = resolvedTone;
      feedback.setAttribute("role", resolvedTone === "danger" ? "alert" : "status");
      titleElement.textContent = titleText;
      titleElement.dataset.empty = String(!titleText);
      dismissButton.hidden = !(dismiss ?? hostHas(host, "dismiss"));
    };

    effect(() => sync(props.tone, props.title, props.dismiss));
    observeAttributes(host, lifecycle, ["tone", "title", "dismiss"], () => sync());
    const dismissFeedback = (event: Event) => {
      event.stopPropagation();
      const shouldDismiss = dispatchGaEvent(host, "ga-dismiss", {}, { cancelable: true });
      if (shouldDismiss) host.setAttribute("hidden", "");
    };

    return html`
      <section part="feedback" class="feedback" data-tone="neutral" role="status">
        <span class="signal" aria-hidden="true">
          <svg class="tone-icon tone-neutral" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5"/><path d="M10 8.5v5M10 5.8h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          <svg class="tone-icon tone-success" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5"/><path d="m6.3 10.2 2.4 2.4 5.2-5.3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <svg class="tone-icon tone-warning" viewBox="0 0 20 20" fill="none"><path d="M8.6 3.6 2.5 15a1.6 1.6 0 0 0 1.4 2.4h12.2a1.6 1.6 0 0 0 1.4-2.4L11.4 3.6a1.6 1.6 0 0 0-2.8 0Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M10 7.7v4M10 14.7h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          <svg class="tone-icon tone-danger" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5"/><path d="M10 6.3v5M10 14h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        </span>
        <span class="copy">
          <span part="title" class="title" data-empty="true"></span>
          <span part="content" class="content"><slot></slot></span>
        </span>
        <button part="dismiss" class="dismiss" type="button" aria-label="Dismiss notification" hidden onclick=${dismissFeedback}>
          <svg aria-hidden="true" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        </button>
      </section>
    `;
  },
  {
    props: {
      tone: String,
      title: String,
      dismiss: Boolean,
    },
    styles: [...gaUiStyles, gaFeedbackStyles],
  }
);

const gaTabStyles = `
:host {
  display: inline-flex;
  vertical-align: middle;
}

.tab {
  align-items: center;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--ga-radius-sm);
  color: var(--ga-text-secondary);
  cursor: pointer;
  display: inline-flex;
  font-size: var(--ga-font-size-sm);
  font-weight: var(--ga-font-weight-medium);
  height: 2.25rem;
  justify-content: center;
  letter-spacing: -0.01em;
  outline: none;
  padding: 0 var(--ga-space-3);
  transition: background-color var(--ga-duration-base) var(--ga-ease-out),
    border-color var(--ga-duration-base) var(--ga-ease-out),
    box-shadow var(--ga-duration-base) var(--ga-ease-out),
    color var(--ga-duration-base) var(--ga-ease-out);
  white-space: nowrap;
}

.tab:not(:disabled):hover {
  background: var(--ga-surface-subtle);
  color: var(--ga-text-primary);
}

.tab[data-selected="true"] {
  background: var(--ga-surface-raised);
  border-color: var(--ga-border-subtle);
  box-shadow: var(--ga-shadow-xs);
  color: var(--ga-text-primary);
  font-weight: var(--ga-font-weight-semibold);
}

.tab:focus-visible {
  box-shadow: var(--ga-shadow-focus);
}

.tab:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}
`;

export const gaTabTag = define(
  function GaTab({ props, host, lifecycle }) {
    const syncTabStops = (current: { selected: boolean; disabled: boolean }) => {
      const tablist = host.closest<HTMLElement>('[role~="tablist"]');
      if (!tablist) {
        const control = host.shadowRoot?.querySelector<HTMLButtonElement>("button");
        if (control) control.tabIndex = current.disabled ? -1 : 0;
        return;
      }

      const tabs = Array.from(tablist.querySelectorAll<HTMLElement>("ga-tab")).filter(
        (element) => element.closest('[role~="tablist"]') === tablist
      );
      const isDisabled = (element: HTMLElement) =>
        element === host ? current.disabled : element.hasAttribute("disabled");
      const isSelected = (element: HTMLElement) =>
        element === host ? current.selected : element.hasAttribute("selected");
      const activeTab =
        tabs.find((element) => !isDisabled(element) && isSelected(element)) ??
        tabs.find((element) => !isDisabled(element));

      for (const element of tabs) {
        const control = element.shadowRoot?.querySelector<HTMLButtonElement>("button");
        if (control) control.tabIndex = element === activeTab ? 0 : -1;
      }
    };

    const sync = (selected?: boolean, disabled?: boolean) => {
      const tab = host.shadowRoot?.querySelector<HTMLButtonElement>("button");
      if (!tab) return;

      const isSelected = selected ?? hostHas(host, "selected");
      const isDisabled = disabled ?? hostHas(host, "disabled");
      tab.dataset.selected = String(isSelected);
      tab.setAttribute("aria-selected", String(isSelected));
      tab.disabled = isDisabled;
      syncTabStops({ selected: isSelected, disabled: isDisabled });
    };

    effect(() => sync(props.selected, props.disabled));
    observeAttributes(host, lifecycle, ["selected", "disabled"], () => sync());
    listenInShadow(host, lifecycle, "keydown", (event) => {
      const keyboardEvent = event as KeyboardEvent;
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(keyboardEvent.key)) return;

      const tablist = host.closest<HTMLElement>('[role~="tablist"]');
      const roles = tablist?.getAttribute("role")?.trim().split(/\s+/) ?? [];
      if (!tablist || !roles.includes("tablist")) return;

      const enabledTabs = Array.from(tablist.querySelectorAll("ga-tab")).filter(
        (element): element is HTMLElement =>
          element.closest('[role~="tablist"]') === tablist &&
          !element.hasAttribute("disabled")
      );
      const currentIndex = enabledTabs.indexOf(host);
      if (currentIndex < 0 || enabledTabs.length === 0) return;

      let nextIndex = currentIndex;
      if (keyboardEvent.key === "Home") nextIndex = 0;
      if (keyboardEvent.key === "End") nextIndex = enabledTabs.length - 1;
      if (keyboardEvent.key === "ArrowLeft") {
        nextIndex = (currentIndex - 1 + enabledTabs.length) % enabledTabs.length;
      }
      if (keyboardEvent.key === "ArrowRight") {
        nextIndex = (currentIndex + 1) % enabledTabs.length;
      }

      const nextControl = enabledTabs[nextIndex]?.shadowRoot?.querySelector<HTMLButtonElement>(
        'button[part="tab"]'
      );
      if (!nextControl) return;

      keyboardEvent.preventDefault();
      nextControl.focus();
      nextControl.click();
    });

    return `
      <button part="tab" class="tab" type="button" role="tab" aria-selected="false" data-selected="false">
        <slot></slot>
      </button>
    `;
  },
  {
    props: {
      selected: Boolean,
      disabled: Boolean,
    },
    styles: [...gaUiStyles, gaTabStyles],
  }
);

const gaMarkStyles = `
:host {
  display: inline-flex;
  vertical-align: middle;
}

.mark {
  color: var(--ga-color-accent);
  display: block;
  height: 1.5rem;
  user-select: none;
  width: 1.5rem;
}

.mark[data-size="sm"] { height: 1.125rem; width: 1.125rem; }
.mark[data-size="md"] { height: 1.5rem; width: 1.5rem; }
.mark[data-size="lg"] { height: 2rem; width: 2rem; }

.mark svg {
  display: block;
  height: 100%;
  overflow: visible;
  width: 100%;
}

.mark-contour,
.mark-u,
.mark-t {
  fill: none;
  stroke-linecap: square;
  stroke-linejoin: miter;
  vector-effect: non-scaling-stroke;
}

.mark-contour {
  stroke: currentColor;
  stroke-width: 2.4;
}

.mark-u {
  stroke: currentColor;
  stroke-width: 2.15;
}

.mark-t {
  stroke: var(--ga-color-accent);
  stroke-width: 2.6;
}
`;

export const gaMarkTag = define(
  function GaMark({ props, host, lifecycle }) {
    const sync = (size?: string) => {
      const mark = host.shadowRoot?.querySelector<HTMLElement>("[part='mark']");
      if (!mark) return;
      mark.dataset.size = enumValue(
        size ?? hostValue(host, "size"),
        ["sm", "md", "lg"] as const,
        "md"
      );
    };

    effect(() => sync(props.size));
    observeAttributes(host, lifecycle, ["size"], () => sync());

    return `
      <span part="mark" class="mark" data-size="md" role="img" aria-label="GA-UT">
        <svg aria-hidden="true" viewBox="0 0 36 36" focusable="false">
          <path class="mark-contour" d="M18 2.75 32.25 9.9v13.35L18 33.25 3.75 23.25V9.9Z" />
          <path class="mark-u" d="M10.25 12.75v8.1c0 4.65 3.35 7.15 7.75 7.15s7.75-2.5 7.75-7.15v-8.1" />
          <path class="mark-t" d="M12.75 12.25h10.5M18 12.25v10.5" />
        </svg>
      </span>
    `;
  },
  {
    props: { size: String },
    styles: [...gaUiStyles, gaMarkStyles],
  }
);
