import * as vscode from 'vscode';
import { ExtensionContext } from '../extensionContext';
import { Lazy } from '../utils/lazy';

export const MACROS = 'resources/images/macros.svg';
export const MACROS_DARK = 'resources/images/macros-dark.svg';
export const MACROS_LIGHT = 'resources/images/macros-light.svg';

export const MacrosIconUri = new Lazy(({ extensionContext }: ExtensionContext) =>
  vscode.Uri.file(extensionContext.asAbsolutePath(MACROS)),
);
export const MacrosDarkIconUri = new Lazy(({ extensionContext }: ExtensionContext) =>
  vscode.Uri.file(extensionContext.asAbsolutePath(MACROS_DARK)),
);
export const MacrosLightIconUri = new Lazy(({ extensionContext }: ExtensionContext) =>
  vscode.Uri.file(extensionContext.asAbsolutePath(MACROS_LIGHT)),
);

export const IconColor = new vscode.ThemeColor('macros.general');
export const JsIconColor = new vscode.ThemeColor('macros.js');
export const TsIconColor = new vscode.ThemeColor('macros.ts');
