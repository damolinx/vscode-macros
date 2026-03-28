// @ts-check
class MacroTextarea extends HTMLElement {
  static get observedAttributes() {
    return ['aria-label', 'disabled', 'placeholder', 'tabindex', 'value'];
  }

  constructor() {
    super();
    /** @type {ShadowRoot} */
    this.root = this.attachShadow({ mode: 'open' });
  }

  get textarea() {
    if (!this.textareaElement) {
      this.textareaElement = this.root.querySelector('textarea');
    }
    return this.textareaElement;
  }

  connectedCallback() {
    if (!this.root.hasChildNodes()) {
      this.render();
    }

    for (const name of MacroTextarea.observedAttributes) {
      const value = this.getAttribute(name);
      this.attributeChangedCallback(name, null, value);
    }

    if (this.isReadonly) {
      if (this.textarea) {
        this.textarea.setAttribute('readonly', '');
        this.textarea.rows = Number(this.getAttribute('rows')) || 1;
      }
    } else {
      this.minRows = Number(this.getAttribute('data-min-rows')) || 1;
      const maxAttr = this.getAttribute('data-max-rows');
      this.maxRows = maxAttr !== null ? Number(maxAttr) : undefined;
      this.autoSize();
    }
  }

  /**
   * @param {string} name
   * @param {string | null} _oldValue
   * @param {string | null} newValue
   */
  attributeChangedCallback(name, _oldValue, newValue) {
    if (!this.textarea) {
      return;
    }

    switch (name) {
      case 'aria-label':
        if (newValue) {
          this.textarea.setAttribute('aria-label', newValue);
        } else {
          this.textarea.removeAttribute('aria-label');
        }
        break;

      case 'disabled':
        if (newValue) {
          this.textarea.setAttribute('disabled', '');
        } else {
          this.textarea.removeAttribute('disabled');
        }
        break;

      case 'placeholder':
        this.textarea.placeholder = newValue ?? '';
        break;

      case 'tabindex':
        this.textarea.tabIndex = newValue ? Number(newValue) : 0;
        break;

      case 'value':
        this.textarea.value = newValue ?? '';
        this.autoSize();
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

        .wrapper.focus textarea[readonly] {
          box-shadow: none;
          border-color: var(--vscode-input-border);
        }

        textarea {
          flex: 1 1 auto;
          min-width: 0;
          resize: none;

          box-sizing: border-box;
          padding: 4px 6px;

          background: transparent;
          border: none;
          color: var(--vscode-input-foreground);
          outline: none;
          overflow: hidden;

          line-height: 1.4;
          font-family: inherit;
          font-size: inherit;
        }

        textarea[readonly] {
          cursor: default;
          overflow-y: auto;
        }
      </style>

      <div class="wrapper">
        <textarea></textarea>
      </div>`;

    const wrapper = this.root.querySelector('.wrapper');
    if (!this.textarea || !wrapper) {
      return;
    }

    this.textarea.addEventListener('focus', () => wrapper.classList.add('focus'));
    this.textarea.addEventListener('blur', () => wrapper.classList.remove('focus'));

    if (!this.isReadonly) {
      this.textarea.addEventListener('input', () => {
        this.autoSize();

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
  }

  autoSize() {
    if (!this.textarea || this.isReadonly) {
      return;
    }

    const min = this.minRows ?? 1;
    this.textarea.rows = min;
    this.textarea.style.height = 'auto';

    const style = getComputedStyle(this.textarea);
    const lineHeight = parseFloat(style.lineHeight) || 18;
    const rowsFloat = this.textarea.scrollHeight / lineHeight;
    const scrollRows = Math.max(1, Math.round(rowsFloat));

    let newRows = Math.max(scrollRows, min);
    if (this.maxRows !== undefined) {
      newRows = Math.min(newRows, this.maxRows);
    }

    this.textarea.rows = newRows;
  }

  get isReadonly() {
    return this.hasAttribute('readonly');
  }

  get value() {
    return this.textarea?.value ?? '';
  }

  set value(value) {
    this.setAttribute('value', value ?? '');
  }
}

customElements.define('macro-textarea', MacroTextarea);
