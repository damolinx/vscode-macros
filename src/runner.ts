import * as vscode from 'vscode';
import * as vm from 'vm';
import { showMacroErrorMessage } from './common/error';
import { Macro } from './macro';
import { MacrosApi } from './macrosApi';

export type RunId = string;
export interface RunInfo { macro: Macro; runId: RunId };

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

  private getOrCreateContext(uri: vscode.Uri, shouldPersist?: boolean): vm.Context {
    let context: vm.Context;
    if (shouldPersist) {
      if (!this.sharedContext) {
        this.sharedContext = createContext('shared-context');
      }
      context = this.sharedContext;
    } else {
      if (this.sharedContext) {
        delete this.sharedContext;
      }
      context = createContext('context');
    }
    return context;


    function createContext(name: string): vm.Context {
      return vm.createContext({
        clearInterval,
        clearTimeout,
        fetch,
        global,
        macros: {
          macro: {
            uri,
          }
        } as MacrosApi,
        require,
        setInterval,
        setTimeout,
        vscode,
      }, {
        name
      });
    }
  }

  public async run() {
    const options = await this.macro.options;
    if (options.singleton && this.executions.size > 0) {
      throw new Error(`${this.macro.shortName} is a singleton and is already running.`);
    }

    const code = await this.macro.code;
    const context = this.getOrCreateContext(this.macro.uri, options.persistent);
    const scriptOptions: vm.RunningScriptOptions = {
      filename: this.macro.uri.toString(true),
    };

    const runInfo = { macro: this.macro, runId: `${this.macro.shortName}@${this.index++}` };
    this.executions.set(runInfo.runId, runInfo);

    this.runEventEmitter.fire(runInfo);
    try {
      await (options.persistent
        ? vm.runInContext(code, context, scriptOptions)
        : vm.runInNewContext(code, context, scriptOptions));
    } catch (error) {
      showMacroErrorMessage(this, this.macro, error as Error | string);
    } finally {
      this.executions.delete(runInfo.runId);
      this.stopEventEmitter.fire(runInfo);
    }
  }

  public get running(): readonly RunInfo[] {
    return [...this.executions.keys()].map((runId) => ({
      macro: this.macro,
      runId: runId,
    }));
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

