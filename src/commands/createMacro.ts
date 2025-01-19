
import * as vscode from 'vscode';
import { promises as fsPromises } from 'fs';
import { dirname, join } from 'path';

const MACRO_TEMPLATES_MANIFEST = 'resources/examples/manifest.json';

interface Manifest {
  templates: {
    label: string;
    description: string;
    path: string;
  }[];
};

let manifest: Manifest;

export async function createMacro(context: vscode.ExtensionContext) {
  if (!manifest) {
    const content = await loadFile(context, MACRO_TEMPLATES_MANIFEST);
    manifest = JSON.parse(content) as Manifest;
    manifest.templates = manifest.templates.sort((t1, t2) => t1.label.localeCompare(t2.label));
  }

  const template = await vscode.window.showQuickPick(manifest.templates, {
    matchOnDescription: true,
    placeHolder: 'Select a macro template',
  });
  if (!template) {
    return;
  }

  const document = await vscode.workspace.openTextDocument({
    language: 'javascript',
    content: await loadFile(context, join(dirname(MACRO_TEMPLATES_MANIFEST), template.path)),
  });
  await vscode.window.showTextDocument(document);
}

async function loadFile(context: vscode.ExtensionContext, relativePath: string): Promise<string> {
  const contentArrayBuffer = await fsPromises.readFile(context.asAbsolutePath(relativePath));
  const content = new TextDecoder().decode(contentArrayBuffer);
  return content;
}
