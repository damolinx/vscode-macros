import { ExtensionContext } from '../../../extensionContext';
import { Macro } from '../../macro';
import { ensureSourceMapSupport } from '../../typescript/sourceMap';
import { Executor } from './executor';

export class TypeScriptExecutor extends Executor {
  constructor(context: ExtensionContext, macro: Macro) {
    super(context, macro);
    ensureSourceMapSupport(this.context, this.runner);
  }
}
