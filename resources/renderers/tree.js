// @ts-check

class MacroTree extends HTMLElement {
  // static get observedAttributes() { return []; }

  /**
   * @typedef {Object} TreeNode
   * * @property {boolean} [expanded]
   * @property {string} [id]
   * @property {string} label
   * @property {string} [description]
   * @property {TreeNode[]} [children]
   * @property {{ handlerName: string }} [action]
   */

  constructor() {
    super();
    /** @type {ShadowRoot} */
    this.root = this.attachShadow({ mode: 'open' });
    /** @type {number} */
    this.idCounter = 10000;
    /** @type {TreeNode[]} */
    this.nodes = [];
    /** @type {TreeNode[]} */
    this.visibleNodes = [];
    /** @type {Set<TreeNode>} */
    this.expandedNodes = new Set();
    /** @type {TreeNode | null} */
    this.selectedNode = null;
    /** @type {boolean} */
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

    this.enableRemove = this.hasAttribute('enable-remove');
    if (this.enableRemove) {
      this.onRemoveHandlerName = this.getAttribute('data-on-remove');
      this.connectRemoveHandler();
    }

    const initial = this.getAttribute('data-initial');
    if (initial) {
      const parsed = JSON.parse(initial);
      this.setRootNodes(parsed.items);
    }
  }

  connectRemoveHandler() {
    if (this.removeHandler) {
      return;
    }

    this.removeHandler = (e) => {
      const target = /** @type {HTMLElement | null} */ (e.target);
      if (!target?.hasAttribute('data-remove')) {
        return;
      }

      e.stopPropagation();

      const nodeElement = /** @type {HTMLElement | null} */ (target.closest('.node'));
      if (!nodeElement) {
        return;
      }

      const id = nodeElement.dataset.id;
      const removedNode = id && this.removeNodes([id]);
      if (!removedNode) {
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
            node: removedNode,
          },
        }),
      );
    };

    this.root.addEventListener('click', this.removeHandler);
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

          min-width: 0;
          padding: 2px 4px;
          white-space: nowrap;

          cursor: pointer;
          position: relative;
        }

        .toggle {
          display: inline-flex;
          justify-content: center;

          flex: 0 0 12px;
          margin-right: 4px;

          font-family: var(--vscode-font-family);
          font-size: 12px;
          line-height: 1;

          transform-origin: center;
          transition: transform 0.2s ease-out;
        }

        .label-container {
          display: flex;
          min-width: 0;
        }

        .label {
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .description {
          flex: 1 0 0;
          margin-left: 6px;

          color: var(--vscode-descriptionForeground);
          font-size: 0.9em;

          overflow: hidden;
          text-overflow: ellipsis;
        }

        .actions {
          display: flex;
          align-items: center;

          margin-left: auto;

          display: none;
          pointer-events: auto;
        }

        .remove {
          display: inline-flex;
          align-items: center;
          justify-content: center;

          height: 16px;
          width: 16px;
          padding: 0 2px;

          border-radius: 2px;

          color: var(--vscode-foreground);
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
        }

        .node:hover {
          background: var(--vscode-list-hoverBackground);
        }

        .node:hover .actions,
        .node.selected .actions {
          display: block;
          pointer-events: auto;
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

      <div class="tree" tabindex="0"></div>`;

    if (!this.tree) {
      return;
    }

    this.tree.addEventListener('blur', () => this.classList.remove('active'));
    this.tree.addEventListener('keydown', (/** @type {KeyboardEvent} e */ e) => this.handleKey(e));
    this.tree.addEventListener('focus', () => {
      this.classList.add('active');

      if (this._focusFromClick) {
        this._focusFromClick = false;
        return;
      }

      if (!this.selectedNode && this.visibleNodes.length > 0) {
        this.selectNode(this.visibleNodes[0], true);
      }
    });
  }

  /**
   * @param {KeyboardEvent} e
   */
  handleKey(e) {
    const selectedNode = this.selectedNode;
    const selectedIndex = selectedNode ? this.visibleNodes.indexOf(selectedNode) : -1;
    const hasSelection = selectedNode && selectedIndex !== -1;
    const key = e.key;

    if (key === 'ArrowDown') {
      e.preventDefault();
      if (hasSelection) {
        const nextIndex = selectedIndex + 1;
        if (nextIndex < this.visibleNodes.length) {
          this.selectNode(this.visibleNodes[nextIndex]);
        }
      }
      return;
    }

    if (key === 'ArrowUp') {
      e.preventDefault();
      if (hasSelection && selectedIndex > 0) {
        this.selectNode(this.visibleNodes[selectedIndex - 1]);
      }
      return;
    }

    if (key === 'ArrowRight') {
      e.preventDefault();
      if (!hasSelection) {
        return;
      }

      const canExpand = Array.isArray(selectedNode.children);
      if (!canExpand) {
        return;
      }

      const isExpanded = this.expandedNodes.has(selectedNode);
      if (isExpanded) {
        if (selectedNode.children?.length) {
          this.selectNode(selectedNode.children[0]);
        }
      } else {
        this.expandedNodes.add(selectedNode);
        this.selectNode(selectedNode);
      }

      return;
    }

    if (key === 'ArrowLeft') {
      e.preventDefault();
      if (!hasSelection || !selectedNode) {
        return;
      }

      const isExpanded = this.expandedNodes.has(selectedNode);
      if (isExpanded) {
        this.expandedNodes.delete(selectedNode);
        this.#update();
        return;
      }

      const parent = this.findParent(selectedNode);
      if (parent) {
        this.selectNode(parent);
      }
      return;
    }

    if (key === 'Enter' || key === ' ') {
      e.preventDefault();
      if (!hasSelection) {
        return;
      }

      const canExpand = Array.isArray(selectedNode.children);
      if (canExpand) {
        if (this.expandedNodes.has(selectedNode)) {
          this.expandedNodes.delete(selectedNode);
        } else {
          this.expandedNodes.add(selectedNode);
        }
        this.#update();
      } else {
        this.selectNode(selectedNode, true);
      }
      return;
    }

    if (key === 'Home') {
      e.preventDefault();
      if (this.visibleNodes.length) {
        this.selectNode(this.visibleNodes[0]);
      }
      return;
    }

    if (key === 'End') {
      e.preventDefault();
      if (this.visibleNodes.length) {
        this.selectNode(this.visibleNodes[this.visibleNodes.length - 1]);
      }
      return;
    }
  }

  // TREE API

  /**
   * @param {string} id
   * @param {TreeNode[]} nodes
   * @returns {boolean}
   */
  addNodes(id, nodes) {
    const node = this.findNode(id, this.nodes);
    if (!node) {
      return false;
    }

    if (node.children) {
      node.children.push(...nodes);
    } else {
      node.children = nodes;
    }

    this.#update();
    return true;
  }

  /**
   * @param {string} id
   * @param {boolean} [select]
   */
  expandNode(id, select = false) {
    const node = this.findNode(id);
    if (!node) {
      return false;
    }

    this.expandedNodes.add(node);
    let parent = this.findParent(node);
    while (parent) {
      this.expandedNodes.add(parent);
      parent = this.findParent(parent);
    }

    if (select) {
      this.selectedNode = node;
      this.tree?.focus();
    }

    this.#update();
    return true;
  }

  /**
   * @param {string} id
   * @returns {TreeNode | null}
   */
  findNode(id, nodes = this.nodes) {
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
   * @param {TreeNode | string} nodeOrId
   * @param {TreeNode[]} [nodes]
   * @param {TreeNode | null} [parent]
   * @returns {TreeNode | null}
   */
  findParent(nodeOrId, nodes = this.nodes, parent = null) {
    const isId = typeof nodeOrId === 'string';
    for (const node of nodes) {
      const match = isId ? node.id === nodeOrId : node === nodeOrId;
      if (match) {
        return parent;
      }

      if (node.children) {
        const found = this.findParent(nodeOrId, node.children, node);
        if (found) {
          return found;
        }
      }
    }

    return null;
  }

  /**
   * @param {string[]} ids
   * @param {TreeNode[]} [nodes]
   * @returns {TreeNode[]}
   */
  removeNodes(ids, nodes = this.nodes) {
    const removed = /** @type {TreeNode[]} */ ([]);

    const walk = (/** @type {TreeNode[]} */ arr) => {
      for (let i = arr.length - 1; i >= 0; i--) {
        const node = arr[i];
        if (node.id && ids.includes(node.id)) {
          removed.push(...arr.splice(i, 1));
          continue;
        }

        if (node.children) {
          walk(node.children);
        }
      }
    };

    walk(nodes);

    if (removed.length > 0) {
      this.#update();
    }
    return removed;
  }

  /**
   * @param {TreeNode|string} nodeOrId
   * @param {boolean} activate
   * @returns {boolean}
   */
  selectNode(nodeOrId, activate = false) {
    const node = typeof nodeOrId === 'string' ? this.findNode(nodeOrId) : nodeOrId;
    if (!node) {
      return false;
    }

    this.selectedNode = node;
    this.#update();

    const eventName = activate ? 'activate' : 'select';
    const handlerName = this.getAttribute('data-on-' + eventName);
    if (!handlerName) {
      return true;
    }

    this.dispatchEvent(
      new CustomEvent('macro-event', {
        bubbles: true,
        detail: {
          eventName,
          handlerName,
          target: this,
          node,
        },
      }),
    );

    return true;
  }

  /**
   * @param {string} id
   * @param {TreeNode[]} nodes
   * @returns {boolean}
   */
  setNodes(id, nodes) {
    const node = this.findNode(id, this.nodes);
    if (!node) {
      return false;
    }

    node.children = nodes;
    this.#update();
    return true;
  }

  /**
   * @param {TreeNode[]} nodes
   */
  setRootNodes(nodes) {
    this.nodes = Array.isArray(nodes) ? nodes : [];
    this.#update();
  }

  /**
   * @param {string} id
   * @param {object} patch
   * @returns {boolean}
   */
  updateNode(id, patch) {
    const node = this.findNode(id, this.nodes);
    if (!node) {
      return false;
    }

    Object.assign(node, patch);
    this.#update();
    return true;
  }

  #update() {
    const tree = this.tree;
    if (!tree) {
      return;
    }

    tree.innerHTML = '';
    this.visibleNodes = [];

    const renderNode = (/** @type {TreeNode} */ node, /** @type {number} */ depth) => {
      if (!node.id) {
        node.id = `__id${this.idCounter++}`;
      }
      if (node.expanded) {
        this.expandedNodes.add(node);
        delete node.expanded;
      }

      this.visibleNodes.push(node);

      const row = document.createElement('div');
      row.className = 'node';
      row.style.paddingLeft = `${depth * 12}px`;
      row.dataset.id = node.id;

      if (this.selectedNode && (this.selectedNode === node || this.selectedNode.id === node.id)) {
        row.classList.add('selected');
      }

      const canExpand = Array.isArray(node.children);
      const isExpanded = canExpand && this.expandedNodes.has(node);

      // Toggle
      const toggle = document.createElement('span');
      toggle.className = 'toggle';
      toggle.textContent = canExpand ? '❯' : ' ';
      if (canExpand) {
        toggle.style.transform = isExpanded ? 'rotate(90deg)' : 'rotate(0deg)';
        toggle.addEventListener('click', (e) => {
          e.stopPropagation();
          if (this.expandedNodes.has(node)) {
            this.expandedNodes.delete(node);
          } else {
            this.expandedNodes.add(node);
          }
          this.#update();
        });
      }
      row.append(toggle);

      // Label
      const label = document.createElement('span');
      label.className = 'label';
      label.textContent = node.label ?? node.id;

      const text = document.createElement('div');
      text.className = 'label-container';
      text.append(label);
      row.append(text);

      // Description
      if (node.description) {
        const description = document.createElement('span');
        description.className = 'description';
        description.textContent = node.description;

        text.append(description);
      }

      row.addEventListener('click', () => {
        this.selectNode(node, true);
        if (!canExpand) {
          return;
        }
        if (this.expandedNodes.has(node)) {
          this.expandedNodes.delete(node);
        } else {
          this.expandedNodes.add(node);
        }
        queueMicrotask(() => this.#update());
      });
      row.addEventListener('mousedown', (e) => {
        this._focusFromClick = true;
      });

      // Remove button
      if (this.enableRemove) {
        const remove = document.createElement('span');
        remove.className = 'remove';
        remove.dataset.remove = '';
        remove.textContent = '✕';

        const actions = document.createElement('span');
        actions.className = 'actions';
        actions.append(remove);

        row.append(actions);
      }

      tree.appendChild(row);

      if (isExpanded && node.children) {
        for (const child of node.children) {
          renderNode(child, depth + 1);
        }
      }
    };

    for (const root of this.nodes) {
      renderNode(root, 0);
    }
  }
}

customElements.define('macro-tree', MacroTree);
