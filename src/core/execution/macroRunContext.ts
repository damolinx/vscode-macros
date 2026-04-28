import * as vscode from 'vscode';
import * as vm from 'vm';
import { createMacroApi } from '../../api/macroApiFactory';
import { MacroContext } from '../../api/macroContext';
import { ExtensionContext } from '../../extensionContext';
import { ExecutionId } from './executionId';
import { ViewManager } from './views/viewManager';

export interface MacroContextInitParams {
  context: ExtensionContext;
  disposables: vscode.Disposable[];
  log: vscode.LogOutputChannel;
  executionId: ExecutionId;
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
