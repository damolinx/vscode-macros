import * as vscode from 'vscode';
import * as vm from 'vm';
import { MacrosApi } from '../../api/macrosApi';
import { MacroContext } from '../../api/macroContext';

export interface MacroContextInitParams {
  disposables: vscode.Disposable[];
  log: vscode.LogOutputChannel;
  runId: string;
  startup?: true;
  token: vscode.CancellationToken;
  uri?: vscode.Uri;
}

export function initalizeContext(context: vm.Context, params: MacroContextInitParams): MacroContext {
  const updatedContext = Object.assign(context,
    {
      atob: atob,
      btoa: btoa,
      clearInterval: clearInterval,
      clearTimeout: clearTimeout,
      crypto: crypto,
      fetch: fetch,
      global: global,
      require: require,
      setInterval: setInterval,
      setTimeout: setTimeout,
      vscode: vscode,
    },
    createMacroApi(params));
  return updatedContext;
}

export function initializeMacrosApi(context: MacroContext, params: MacroContextInitParams): MacroContext {
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