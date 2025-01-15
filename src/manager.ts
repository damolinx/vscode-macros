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
    vscode.Disposable.from(this.runEventEmitter, this.stopEventEmitter, ...this.macros.values()).dispose();
  }

  private getRunner(macroOrUri: Macro | vscode.Uri): Runner {
    const macro = macroOrUri instanceof Macro ? macroOrUri : new Macro(macroOrUri);
    let runner = this.macros.get(macro.id);
    if (!runner) {
      runner = new Runner(macro);
      runner.onRun((runInfo) => this.runEventEmitter.fire(runInfo));
      runner.onStop((runInfo) => this.stopEventEmitter.fire(runInfo));
      this.macros.set(macro.id, runner);
    }
    // TODO: this forces a refresh of macro file contents for next run.
    runner.macro = macro;

    return runner;
  }

  public async run(macroOrUri: Macro | vscode.Uri): Promise<void> {
    let runner = this.getRunner(macroOrUri);
    await runner.run();
  }

  public get runningMacros(): ReadonlyArray<RunInfo> {
    return [...this.macros.values()].flatMap((runner) => runner.running);
  }

  public onRun(listener: (runInfo: RunInfo) => void): vscode.Disposable {
    return this.runEventEmitter.event(listener);
  }

  public onStop(listener: (runInfo: RunInfo) => void): vscode.Disposable {
    return this.stopEventEmitter.event(listener);
  }
}
