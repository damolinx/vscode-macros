import * as vm from 'vm';
import { MacroContext } from '../../../api/macroContext';
import { initializeContext, initializeMacrosApi, MacroContextInitParams } from '../macroRunContext';
import { SandboxExecutionDescriptor } from '../sandboxExecutionDescriptor';
import { SandboxRunner } from './sandboxRunner';

export class VmSandboxRunner extends SandboxRunner<vm.Context> {
  private sharedMacroContext?: MacroContext;

  protected override async executeInternal(
    descriptor: SandboxExecutionDescriptor,
    context: vm.Context,
  ): Promise<any> {
    const options: vm.RunningScriptOptions = {
      filename: this.getExecutionSourceName(descriptor),
    };

    let runPromise: Promise<any>;
    if (descriptor.snapshot.options.persistent) {
      const initialKeys = Object.keys(context).filter((k) => !k.startsWith('__'));
      runPromise = Promise.resolve(vm.runInContext(descriptor.code, context, options)).finally(
        () => {
          const currentKeys = Object.keys(context).filter((k) => !k.startsWith('__'));
          const removedKeys = [...initialKeys].filter((key) => !currentKeys.includes(key));
          if (this.sharedMacroContext) {
            for (const key of currentKeys) {
              this.sharedMacroContext[key] = context[key];
            }
            for (const key of removedKeys) {
              delete this.sharedMacroContext[key];
            }
          }
        },
      );
    } else {
      runPromise = vm.runInNewContext(descriptor.code, context, options);
    }

    const result = await runPromise;
    return result;
  }

  protected override getContext(
    descriptor: SandboxExecutionDescriptor,
    params: MacroContextInitParams,
  ): vm.Context {
    let context: MacroContext;
    let name = `context-${params.executionId}`;

    if (descriptor.snapshot.options.persistent) {
      name += '(shared)';
      if (this.sharedMacroContext) {
        initializeMacrosApi(this.sharedMacroContext, params);
      } else {
        this.sharedMacroContext = initializeContext({}, params);
      }
      context = this.sharedMacroContext;
    } else {
      delete this.sharedMacroContext;
      context = initializeContext({}, params);
    }

    return vm.createContext(context, { name });
  }

  public override resetSharedContext(): void {
    this.sharedMacroContext = undefined;
  }
}
