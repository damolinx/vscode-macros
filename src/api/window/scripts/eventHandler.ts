import { Code, normalizeCode } from './code';
import { ScriptNode } from './scriptNode';

export type EventHandlerName = string & { _brandedEventHander: never };

export class EventHandler implements ScriptNode {
  public readonly kind = 'eventHandler';
  public readonly role = 'script';

  constructor(
    public readonly handlerName: EventHandlerName,
    public readonly code: string,
  ) {}

  public render(): string {
    return this.code;
  }
}

export function createEventHandler(handlerName: EventHandlerName, code: Code): EventHandler {
  const normalizedCode = normalizeCode(code);
  return new EventHandler(handlerName, normalizedCode);
}
