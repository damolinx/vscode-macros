import * as vscode from 'vscode';
import { createWriteStream } from 'fs';
import { get } from 'https';
import { basename, dirname, join } from 'path';
import { saveTextEditor } from '../common/vscodeEx';
import { MACROS_FILTER } from '../constants';

const YES_OPTION = 'Yes';

export async function downloadAsset(url: string, macroFile: vscode.Uri): Promise<vscode.Uri | undefined> {
  let sourceMacroFile: string | undefined;
  if (macroFile.scheme === 'untitled') {
    if (await vscode.window.showInformationMessage('Would you like to save your macro?',
      { modal: true, detail: 'Macro must be saved to disk in order to determine download location.' },
      YES_OPTION)
      === YES_OPTION) {
      const editor = await saveTextEditor(vscode.window.activeTextEditor!, { filters: MACROS_FILTER });
      sourceMacroFile = editor?.document.fileName;
    }
    if (!sourceMacroFile) {
      return;
    }
  } else {
    sourceMacroFile = macroFile.fsPath;
  }

  const targetPath = join(dirname(sourceMacroFile), basename(url));
  const targetUrl = convertGitHubUrlToDownload(url);
  return new Promise<vscode.Uri | undefined>((resolve, reject) => {
    get(targetUrl, (res) => {
      const fileStream = createWriteStream(targetPath);
      fileStream.on('finish', () => fileStream.close());
      res.pipe(fileStream);
      resolve(vscode.Uri.file(targetPath));
    })
      .on('error', (err) => reject(err));
  });
}

function convertGitHubUrlToDownload(url: string) {
  return url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
}
