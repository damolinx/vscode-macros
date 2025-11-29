import * as vscode from 'vscode';
import { PathLike, uriBasename } from '../utils/uri';

export type MacroLanguageId = 'javascript' | 'typescript';

export interface MacroLanguage {
  readonly id: MacroLanguageId;
  readonly name: string;
  readonly defaultExtension: string;
  readonly extensions: readonly string[];
  readonly exclusions?: readonly string[];
}

export const MACRO_LANGUAGES: Readonly<Record<MacroLanguageId, MacroLanguage>> = {
  javascript: {
    id: 'javascript',
    name: 'JavaScript',
    defaultExtension: '.macro.js',
    extensions: ['.macro.js', '.js', '.macro.cjs', '.cjs'],
  },
  typescript: {
    id: 'typescript',
    name: 'TypeScript',
    defaultExtension: '.macro.ts',
    extensions: ['.macro.ts', '.ts'],
    exclusions: ['.d.ts'],
  },
};

export const MACRO_PREFERRED_LANGUAGE = 'javascript';

export const MacroPreferredSelector: vscode.DocumentSelector = [
  { scheme: 'untitled', language: MACRO_PREFERRED_LANGUAGE },
  ...Object.values(MACRO_LANGUAGES).map((lang) => ({
    pattern: `**/*.{${lang.extensions
      .filter((ext) => ext.startsWith('.macro.'))
      .map((ext) => ext.substring(1))
      .join(',')}}`,
  })),
];

export function isFeatureEnabled(pathOrUri: PathLike): boolean {
  return uriBasename(pathOrUri, true).endsWith('.macro');
}

export function isMacro(pathOrUri: PathLike): boolean {
  return !!tryResolveMacroLanguage(pathOrUri);
}

export function isMacroLangId(langId: string): langId is MacroLanguage['id'] {
  return langId in MACRO_LANGUAGES;
}

export function macroGlobPattern(pathOrUri: PathLike): vscode.RelativePattern {
  const extensions = Object.values(MACRO_LANGUAGES).flatMap((lang) =>
    lang.extensions.map((ext) => ext.substring(1)),
  );
  return new vscode.RelativePattern(pathOrUri, `*.{${extensions.join(',')}}`);
}

export function tryResolveMacroExt(pathOrUri: PathLike): string | undefined {
  return tryResolveMacroLanguage(pathOrUri)?.extension;
}

export function tryResolveMacroLanguage(
  pathOrUri: PathLike,
): { language: MacroLanguage; extension: string; filename: string } | undefined {
  const filename = uriBasename(pathOrUri).toLowerCase();
  for (const language of Object.values(MACRO_LANGUAGES)) {
    for (const extension of language.extensions.flat()) {
      if (
        filename.endsWith(extension) &&
        !language.exclusions?.some((ext) => filename.endsWith(ext))
      ) {
        return { filename, language, extension };
      }
    }
  }

  return undefined;
}
