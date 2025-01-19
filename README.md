# `Macros for VS Code` Extension 

The `Macros for VS Code` extension allows you to run automation scripts (macros) using standard [VS Code APIs](https://code.visualstudio.com/api/references/vscode-api) but without having to create a full extension. This enables scenarios like rapid prototyping of extension features, or commonly, custom tools for rare or specific scenarios that do not justify the effort of maintaining a full extension. 

The main tradeoff for this approach is that all your scripts are run within the same process of this extension. Although their execution context is [sandboxed](https://nodejs.org/api/vm.html#class-vmscript), a poorly performing script could affect other scripts or the extension itself.  Currently, using separate processes for isolation is a not a goal, as it would essentially replicate the model of regular extensions.

To keep things simple, only JavaScript scripts are supported at the moment. Supporting TypeScript would require a toolchain and a transpilation process, which would complicate the setup

## Features

- Create custom macros using JavaScript.
- Run multiple macros simultaneously, on demand or at extension startup.
- Options to define persistent and singleton macros provide advanced control.

## Usage

1. Create a new macro file with a `.js` extension.
2. Write your JavaScript macro code (see [Available References](#available-references)).
```javascript
// Example: Hello World!
vscode.window.showInformationMessage("Hello, world!");
```
3. From the [Command Palette](https://code.visualstudio.com/api/references/contribution-points#contributes.commands) use the `Run Macro (Active Editor)` command to execute your macro.

### Commands 
* `New Macro…`: creates a new macro with sample contents. 
* `Run Active File as Macro`: run current editor as a macro (document will be saved before running).
* `Rerun Last Macro`: re-run last executed macro.
* `Run Macro…`: select a macro file from file system.
* `Run Macro (Source Directories)`: select a macro to run from `macros.sourceDirectories` paths.
* `Show Running Macros`: view and manage running macros. 

## Available References
The following references are available from the global context of your macro:
* `vscode`: symbol that provides access to the [VS Code APIs](https://code.visualstudio.com/api/references/vscode-api).
* `macros`: symbol that provides access to this extension's API (see [Macros API](#macros-api)). 
* `require`: method that allows load [NodeJS libraries](https://nodejs.org/api/all.html). Version is same as your installed VS Code's (see `About`).
* Other: `clearInterval`, `clearTimeout`, `fetch`, `global`, `setInterval`, `setTimeout`.

### `macros` API
* `macro`: Provides access to current macro.
  * `uri`: URI of macro. It is `undefined` if running from an in-memory buffer.

```javascript
// Example: Macros API
vscode.window.showInformationMessage(`Hello from ${macros.macro.uri?.fsPath || 'somewhere'}!`);
```
## Macros Options
An option is added as a comment in the form `//@macro:«option»`.  The following options are available:
* `persistent`: All runs of the given macro are started with the same execution context, allowing state preservation. 
* `singleton`: Only one running instance of the given macro is allowed at a time.

```javascript
// @macro:singleton
// Example: Hello World!
vscode.window.showInformationMessage("Hello, world!");
```