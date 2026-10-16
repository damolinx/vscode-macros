import { Context } from '../../../context';
import { Runner } from './runner';
import { SandboxRunner } from './sandboxRunner';

export class RunnerFactory {
  public static create(context: Context): Runner {
    return new SandboxRunner(context);
  }
}
