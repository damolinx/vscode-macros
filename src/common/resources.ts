import * as vscode from 'vscode';

/**
 * Read file from packaged `resources/` files.
 */
export async function readFile(context: vscode.ExtensionContext, relativePath: string): Promise<string> {
  const path = vscode.Uri.joinPath(context.extensionUri, 'resources', relativePath);
  const buffer = await vscode.workspace.fs.readFile(path);
  const content = Buffer.from(buffer).toString('utf8');
  return content;
}