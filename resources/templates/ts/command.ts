// @ts-nocheck
import { userInfo } from 'os';

// Insert a TODO comment at current cursor line.
// Reference: https://code.visualstudio.com/api/references/commands
macros.commands.executeCommands(
  'editor.action.insertLineBefore',
  ['type', { text: `TODO (${userInfo().username}): <describe task>` }],
  'editor.action.addCommentLine',
  'cursorEnd',
);