import * as vscode from 'vscode';
import { PathLike, toPath } from '../utils/uri';

interface Language {
  readonly name: string;
  readonly extensions: readonly string[];
}

export const MACRO_DOCUMENT_EXTENSION = '.macro.js';

export const MACRO_LANGUAGE = 'javascript';

export const MACRO_LANGUAGES: Readonly<Record<string, Language>> = {
  javascript: {
    name: 'JavaScript',
    extensions: ['js', 'cjs'] as const,
  },
  typescript: {
    name: 'TypeScript',
    extensions: ['ts'] as const,
  },
};

export function macroDocumentSelector(): vscode.DocumentSelector {
  return [
    { scheme: 'untitled', language: MACRO_LANGUAGE },
    ...Object.values(MACRO_LANGUAGES).map((l) => ({
      pattern: `**/*.macro.{${l.extensions.join(',')}}`,
    })),
  ];
}

export function macroFilter(): Record<string, string[]> {
  return Object.fromEntries(
    Object.values(MACRO_LANGUAGES).map(({ name, extensions }) => [name, [...extensions]]),
  );
}

export function macroGlobPattern() {
  const extensions = Object.values(MACRO_LANGUAGES).flatMap((l) => l.extensions);
  return `*.${extensions.join(',')}`;
}

export function isMacroFeaturePath(pathOrUri: PathLike): boolean {
  const path = toPath(pathOrUri);
  return Object.values(MACRO_LANGUAGES).some((l) =>
    l.extensions.some((ext) => path.endsWith(`.macro.${ext}`)),
  );
}

export function isMacroLangId(language: string): boolean {
  return Object.hasOwn(MACRO_LANGUAGES, language);
}

export function isMacroPath(pathOrUri: PathLike): boolean {
  const path = toPath(pathOrUri);
  return Object.values(MACRO_LANGUAGES).some((l) =>
    l.extensions.some((ext) => path.endsWith(`.${ext}`)),
  );
}
