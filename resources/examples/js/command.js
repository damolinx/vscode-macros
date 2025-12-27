const os = require('os');

async function runCommands(cmds) {
  for (const { cmd, args = [] } of cmds) {
    await vscode.commands.executeCommand(cmd, ...args);
  }
}

// Insert a TODO comment at current cursor line.
// Reference: https://code.visualstudio.com/api/references/commands
runCommands([
  { cmd: "editor.action.insertLineBefore" },
  { cmd: "type", args: [{ text: `TODO (${os.userInfo().username}): <describe task>` }] },
  { cmd: "editor.action.addCommentLine" },
  { cmd: "cursorEnd" },
]);