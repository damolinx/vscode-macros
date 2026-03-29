// @ts-check
class MacroLink extends HTMLElement {
  static get observedAttributes() {
    return ['aria-label', 'href', 'tabindex'];
  }

  constructor() {
    super();
    /** @type {ShadowRoot} */
    this.root = this.attachShadow({ mode: 'open' });
  }

  get anchor() {
    if (!this.anchorElement) {
      this.anchorElement = this.root.querySelector('a');
    }
    return this.anchorElement;
  }

  connectedCallback() {
    if (!this.root.hasChildNodes()) {
      this.render();
    }

    for (const name of MacroLink.observedAttributes) {
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
    if (!this.anchor) {
      return;
    }

    switch (name) {
      case 'aria-label':
        newValue
          ? this.anchor.setAttribute('aria-label', newValue)
          : this.anchor.removeAttribute('aria-label');
        break;

      case 'href':
        this.anchor.setAttribute('href', newValue ?? '');
        break;

      case 'tabindex':
        this.anchor.tabIndex = newValue ? Number(newValue) : 0;
        break;
    }
  }

  render() {
    this.root.innerHTML = `
      <style>
        a {
          color: var(--vscode-textLink-foreground);
          cursor: pointer;
          text-decoration: none;
        }
        a:hover {
          color: var(--vscode-textLink-activeForeground);
          text-decoration: underline;
        }
        a:active {
          color: var(--vscode-foreground);
        }
        a:focus-visible {
          outline: none;
          box-shadow: inset 0 0 0 1px var(--vscode-focusBorder);
        }
      </style>

      <a href="">
        <slot></slot>
      </a>`;
  }

  get href() {
    return this.getAttribute('href') ?? '';
  }
}

customElements.define('macro-link', MacroLink);
