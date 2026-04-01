// @ts-check
class MacroTree extends HTMLElement {
  static get observedAttributes() {
    return ['data-initial', 'enable-remove', 'data-on-remove'];
  }

  constructor() {
    super();
    /** @type {ShadowRoot} */
    this.root = this.attachShadow({ mode: 'open' });

    this._idCounter = 10000;

    /** @type {any[]} */
    this.items = [];
    /** @type {any[]} */
    this.visibleNodes = [];

    this.expandedNodes = new Set();
    this.selectedNode = null;
    this.enableRemove = false;

    /** @type {string | null} */
    this.onRemoveHandlerName = null;

    /** @type {((e: Event) => void) | null} */
    this.removeHandler = null;
  }

  get tree() {
    if (!this.treeElement) {
      /** @type {HTMLElement | null} */
      this.treeElement = this.root.querySelector('.tree');
    }
    return this.treeElement;
  }

  connectedCallback() {
    if (!this.root.hasChildNodes()) {
      this.render();
    }

    const initial = this.getAttribute('data-initial');
    if (initial) {
      try {
        const parsed = JSON.parse(initial);
        this.items = parsed.items ?? [];
        this.update();
      } catch {
        console.error('Invalid data-initial JSON for <macro-tree>');
      }
    }
  }

  connectRemoveHandler() {
    if (this.removeHandler) {
      return;
    }

    this.removeHandler = (e) => {
      const target = /** @type {HTMLElement} */ (e.target);
      if (!target.hasAttribute('data-remove')) {
        return;
      }

      e.stopPropagation();

      /** @type {HTMLElement | null} */
      const nodeElement = target.closest('.node');
      if (!nodeElement) {
        return;
      }

      const id = nodeElement.dataset.id;
      const node = id && this.removeNode(id);
      if (!node) {
        return;
      }

      if (!this.onRemoveHandlerName) {
        return;
      }

      this.dispatchEvent(
        new CustomEvent('macro-event', {
          bubbles: true,
          detail: {
            eventName: 'remove',
            handlerName: this.onRemoveHandlerName,
            target: this,
            item: node,
          },
        }),
      );
    };

    this.root.addEventListener('click', this.removeHandler);
  }

  disconnectRemoveHandler() {
    if (this.removeHandler) {
      this.root.removeEventListener('click', this.removeHandler);
      this.removeHandler = null;
    }
  }

  /**
   * @param {string} name
   * @param {string | null} _oldValue
   * @param {string | null} newValue
   */
  attributeChangedCallback(name, _oldValue, newValue) {
    switch (name) {
      case 'data-initial': {
        if (newValue) {
          try {
            const parsed = JSON.parse(newValue);
            this.items = parsed.items ?? [];
          } catch {
            console.error('Invalid data-initial JSON for <macro-tree>');
          }
        } else {
          this.items = [];
        }
        this.update();
        break;
      }

      case 'enable-remove': {
        this.enableRemove = newValue !== null;
        if (this.enableRemove) {
          this.connectRemoveHandler();
        } else {
          this.disconnectRemoveHandler();
        }
        break;
      }

      case 'data-on-remove': {
        this.onRemoveHandlerName = newValue;
        break;
      }
    }
  }

  render() {
    this.root.innerHTML = `
      <style>
        :host {
          display: block;

          color: var(--vscode-foreground);
          font-family: var(--vscode-font-family);
        }

        .tree {
          display: block;
          cursor: default;
          outline: none;
          user-select: none;
        }

        .node {
          display: flex;
          align-items: center;

          padding: 2px 4px;

          min-width: 0;
          white-space: nowrap;

          position: relative;
        }

        .node:hover {
          background: var(--vscode-list-hoverBackground);
        }

        .node:hover .actions,
        .node.selected .actions {
          opacity: 1;
          pointer-events: auto;
        }

        .toggle {
          display: inline-flex;
          align-items: center;
          justify-content: center;

          margin-right: 4px;

          width: 12px;

          font-size: 12px;
          line-height: 1;

          cursor: pointer;

          transform-origin: center;
          transition: transform 0.1s ease-out;
        }

        .label {
          flex: 1 1 auto;
          min-width: 0;

          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;

          cursor: pointer;
        }

        .actions {
          display: flex;
          align-items: center;
          gap: 2px;

          margin-left: auto;

          opacity: 0;
          pointer-events: none;
        }

        .remove {
          display: inline-flex;
          align-items: center;
          justify-content: center;

          height: 18px;
          min-width: 16px;
          padding: 0 4px;

          border-radius: 2px;

          color: var(--vscode-foreground);
          opacity: 0.7;

          cursor: pointer;
        }

        :host(.active) .node.selected {
          background: var(--vscode-list-activeSelectionBackground);
          color: var(--vscode-list-activeSelectionForeground);

          outline: 1px solid var(--vscode-list-focusOutline);
          outline-offset: -1px;
        }

        :host(.active) .node.selected .remove {
          color: var(--vscode-list-activeSelectionIconForeground);
        }

        :host(:not(.active)) .node.selected {
          background: var(--vscode-list-inactiveSelectionBackground);
          color: var(--vscode-list-inactiveSelectionForeground);
        }

        .node.selected .remove {
          color: var(--vscode-list-inactiveSelectionIconForeground);
          opacity: 1;
        }

        .node:hover .remove:hover {
          background:
            linear-gradient(
              rgba(255, 255, 255, 0.12),
              rgba(255, 255, 255, 0.12)
            ),
            var(--vscode-list-hoverBackground);
        }

        .node.selected .remove:hover {
          background:
            linear-gradient(
              rgba(255, 255, 255, 0.12),
              rgba(255, 255, 255, 0.12)
            ),
            var(--vscode-list-inactiveSelectionBackground);
        }

        :host(.active) .node.selected .remove:hover {
          background:
            linear-gradient(
              rgba(255, 255, 255, 0.12),
              rgba(255, 255, 255, 0.12)
            ),
            var(--vscode-list-activeSelectionBackground);
        }
      </style>

      <div class="tree" tabindex="0"></div>
    `;

    if (!this.tree) {
      return;
    }

    if (!this.handleKeyBound) {
      /** @param {KeyboardEvent} e */
      this.handleKeyBound = (e) => this.handleKey(e);
    }

    this.tree.addEventListener('keydown', this.handleKeyBound);

    this.tree.addEventListener('focus', () => {
      this.classList.add('active');

      if (this.selectedNode === null && this.visibleNodes.length > 0) {
        this.selectNode(this.visibleNodes[0], true);
      }
    });

    this.tree.addEventListener('blur', () => {
      this.classList.remove('active');
    });
  }

  /** @param {any[]} items */
  setItems(items = []) {
    this.items = items;
    this.update();
  }

  /**
   * @param {string} id
   * @returns {any | null}
   */
  findNode(id, nodes = this.items) {
    for (const node of nodes) {
      if (node.id === id) {
        return node;
      }
      if (node.children) {
        const found = this.findNode(id, node.children);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }

  /**
   * @param {string} parentId
   * @param {any} newNode
   */
  addNode(parentId, newNode) {
    const items = structuredClone(this.items);
    const parent = this.findNode(parentId, items);

    if (parent) {
      parent.children ??= [];
      parent.children.push(newNode);
      this.setItems(items);
    }
  }

  /**
   * @param {string} id
   * @param {any[]} nodes
   */
  removeNode(id, nodes = this.items) {
    const items = structuredClone(nodes);
    let nodeRemoved;

    const walk = (/** @type {any[]} */ arr) => {
      const idx = arr.findIndex((n) => n.id === id);
      if (idx !== -1) {
        nodeRemoved = arr.splice(idx, 1)[0];
        return true;
      }
      for (const n of arr) {
        if (n.children && walk(n.children)) {
          return true;
        }
      }
      return false;
    };

    if (walk(items)) {
      this.setItems(items);
    }

    return nodeRemoved;
  }

  /**
   * @param {string} id
   * @param {any} patch
   */
  updateNode(id, patch) {
    const items = structuredClone(this.items);
    const node = this.findNode(id, items);

    if (node) {
      Object.assign(node, patch);
      this.setItems(items);
    }
  }

  /**
   * @param {string} parentId
   * @param {any} newChildren
   */
  replaceChildren(parentId, newChildren) {
    const items = structuredClone(this.items);
    const parent = this.findNode(parentId, items);

    if (parent) {
      parent.children = newChildren;
      this.setItems(items);
    }
  }

  /**
   * @param {string} id
   */
  expandNode(id, select = false) {
    // Expand the node itself
    this.expandedNodes.add(id);

    // Optionally select it
    if (select) {
      this.selectedNode = this.findNode(id);
      this.tree?.focus();
    }

    // Expand all ancestors
    const expandParents = (
      /** @type {any[]} */ nodes,
      /** @type {string} */ targetId,
      /** @type {any[]} */ path = [],
    ) => {
      for (const node of nodes) {
        const newPath = [...path, node.id];

        if (node.id === targetId) {
          // Expand every ancestor in the path
          for (const ancestorId of path) {
            this.expandedNodes.add(ancestorId);
          }
          return true;
        }

        if (node.children && expandParents(node.children, targetId, newPath)) {
          return true;
        }
      }
      return false;
    };

    expandParents(this.items, id);

    this.update();
  }

  update() {
    if (!this.treeElement) {
      return;
    }

    this.treeElement.innerHTML = '';
    this.visibleNodes = [];

    const renderNode = (
      /** @type {{ id: string | undefined; children: string | any[]; label: string | null; }} */
      node,
      /** @type {number} */
      depth,
    ) => {
      if (!node.id) {
        node.id = `__id${this._idCounter++}`;
      }

      this.visibleNodes.push(node);

      const row = document.createElement('div');
      row.className = 'node';
      row.style.paddingLeft = String(depth * 12) + 'px';
      row.dataset.id = node.id;

      if (this.selectedNode?.id === node.id) {
        row.classList.add('selected');
      }

      const hasChildren = Array.isArray(node.children) && node.children.length > 0;
      const isExpanded = this.expandedNodes.has(node.id);

      const toggle = document.createElement('span');
      toggle.className = 'toggle';

      if (hasChildren) {
        toggle.textContent = '❯';
        toggle.style.transform = isExpanded ? 'rotate(90deg)' : 'rotate(0deg)';
      } else {
        toggle.textContent = ' ';
      }

      toggle.addEventListener('click', (event) => {
        event.stopPropagation();

        if (this.expandedNodes.has(node.id)) {
          this.expandedNodes.delete(node.id);
        } else {
          this.expandedNodes.add(node.id);
        }

        this.update();
      });

      const label = document.createElement('span');
      label.className = 'label';
      label.textContent = node.label;

      row.addEventListener('click', () => {
        this.selectNode(node, true);

        if (hasChildren) {
          if (this.expandedNodes.has(node.id)) {
            this.expandedNodes.delete(node.id);
          } else {
            this.expandedNodes.add(node.id);
          }
          queueMicrotask(() => this.update());
        }
      });

      row.appendChild(toggle);
      row.appendChild(label);

      if (this.enableRemove) {
        const actions = document.createElement('span');
        actions.className = 'actions';
        label.textContent = node.label;

        const remove = document.createElement('span');
        remove.className = 'remove';
        remove.dataset.remove = '';
        remove.textContent = '✕';
        actions.append(remove);
        row.appendChild(actions);
      }

      this.treeElement?.appendChild(row);

      if (hasChildren && isExpanded) {
        for (const child of node.children) {
          renderNode(child, depth + 1);
        }
      }
    };

    for (const item of this.items) {
      renderNode(item, 0);
    }
  }

  /**
   * @param {any} node
   */
  selectNode(node, activate = false) {
    this.selectedNode = node;
    this.update();

    const eventName = activate ? 'activate' : 'select';
    const handlerName = this.getAttribute('data-on-' + eventName);
    if (!handlerName) {
      return;
    }

    this.dispatchEvent(
      new CustomEvent('macro-event', {
        bubbles: true,
        detail: {
          eventName,
          handlerName,
          target: this,
          item: node,
        },
      }),
    );
  }

  /**
   * @param {KeyboardEvent} event
   */
  handleKey(event) {
    const key = event.key;
    const index = this.visibleNodes.findIndex((n) => n.id === this.selectedNode?.id);
    const hasSelection = index !== -1;

    if (key === 'ArrowDown') {
      event.preventDefault();
      if (hasSelection && index < this.visibleNodes.length - 1) {
        this.selectNode(this.visibleNodes[index + 1]);
      }
      return;
    }

    if (key === 'ArrowUp') {
      event.preventDefault();
      if (hasSelection && index > 0) {
        this.selectNode(this.visibleNodes[index - 1]);
      }
      return;
    }

    if (key === 'ArrowRight') {
      event.preventDefault();
      const node = this.visibleNodes[index];
      if (!node) {
        return;
      }

      const hasChildren = Array.isArray(node.children) && node.children.length > 0;
      const isExpanded = this.expandedNodes.has(node.id);

      if (hasChildren && !isExpanded) {
        this.expandedNodes.add(node.id);
        this.selectNode(node);
        return;
      }

      if (hasChildren && isExpanded) {
        this.selectNode(node.children[0]);
        return;
      }

      return;
    }

    if (key === 'ArrowLeft') {
      event.preventDefault();
      const node = this.visibleNodes[index];
      if (!node) {
        return;
      }

      const isExpanded = this.expandedNodes.has(node.id);

      if (isExpanded) {
        this.expandedNodes.delete(node.id);
        this.update();
        return;
      }

      const parent = this.findParent(node.id, this.items);
      if (parent) {
        this.selectNode(parent);
      }

      return;
    }

    if (key === ' ') {
      event.preventDefault();

      if (!hasSelection) {
        return;
      }

      const node = this.visibleNodes[index];
      const hasChildren = Array.isArray(node.children) && node.children.length > 0;

      if (hasChildren) {
        if (this.expandedNodes.has(node.id)) {
          this.expandedNodes.delete(node.id);
        } else {
          this.expandedNodes.add(node.id);
        }
        this.update();
        return;
      }

      this.selectNode(node);
      return;
    }

    if (key === 'Enter' || key == 'Space') {
      event.preventDefault();
      if (hasSelection) {
        this.selectNode(this.selectedNode, true);
      }
      return;
    }

    if (key === 'Home') {
      event.preventDefault();
      if (this.visibleNodes.length > 0) {
        this.selectNode(this.visibleNodes[0]);
      }
      return;
    }

    if (key === 'End') {
      event.preventDefault();
      if (this.visibleNodes.length > 0) {
        this.selectNode(this.visibleNodes[this.visibleNodes.length - 1]);
      }
      return;
    }
  }

  /**
   * @param {any} id
   * @param {any[]} nodes
   * @returns {null|any}
   */
  findParent(id, nodes, parent = null) {
    for (const node of nodes) {
      if (node.id === id) {
        return parent;
      }
      if (Array.isArray(node.children)) {
        const found = this.findParent(id, node.children, node);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }
}

customElements.define('macro-tree', MacroTree);
