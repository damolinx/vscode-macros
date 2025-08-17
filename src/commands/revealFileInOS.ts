import * as vscode from 'vscode';
import { fromLocator, Locator, toUri } from '../utils/uri';

export async function revealFileInOs(locator: Locator): Promise<void> {
  const uri = toUri(fromLocator(locator));
  await vscode.commands.executeCommand('revealFileInOS', uri);
}
