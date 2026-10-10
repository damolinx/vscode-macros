import { CodeMacroId } from '../../macros/code/codeMacroId';

export class SingletonMacroAlreadyRunningError extends Error {
  constructor(
    public readonly macroId: CodeMacroId,
    public readonly macroName: string,
  ) {
    super(`Singleton macro is already running: ${macroId}`);
  }
}
