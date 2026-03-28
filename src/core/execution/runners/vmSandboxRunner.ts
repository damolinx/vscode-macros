import * as vm from 'vm';
import { initializeMacrosApi } from '../../../api/macroApiFactory';
import { MacroContext } from '../../../api/macroContext';
import { initializeContext, MacroContextInitParams } from '../macroRunContext';
import { SandboxExecution } from '../sandboxExecution';
import { SandboxRunner } from './sandboxRunner';

export class VmSandboxRunner extends SandboxRunner<vm.Context> {
  private sharedMacroContext?: MacroContext;

  protected override async executeInternal(
    execution: SandboxExecution,
    context: vm.Context,
  ): Promise<any> {
    const options: vm.RunningScriptOptions = {
      filename: this.getExecutionSourceName(execution),
    };

    const runPromise = execution.snapshot.options.persistent
      ? this.executeInternalPersistent(execution, context, options)
      : vm.runInNewContext(execution.code, context, options);

    const result = await runPromise;
    return result;
  }

  private async executeInternalPersistent(
    execution: SandboxExecution,
    context: vm.Context,
    options: vm.RunningScriptOptions,
  ): Promise<any> {
    const initialKeys = Object.keys(context).filter((k) => !k.startsWith('__'));
    try {
      const result = await vm.runInContext(execution.code, context, options);
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
    { snapshot }: SandboxExecution,
    params: MacroContextInitParams,
  ): vm.Context {
    let context: MacroContext;
    let name = `context-${params.executionId}`;

    if (snapshot.options.persistent) {
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
