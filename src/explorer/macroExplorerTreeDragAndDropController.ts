import * as vscode from 'vscode';
import { extname } from 'path';
import { MACRO_EXTENSIONS } from '../core/constants';
import { MacroLibrary } from '../core/library/macroLibrary';
import { Macro } from '../core/macro';
import { ExtensionContext } from '../extensionContext';
import { uriBasename } from '../utils/uri';
import { MacroExplorerTreeElement } from './macroExplorerTreeDataProvider';

export const FILELIST_MIMETYPE = 'text/uri-list';
export const FILELIST_SEP = '\r\n';

export class MacroExplorerTreeDragAndDropController
  implements vscode.TreeDragAndDropController<MacroExplorerTreeElement>
{
  private readonly context: ExtensionContext;
  public readonly dropMimeTypes: readonly string[];
  public readonly dragMimeTypes: readonly string[];

  constructor(context: ExtensionContext) {
    this.context = context;
    this.dragMimeTypes = [];
    this.dropMimeTypes = [FILELIST_MIMETYPE];
  }

  public handleDrag(
    source: MacroExplorerTreeElement[],
    dataTransfer: vscode.DataTransfer,
    _token: vscode.CancellationToken,
  ): void {
    const macros = source.filter((item) => item instanceof Macro);
    if (macros.length) {
      dataTransfer.set(
        FILELIST_MIMETYPE,
        new vscode.DataTransferItem(macros.map((macro) => macro.uri.toString()).join(FILELIST_SEP)),
      );
    }
  }

  public async handleDrop(
    target: MacroExplorerTreeElement | undefined,
    dataTransfer: vscode.DataTransfer,
    _token: vscode.CancellationToken,
  ): Promise<void> {
    if (!(target instanceof MacroLibrary)) {
      return;
    }

    const item = dataTransfer.get(FILELIST_MIMETYPE);
    if (!item) {
      return;
    }

    const moveOps = (await item.asString())
      .split(FILELIST_SEP)
      .filter((uriStr) => MACRO_EXTENSIONS.includes(extname(uriStr)))
      .map((uriStr) => {
        const source = vscode.Uri.parse(uriStr, true);
        return {
          source,
          target: vscode.Uri.joinPath(target.uri, uriBasename(source)),
        };
      });
    if (moveOps.length === 0) {
      return;
    }

    const movePrompt =
      moveOps.length === 1
        ? `Are you sure you want to move '${uriBasename(moveOps[0].source)}' into '${target.name}'?`
        : `Are you sure you want to move ${moveOps.length} files into '${target.name}'?`;
    if (!(await vscode.window.showInformationMessage(movePrompt, { modal: true }, 'Move'))) {
      return;
    }

    const collisions: string[] = [];
    for (const { target } of moveOps) {
      await vscode.workspace.fs.stat(target).then(() => collisions.push(uriBasename(target)));
    }
    if (collisions.length) {
      let collisionPrompt: string;
      let detail = 'This action is irreversible!';
      if (collisions.length === 1) {
        collisionPrompt = `A file or folder with the name '${uriBasename(moveOps[0].source)}' already exists in '${target.name}'. Do you want to replace it?`;
      } else {
        collisionPrompt = `The following ${collisions.length} names exist in '${target.name}'. Do you want to replace them?`;
        detail = collisions.join('\n') + '\n\n' + detail;
      }
      if (
        !(await vscode.window.showWarningMessage(
          collisionPrompt,
          { detail, modal: true },
          'Replace',
        ))
      ) {
        return;
      }
    }

    for (const { source, target } of moveOps) {
      await vscode.workspace.fs
        .rename(source, target, { overwrite: true })
        .then(undefined, (reason) => this.context.log.error(`Failed to move file`, source, reason));
    }
  }
}
