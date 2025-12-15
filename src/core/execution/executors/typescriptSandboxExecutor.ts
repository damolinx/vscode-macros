import * as sms from 'source-map-support';
import { ExtensionContext } from '../../../extensionContext';
import { Lazy } from '../../../utils/lazy';
import { extractInlineSourceMap } from '../../../utils/typescript';
import { Macro } from '../../macro';
import { SandboxRunner } from '../runners/sandboxRunner';
import { getSandboxExecutionId } from '../sandboxExecutionId';
import { SandboxExecutor } from './sandboxExecutor';

export class TypeScriptSandboxExecutor extends SandboxExecutor {
  private static readonly smsSupport = new Lazy(
    ({ sandboxManager }: ExtensionContext, runner: SandboxRunner) =>
      sms.install({
        retrieveSourceMap: (source) => {
          let sourceMap: sms.UrlAndMap | null = null;
          const match = runner.matchTypeScriptSourceName(source);
          if (match) {
            const runId = getSandboxExecutionId(`${match.name}.ts`, match.index);
            const runDescriptor = sandboxManager.getExecution(runId);
            if (runDescriptor) {
              sourceMap = {
                url: runDescriptor.macro.uri.fsPath,
                map: extractInlineSourceMap(runDescriptor.code),
              } as sms.UrlAndMap;
            }
          }

          return sourceMap;
        },
      }),
  );

  constructor(context: ExtensionContext, macro: Macro) {
    super(context, macro);
    TypeScriptSandboxExecutor.smsSupport.initialize(context, this.runner);
  }
}
