import * as vscode from 'vscode';
import { extname } from 'path';
import * as sms from 'source-map-support';
import { ExtensionContext } from '../../extensionContext';
import { Lazy } from '../../utils/lazy';
import { extractInlineSourceMap } from '../../utils/typescript';
import { isMacroLangId, isMacro } from '../language';
import { Macro } from '../macro';
import { getMacroId, MacroId } from '../macroId';
import { getMacroRunId, MacroRunId } from './macroRunId';
import { MacroRunInfo, MacroRunResult } from './macroRunInfo';
import { MacroRunner } from './macroRunner';

export class MacroRunnerManager implements vscode.Disposable {
  private readonly context: ExtensionContext;
  private readonly onDidDeleteFilesDisposable: vscode.Disposable;
  private readonly runEventEmitter: vscode.EventEmitter<MacroRunInfo>;
  private readonly runners: Map<MacroId, MacroRunner>;
  private readonly stopEventEmitter: vscode.EventEmitter<MacroRunResult>;
  private readonly smsSupport: Lazy<void>;

  constructor(context: ExtensionContext) {
    this.context = context;
    this.runners = new Map();
    vscode.workspace.onDidCloseTextDocument((doc) => {
      if (doc.isUntitled && isMacroLangId(doc.languageId)) {
        this.cleanUpMacroRunner(doc.uri);
      }
    });
    this.onDidDeleteFilesDisposable = vscode.workspace.onDidDeleteFiles((ev) =>
      ev.files.filter(isMacro).forEach((uri) => this.cleanUpMacroRunner(uri)),
    );
    this.runEventEmitter = new vscode.EventEmitter();
    this.stopEventEmitter = new vscode.EventEmitter();

    this.smsSupport = new Lazy(() =>
      sms.install({
        retrieveSourceMap: (source) => {
          const runIdMatch = source.match(/^\[(\d+)\]\s(.+?)\.js$/);
          const runInfo =
            runIdMatch && this.getRun(getMacroRunId(`${runIdMatch[2]}.ts`, runIdMatch[1]));
          const sourceMap = runInfo
            ? ({
              url: runInfo.macro.uri.fsPath,
              map: extractInlineSourceMap(runInfo.runnableCode),
            } as sms.UrlAndMap)
            : null;

          return sourceMap;
        },
      }),
    );
  }

  dispose() {
    this.onDidDeleteFilesDisposable.dispose();
    this.runEventEmitter.dispose();
    this.stopEventEmitter.dispose();
    vscode.Disposable.from(...this.runners.values()).dispose();
  }

  private cleanUpMacroRunner(uri: vscode.Uri): void {
    const macroId = getMacroId(uri);
    const runner = this.runners.get(macroId);
    if (runner) {
      if (runner.runInstanceCount === 0) {
        runner.dispose();
        this.runners.delete(macroId);
      } else {
        runner.onStopRun(() => {
          if (runner.runInstanceCount === 0) {
            runner.dispose();
            this.runners.delete(macroId);
          }
        });
      }
    }
  }

  public getRunner(uriOrMacro: vscode.Uri | Macro): MacroRunner {
    const macro = uriOrMacro instanceof Macro ? uriOrMacro : new Macro(uriOrMacro);
    if (extname(macro.uri.path) == '.ts') {
      this.smsSupport.initialize();
    }

    let runner = this.runners.get(macro.id);
    if (!runner) {
      runner = new MacroRunner(this.context, macro);
      runner.onStartRun((runInfo) => this.runEventEmitter.fire(runInfo));
      runner.onStopRun((runInfo) => this.stopEventEmitter.fire(runInfo));
      this.runners.set(macro.id, runner);
    }

    return runner;
  }

  public getRun(id: MacroRunId): MacroRunInfo | undefined {
    let run: MacroRunInfo | undefined;
    for (const runner of this.runners.values()) {
      run = runner.getRun(id);
      if (run) {
        break;
      }
    }

    return run;
  }

  public get onRun(): vscode.Event<MacroRunInfo> {
    return this.runEventEmitter.event;
  }

  public get onStop(): vscode.Event<MacroRunResult> {
    return this.stopEventEmitter.event;
  }

  public get runningMacros(): MacroRunInfo[] {
    return [...this.runners.values()].flatMap((runner) => [...runner.runInstances]);
  }

  public get someRunning(): boolean {
    for (const runner of this.runners.values()) {
      if (runner.runInstanceCount > 0) {
        return true;
      }
    }
    return false;
  }
}
