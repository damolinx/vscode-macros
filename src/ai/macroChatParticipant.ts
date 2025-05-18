import * as vscode from 'vscode';
import { Lazy } from '../common/lazy';
import { CREATE_MACRO_TOOL_ID } from './macroCreateTool';
import { readFile } from '../common/resources';
import { ManifestRaw } from '../macroTemplates';

export const MACROS_CHAT_PARTICIPANT_ID = 'macros.chatParticipant';

export const MACRO_PROMPT = `
You are a subject matter expert on VSCode Macros. The followin message will
provide basic documentation on macros for context.
`;

export const CREATION_PROMPT = `
You are an assistant to create a VS Code Macro.
There are two options to satisfy this request:
- Use an existing template. The list of available templates is provided next.
  They can be instantiated via the ${CREATE_MACRO_TOOL_ID} tool. If there are
  multiple matches, ask the user to refine the request. If a given template
  partially satisfies the request, load it and then suggest modifications.
- Generate new code if no template satisfes the request. Do not ask the user
  for confirmation, just generate the code. Basic rules for macro creation:
  - A macro is a JavaScript that is run as an entry point script. DO NOT use
     return, module.exports or await in any top level statements.
  - The script runs in a context where vscode and NodeJS global namespaces
    are already included, do not import them. Any NodeJS library, howver,
    can be required. Only use CommonJS' require statements.
  - If there is any async code, OR need to wait for completion, the script
    result should be a Promise (do not use return, last statement is the
    impolicit result).
  - If any UI component is created, also use a Promise as result, and only
   resolve the promise when the UI compoennt is closed / disposed.
  - Macros should use the built-in __disposables variable to register any
    objects that must be explicitly disposed when macro exists. This is the
    direct replacement of context.subscriptions.
  - Macros should use the __cancellationToken CancellationToken variable to
    support stopping the macro from the extension.
  - Following directives are available:
    - '// @macro:singleton' so macro can have a single running instance.
    - '// @macro:persistent' so macro context is shared across all instances.
  - TreeView or WebView targeting the sidebar, use IDs like 'macrosView.webview1' (IDs 1-3).
    These macros must be singletons and should return a Promise that resolves when the view
    closes. The macro should not exit before view is disposed. To make these view visible,
    'vscode.commands.executeCommand('setContext', 'macrosView.webview1.show', true);' must
    be called.
`;

export class MacroChatParticipant implements vscode.Disposable {
  private readonly context: vscode.ExtensionContext;
  private readonly participant: vscode.ChatParticipant;
  private readonly readme: Lazy<Promise<string>>;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.participant = vscode.chat.createChatParticipant(
      MACROS_CHAT_PARTICIPANT_ID,
      (request: vscode.ChatRequest, context: vscode.ChatContext, response: vscode.ChatResponseStream, token: vscode.CancellationToken) => {
        switch (request.command) {
          case 'create':
            return this.handleCreateCommand(request, context, response, token);
          default:
            return this.handleRequest(request, context, response, token);
        }
      },
    );
    this.participant.iconPath = new vscode.ThemeIcon('run-all');
    this.readme = new Lazy(() => readFile(this.context, '../README.md'));
  }

  dispose() {
    this.participant.dispose();
  }

  private async handleCreateCommand(request: vscode.ChatRequest, _context: vscode.ChatContext, responseStream: vscode.ChatResponseStream, token: vscode.CancellationToken): Promise<void> {
    const manifest = await ManifestRaw.get(this.context);
    const messages = [
      vscode.LanguageModelChatMessage.User(CREATION_PROMPT),
      vscode.LanguageModelChatMessage.User(`Available templates: ${manifest}`),
      vscode.LanguageModelChatMessage.User(`User prompt: ${request.prompt}`),
    ];

    const response = await request.model.sendRequest(messages, {
      tools: vscode.lm.tools.filter(tool => ['macro', 'create'].every(tag => tool.tags.includes(tag))),
    }, token);

    for await (const fragment of response.stream) {
      if (fragment instanceof vscode.LanguageModelTextPart) {
        responseStream.markdown(fragment.value);
      } else if (fragment instanceof vscode.LanguageModelToolCallPart) {
        const toolResponse = await vscode.lm.invokeTool(fragment.name, {
          input: fragment.input,
          toolInvocationToken: request.toolInvocationToken,
        });
        for (const toolResponseContent of toolResponse.content.filter(c => c instanceof vscode.LanguageModelTextPart)) {
          responseStream.markdown(new vscode.MarkdownString(`\`\`\`javascript\n${toolResponseContent.value}`));
        }
      } else {
        responseStream.markdown('Unknwon');
      }
    }
  }

  private async handleRequest(request: vscode.ChatRequest, _context: vscode.ChatContext, responseStream: vscode.ChatResponseStream, token: vscode.CancellationToken): Promise<void> {
    const messages: vscode.LanguageModelChatMessage[] = [
      vscode.LanguageModelChatMessage.User(MACRO_PROMPT),
      vscode.LanguageModelChatMessage.User(await this.readme.get()),
      vscode.LanguageModelChatMessage.User(request.prompt),
    ];

    const response = await request.model.sendRequest(messages, {
      tools: vscode.lm.tools.filter(tool => ['macro'].every(tag => tool.tags.includes(tag))),
    },
      token);

    for await (const fragment of response.text) {
      responseStream.markdown(fragment);
    }
  }
}