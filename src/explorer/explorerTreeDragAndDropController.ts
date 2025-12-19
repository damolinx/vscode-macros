import * as vscode from 'vscode';
import { setStartupMacro } from '../commands/setStartupMacro';
import {
  isMacro,
  MACRO_LANGUAGES,
  MACRO_PREFERRED_LANGUAGE,
  MacroLanguageId,
} from '../core/language';
import { Macro } from '../core/macro';
import { ExtensionContext } from '../extensionContext';
import { existsFile } from '../utils/fsEx';
import { isStartup, isUntitled, uriBasename } from '../utils/uri';
import { saveTextEditor } from '../utils/vscodeEx';
import { TreeElement } from './explorerTreeDataProvider';

export const FILELIST_MIMETYPE = 'text/uri-list';
export const FILELIST_SEP = '\r\n';
export const TREE_MIMETYPE = 'application/vnd.code.tree.macros.macroexplorer';

export class ExplorerTreeDragAndDropController implements vscode.TreeDragAndDropController<TreeElement> {
  private readonly context: ExtensionContext;
  public readonly dropMimeTypes: readonly string[];
  public readonly dragMimeTypes: readonly string[];

  constructor(context: ExtensionContext) {
    this.context = context;
    this.dragMimeTypes = [];
    this.dropMimeTypes = [FILELIST_MIMETYPE];
  }

  public handleDrag(
    source: TreeElement[],
    dataTransfer: vscode.DataTransfer,
    _token: vscode.CancellationToken,
  ): void {
    const macros = source.filter((item): item is Macro => item instanceof Macro);
    if (macros.length) {
      dataTransfer.set(
        FILELIST_MIMETYPE,
        new vscode.DataTransferItem(macros.map((macro) => macro.uri.toString()).join(FILELIST_SEP)),
      );
      dataTransfer.set(TREE_MIMETYPE, new vscode.DataTransferItem(macros));
    }
  }

  public async handleDrop(
    target: TreeElement | undefined,
    dataTransfer: vscode.DataTransfer,
    _token: vscode.CancellationToken,
  ): Promise<void> {
    if (!target || !('uri' in target) || isUntitled(target)) {
      return;
    }

    if (target instanceof Macro) {
      target = this.context.libraryManager.libraryFor(target.uri);
      if (!target) {
        return;
      }
    }

    const sources = await getSourceUris();
    if (!sources) {
      return;
    }

    if (isStartup(target.uri)) {
      sources.forEach((uri) => !isUntitled(uri) && setStartupMacro(this.context, uri));
      return;
    }

    const moveOps = await getMoveOps(sources, target.uri);
    if (
      !moveOps.length ||
      !(await this.promptForConsent(moveOps, target.name)) ||
      !(await this.promptForCollisions(moveOps, target.name))
    ) {
      return;
    }

    const failed: { message: string; source: vscode.Uri }[] = [];
    for (const { source, target } of moveOps) {
      try {
        if (isUntitled(source)) {
          const editor = await vscode.window.showTextDocument(source);
          await saveTextEditor(editor, target);
        } else {
          await vscode.workspace.fs.rename(source, target, { overwrite: true });
        }
      } catch (error: any) {
        this.context.log.error('Failed to move file', source, error.message || error);
        failed.push({ message: error.message, source: source });
      }
    }

    if (failed.length) {
      vscode.window.showErrorMessage(
        `Failed to move ${failed.length} file(s). Check 'Macros' logs for details.`,
      );
    }

    async function getMoveOps(sources: vscode.Uri[], target: vscode.Uri) {
      const moveOps = await Promise.all(
        sources.map(async (source) => {
          let sourceName = uriBasename(source);

          if (isUntitled(source) && sourceName === uriBasename(source, true)) {
            const document = await vscode.workspace.openTextDocument(source);
            sourceName += (
              MACRO_LANGUAGES[document.languageId as MacroLanguageId] ??
              MACRO_LANGUAGES[MACRO_PREFERRED_LANGUAGE]
            ).defaultExtension;
          }

          const targetUri = vscode.Uri.joinPath(target, sourceName);

          return source.toString() !== targetUri.toString() ? { source, target: targetUri } : null;
        }),
      );

      return moveOps.filter(Boolean) as { source: vscode.Uri; target: vscode.Uri }[];
    }

    async function getSourceUris() {
      let uris: vscode.Uri[] | undefined;
      let item: vscode.DataTransferItem | undefined;
      if ((item = dataTransfer.get(TREE_MIMETYPE))) {
        uris = (item.value as Macro[]).map(({ uri }) => uri);
      } else if ((item = dataTransfer.get(FILELIST_MIMETYPE))) {
        uris = (await item.asString())
          .split(FILELIST_SEP)
          .filter(isMacro)
          .map((str) => vscode.Uri.parse(str, true));
      }

      return uris;
    }
  }

  private async promptForConsent(
    moveOps: { source: vscode.Uri; target: vscode.Uri }[],
    targetName: string,
  ): Promise<boolean> {
    if (moveOps.some(({ source }) => isUntitled(source))) {
      return true;
    }

    const movePrompt =
      moveOps.length === 1
        ? `Are you sure you want to move '${uriBasename(moveOps[0].source)}' into '${targetName}'?`
        : `Are you sure you want to move ${moveOps.length} files into '${targetName}'?`;
    if (!(await vscode.window.showInformationMessage(movePrompt, { modal: true }, 'Move'))) {
      return false;
    }

    return true;
  }

  private async promptForCollisions(
    moveOps: { source: vscode.Uri; target: vscode.Uri }[],
    targetName: string,
  ): Promise<boolean> {
    const collisions: string[] = [];
    for (const { target } of moveOps) {
      if (await existsFile(target)) {
        collisions.push(uriBasename(target));
      }
    }
    if (collisions.length === 0) {
      return true;
    }

    let collisionPrompt: string;
    let detail = 'This action is irreversible!';
    if (collisions.length === 1) {
      collisionPrompt = `A file or folder with the name '${uriBasename(moveOps[0].target)}' already exists in '${targetName}'. Do you want to replace it?`;
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
