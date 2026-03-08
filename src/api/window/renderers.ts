import { ExtensionContext } from '../../extensionContext';
import { readFile } from '../../utils/resources';
import { Kind } from './node';
import { Script } from './scripts/script';

export const MACRO_RENDERERS_DIR_RESOURCE = 'renderers';
export const SUPPORTED_RENDERERS: readonly Kind[] = ['button', 'container', 'input', 'tree'];

export const RendererScripts = new Map<Kind, Script>();

export async function loadRenderers({ extensionContext }: ExtensionContext): Promise<void> {
  for (const kind of SUPPORTED_RENDERERS) {
    const path = `${MACRO_RENDERERS_DIR_RESOURCE}/${kind}.js`;
    const code = await readFile(extensionContext, path);
    RendererScripts.set(kind, new Script(code));
  }
}
