export type MacroOptionType = keyof MacroOptions;

export interface MacroOptions {
  /**
   * Macro uses a shared context. Default: false.
   */
  persistent?: boolean;
  /**
   * Macro is not automatically terminated. Default: false.
   */
  retained?: boolean;
  /**
   * Macro can only have a single running instance. Default: false.
   */
  singleton?: boolean;
}

export function parseOptions(code: string): MacroOptions {
  const options: MacroOptions = {};
  for (const match of code.matchAll(/\/\/\s*@macro:\s*(.+)$/gm)) {
    const optionsText = match[1];
    for (const option of optionsText.split(/\s*,\s*/)) {
      switch (option) {
        case 'persistent':
          options.persistent = true;
          break;
        case 'retained':
          options.retained = true;
          break;
        case 'singleton':
          options.singleton = true;
          break;
      }
    }
  }

  return options;
}
