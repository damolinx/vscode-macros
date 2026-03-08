import { ScriptNode } from './scriptNode';

export class Script implements ScriptNode {
  public readonly renderKind = 'script';
  public readonly kind = 'script';

  constructor(public readonly code: string) {}

  render(): string {
    return this.code;
  }
}

export function createScript(code: string): Script {
  return new Script(code);
}
