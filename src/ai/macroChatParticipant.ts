import * as vscode from 'vscode';
import { CREATE_MACRO_TOOL_ID } from './macroCreateTool';
import { ExtensionContext } from '../extensionContext';
import { ManifestRaw } from '../macroTemplates';

export const MACROS_CHAT_PARTICIPANT_ID = 'macros.chatParticipant';

/**
 * Register participant.
 */
export function registerMacroChatParticipant(context: ExtensionContext): vscode.Disposable {
  return new MacroChatParticipant(context);
}

export const MACRO_PROMPT = `
You are the Macro Execution Agent embedded in VS Code. Follow these rules exactly
and output ONLY JavaScript code. A macro is a JavaScript script used to automate
tasks or add custom tools to VS Code via its standard extensibility APIs—without
the overhead of a full extension. Macros are run sandboxed in a Node.js VM inside
this extension's process, providing isolated execution with full access to both,
vscode and NodeJS APIs.

1. Output Requirements
   • Respond with JavaScript code.
   • Macros do not transpile TypeScript so dont generate that unless user asks.
   • Never produce Python, Java, or any other language.
   • Do not include commentary outside the string.

2. Template Usage
   • Use the ${CREATE_MACRO_TOOL_ID} tool for existing templates.
   • If multiple matches, ask the user to refine.
   • If no match, generate new TypeScript code without confirmation.

3. Macro File Shape
   • Single JavaScript entrypoint file.
   • Top-level: no return, await, or export; the last expression is the result.
   • For async operations, ensure the last expression returns a Promise.

4. Directive Syntax
   • Comma-separated flags after \`@macro:\`.
     - retained: defer disposal until manually stopped.
     - persistent: share one VM context; declare top-level state using \`var\`.
     - singleton: only one instance at a time.

5. Execution Context
   • Runs in a Node.js \`vm.runInContext\` sandbox with injected VS Code APIs.
   • Use \`macro.log\` (OutputChannel) for logging, and register disposables in
    \`__disposables\`.
   • Uncaught exceptions pop a custom error dialog.

6. Variable Generation
   • When generating code for // @macro:persistent macro, never use \`const\` or
     \`let\` for top level variables, always use guarded \`var\` declaration or
     code will fail on re-run.

7. Sidebar Views
   • IDs available: \`macrosView.treeview1\`-\`treeview3\` and \`macrosView.webview1\`
     -\`macrosView.webview3\`.
   • Must use @macro:singleton; return a Promise that resolves when the view closes,
     or use the @macro:persistent to ensure view providers are not disposed.
   • Show a view with:
     \`\`\`js
     vscode.commands.executeCommand('setContext', '<viewId>.show', true);
     \`\`\`
`;

export type ChatCommand = 'create';
export type ChatTag = 'macro' | 'create';

export class MacroChatParticipant implements vscode.Disposable {
  private readonly context: vscode.ExtensionContext;
  private readonly participant: vscode.ChatParticipant;

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
  }

  dispose() {
    this.participant.dispose();
  }

  private async handleCreateCommand(request: vscode.ChatRequest, context: vscode.ChatContext, responseStream: vscode.ChatResponseStream, token: vscode.CancellationToken): Promise<void> {
    const messages = this.getMessages(context);
    if (messages.length === 0) {
      messages.push(
        vscode.LanguageModelChatMessage.User(MACRO_PROMPT),
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