import * as vscode from 'vscode';
import { ExtensionContext } from '../extensionContext';
import { templates } from '../macroTemplates';

export const CREATE_MACRO_TOOL_ID = 'create_macro_from_template';

/**
 * Register tool.
 */
export function registerMacroCreateLanguageModelTool(context: ExtensionContext): vscode.Disposable {
  return vscode.lm.registerTool(
    CREATE_MACRO_TOOL_ID,
    new MacroCreateTool(context));
}

export interface MacroCreateToolArgs {
  path: string;
}

export class MacroCreateTool implements vscode.LanguageModelTool<MacroCreateToolArgs> {
  private readonly context: ExtensionContext;

  constructor(context: ExtensionContext) {
    this.context = context;
  }

  public async invoke(options: vscode.LanguageModelToolInvocationOptions<MacroCreateToolArgs>, _token: vscode.CancellationToken): Promise<vscode.LanguageModelToolResult> {
    const loadableTemplates = await templates(this.context);
    const loadableTemplate = loadableTemplates.find((t) => t.path === options.input.path);
    const loadedTemplate = loadableTemplate ? await loadableTemplate.load() : '';
    return new vscode.LanguageModelToolResult([
      new vscode.LanguageModelTextPart(loadedTemplate),
    ]);
  }
}