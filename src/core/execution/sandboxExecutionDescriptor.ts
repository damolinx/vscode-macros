import * as vscode from 'vscode';
import { ExtensionContext } from '../../extensionContext';
import { Macro } from '../macro';
import { MacroCode } from '../macroCode';
import { getSandboxExecutionId, SandboxExecutionId } from './sandboxExecutionId';

export class SandboxExecutionDescriptor implements vscode.Disposable {
  public static async create(
    context: ExtensionContext,
    macro: Macro,
    params: { code?: MacroCode; index: number; startup?: true },
  ): Promise<SandboxExecutionDescriptor> {
    const code = params.code ?? (await macro.getCode());
    return new SandboxExecutionDescriptor(context, macro, code, params.index, params.startup);
  }

  private readonly context: ExtensionContext;
  public readonly cts: vscode.CancellationTokenSource;
  public readonly id: SandboxExecutionId;
  public readonly macro: Macro;
  public readonly macroDisposables: vscode.Disposable[];
  public readonly snapshot: MacroCode;
  public readonly startup?: true;
  private ts: number;

  private constructor(
    context: ExtensionContext,
    macro: Macro,
    code: MacroCode,
    index: number,
    startup?: true,
  ) {
    this.context = context;
    this.cts = new vscode.CancellationTokenSource();
    this.id = getSandboxExecutionId(macro.uri.path.split('/').slice(-2).join('/'), index, startup);
    this.macro = macro;
    this.macroDisposables = [];
    this.snapshot = code;
    this.startup = startup;
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
