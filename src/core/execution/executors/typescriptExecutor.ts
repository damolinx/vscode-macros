import { Context } from '../../../context';
import { CodeMacro } from '../../macros/code/codeMacro';
import { ensureSourceMapSupport } from '../../typescript/sourceMap';
import { Executor } from './executor';

export class TypeScriptExecutor extends Executor {
  constructor(context: Context, macro: CodeMacro) {
    super(context, macro);
    ensureSourceMapSupport(this.context, this.runner);
  }
}
