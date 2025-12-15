import { ExtensionContext } from '../../../extensionContext';
import { Macro } from '../../macro';
import { SandboxExecutor } from './sandboxExecutor';
import { TypeScriptSandboxExecutor } from './typescriptSandboxExecutor';

export class SandboxExecutorFactory {
  public static async create(context: ExtensionContext, macro: Macro): Promise<SandboxExecutor> {
    const { languageId } = await macro.getCode();
    switch (languageId) {
      case 'javascript':
        return new SandboxExecutor(context, macro);
      case 'typescript':
        return new TypeScriptSandboxExecutor(context, macro);
      default:
        throw new Error(`Unsupported macro type: ${macro.uri}`);
    }
  }
}
