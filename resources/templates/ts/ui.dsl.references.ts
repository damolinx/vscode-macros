// @macro: singleton

/**
 * Sidebar macro that finds and displays references for the symbol at the
 * current cursor position. The macro uses the VS Code reference provider to
 * collect locations, then renders them in a UI DSL tree view. Selecting a
 * reference opens the file at the referenced line. A progress indicator is
 * shown while searching, and results are streamed back into the webview.
 */

import * as vscode from 'vscode';
import { basename } from 'path';

function createWebviewHtml(): string {
  const { ui } = macros.window;
  const html = ui
    .root(
      { logRelay: true, progress: true },
      ui.container(
        { mode: 'fixed' },
        ui.text('Find references for the symbol at the cursor'),
        ui.button(
          { label: 'Find References', class: 'fill' },
          ui.onHandle('click', () => {
            macro.progress.show();
            vscode.postMessage({ type: 'find' });
          }),
        ),
      ),
      ui.tree(
        { id: 'refsTree', remove: true },
        ui.onHandle('activate', ({ node: { path, line } }) =>
          vscode.postMessage({ type: 'open', path, line }),
        ),
      ),
      ui.script(() => {
        const tree = document.getElementById('refsTree') as any;

        window.onmessage = ({ data }: { data: { type: string; refs?: any[] } }) => {
          if (data.type === 'references') {
            if (data.refs?.length) {
              tree.setRootNodes(
                data.refs.map(({ name, description, line, path }) => ({
                  label: name,
                  description,
                  line,
                  path,
                })),
              );
            } else {
              tree.setRootNodes([
                { label: 'No references found', removable: false, selectable: false },
              ]);
            }
            macro.progress.hide();
          }
        };
      }),
    )
    .toHtml();

  return html;
}

function createWebviewViewProvider(): vscode.WebviewViewProvider {
  return {
    resolveWebviewView: (view: vscode.WebviewView) => {
      view.title = 'Macro: Find References';
      view.webview.html = createWebviewHtml();
      view.webview.options = { enableScripts: true };

      view.webview.onDidReceiveMessage(async (message: any) => {
        switch (message.type) {
          case 'macro:error':
            vscode.window.showErrorMessage(message.error?.message || 'Missing error message');
            break;

          case 'macro:log':
            macros.window.handleLogMessage(message);
            break;

          case 'find': {
            const refs = await findReferences();
            view.webview.postMessage({ type: 'references', refs });
            break;
          }

          case 'open': {
            const uri = vscode.Uri.file(message.path);
            await vscode.window.showTextDocument(uri, {
              selection: new vscode.Range(message.line, 0, message.line, 0),
            });
            break;
          }
        }
      });
    },
  };
}

async function findReferences(): Promise<
  { name: string; description: string; line: number; path: string }[]
> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    macros.log.info('No active editor');
    return [];
  }

  const {
    document: { uri },
    selection: { active },
  } = editor;

  const references = (await vscode.commands.executeCommand(
    'vscode.executeReferenceProvider',
    uri,
    active,
  )) as vscode.Location[] | undefined;

  if (!references?.length) {
    macros.log.info(
      'No references found',
      vscode.workspace.asRelativePath(uri),
      active.line + 1,
      active.character + 1,
    );
    return [];
  }

  macros.log.info(
    `Found ${references.length} reference(s)`,
    vscode.workspace.asRelativePath(uri),
    active.line + 1,
    active.character + 1,
  );

  return references
    .sort(
      (a, b) => a.uri.fsPath.localeCompare(b.uri.fsPath) || a.range.start.line - b.range.start.line,
    )
    .map(({ uri, range: { start } }) => ({
      description: vscode.workspace.asRelativePath(uri),
      line: start.line,
      name: `${basename(uri.fsPath)}:${start.line + 1}`,
      path: uri.fsPath,
    }));
}

new Promise<void>((resolve) => {
  const viewId = macros.window.getWebviewId();
  if (!viewId) {
    vscode.window.showErrorMessage(`Macro ${__runId} could not claim a Webview ID`).then(resolve);
    return;
  }

  __cancellationToken.onCancellationRequested(resolve);
  __disposables.push(
    vscode.window.registerWebviewViewProvider(viewId, createWebviewViewProvider()),
    {
      dispose: () => vscode.commands.executeCommand('setContext', `${viewId}.show`, false),
    },
  );

  vscode.commands.executeCommand('setContext', `${viewId}.show`, true);
  vscode.commands.executeCommand(`${viewId}.focus`);
});
