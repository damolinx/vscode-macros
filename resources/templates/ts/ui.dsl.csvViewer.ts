// @ts-nocheck

/**
 * Renders the active CSV file in a read-only Webview Panel. Rows are embedded
 * into a serialized `ui.script` and drawn as a table via DOM APIs. Uses only
 * macro‑safe DSL primitives and stays alive until the panel closes.
 */

import * as vscode from 'vscode';

function createWebviewHtml(rows: string[][]): string {
  const { ui } = macros.window;

  // Serialize rows into JS literal
  const rowsLiteral = JSON.stringify(rows);

  return ui
    .root(
      ui.text('CSV Viewer (read-only)'),
      ui.container({ id: 'table' }),
      ui.script(() => {
        // __ROWS__ will be replaced with JSON before sending to the Webview
        const rows = '__ROWS__';
        const container = document.getElementById('table')!;
        if (!rows.length) {
          container.innerHTML = '<p>No data</p>';
          return;
        }

        const table = document.createElement('table');
        table.style.borderCollapse = 'collapse';

        rows.forEach((row: string[], i: number) => {
          const tr = document.createElement('tr');
          if (i === 0) {
            tr.style.fontWeight = 'bold';
          }

          row.forEach((cell) => {
            const td = document.createElement('td');
            td.textContent = cell;
            td.style.border = '1px solid #ccc';
            td.style.padding = '4px 6px';
            tr.appendChild(td);
          });

          table.appendChild(tr);
        });

        container.appendChild(table);
      }),
    )
    .toHtml()
    .replace('"__ROWS__"', rowsLiteral);
}

function parseCsv(text: string): string[][] {
  return text
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.split(','));
}

new Promise((resolve) => {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage('No active editor').then(resolve);
    return;
  }

  const uri = editor.document.uri;
  if (!uri.fsPath.endsWith('.csv')) {
    vscode.window.showErrorMessage('Current editor is not a .csv file').then(resolve);
    return;
  }

  const panel = vscode.window.createWebviewPanel(
    'macros.csvViewer',
    'CSV Viewer',
    vscode.ViewColumn.Active,
    { enableFindWidget: true, enableScripts: true },
  );

  const rows = parseCsv(editor.document.getText());
  panel.webview.html = createWebviewHtml(rows);

  __cancellationToken.onCancellationRequested(resolve);
  panel.onDidDispose(resolve);
  __disposables.push(panel);
});
