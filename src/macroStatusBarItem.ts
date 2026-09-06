import * as vscode from 'vscode';
import { ExecutorManager } from './core/execution/executorManager';
import { ExtensionContext } from './extensionContext';

export class MacroStatusBarItem implements vscode.Disposable {
  private readonly disposables: vscode.Disposable[];
  private readonly item: vscode.StatusBarItem;
  private readonly executorManager: ExecutorManager;

  constructor({ executorManager }: ExtensionContext) {
    this.executorManager = executorManager;
    this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1000);
    this.item.command = 'macros.run.show';
    this.item.text = '$(run-all)';

    this.disposables = [
      this.item,
      this.executorManager.onExecutionStart(() => {
        const { executions } = this.executorManager;
        this.item.tooltip = `Active macro instances: ${executions.length}`;
        this.item.show();
      }),
      this.executorManager.onExecutionEnd(() => {
        if (!this.executorManager.executions.length) {
          this.item.hide();
        }
      }),
    ];
  }

  dispose(): void {
    vscode.Disposable.from(...this.disposables).dispose();
  }
}
