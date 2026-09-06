import * as vscode from 'vscode';
import { ExtensionContext } from '../../extensionContext';
import { Macro } from '../macro';
import { MacroCode } from '../macroCode';
import { getExecutionId, ExecutionId } from './executionId';

export class Execution implements vscode.Disposable {
  public static async create(
    context: ExtensionContext,
    macro: Macro,
    params: { index: number; startup?: true },
  ): Promise<Execution> {
    const code = await macro.getCode();
    return new Execution(context, macro, code, params.index, params.startup);
  }

  private readonly cts: vscode.CancellationTokenSource;
  public readonly id: ExecutionId;
  public readonly macroDisposables: vscode.Disposable[];
  private ts: number;

  private constructor(
    private readonly context: ExtensionContext,
    public readonly macro: Macro,
    public readonly snapshot: MacroCode,
    index: number,
    public readonly startup?: true,
  ) {
    this.cts = new vscode.CancellationTokenSource();
    this.id = getExecutionId(macro.uri.path.split('/').slice(-2).join('/'), index, startup);
    this.macroDisposables = [];
    this.ts = Date.now();
  }

  dispose(): void {
    this.cts.dispose();
    vscode.Disposable.from(...this.macroDisposables).dispose();
    if (!this.snapshot.options.persistent && !this.snapshot.options.retained) {
      this.context.viewManagers.tree.releaseOwnedIds(this.id);
      this.context.viewManagers.web.releaseOwnedIds(this.id);
    }
  }

  public cancel(): void {
    this.cts.cancel();
  }

  public get cancellationToken(): vscode.CancellationToken {
    return this.cts.token;
  }

  public get code(): string {
    return this.snapshot.getRunnableCode();
  }

  public get startedOn(): number {
    return this.ts;
  }

  public refreshStartedOn(): void {
    this.ts = Date.now();
  }
}
