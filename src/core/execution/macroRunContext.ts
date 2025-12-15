import * as vscode from 'vscode';
import * as vm from 'vm';
import { MacroContext } from '../../api/macroContext';
import { MacrosApi } from '../../api/macrosApi';
import { SandboxExecutionId } from './sandboxExecutionId';
import { ViewId } from './views/viewId';
import { ViewManager } from './views/viewManager';

export interface MacroContextInitParams {
  disposables: vscode.Disposable[];
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
      vscode,
    },
    createMacroApi(params),
  );
  return updatedContext;
}

export function initializeMacrosApi(
  context: MacroContext,
  params: MacroContextInitParams,
): MacroContext {
  const updatedContext = Object.assign(context, createMacroApi(params));
  return updatedContext;
}

function createMacroApi(params: MacroContextInitParams): MacrosApi {
  return {
    __cancellationToken: params.token,
    __disposables: params.disposables,
    __runId: params.executionId.toString(),
    __startup: params.startup,
    macros: {
      macro: {
        uri: params.uri,
      },
      log: params.log,
      window: {
        getTreeViewId: () => params.viewManagers.tree.getId(params.executionId),
        getWebviewId: () => params.viewManagers.web.getId(params.executionId),
        releaseTreeViewId: (id: string) =>
          params.viewManagers.tree.releaseId(params.executionId, id as ViewId),
        releaseWebviewId: (id: string) =>
          params.viewManagers.web.releaseId(params.executionId, id as ViewId),
      },
    },
  };
}
