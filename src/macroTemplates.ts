import * as vscode from 'vscode';
import { join } from 'path';
import { Lazy } from './common/lazy';
import { readFile } from './common/resources';

export const MACRO_TEMPLATES_DIR_RESOURCE = 'examples/';
export const MACRO_TEMPLATES_MANIFEST_RESOURCE = `${MACRO_TEMPLATES_DIR_RESOURCE}/manifest.json`;

export interface MacroTemplate {
  label: string;
  description: string;
  path: string;
}

export interface Manifest {
  templates: MacroTemplate[];
};

export interface LoadableMacroTemplate extends MacroTemplate {
  load: () => Promise<string>;
}

// Caching manifest since it is shipped with the extension, i.e. not expected to change.
const manifest = new Lazy(async (context: vscode.ExtensionContext) => {
  const content = await readFile(context, MACRO_TEMPLATES_MANIFEST_RESOURCE);
  const manifest = JSON.parse(content) as Manifest;
  manifest.templates.sort((t1, t2) => t1.label.localeCompare(t2.label));
  return manifest;
});

export async function templates(context: vscode.ExtensionContext): Promise<LoadableMacroTemplate[]> {
  const { templates } = await manifest.get(context);
  return templates.map(t => ({ ...t, load: () => readTemplate(context, t) }));
}



async function readTemplate(context: vscode.ExtensionContext, template: MacroTemplate): Promise<string> {
  const path = join(MACRO_TEMPLATES_DIR_RESOURCE, template.path);
  const content = await readFile(context, path);
  return content;
}
