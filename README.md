# Macros for VS Code

A **macro** is a script written in either JavaScript or TypeScript that lets you automate tasks or build custom tools in VS Code using standard [extensibility APIs](https://code.visualstudio.com/api/references/vscode-api), without the complexity of maintaining a full extension. Macros are ideal for workspace-specific automation, streamlining your workflow with custom utilities, or rapidly prototyping extension-like behavior.

Macros can be easily managed through the [**Macro Explorer**](#macro-explorer-view), allowing you to work with on-disk libraries or in-memory documents. TypeScript is supported out of the box—transpilation is handled automatically. Macros can contribute UI views, including Webview and TreeView views, enabling more complex experiences.

Under the hood, macros are run inside [Node.js VM sandboxes](https://nodejs.org/api/vm.html#class-vmscript) within the extension's context. This setup provides isolated execution—within the constraints of the sandbox—while still granting full access to VS Code’s API and core Node.js modules.

<p align=center>
  <img width="400" alt="VS Code with Macro Explorer view and a macro editor open" src="https://github.com/user-attachments/assets/34637385-782a-4578-863e-35d8e3caa2c7" />
</p>

## Getting Started

1. Create a new macro:
   - **Option 1**: Use the **Macros: New Macro** command, or the `+` buttons in the [**Macro Explorer**](#macro-explorer-view).
   - **Option 2**: Create an *untitled* document, with `javascript` or `typescript` language
   - **Option 3**: Ask the `@macros` Chat agent to create a macro for you.

   > ℹ️ Save your macro files using a `.macro.js` or `.macro.ts` extension. These enable UI controls, IntelliSense, and other macro-specific features.

2. Write, or update, your macro code.
   - You can use the **Macros: Fill File with Template** command in an existing editor.
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

3. From the [Command Palette](https://code.visualstudio.com/api/references/contribution-points#contributes.commands), use the **Macros: Run Active Editor as Macro** command to execute your macro. Alternatively, on *untitled*, `javascript` or `typescript` editors, or those with `*.macro.js` or `*.macro.ts` names, use the equivalent run and debug buttons available on the editor title bar.

   <p align=center>
      <img width="400" alt=""Macro editor showing the Debug Macro button" src="https://github.com/user-attachments/assets/78acb656-8c1c-4939-823f-72fbd84c13ea" />
   </p>

### Stopping a Macro

1. Use the [**Macro Explorer**](#macro-explorer-view) to request specific or all instances for a given macro to stop.

2. Use the **Macros: Show Running Macros** command to request a specific instance to stop.

A macro sandbox cannot be forcefully terminated. Instead, a cancellation request is sent via the [`__cancellationToken`](https://code.visualstudio.com/api/references/vscode-api#CancellationToken) variable. To support cancellation, this token must be properly wired into all asynchronous code and macro logic.

If a macro does not respond to the cancellation request, it will continue running. In such cases, you can use the **Developer: Restart Extension Host** command to restart all extensions, or simply restart VS Code to stop the macro. While this is not ideal, it provides a fallback to recover from unresponsive or runaway macros. Note that this approach does not implicitly terminate external processes started by the macro.

### Running a Macro on VS Code Startup

> **Workspace Trust**
> Startup macros are disabled in untrusted workspaces.

Adding startup macros lets you customize your environment from the moment VS Code starts. Since extensions are restarted when opening a new workspace, these customizations can also be scoped per workspace.

Setting up a startup macro is easy:

* In the **Macro Explorer**, use the **Set as Startup Macro** action from your macro's context menu. You can unset it later using **Unset as Startup Macro**.  

* Alternatively, update the `macros.startupMacros` setting directly in the **Settings** editor.

Once you've set up a startup macro, here are a few things to keep in mind:

- Paths may include tokens like `${workspaceFolder}` or `${userHome}` for dynamic resolution.
- The `macros.startupMacros` setting is additive across Global, Workspace, and Workspace Folder scopes.
- Paths pointing to missing or empty files are silently ignored — see the **Macros** log for details.

Startup macros let you define behavior similar to an extension’s `activate` method. For teardown support, use the `__disposables` global variable to ensure proper disposal when the workspace changes or the extension reloads.

### Keybinding a Macro

You can bind the `macros.run` command to a keyboard shortcut, passing as argument the path to the macro to run. This must be configured directly in your `keybindings.json` file, however. See the VS Code [documentation](https://code.visualstudio.com/docs/editor/keybindings#_advanced-customization) for details.

1. Use the **Preferences: Open Keyboard Shortcuts (JSON)** command to open the `keybindings.json` file.

2. Add a keybinding for the `macros.run` command:
    - Pass the path to the macro file as argument
    - `${userhome}` and `${workspaceFolder}` tokens are supported

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
* **Macros: Debug Active File as Macro**: debug current editor as a macro (document will be saved before running).
* **Macro: Debug Macro**: select a macro file to debug. Provides access to configured `macros.sourceDirectories`.

#### Development

* **Macros: Create REPL**: create a REPL terminal to evaluate JavaScript or TypeScript code whose context matches the one used by running macros.

* **Macros: Setup Source Directory for Development**: adds or updates optional files used to improve IntelliSense on macro files. This action is run automatically in the background when saving a `.macro.js` or `.macro.ts` file, provided that `macros.sourceDirectories.verify` is enabled.

#### Manage Macros

* **Macros: Fill File with Template**: initialize an existing file with example macro content.
* **Macros: New Macro**: creates a new file with example macro content.
* **Macros: Show Running Macros**: view and manage running macros.

#### Run Macros

* **Macros: Run Active File as Macro**: run current editor as a macro (document will be saved before running).
* **Macros: Rerun Last Macro**: execute the most recently run macro.
* **Macros: Run Macro**: select a macro to run. Provides access to macros in configured `macros.sourceDirectories` directories.

## Macro Explorer View

The **Macro Explorer** provides a central management view for macros. You can use the **Macros: Show Macro Explorer** command to bring it into view.

* **Macro Library Folders**: configure macro folders, browse their contents, and quickly add, delete, or move macro files around using drag-and-drop.
  * **"Temporary"**: this is a virtual library node that shows all *untitled* macro documents allowing to easily manage in-memory macros.

* **Macros**: edit, run, or debug macros with a once-click.

* **Macro Run Instances**: see active runs. Stop existing ones directly from the view. This is more convenient than the **Macros: Show Running Macros** command but it does not replace it as in-memory runs do not have a representation here.
  - This view shows options used when a given instance was created.

<p align=center>
   <img width="400" alt="Macro Explorer View with diff" src="https://github.com/user-attachments/assets/bc684a9a-6641-455a-aba9-e2df2680e076" />
</p>

## Macro REPL
The REPL is a powerful interactive component that lets you:
- Evaluate JavaScript or TypeScript code in the same context used when running macros
- Inspect the current state of VS Code, including active editors, workspace folders, and extension APIs
- Quickly execute custom actions, test macro logic, or simply run JS/TS code.

You can start a new REPL using the **Macros: Create REPL** from the Command Palette or using the corresponding icon on the **Macros Explorer** view. You can have as many REPLs as you need, each one is fully isolated. 

- Use `.ts` or `.js` to switch between TypeScript and JavaScript modes
- Use `.help` to view all available REPL commands and utilities

<p align=center>
  <img width="400" alt="REPL showing a modal dialog" src="https://github.com/user-attachments/assets/bb03bc5d-a946-4c7d-b714-499ca9d9f378" />
</p>

## Development

### Available Code References

The following references are available from the global context of your macro:
* `vscode`: symbol that provides access to the [VS Code APIs](https://code.visualstudio.com/api/references/vscode-api).
* `macros`: symbol that provides access to this extension's API (see [Macros API](#macros-api)).
* `require`: method that allows load [Node.js libraries](https://nodejs.org/api/all.html). Version is same as your installed VS Code's (see `About` option).
* Other: `atob`, `btoa`, `clearInterval`, `clearTimeout`, `crypto`, `fetch`, `global`, `require`, `setInterval`, `setTimeout`.

### `macros` API

* `log`: Provides access to the **Macros** log output channel, allowing macros to write log entries as needed.

* `macro`: Current macro.
  * `uri`: URI of macro. It is `undefined` if running from an in-memory buffer.

  **Example: Macros API**
  ```javascript
  vscode.window.showInformationMessage(`Hello from ${macros.macro.uri.fsPath}!`);
  macros.log.info('Greeted the world');
  ```

### Predefined Views and View Container

Views such as sidebars and panels cannot be created dynamically—they must first be declared in the extension's `package.json` manifest. This limitation means macros would not be able to define their own views at runtime. To overcome this limitation, the extension predefines a **Macros** view container (with the id: `macrosViews`) with generic `webview` and `treeview` views (with ids `macrosView.webview[1..3]` and `macrosView.treeview[1..3]`). Macros can then claim and use these predefined views to display custom content or UI as needed.

Views are disabled by default via a context value, so to enable them you must enable that context value (see example below).

  **Example: Enabling `macrosView.webview1` view**
  ```
  vscode.commands.executeCommand('setContext', 'macrosView.webview1.show', true);
  ```

Remember to set this back to `false` when macro completes.

**Macro-backed tree view ("Tree View" template)**
<p align=center>
   <img width="400" alt="TreeView example" src="https://github.com/user-attachments/assets/b69089a7-3de1-442f-be7b-eff7bbb547a1" />
</p>

#### Special Tokens

These tokens do not form part of contexts shared when `@macro:persistent` is used as they are different from session to session.
* `__cancellationToken`: a [CancellationToken](https://code.visualstudio.com/api/references/vscode-api#CancellationToken) used by th extension to notify about a stop request. See [Stopping a Macro](#stopping-a-macro).
* `__disposables`: an array for adding [Disposable](https://code.visualstudio.com/api/references/vscode-api#Disposable) instances, which will be automatically disposed of when the macro completes.
* `__runId`: Id of the current macro execution session.
* `__startup`: Whether current macro execution session was triggered during startup.

### Macro Options

An option is added to macro file as a comment in the form `//@macro:«option»[,…«option»]`. The following options are available:
* `persistent`: All invocations of the macro use the same [execution context](https://nodejs.org/api/vm.html#scriptrunincontextcontextifiedobject-options) so global variables persist across runs. Use the `Reset Context` CodeLens to reinitialize context.
* `retained`: An instance of the macro will remain active until explicitly stopped, e.g., using the **Macros: Show Running Macros** command. This removes the need to await `__cancellationToken.onCancellationRequested` (or similar signal) to keep the macro's services and listeners running.
* `singleton`: Only one instance of the macro may run at a time; additional invocations fail.

```javascript
// @macro:singleton
// Example: Hello World!
vscode.window.showInformationMessage("Hello, world!");
```

### Download Definition Files

Any URL in a macro file pointing to a `.d.ts` file will automatically receive a code action, **Download .d.ts**, enabling you to download the file directly to the macro's parent folder. This simplifies adding type definitions to support IntelliSense in your macros.

For GitHub URLs containing `/blob/`, the extension offers special handling by converting them to their raw equivalent. For example: `https://github.com/Microsoft/vscode/blob/main/extensions/git/src/api/git.d.ts` is automatically handled as `https://github.com/Microsoft/vscode/raw/refs/heads/main/extensions/git/src/api/git.d.ts`.

For all other URLs, a standard HTTP GET request is sent to download the file.

### Debugging a Macro

Debugging a macro leverages VS Code's extension debugging [story](https://code.visualstudio.com/api/get-started/your-first-extension#debugging-the-extension) since the macros are run in the context of this extension. This makes the experience a bit awkward as a new VS Code instance is launched, and you need to open the right context (e.g. workspace) in that new instance to debug your macro (vs, for example, launching another VS Code instance and attaching to the current one).
