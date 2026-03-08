export type Kind =
  | 'attribute'
  | 'boundEvent'
  | 'button'
  | 'container'
  | 'event'
  | 'eventHandler'
  | 'input'
  | 'script'
  | 'text'
  | 'tree';

export type RenderKind = 'attribute' | 'content' | 'element' | 'meta' | 'script';

export type HtmlRenderKind = Extract<RenderKind, 'content' | 'element'>;

export interface Node {
  readonly kind: Kind;
  readonly renderKind: RenderKind;
}

export interface ParentNode extends Node {
  readonly children: Node[];
}

export interface RenderableNode extends Node {
  readonly renderKind: Exclude<RenderKind, 'meta'>;
  render(): string;
}

export function isHtmlRenderable(
  node: Node,
): node is RenderableNode & { renderKind: HtmlRenderKind } {
  return node.renderKind === 'element' || node.renderKind === 'content';
}
