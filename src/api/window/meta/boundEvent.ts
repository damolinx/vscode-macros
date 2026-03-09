import { Event } from '../attributes/event';
import { Node, RenderableNode } from '../node';
import { Code, normalizeCode } from '../scripts/code';
import { EventHandler } from '../scripts/eventHandler';
import { ExpandableMetaNode, ExpansionContext } from './metaNode';

export class BoundEvent implements ExpandableMetaNode {
  public readonly kind = 'boundEvent';
  public readonly renderKind = 'meta';

  constructor(
    public readonly eventName: string,
    public readonly code: string,
  ) { }

  public expand(context: ExpansionContext, _parent: RenderableNode): Node[] {
    const id = context.nextId(this.kind);
    const handlerName = `__on_${this.eventName}$${id}`;

    return [new Event(this.eventName, handlerName), new EventHandler(handlerName, this.code)];
  }
}

export function createBoundEvent(eventName: string, code: Code): BoundEvent {
  const normalizedCode = normalizeCode(code);
  return new BoundEvent(eventName, normalizedCode);
}
