import * as vscode from 'vscode';
import { ExtensionContext } from './extensionContext';
import { Lazy } from './utils/lazy';
import { readFile } from './utils/resources';
import { NaturalComparer } from './utils/ui';

export const MACRO_TEMPLATES_DIR_RESOURCE = 'examples/';
export const MACRO_TEMPLATES_MANIFEST_RESOURCE = `${MACRO_TEMPLATES_DIR_RESOURCE}/manifest.json`;

export interface MacroTemplate {
  alternates?: Record<string, string>;
  category?: string;
  description: string;
  label: string;
  path?: string;
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

export async function loadTemplates(
  { extensionContext: context }: ExtensionContext,
  languageId?: string,
): Promise<LoadableMacroTemplate[]> {
  const { templates } = await Manifest.get(context);
  return templates.map((template) => ({
    ...template,
    load: () => loadTemplate(context, template, languageId),
  }));

  async function loadTemplate(
    context: vscode.ExtensionContext,
    template: MacroTemplate,
    language?: string,
  ): Promise<string> {
    let content = '';
    const templatePath = (language && template.alternates?.[language]) ?? template.path;
    if (templatePath) {
      content = await readFile(context, MACRO_TEMPLATES_DIR_RESOURCE, templatePath);
      if (templatePath.endsWith('.ts')) {
        content = content.replace('// @ts-nocheck', '');
      }
    }
    return content;
  }
}
