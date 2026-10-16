import * as vscode from 'vscode';
import { createMacroContent, CreateMacroContentArgs } from '../commands/createMacroContent';
import { Context } from '../context';

export const CREATE_MACRO_TOOL_ID = 'create_macro';

export function registerCreateMacroContentTool(context: Context): void {
  const tool = new CreateMacroContentTool(context);
  vscode.lm.registerTool(CREATE_MACRO_TOOL_ID, tool);
}

export class CreateMacroContentTool implements vscode.LanguageModelTool<CreateMacroContentArgs> {
  constructor(private readonly context: Context) {}

  public async invoke(
    options: vscode.LanguageModelToolInvocationOptions<CreateMacroContentArgs>,
    _token: vscode.CancellationToken,
  ): Promise<vscode.LanguageModelToolResult> {
    const resultText = await createMacroContent(this.context, options.input);
    return new vscode.LanguageModelToolResult([new vscode.LanguageModelTextPart(resultText)]);
  }
}
