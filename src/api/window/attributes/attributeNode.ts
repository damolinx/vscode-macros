import { MarkupNode } from '../node';

export type AttributeValue = string | number | boolean | null | undefined;

export interface AttributeNode extends MarkupNode {
  readonly role: 'attribute';
  readonly name: string;
  readonly value?: AttributeValue;
}
