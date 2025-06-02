import * as vscode from 'vscode';
import { MacroRunnerManager } from './core/execution/macroRunnerManager';

export class MacroStatusBarItem implements vscode.Disposable {
  private readonly disposables: vscode.Disposable[];
  private readonly item: vscode.StatusBarItem;
  private readonly manager: MacroRunnerManager;

  constructor(manager: MacroRunnerManager) {
    this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1000);
    this.item.command = 'macros.run.show';
    this.item.text = '$(run-all)';
    this.manager = manager;

    this.disposables = [
      this.item,
      this.manager.onRun(() => {
        this.item.tooltip = `Running ${this.manager.runningMacros.length} macro(s): ${this.manager.runningMacros.map((runInfo) => runInfo.id).join(', ')}`;
        this.item.show();
      }),
      this.manager.onStop(() => {
        if (this.manager.runningMacros.length === 0) {
          this.item.hide();
        }
      })];
  }

  dispose() {
    vscode.Disposable.from(...this.disposables).dispose();
  }
}
