// export type Kind =
//   | 'attribute'
//   | 'boundEvent'
//   | 'button'
//   | 'container'
//   | 'event'
//   | 'eventHandler'
//   | 'input'
//   | 'progress'
//   | 'script'
//   | 'style'
//   | 'text'
//   | 'tree';

// export type RenderKind =
//   | 'attribute'
//   | 'content'
//   | 'decoration'
//   | 'element'
//   | 'meta'
//   | 'script'
//   | 'style';

// export interface Node {
//   readonly kind: Kind;
//   readonly renderKind: RenderKind;
// }

// export interface ParentNode extends Node {
//   readonly children: Node[];
// }

// export interface RenderableNode extends Node {
//   readonly renderKind: Exclude<RenderKind, 'meta'>;
//   render(): string;
// }

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
