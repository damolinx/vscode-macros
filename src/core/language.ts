import * as vscode from 'vscode';
import { PathLike, uriBasename } from '../utils/uri';

export interface Language {
  readonly id: string;
  readonly name: string;
  readonly extensions: readonly string[];
  readonly exclusions?: readonly string[];
}

export const MACRO_LANGUAGES: readonly Language[] = [
  {
    id: 'javascript',
    name: 'JavaScript',
    extensions: ['macro.js', 'js', 'macro.cjs', 'cjs'],
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    extensions: ['macro.ts', 'ts'],
    exclusions: ['d.ts'],
  },
];

export const MACRO_PREFERRED_EXTENSION = '.macro.js';

export const MACRO_PREFERRED_LANGUAGE = 'javascript';

export const MACRO_PREFERRED_SELECTOR: vscode.DocumentSelector = [
  { scheme: 'untitled', language: MACRO_PREFERRED_LANGUAGE },
  ...MACRO_LANGUAGES.map((lang) => ({
    pattern: `**/*.{${lang.extensions.filter((ext) => ext.startsWith('macro.')).join(',')}}`,
  })),
];

export function isFeatureEnabledMacro(pathOrUri: PathLike): boolean {
  const result = tryResolveMacroLanguage(pathOrUri);
  return !!result?.ext.startsWith('.macro.');
}

export function isMacro(pathOrUri: PathLike): boolean {
  const result = tryResolveMacroLanguage(pathOrUri);
  return !!result;
}

export function isMacroLangId(langId: string): langId is Language['id'] {
  return !!tryResolveMacroLanguageFromId(langId);
}

export function tryResolveMacroLanguageFromId(langId: string): Language | undefined {
  return MACRO_LANGUAGES.find((lang) => lang.id === langId);
}

export function macroGlobPattern(pathOrUri: PathLike): vscode.RelativePattern {
  const extensions = MACRO_LANGUAGES.flatMap((lang) => lang.extensions);
  return new vscode.RelativePattern(pathOrUri, `*.{${extensions.join(',')}}`);
}

export function tryResolveMacroExt(pathOrUri: PathLike): string | undefined {
  const result = tryResolveMacroLanguage(pathOrUri);
  return result?.ext;
}

export function tryResolveMacroLangId(pathOrUri: PathLike): string | undefined {
  const result = tryResolveMacroLanguage(pathOrUri);
  return result?.language.id;
}

function tryResolveMacroLanguage(
  pathOrUri: PathLike,
): { language: Language; ext: string; filename: string } | undefined {
  const filename = uriBasename(pathOrUri).toLowerCase();
  for (const language of MACRO_LANGUAGES) {
    for (const ext of language.extensions.flatMap((ext) => [`.macro.${ext}`, `.${ext}`])) {
      if (filename.endsWith(ext) && !isExcluded(filename, language.exclusions)) {
        return {
          filename,
          language,
          ext,
        };
      }
    }
  }

  return undefined;

  function isExcluded(filename: string, exclusions?: readonly string[]): boolean {
    return exclusions?.some((exc) => filename.endsWith(`.${exc}`)) ?? false;
  }
}
