import { MacroLanguageId } from '../core/language';
import { ExtensionContext } from '../extensionContext';
import { createMacro } from './createMacro';
import { runMacro } from './runMacro';

export interface CreateMacroContentArgs {
  content: string;
  language: MacroLanguageId;
  run?: boolean;
}

export async function createMacroContent(
  context: ExtensionContext,
  args: CreateMacroContentArgs,
): Promise<string> {
  const document = await createMacro(context, undefined, args);

  let resultText: string;
  if (document) {
    if (args.run) {
      runMacro(context, document); // DO NOT await
      resultText = `Created and executed '${document.uri.toString(true)}' macro`;
    } else {
      resultText = `Created '${document.uri.toString(true)}' macro`;
    }
  } else {
    resultText = 'Failed to create macro';
  }

  return resultText;
}
