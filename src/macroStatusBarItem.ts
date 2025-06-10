import * as vscode from 'vscode';
import { MacroRunnerManager } from './core/execution/macroRunnerManager';
import { ExtensionContext } from './extensionContext';

export class MacroStatusBarItem implements vscode.Disposable {
  private readonly disposables: vscode.Disposable[];
  private readonly item: vscode.StatusBarItem;
  private readonly runnerManager: MacroRunnerManager;

  constructor({ runnerManager }: ExtensionContext) {
    this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1000);
    this.item.command = 'macros.run.show';
    this.item.text = '$(run-all)';
    this.runnerManager = runnerManager;

    this.disposables = [
      this.item,
      this.runnerManager.onRun(() => {
        this.item.tooltip = `Running ${this.runnerManager.runningMacros.length} macro(s): ` +
          `${this.runnerManager.runningMacros.map((runInfo) => runInfo.id).join(', ')}`;
        this.item.show();
      }),
      this.runnerManager.onStop(() => {
        if (this.runnerManager.runningMacros.length === 0) {
          this.item.hide();
        }
      })];
  }

  dispose() {
    vscode.Disposable.from(...this.disposables).dispose();
  }
}
