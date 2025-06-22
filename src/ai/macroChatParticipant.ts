import * as vscode from 'vscode';
import { CREATE_MACRO_TOOL_ID } from './macroCreateTool';
import { ExtensionContext } from '../extensionContext';
import { ManifestRaw } from '../macroTemplates';
import { Lazy } from '../utils/lazy';
import { readFile } from '../utils/resources';

export const MACROS_CHAT_PARTICIPANT_ID = 'macros.chatParticipant';

export const MACRO_PROMPT = `
You are a subject matter expert on VS Code Macros. The following message will
provide basic documentation on macros for context.
`;

export const CREATION_PROMPT = `
You are an assistant to create a VS Code Macro.
There are two options to satisfy this request:
- Use an existing template. The list of available templates is provided next.
  They can be instantiated via the ${CREATE_MACRO_TOOL_ID} tool. If there are
  multiple matches, ask the user to refine the request. If a given template
  partially satisfies the request, load it and then suggest modifications.
- Generate new code if no template satisfies the request. Do not ask the user
  for confirmation, just generate the code. Basic rules for macro creation:
  - A macro is a JavaScript file that is run as an entry point script. DO NOT
    use return, module.exports or await in any top level statements.
  - The script runs in a context where vscode and NodeJS global namespaces
    are already included, do not import them. Any NodeJS library, however,
    can be required. Only use CommonJS' require statements.
  - If there is any async code, OR need to wait for completion, the script
    result should be a Promise (do not use return, last statement is the
    implicit result).
  - If any UI component is created, also use a Promise as result, and only
    resolve the promise when the UI component is closed / disposed.
  - Macros should use the built-in __disposables variable to register any
    objects that must be explicitly disposed when macro exits. This is the
    direct replacement of context.subscriptions.
  - Macros should use the __cancellationToken CancellationToken variable to
    support stopping the macro from the extension.
  - Following directives are available:
    - '// @macro:singleton' so macro can have a single running instance.
    - '// @macro:persistent' so macro context is shared across all instances.
  - TreeView or WebView targeting the sidebar, use IDs like 'macrosView.webview1' (IDs 1-3).
    These macros must be singletons and should return a Promise that resolves when the view
    closes. The macro should not exit before the view is disposed. To make these views visible,
    'vscode.commands.executeCommand('setContext', 'macrosView.webview1.show', true);' must
    be called.
`;

export type ChatCommand = 'create';
export type ChatTag = 'macro' | 'create';

export class MacroChatParticipant implements vscode.Disposable {
  private readonly context: vscode.ExtensionContext;
  private readonly participant: vscode.ChatParticipant;
  private readonly readme: Lazy<Promise<string>>;

  constructor({ extensionContext }: ExtensionContext) {
    this.context = extensionContext;
    this.participant = vscode.chat.createChatParticipant(
      MACROS_CHAT_PARTICIPANT_ID,
      async (request: vscode.ChatRequest, context: vscode.ChatContext, response: vscode.ChatResponseStream, token: vscode.CancellationToken) => {
        if (this.isCommandChat(request, context, 'create')) {
          await this.handleCreateCommand(request, context, response, token);
        } else {
          await this.handleRequest(request, context, response, token);
        }
      },
    );
    this.participant.iconPath = new vscode.ThemeIcon('run-all');
    this.readme = new Lazy(() => readFile(this.context, '../README.md'));
  }

  dispose() {
    this.participant.dispose();
  }

  private async handleCreateCommand(request: vscode.ChatRequest, context: vscode.ChatContext, responseStream: vscode.ChatResponseStream, token: vscode.CancellationToken): Promise<void> {
    const messages = this.getMessages(context);
    if (messages.length === 0) {
      messages.push(vscode.LanguageModelChatMessage.User(await this.readme.get()));
    }
    if (!this.hasCommandHistory(context, 'create')) {
      const manifest = await ManifestRaw.get(this.context);
      messages.push(
        vscode.LanguageModelChatMessage.User(CREATION_PROMPT),
        vscode.LanguageModelChatMessage.User(`Available templates: ${manifest}`));
    }

    messages.push(vscode.LanguageModelChatMessage.User(`User prompt: ${request.prompt}`));
    const response = await request.model.sendRequest(
      messages, { tools: this.getChatTools('macro', 'create') }, token);

    for await (const fragment of response.stream) {
      if (fragment instanceof vscode.LanguageModelTextPart) {
        responseStream.markdown(fragment.value);
      } else if (fragment instanceof vscode.LanguageModelToolCallPart) {
        const toolResponse = await vscode.lm.invokeTool(fragment.name, {
          input: fragment.input,
          toolInvocationToken: request.toolInvocationToken,
        });
        for (const toolResponseContent of toolResponse.content.filter((c) => c instanceof vscode.LanguageModelTextPart)) {
          responseStream.markdown(new vscode.MarkdownString(`\`\`\`javascript\n${toolResponseContent.value}`));
        }
      } else {
        responseStream.markdown('Unknwon');
      }
    }
  }

  private async handleRequest(request: vscode.ChatRequest, context: vscode.ChatContext, responseStream: vscode.ChatResponseStream, token: vscode.CancellationToken): Promise<void> {
    const messages = this.getMessages(context);
    if (messages.length === 0) {
      messages.push(
        vscode.LanguageModelChatMessage.User(MACRO_PROMPT),
        vscode.LanguageModelChatMessage.User(await this.readme.get()),
      );
    }
    messages.push(vscode.LanguageModelChatMessage.User(`User prompt: ${request.prompt}`));

    const response = await request.model.sendRequest(
      messages, { tools: this.getChatTools('macro') }, token);

    for await (const fragment of response.text) {
      responseStream.markdown(fragment);
    }
  }

  private getChatTools(...tags: ChatTag[]): vscode.LanguageModelChatTool[] | undefined {
    return vscode.lm.tools.filter(
      (tool) => tags.every((tag) => tool.tags.includes(tag)));
  }

  private getMessages(context: vscode.ChatContext): vscode.LanguageModelChatMessage[] {
    const messages = context.history
      .filter((turn) => turn instanceof vscode.ChatResponseTurn)
      .filter((turn) => turn.participant === MACROS_CHAT_PARTICIPANT_ID)
      .map((turn) =>
        vscode.LanguageModelChatMessage.Assistant(
          turn.response.reduce((prev, curr) =>
            (curr instanceof vscode.ChatResponseMarkdownPart)
              ? prev.concat(curr.value.value)
              : prev
            , '')),
      );
    return messages;
  }

  private hasCommandHistory(context: vscode.ChatContext, command: ChatCommand) {
    return context.history.some(
      (turn) => turn.command === command && turn instanceof vscode.ChatRequestTurn);
  }

  private isCommandChat(request: vscode.ChatRequest, context: vscode.ChatContext, command: ChatCommand) {
    return request.command === command || this.hasCommandHistory(context, command);
  }
}