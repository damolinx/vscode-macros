import * as vscode from 'vscode';
import * as vm from 'vm';
import { showMacroErrorMessage } from './common/error';
import { Macro } from './macro';
import { MacrosApi } from './macrosApi';

export type RunId = string;

export interface RunInfo {
  cts: vscode.CancellationTokenSource;
  macro: Macro;
  runId: RunId
};

export class Runner implements vscode.Disposable {
  private readonly executions: Map<RunId, RunInfo>;
  private index: number;
  public macro: Macro;
  private sharedContext?: vm.Context;
  private runEventEmitter: vscode.EventEmitter<RunInfo>;
  private stopEventEmitter: vscode.EventEmitter<RunInfo>;

  constructor(macro: Macro) {
    this.executions = new Map();
    this.index = 1;
    this.macro = macro;

    this.runEventEmitter = new vscode.EventEmitter();
    this.stopEventEmitter = new vscode.EventEmitter();
  }

  dispose() {
    vscode.Disposable.from(this.runEventEmitter, this.stopEventEmitter).dispose();
  }

  private getContext(runInfo: RunInfo, shouldPersist?: boolean): vm.Context {
    let context: vm.Context;
    let name: string;
    if (shouldPersist) {
      this.sharedContext ||= createContext();
      context = { ...this.sharedContext };
      name = 'shared-context';
    } else {
      delete this.sharedContext;
      context = createContext();
      name = 'context';
    }

    context.__cancellationToken = runInfo.cts.token;
    context.__runId = runInfo.runId;
    return vm.createContext(context, { name });

    function createContext() {
      return ({
        clearInterval,
        clearTimeout,
        fetch,
        global,
        macros: {
          macro: {
            uri: runInfo.macro.uri
          }
        } as MacrosApi,
        require,
        setInterval,
        setTimeout,
        vscode,
      });
    }
  }

  public async run() {
    const { code, options } = await this.macro.getCodeAndOptions();
    if (options.singleton && this.executions.size > 0) {
      throw new Error(`${this.macro.shortName} is a singleton and is already running.`);
    }

    const cts = new vscode.CancellationTokenSource();
    const runInfo = {
      macro: this.macro,
      runId: `${this.macro.shortName}@${this.index++}`,
      cts,
    };

    const context = this.getContext(runInfo, options.persistent);
    const scriptOptions: vm.RunningScriptOptions = {
      filename: this.macro.uri.toString(true),
    };

    this.executions.set(runInfo.runId, runInfo);
    this.runEventEmitter.fire(runInfo);
    try {
      await (options.persistent
        ? vm.runInContext(code, context, scriptOptions)
        : vm.runInNewContext(code, context, scriptOptions));
    } catch (error) {
      showMacroErrorMessage(this, this.macro, options, error as Error | string);
    } finally {
      this.executions.delete(runInfo.runId);
      this.stopEventEmitter.fire(runInfo);
    }
  }

  public get running(): readonly RunInfo[] {
    return [...this.executions.values()];
  }

  public onRun(listener: (runInfo: RunInfo) => void): vscode.Disposable {
    return this.runEventEmitter.event(listener);
  }

  public onStop(listener: (runInfo: RunInfo) => void): vscode.Disposable {
    return this.stopEventEmitter.event(listener);
  }

  public resetSharedContext() {
    this.sharedContext = undefined;
  }
}

