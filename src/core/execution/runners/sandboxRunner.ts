import { MacroLogOutputChannel } from '../../../api/macroLogOutputChannel';
import { ExtensionContext } from '../../../extensionContext';
import { parentUri, uriBasename } from '../../../utils/uri';
import { MacroContextInitParams } from '../macroRunContext';
import { SandboxExecution } from '../sandboxExecution';
import { getSandboxExecutionIdToken } from '../sandboxExecutionId';

export abstract class SandboxRunner<TContext = unknown> {
  private readonly context: ExtensionContext;

  constructor(context: ExtensionContext) {
    this.context = context;
  }

  public async execute(execution: SandboxExecution): Promise<any> {
    const contextInitParams = this.getContextInitParams(execution);
    const context = this.getContext(execution, contextInitParams);
    const executePromise = this.executeInternal(execution, context);

    const result = await (execution.snapshot.options.retained
      ? Promise.all([
          executePromise,
          new Promise((resolve) => execution.cts.token.onCancellationRequested(resolve)),
        ])
      : executePromise);

    return result;
  }

  protected abstract executeInternal(execution: SandboxExecution, context: TContext): Promise<any>;

  protected abstract getContext(
    execution: SandboxExecution,
    params: MacroContextInitParams,
  ): TContext;

  protected getContextInitParams(execution: SandboxExecution): MacroContextInitParams {
    return {
      context: this.context,
      disposables: execution.macroDisposables,
      log: new MacroLogOutputChannel(execution.id as any, this.context),
      executionId: execution.id as any,
      startup: execution.startup,
      token: execution.cts.token,
      uri: execution.macro.uri,
      viewManagers: this.context.viewManagers,
    };
  }

  public getExecutionSourceName({ id, macro: { uri }, snapshot }: SandboxExecution): string {
    const parentName = uriBasename(parentUri(uri));
    const filename =
      snapshot.languageId === 'typescript'
        ? `[${getSandboxExecutionIdToken(id)}] ${parentName}/${uriBasename(uri, true)}.js`
        : `${parentName}/${uriBasename(uri)}`;
    return filename;
  }

  public matchTypeScriptSourceName(str: string): { name: string; index: string } | undefined {
    // This should match `getExecutionSourceName` format.
    const match = str.match(/^\[@(startup|\d+)\]\s(.+?)\.js$/);
    return match ? { name: match[2], index: match[1] } : undefined;
  }

  public abstract resetSharedContext(): void;
}
