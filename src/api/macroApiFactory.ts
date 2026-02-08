import { MacroContextInitParams } from '../core/execution/macroRunContext';
import { ViewId } from '../core/execution/views/viewId';
import { executeCommands } from './executeCommands';
import { MacroContext } from './macroContext';
import { MacrosApi } from './macrosApi';

export function initializeMacrosApi(
  context: MacroContext,
  params: MacroContextInitParams,
): MacroContext {
  const updatedContext = Object.assign(context, createMacroApi(params));
  return updatedContext;
}

export function createMacroApi(params: MacroContextInitParams): MacrosApi {
  return {
    __cancellationToken: params.token,
    __disposables: params.disposables,
    __runId: params.executionId.toString(),
    __startup: params.startup,
    macros: {
      extensionContext: params.extensionContext,
      commands: {
        executeCommands,
      },
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
  } as MacrosApi;
}
