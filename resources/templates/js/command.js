
const { userInfo } = require('os');

async function runCommands(...cmds) {
  for (const { cmdId, args = [] } of cmds) {
    await vscode.commands.executeCommand(cmdId, ...args);
  }
}

// Insert a TODO comment at current cursor line.
// Reference: https://code.visualstudio.com/api/references/commands
runCommands(
  { cmdId: 'editor.action.insertLineBefore' },
  { cmdId: 'type', args: [{ text: `TODO (${userInfo().username}): <describe task>` }] },
  { cmdId: 'editor.action.addCommentLine' },
  { cmdId: 'cursorEnd' },
);