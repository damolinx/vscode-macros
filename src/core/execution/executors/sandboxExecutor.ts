import * as vscode from 'vscode';
import { ExtensionContext } from '../../../extensionContext';
import { Macro } from '../../macro';
import { MacroCode } from '../../macroCode';
import { SandboxRunner } from '../runners/sandboxRunner';
import { VmSandboxRunner } from '../runners/vmSandboxRunner';
import { SandboxExecution } from '../sandboxExecution';
import { SandboxExecutionId } from '../sandboxExecutionId';
import { SingletonMacroAlreadyRunningError } from './errors';

type ExecuteErrorHandler = (
  error: Error,
  info: {
    executionId: SandboxExecutionId;
    macroCode: MacroCode;
  },
) => Promise<void> | void;

export class SandboxExecutor implements vscode.Disposable {
  private readonly executionMap: Map<SandboxExecutionId, SandboxExecution>;
  private index: number;
  private readonly onExecutionEndEmitter: vscode.EventEmitter<SandboxExecution>;
  private readonly onExecutionStartEmitter: vscode.EventEmitter<SandboxExecution>;
  protected readonly runner: SandboxRunner;

  constructor(
    protected readonly context: ExtensionContext,
    public readonly macro: Macro,
  ) {
    this.executionMap = new Map();
    this.index = 0;
    this.onExecutionEndEmitter = new vscode.EventEmitter();
    this.onExecutionStartEmitter = new vscode.EventEmitter();
    this.runner = new VmSandboxRunner(this.context);
  }

  dispose() {
    for (const execution of this.executionMap.values()) {
      execution.dispose();
    }
    this.executionMap.clear();
    this.onExecutionEndEmitter.dispose();
    this.onExecutionStartEmitter.dispose();
  }

  public cancel(id?: SandboxExecutionId): SandboxExecution[] {
    const canceledDescriptors = id
      ? this.executionMap.has(id)
        ? [this.executionMap.get(id)!]
        : []
      : this.executions;

    for (const descriptor of canceledDescriptors) {
      descriptor.cts.cancel();
    }
    return canceledDescriptors;
  }

  public async execute(
    params?: { startup?: true },
    errorHandler?: ExecuteErrorHandler,
  ): Promise<void> {
    if (this.executionCount > 0 && (await this.macro.getCode()).options.singleton) {
      throw new SingletonMacroAlreadyRunningError(this.macro.id, this.macro.name);
    }

    const execution = await SandboxExecution.create(this.context, this.macro, {
      index: ++this.index,
      ...params,
    });
    if (this.executionMap.has(execution.id)) {
      throw new Error(`Duplicate execution id: ${execution.id}`);
    }
    this.executionMap.set(execution.id, execution);

    try {
      await this.invokeExecution(execution);
    } catch (error: any) {
      if (!errorHandler) {
        throw error;
      }
      await errorHandler(error, { executionId: execution.id, macroCode: execution.snapshot });
    } finally {
      execution.dispose();
    }
  }

  protected async invokeExecution(execution: SandboxExecution): Promise<void> {
    this.onExecutionStartEmitter.fire(execution);
    try {
      this.context.log.info('Macro started —', execution.id);
      execution.refreshStartedOn();
      await this.runner.execute(execution);
      this.context.log.info('Macro ended —', execution.id);
    } catch (error: any) {
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

  public get executions(): SandboxExecution[] {
    return Array.from(this.executionMap.values());
  }

  public get executionCount(): number {
    return this.executionMap.size;
  }

  public getExecution(id: SandboxExecutionId): SandboxExecution | undefined {
    return this.executionMap.get(id);
  }

  public get onExecutionEnd(): vscode.Event<SandboxExecution> {
    return this.onExecutionEndEmitter.event;
  }

  public get onExecutionStart(): vscode.Event<SandboxExecution> {
    return this.onExecutionStartEmitter.event;
  }

  public resetPersistentContext() {
    this.context.log.info('Reset persistent context', this.macro.id);
    this.runner.resetSharedContext();
  }
}
