import { ExtensionContext } from '../../../extensionContext';
import { parentUri, uriBasename } from '../../../utils/uri';
import { Execution } from '../execution';
import { getExecutionIdToken } from '../executionId';
import { MacroContextParams } from '../macroContext';

export abstract class Runner<TContext = unknown> {
  constructor(private readonly context: ExtensionContext) {}

  protected abstract createMacroContext(execution: Execution, params: MacroContextParams): TContext;

  public async run(execution: Execution): Promise<any> {
    const contextInitParams = {
      context: this.context,
      disposables: execution.macroDisposables,
      executionId: execution.id,
      startup: execution.startup,
      token: execution.cancellationToken,
      uri: execution.macro.uri,
    } as MacroContextParams;

    const context = this.createMacroContext(execution, contextInitParams);
    const runPromise = this.runInContext(execution, context);
    if (execution.snapshot.options.retained) {
      await Promise.all([
        runPromise,
        new Promise<never>((resolve) =>
          execution.cancellationToken.onCancellationRequested(resolve),
        ),
      ]);
    }

    const result = await runPromise;
    return result;
  }

  protected abstract runInContext(execution: Execution, context: TContext): Promise<any>;

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
