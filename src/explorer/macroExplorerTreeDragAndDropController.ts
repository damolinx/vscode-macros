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
      .filter((str) => MACRO_EXTENSIONS.includes(extname(str)))
      .map((str) => {
        const source = vscode.Uri.parse(str, true);
        return {
          source,
          target: vscode.Uri.joinPath(target.uri, uriBasename(source)),
        };
      })
      .filter(({ source, target }) => source.toString() !== target.toString());

    if (
      !moveOps.length ||
      !(await this.handleConsent(moveOps, target.name)) ||
      !(await this.handleCollisions(moveOps, target.name))
    ) {
      return;
    }

    for (const { source, target } of moveOps) {
      try {
        await vscode.workspace.fs.rename(source, target, { overwrite: true });
      } catch (error: any) {
        this.context.log.error('Failed to move file', source, error.message || error);
      }
    }
  }

  private async handleConsent(
    moveOps: { source: vscode.Uri; target: vscode.Uri }[],
    targetName: string,
  ): Promise<boolean> {
    const movePrompt =
      moveOps.length === 1
        ? `Are you sure you want to move '${uriBasename(moveOps[0].source)}' into '${targetName}'?`
        : `Are you sure you want to move ${moveOps.length} files into '${targetName}'?`;
    if (!(await vscode.window.showInformationMessage(movePrompt, { modal: true }, 'Move'))) {
      return false;
    }

    return true;
  }

  private async handleCollisions(
    moveOps: { source: vscode.Uri; target: vscode.Uri }[],
    targetName: string,
  ): Promise<boolean> {
    const collisions: string[] = [];
    for (const { target } of moveOps) {
      try {
        await vscode.workspace.fs.stat(target);
        collisions.push(uriBasename(target));
      } catch (error: any) {
        this.context.log.trace('Stat failed', target, error.message || error);
      }
    }
    if (collisions.length === 0) {
      return true;
    }

    let collisionPrompt: string;
    let detail = 'This action is irreversible!';
    if (collisions.length === 1) {
      collisionPrompt = `A file or folder with the name '${uriBasename(moveOps[0].source)}' already exists in '${targetName}'. Do you want to replace it?`;
    } else {
      collisionPrompt = `The following ${collisions.length} names exist in '${targetName}'. Do you want to replace them?`;
      detail = collisions.join('\n') + '\n\n' + detail;
    }
    if (
      !(await vscode.window.showWarningMessage(collisionPrompt, { detail, modal: true }, 'Replace'))
    ) {
      return false;
    }

    return true;
  }
}
