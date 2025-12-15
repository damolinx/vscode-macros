import * as vscode from 'vscode';
import { SandboxManager } from './core/execution/sandboxManager';
import { ExtensionContext } from './extensionContext';

export class MacroStatusBarItem implements vscode.Disposable {
  private readonly disposables: vscode.Disposable[];
  private readonly item: vscode.StatusBarItem;
  private readonly sandboxManager: SandboxManager;

  constructor({ sandboxManager }: ExtensionContext) {
    this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1000);
    this.item.command = 'macros.run.show';
    this.item.text = '$(run-all)';
    this.sandboxManager = sandboxManager;

    this.disposables = [
      this.item,
      this.sandboxManager.onExecutionStart(() => {
        const { executions } = this.sandboxManager;
        this.item.tooltip = `Active macro instances: ${executions.length}`;
        this.item.show();
      }),
      this.sandboxManager.onExecutionEnd(() => {
        if (!this.sandboxManager.executions.length) {
          this.item.hide();
        }
      }),
    ];
  }

  dispose() {
    vscode.Disposable.from(...this.disposables).dispose();
  }
}
