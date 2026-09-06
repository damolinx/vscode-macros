import { Node } from '../node';
import { CodeStr } from '../scripts/code';
import { Script } from '../scripts/script';
import { MetaNode } from './metaNode';

export class ErrorRelayMeta implements MetaNode {
  public readonly kind = 'errorRelay';
  public readonly role = 'meta';

  constructor(public readonly enabled = false) {}

  expand(): Node[] {
    return [new Script(this.enabled ? ErrorRelayScript : ErrorConsoleScript, false)];
  }
}

export const ErrorRelayScript = `
      macro.error = (function() {
        const sendError = (err) => {
          console.error(err);
          vscode.postMessage({ type: 'macro:error', error: {
            message: err?.message ?? String(err),
            stack: err?.stack ?? null }});
        };
        window.addEventListener('error', (event) => sendError(event.error || event.message));
        window.addEventListener('unhandledrejection', (event) => sendError(event.reason));
        return sendError;
      })();` as CodeStr;

export const ErrorConsoleScript = `
      macro.error = console.error;
      window.addEventListener('error', (event) => console.error(event.error || event.message));
      window.addEventListener('unhandledrejection', (event) => console.erro(event.reason));` as CodeStr;
