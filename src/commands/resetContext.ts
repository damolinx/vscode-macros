import { MacroRunnerManager } from '../core/execution/macroRunnerManager';
import { PathLike, toUri } from '../utils/uri';

export function resetSharedContext(manager: MacroRunnerManager, pathOrUri: PathLike): void {
  const uri = toUri(pathOrUri);
  const runner = manager.getRunner(uri);
  runner.resetSharedContext();
}