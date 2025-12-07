import * as vscode from 'vscode';
import { get } from 'https';
import { ExtensionContext } from '../extensionContext';
import { existsFile } from '../utils/fsEx';
import { MacroFilter } from '../utils/ui';
import { isUntitled, parent, uriBasename, UriLocator, resolveUri } from '../utils/uri';
import { saveTextEditor } from '../utils/vscodeEx';

const NO_OPTION: vscode.MessageItem = { title: 'No', isCloseAffordance: true };
const YES_OPTION: vscode.MessageItem = { title: 'Yes' };

export async function downloadAsset(
  { log }: ExtensionContext,
  assetUri: vscode.Uri,
  locator: UriLocator,
): Promise<vscode.Uri | undefined> {
  const targetDownloadDir = await getDownloadLocation(resolveUri(locator));
  if (!targetDownloadDir) {
    return;
  }

  const targetDownloadUri = vscode.Uri.joinPath(targetDownloadDir, uriBasename(assetUri));
  if (
    (await existsFile(targetDownloadUri)) &&
    (await vscode.window.showWarningMessage(
      'Do you want to override existing file?',
      {
        modal: true,
        detail: `Path: ${targetDownloadUri.scheme === 'file' ? targetDownloadUri.fsPath : targetDownloadUri.toString(true)}`,
      },
      YES_OPTION,
      NO_OPTION,
    )) !== YES_OPTION
  ) {
    return;
  }

  const targetAssetUri = convertGitHubUrlToDownload(assetUri);
  const content = await new Promise<Buffer | undefined>((resolve, reject) => {
    get(targetAssetUri.toString(), (res) => {
      const data: any[] = [];
      res.on('data', (chunk) => data.push(chunk)).on('end', () => resolve(Buffer.concat(data)));
    }).on('error', (err) => {
      log.error(err);
      reject(err);
    });
  });
  if (!content) {
    vscode.window.showErrorMessage(`Failed to download asset from ${targetAssetUri}`);
    return;
  }

  await vscode.workspace.fs.writeFile(targetDownloadUri, content);
  log.info('Downloaded .d.ts file', targetDownloadUri.toString(true));
  vscode.window.showInformationMessage(`Downloaded: ${targetDownloadUri.toString(true)}`);
  return targetDownloadUri;
}

function convertGitHubUrlToDownload(uri: vscode.Uri): vscode.Uri {
  let updatedUri = uri;
  if (uri.authority === 'github.com') {
    updatedUri = uri.with({
      authority: 'raw.githubusercontent.com',
      path: uri.path.replace('/blob/', '/'),
    });
  }
  return updatedUri;
}

async function getDownloadLocation(locator: UriLocator): Promise<vscode.Uri | undefined> {
  let macroUri: vscode.Uri | undefined = resolveUri(locator);

  if (isUntitled(macroUri)) {
    const result = await vscode.window.showInformationMessage(
      'Would you like to save your macro?',
      { modal: true, detail: 'Macro must be saved to disk to define a download location.' },
      YES_OPTION,
      NO_OPTION,
    );

    if (result?.title === 'Yes') {
      const editor = await saveTextEditor(vscode.window.activeTextEditor!, {
        filters: MacroFilter,
      });
      macroUri = editor?.document.uri;
    } else {
      macroUri = undefined;
    }
  }

  return macroUri && parent(macroUri);
}
