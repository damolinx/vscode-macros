import { Kind, RenderableNode } from '../node';

export type AttributeKind = Extract<Kind, 'attribute' | 'event'>;

export interface AttributeNode extends RenderableNode {
  readonly kind: AttributeKind;
  readonly renderKind: 'attribute';
}
