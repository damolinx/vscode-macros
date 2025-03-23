export interface MacroOptions {
  /**
   * Macro uses a persistent context. Default: false.
   */
  persistent?: boolean;
  /**
   * Macro can only have a single running instance. Default: false.
   */
  singleton?: boolean;
}

export function parseOptions(code: string): MacroOptions {
  const options: MacroOptions = {};

  for (const match of code.matchAll(/\/\/\s*@macro:\s*(?<option>\w+)\s*$/gm)) {
    if (match.groups?.option) {
      switch (match.groups.option) {
        case 'persistent':
          options.persistent = true;
          break;
        case 'singleton':
          options.singleton = true;
          break;
      }
    }
  }
  return options;
} 