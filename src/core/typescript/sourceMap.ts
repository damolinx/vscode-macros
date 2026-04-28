import * as sm from 'source-map';
import * as sms from 'source-map-support';
import { ExtensionContext } from '../../extensionContext';
import { Lazy } from '../../utils/lazy';
import { getExecutionId } from '../execution/executionId';
import { Runner } from '../execution/runners/runner';

const smsSupport = new Lazy(({ sandboxManager }: ExtensionContext, runner: Runner) =>
  sms.install({
    environment: 'node',
    retrieveSourceMap: (source: string) => {
      const match = runner.matchTypeScriptSourceName(source);
      if (!match) {
        return null;
      }

      const executionId = getExecutionId(`${match.name}.ts`, match.index);
      const execution = sandboxManager.getExecution(executionId);
      if (!execution) {
        return null;
      }

      const map = extractInlineSourceMap(execution.code);
      if (!map) {
        return null;
      }

      return { url: execution.macro.uri.fsPath, map } as sms.UrlAndMap;
    },
  }),
);

export function ensureSourceMapSupport(context: ExtensionContext, runner: Runner): void {
  smsSupport.initialize(context, runner);
}

export function extractInlineSourceMap(code: string): sm.RawSourceMap | undefined {
  const regex = /\/\/# sourceMappingURL=data:application\/json;base64,([^\n]+)/;
  const match = code.match(regex);
  if (!match) {
    return;
  }

  const base64 = match[1];
  const json = Buffer.from(base64, 'base64').toString('utf8');
  return JSON.parse(json);
}
