import { ExtensionContext } from '../../../extensionContext';
import { CodeMacro } from '../../macros/code/codeMacro';
import { ensureSourceMapSupport } from '../../typescript/sourceMap';
import { Executor } from './executor';

export class TypeScriptExecutor extends Executor {
  constructor(context: ExtensionContext, macro: CodeMacro) {
    super(context, macro);
    ensureSourceMapSupport(this.context, this.runner);
  }
}
