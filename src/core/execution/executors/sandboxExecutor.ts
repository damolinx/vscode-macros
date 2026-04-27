import * as vscode from 'vscode';
import { ExtensionContext } from '../../../extensionContext';
import { Macro } from '../../macro';
import { MacroCode } from '../../macroCode';
import { SandboxRunner } from '../runners/sandboxRunner';
import { VmSandboxRunner } from '../runners/vmSandboxRunner';
import { SandboxExecution } from '../sandboxExecution';
import { SandboxExecutionId } from '../sandboxExecutionId';

type ExecuteErrorHandler = (
  error: Error,
  info: {
    executionId: SandboxExecutionId;
    macroCode: MacroCode;
  },
) => Promise<void> | void;

export class SandboxExecutor implements vscode.Disposable {
  protected readonly context: ExtensionContext;
  private readonly executionMap: Map<SandboxExecutionId, SandboxExecution>;
  private index: number;
  public readonly macro: Macro;
  private readonly onExecutionEndEmitter: vscode.EventEmitter<SandboxExecution>;
  private readonly onExecutionStartEmitter: vscode.EventEmitter<SandboxExecution>;
  protected readonly runner: SandboxRunner;

  constructor(context: ExtensionContext, macro: Macro) {
    this.context = context;
    this.executionMap = new Map();
    this.index = 0;
    this.macro = macro;
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

  public get count(): number {
    return this.executionMap.size;
  }

  public async execute(
    params?: { startup?: true },
    errorHandler?: ExecuteErrorHandler,
  ): Promise<void> {
    if (this.count > 0 && (await this.macro.getCode()).options.singleton) {
      this.context.log.warn(
        'Singleton macro is already running, ignoring run-request —',
        this.macro.id,
      );
      vscode.window.setStatusBarMessage(
        `$(info) Singleton macro ${this.macro.name} is already running`,
        3000,
      );
      return;
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
        this.macro.uri.toString(true),
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

  public getExecution(id: SandboxExecutionId): SandboxExecution | undefined {
    return this.executionMap.get(id);
  }

  public isRunning(): boolean {
    return !!this.executionMap.size;
  }

  public get onExecutionEnd(): vscode.Event<SandboxExecution> {
    return this.onExecutionEndEmitter.event;
  }

  public get onExecutionStart(): vscode.Event<SandboxExecution> {
    return this.onExecutionStartEmitter.event;
  }

  public resetSharedContext() {
    this.context.log.info('Reset persistent context', this.macro.uri.toString(true));
    this.runner.resetSharedContext();
  }
}
