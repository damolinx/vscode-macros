import { ExtensionContext } from '../extensionContext';
import { PathLike, toUri } from '../utils/uri';

export function resetSharedContext({ runnerManager }: ExtensionContext, pathOrUri: PathLike): void {
  const uri = toUri(pathOrUri);
  const runner = runnerManager.getRunner(uri);
  runner.resetSharedContext();
}
