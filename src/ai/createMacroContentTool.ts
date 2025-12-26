import * as vscode from 'vscode';
import { createMacroContent, CreateMacroContentArgs } from '../commands/createMacroContent';
import { ExtensionContext } from '../extensionContext';

export const CREATE_MACRO_TOOL_ID = 'create_macro';

export function registerCreateMacroContentTool(context: ExtensionContext): void {
  const tool = new CreateMacroContentTool(context);
  vscode.lm.registerTool(CREATE_MACRO_TOOL_ID, tool);
}

export class CreateMacroContentTool implements vscode.LanguageModelTool<CreateMacroContentArgs> {
  private readonly context: ExtensionContext;

  constructor(context: ExtensionContext) {
    this.context = context;
  }

  public async invoke(
    options: vscode.LanguageModelToolInvocationOptions<CreateMacroContentArgs>,
    _token: vscode.CancellationToken,
  ): Promise<vscode.LanguageModelToolResult> {
    const resultText = await createMacroContent(this.context, options.input);
    return new vscode.LanguageModelToolResult([new vscode.LanguageModelTextPart(resultText)]);
  }
}
