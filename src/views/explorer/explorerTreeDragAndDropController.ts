import * as vscode from 'vscode';
import { MACRO_LANGUAGES, MACRO_PREFERRED_LANGUAGE, MacroLanguageId } from '../../core/language';
import { Macro } from '../../core/macro';
import { existsFile } from '../../utils/fsEx';
import { areUriEqual, isUntitled, uriBasename } from '../../utils/uri';
import { saveTextEditor } from '../../utils/vscodeEx';
import { TreeElement } from '../../views/explorer/explorerTreeDataProvider';
import { TreeDragAndDropController } from '../treeDragAndDropController';

export class ExplorerTreeDragAndDropController extends TreeDragAndDropController<Macro> {
  protected override get treeMimeType(): string {
    return 'application/vnd.code.tree.macros.macroexplorer';
  }

  public override handleDrag(
    source: TreeElement[],
    dataTransfer: vscode.DataTransfer,
    token: vscode.CancellationToken,
  ): void {
    const filteredSource = source.filter((item) => item instanceof Macro);
    super.handleDrag(filteredSource, dataTransfer, token);
  }

  public override async handleDrop(
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

    const sources = await this.getSourceUris(dataTransfer);
    if (!sources) {
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
          return areUriEqual(source, targetUri) ? null : { source, target: targetUri };
        }),
      );

      return moveOps.filter(Boolean) as { source: vscode.Uri; target: vscode.Uri }[];
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
