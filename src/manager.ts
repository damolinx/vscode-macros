import * as vscode from 'vscode';
import { RunInfo } from './execution/runInfo';
import { Runner } from './execution/runner';
import { FileMacro } from './fileMacro';
import { getId, MacroId } from './macro';

export class Manager implements vscode.Disposable {
  private readonly macros: Map<MacroId, Runner>;
  private readonly runEventEmitter: vscode.EventEmitter<RunInfo>;
  private readonly stopEventEmitter: vscode.EventEmitter<RunInfo>;

  constructor() {
    this.macros = new Map();
    this.runEventEmitter = new vscode.EventEmitter();
    this.stopEventEmitter = new vscode.EventEmitter();
  }

  dispose() {
    this.runEventEmitter.dispose();
    this.stopEventEmitter.dispose();
    vscode.Disposable.from(...this.macros.values()).dispose();
  }

  public getRunner(uri: vscode.Uri): Runner {
    const macroId = getId(uri);
    let runner = this.macros.get(macroId);
    if (!runner) {
      const macro = new FileMacro(uri);
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
