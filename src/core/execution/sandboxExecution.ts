import * as vscode from 'vscode';
import { ExtensionContext } from '../../extensionContext';
import { Macro } from '../macro';
import { MacroCode } from '../macroCode';
import { getSandboxExecutionId, SandboxExecutionId } from './sandboxExecutionId';

export class SandboxExecution implements vscode.Disposable {
  public static async create(
    context: ExtensionContext,
    macro: Macro,
    params: { index: number; startup?: true },
  ): Promise<SandboxExecution> {
    const code = await macro.getCode();
    return new SandboxExecution(context, macro, code, params.index, params.startup);
  }

  public readonly cts: vscode.CancellationTokenSource;
  public readonly id: SandboxExecutionId;
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
    this.id = getSandboxExecutionId(macro.uri.path.split('/').slice(-2).join('/'), index, startup);
    this.macroDisposables = [];
    this.ts = Date.now();
  }

  dispose() {
    this.cts.dispose();
    vscode.Disposable.from(...this.macroDisposables).dispose();
    if (!this.snapshot.options.persistent && !this.snapshot.options.retained) {
      this.context.viewManagers.tree.releaseOwnedIds(this.id);
      this.context.viewManagers.web.releaseOwnedIds(this.id);
    }
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
