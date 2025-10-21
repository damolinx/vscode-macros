import * as vscode from 'vscode';
import * as vm from 'vm';
import { MacroContext } from '../../api/macroContext';
import { MacrosApi } from '../../api/macrosApi';

export interface MacroContextInitParams {
  disposables: vscode.Disposable[];
  log: vscode.LogOutputChannel;
  runId: string;
  startup?: true;
  token: vscode.CancellationToken;
  uri?: vscode.Uri;
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
    __runId: params.runId,
    __startup: params.startup,
    macros: {
      macro: {
        uri: params.uri,
      },
      log: params.log,
    },
  };
}
