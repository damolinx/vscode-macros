import * as vscode from 'vscode';
import { Context } from '../../context';
import { CodeMacro } from '../macros/code/codeMacro';
import { CodeSnapshot } from '../macros/code/codeSnapshot';
import { ExecutionId } from './executionId';

export class Execution implements vscode.Disposable {
  private readonly cts: vscode.CancellationTokenSource;
  public readonly macroDisposables: vscode.Disposable[];
  private ts: number;

  public constructor(
    private readonly context: Context,
    public readonly id: ExecutionId,
    public readonly macro: CodeMacro,
    public readonly snapshot: CodeSnapshot,
    public readonly startup = false,
  ) {
    this.cts = new vscode.CancellationTokenSource();
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

  public get startedOn(): number {
    return this.ts;
  }

  public refreshStartedOn(): void {
    this.ts = Date.now();
  }
}
