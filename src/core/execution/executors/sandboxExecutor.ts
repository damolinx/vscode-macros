import * as vscode from 'vscode';
import { ExtensionContext } from '../../../extensionContext';
import { Macro } from '../../macro';
import { SandboxRunner } from '../runners/sandboxRunner';
import { VmSandboxRunner } from '../runners/vmSandboxRunner';
import { SandboxExecution } from '../sandboxExecution';
import { SandboxExecutionId } from '../sandboxExecutionId';

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

  public async createExecution(params?: { startup?: true }): Promise<SandboxExecution> {
    const execution = await SandboxExecution.create(this.context, this.macro, {
      index: ++this.index,
      ...params,
    });
    return execution;
  }

  public async execute(execution: SandboxExecution): Promise<void> {
    if (this.count > 0 && execution.snapshot.options.singleton) {
      this.context.log.warn('Macro is already running (singleton), skipping —', execution.id);
      vscode.window.setStatusBarMessage(
        `$(info) Singleton macro ${this.macro.name} is already running`,
        3000,
      );
      return;
    }

    this.executionMap.set(execution.id, execution);
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
      execution.dispose();
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
