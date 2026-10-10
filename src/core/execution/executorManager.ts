import * as vscode from 'vscode';
import { ExtensionContext } from '../../extensionContext';
import { CodeMacro } from '../macros/code/codeMacro';
import { getMacroId, CodeMacroId } from '../macros/code/codeMacroId';
import { Execution } from './execution';
import { ExecutionId } from './executionId';
import { Executor } from './executors/executor';
import { ExecutorFactory } from './executors/executorFactory';

export class ExecutorManager implements vscode.Disposable {
  private readonly executorMap: Map<CodeMacroId, Executor>;
  private readonly onExecutionEndEmitter: vscode.EventEmitter<Execution>;
  private readonly onExecutionStartEmitter: vscode.EventEmitter<Execution>;

  constructor(private readonly context: ExtensionContext) {
    this.executorMap = new Map();
    this.onExecutionEndEmitter = new vscode.EventEmitter();
    this.onExecutionStartEmitter = new vscode.EventEmitter();
  }

  dispose(): void {
    vscode.Disposable.from(...this.executorMap.values()).dispose();
    this.executorMap.clear();

    this.onExecutionStartEmitter.dispose();
    this.onExecutionEndEmitter.dispose();
  }

  public cancel(target: CodeMacro | CodeMacroId | vscode.Uri): Execution[] {
    const executor = this.getExecutor(target as any);
    if (!executor) {
      return [];
    }
    return executor.cancelAll();
  }

  public ensureExecutor(macro: CodeMacro): Promise<Executor>;
  public ensureExecutor(uri: vscode.Uri): Promise<Executor>;
  public async ensureExecutor(target: vscode.Uri | CodeMacro): Promise<Executor> {
    let macro: CodeMacro | undefined;
    const macroId = target instanceof CodeMacro ? (macro = target).id : getMacroId(target);
    let executor = this.executorMap.get(macroId);
    if (!executor) {
      executor = await ExecutorFactory.create(
        this.context,
        macro ?? new CodeMacro(target as vscode.Uri, macroId),
      );
      executor.onExecutionStart((execution) => this.onExecutionStartEmitter.fire(execution));
      executor.onExecutionEnd((execution) => this.onExecutionEndEmitter.fire(execution));
      this.executorMap.set(macroId, executor);
    }
    return executor;
  }

  public get executions(): Execution[] {
    return [...this.executorMap.values()].flatMap((runner) => [...runner.executions]);
  }

  public get executors(): Executor[] {
    return Array.from(this.executorMap.values());
  }

  public getExecution(id: ExecutionId): Execution | undefined {
    for (const executor of this.executors.values()) {
      const execution = executor.getExecution(id);
      if (execution) {
        return execution;
      }
    }

    return;
  }

  public getExecutionCount(target: CodeMacro | CodeMacroId | vscode.Uri): number {
    const executor = this.getExecutor(target as any);
    return executor?.executionCount ?? 0;
  }

  public getExecutor(macro: CodeMacro): Executor | undefined;
  public getExecutor(macroId: CodeMacroId): Executor | undefined;
  public getExecutor(uri: vscode.Uri): Executor | undefined;
  public getExecutor(target: CodeMacro | CodeMacroId | vscode.Uri): Executor | undefined {
    let macroId: CodeMacroId;
    if (target instanceof CodeMacro) {
      macroId = target.id;
    } else if (target instanceof vscode.Uri) {
      macroId = getMacroId(target);
    } else {
      macroId = target as CodeMacroId;
    }

    return this.executorMap.get(macroId);
  }

  public get onExecutionEnd(): vscode.Event<Execution> {
    return this.onExecutionEndEmitter.event;
  }

  public get onExecutionStart(): vscode.Event<Execution> {
    return this.onExecutionStartEmitter.event;
  }

  public removeExecutor(macro: CodeMacro): Executor | undefined;
  public removeExecutor(uri: vscode.Uri): Executor | undefined;
  public removeExecutor(target: vscode.Uri | CodeMacro): Executor | undefined {
    const macroId = target instanceof CodeMacro ? target.id : getMacroId(target);
    const executor = this.executorMap.get(macroId);
    if (executor) {
      executor.dispose();
      this.executorMap.delete(macroId);
    }
    return executor;
  }
}
