import * as vscode from 'vscode';
import { PathLike } from '../utils/uri';
import { MacroLanguage, MacroLanguageId } from './language/macroLanguage';
import { buildDocumentSelector } from './language/macroSelector';

export const JavaScript = new MacroLanguage({
  id: 'javascript',
  name: 'JavaScript',
  defaultExtension: '.macro.js',
  exclusionExtensions: [],
  extensions: ['.macro.js', '.js', '.macro.cjs', '.cjs'],
});

export const TypeScript = new MacroLanguage({
  id: 'typescript',
  name: 'TypeScript',
  defaultExtension: '.macro.ts',
  extensions: ['.macro.ts', '.ts'],
  exclusionExtensions: ['.d.ts'],
});

export const AllLanguages: readonly MacroLanguage[] = [JavaScript, TypeScript];

export const AllSelector = buildDocumentSelector(AllLanguages);

export const FeatureEnabledSelector = buildDocumentSelector(AllLanguages, true);

export const PreferredLanguage = JavaScript;

export function isFeatureMacro(pathOrUri: PathLike): boolean {
  return Boolean(resolveMacroExt(pathOrUri)?.toLowerCase().startsWith('.macro.'));
}

export function isMacro(pathOrUri: PathLike): boolean {
  return Boolean(resolveMacroLanguageFromUri(pathOrUri));
}

export function isMacroLanguage(languageId: string): languageId is MacroLanguageId {
  return AllLanguages.some(({ id }) => id === languageId);
}

export function resolveMacroExt(pathOrUri: PathLike): string | undefined;
export function resolveMacroExt(pathOrUri: PathLike, defaultValue: string): string;
export function resolveMacroExt(pathOrUri: PathLike, defaultValue?: string): string | undefined {
  const path = pathOrUri instanceof vscode.Uri ? pathOrUri.path : pathOrUri;
  for (const language of AllLanguages) {
    const matched = language.matchExtension(path);
    if (matched) {
      return matched;
    }
  }
  return defaultValue;
}

export function resolveMacroLanguage(languageId: MacroLanguageId): MacroLanguage;
export function resolveMacroLanguage(languageId: string): MacroLanguage | undefined;
export function resolveMacroLanguage(
  languageId: string,
  defaultValue: MacroLanguage,
): MacroLanguage;
export function resolveMacroLanguage(
  languageId: string,
  defaultValue?: MacroLanguage,
): MacroLanguage | undefined {
  return AllLanguages.find(({ id }) => languageId === id) ?? defaultValue;
}

export function resolveMacroLanguageFromUri(pathOrUri: PathLike): MacroLanguage | undefined;
export function resolveMacroLanguageFromUri(
  pathOrUri: PathLike,
  defaultValue: MacroLanguage,
): MacroLanguage;
export function resolveMacroLanguageFromUri(
  pathOrUri: PathLike,
  defaultValue?: MacroLanguage,
): MacroLanguage | undefined {
  const path = pathOrUri instanceof vscode.Uri ? pathOrUri.path : pathOrUri;
  return AllLanguages.find((language) => language.accepts(path)) ?? defaultValue;
}
