import { Code, normalizeCode } from './code';
import { ScriptNode } from './scriptNode';

export class EventHandler implements ScriptNode {
  public readonly kind = 'eventHandler';
  public readonly renderKind = 'script';

  constructor(
    public readonly handlerName: string,
    public readonly code: string,
  ) {}

  render(): string {
    return this.code;
  }
}

export function createEventHandler(handlerName: string, code: Code): EventHandler {
  const normalizedCode = normalizeCode(code);
  return new EventHandler(handlerName, normalizedCode);
}
