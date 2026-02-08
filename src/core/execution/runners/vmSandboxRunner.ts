import * as vm from 'vm';
import { initializeMacrosApi } from '../../../api/macroApiFactory';
import { MacroContext } from '../../../api/macroContext';
import { initializeContext, MacroContextInitParams } from '../macroRunContext';
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

    const runPromise = descriptor.snapshot.options.persistent
      ? this.executeInternalPersistent(descriptor, context, options)
      : vm.runInNewContext(descriptor.code, context, options);

    const result = await runPromise;
    return result;
  }

  private async executeInternalPersistent(
    descriptor: SandboxExecutionDescriptor,
    context: vm.Context,
    options: vm.RunningScriptOptions,
  ): Promise<any> {
    const initialKeys = Object.keys(context).filter((k) => !k.startsWith('__'));
    try {
      const result = await vm.runInContext(descriptor.code, context, options);
      return result;
    } finally {
      if (this.sharedMacroContext) {
        const currentKeys = Object.keys(context).filter((k) => !k.startsWith('__'));
        for (const key of currentKeys) {
          this.sharedMacroContext[key] = context[key];
        }

        const removedKeys = [...initialKeys].filter((key) => !currentKeys.includes(key));
        for (const key of removedKeys) {
          delete this.sharedMacroContext[key];
        }
      }
    }
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
