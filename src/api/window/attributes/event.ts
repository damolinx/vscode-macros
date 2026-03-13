import { EventHandlerName } from '../scripts/eventHandler';
import { AttributeNode } from './attributeNode';

export class Event implements AttributeNode {
  public readonly kind = 'event';
  public readonly role = 'attribute';
  public readonly name: string;

  constructor(
    public readonly event: string,
    public readonly handlerName: EventHandlerName,
  ) {
    this.name = `data-on-${this.event}`;
  }

  public get value(): string {
    return this.handlerName;
  }

  public render(): string {
    return `${this.name}="${this.value}"`;
  }
}

export function createEvent(name: string, handlerName: EventHandlerName): Event {
  return new Event(name, handlerName);
}
