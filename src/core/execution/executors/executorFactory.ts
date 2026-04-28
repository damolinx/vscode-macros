import { ExtensionContext } from '../../../extensionContext';
import { Macro } from '../../macro';
import { Executor } from './executor';
import { TypeScriptExecutor } from './typescriptExecutor';

export class ExecutorFactory {
  public static async create(context: ExtensionContext, macro: Macro): Promise<Executor> {
    const { languageId } = await macro.getCode();
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
