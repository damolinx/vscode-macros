import { Node } from '../node';
import { Script } from '../scripts/script';
import { MetaNode } from './metaNode';

export class ErrorRelayMeta implements MetaNode {
  public readonly kind = 'errorRelay';
  public readonly role = 'meta';

  expand(): Node[] {
    return [new Script(getErrorRelayScript())];
  }
}

function getErrorRelayScript(): string {
  return `
    (function() {
      window.macro.error = function (err) {
        vscode.postMessage({
          type: 'macro:error',
          error: {
            message: err?.message ?? String(err),
            stack: err?.stack ?? null,
          }
        });
      };

      window.addEventListener('error', (event) => {
        window.macro.error(event.error || event.message);
      });

      window.addEventListener('unhandledrejection', (event) => {
        window.macro.error(event.reason);
      });
    })();`;
}
