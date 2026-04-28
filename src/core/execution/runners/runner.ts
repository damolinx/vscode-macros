import { MacroLogOutputChannel } from '../../../api/macroLogOutputChannel';
import { ExtensionContext } from '../../../extensionContext';
import { parentUri, uriBasename } from '../../../utils/uri';
import { Execution } from '../execution';
import { getExecutionIdToken } from '../executionId';
import { MacroContextInitParams } from '../macroContext';

export abstract class Runner<TContext = unknown> {
  constructor(private readonly context: ExtensionContext) {}

  public async execute(execution: Execution): Promise<any> {
    const contextInitParams = this.getContextInitParams(execution);
    const context = this.getContext(execution, contextInitParams);
    const executePromise = this.executeInternal(execution, context);

    const result = await (execution.snapshot.options.retained
      ? Promise.all([
          executePromise,
          new Promise((resolve) => execution.cancellationToken.onCancellationRequested(resolve)),
        ])
      : executePromise);

    return result;
  }

  protected abstract executeInternal(execution: Execution, context: TContext): Promise<any>;

  protected abstract getContext(execution: Execution, params: MacroContextInitParams): TContext;

  protected getContextInitParams(execution: Execution): MacroContextInitParams {
    return {
      context: this.context,
      disposables: execution.macroDisposables,
      log: new MacroLogOutputChannel(execution.id as any, this.context),
      executionId: execution.id as any,
      startup: execution.startup,
      token: execution.cancellationToken,
      uri: execution.macro.uri,
      viewManagers: this.context.viewManagers,
    };
  }

  public getExecutionSourceName({ id, macro: { uri }, snapshot }: Execution): string {
    const parentName = uriBasename(parentUri(uri));
    const filename =
      snapshot.languageId === 'typescript'
        ? `[${getExecutionIdToken(id)}] ${parentName}/${uriBasename(uri, true)}.js`
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
