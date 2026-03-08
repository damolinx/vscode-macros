import { AttributeNode } from './attributeNode';

export class Event implements AttributeNode {
  public readonly kind = 'event';
  public readonly renderKind = 'attribute';

  constructor(
    public readonly name: string,
    public readonly handlerName: string,
  ) {}

  public render(): string {
    return `data-on-${this.name}="${this.handlerName}"`;
  }
}

export function createEvent(name: string, handlerName: string): Event {
  return new Event(name, handlerName);
}
