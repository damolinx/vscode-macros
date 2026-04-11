import { ExtensionContext } from '../extensionContext';
import { Lazy } from '../utils/lazy';
import { readFile } from '../utils/resources';

export const CURSOR_RULE_RESOURCE = 'ai/cursor-rule.txt';
export const MACROS_PROMPT_RESOURCE = 'ai/macros-prompt.txt';

export const MacrosPrompt = new Lazy(async ({ extensionContext }: ExtensionContext) => {
  const content = await readFile(extensionContext, MACROS_PROMPT_RESOURCE);
  return content;
});

export const CursorRule = new Lazy(async (context: ExtensionContext) => {
  const [content, macrosPrompt] = await Promise.all([
    readFile(context.extensionContext, CURSOR_RULE_RESOURCE),
    MacrosPrompt.get(context),
  ]);
  return content.replace('{{MACRO_SPEC}}', macrosPrompt);
});
