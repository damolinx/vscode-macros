// @ts-check
class MacroButton extends HTMLElement {
  static get observedAttributes() {
    return ['aria-label', 'disabled', 'tabindex', 'toggled'];
  }

  constructor() {
    super();
    /** @type {ShadowRoot} */
    this.root = this.attachShadow({ mode: 'open' });
  }

  get button() {
    if (!this.buttonElement) {
      this.buttonElement = this.root.querySelector('button');
    }
    return this.buttonElement;
  }

  connectedCallback() {
    if (!this.root.hasChildNodes()) {
      this.render();
    }

    for (const name of MacroButton.observedAttributes) {
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
    if (!this.button) {
      return;
    }

    switch (name) {
      case 'aria-label':
        newValue
          ? this.button.setAttribute('aria-label', newValue)
          : this.button.removeAttribute('aria-label');
        break;

      case 'disabled':
        newValue
          ? this.button.setAttribute('disabled', '')
          : this.button.removeAttribute('disabled');
        break;

      case 'tabindex':
        this.button.tabIndex = newValue ? Number(newValue) : 0;
        break;

      case 'toggled':
        if (this.hasAttribute('toggle')) {
          newValue
            ? this.button.setAttribute('aria-pressed', 'true')
            : this.button.removeAttribute('aria-pressed');
        }
        break;
    }
  }

  render() {
    this.root.innerHTML = `
      <style>
        :host {
          display: inline-flex;
          align-items: center;
        }

        button {
          align-items: center;
          display: inline-flex;
          justify-content: center;

          border: 1px solid var(--button-border, var(--vscode-button-border));
          border-radius: var(--button-radius, 2px);
          box-sizing: border-box;
          min-width: var(--button-min-width, auto);
          padding: var(--button-padding, 4px 10px);

          font-family: inherit;
          font-size: inherit;
          line-height: var(--button-line-height, 1.2);

          background: var(--button-bg, var(--vscode-button-background));
          color: var(--button-fg, var(--vscode-button-foreground));

          cursor: pointer;
        }

        button:hover {
          background: var(--button-hover-bg, var(--vscode-button-hoverBackground));
          color: var(--button-hover-fg, var(--vscode-button-foreground));
        }

        button:focus {
          outline: none;
          box-shadow: inset 0 0 0 1px var(--vscode-focusBorder);
        }

        :host([toggle]:not([toggled])) button {
          background: var(--vscode-input-background);
          border-color: var(--vscode-input-border);
          color: var(--vscode-input-foreground);
        }

        :host([toggle][toggled]) button {
          background: var(--vscode-inputOption-activeBackground);
          border-color: var(--vscode-inputOption-activeBorder);
          color: var(--vscode-inputOption-activeForeground);
        }
      </style>

      <button>
        <slot></slot>
      </button>`;

    if (!this.button) {
      return;
    }

    this.button.addEventListener('click', () => {
      let toggled = undefined;

      if (this.hasAttribute('toggle')) {
        const newState = !this.hasAttribute('toggled');
        toggled = newState;

        if (newState) {
          this.setAttribute('toggled', '');
        } else {
          this.removeAttribute('toggled');
        }
      }

      const handlerName = this.getAttribute('data-on-click');
      if (handlerName) {
        this.dispatchEvent(
          new CustomEvent('macro-event', {
            bubbles: true,
            detail: {
              eventName: 'click',
              handlerName,
              target: this.button,
              toggled, // undefined for normal buttons, boolean for toggle buttons
            },
          }),
        );
      }
    });
  }

  get toggled() {
    return this.hasAttribute('toggle') ? this.hasAttribute('toggled') : undefined;
  }

  set toggled(value) {
    if (this.hasAttribute('toggle')) {
      if (value) {
        this.setAttribute('toggled', '');
      } else {
        this.removeAttribute('toggled');
      }
    }
  }
}

customElements.define('macro-button', MacroButton);
