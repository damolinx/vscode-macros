// @ts-nocheck
import * as os from 'os';

async function runCommands(...cmds: { cmdId: string, args?: any[] }[]): Promise<void> {
  for (const { cmdId, args = [] } of cmds) {
    await vscode.commands.executeCommand(cmdId, ...args);
  }
}

// Insert a TODO comment at current cursor line.
// Reference: https://code.visualstudio.com/api/references/commands
runCommands(
  { cmdId: 'editor.action.insertLineBefore' },
  { cmdId: 'type', args: [{ text: `TODO (${os.userInfo().username}): <describe task>` }] },
  { cmdId: 'editor.action.addCommentLine' },
  { cmdId: 'cursorEnd' },
);