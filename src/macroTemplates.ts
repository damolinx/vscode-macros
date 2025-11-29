import * as vscode from 'vscode';
import { ExtensionContext } from './extensionContext';
import { Lazy } from './utils/lazy';
import { readFile } from './utils/resources';
import { NaturalComparer } from './utils/ui';

export const MACRO_TEMPLATES_DIR_RESOURCE = 'examples/';
export const MACRO_TEMPLATES_MANIFEST_RESOURCE = `${MACRO_TEMPLATES_DIR_RESOURCE}/manifest.json`;

export interface MacroTemplate {
  category?: string;
  description: string;
  label: string;
  path: string;
  alternates?: Record<string, string>;
}

export interface Manifest {
  templates: MacroTemplate[];
}

export interface LoadableMacroTemplate extends MacroTemplate {
  load: () => Promise<string>;
}

// Caching manifest since it is shipped with the extension, i.e. not expected to change.
export const ManifestRaw = new Lazy((context: vscode.ExtensionContext) =>
  readFile(context, MACRO_TEMPLATES_MANIFEST_RESOURCE),
);

export const Manifest = new Lazy(async (context: vscode.ExtensionContext) => {
  const raw = await ManifestRaw.get(context);
  const manifest = JSON.parse(raw) as Manifest;
  manifest.templates.sort((t1, t2) => NaturalComparer.compare(t1.label, t2.label));
  return manifest;
});

export async function templates(
  { extensionContext: context }: ExtensionContext,
  language?: string,
): Promise<LoadableMacroTemplate[]> {
  const { templates } = await Manifest.get(context);
  return templates.map((template) => ({
    ...template,
    load: () => readTemplate(context, template, language),
  }));

  async function readTemplate(
    context: vscode.ExtensionContext,
    template: MacroTemplate,
    language?: string,
  ): Promise<string> {
    const templatePath = (language && template.alternates?.[language]) ?? template.path;

    let content = await readFile(context, MACRO_TEMPLATES_DIR_RESOURCE, templatePath);
    if (templatePath.endsWith('.ts')) {
      content = content.replace('// @ts-nocheck', '');
    }
    return content;
  }
}
