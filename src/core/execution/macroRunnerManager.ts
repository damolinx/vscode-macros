import * as vscode from 'vscode';
import { ExtensionContext } from '../../extensionContext';
import { MACRO_EXTENSIONS, MACRO_LANGUAGES } from '../constants';
import { Macro } from '../macro';
import { getMacroId, MacroId } from '../macroId';
import { MacroRunInfo, MacroRunResult } from './macroRunInfo';
import { MacroRunner } from './macroRunner';

export class MacroRunnerManager implements vscode.Disposable {
  private readonly context: ExtensionContext;
  private readonly onDidDeleteFilesDisposable: vscode.Disposable;
  private readonly runEventEmitter: vscode.EventEmitter<MacroRunInfo>;
  private readonly runners: Map<MacroId, MacroRunner>;
  private readonly stopEventEmitter: vscode.EventEmitter<MacroRunResult>;

  constructor(context: ExtensionContext) {
    this.context = context;
    this.runners = new Map();
    vscode.workspace.onDidCloseTextDocument((doc) => {
      if (doc.isUntitled && MACRO_LANGUAGES.some((lang) => doc.languageId === lang)) {
        this.cleanUpMacroRunner(doc.uri);
      }
    });
    this.onDidDeleteFilesDisposable = vscode.workspace.onDidDeleteFiles((ev) =>
      ev.files
        .filter((uri) => MACRO_EXTENSIONS.some((ext) => uri.path.endsWith(ext)))
        .forEach((uri) => this.cleanUpMacroRunner(uri)),
    );
    this.runEventEmitter = new vscode.EventEmitter();
    this.stopEventEmitter = new vscode.EventEmitter();
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
      if (runner.runInstanceCount > 0) {
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
    let runner = this.runners.get(macro.id);
    if (!runner) {
      runner = new MacroRunner(this.context, macro);
      runner.onStartRun((runInfo) => this.runEventEmitter.fire(runInfo));
      runner.onStopRun((runInfo) => this.stopEventEmitter.fire(runInfo));
      this.runners.set(macro.id, runner);
    }

    return runner;
  }

  public onRun(listener: (runInfo: MacroRunInfo) => void): vscode.Disposable {
    return this.runEventEmitter.event(listener);
  }

  public onStop(listener: (runInfo: MacroRunResult) => void): vscode.Disposable {
    return this.stopEventEmitter.event(listener);
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
