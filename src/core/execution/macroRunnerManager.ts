import * as vscode from 'vscode';
import { MacroRunInfo, MacroRunStopInfo } from './macroRunInfo';
import { MacroRunner } from './macroRunner';
import { getMacroId, Macro, MacroId } from '../macro';
import { MACRO_EXTENSIONS, MACRO_LANGUAGES } from '../constants';
import { ExtensionContext } from '../../extensionContext';

export class MacroRunnerManager implements vscode.Disposable {
  private readonly context: ExtensionContext;
  private readonly macros: Map<MacroId, MacroRunner>;
  private readonly onDidDeleteFilesDisposable: vscode.Disposable;
  private readonly runEventEmitter: vscode.EventEmitter<MacroRunInfo>;
  private readonly stopEventEmitter: vscode.EventEmitter<MacroRunStopInfo>;

  constructor(context: ExtensionContext) {
    this.context = context;
    this.macros = new Map();
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
    vscode.Disposable.from(...this.macros.values()).dispose();
  }

  private cleanUpMacroRunner(uri: vscode.Uri): void {
    const macroId = getMacroId(uri);
    const runner = this.macros.get(macroId);
    if (runner) {
      if (!runner.someRunning) {
        runner.dispose();
        this.macros.delete(macroId);
      } else {
        runner.onStopRun(() => {
          if (!runner.someRunning) {
            runner.dispose();
            this.macros.delete(macroId);
          }
        });
      }
    }
  }

  public getRunner(uri: vscode.Uri): MacroRunner {
    const macro = new Macro(uri);
    let runner = this.macros.get(macro.id);
    if (!runner) {
      runner = new MacroRunner(this.context, macro);
      runner.onStartRun((runInfo) => this.runEventEmitter.fire(runInfo));
      runner.onStopRun((runInfo) => this.stopEventEmitter.fire(runInfo));
      this.macros.set(macro.id, runner);
    }

    return runner;
  }

  public onRun(listener: (runInfo: MacroRunInfo) => void): vscode.Disposable {
    return this.runEventEmitter.event(listener);
  }

  public onStop(listener: (runInfo: MacroRunStopInfo) => void): vscode.Disposable {
    return this.stopEventEmitter.event(listener);
  }

  public get runningMacros(): MacroRunInfo[] {
    return [...this.macros.values()].flatMap((runner) => [...runner.running]);
  }
}
