import { MacroId } from "../../macroId";

export class SingletonMacroAlreadyRunningError extends Error {
  constructor(public readonly macroId: MacroId, public readonly macroName: string) {
    super(`Singleton macro is already running: ${macroId}`);
  }
}