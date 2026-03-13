import { RenderableNode } from '../node';

export interface ScriptNode extends RenderableNode {
  readonly role: 'script';
}
