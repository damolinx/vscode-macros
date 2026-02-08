import * as vscode from 'vscode';

export async function executeCommands(
  ...cmds: (string | [id: string, ...args: any[]])[]
): Promise<any[]> {
  const results: any[] = [];
  for (const cmd of cmds) {
    const [id, ...args] = Array.isArray(cmd) ? cmd : [cmd];
    const result = await vscode.commands.executeCommand(id, ...args);
    results.push(result);
  }
  return results;
}
