import * as vscode from 'vscode';
import { createMacro } from '../commands/createMacro';
import { runMacro } from '../commands/runMacro';
import { MacroLanguageId } from '../core/language';
import { ExtensionContext } from '../extensionContext';

export const RUN_MACRO_CONTENT_TOOL_ID = 'run_macro_content';

export function registeRunMacroContentTool(context: ExtensionContext): void {
  vscode.lm.registerTool(RUN_MACRO_CONTENT_TOOL_ID, new RunMacroContentTool(context));
}

export interface RunMacroContentToolArgs {
  content: string;
  language: MacroLanguageId;
}

export class RunMacroContentTool implements vscode.LanguageModelTool<RunMacroContentToolArgs> {
  private readonly context: ExtensionContext;

  constructor(context: ExtensionContext) {
    this.context = context;
  }

  public async invoke(
    options: vscode.LanguageModelToolInvocationOptions<RunMacroContentToolArgs>,
    _token: vscode.CancellationToken,
  ): Promise<vscode.LanguageModelToolResult> {
    const document = await createMacro(this.context, undefined, options.input);

    let resultText = '';
    if (document) {
      runMacro(this.context, document); // DO NOT await
      resultText = `Created ${document.uri.toString(true)} and ran it as a macro`;
    } else {
      resultText = 'Failed to create macro';
    }

    return new vscode.LanguageModelToolResult([new vscode.LanguageModelTextPart(resultText)]);
  }
}
