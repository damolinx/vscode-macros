import * as vscode from 'vscode';
import { PathLike, uriBasename } from '../utils/uri';

export interface Language {
  readonly id: string;
  readonly name: string;
  readonly extensions: readonly string[];
  readonly accepts: (filename: string) => boolean;
}

export const MACRO_LANGUAGES: readonly Language[] = [
  {
    id: 'javascript',
    name: 'JavaScript',
    extensions: ['js', 'cjs'] as const,
    accepts: (filename: string) => ['.js', '.cjs'].some((ext) => filename.endsWith(ext)),
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    extensions: ['ts'] as const,
    accepts: (filename: string) => filename.endsWith('.ts') && !filename.endsWith('.d.ts'),
  },
];

export const MACRO_PREFERRED_EXTENSION = '.macro.js';

export const MACRO_PREFERRED_LANGUAGE = 'javascript';

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

export function isFeatureEnabledMacro(pathOrUri: PathLike): boolean {
  return isMacro(pathOrUri) && uriBasename(pathOrUri, true).endsWith('.macro');
}

export function isMacro(pathOrUri: PathLike): boolean {
  const name = uriBasename(pathOrUri);
  return MACRO_LANGUAGES.some((lang) => lang.accepts(name));
}

export function isMacroLangId(langId: string): boolean {
  return MACRO_LANGUAGES.some((lang) => lang.id === langId);
}
