import * as vscode from 'vscode';

/**
 * Read file from packaged `resources/` files.
 */
export async function readFile(
  context: vscode.ExtensionContext,
  ...pathSegments: string[]
): Promise<string> {
  const uri = vscode.Uri.joinPath(context.extensionUri, 'resources', ...pathSegments);
  const content = Buffer.from(await vscode.workspace.fs.readFile(uri)).toString('utf8');
  return content;
}
