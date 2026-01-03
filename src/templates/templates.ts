import * as vscode from 'vscode';
import { MacroLanguageId } from '../core/language/macroLanguage';
import { ExtensionContext } from '../extensionContext';
import { Lazy } from '../utils/lazy';
import { readFile } from '../utils/resources';
import { NaturalComparer } from '../utils/ui';
import { Manifest, Template } from './manifest';

export const MACRO_TEMPLATES_DIR_RESOURCE = 'templates/';
export const MACRO_TEMPLATES_MANIFEST_RESOURCE = `${MACRO_TEMPLATES_DIR_RESOURCE}/manifest.json`;

// Caching manifest since it is shipped with the extension, i.e. not expected to change.
const CachedManifest = new Lazy(async (context: vscode.ExtensionContext) => {
  const raw = await readFile(context, MACRO_TEMPLATES_MANIFEST_RESOURCE);
  const manifest = JSON.parse(raw) as Manifest;
  manifest.templates.sort((t1, t2) => NaturalComparer.compare(t1.label, t2.label));
  return manifest;
});

export async function loadTemplates(
  { extensionContext }: ExtensionContext,
  languageId?: MacroLanguageId,
): Promise<(Template & { load: () => Promise<string> })[]> {
  const { templates } = await CachedManifest.get(extensionContext);
  return templates.map((template) => ({
    ...template,
    load: () => loadTemplate(extensionContext, template, languageId),
  }));

  async function loadTemplate(
    context: vscode.ExtensionContext,
    template: Template,
    languageId?: MacroLanguageId,
  ): Promise<string> {
    let content = '';

    const templatePath = (languageId && template.alternates?.[languageId]) ?? template.path;
    if (templatePath) {
      content = await readFile(context, MACRO_TEMPLATES_DIR_RESOURCE, templatePath);
      if (templatePath.endsWith('.ts')) {
        content = content.replace('// @ts-nocheck', '');
      }
    }

    return content;
  }
}
