import * as vscode from 'vscode';
import { ExtensionContext } from '../../../extensionContext';
import { CodeMacro } from '../../macros/code/codeMacro';
import { CodeSnapshot } from '../../macros/code/codeSnapshot';
import { Execution } from '../execution';
import { ExecutionId, getExecutionIdFromUri } from '../executionId';
import { Runner } from '../runners/runner';
import { RunnerFactory } from '../runners/runnerFactory';
import { SingletonMacroAlreadyRunningError } from './errors';

type ExecuteErrorHandler = (
  error: Error,
  info: {
    executionId: ExecutionId;
    snapshot: CodeSnapshot;
  },
) => Promise<void> | void;

export class Executor implements vscode.Disposable {
  private executionIndex: number;
  private readonly executionMap: Map<ExecutionId, Execution>;
  private readonly onExecutionEndEmitter: vscode.EventEmitter<Execution>;
  private readonly onExecutionStartEmitter: vscode.EventEmitter<Execution>;
  protected readonly runner: Runner;

  constructor(
    protected readonly context: ExtensionContext,
    public readonly macro: CodeMacro,
  ) {
    this.executionMap = new Map();
    this.executionIndex = 0;
    this.onExecutionEndEmitter = new vscode.EventEmitter();
    this.onExecutionStartEmitter = new vscode.EventEmitter();
    this.runner = RunnerFactory.create(this.context);
  }

  dispose(): void {
    for (const execution of this.executionMap.values()) {
      execution.dispose();
    }
    this.executionMap.clear();
    this.onExecutionEndEmitter.dispose();
    this.onExecutionStartEmitter.dispose();
  }

  public cancelAll(): Execution[] {
    const executions = this.executions;
    executions.forEach((execution) => execution.cancel());
    return executions;
  }

  public async execute(
    params?: { startup?: true },
    errorHandler?: ExecuteErrorHandler,
  ): Promise<void> {
    const snapshot = await this.macro.getSnapshot();
    if (snapshot.options.singleton && this.executionCount > 0) {
      throw new SingletonMacroAlreadyRunningError(this.macro.id, this.macro.name);
    }

    const startup = params?.startup ?? false;
    const executionId = getExecutionIdFromUri(this.macro.uri, ++this.executionIndex, startup);
    if (this.executionMap.has(executionId)) {
      throw new Error(`Duplicate execution id: ${executionId}`);
    }

    const execution = new Execution(this.context, executionId, this.macro, snapshot, startup);
    this.executionMap.set(execution.id, execution);

    try {
      await this.invokeExecution(execution);
    } catch (error: any) {
      if (!errorHandler) {
        throw error;
      }
      await errorHandler(error, { executionId: execution.id, snapshot: execution.snapshot });
    } finally {
      execution.dispose();
    }
  }

  protected async invokeExecution(execution: Execution): Promise<void> {
    this.onExecutionStartEmitter.fire(execution);
    try {
      this.context.log.info('Macro started —', execution.id);
      execution.refreshStartedOn();
      await this.runner.run(execution);
      this.context.log.info('Macro ended —', execution.id);
    } catch (error: any) {
      if (error instanceof vscode.CancellationError) {
        this.context.log.warn('Macro canceled —', execution.id, this.macro.id);
        return;
      }

      this.context.log.error(
        'Macro failed —',
        execution.id,
        this.macro.id,
        '\n',
        (error && (error.stack ?? error.message ?? error)) ?? 'Unknown error',
      );
      throw error;
    } finally {
      this.executionMap.delete(execution.id);
      this.onExecutionEndEmitter.fire(execution);
    }
  }

  public get executions(): Execution[] {
    return Array.from(this.executionMap.values());
  }

  public get executionCount(): number {
    return this.executionMap.size;
  }

  public getExecution(id: ExecutionId): Execution | undefined {
    return this.executionMap.get(id);
  }

  public get onExecutionEnd(): vscode.Event<Execution> {
    return this.onExecutionEndEmitter.event;
  }

  public get onExecutionStart(): vscode.Event<Execution> {
    return this.onExecutionStartEmitter.event;
  }

  public resetPersistentContext() {
    this.context.log.info('Reset persistent context', this.macro.id);
    this.runner.resetSharedContext();
  }
}
