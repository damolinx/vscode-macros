import * as vscode from 'vscode';
import * as vm from 'vm';
import { initalizeContext, initializeMacrosApi, MacroContextInitParams } from './macroRunContext';
import { MacroRunId, MacroRunInfo, MacroRunStopInfo } from './macroRunInfo';
import { Macro } from '../macro';
import { MacroOptions } from '../macroOptions';
import { MacroContext } from '../../api/macroContext';

export class MacroRunner implements vscode.Disposable {
  private index: number;
  public readonly macro: Macro;
  private readonly runs: Map<MacroRunId, MacroRunInfo>;
  private sharedContext?: MacroContext;
  private startEventEmitter: vscode.EventEmitter<MacroRunInfo>;
  private stopEventEmitter: vscode.EventEmitter<MacroRunStopInfo>;

  constructor(macro: Macro) {
    this.index = 0;
    this.macro = macro;
    this.runs = new Map();
    this.startEventEmitter = new vscode.EventEmitter();
    this.stopEventEmitter = new vscode.EventEmitter();
  }

  dispose() {
    this.startEventEmitter.dispose();
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

  public onStartRun(listener: (runInfo: MacroRunInfo) => void): vscode.Disposable {
    return this.startEventEmitter.event(listener);
  }

  public onStopRun(listener: (runStopInfo: MacroRunStopInfo) => void): vscode.Disposable {
    return this.stopEventEmitter.event(listener);
  }

  public resetSharedContext() {
    this.sharedContext = undefined;
  }

  public async run(): Promise<void> {
    const [code, options] = await Promise.all([this.macro.getCode(), this.macro.getOptions()]);
    await this.runInternal(code, options);
  }

  public get running(): Iterable<MacroRunInfo> {
    return this.runs.values();
  }

  private async runInternal(code: string, options: MacroOptions) {
    if (this.runs.size > 0 && options.singleton) {
      throw new Error(`Singleton macro ${this.macro.name} is already running`);
    }

    const runInfo: MacroRunInfo = {
      cts: new vscode.CancellationTokenSource(),
      id: `${this.macro.name}@${(++this.index).toString().padStart(3, '0')}`,
      macro: this.macro,
    };
    this.runs.set(runInfo.id, runInfo);

    const macroDisposables = [] as vscode.Disposable[];
    const context = this.getContext({
      disposables: macroDisposables,
      persistent: !!options.persistent,
      runId: runInfo.id,
      token: runInfo.cts.token,
      uri: this.macro.uri,
    });
    const scriptOptions: vm.RunningScriptOptions = {
      filename: this.macro.uri.toString(true),
    };

    this.startEventEmitter.fire(runInfo);
    let scriptFailed = false;
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
    } catch (e) {
      scriptFailed = true;
      throw e;
    } finally {
      this.runs.delete(runInfo.id);
      const disposeError = safeDispose(macroDisposables);
      this.stopEventEmitter.fire({
        ...runInfo,
        error: disposeError,
      });
      if (!scriptFailed && disposeError) {
        /* eslint-disable no-unsafe-finally */
        throw disposeError;
      }
    }


    function safeDispose(disposables: vscode.Disposable[]): Error | undefined {
      const errors: (string | Error)[] = [];
      for (const disposable of disposables) {
        try {
          disposable.dispose();
        } catch (error) {
          errors.push(error as string | Error);
        }
      }
      return errors.length > 0
        ? new Error(`Error(s) occurred while disposing resources:\n${errors.map(e => typeof e === 'string' ? e : e.message).join('\n')}`)
        : undefined;
    }
  }

  public get someRunning(): boolean {
    return this.runs.size > 0;
  }
}