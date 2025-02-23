import * as vscode from 'vscode';
import { RunInfo, Runner } from './runner';
import { Macro, MacroId } from './macro';

export class Manager implements vscode.Disposable {
  private readonly macros: Map<MacroId, Runner>;
  private runEventEmitter: vscode.EventEmitter<RunInfo>;
  private stopEventEmitter: vscode.EventEmitter<RunInfo>;

  constructor() {
    this.macros = new Map();
    this.runEventEmitter = new vscode.EventEmitter();
    this.stopEventEmitter = new vscode.EventEmitter();
  }

  dispose() {
    vscode.Disposable.from(
      this.runEventEmitter,
      this.stopEventEmitter,
      ...this.macros.values()).dispose();
  }

  private getRunner(uri: vscode.Uri): Runner {
    const macroId = Macro.getId(uri);
    let runner = this.macros.get(macroId);
    if (!runner) {
      const macro = new Macro(uri, macroId);
      runner = new Runner(macro);
      runner.onRun((runInfo) => this.runEventEmitter.fire(runInfo));
      runner.onStop((runInfo) => this.stopEventEmitter.fire(runInfo));
      this.macros.set(macroId, runner);
    }

    return runner;
  }

  public async run(uri: vscode.Uri): Promise<void> {
    const runner = this.getRunner(uri);
    await runner.run();
  }

  public get runningMacros(): RunInfo[] {
    return [...this.macros.values()].flatMap((runner) => runner.running);
  }

  public onRun(listener: (runInfo: RunInfo) => void): vscode.Disposable {
    return this.runEventEmitter.event(listener);
  }

  public onStop(listener: (runInfo: RunInfo) => void): vscode.Disposable {
    return this.stopEventEmitter.event(listener);
  }
}
