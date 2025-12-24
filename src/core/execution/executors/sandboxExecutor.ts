import * as vscode from 'vscode';
import { ExtensionContext } from '../../../extensionContext';
import { Macro } from '../../macro';
import { SandboxRunner } from '../runners/sandboxRunner';
import { VmSandboxRunner } from '../runners/vmSandboxRunner';
import { SandboxExecutionDescriptor } from '../sandboxExecutionDescriptor';
import { SandboxExecutionId } from '../sandboxExecutionId';

export class SandboxExecutor implements vscode.Disposable {
  protected readonly context: ExtensionContext;
  private readonly executionMap: Map<SandboxExecutionId, SandboxExecutionDescriptor>;
  private index: number;
  public readonly macro: Macro;
  private readonly onExecutionEndEmitter: vscode.EventEmitter<SandboxExecutionDescriptor>;
  private readonly onExecutionStartEmitter: vscode.EventEmitter<SandboxExecutionDescriptor>;
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

  public cancel(id?: SandboxExecutionId): SandboxExecutionDescriptor[] {
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

  public async createDescriptor(params?: { startup?: true }): Promise<SandboxExecutionDescriptor> {
    const execution = await SandboxExecutionDescriptor.create(this.macro, {
      index: ++this.index,
      startup: params?.startup,
    });
    return execution;
  }

  public async execute(params?: { startup?: true }): Promise<void> {
    const execution = await this.createDescriptor(params);
    return this.executeDescriptor(execution);
  }

  public async executeDescriptor(descriptor: SandboxExecutionDescriptor): Promise<void> {
    if (this.count > 0 && descriptor.snapshot.options.singleton) {
      throw new Error(`Singleton macro ${this.macro.name} is already running`);
    }

    this.executionMap.set(descriptor.id, descriptor);
    this.onExecutionStartEmitter.fire(descriptor);
    try {
      this.context.log.info('Macro started —', descriptor.id);
      descriptor.refreshStartedOn();
      await this.runner.execute(descriptor);
      this.context.log.info('Macro ended —', descriptor.id);
    } catch (error: any) {
      this.context.log.error(
        'Macro failed —',
        descriptor.id,
        this.macro.uri.toString(true),
        '\n',
        (error && (error.stack ?? error.message ?? error)) ?? 'Unknown error',
      );
      throw error;
    } finally {
      this.executionMap.delete(descriptor.id);
      this.onExecutionEndEmitter.fire(descriptor);
      descriptor.dispose();
    }
  }

  public get executions(): SandboxExecutionDescriptor[] {
    return Array.from(this.executionMap.values());
  }

  public getExecution(id: SandboxExecutionId): SandboxExecutionDescriptor | undefined {
    return this.executionMap.get(id);
  }

  public get onExecutionEnd(): vscode.Event<SandboxExecutionDescriptor> {
    return this.onExecutionEndEmitter.event;
  }

  public get onExecutionStart(): vscode.Event<SandboxExecutionDescriptor> {
    return this.onExecutionStartEmitter.event;
  }

  public resetSharedContext() {
    this.context.log.info('Reset persistent context', this.macro.uri.toString(true));
    this.runner.resetSharedContext();
  }
}
