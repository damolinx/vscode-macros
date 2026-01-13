import * as vscode from 'vscode';
import * as vm from 'vm';
import { MacroContext } from '../../api/macroContext';
import { createMacroApi } from '../../api/utils';
import { SandboxExecutionId } from './sandboxExecutionId';
import { ViewManager } from './views/viewManager';

export interface MacroContextInitParams {
  disposables: vscode.Disposable[];
  extensionContext: vscode.ExtensionContext;
  log: vscode.LogOutputChannel;
  executionId: SandboxExecutionId;
  startup?: true;
  token: vscode.CancellationToken;
  uri?: vscode.Uri;
  viewManagers: {
    tree: ViewManager;
    web: ViewManager;
  };
}

export function initializeContext(
  context: vm.Context,
  params: MacroContextInitParams,
): MacroContext {
  const updatedContext = Object.assign(
    context,
    {
      atob,
      btoa,
      clearInterval,
      clearTimeout,
      crypto,
      fetch,
      global,
      require,
      setInterval,
      setTimeout,
      structuredClone,
      vscode,
    },
    createMacroApi(params),
  );
  return updatedContext;
}
