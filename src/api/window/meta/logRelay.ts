import { Node } from '../node';
import { CodeStr } from '../scripts/code';
import { Script } from '../scripts/script';
import { MetaNode } from './metaNode';

export class LogRelayMeta implements MetaNode {
  public readonly kind = 'logRelay';
  public readonly role = 'meta';

  constructor(public readonly enabled = false) {}

  expand(): Node[] {
    return [new Script(this.enabled ? LogRelayScript : LogConsoleScript, false)];
  }
}

export const LogRelayScript = `
      macro.log = (function() {
        const sendLog = (level, msg, data) => {
          console[level]?.(msg, data);
          vscode.postMessage({ type: 'macro:log', level, message: String(msg), data });
        };
        return {
          error: (msg, data) => sendLog("error", msg, data),
          warn: (msg, data) => sendLog("warn", msg, data),
          info: (msg, data) => sendLog("info", msg, data),
          debug: (msg, data) => sendLog("debug", msg, data),
          trace: (msg, data) => sendLog("trace", msg, data),
        };
      })();` as CodeStr;

export const LogConsoleScript = `
      macro.log = console;` as CodeStr;
