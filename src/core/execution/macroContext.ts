import * as vscode from 'vscode';
import * as vm from 'vm';
import { createMacroApi } from '../../api/macroApiFactory';
import { MacroContext } from '../../api/macroContext';
import { ExtensionContext } from '../../extensionContext';
import { ExecutionId } from './executionId';

export interface MacroContextParams {
  context: ExtensionContext;
  disposables: vscode.Disposable[];
  executionId: ExecutionId;
  startup?: true;
  token: vscode.CancellationToken;
  uri?: vscode.Uri;
}

export function initializeContext(context: vm.Context, params: MacroContextParams): MacroContext {
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
