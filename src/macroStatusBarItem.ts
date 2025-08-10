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
        const { runningMacros } = this.runnerManager;
        this.item.tooltip = `Running ${runningMacros.length} macro(s): ` +
          `${runningMacros.map((runInfo) => runInfo.id).join(', ')}`;
        this.item.show();
      }),
      this.runnerManager.onStop(() => {
        if (!this.runnerManager.someRunning) {
          this.item.hide();
        }
      })];
  }

  dispose() {
    vscode.Disposable.from(...this.disposables).dispose();
  }
}
