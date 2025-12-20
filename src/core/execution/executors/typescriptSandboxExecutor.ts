import { ExtensionContext } from '../../../extensionContext';
import { Macro } from '../../macro';
import { ensureSourceMapSupport } from '../../typescript/sourceMap';
import { SandboxExecutor } from './sandboxExecutor';

export class TypeScriptSandboxExecutor extends SandboxExecutor {
  constructor(context: ExtensionContext, macro: Macro) {
    super(context, macro);
    ensureSourceMapSupport(context, this.runner);
  }
}
