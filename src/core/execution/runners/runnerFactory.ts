import { ExtensionContext } from '../../../extensionContext';
import { Runner } from './runner';
import { SandboxRunner } from './sandboxRunner';

export class RunnerFactory {
  public static create(context: ExtensionContext): Runner {
    return new SandboxRunner(context);
  }
}
