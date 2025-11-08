import * as vscode from 'vscode';
import * as vm from 'vm';
import { MacroContext } from '../../api/macroContext';
import { MacrosLogOutputChannel } from '../../api/macroLogOutputChannel';
import { ExtensionContext } from '../../extensionContext';
import { parent, uriBasename } from '../../utils/uri';
import { Macro } from '../macro';
import { MacroCode } from '../macroCode';
import { initializeContext, initializeMacrosApi, MacroContextInitParams } from './macroRunContext';
import { MacroRunId, MacroRunIdString } from './macroRunId';
import { MacroRunInfo, MacroRunResult } from './macroRunInfo';

export class MacroRunner implements vscode.Disposable {
  private readonly context: ExtensionContext;
  private index: number;
  public readonly macro: Macro;
  private readonly runs: Map<MacroRunIdString, MacroRunInfo>;
  private sharedMacroContext?: MacroContext;
  private startEventEmitter: vscode.EventEmitter<MacroRunInfo>;
  private stopEventEmitter: vscode.EventEmitter<MacroRunResult>;

  constructor(context: ExtensionContext, macro: Macro) {
    this.context = context;
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
      if (this.sharedMacroContext) {
        initializeMacrosApi(this.sharedMacroContext, params);
      } else {
        this.sharedMacroContext = initializeContext({}, params);
      }
      context = this.sharedMacroContext;
    } else {
      delete this.sharedMacroContext;
      context = initializeContext({}, params);
    }

    return vm.createContext(context, { name });
  }

  public getRun(runId: MacroRunIdString): MacroRunInfo | undefined {
    return this.runs.get(runId);
  }

  public get onStartRun(): vscode.Event<MacroRunInfo> {
    return this.startEventEmitter.event;
  }

  public get onStopRun(): vscode.Event<MacroRunResult> {
    return this.stopEventEmitter.event;
  }

  public resetSharedContext() {
    this.sharedMacroContext = undefined;
  }

  public get runInstanceCount(): number {
    return this.runs.size;
  }

  public get runInstances(): Iterable<MacroRunInfo> {
    return this.runs.values();
  }

  public async run(macroCode: MacroCode, startup?: true): Promise<void> {
    if (this.runs.size > 0 && macroCode.options.singleton) {
      throw new Error(`Singleton macro ${this.macro.name} is already running`);
    }

    const runId = new MacroRunId(
      this.macro.uri.path.split('/').slice(-2).join('/'),
      ++this.index,
      startup,
    );
    const runInfo: MacroRunInfo = {
      cts: new vscode.CancellationTokenSource(),
      runId,
      macro: this.macro,
      runnableCode: macroCode.getRunnableCode(),
      snapshot: {
        code: macroCode.rawCode,
        options: macroCode.options,
        startedOn: Date.now(),
        version: macroCode.version,
      },
      startup,
    };
    this.runs.set(runId.id, runInfo);

    const macroDisposables = [] as vscode.Disposable[];
    const context = this.getContext({
      disposables: macroDisposables,
      log: new MacrosLogOutputChannel(runInfo.runId.id, this.context),
      persistent: !!macroCode.options.persistent,
      runId: runInfo.runId,
      startup,
      token: runInfo.cts.token,
      uri: this.macro.uri,
      viewManagers: {
        tree: this.context.treeViewManager,
        web: this.context.webviewManager,
      },
    });

    const scriptOptions: vm.RunningScriptOptions = {
      filename: getScriptName(this.macro.uri, macroCode.languageId === 'typescript'),
    };

    this.startEventEmitter.fire(runInfo);
    let scriptFailed = false;
    let result: any;
    try {
      let runPromise: Promise<any>;
      if (macroCode.options.persistent) {
        const initialKeys = Object.keys(context).filter((k) => !k.startsWith('__'));
        runPromise = Promise.resolve(
          vm.runInContext(runInfo.runnableCode, context, scriptOptions),
        ).finally(() => {
          const currentKeys = Object.keys(context).filter((k) => !k.startsWith('__'));
          const removedKeys = [...initialKeys].filter((key) => !currentKeys.includes(key));
          if (this.sharedMacroContext) {
            for (const key of currentKeys) {
              this.sharedMacroContext[key] = context[key];
            }
            for (const key of removedKeys) {
              delete this.sharedMacroContext[key];
            }
          }
        });
      } else {
        runPromise = vm.runInNewContext(runInfo.runnableCode, context, scriptOptions);
      }

      result = await (macroCode.options.retained ? retainedExecute(runPromise) : runPromise);
    } catch (e) {
      scriptFailed = true;
      throw e;
    } finally {
      this.context.treeViewManager.releaseOwnedIds(runInfo.runId);
      this.context.webviewManager.releaseOwnedIds(runInfo.runId);
      this.runs.delete(runInfo.runId.id);
      const disposeError = safeDispose(macroDisposables);
      this.stopEventEmitter.fire({
        error: disposeError,
        result,
        runInfo,
      });
      if (!scriptFailed && disposeError) {
        /* eslint-disable no-unsafe-finally */
        throw disposeError;
      }
    }

    function getScriptName(uri: vscode.Uri, isTs: boolean): string {
      const parentName = uriBasename(parent(uri));
      const name = isTs
        ? `[${runInfo.runId.index}] ${parentName}/${uriBasename(uri, true)}.js`
        : `${parentName}/${uriBasename(uri)}`;
      return name;
    }

    function retainedExecute(runPromise: Promise<any>): Promise<any> {
      return Promise.all([
        runPromise,
        new Promise((resolve) => runInfo.cts.token.onCancellationRequested(resolve)),
      ]);
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
        ? new Error(
            `Error(s) occurred while disposing resources:\n${errors.map((e) => (typeof e === 'string' ? e : e.message)).join('\n')}`,
          )
        : undefined;
    }
  }
}
