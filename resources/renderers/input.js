// @ts-check
class MacroInput extends HTMLElement {
  static get observedAttributes() {
    return ['aria-label', 'disabled', 'placeholder', 'tabindex', 'type', 'value'];
  }

  constructor() {
    super();
    /** @type {ShadowRoot} */
    this.root = this.attachShadow({ mode: 'open' });
  }

  get input() {
    if (!this.inputElement) {
      this.inputElement = this.root.querySelector('input');
    }
    return this.inputElement;
  }

  connectedCallback() {
    if (!this.root.hasChildNodes()) {
      this.render();
    }

    for (const name of MacroInput.observedAttributes) {
      const value = this.getAttribute(name);
      this.attributeChangedCallback(name, null, value);
    }
  }

  /**
   * @param {string} name
   * @param {string | null} _oldValue
   * @param {string | null} newValue
   */
  attributeChangedCallback(name, _oldValue, newValue) {
    if (!this.input) {
      return;
    }

    switch (name) {
      case 'aria-label':
        newValue
          ? this.input.setAttribute('aria-label', newValue)
          : this.input.removeAttribute('aria-label');
        break;

      case 'disabled':
        newValue ? this.input.setAttribute('disabled', '') : this.input.removeAttribute('disabled');
        break;

      case 'placeholder':
        this.input.placeholder = newValue ?? '';
        break;

      case 'tabindex':
        this.input.tabIndex = newValue ? Number(newValue) : 0;
        break;

      case 'type':
        this.input.type = newValue ?? 'text';
        break;

      case 'value':
        this.input.value = newValue ?? '';
        break;
    }
  }

  render() {
    this.root.innerHTML = `
      <style>
        :host {
          display: flex;
          flex: 0 1 auto;
          min-width: 0;
        }

        .wrapper {
          display: flex;
          flex: 1 1 auto;
          min-width: 0;

          background: var(--vscode-input-background);
          border: 1px solid var(--vscode-input-border);
          border-radius: 2px;
          padding: 0;
        }

        .wrapper.focus {
          border-color: var(--vscode-focusBorder);
          box-shadow: inset 0 0 0 1px var(--vscode-focusBorder);
        }

        input {
          flex: 1 1 auto;
          min-width: 0;

          box-sizing: border-box;
          padding: 4px 6px;

          background: transparent;
          border: none;
          outline: none;

          color: var(--vscode-input-foreground);
          line-height: 1.4;
        }

        ::slotted(macro-button) {
          --button-bg: transparent;
          --button-fg: var(--vscode-input-foreground);
          --button-hover-bg: var(--vscode-inputOption-hoverBackground);
          --button-hover-fg: var(--vscode-input-foreground);

          --button-line-height: 1.6;
          --button-min-width: 20px;
          --button-padding: 0 4px;
          --button-radius: 2px;

          align-items: center;
          display: flex;

          margin: 1px;
          padding: 2px 0;

          cursor: pointer;
        }
      </style>

      <div class="wrapper">
        <input />
        <slot></slot>
      </div>`;

    const wrapper = this.root.querySelector('.wrapper');
    if (!this.input || !wrapper) {
      return;
    }

    this.input.addEventListener('focus', () => wrapper.classList.add('focus'));
    this.input.addEventListener('blur', () => wrapper.classList.remove('focus'));
    this.input.addEventListener('input', () => {
      const handlerName = this.getAttribute('data-on-input');
      if (!handlerName) {
        return;
      }
      this.dispatchEvent(
        new CustomEvent('macro-event', {
          bubbles: true,
          detail: {
            eventName: 'input',
            handlerName,
            target: this,
            value: this.value,
          },
        }),
      );
    });
  }

  get value() {
    return this.input?.value ?? '';
  }

  set value(value) {
    this.setAttribute('value', value ?? '');
  }
}

customElements.define('macro-input', MacroInput);
