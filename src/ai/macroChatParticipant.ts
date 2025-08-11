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
Follow these rules exactly when creating macros.

1. Template Selection
   - Use an existing template from the provided list.
   - Instantiate via the ${CREATE_MACRO_TOOL_ID} tool.
   - If multiple templates match, ask the user to refine their request.
   - If a template partly satisfies the request, load it and suggest modifications.

2. Code Generation
   - If no template applies, generate new code without asking for confirmation.

---
Macro Creation Rules

• Single-File Entrypoint
  - The macro is one JavaScript/TypeScript file executed as an entrypoint script.
  - Do not split code into multiple files.
  - Top-level scope must not use \`return\`, \`await\`, or any \`export\` statements.
  - The result is the value of the last evaluated expression.

• Async and Promises
  - If you need to await operations, ensure the final value is a Promise.
  - Rely on the implicit last expression—avoid explicit \`return\`.
  - If last statement returns Promise, the macro only completes when the
    Promise resolves.

• Injected Context
  - \`vscode\` API
  - Node.js globals: \`require\`, \`process\`, \`console\`, \`Buffer\`, etc.
  - Do not re-import or shadow these variables.

• Disposal and Cancellation
  - Use the built-in \`__disposables\` array to register disposables.
  - Use \`__cancellationToken\` (a CancellationToken) for graceful termination.
  - At macro end, extension's disposal logic will run through \`__disposables\`.

• Long-Lived Macros
  To keep your macro alive beyond initial completion, choose one:
  - Add the header \`// @macro:retained\` to defer disposal until the user stops
    it via the "Macros: Show Running Macros" command.
  - Return a Promise that resolves only when finished (for example, on
  \`__cancellationToken.onCancellationRequested\` or after a UI dialog is dismissed).

---
Execution Context
  - By default, each macro invocation runs in a brand-new JS context
  - Do not rely on \`context.globalState\` to persist data between runs
    unless you use  // @macro:persistent.

  ---
Directives

- \`// @macro:retained\`
  Keep the macro running until manually stopped. Ideal for listeners or providers.

- \`// @macro:persistent\`
  Share a single execution context across all invocations.
  When writing macros with \`// @macro:persistent\`, always use \`var\` for all
  top-level variables. Do not use \`const\` or \`let\` at the top level, as this
  will cause errors on repeated runs.

- \`// @macro:singleton\`
  Allow only one instance to run concurrently.

- Multiple directives can be added as comma-separated values after \`@macro\`, e.g.
  \`// @macro:persistent,singleton\`
---
Sidebar Views

• View IDs
  - \`macrosView.treeview1\`
  - \`macrosView.treeview2\`
  - \`macrosView.treeview3\`

• Rules
  - Must use \`singleton\` as an ID in use cannot be claimed twice.
  - Return a Promise that resolves when the view closes.
  - To show the view, call:
    \`\`\`js
    vscode.commands.executeCommand(
      'setContext',
      '<viewId>.show',
      true
    );
    \`\`\`
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
      messages.push(
        vscode.LanguageModelChatMessage.User(CREATION_PROMPT),
        vscode.LanguageModelChatMessage.User(await this.readme.get())
      );
    }
    if (!this.hasCommandHistory(context, 'create')) {
      const manifest = await ManifestRaw.get(this.context);
      messages.push(
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
        vscode.LanguageModelChatMessage.User(CREATION_PROMPT),
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