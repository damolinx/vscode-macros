import * as vscode from 'vscode';
import * as vm from 'vm';
import { Macro } from './macro';
import { basename } from 'path';

export type RunId = string;
export type RunInfo = { macro: Macro; runId: RunId };

export class Runner implements vscode.Disposable {
  private readonly executions: Map<RunId, Promise<void>>;
  public readonly macro: Macro;
  private index: number;
  private sharedContext?: vm.Context;

  constructor(macro: Macro) {
    this.executions = new Map();
    this.index = 1000;
    this.macro = macro;
  }

  dispose() {}

  private createBaseContext(): vm.Context {
    // TODO: define what is the proper API to pass in.
    return {
      clearInterval,
      clearTimeout,
      setInterval,
      setTimeout,
      fetch,
      vscode,
    };
  }

  private createContext(shouldPersist: boolean): vm.Context {
    let context: vm.Context;
    if (shouldPersist) {
      if (!this.sharedContext) {
        this.sharedContext = vm.createContext(this.createBaseContext());
      }
      context = this.sharedContext;
    } else {
      if (this.sharedContext) {
        delete this.sharedContext;
      }
      context = vm.createContext(this.createBaseContext());
    }
    return context;
  }

  public isRunning(): boolean {
    return this.executions.size > 0;
  }

  public get running(): ReadonlyArray<RunInfo> {
    return [...this.executions.keys()].map((runId) => ({
      macro: this.macro,
      runId: runId,
    }));
  }

  public async run() {
    if (this.isRunning() && (await this.macro.singleton)) {
      throw new Error('Macro is already running');
    }

    const [code, persistent] = await Promise.all([
      this.macro.getCode(),
      this.macro.persistent,
    ]);

    const context = this.createContext(persistent);
    const options = {
      filename: this.macro.uri.toString(true),
    };

    const currentRunId = `run@${this.index++}`;
    const execution = async () => {
      try {
        await (persistent
          ? vm.runInContext(code, context, options)
          : vm.runInNewContext(code, context, options));
      } catch (error) {
        vscode.window.showErrorMessage(
          `Failed to run ${basename(this.macro.uri.path)}. Error: ${error}`,
        );
      } finally {
        this.executions.delete(currentRunId);
      }
    };
    this.executions.set(currentRunId, execution());
  }
}
