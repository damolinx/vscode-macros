export const MACRO_LANGUAGE = 'javascript';
export const MACRO_LANGUAGES: readonly string[] = [MACRO_LANGUAGE];

export const MACRO_EXTENSION = '.macro.js';
export const MACRO_EXTENSIONS: readonly string[] = [MACRO_EXTENSION, '.js', '.cjs'];

export const MACROS_FILTER: Record<string, string[]> = {
  'JavaScript Macro': ['macro.js'],
  'JavaScript': ['js', 'cjs'],
};