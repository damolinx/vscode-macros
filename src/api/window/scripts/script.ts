import { ScriptNode } from './scriptNode';

export class Script implements ScriptNode {
  public readonly role = 'script';
  public readonly kind = 'script';

  constructor(private readonly code: string | (() => string)) {}

  public render(): string {
    return typeof this.code === 'function' ? this.code() : this.code;
  }
}

export function createScript(code: string | (() => string)): Script {
  return new Script(code);
}
