export interface MacroOptions {
  /**
   * Macro uses a persistent context. Default: false.
   */
  persistent?: boolean;
  /**
   * Macro can have only one instance running. Default: false. 
   */
  singleton?: boolean;
}

export function parseOptions(code: string): MacroOptions {
  const options: MacroOptions = {};
  const persistent = /\/\/\s*@macro:persist\s*$/m.test(code);
  if (persistent) {
    options.persistent = true;
  }
  const singleton = /\/\/\s*@macro:singleton\s*$/m.test(code);
  if (singleton) {
    options.singleton = true;
  }
  return options;
} 