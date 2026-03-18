import { MacroContextInitParams } from '../core/execution/macroRunContext';
import { ViewId } from '../core/execution/views/viewId';
import { executeCommands } from './executeCommands';
import { MacroContext } from './macroContext';
import { MacrosApi } from './macrosApi';
import { createAttribute } from './window/attributes/attribute';
import { createEvent } from './window/attributes/event';
import { createText } from './window/content/text';
import { createButton } from './window/elements/button';
import { createContainer } from './window/elements/container';
import { createInput } from './window/elements/input';
import { createTree } from './window/elements/tree';
import { handleLogMessage, LogMessage } from './window/helpers';
import { createBoundEvent } from './window/meta/boundEvent';
import { createRoot } from './window/root';
import { createEventHandler } from './window/scripts/eventHandler';
import { createScript } from './window/scripts/script';

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
      extensionContext: params.context.extensionContext,
      commands: {
        executeCommands,
      },
      macro: {
        uri: params.uri,
      },
      log: params.log,
      window: {
        ui: {
          attr: createAttribute,
          button: createButton,
          container: createContainer,
          handler: createEventHandler,
          input: createInput,
          on: createEvent,
          onHandle: createBoundEvent,
          root: createRoot,
          script: createScript,
          text: createText,
          tree: createTree,
        },
        getTreeViewId: () => params.viewManagers.tree.getId(params.executionId),
        getWebviewId: () => params.viewManagers.web.getId(params.executionId),
        handleLogMessage: (message: LogMessage) => handleLogMessage(params.context, message),
        releaseTreeViewId: (id: string) =>
          params.viewManagers.tree.releaseId(params.executionId, id as ViewId),
        releaseWebviewId: (id: string) =>
          params.viewManagers.web.releaseId(params.executionId, id as ViewId),
      },
    },
  } as MacrosApi;
}
