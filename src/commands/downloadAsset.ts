import * as vscode from 'vscode';
import { get } from 'https';
import { ExtensionContext } from '../extensionContext';
import { exists } from '../utils/fsEx';
import { formatDisplayUri, MacroFilter } from '../utils/ui';
import { isUntitled, parentUri, uriBasename, UriLocator, resolveUri } from '../utils/uri';
import { saveTextEditor } from '../utils/vscodeEx';
import { revealInOS } from './revealInOS';

const NO_OPTION: vscode.MessageItem = { title: 'No', isCloseAffordance: true };
const YES_OPTION: vscode.MessageItem = { title: 'Yes' };

export async function downloadAsset(
  context: ExtensionContext,
  assetUri: vscode.Uri,
  locator: UriLocator,
): Promise<vscode.Uri | undefined> {
  const targetDownloadDir = await getDownloadLocation(resolveUri(locator));
  if (!targetDownloadDir) {
    return;
  }

  const targetDownloadUri = vscode.Uri.joinPath(targetDownloadDir, uriBasename(assetUri));
  if (
    (await exists(targetDownloadUri, vscode.FileType.File)) &&
    (await vscode.window.showWarningMessage(
      'Do you want to override existing file?',
      {
        modal: true,
        detail: formatDisplayUri(targetDownloadUri),
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
      const data: Buffer[] = [];
      if (res.statusCode === 200) {
        res.on('data', (chunk) => data.push(chunk)).on('end', () => resolve(Buffer.concat(data)));
      } else {
        const msg = `Failed to download asset - HTTP ${res.statusCode} ${res.statusMessage}`;
        context.log.error(msg, "-", targetAssetUri.toString(true));
        reject(new Error(msg));
      }
    }).on('error', (err) => {
      context.log.error(err);
      reject(err);
    });
  });
  if (!content) {
    vscode.window.showErrorMessage(`Failed to download asset: ${targetAssetUri.toString(true)}`);
    return;
  }

  const uiTarget = formatDisplayUri(targetDownloadUri);
  await vscode.workspace.fs.writeFile(targetDownloadUri, content);
  context.log.info('Downloaded asset to', uiTarget);
  vscode.window.showInformationMessage(`Downloaded: ${uiTarget}`, 'Reveal').then((option) => {
    if (option === 'Reveal') {
      revealInOS(context, targetDownloadUri);
    }
  });
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

async function getDownloadLocation(macroUri: vscode.Uri): Promise<vscode.Uri | undefined> {
  let targetUri: vscode.Uri | undefined = macroUri;
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
      targetUri = editor?.document.uri;
    } else {
      targetUri = undefined;
    }
  }

  return targetUri && parentUri(targetUri);
}
