import * as vscode from 'vscode';
import { ExtensionContext } from '../../extensionContext';
import { Macro } from '../macro';
import { getMacroId, MacroId } from '../macroId';
import { Execution } from './execution';
import { ExecutionId } from './executionId';
import { Executor } from './executors/executor';
import { ExecutorFactory } from './executors/executorFactory';

export class SandboxManager implements vscode.Disposable {
  private readonly context: ExtensionContext;
  private readonly executorMap: Map<MacroId, Executor>;
  private readonly onExecutionEndEmitter: vscode.EventEmitter<Execution>;
  private readonly onExecutionStartEmitter: vscode.EventEmitter<Execution>;

  constructor(context: ExtensionContext) {
    this.context = context;
    this.executorMap = new Map();
    this.onExecutionEndEmitter = new vscode.EventEmitter();
    this.onExecutionStartEmitter = new vscode.EventEmitter();
  }

  dispose() {
    vscode.Disposable.from(...this.executorMap.values()).dispose();
    this.executorMap.clear();

    this.onExecutionStartEmitter.dispose();
    this.onExecutionEndEmitter.dispose();
  }

  public cancel(target: Macro | MacroId | vscode.Uri): Execution[] {
    const executor = this.getExecutor(target as any);
    if (!executor) {
      return [];
    }
    return executor.cancelAll();
  }

  public ensureExecutor(macro: Macro): Promise<Executor>;
  public ensureExecutor(uri: vscode.Uri): Promise<Executor>;
  public async ensureExecutor(target: vscode.Uri | Macro): Promise<Executor> {
    let macro: Macro | undefined;
    const macroId = target instanceof Macro ? (macro = target).id : getMacroId(target);
    let executor = this.executorMap.get(macroId);
    if (!executor) {
      executor = await ExecutorFactory.create(
        this.context,
        macro ?? new Macro(target as vscode.Uri, macroId),
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

  public getExecutionCount(target: Macro | MacroId | vscode.Uri): number {
    const executor = this.getExecutor(target as any);
    return executor?.executionCount ?? 0;
  }

  public getExecutor(macro: Macro): Executor | undefined;
  public getExecutor(macroId: MacroId): Executor | undefined;
  public getExecutor(uri: vscode.Uri): Executor | undefined;
  public getExecutor(target: Macro | MacroId | vscode.Uri): Executor | undefined {
    let macroId: MacroId;
    if (target instanceof Macro) {
      macroId = target.id;
    } else if (target instanceof vscode.Uri) {
      macroId = getMacroId(target);
    } else {
      macroId = target as MacroId;
    }

    return this.executorMap.get(macroId);
  }

  public get onExecutionEnd(): vscode.Event<Execution> {
    return this.onExecutionEndEmitter.event;
  }

  public get onExecutionStart(): vscode.Event<Execution> {
    return this.onExecutionStartEmitter.event;
  }

  public removeExecutor(macro: Macro): Executor | undefined;
  public removeExecutor(uri: vscode.Uri): Executor | undefined;
  public removeExecutor(target: vscode.Uri | Macro): Executor | undefined {
    const macroId = target instanceof Macro ? target.id : getMacroId(target);
    const executor = this.executorMap.get(macroId);
    if (executor) {
      executor.dispose();
      this.executorMap.delete(macroId);
    }
    return executor;
  }
}
