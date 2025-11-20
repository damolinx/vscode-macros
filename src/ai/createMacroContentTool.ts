import * as vscode from 'vscode';
import { createMacro } from '../commands/createMacro';
import { runMacro } from '../commands/runMacro';
import { MacroLanguageId } from '../core/language';
import { ExtensionContext } from '../extensionContext';

export const CREATE_MACRO_TOOL_ID = 'create_macro';

export function registerCreateMacroContentTool(context: ExtensionContext): void {
  vscode.lm.registerTool(CREATE_MACRO_TOOL_ID, new CreateMacroContentTool(context));
}

export interface CreateMacroContentToolArgs {
  content: string;
  language: MacroLanguageId;
  run?: boolean;
}

export class CreateMacroContentTool
  implements vscode.LanguageModelTool<CreateMacroContentToolArgs> {
  private readonly context: ExtensionContext;

  constructor(context: ExtensionContext) {
    this.context = context;
  }

  public async invoke(
    options: vscode.LanguageModelToolInvocationOptions<CreateMacroContentToolArgs>,
    _token: vscode.CancellationToken,
  ): Promise<vscode.LanguageModelToolResult> {
    const document = await createMacro(this.context, undefined, options.input);

    let resultText: string;
    if (document) {
      if (options.input.run) {
        runMacro(this.context, document); // DO NOT await
        resultText = `Created and executed '${document.uri.toString(true)}' macro`;
      } else {
        resultText = `Created '${document.uri.toString(true)}' macro`;
      }
    } else {
      resultText = 'Failed to create macro';
    }

    return new vscode.LanguageModelToolResult([new vscode.LanguageModelTextPart(resultText)]);
  }
}
