import * as ts from 'typescript';
import { ExtensionContext } from '../../extensionContext';
import { readFile } from '../../utils/resources';
import { Kind } from './node';
import { Script } from './scripts/script';

export const MACRO_RENDERERS_DIR_RESOURCE = 'renderers';
export const SUPPORTED_RENDERERS: readonly Kind[] = ['button', 'container', 'input', 'tree'];

export const RendererScripts = new Map<Kind, Script>();

export async function loadRenderers({ extensionContext, log }: ExtensionContext): Promise<void> {
  const printer = ts.createPrinter({ removeComments: true });
  const start = Date.now();
  await Promise.all(
    SUPPORTED_RENDERERS.map(async (kind) => {
      const path = `${MACRO_RENDERERS_DIR_RESOURCE}/${kind}.js`;
      const code = await readFile(extensionContext, path);
      const source = ts.createSourceFile(
        path,
        code,
        ts.ScriptTarget.Latest,
        false,
        ts.ScriptKind.JS,
      );
      const minifiedCode = printer.printFile(source);
      RendererScripts.set(kind, new Script(minifiedCode));
    }),
  );
  log.debug(`Loaded UI component renderers in ${Date.now() - start}ms`);
}
