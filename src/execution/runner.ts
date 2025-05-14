import * as vscode from 'vscode';
import * as vm from 'vm';
import { RunId, RunInfo } from './runInfo';
import { initalizeContext, initializeMacrosApi, MacroContextInitParams } from './utils';
import { MacroContext } from '../api/macroContext';
import { showMacroErrorMessage } from '../common/error';
import { Macro } from '../macro';

export class Runner implements vscode.Disposable {
  private readonly executions: Map<RunId, RunInfo>;
  private index: number;
  public macro: Macro;
  private sharedContext?: MacroContext;
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
    this.runEventEmitter.dispose();
    this.stopEventEmitter.dispose();
  }

  private getContext(params: MacroContextInitParams & { persistent?: boolean }): vm.Context {
    let context: MacroContext;
    let name = `context-${params.runId}`;

    if (params.persistent) {
      name += '(shared)';
      if (this.sharedContext) {
        initializeMacrosApi(this.sharedContext, params);
      } else {
        this.sharedContext = initalizeContext({}, params);
      }
      context = this.sharedContext;
    } else {
      delete this.sharedContext;
      context = initalizeContext({}, params);
    }

    return vm.createContext(context, { name });
  }

  public async run(withErrorHandling = true): Promise<any> {
    const { code, options } = await this.macro.getCode();
    if (options.singleton && this.executions.size > 0) {
      showMacroErrorMessage(this, options, `Singleton macro ${this.macro.shortName} is already running.`);
      return;
    }

    const runInfo = {
      cts: new vscode.CancellationTokenSource(),
      macro: this.macro,
      runId: `${this.macro.shortName}@${this.index++}`,
    };

    const macroDisposables = [] as vscode.Disposable[];
    const context = this.getContext({
      disposables: macroDisposables,
      persistent: !!options.persistent,
      runId: runInfo.runId,
      token: runInfo.cts.token,
      uri: this.macro.uri,
    });
    const scriptOptions: vm.RunningScriptOptions = {
      filename: this.macro.uri.toString(true),
    };

    this.executions.set(runInfo.runId, runInfo);
    this.runEventEmitter.fire(runInfo);
    try {
      let result: any;
      if (options.persistent) {
        const initialKeys = Object.keys(context).filter(k => !k.startsWith('__'));
        result = await vm.runInContext(code, context, scriptOptions);
        const currentKeys = Object.keys(context).filter(k => !k.startsWith('__'));
        const removedKeys = [...initialKeys].filter(key => !currentKeys.includes(key));

        if (this.sharedContext) {
          for (const key of currentKeys) {
            this.sharedContext[key] = context[key];
          }
          for (const key of removedKeys) {
            delete this.sharedContext[key];
          }
        }
      } else {
        result = await vm.runInNewContext(code, context, scriptOptions);
      }
      return result;
    } catch (error) {
      if (withErrorHandling) {
        showMacroErrorMessage(this, options, error as Error | string);
      } else {
        throw error;
      }
    } finally {
      safeDispose(this, macroDisposables);
      this.executions.delete(runInfo.runId);
      this.stopEventEmitter.fire(runInfo);
    }


    function safeDispose(runner: Runner, disposables: vscode.Disposable[]) {
      try {
        vscode.Disposable.from(...disposables).dispose();
      } catch (error) {
        showMacroErrorMessage(runner, options, error as Error | string);
      }
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
