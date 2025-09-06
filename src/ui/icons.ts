import * as vscode from 'vscode';
import { ExtensionContext } from '../extensionContext';
import { Lazy } from '../utils/lazy';

export const MACROS = 'resources/images/macros.svg';
export const MACROS_DARK = 'resources/images/macros-dark.svg';
export const MACROS_LIGHT = 'resources/images/macros-light.svg';

export const MacrosIcon = new Lazy(({ extensionContext }: ExtensionContext) =>
  vscode.Uri.file(extensionContext.asAbsolutePath(MACROS)),
);
export const MacrosDarkIcon = new Lazy(({ extensionContext }: ExtensionContext) =>
  vscode.Uri.file(extensionContext.asAbsolutePath(MACROS_DARK)),
);
export const MacrosLightIcon = new Lazy(({ extensionContext }: ExtensionContext) =>
  vscode.Uri.file(extensionContext.asAbsolutePath(MACROS_LIGHT)),
);

export function createIcon(iconId: string, colorId: string): vscode.ThemeIcon {
  return new vscode.ThemeIcon(iconId, new vscode.ThemeColor(colorId));
}
