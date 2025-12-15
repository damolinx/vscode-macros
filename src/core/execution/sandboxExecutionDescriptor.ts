import * as vscode from 'vscode';
import { Macro } from '../macro';
import { MacroCode } from '../macroCode';
import { getSandboxExecutionId, SandboxExecutionId } from './sandboxExecutionId';

export class SandboxExecutionDescriptor implements vscode.Disposable {
  public static async create(
    macro: Macro,
    { code, index, startup }: { code?: MacroCode; index: number; startup?: true },
  ): Promise<SandboxExecutionDescriptor> {
    return new SandboxExecutionDescriptor(macro, code ?? (await macro.getCode()), index, startup);
  }

  public readonly cts: vscode.CancellationTokenSource;
  public readonly id: SandboxExecutionId;
  public readonly macro: Macro;
  public readonly macroDisposables: vscode.Disposable[];
  public readonly snapshot: MacroCode;
  public readonly startup?: true;
  private ts: number;

  private constructor(macro: Macro, code: MacroCode, index: number, startup?: true) {
    this.cts = new vscode.CancellationTokenSource();
    this.id = getSandboxExecutionId(macro.uri.path.split('/').slice(-2).join('/'), index);
    this.macro = macro;
    this.macroDisposables = [];
    this.snapshot = code;
    this.startup = startup;
    this.ts = Date.now();
  }

  dispose() {
    this.cts.dispose();
    vscode.Disposable.from(...this.macroDisposables).dispose();
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
