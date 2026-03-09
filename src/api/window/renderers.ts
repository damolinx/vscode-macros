import * as ts from 'typescript';
import { ExtensionContext } from '../../extensionContext';
import { readFile } from '../../utils/resources';
import { ElementNode } from './elements/elementNode';
import { isHtmlRenderable, Kind, RenderableNode } from './node';
import { Script } from './scripts/script';
import { ScriptNode } from './scripts/scriptNode';

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

export function resolveRenderers(renderableNodes: RenderableNode[]): ScriptNode[] {
  const renderers = new Map(
    Array.from(RendererScripts.entries()).map(([kind, script]) => [
      kind,
      { script, required: false },
    ]),
  );
  let remaining = renderers.size;

  recurse(renderableNodes);

  return Array.from(renderers.values())
    .filter((r) => r.required)
    .map((r) => r.script);

  function recurse(nodes: RenderableNode[]): void {
    for (const node of nodes) {
      const entry = renderers.get(node.kind);
      if (entry && !entry.required) {
        entry.required = true;
        if (--remaining == 0) {
          return;
        }
      }

      if (node.renderKind === 'element') {
        const elementNode = node as ElementNode;
        const children = elementNode.children.filter(isHtmlRenderable);
        if (children.length) {
          recurse(children);
        }
      }
    }
  }
}
