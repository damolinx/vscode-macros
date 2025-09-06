import * as vscode from 'vscode';
import { extname } from 'path';
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
    extensions: ['js', 'cjs'],
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    extensions: ['ts'],
    exclusions: ['d.ts'],
  },
];

export const MACRO_PREFERRED_EXTENSION = '.macro.js';

export const MACRO_PREFERRED_LANGUAGE = 'javascript';

export function isFeatureEnabledMacro(pathOrUri: PathLike): boolean {
  const result = tryResolveMacroLanguage(pathOrUri);
  return !!result && result.filename.endsWith(`.macro${result.matchingExt}`);
}

export function isMacro(pathOrUri: PathLike): boolean {
  const result = tryResolveMacroLanguage(pathOrUri);
  return !!result;
}

export function isMacroLangId(langId: string): langId is Language['id'] {
  return MACRO_LANGUAGES.some((lang) => lang.id === langId);
}

export function macroDocumentSelector(): vscode.DocumentSelector {
  return [
    { scheme: 'untitled', language: MACRO_PREFERRED_LANGUAGE },
    ...MACRO_LANGUAGES.map((lang) => ({
      pattern: `**/*.macro.{${lang.extensions.join(',')}}`,
    })),
  ];
}

export function macroGlobPattern(pathOrUri: PathLike): vscode.RelativePattern {
  const extensions = MACRO_LANGUAGES.flatMap((lang) => lang.extensions);
  return new vscode.RelativePattern(pathOrUri, `*.{${extensions.join(',')}}`);
}

export function tryResolveMacroExt(pathOrUri: PathLike): string | undefined {
  const result = tryResolveMacroLanguage(pathOrUri);
  return result?.matchingExt;
}

export function tryResolveMacroLangId(pathOrUri: PathLike): string | undefined {
  const result = tryResolveMacroLanguage(pathOrUri);
  return result?.language.id;
}

function tryResolveMacroLanguage(
  pathOrUri: PathLike,
): { language: Language; matchingExt: string; filename: string } | undefined {
  const filename = uriBasename(pathOrUri).toLowerCase();
  const extension = extname(filename);

  if (!extension) {
    return undefined;
  }

  for (const language of MACRO_LANGUAGES) {
    for (const ext of language.extensions.map((ext) => `.${ext}`)) {
      if (extension === ext && !isExcluded(filename, language.exclusions)) {
        return {
          filename,
          language,
          matchingExt: ext,
        };
      }
    }
  }

  return undefined;

  function isExcluded(filename: string, exclusions?: readonly string[]): boolean {
    return exclusions?.some((exc) => filename.endsWith(`.${exc}`)) ?? false;
  }
}
