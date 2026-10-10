import { ExtensionContext } from '../../../extensionContext';
import { CodeMacro } from '../../macros/code/codeMacro';
import { Executor } from './executor';
import { TypeScriptExecutor } from './typescriptExecutor';

export class ExecutorFactory {
  public static async create(context: ExtensionContext, macro: CodeMacro): Promise<Executor> {
    const { languageId } = await macro.getSnapshot();
    switch (languageId) {
      case 'javascript':
        return new Executor(context, macro);
      case 'typescript':
        return new TypeScriptExecutor(context, macro);
      default:
        throw new Error(`Unsupported macro type: ${macro.uri}`);
    }
  }
}
