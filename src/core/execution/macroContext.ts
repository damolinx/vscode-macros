import * as vscode from 'vscode';
import * as vm from 'vm';
import { createMacroApi } from '../../api/macroApiFactory';
import { MacroContext } from '../../api/macroContext';
import { Context } from '../../context';
import { ExecutionId } from './executionId';

export interface MacroContextParams {
  context: Context;
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
