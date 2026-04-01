import { Code, CodeStr, normalizeCode } from './code';
import { ScriptNode } from './scriptNode';

export class Script implements ScriptNode {
  public readonly role = 'script';
  public readonly kind = 'script';

  constructor(
    public readonly code: CodeStr,
    public readonly autoInvoke: boolean,
  ) {}

  public render(): string {
    return this.autoInvoke ? `(${this.code})();` : this.code;
  }
}

export function createScript(code: Code): Script {
  const { normalizedCode, autoInvoke } = normalizeCode(code);
  return new Script(normalizedCode, autoInvoke);
}
