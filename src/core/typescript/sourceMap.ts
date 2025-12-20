import * as sm from 'source-map';
import * as sms from 'source-map-support';
import { ExtensionContext } from '../../extensionContext';
import { Lazy } from '../../utils/lazy';
import { SandboxRunner } from '../execution/runners/sandboxRunner';
import { getSandboxExecutionId } from '../execution/sandboxExecutionId';

const smsSupport = new Lazy(({ sandboxManager }: ExtensionContext, runner: SandboxRunner) =>
  sms.install({
    environment: 'node',
    retrieveSourceMap: (source) => {
      const match = runner.matchTypeScriptSourceName(source);
      if (!match) {
        return null;
      }

      const runId = getSandboxExecutionId(`${match.name}.ts`, match.index);
      const runDescriptor = sandboxManager.getExecution(runId);
      if (!runDescriptor) {
        return null;
      }

      const map = extractInlineSourceMap(runDescriptor.code);
      if (!map) {
        return null;
      }

      return { url: runDescriptor.macro.uri.fsPath, map } as sms.UrlAndMap;
    },
  }),
);

export function ensureSourceMapSupport(context: ExtensionContext, runner: SandboxRunner) {
  smsSupport.initialize(context, runner);
}

export function extractInlineSourceMap(code: string): sm.RawSourceMap | undefined {
  const regex = /\/\/# sourceMappingURL=data:application\/json;base64,([^\n]+)/;
  const match = code.match(regex);
  if (!match) {
    return undefined;
  }

  const base64 = match[1];
  const json = Buffer.from(base64, 'base64').toString('utf8');
  return JSON.parse(json);
}
