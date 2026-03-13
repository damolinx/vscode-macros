import { RenderableNode } from '../node';

export interface ContentNode extends RenderableNode {
  readonly role: 'content';
  readonly text: string;
}
