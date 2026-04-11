export type Role = 'attribute' | 'content' | 'element' | 'meta' | 'script' | 'style';

export interface Node {
  readonly kind: string;
  readonly role: Role;
}

export interface RenderableNode extends Node {
  render(): string;
}

export interface MarkupNode extends RenderableNode {
  readonly role: 'attribute' | 'element';
}

export interface TextNode extends RenderableNode {
  readonly role: 'content';
  readonly text: string;
}

export function isMarkup(n: Node): n is MarkupNode {
  const { renderKind } = n as any;
  return renderKind === 'attribute' || renderKind === 'element';
}
