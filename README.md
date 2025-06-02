# Macros for VS Code

A **macro** is a JavaScript script that lets you automate tasks or add custom tools to VS Code using its standard [extensibility APIs](https://code.visualstudio.com/api/references/vscode-api) but without the overhead of maintaining a full extension. Macros are ideal for workspace-specific automation, enhancing your workflow with custom utilities, or quickly prototyping extension features.

Implementation-wise, these macro scripts are executed within [sandboxes](https://nodejs.org/api/vm.html#class-vmscript) hosted within the process of this extension. This approach provides isolated execution, with full access to `vscode` and NodeJS APIs.

## Getting Started

1. Create a new macro:
   - **Option 1**: Use the **New Macro** command.
   - **Option 2**: Create an empty `javascript` editor and use the **Fill File with Template** command.
   - **Option 3**: Ask the `@macros` chat agent to create a macro for you.

   > ℹ️ Save your macro files using a `.macro.js` extension. This enables UI controls, IntelliSense, and other macro-specific features.

2. Write, or update, your macro code.
   - See [Available References](#available-code-references).

    **Example: "Hello, World!" macro**
    ```javascript
    vscode.window.showInformationMessage("Hello, world!");
    ```

     **Example: Async "Hello, World!" macro**
    ```javascript
    async function main() {
      const yes = { title: 'Yes' };
      const no = { title: 'No', isCloseAffordance: true };

      let answer;
      do {
        answer = await vscode.window.showInformationMessage(
          `Hello, World!. Close this dialog?`, { modal: true }, yes, no);
      } while (answer !== yes);
    }

    main()
    ```

3. From the [Command Palette](https://code.visualstudio.com/api/references/contribution-points#contributes.commands), use the **Run Active Editor as Macro** command to execute your macro.  Alternatively, on `Untitled` `javascript` or `*.macro.js`,  editors,  use the run and debug buttons will be available on the editor title bar.

   <p align=center>
     <img width="400" alt="Macro editor showing Run Macro button" src="https://github.com/user-attachments/assets/53f36963-d754-4b83-912d-689d5e200f17" />
   </p>

### Stopping a Macro

1. Use the **Show Running Macros** command and click the stop button to **request** the macro to stop.

A macro sandbox cannot be terminated; instead, the `Stop` action sends a cancellation request via the `__cancellationToken` ([CancellationToken](https://code.visualstudio.com/api/references/vscode-api#CancellationToken)) variable to the macro. This variable must be wired into all async code and APIs.

If a macro does not respond to the cancellation request, it will continue running. In such cases, you can use the **Developer: Restart Extension Host** command to restart all extensions, or simply restart VS Code to stop the macro. While this is not ideal, it provides a way to recover from unresponsive or runaway macros. Note that this approach will not implicitly terminate external processes started by the macro.

### Keybinding a Macro
Keybind the `macros.run` command with a single argument that is the path to the macro to run. This can only be done directly in the `keybindings.json` file, however. Check the VS Code [documentation](https://code.visualstudio.com/docs/editor/keybindings#_advanced-customization) for details.

1. Use the **Preferences: Open Keyboard Shortcuts (JSON)** command to open the `keybindings.json` file.

2. Add a keybinding for the `macros.run` command passing as argument the path to the macro file to run (`${userhome}` and `${workspaceFolder}` tokens are supported), e.g.

    **Example: Keybinding definition**
    ```json
    [
      {
        "key": "Shift+Alt+X",
        "command": "macros.run",
        "args": "${userhome}/macros/references.macro.js",
        "when": "editorTextFocus"
      }
    ]
    ```

### Commands

#### Debugging
See [Debugging a Macro](#debugging-a-macro) for additional information.
* **Debug Active File as Macro**: debug current editor as a macro (document will be saved before running).
* **Debug Macro…**: select a macro file to debug. Provides access to configured `macros.sourceDirectories`.

#### Development
* **Create New REPL Terminal**: start a REPL whose context matches the one used when running macros.
  * Use `.help` for list of available commands.
* **Setup Source Directory for Development**: adds or updates optional files used to improve IntelliSense on macro files.

#### Manage Macros
* **Fill File with Template**: initialize an existing file with example macro content.
* **New Macro…**: creates a new file with example macro content.
* **Show Running Macros**: view and manage running macros.

#### Run Macros
* **Run Active File as Macro**: run current editor as a macro (document will be saved before running).
* **Rerun Last Macro**: execute the most recently run macro.
* **Run Macro…**: select a macro to run. Provides access to macros in configured `macros.sourceDirectories` directories.

## Development

### Available Code References
The following references are available from the global context of your macro:
* `vscode`: symbol that provides access to the [VS Code APIs](https://code.visualstudio.com/api/references/vscode-api).
* `macros`: symbol that provides access to this extension's API (see [Macros API](#macros-api)).
* `require`: method that allows load [Node.js libraries](https://nodejs.org/api/all.html). Version is same as your installed VS Code's (see `About` option).
* Other: `atob`, `btoa`, `clearInterval`, `clearTimeout`, `crypto`, `fetch`, `global`, `require`, `setInterval`, `setTimeout`.

### `macros` API
* `macro`: Provides access to current macro.
  * `uri`: URI of macro. It is `undefined` if running from an in-memory buffer.

  **Example: Macros API**
  ```javascript
  vscode.window.showInformationMessage(`Hello from ${macros.macro.uri?.fsPath || 'somewhere'}!`);
  ```

### Predefined Views and View Container
Views such as sidebars and panels cannot be created dynamically—they must first be declared in the extension's `package.json` manifest. This limitation means macros would not be able to define their own views at runtime. To overcome this limitation, the extension predefines a `Macros` view container (with the id: `macrosViews`) with generic `webview` and `treeview` views (with ids `macrosView.webview[1..3]` and `macrosView.treeview[1..3]`). Macros can then "claim" and use these predefined views to display custom content or UI as needed.
Views are disabled by default via a context value, so to enable them you must enable that context value (see example below).

  **Example: Enabling `macrosView.webview1` view**
  ```
  vscode.commands.executeCommand('setContext', 'macrosView.webview1.show', true);
  ```
Remember to set this back to `false` when macro completes.

**Macro-backed tree view ("Tree View" template)**
<p align=center>
<img width="292" alt="image" src="https://github.com/user-attachments/assets/ffdbcb2d-4e68-4960-a6a7-f3a76490317f" />
</p>

#### Special Tokens
These tokens do not form part of contexts shared when `@macro:persistent` is used as they are different from session to session.
* `__cancellationToken`: a [CancellationToken](https://code.visualstudio.com/api/references/vscode-api#CancellationToken) used by th extension to notify about a stop request. See [Stopping a Macro](#stopping-a-macro).
* `__disposables`: an array for adding [Disposable](https://code.visualstudio.com/api/references/vscode-api#Disposable) instances, which will be automatically disposed of when the macro completes.
* `__runId`: Id of the current macro execution session.

### Macro Options

An option is added to macro file as a comment in the form `//@macro:«option»`. The following options are available:
* `persistent`: All runs of the given macro are started with the same execution context, allowing state preservation.
* `singleton`: Only one running instance of the given macro is allowed at a time.

```javascript
// @macro:singleton
// Example: Hello World!
vscode.window.showInformationMessage("Hello, world!");
```

### Download Definition Files
Any URL in a macro file pointing to a `.d.ts` file will automatically receive a code action, **Download .d.ts**, enabling you to download the file directly to the macro's parent folder. This simplifies adding type definitions to support IntelliSense in your macros.

For GitHub URLs containing `/blob/`, the extension offers special handling by converting them to their raw equivalent. For example: `https://github.com/Microsoft/vscode/blob/main/extensions/git/src/api/git.d.ts` is automatically handled as `https://github.com/Microsoft/vscode/raw/refs/heads/main/extensions/git/src/api/git.d.ts`.

For all other URLs, a standard HTTP GET request is sent to download the file.

## Debugging a Macro
Debugging a macro leverages VS Code's extension debugging [story](https://code.visualstudio.com/api/get-started/your-first-extension#debugging-the-extension) since the macros are run in the context of this extension. This makes the experience a bit awkward as a new VS Code instance is launched, and you need to open the right context (e.g. workspace) in that new instance to debug your macro (vs, for example, launching another VS Code instance and attaching to the current one).
