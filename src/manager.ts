import * as vscode from 'vscode';
import { Runner } from './runner';
import { Macro, MacroId } from './macro';

export class Manager implements vscode.Disposable {
  private readonly macros: Map<MacroId, Runner>;

  constructor() {
    this.macros = new Map();
  }

  dispose() {
    vscode.Disposable.from(...this.macros.values()).dispose();
  }

  private getRunner(macroOrUri: Macro | vscode.Uri): Runner {
    let runner: Runner | undefined;
    if (macroOrUri instanceof Macro) {
      runner = this.macros.get(macroOrUri.id);
      if (!runner) {
        runner = new Runner(macroOrUri);
        this.macros.set(macroOrUri.id, runner);
      }
    } else {
      runner = this.macros.get(Macro.getId(macroOrUri));
      if (!runner) {
        const macro = new Macro(macroOrUri);
        runner = new Runner(macro);
        this.macros.set(macro.id, runner);
      }
    }
    return runner;
  }

  public async run(macroOrUri: Macro | vscode.Uri): Promise<void> {
    let runner = this.getRunner(macroOrUri);
    await runner.run();
  }

  public get runningMacros(): ReadonlyArray<{ macro: Macro; runId: string }> {
    return [...this.macros.values()].flatMap((runner) => runner.running);
  }
}
