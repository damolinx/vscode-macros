import * as vscode from 'vscode';
import { ExtensionContext } from '../extensionContext';
import { MACRO_PROMPT } from './macroChatPrompt';

export const MACROS_CHAT_PARTICIPANT_ID = 'macros.chatParticipant';
export const MACRO_TOOL_TAG = 'macro';

export function registerMacroChatParticipant(context: ExtensionContext): void {
  const macroParticipant = new MacroChatParticipant(context);
  const participant = vscode.chat.createChatParticipant(
    MACROS_CHAT_PARTICIPANT_ID,
    (request, context, response, token) =>
      macroParticipant.handleRequest(request, context, response, token),
  );
  participant.iconPath = new vscode.ThemeIcon('run-all');
  context.disposables.push(participant);
}

export class MacroChatParticipant {
  private readonly context: ExtensionContext;

  constructor(context: ExtensionContext) {
    this.context = context;
  }

  private getMessages(
    { prompt }: vscode.ChatRequest,
    { history }: vscode.ChatContext,
  ): vscode.LanguageModelChatMessage[] {
    const messages = history.reduce((turnAcc, turn) => {
      if (turn instanceof vscode.ChatRequestTurn) {
        turnAcc.push(vscode.LanguageModelChatMessage.User(turn.prompt));
      } else if (turn.participant === MACROS_CHAT_PARTICIPANT_ID) {
        const content = turn.response.reduce(
          (partAcc, part) =>
            part instanceof vscode.ChatResponseMarkdownPart ? partAcc + part.value.value : partAcc,
          '',
        );
        turnAcc.push(vscode.LanguageModelChatMessage.Assistant(content));
      }
      return turnAcc;
    }, [] as vscode.LanguageModelChatMessage[]);

    if (messages.length === 0) {
      messages.push(vscode.LanguageModelChatMessage.Assistant(MACRO_PROMPT));
    }

    messages.push(vscode.LanguageModelChatMessage.User(prompt));
    return messages;
  }

  public async handleRequest(
    request: vscode.ChatRequest,
    context: vscode.ChatContext,
    response: vscode.ChatResponseStream,
    token: vscode.CancellationToken,
  ): Promise<vscode.ChatResult> {
    const result: vscode.ChatResult = {};
    const toolRequests: vscode.LanguageModelToolCallPart[] = [];
    switch (request.command) {
      case 'create':
        response.button({
          title: 'Create from Template',
          command: 'macros.new.macro',
        });
        break;
      default:
        for await (const part of (
          await request.model.sendRequest(
            this.getMessages(request, context),
            { tools: this.tools },
            token,
          )
        ).stream) {
          if (part instanceof vscode.LanguageModelTextPart) {
            response.markdown(part.value);
          } else if (part instanceof vscode.LanguageModelToolCallPart) {
            toolRequests.push(part);
          }
        }
        break;
    }

    if (toolRequests.length) {
      await this.handleToolRequests(request, toolRequests, response, token);
    }
    return result;
  }

  private async handleToolRequests(
    { toolInvocationToken }: vscode.ChatRequest,
    toolRequests: vscode.LanguageModelToolCallPart[],
    response: vscode.ChatResponseStream,
    token: vscode.CancellationToken,
  ) {
    response.progress(`Running ${toolRequests.length} tools`);
    const toolResults = await Promise.allSettled(
      toolRequests.map(async ({ input, name }) => {
        const toolResponse = await vscode.lm.invokeTool(
          name,
          { input, toolInvocationToken },
          token,
        );
        toolResponse.content
          .filter((part) => part instanceof vscode.LanguageModelTextPart)
          .forEach((part) => response.markdown(part.value));
      }),
    );

    toolResults.forEach((toolResult, i) => {
      if (toolResult.status === 'rejected') {
        this.context.log.error(`Tool '${toolRequests[i].name}' failed —`, toolResult.reason);
      }
    });
  }

  private get tools(): vscode.LanguageModelChatTool[] {
    return vscode.lm.tools.filter(({ tags }) => tags.includes(MACRO_TOOL_TAG));
  }
}
