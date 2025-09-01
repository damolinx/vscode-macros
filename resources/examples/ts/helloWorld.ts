// @ts-nocheck
import * as vscode from "vscode";
import { basename } from 'path';

vscode.window.showInformationMessage(
  `Hello, World! This is ${basename(macros.macro.uri.fsPath)}.`,
  { modal: true },
);
macros.log.info('Greeted the world');