import { RenderableNode } from '../node';

export interface StyleNode extends RenderableNode {
  readonly role: 'style';
  readonly style: string;
}
