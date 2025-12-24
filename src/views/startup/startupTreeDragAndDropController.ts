import * as vscode from 'vscode';
import { setStartupMacros } from '../../commands/setStartupMacro';
import { StartupMacro } from '../../core/startupMacro';
import { ExtensionContext } from '../../extensionContext';
import { isUntitled } from '../../utils/uri';
import {
  FILELIST_MIMETYPE,
  MACROLIST_MIMETYPE,
  TreeDragAndDropController,
} from '../treeDragAndDropController';
import { SourceTarget } from './sourceTarget';

export class StartupTreeDragAndDropController extends TreeDragAndDropController<StartupMacro> {
  constructor(context: ExtensionContext) {
    super(context, [FILELIST_MIMETYPE], [MACROLIST_MIMETYPE]);
  }

  protected override get treeMimeType(): string {
    return 'application/vnd.code.tree.macros.startupmacros';
  }

  public override async handleDrop(
    target: StartupMacro | undefined,
    dataTransfer: vscode.DataTransfer,
    _token: vscode.CancellationToken,
  ): Promise<void> {
    const configurationTarget = target instanceof SourceTarget ? target.target : undefined;
    if (!configurationTarget) {
      return;
    }

    const uris = await this.getSourceUris(dataTransfer);
    const filteredUris = uris?.filter((uri) => !isUntitled(uri));
    if (filteredUris) {
      setStartupMacros(this.context, filteredUris, configurationTarget);
    }
  }
}
