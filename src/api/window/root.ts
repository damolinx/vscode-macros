import { NaturalComparer } from '../../utils/ui';
import { BaseElementNode } from './elements/baseElementNode';
import { createNodeFactory } from './elements/common';
import { Container } from './elements/container';
import { ElementNode, ElementNodeOptions } from './elements/elementNode';
import { getLayout } from './layout';
import { ErrorRelayMeta } from './meta/errorRelay';
import { ExpansionContext } from './meta/expansionContext';
import { MetaNode } from './meta/metaNode';
import { ProgressMeta } from './meta/progressMeta';
import { Node, RenderableNode } from './node';
import { resolveRenderers } from './renderers';
import { EventHandler } from './scripts/eventHandler';
import { ScriptNode } from './scripts/scriptNode';
import { Style } from './style/style';

export interface RootOptions extends ElementNodeOptions {
  id?: never;
  errorRelay?: false;
  progress?: true;
}

export class Root extends BaseElementNode<RootOptions> {
  #cachedHtml?: string;
  #metaExpanded: boolean;

  constructor(options: RootOptions | undefined, children: Node[]) {
    super('container', options, children);
    this.#metaExpanded = false;
  }

  public get enableErrorRelay(): boolean {
    return this.options?.errorRelay !== false;
  }

  private expandMeta(
    nodes: Node[],
    context = new ExpansionContext(),
    parent: ElementNode = this,
  ): void {
    for (const node of [...nodes]) {
      switch (node.role) {
        case 'element':
          {
            const elementNode = node as ElementNode;
            if (elementNode.children.length) {
              this.expandMeta(elementNode.children, context, elementNode);
            }
          }
          break;

        case 'meta':
          {
            const expandedNodes = (node as MetaNode).expand(context);
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
      if (this.enableErrorRelay) {
        this.children.unshift(new ErrorRelayMeta());
      }
      if (this.options?.progress) {
        this.children.unshift(new ProgressMeta());
      }

      this.expandMeta(this.children);
      this.#metaExpanded = true;
    }

    const renderableChildren = this.getChildren((c): c is RenderableNode =>
      ['content', 'element'].includes(c.role),
    );
    const renderers = resolveRenderers(renderableChildren);

    this.#cachedHtml = this.buildHtml(renderableChildren, renderers);
    return this.#cachedHtml;
  }

  private renderBody(elementChildren: RenderableNode[]): string {
    const { decorations, fixed, scrollable, other } = getLayout(elementChildren);
    const containers: string[] = [];
    if (decorations.length) {
      containers.push(...decorations.map((node) => node.render()));
    }
    if (fixed.length) {
      containers.push(...fixed.map((container) => container.render()));
    }
    const rendereredScrollable = scrollable.map((container) => container.render());
    if (other.length) {
      containers.push(new Container({ mode: 'fixed' }, other).render());
    }
    containers.push(`<div class="macro-scrollable">\n${rendereredScrollable.join('\n')}\n</div>`);

    return containers.join('\n');
  }

  private renderScripts(): string {
    const { eventHandlers, scripts } = this.getChildrenByRole<ScriptNode>('script', {
      recursive: true,
    }).reduce(
      (acc, script) => {
        if (script.kind === 'eventHandler') {
          acc.eventHandlers.push(script as EventHandler);
        } else {
          acc.scripts.push(script);
        }
        return acc;
      },
      { eventHandlers: [] as EventHandler[], scripts: [] as ScriptNode[] },
    );

    const scriptLines = ['window.vscode = acquireVsCodeApi();', 'window.macro = {};'];

    if (eventHandlers.length) {
      scriptLines.push(
        'const localHandlers = {};',
        'window.addEventListener("macro-event", ({detail}) => {',
        '  const handler = localHandlers[detail.handlerName];',
        '  if (!handler) { return; }',
      );

      if (this.enableErrorRelay) {
        scriptLines.push(
          '  try {',
          '    const result = handler(detail);',
          '    result?.catch?.((err) => window.macro.error(err));',
          '  } catch(err) {',
          '    window.macro.error(err);',
          '  }',
        );
      } else {
        scriptLines.push('  handler(detail);');
      }
      scriptLines.push('});');
      scriptLines.push(
        ...eventHandlers
          .sort((a, b) => NaturalComparer.compare(a.handlerName, b.handlerName))
          .map((handler) => `localHandlers["${handler.handlerName}"] = ${handler.render()};`),
      );
    }

    scriptLines.push(...scripts.map((script) => script.render()));
    return `      ${scriptLines.join('\n      ')}`;
  }

  private renderStyle(): string {
    const styleScripts = this.getChildrenByRole<Style>('style', { recursive: true });
    return styleScripts.map((s) => s.render()).join('\n    ');
  }

  public toHtml(): string {
    return this.render();
  }

  private buildHtml(renderableChildren: RenderableNode[], renderers: ScriptNode[]): string {
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
${this.renderStyle()}
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

export const createRoot = createNodeFactory<RootOptions, Root>(Root);
