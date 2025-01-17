import * as vscode from 'vscode';
import * as vm from 'vm';
import { showMacroErrorMessage } from './common/ui';
import { Macro } from './macro';
import { MacrosApi } from './macrosApi';

export type RunId = string;
export type RunInfo = { macro: Macro; runId: RunId };

export class Runner implements vscode.Disposable {
  private readonly executions: Map<RunId, Promise<void>>;
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
        macros: <MacrosApi>{
          macro: {
            uri,
          }
        },
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

    const currentRunId = `${this.macro.shortName}@${this.index++}`;
    const execution = async () => {
      try {
        await (options.persistent
          ? vm.runInContext(code, context, scriptOptions)
          : vm.runInNewContext(code, context, scriptOptions));
      } catch (error) {
        showMacroErrorMessage(this.macro, error);
      } finally {
        this.executions.delete(currentRunId);
        this.stopEventEmitter.fire({ macro: this.macro, runId: currentRunId });
      }
    };
    this.executions.set(currentRunId, execution());
    this.runEventEmitter.fire({ macro: this.macro, runId: currentRunId });
  }

  public get running(): ReadonlyArray<RunInfo> {
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
}

