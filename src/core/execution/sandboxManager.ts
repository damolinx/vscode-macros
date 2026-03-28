import * as vscode from 'vscode';
import { ExtensionContext } from '../../extensionContext';
import { Macro } from '../macro';
import { getMacroId, MacroId } from '../macroId';
import { SandboxExecutor } from './executors/sandboxExecutor';
import { SandboxExecutorFactory } from './executors/sandboxExecutorFactory';
import { SandboxExecution } from './sandboxExecution';
import { SandboxExecutionId } from './sandboxExecutionId';

export class SandboxManager implements vscode.Disposable {
  private readonly context: ExtensionContext;
  private readonly executorMap: Map<MacroId, SandboxExecutor>;
  private readonly onExecutionEndEmitter: vscode.EventEmitter<SandboxExecution>;
  private readonly onExecutionStartEmitter: vscode.EventEmitter<SandboxExecution>;

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

  public cancel(target: Macro | MacroId | vscode.Uri): SandboxExecution[] {
    const executor = this.getExecutor(target as any);
    if (!executor) {
      return [];
    }
    return executor.cancel();
  }

  public ensureExecutor(macro: Macro): Promise<SandboxExecutor>;
  public ensureExecutor(uri: vscode.Uri): Promise<SandboxExecutor>;
  public async ensureExecutor(target: vscode.Uri | Macro): Promise<SandboxExecutor> {
    let macro: Macro | undefined;
    const macroId = target instanceof Macro ? (macro = target).id : getMacroId(target);
    let executor = this.executorMap.get(macroId);
    if (!executor) {
      executor = await SandboxExecutorFactory.create(
        this.context,
        macro ?? new Macro(target as vscode.Uri, macroId),
      );
      executor.onExecutionStart((descriptor) => this.onExecutionStartEmitter.fire(descriptor));
      executor.onExecutionEnd((descriptor) => this.onExecutionEndEmitter.fire(descriptor));
      this.executorMap.set(macroId, executor);
    }
    return executor;
  }

  public get executions(): SandboxExecution[] {
    return [...this.executorMap.values()].flatMap((runner) => [...runner.executions]);
  }

  public get executors(): SandboxExecutor[] {
    return Array.from(this.executorMap.values());
  }

  public getExecution(id: SandboxExecutionId): SandboxExecution | undefined {
    for (const executor of this.executors.values()) {
      const execution = executor.getExecution(id);
      if (execution) {
        return execution;
      }
    }

    return;
  }

  public getExecutor(macro: Macro): SandboxExecutor | undefined;
  public getExecutor(macroId: MacroId): SandboxExecutor | undefined;
  public getExecutor(uri: vscode.Uri): SandboxExecutor | undefined;
  public getExecutor(target: Macro | MacroId | vscode.Uri): SandboxExecutor | undefined {
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

  public isRunning(target: Macro | MacroId | vscode.Uri): boolean {
    const executor = this.getExecutor(target as any);
    return !!executor?.isRunning();
  }

  public get onExecutionEnd(): vscode.Event<SandboxExecution> {
    return this.onExecutionEndEmitter.event;
  }

  public get onExecutionStart(): vscode.Event<SandboxExecution> {
    return this.onExecutionStartEmitter.event;
  }

  public removeExecutor(macro: Macro): SandboxExecutor | undefined;
  public removeExecutor(uri: vscode.Uri): SandboxExecutor | undefined;
  public removeExecutor(target: vscode.Uri | Macro): SandboxExecutor | undefined {
    const macroId = target instanceof Macro ? target.id : getMacroId(target);
    const executor = this.executorMap.get(macroId);
    if (executor) {
      executor.dispose();
      this.executorMap.delete(macroId);
    }
    return executor;
  }
}
