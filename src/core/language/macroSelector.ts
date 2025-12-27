import * as vscode from 'vscode';
import { MacroLanguage } from './macroLanguage';

export function buildDocumentSelector(
  languages: readonly MacroLanguage[],
  featureOnly?: true,
): vscode.DocumentSelector {
  const selector: vscode.DocumentFilter[] = [];

  for (const language of languages) {
    selector.push({ scheme: 'untitled', language: language.id });

    let extensions = language.extensions;
    if (featureOnly) {
      extensions = extensions
        .filter((ext) => ext.startsWith('.macro.'))
        .map((ext) => ext.substring(1));
    }

    if (extensions.length > 0) {
      selector.push({ pattern: `**/*.{${extensions.join(',')}}` });
    }
  }

  return selector;
}
