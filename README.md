# Macros

A **macro** is a JavaScript or TypeScript script executed within the context of a extension, given it full access to the [VS Code extensibility APIs](https://code.visualstudio.com/api/references/vscode-api). Macros let you automate tasks, customize your development workflow, and prototype extension behavior—without the overhead of building and maintaining a full extension thanks to their lightweight, standalone-file design.

Under the hood, macros run inside [Node.js VM sandboxes](https://nodejs.org/api/vm.html#class-vmscript). Each sandbox provides its own isolated data context, yet all macros still run within a single shared process. Because of this model, macro executions cannot be forcefully terminated; instead, cancellation tokens offer a cooperative way to detect shutdown requests and exit gracefully.

TypeScript support is transparent, with transpilation happening on demand, providing a seamless experience.

<p align=center>
  <img width="800" alt="VS Code with Macro Explorer and Startup Macros views, as well as a macro editor open" src="https://github.com/user-attachments/assets/f075d80b-a21f-4201-b7c7-1ce3b2bf7707" />
</p>

## Table of Contents
* [Getting Started](#getting-started)
  * [Creating a Macro](#creating-a-macro)
  * [Writing Macro Code](#writing-macro-code)
  * [Running a Macro](#running-a-macro)
  * [Stopping a Macro](#stopping-a-macro)
  * [Running a Macro on Startup](#running-a-macro-on-startup)
  * [Keybinding a Macro](#keybinding-a-macro)
* [Macro Libraries](#macro-libraries)
  * [Adding a Library](#adding-a-library)
  * [Removing a Library](#removing-a-library)
* [User Interface](#user-interface)
  * [Macro Explorer View](#macro-explorer-view)
  * [Startup Macros View](#startup-macros-view)
  * [Macro REPL](#macro-repl)
  * [AI Assistance](#ai-assistance)
    * [Chat Participant (VS Code)](#chat-participant-vs-code)
    * [Cursor Rules (Cursor)](#cursor-rules-cursor)
  * [Commands](#commands)
    * [Debugging](#debugging)
    * [Development](#development)
    * [Manage Macros](#manage-macros)
    * [Run Macros](#run-macros)
   * [IntelliSense](#intellisense)
* [Development](#development-1)
  * [Available Code References](#available-code-references)
  * [`macros` API](#macros-api)
    * [Special Variables](#special-variables)
  * [Predefined Views and View Container](#predefined-views-and-view-container)
  * [`@macro` Options](#macro-options)
  * [Download Definition Files](#download-definition-files)
  * [Debugging a Macro](#debugging-a-macro)

# Getting Started

Any JavaScript or TypeScript document can be treated as a macro, even if not saved to disk—i.e. *untitled* documents. Once saved, certain tools—in particular UI ones such as CodeLens actions or custom IntelliSense—are enabled only if the file is either in a registered [macro library](#macro-libraries) or if its name matches the `*.macro.*` pattern. This restriction prevents confusion when working in workspaces containing JavaScript or TypeScript files.

## Creating a Macro

* **Option 1**: Use the **Macros: New Macro** command to create a new macro document.
  * You will be prompted to choose from a list of templates to populate your macro.
  * By default, this command uses the JavaScript templates but you can change this behavior via the **Macros: Template Default Language** setting.

* **Option 2**: Use the **New Macro** action in the **Temporary** node in the [Macro Explorer](#macro-explorer-view) view.

* **Option 3**: Create a new *untitled* document using your preferred method—for example, via the **Create: New File...** or **Create: New Untitled Text File** commands, or by double-clicking an empty area in the editor bar.
  * Change the editor language to JavaScript or TypeScript.
  * Use the **Macros: Fill File with Template** command, or the **Fill with Snippet** CodeLens to add content from a template. The command respects the language the editor is set to.

* **Option 4**: Ask the [`@macros` assistant](#chat-participant-vs-code) to create a macro for you.

[↑ Back to top](#table-of-contents)

## Writing Macro Code

The **Macros: Fill File with Template** command, or the **Fill with Snippet** CodeLens on empty documents, can jumpstart your development by adding sample code to the currenr editor. To generate custom code, however, you can ask the [`@macros` assistant](#chat-participant-vs-code) for help.

You can write your own code, of course—see [Development](#development) for available APIs. When doing so, keep these basic rules in mind:
* Macros are standalone JavaScript or TypeScript files executed in a Node.js sandbox.
* Use CommonJS syntax (JavaScript) and avoid `export`, top-level `await` or `return` statements.
* The last statement in your script should result in a `Promise` when running async work, but result is otherwise ignored.
* Macros have access to globals like `vscode` and `macros`, and they can import Node.js libraries, but there is no defined way to include arbitrary libraries.
* Macros cannot be forcefully stopped. They must either complete on their own or respect cancellation request received via the `__cancellationToken` token.

**Example**: Async _Hello, World!_ macro
```javascript
// @macro:singleton

async function main() {
  const yes = { title: 'Yes' };
  const no = { title: 'No', isCloseAffordance: true };

  let answer;
  do {
    answer = await vscode.window.showInformationMessage(
      `Hello, World! Close this dialog?`, { modal: true }, yes, no);
  } while (answer !== yes && !__cancellationToken.isCancellationRequested);
}

main()
```

### Writing a Command-Sequence macro
Many automations don’t require much code at all, they can be written as a simple list of VS Code command IDs executed in order, just like a classic editor macro. The **Command Sequence** [template](#creating-a-macro) can help you get started, and if you need additional logic, or API access, you can easily extend it to match your needs.

**Example**: _Add a TODO_ macro defined as a sequence of commands
```typescript
import * as os from 'os';

async function runCommands(cmds: { cmd: string, args?: any[] }[]) {
  for (const { cmd, args = [] } of cmds) {
    await vscode.commands.executeCommand(cmd, ...args);
  }
}

// Insert a TODO comment at current cursor line
runCommands([
  { cmd: "editor.action.insertLineBefore" },
  { cmd: "type", args: [{ text: `TODO (${os.userInfo().username}): <describe task>` }] },
  { cmd: "editor.action.addCommentLine" },
  { cmd: "cursorEnd" },
]);
```

The [Built-in Commands](https://code.visualstudio.com/api/references/commands) page describes the commands that ship with VS Code, but installed extensions can contribute their own. For those, you will need to refer to the extension’s documentation for the expected arguments.

[↑ Back to top](#table-of-contents)

## Running a Macro

* **Option 1**: From the [Command Palette](https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette), use the **Macros: Run Active Editor as Macro** or **Macros: Run Macro…** commands.

* **Option 2**: On supported editors, i.e. those matching `*.macro.*` or saved in a [macro library](#macro-libraries), use the equivalent **Run Active Editor as Macro** button in the editor title bar.

   <p align=center>
      <img width="600" alt=""Macro editor showing the Debug Macro button" src="https://github.com/user-attachments/assets/78acb656-8c1c-4939-823f-72fbd84c13ea" />
   </p>

* **Option 3**: Use the **Run Macro** button on macro nodes in the [Macro Explorer](#macro-explorer-view) view.

* **Option 4**: If you asked the [`@macros` assistant](#chat-participant-vs-code) to generate macro code, ask it to run it for you.

[↑ Back to top](#table-of-contents)

## Stopping a Macro

> ℹ️ A macro **cannot** be forcefully terminated. Instead, they should integrate [`__cancellationToken`](https://code.visualstudio.com/api/references/vscode-api#CancellationToken) into their asynchronous operations and logic — such as loops or other long‑running tasks — so they can exit cooperatively when cancellation is requested.

* **Option 1**: Use **Request to Stop** button on the macro node (all running instances) or the given run instance from the [Macro Explorer](#macro-explorer-view) view to stop a macro.

* **Option 2**: Use the **Macros: Show Running Macros** command to select a specific instance to stop.
  * This is also available from the status bar item shown when there are active macros instances.

If a macro does not respond to a cancellation request, it will continue running. You can use the **Developer: Restart Extension Host** command to restart all extensions, or fully restart your IDE to stop the macro. While this is not ideal, it provides a way to recover from unresponsive macros. This approach does not implicitly terminate external processes started by the macro, however.

[↑ Back to top](#table-of-contents)

## Running a Macro on Startup

> ⚠️ Startup macros are **disabled** in [untrusted workspaces](https://code.visualstudio.com/docs/editing/workspaces/workspace-trust).

Startup macros let you customize your environment immediately when it launches. Considering that extensions restart whenever you switch workspaces, these macros can be scoped per workspace, giving you tailored setups across different projects. In practice, startup macros behave much like lightweight extensions, because they are initialized curing the **Macros** extension initialization.

Startup macros are configured through the `macros.startupMacros` setting at the Global, Workspace, or Workspace Folder level. The setting is additive across scopes, and the system deduplicates entries so each startup macro is run only once.

You can configure startup macros in several ways, depending on whether you prefer using settings directly or managing them through the UI:

* **Option 1**: Configure the **Macros: Startup Macros** setting in the [Settings Editor](https://code.visualstudio.com/docs/configure/settings) or `macros.startupMacros` in the `settings.json`. Use the **Macros: Configure Startup Macros** command to jump there quickly.

* **Option 2**: Using the [Macro Explorer](#macro-explorer-view) view, select **Set as Startup Macro** or **Remove as Startup Macro** from a macro's context menu.

* **Option 3**: Using the dedicated [Startup Macros](#startup-macros-view), you can drag macros from the [Macro Explorer](#macro-explorer-view) into the right settings scope folder, or use the **×** button to remove it.

Startup macro paths may include tokens like `${workspaceFolder}` or `${userHome}` for dynamic path resolution. Any paths that do not resolve to existing files are ignored. For more detail, check the **Macros** log output channel for diagnostic logs.

[↑ Back to top](#table-of-contents)

## Keybinding a Macro

To bind a macro to a keyboard shortcut, all you need to do is keybind the `macros.run` command, passing a single argument that is the path to the macro to run. This must be configured directly in your `keybindings.json` file as the **Keyboard Shortcuts** editor does not allow to define arguments. Check the VS Code [documentation](https://code.visualstudio.com/docs/editor/keybindings#_advanced-customization) for details.

1. Use the **Preferences: Open Keyboard Shortcuts (JSON)** command to open the `keybindings.json` file.

2. Add a keybinding for the `macros.run` command:
    * Add the path to the macro file as argument, with `${userhome}` and `${workspaceFolder}` tokens being supported.

    **Example**: Macro keybinding definition
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

[↑ Back to top](#table-of-contents)

# Macro Libraries

A *macro library* is simply a folder registered in the `macros.sourceDirectories` setting. Any JavaScript or TypeScript file directly under these folders (no recursive discovery) is considered a macro. Additionally, the extension automatically adds files (e.g. `jsconfig.json`, `global.d.ts`) to support development.

Macro libraries are the core of managing your macros, and the [Macro Explorer](#macro-explorer-view) view itself, with a *virtual* **Temporary** library used to manage all *untitled* documents.

When a macro file is saved to disk, and it does not belong to a registered library, it will cause for some features to be automatically disabled for them.

[↑ Back to top](#table-of-contents)

## Adding a Library

* **Option 1**: Use the **Add Library Folder** action from [Macro Explorer](#macro-explorer-view) view title bar.

* **Option 2**: Use the **Macros: Add Library Folder** command the [Command Palette](https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette).

* **Option 3**: Edit the `macros.sourceDirectories` setting. You can use the **Macros: Source Directories** entry in the [Settings Editor](https://code.visualstudio.com/docs/configure/settings).

The `macros.sourceDirectories` setting supports using tokens like `${workspaceFolder}` or `${userHome}` for dynamic resolution, e.g. `${workspaceFolder}/.macros` if you use that pattern to save macros in your workspaces. A missing folder won't lead to error, just to an empty library node. The latter behavior allows to easily create later the folder in the file-system by just adding a macro.

[↑ Back to top](#table-of-contents)

## Removing a Library

* **Option 1**: Use the **Delete** action from the context menu of the given library from [Macro Explorer](#macro-explorer-view) view.
 * This only deletes the relevant entry from the `macros.sourceDirectories` setting, it does not delete the folder.

* **Option 2**: Edit the `macros.sourceDirectories` setting. You can use the **Macros: Source Directories** entry in the [Settings Editor](https://code.visualstudio.com/docs/configure/settings).

[↑ Back to top](#table-of-contents)

# User Interface

## Macro Explorer View

The **Macro Explorer** [view](https://code.visualstudio.com/docs/getstarted/userinterface#_views) provides a central management hub for all macros and [macro libraries](#macro-libraries) actions.

* **Macro Library Folders**: configure macro folders, browse their contents, and quickly add, delete, or move macro files around using drag-and-drop.
  * **Temporary**: this is a virtual library node that shows all *untitled* macro documents allowing to easily manage in-memory macros (i.e. `untitled` documents).

* **Macros**: edit, run, or debug macros with one click.

* **Macro Run Instances**: see active runs and stop existing ones from the view.

The **Macros: Show Macro Explorer** command can be used to bring it into view.
<p align=center>
   <img width="600" alt="Macro Explorer View with diff" src="https://github.com/user-attachments/assets/bc684a9a-6641-455a-aba9-e2df2680e076" />
</p>

[↑ Back to top](#table-of-contents)

## Startup Macros View

The **Startup Macros** [view](https://code.visualstudio.com/docs/getstarted/userinterface#_views) gives you a dedicated place to manage [startup macros](#running-a-macro-on-startup). It exposes all configuration locations where startup macros may be defined, making it easy to understand why a macro is being executed. You can add or remove items directly from each location using context actions or by simply dragging and dropping them into the desired section.

The **Macros: Show Startup Macros** command can be used to bring it into view.

[↑ Back to top](#table-of-contents)

## Macro REPL

The  REPL is one of the more powerful out-of-box tools offered by the extension. It lets you evaluate JavaScript or TypeScript code interactively, in a context set up just like any macro, without resorting to disconnected experiences like the **Developer Tools** console.

* **Debug**: Easily inspect the current context, evaluate any statement, or `.load` any macro into context.

* **Develop**: Build full logic step by step, then `.save` your history to a macro file.

* **Experiment**:  Run any JavaScript or TypeScript snippet and see the result instantly.

You can start a new macros REPL using either of the following:

* **Option 1**: Run the **Macros: Create REPL** command from the [Command Palette](https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette).

* **Option 2**: Click the **Create REPL** button in the [Macro Explorer](#macro-explorer-view) view title bar.

You can have as many REPL instances as you need, with each one being run in full isolation.

Some useful commands:
* `.ts`, `.js`: Switch between TypeScript and JavaScript modes
* `.load`, `.save`: Load a macro file or save your command history to macro editor
* `.help`: View all available REPL commands

**Example**: REPL instance demonstrating object inspection and result preview
<p align=center>
  <img width="700" alt="Macro REPL demo"  src="https://github.com/user-attachments/assets/29502571-a18a-41f2-a2b7-7e50f9c7496d" />
</p>

[↑ Back to top](#table-of-contents)

## AI Assistance

Macro development can be assisted by AI in two different ways, depending on whether you are using VS Code or Cursor. Each environment exposes a different AI surface, so the extension provides different experiences.

### Chat Participant (VS Code)

In VS Code, the extension provides the `@macros` [chat particpant](https://code.visualstudio.com/api/extension-guides/ai/chat). This assistant is a domain expert in macro development and understands the constraints of the macro runtime — such as avoiding export, not using top‑level await, selecting the correct language, and respecting macro directives.

The chat participant can also save and execute macros directly from a prompt, enabling end‑to‑end workflows. Results vary by model size: larger models like *Claude Sonnet 4.5* and *GPT‑5* perform reliably, while lighter models may struggle with generation.

**Example**: Ask `@macros` to dump all diagnostics for further analysis.

<p align=center>
<img width="700" height="327" alt="@macros created a macro to dump diagnostics and ran it" src="https://github.com/user-attachments/assets/3a5f202d-c37c-4b9b-b32e-d2d7183041e1" />
</p>

### Cursor Rules (Cursor)

Cursor does not support chat participants. Instead, Cursor's agent is configured through rule files stored under the `.cursor/` directory. The extension provides a **Macros: Create Cursor Rules** command which generates a Markdown rules file that you can save as: `.cursor/rules/macro-rules.md`.

The rules file encodes the macro specification, constraints, and behavioral guidelines that Cursor's agent should follow when generating or refining macro code.

[↑ Back to top](#table-of-contents)

## Commands

### Debugging

See [Debugging a Macro](#debugging-a-macro) for additional information:
* **Macros: Debug Active File as Macro**: debug current editor as a macro (document will be saved before running).
* **Macro: Debug Macro**: select a macro file to debug. Provides access to configured `macros.sourceDirectories`.

[↑ Back to top](#table-of-contents)

### Development

* **Macros: Create REPL**: create a REPL terminal to evaluate JavaScript or TypeScript code whose context matches the one used by running macros.

* **Macros: Setup Source Directory for Development**: adds or updates optional files used to improve IntelliSense on macro files. This action is run automatically in the background when saving a `.macro.js` or `.macro.ts` file, provided that `macros.sourceDirectories.verify` is enabled.

[↑ Back to top](#table-of-contents)

### Manage Macros

* **Macros: Fill File with Template**: initialize an existing file with example macro content.
* **Macros: New Macro**: creates a new file with example macro content.
* **Macros: Show Running Macros**: view and manage running macros.

[↑ Back to top](#table-of-contents)

### Run Macros

* **Macros: Run Active File as Macro**: run current editor as a macro (document will be saved before running).
* **Macros: Rerun Last Macro**: execute the most recently run macro.
* **Macros: Run Macro…**: select a macro to run. Provides access to macros in configured `macros.sourceDirectories` directories.

[↑ Back to top](#table-of-contents)

### IntelliSense

JavaScript and TypeScript macro files get [IntelliSense](https://code.visualstudio.com/docs/editing/intellisense) support, as long as files have been saved to a [macro library](#macro-libraries). The features can be made more accurate when the library is fully setup for development which means `global.d.ts` and `jsconfig.json` have been added to it. The extension verifies these files them when an editor for a file a library is opened for the first time in a given session and updates them when new versions are available.

> ⚠️Automatic updating of `global.d.ts` and `jsconfig.json` means it is not recommended to customize them.

> ⚠️ Untitled documents will not show proper IntelliSense until saved to disk as a `global.d.ts` is needed to describe the `global` context.

Some custom features that the extension provides is autocomplete on `vscode.commands.executeCommand` showing all currently registered command IDs in your box, or on `@macros` [options](#macro-options).

[↑ Back to top](#table-of-contents)

# Development

## Available Code References

The following references are available from the global context of your macro:
* `vscode`: symbol that provides access to the [VS Code APIs](https://code.visualstudio.com/api/references/vscode-api).
* `macros`: symbol that provides access to this extension's API (see [Macros API](#macros-api)).
* `require`: method that allows load [Node.js libraries](https://nodejs.org/api/all.html). Version is same as your installed IDE (see `About` option).
* Other: `atob`, `btoa`, `clearInterval`, `clearTimeout`, `crypto`, `fetch`, `global`, `require`, `setInterval`, `setTimeout`, `structuredClone`.

[↑ Back to top](#table-of-contents)

## `macros` API

* `extensionContext`: Provides access to the [extension context](https://code.visualstudio.com/api/references/vscode-api#ExtensionContext) instance.

* `log`: Provides access to the **Macros** log output channel, allowing macros to write log entries as needed.

* `macro`: Current macro.
  * `uri`: URI of the current macro instance. It can be `undefined` if running from an in-memory buffer.

* `window`: Provides access to UI-related APIs.
  Provides access to UI-related APIs for managing predefined macro views.

  * `getTreeViewId(id: string): string | undefined`: Claims an available `treeview` ID for the given macro run. Returns `undefined` if none are available.

  * `getWebviewId(id: string): string | undefined`: Claims an available `webview` ID for the given macro run. Returns `undefined` if none are available.

  * `releaseTreeViewId(id: string): boolean`: Releases a previously claimed `treeview` ID. Returns `true` if successful.

  * `releaseWebviewId(id: string): boolean`: Releases a previously claimed `webview` ID. Returns `true` if successful.

[↑ Back to top](#table-of-contents)

### Special Variables

  These tokens do not form part of contexts shared when `@macro:persistent` is used as they are different from session to session.
  * `__cancellationToken`: a [CancellationToken](https://code.visualstudio.com/api/references/vscode-api#CancellationToken) used by the extension to notify about a stop request. See [Stopping a Macro](#stopping-a-macro).
  * `__disposables`: an array for adding [Disposable](https://code.visualstudio.com/api/references/vscode-api#Disposable) instances, which will be automatically disposed of when the macro completes.
  * `__runId`: Id of the current macro execution session.
  * `__startup`: Whether current macro execution session was triggered during startup.

[↑ Back to top](#table-of-contents)

## Predefined Views and View Container

Views such as sidebars and panels cannot be created dynamically—they must be declared in the extension's `package.json` manifest. To work around this limitation, the extension predefines a **Macros** view container (`macrosViews`) that includes a fixed set of generic `treeview` and `webview` views.

**Macro-backed tree view ("Tree View" template)**
<p align=center>
   <img width="600" alt="TreeView example" src="https://github.com/user-attachments/assets/b69089a7-3de1-442f-be7b-eff7bbb547a1" />
</p>

[↑ Back to top](#table-of-contents)

## Available View IDs

The following views are statically registered and available for use:

* `macrosView.treeview1` through `macrosView.treeview5` — for `treeview`-based UIs
* `macrosView.webview1` through `macrosView.webview5` — for `webview`-based UIs

Avoid hardcoding view IDs unless necessary—there's no enforcement mechanism, so conflicts between macros may occur. Additionally, the predefined ID pool may expand in the future, meaning macros with hardcoded values could end up competing for a limited subset.

[↑ Back to top](#table-of-contents)

### Dynamic View ID Claiming

While macros can hardcode and use these IDs directly, this approach becomes fragile as macro libraries grow—multiple macros may attempt to use the same view, causing conflicts.

To avoid this, macros can dynamically claim an available view ID using the following APIs:

  ```ts
  macros.window.getTreeViewId(): string | undefined
  macros.window.getWebviewId(): string | undefined
  ```

If no view ID is available, these methods return `undefined` so make sure to account for such case.

Once a macro is finished using a view, it can release the ID explicitly using the following APIs:

  ```ts
  macros.window.releaseTreeViewId(id: string): boolean
  macros.window.releaseWebviewId(id: string): boolean
  ```

Alternatively, all claimed IDs are automatically released when the macro completes. This includes REPL sessions, as each session is equivalent to a macro.

[↑ Back to top](#table-of-contents)

### Enabling Views

Views are disabled by default. After claiming an ID, you must enable the corresponding view using a context key (notice the ID is suffixed with `.show`):

  **Example**: Showing a view
  ```
  const viewId = macros.window.getTreeViewId();
  ...
  vscode.commands.executeCommand('setContext', `${viewId}.show`, true);
  ```

Be sure to reset the context when the macro finishes, there is no automatic tracking and any leftover context values will be effective until the IDE is restarted.

  **Example**: Hiding a view
  ```
  const viewId = macros.window.getWebviewId();
  ...
  vscode.commands.executeCommand('setContext', `${viewId}.show`, false);
  ```

[↑ Back to top](#table-of-contents)

## `@macro` Options

A `@macro` option defines runtime behaviors for your macro. It is added to macro file as a comment using this `//@macro:«option»[,…«option»]` syntax.

The following options are available:
* `persistent`: All invocations of the macro use the same [execution context](https://nodejs.org/api/vm.html#scriptrunincontextcontextifiedobject-options) so global variables persist across runs. Use the `Reset Context` CodeLens to reinitialize context.
* `retained`: An instance of the macro will remain active until explicitly stopped, e.g., using the **Macros: Show Running Macros** command. This removes the need to await `__cancellationToken.onCancellationRequested` (or similar signal) to keep the macro's services and listeners running.
* `singleton`: Only one instance of the macro may run at a time; additional invocations fail.

**Example**: Using the `singleton` option
```javascript
// @macro:singleton
vscode.window.showInformationMessage("“There can only be one!");
```

[↑ Back to top](#table-of-contents)

## Download Definition Files

Any URL-like string in a macro file pointing to a `.d.ts` file will automatically receive a code action, **Download .d.ts**, enabling you to download the file directly to the macro's parent folder. This simplifies adding type definitions to support [IntelliSense](#intellisense) in your macros.

GitHub URLs containing matching `*/blob/*` are automatically converted to their `raw` equivalent. For example: `https://github.com/Microsoft/vscode/blob/main/extensions/git/src/api/git.d.ts` is automatically handled as `https://github.com/Microsoft/vscode/raw/refs/heads/main/extensions/git/src/api/git.d.ts`.

All URLs use a standard HTTP GET to download the file, which is not customizable at this time.

[↑ Back to top](#table-of-contents)

## Debugging a Macro

### Debugger
This follows the [debugging workflow for extensions](https://code.visualstudio.com/api/get-started/your-first-extension#debugging-the-extension): the VS Code instance to debug from launches a second **Extension Development Host** instance, it is on the latter where you run the macro is run, but it is on the former where the debugging happens. The **Macros: Debug Macro** command sets up this workflow.

There are a few things to keep in mind:

* You cannot open a given workspace more than once, even from different IDE instances. This means you might need to close and reopen the workspace for your macro scenario in the **Extension Development Host** instance.

* The macro you start with **Debug Macro** is not run automatically in the new instance, unless it is a startup macro, because the execution / repro context is unknown.

Currently, there is no clear path to streamline this process. Ideally, the second instance would debug macros running in the first one, allowing you to debug macros without disturbing the current setup.

[↑ Back to top](#table-of-contents)

### Logs
The [`macros.log` API](#macros-api) writes messages directly to the **Macros** output channel. Every log entry is prefixed with the run-id specific to the instance of your macro you are logging from.
* Use the [Developer: Set Log Level...](https://code.visualstudio.com/updates/v1_73#_setting-log-level-per-output-channel) command to control the granurality of logs for the **Macros** extension. This a global setting for the extension and all macro instances.
* Use the **Output: Show Output Channels...** command to bring the **Macros** output channel into view, if needed.

[↑ Back to top](#table-of-contents)

### REPL
The [Macro REPL](#macro-repl) is a great way to verify your logic step-by-step, or to verify the current context as the extension sees it.

[↑ Back to top](#table-of-contents)
