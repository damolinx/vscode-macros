import * as vscode from 'vscode';
import { join } from 'path';
import { Lazy } from './utils/lazy';
import { readFile } from './utils/resources';

export const MACRO_TEMPLATES_DIR_RESOURCE = 'examples/';
export const MACRO_TEMPLATES_MANIFEST_RESOURCE = `${MACRO_TEMPLATES_DIR_RESOURCE}/manifest.json`;

export interface MacroTemplate {
  category?: string;
  description: string;
  label: string;
  path: string;
}

export interface Manifest {
  templates: MacroTemplate[];
};

export interface LoadableMacroTemplate extends MacroTemplate {
  load: () => Promise<string>;
}

// Caching manifest since it is shipped with the extension, i.e. not expected to change.
export const ManifestRaw = new Lazy((context: vscode.ExtensionContext) =>
  readFile(context, MACRO_TEMPLATES_MANIFEST_RESOURCE));

export const Manifest = new Lazy(async (context: vscode.ExtensionContext) => {
  const raw = await ManifestRaw.get(context);
  const manifest = JSON.parse(raw) as Manifest;
  manifest.templates.sort((t1, t2) => t1.label.localeCompare(t2.label));
  return manifest;
});

export async function templates(context: vscode.ExtensionContext): Promise<LoadableMacroTemplate[]> {
  const { templates } = await Manifest.get(context);
  return templates.map(t => ({ ...t, load: () => readTemplate(context, t) }));
}

async function readTemplate(context: vscode.ExtensionContext, template: MacroTemplate): Promise<string> {
  const path = join(MACRO_TEMPLATES_DIR_RESOURCE, template.path);
  const content = await readFile(context, path);
  return content;
}
