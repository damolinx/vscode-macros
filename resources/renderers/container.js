// @ts-check
class MacroContainer extends HTMLElement {
  constructor() {
    super();
    this.root = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    if (!this.root.hasChildNodes()) {
      this.render();
    }
  }

  render() {
    this.root.innerHTML = `
      <style>
        :host {
          display: flex;
          flex-direction: row;

          gap: 8px;

          flex: 0 1 auto;
          min-width: 0;
        }
      </style>

      <slot></slot>`;
  }
}

customElements.define('macro-container', MacroContainer);
