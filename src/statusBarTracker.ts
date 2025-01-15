import * as vscode from 'vscode';
import { Manager } from './manager';

export class StatusBarTracker implements vscode.Disposable {
  private readonly item: vscode.StatusBarItem;
  private readonly manager: Manager;
  private disposables: vscode.Disposable[];

  constructor(manager: Manager) {
    this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1000);
    this.item.text = '$(run-all)';
    this.manager = manager;

    this.disposables = [
      this.item,
      this.manager.onRun(() => {
        this.item.tooltip = `Running ${this.manager.runningMacros.length} macro(s): ${this.manager.runningMacros.map((runInfo) => runInfo.runId).join(', ')}`;
        this.item.show()
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
