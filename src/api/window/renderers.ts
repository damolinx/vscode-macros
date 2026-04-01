import { ExtensionContext } from '../../extensionContext';
import { readFile } from '../../utils/resources';
import { isElement } from './elements/elementNode';
import { RenderableNode } from './node';
import { normalizeCode } from './scripts/code';
import { Script } from './scripts/script';
import { ScriptNode } from './scripts/scriptNode';

export const MACRO_RENDERERS_DIR_RESOURCE = 'renderers';
export const SUPPORTED_RENDERERS: readonly string[] = [
  'button',
  'container',
  'input',
  'link',
  'textarea',
  'tree',
];

export const RendererScripts = new Map<string, Script>();

export async function loadRenderers({ extensionContext, log }: ExtensionContext): Promise<void> {
  const start = Date.now();
  await Promise.all(
    SUPPORTED_RENDERERS.map(async (kind) => {
      const path = `${MACRO_RENDERERS_DIR_RESOURCE}/${kind}.js`;
      const code = await readFile(extensionContext, path);
      const { normalizedCode } = normalizeCode(code);
      RendererScripts.set(kind, new Script(normalizedCode, false));
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
        if (--remaining === 0) {
          return;
        }
      }

      if (isElement(node)) {
        recurse(node.children.filter(isElement));
      }
    }
  }
}
