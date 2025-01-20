# `Macros for VS Code` Extension 

The `Macros for VS Code` extension allows you to run automation scripts (macros) using standard [VS Code APIs](https://code.visualstudio.com/api/references/vscode-api) but without having to create a full extension. This enables scenarios like rapid prototyping of extension features, or commonly, custom tools for rare or specific scenarios that do not justify the effort of maintaining a full extension. 

The main tradeoff for this approach is that all your scripts are run within the same process of this extension. Although their execution context is [sandboxed](https://nodejs.org/api/vm.html#class-vmscript), a poorly performing script could affect other scripts or the extension itself.  Currently, using separate processes for isolation is not a goal, as it would essentially replicate the model of regular extensions.

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

## Commands 

### Debug Macros
See [Macro Debugging](#macro-debugging) for additional information.
* `Debug Active File as Macro`: debug current editor as a macro (document will be saved before running).
* `Debug Macro…`: select a macro file to debug from file system.
* `Debug Macro (Source Directories)`: select a macro to debug from `macros.sourceDirectories` paths.

### Manage Macros
* `New Macro…`: creates a new macro with sample contents.
* `Show Running Macros`: view and manage running macros.

### Run Macros
* `Run Active File as Macro`: run current editor as a macro (document will be saved before running).
* `Rerun Last Macro`: re-run last executed macro.
* `Run Macro…`: select a macro file to run from file system.
* `Run Macro (Source Directories)`: select a macro to run from `macros.sourceDirectories` paths.

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

## Macro Options
An option is added to macro file as a comment in the form `//@macro:«option»`. The following options are available:
* `persistent`: All runs of the given macro are started with the same execution context, allowing state preservation. 
* `singleton`: Only one running instance of the given macro is allowed at a time.

```javascript
// @macro:singleton
// Example: Hello World!
vscode.window.showInformationMessage("Hello, world!");
```

### Macro Debugging
Debugging a macro leverages VS Code's extension debugging [story](https://code.visualstudio.com/api/get-started/your-first-extension#debugging-the-extension) since the macros are run in the context of this extension. This makes the experience a bit awkward as a new VS Code instance is launched, and you need to open the right context (e.g. workspace) in that new instance to debug your macro (vs, for example, launching another VS Code instance and attaching to the current one). 