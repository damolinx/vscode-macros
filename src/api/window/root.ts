import { NaturalComparer } from '../../utils/ui';
import { Container, groupByContainerMode } from './elements/container';
import { BaseElementNode, ElementNode } from './elements/elementNode';
import { ExpandableMetaNode, DefaultExpansionContext } from './meta/metaNode';
import { isHtmlRenderable, Node, ParentNode, RenderableNode } from './node';
import { resolveRenderers } from './renderers';
import { EventHandler } from './scripts/eventHandler';
import { ScriptNode } from './scripts/scriptNode';

export class Root extends BaseElementNode {
  #cachedHtml?: string;
  #metaExpanded: boolean;

  constructor(children: Node[]) {
    super('container', undefined, children);
    this.#metaExpanded = false;
  }

  private expandMeta(
    nodes: Node[],
    context = new DefaultExpansionContext(),
    parent: ParentNode = this,
  ): void {
    for (const node of [...nodes]) {
      switch (node.renderKind) {
        case 'element': {
          const elementNode = node as ElementNode;
          if (elementNode.children.length) {
            this.expandMeta(elementNode.children, context, elementNode);
          }
          break;
        }

        case 'meta':
          if ('expand' in node) {
            const expandedNodes = (node as ExpandableMetaNode).expand(context);
            const index = parent.children.indexOf(node);
            if (index !== -1) {
              parent.children.splice(index, 1, ...expandedNodes);
            }
            this.expandMeta(expandedNodes, context, parent);
          }
          break;
      }
    }
  }

  public override render(): string {
    if (this.#cachedHtml !== undefined) {
      return this.#cachedHtml;
    }

    if (!this.#metaExpanded) {
      this.expandMeta(this.children);
      this.#metaExpanded = true;
    }

    const renderableChildren = this.getChildren(isHtmlRenderable);
    const renderers = resolveRenderers(renderableChildren);

    this.#cachedHtml = this.buildHtml(renderableChildren, renderers);
    return this.#cachedHtml;
  }

  private renderBody(elementChildren: RenderableNode[]): string {
    const containers = this.getChildrenByKind<Container>('container');
    if (!containers.length) {
      return elementChildren.map((c) => c.render()).join('\n');
    }

    const { fixed, scrollable, other } = groupByContainerMode(elementChildren);
    const fixedHtml = fixed.map((container) => container.render()).join('\n');
    const rest = [...scrollable, ...other];
    const restHtml = rest.length
      ? `<div class="macro-scrollable">\n${rest.map((container) => container.render()).join('\n')}\n</div>`
      : '';

    return `${fixedHtml}\n${restHtml}`;
  }

  private renderScripts(): string {
    const eventHandlers: EventHandler[] = [];
    const scripts = this.getChildren<ScriptNode>(
      (c): c is ScriptNode => {
        if (c.renderKind !== 'script') {
          return false;
        }
        if (c.kind === 'eventHandler') {
          eventHandlers.push(c as EventHandler);
          return false;
        }
        return true;
      },
      { recursive: true },
    );

    if (!eventHandlers.length && !scripts.length) {
      return '';
    }

    let scriptHtml = '      const vscode = acquireVsCodeApi();';
    if (eventHandlers.length) {
      scriptHtml += `
      const localHandlers = {};
      window.addEventListener("macro-event", (e) => {
        localHandlers[e.detail.handlerName]?.(e.detail);
      });

      ${eventHandlers
          .sort((a, b) => NaturalComparer.compare(a.handlerName, b.handlerName))
          .map((handler) => `localHandlers["${handler.handlerName}"] = ${handler.code};`)
          .join('\n      ')}`;
    }

    if (scripts.length) {
      scriptHtml += `\n      ${scripts.map((s) => s.render()).join('\n      ')}`;
    }
    return scriptHtml;
  }

  public toHtml(): string {
    return this.render();
  }

  private buildHtml(
    renderableChildren: RenderableNode[],
    renderers: ScriptNode[],
  ): string {
    const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <style>
    html, body {
      height: 100%;
      margin: 0;
      padding: 0;
      scrollbar-color: var(--vscode-scrollbarSlider-background) transparent;
      user-select: none;
    }

    body {
      background: var(--vscode-sideBar-background);
      color: var(--vscode-foreground);
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);

      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 6px;
    }

    macro-container[mode="fixed"] {
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex: 0 1 auto;
    }

    macro-container[mode="scrollable"] {
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex: 1 1 auto;
    }

    macro-container:not([mode]) {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .macro-scrollable {
      display: flex;
      flex-direction: column;
      flex: 1 1 auto;
      overflow: auto;
    }
  </style>
  <body>
${this.renderBody(renderableChildren)}
    <script>
${renderers.map((s) => s.render()).join('\n')}
${this.renderScripts()}
    </script>
  </body>
</html>`;
    return html;
  }
}

export function createRoot(...children: Node[]): Root {
  return new Root(children);
}
