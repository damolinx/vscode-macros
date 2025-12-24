import { MacroLogOutputChannel } from '../../../api/macroLogOutputChannel';
import { ExtensionContext } from '../../../extensionContext';
import { parentUri, uriBasename } from '../../../utils/uri';
import { MacroContextInitParams } from '../macroRunContext';
import { SandboxExecutionDescriptor } from '../sandboxExecutionDescriptor';
import { getSandboxExecutionIdToken } from '../sandboxExecutionId';

export abstract class SandboxRunner<TContext = unknown> {
  private readonly context: ExtensionContext;

  constructor(context: ExtensionContext) {
    this.context = context;
  }

  public async execute(descriptor: SandboxExecutionDescriptor): Promise<any> {
    const contextInitParams = this.getContextInitParams(descriptor);
    const context = this.getContext(descriptor, contextInitParams);

    const executePromise = this.executeInternal(descriptor, context);

    const result = await (descriptor.snapshot.options.retained
      ? Promise.all([
          executePromise,
          new Promise((resolve) => descriptor.cts.token.onCancellationRequested(resolve)),
        ])
      : executePromise);

    return result;
  }

  protected abstract executeInternal(
    descriptor: SandboxExecutionDescriptor,
    context: TContext,
  ): Promise<any>;

  protected abstract getContext(
    descriptor: SandboxExecutionDescriptor,
    params: MacroContextInitParams,
  ): TContext;

  protected getContextInitParams(descriptor: SandboxExecutionDescriptor): MacroContextInitParams {
    return {
      disposables: descriptor.macroDisposables,
      log: new MacroLogOutputChannel(descriptor.id as any, this.context),
      executionId: descriptor.id as any,
      startup: descriptor.startup,
      token: descriptor.cts.token,
      uri: descriptor.macro.uri,
      viewManagers: {
        tree: this.context.treeViewManager,
        web: this.context.webviewManager,
      },
    };
  }

  public getExecutionSourceName(descriptor: SandboxExecutionDescriptor): string {
    const { uri } = descriptor.macro;
    const parentName = uriBasename(parentUri(uri));
    const filename =
      descriptor.snapshot.languageId === 'typescript'
        ? `[${getSandboxExecutionIdToken(descriptor.id)}] ${parentName}/${uriBasename(uri, true)}.js`
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
