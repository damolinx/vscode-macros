import { ExecutionOptions } from '../../execution/executionOptions';

export type MacroOptionType = keyof CodeMacroOptions;

export interface CodeMacroOptions extends ExecutionOptions {
  /**
   * Macro uses a shared context. Default: false.
   */
  persistent?: boolean;
  /**
   * Macro is not automatically terminated. Default: false.
   */
  retained?: boolean;
}

export function parseCodeMacroOptions(code: string): CodeMacroOptions {
  const options: CodeMacroOptions = {};
  for (const match of code.matchAll(/\/\/\s*@macro:\s*(.+)$/gm)) {
    const optionsText = match[1];
    for (const option of optionsText.split(/\s*,\s*/)) {
      switch (option) {
        case 'persistent':
        case 'retained':
        case 'singleton':
          options[option] = true;
          break;
      }
    }
  }

  return options;
}
