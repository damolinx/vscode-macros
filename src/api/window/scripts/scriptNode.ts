import { Kind, RenderableNode } from '../node';

export type ScriptKind = Extract<Kind, 'eventHandler' | 'script'>;

export interface ScriptNode extends RenderableNode {
  readonly kind: ScriptKind;
  readonly renderKind: 'script';
}
