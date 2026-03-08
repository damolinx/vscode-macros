import { Node, RenderableNode } from '../node';

export type MetaKind = 'boundEvent' | 'eventHandler';

export interface MetaNode extends Node {
  readonly kind: MetaKind;
  readonly renderKind: 'meta';
}

export interface ExpandableMetaNode extends MetaNode {
  expand(context: ExpansionContext, parent: RenderableNode): Node[];
}

export interface ExpansionContext {
  nextId(key?: string): number;
}

export class DefaultExpansionContext implements ExpansionContext {
  private readonly counters: Map<string, number>;
  constructor() {
    this.counters = new Map();
  }

  public nextId(key = 'default'): number {
    const current = this.counters.get(key) ?? 0;
    const next = current + 1;
    this.counters.set(key, next);
    return next;
  }
}
