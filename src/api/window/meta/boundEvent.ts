import { Event } from '../attributes/event';
import { Node } from '../node';
import { Code, CodeStr, normalizeCode } from '../scripts/code';
import { EventHandler, EventHandlerName } from '../scripts/eventHandler';
import { ExpansionContext } from './expansionContext';
import { MetaNode } from './metaNode';

export class BoundEvent implements MetaNode {
  public readonly kind = 'boundEvent';
  public readonly role = 'meta';

  constructor(
    public readonly event: string,
    public readonly code: CodeStr,
  ) {}

  public expand(context: ExpansionContext): Node[] {
    const id = context.nextId(this.kind);
    const handlerName = `__on_${this.event}$${id}` as EventHandlerName;

    return [new Event(this.event, handlerName), new EventHandler(handlerName, this.code)];
  }
}

export function createBoundEvent(eventName: string, code: Code): BoundEvent {
  const { normalizedCode } = normalizeCode(code, eventName);
  return new BoundEvent(eventName, normalizedCode);
}
