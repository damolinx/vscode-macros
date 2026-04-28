import { MacroContextParams } from '../core/execution/macroContext';
import { ViewId } from '../core/execution/views/viewId';
import { executeCommands } from './executeCommands';
import { MacroContext } from './macroContext';
import { MacroLogOutputChannel } from './macroLogOutputChannel';
import { MacrosApi } from './macrosApi';
import { createAttribute } from './window/attributes/attribute';
import { createEvent } from './window/attributes/event';
import { createText } from './window/content/text';
import { createButton } from './window/elements/button';
import { createContainer } from './window/elements/container';
import { createInput } from './window/elements/input';
import { createLink } from './window/elements/link';
import { createTextarea } from './window/elements/textarea';
import { createTree } from './window/elements/tree';
import { handleLogMessage, LogMessage } from './window/helpers';
import { createBoundEvent } from './window/meta/boundEvent';
import { createRoot } from './window/root';
import { createEventHandler } from './window/scripts/eventHandler';
import { createScript } from './window/scripts/script';

export function initializeMacrosApi(
  context: MacroContext,
  params: MacroContextParams,
): MacroContext {
  const updatedContext = Object.assign(context, createMacroApi(params));
  return updatedContext;
}

export function createMacroApi(params: MacroContextParams): MacrosApi {
  const { extensionContext, log, viewManagers } = params.context;

  return {
    __cancellationToken: params.token,
    __disposables: params.disposables,
    __runId: params.executionId.toString(),
    __startup: params.startup,
    macros: {
      extensionContext,
      commands: {
        executeCommands,
      },
      log: new MacroLogOutputChannel(params.executionId, params.context),
      macro: {
        uri: params.uri,
      },
      window: {
        ui: {
          attr: createAttribute,
          button: createButton,
          container: createContainer,
          handler: createEventHandler,
          input: createInput,
          link: createLink,
          on: createEvent,
          onHandle: createBoundEvent,
          root: createRoot,
          script: createScript,
          text: createText,
          textarea: createTextarea,
          tree: createTree,
        },
        getTreeViewId: () => viewManagers.tree.getId(params.executionId),
        getWebviewId: () => viewManagers.web.getId(params.executionId),
        handleLogMessage: (message: LogMessage) => handleLogMessage(log, message),
        releaseTreeViewId: (id: string) =>
          viewManagers.tree.releaseId(params.executionId, id as ViewId),
        releaseWebviewId: (id: string) =>
          viewManagers.web.releaseId(params.executionId, id as ViewId),
      },
    },
  } as MacrosApi;
}
