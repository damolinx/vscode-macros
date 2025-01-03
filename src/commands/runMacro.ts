import * as vscode from 'vscode';
import { Manager } from '../manager';

export async function runMacro(manager: Manager) {
  try {
    await manager.run(
      vscode.Uri.file('C:\\Users\\damol\\Github\\vscode-macros\\src\\example.js'),
    );
  } catch (reason) {
    vscode.window.showErrorMessage((<any>reason).toString());
  }
}
