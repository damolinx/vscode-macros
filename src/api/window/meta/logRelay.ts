import { Node } from '../node';
import { CodeStr } from '../scripts/code';
import { Script } from '../scripts/script';
import { MetaNode } from './metaNode';

export class LogRelayMeta implements MetaNode {
  public readonly kind = 'logRelay';
  public readonly role = 'meta';

  expand(): Node[] {
    return [new Script(LogRelayScript, false)];
  }
}

export const LogRelayScript = `
      macro.log = (function() {
        const sendLog = (level, message, data) => {
          vscode.postMessage({
            type: 'macro:log',
            level,
            message: String(message),
            data: data ?? null,
          });
        };
        return {
          error: (msg, data) => sendLog("error", msg, data),
          warn: (msg, data) => sendLog("warn", msg, data),
          info: (msg, data) => sendLog("info", msg, data),
          debug: (msg, data) => sendLog("debug", msg, data),
          trace: (msg, data) => sendLog("trace", msg, data),
        };
      })();` as CodeStr;
