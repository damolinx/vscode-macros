import { NaturalComparer } from '../../utils/ui';
import { Container, groupByContainerMode } from './elements/container';
import { BaseElementNode, ElementNode } from './elements/elementNode';
import { ExpandableMetaNode, DefaultExpansionContext } from './meta/metaNode';
import { isHtmlRenderable, Node, RenderableNode } from './node';
import { RendererScripts } from './renderers';
import { EventHandler } from './scripts/eventHandler';
import { ScriptNode } from './scripts/scriptNode';

export class Root extends BaseElementNode {
  private expanded: boolean;

  constructor(children: Node[]) {
    super('container', undefined, children);
    this.expanded = false;
  }

  expandMeta(
    nodes: Node[],
    context = new DefaultExpansionContext(),
    parent: ElementNode = this,
  ): void {
    for (const node of nodes) {
      switch (node.renderKind) {
        case 'element':
          if ('children' in node) {
            const elementNode = node as ElementNode;
            if (elementNode.children.length) {
              this.expandMeta(elementNode.children, context, elementNode);
            }
          }
          break;

        case 'meta':
          if ('expand' in node) {
            const expandableNode = node as ExpandableMetaNode;
            const expandedNodes = expandableNode.expand(context, parent);
            parent.children.push(...expandedNodes);
            this.expandMeta(expandedNodes, context, parent);
          }
          break;
      }
    }
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

  public override render(): string {
    if (!this.expanded) {
      this.expandMeta(this.children);
      this.expanded = true;
    }

    const renderableChildren = this.getChildren(isHtmlRenderable);
    const renderers = getRequiredRenderers(renderableChildren);

    return `
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
  }

  public toHtml(): string {
    return this.render();
  }
}

export function createRoot(...children: Node[]): Root {
  return new Root(children);
}

function getRequiredRenderers(renderableNodes: RenderableNode[]): ScriptNode[] {
  const renderers = new Map(
    Array.from(RendererScripts.entries()).map(([kind, script]) => [
      kind,
      { script, required: false },
    ]),
  );
  let remaining = renderers.size;

  recurse(renderableNodes);

  return Array.from(renderers.values())
    .filter((r) => r.required)
    .map((r) => r.script);

  function recurse(nodes: RenderableNode[]): void {
    for (const node of nodes) {
      const entry = renderers.get(node.kind);
      if (entry && !entry.required) {
        entry.required = true;
        if (--remaining == 0) {
          return;
        }
      }

      if (node.renderKind === 'element') {
        const elementNode = node as ElementNode;
        const children = elementNode.children.filter(isHtmlRenderable);
        if (children.length) {
          recurse(children);
        }
      }
    }
  }
}
