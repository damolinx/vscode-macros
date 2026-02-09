# Macros

A **macro** is a JavaScript or TypeScript script executed within the context of an extension, with full access to [VS Code extensibility APIs](https://code.visualstudio.com/api/references/vscode-api). Macros let you automate tasks, customize your development workflow, and prototype extension behavior, all without the overhead of building and maintaining a full extension.

Macros run inside Node.js [VM sanbdoxes](https://nodejs.org/api/vm.html#class-vmscript), giving each macro its own isolated data context. This design comes with one practical limitation: macros cannot be forcefully terminated. Instead, they must support cancellation-token semantics, and by extension, use asynchronous workloads, to enable cooperative multitasking.

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

## Creating a Macro

* **Option 1**: From the [Command Palette](https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette), use the **Macros: New Macro** command.
  * Choose a template from the dropdown, or start from scratch.
  * By default, templates targets JavaScript, but you can change this via the **Macros: Template Default Language** setting.

* **Option 2**: From the [Macro Explorer](#macro-explorer-view) view, use the **New Macro** action available on every library.

* **Option 3**: Create a new *untitled* document using your preferred method, for example, using the **Create: New File...** or **Create: New Untitled Text File** commands, or by double-clicking an empty area in the editor bar.
  * Set the editor language to JavaScript or TypeScript.
  * Use the **Macros: Fill File with Template** command, or the **Fill with Snippet** CodeLens to insert template content.

* **Option 4**: Ask the AI‑powered [`@macros` assistant](#chat-participant-vs-code) to create a macro for you.

[↑ Back to top](#table-of-contents)

## Writing Macro Code

A macro is simply a standalone script, whose global context has been initialized with `vscode`, basic Node.JS references and a few macro-specific APIs (see [Development](#development)). No top-level `export`, `await` or `return` statements can be used; the value of the final statement is the script's result. If that value is a `Promise`, then your macro can run asynchronous work. Beyond these constraints, writing a macro feels much like writing regular VS Code extension code.

**Example**: Async _Hello, World!_ macro
```javascript
// @macro:singleton

async function main() {
  const yes = { title: 'Yes' };
  const no = { title: 'No', isCloseAffordance: true };

  let answer;
  do {
    answer = await vscode.window.showInformationMessage(
      'Hello, World! Close this dialog?', { modal: true }, yes, no);
  } while (answer !== yes && !__cancellationToken.isCancellationRequested);
}

main()
```

[↑ Back to top](#table-of-contents)

### Writing Macros using Command IDs

Many macros do not require much code at all, they can be expressed as a sequence of VS Code command ID calls. To implement these, you can use `vscode.commands.executeCommand` or `macros.commands.executeCommands`. Reusing existing commands lets you leverage functionality with minimal code, while still giving you flexibility to add custom logic whenever you need it.

Check the **Command Sequence** [template](#creating-a-macro) as starting point for this style of macros.

**Example**: Command-sequence macro inserting a `TODO` comment at cursor position
```typescript
import { userInfo } from 'os';

// executeCommands takes in a list of command IDs, or [ID, ...args] tuples
macros.commands.executeCommands(
  'editor.action.insertLineBefore',
  ['type', { text: `TODO (${userInfo().username}): <describe task>` }],
  'editor.action.addCommentLine',
  'cursorEnd',
);
```
To support these particular flow, the extension provides command-ID autocomplete on `executeCommand` and `executeCommands` methods. However, argument details are not available through the VS Code API, so you will need to consult the documentation for each command. The [Built-in Commands](https://code.visualstudio.com/api/references/commands) page covers all VS Code commands while commands contributed by extensions _should be_ documented in their respective extension pages.

<p align=center>
<img width="500" alt="Command-Id autocomplete" src="https://github.com/user-attachments/assets/7029063f-25f9-42b1-a421-3f952bf0a262" />
</p>

[↑ Back to top](#table-of-contents)

## Running a Macro

* **Option 1**: From the [Command Palette](https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette), use the **Macros: Run Active Editor as Macro** or **Macros: Run Macro…** commands.

* **Option 2**: On supported editors, i.e. those matching `*.macro.*` or saved in a [macro library](#macro-libraries), use the **Run Active Editor as Macro** button in the editor title bar.

   <p align=center>
      <img width="600" alt=""Macro editor showing the Debug Macro button" src="https://github.com/user-attachments/assets/78acb656-8c1c-4939-823f-72fbd84c13ea" />
   </p>

* **Option 3**: From the [Macro Explorer](#macro-explorer-view) view, use the **Run Macro** button on macros.

* **Option 4**: When using the [`@macros` assistant](#chat-participant-vs-code) to generate macros, you can ask it to run the code as well.

[↑ Back to top](#table-of-contents)

## Stopping a Macro

> A macro **cannot** be forcefully terminated. Instead, it should integrate [`__cancellationToken`](https://code.visualstudio.com/api/references/vscode-api#CancellationToken) into its logic, particularly in loops or asynchronous operations, so it can exit when cancellation is requested.

* **Option 1**: From the [Macro Explorer](#macro-explorer-view) view, use the **Request to Stop** button on macros or the given run instance.

* **Option 2**: From the [Command Palette](https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette), use the **Macros: Show Running Macros** command.
  * This is also available from the status bar item shown when there are active macros instances.

If a macro does not respond to a cancellation request, it will just continue running. You can use the **Developer: Restart Extension Host** command to restart extensions or fully restart your IDE to stop the macro. While it is not ideal, it provides a way to recover from unresponsive macros. This approach does not implicitly terminate external processes started by the macro, however.

[↑ Back to top](#table-of-contents)

## Running a Macro on Startup

> Startup macros are **disabled** in [untrusted workspaces](https://code.visualstudio.com/docs/editing/workspaces/workspace-trust).

Startup macros let you customize your environment immediately when it is launched. Considering that all extensions are restarted whenever you switch workspaces, these macros can be scoped per workspace, giving you tailored setups across different projects. In practice, startup macros behave like lightweight extensions, because they are initialized during the **Macros** extension initialization.

Startup macros are configured through the `macros.startupMacros` setting at the Global, Workspace, or Workspace Folder level. The setting is additive across scopes, but it deduplicates entries, so each startup macro is run only once.

You can configure startup macros in several ways, depending on whether you prefer using settings directly or managing them through the UI:

* **Option 1**: Configure the **Macros: Startup Macros** setting in the [Settings Editor](https://code.visualstudio.com/docs/configure/settings) or `macros.startupMacros` in the `settings.json`.
  * Use the **Macros: Configure Startup Macros** command to jump to this setting quickly.

* **Option 2**: From the [Macro Explorer](#macro-explorer-view) view, select **Set as Startup Macro** or **Remove as Startup Macro** from a macro's context menu.

* **Option 3**: From [Startup Macros](#startup-macros-view) view, you can drag macros from the [Macro Explorer](#macro-explorer-view) into the right settings scope folder or use the **×** button to remove them.

Startup macro paths may include tokens like `${workspaceFolder}` or `${userHome}` for dynamic path resolution. Any paths that do not resolve to existing files are ignored. For more details, check the **Macros** logs.

[↑ Back to top](#table-of-contents)

## Keybinding a Macro

To bind a macro to a keyboard shortcut, you create bindings for the `macros.run` command, passing a single argument that is the path to the macro to run. This must be configured directly in your `keybindings.json` file as the **Keyboard Shortcuts** editor does not allow to define arguments. Check the VS Code [documentation](https://code.visualstudio.com/docs/editor/keybindings#_advanced-customization) for details.

1. Use the **Preferences: Open Keyboard Shortcuts (JSON)** command to open the `keybindings.json` file.

2. Add a keybinding for the `macros.run` command:
    * Add the path to the macro file as argument, with `${userHome}` and `${workspaceFolder}` tokens being supported.

    **Example**: Macro keybinding definition
    ```json
    [
      {
        "key": "Shift+Alt+X",
        "command": "macros.run",
        "args": "${userHome}/macros/references.macro.js",
        "when": "editorTextFocus"
      }
    ]
    ```

[↑ Back to top](#table-of-contents)

# Macro Libraries

A *library* is a folder path registered in the `macros.sourceDirectories` setting. Any JavaScript or TypeScript file **directly** under these folders (no recursive discovery) is considered a macro. Macro libraries are the core of managing your macros, and the [Macro Explorer](#macro-explorer-view) view itself.

The extension adds specific files (e.g. `jsconfig.json`, `global.d.ts`) to library folders to support development. These files are automatically updated when new versions are available. If you want to customize or control when updates happen, disable the `macros.sourceDirectoriesVerification` setting, and use the **Setup Folder for Development** command to run the update on demand.

The virtual **Temporary** library is used to manage all *untitled* documents. Macro documents that have not been saved to the file-system, and that do not belong to a library, will have some features automatically disabled for them.

[↑ Back to top](#table-of-contents)

## Adding a Library

* **Option 1**: From [Macro Explorer](#macro-explorer-view) view title bar, use the **Add Folder…** action.

* **Option 2**: From the [Command Palette](https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette), use the **Macros: Add Folder…** command.

* **Option 3**: Edit the `macros.sourceDirectories` setting. You can use the **Macros: Source Directories** entry in the [Settings Editor](https://code.visualstudio.com/docs/configure/settings).

The `macros.sourceDirectories` setting supports tokens like `${workspaceFolder}` or `${userHome}` for dynamic resolution, e.g. `${workspaceFolder}/.macros`. A missing folder will not lead to errors, just to an empty library node.

[↑ Back to top](#table-of-contents)

## Removing a Library

* **Option 1**: From [Macro Explorer](#macro-explorer-view) view, use the **Delete** action in the context menu of a library.
 * This deletes the registration entry from the `macros.sourceDirectories` setting, it does not delete the folder.

* **Option 2**: Edit the `macros.sourceDirectories` setting. You can use the **Macros: Source Directories** entry in the [Settings Editor](https://code.visualstudio.com/docs/configure/settings).

[↑ Back to top](#table-of-contents)

# User Interface

## Macro Explorer View

The **Macro Explorer** [view](https://code.visualstudio.com/docs/getstarted/userinterface#_views) is your central management hub for [macros](#macros) and [libraries](#macro-libraries).

* **Macro Library Folders**: configure folders, browse their contents, and add, delete, or move macro files around using drag-and-drop.

* **Macros**: edit, run, or debug macros with a single  click.

* **Macro Run Instances**: see active runs and stop existing ones from the view.

  * **View Running Version**: When a macro is run, the extension captures a snapshot of its source code. This action uses that snapshot to diff against the code's current version. This is particularly useful during active macro development, when multiple revisions may be running. The version number comes from the corresponding [TextDocument.version](https://code.visualstudio.com/api/references/vscode-api#TextDocument) value.

The **Macros: Show Macro Explorer** command opens the view and brings it into focus.

<p align=center>
   <img width="600" alt="Macro Explorer View with diff" src="https://github.com/user-attachments/assets/bc684a9a-6641-455a-aba9-e2df2680e076" />
</p>

[↑ Back to top](#table-of-contents)

## Startup Macros View

The **Startup Macros** [view](https://code.visualstudio.com/docs/getstarted/userinterface#_views) gives you a dedicated place to manage [startup macros](#running-a-macro-on-startup). It exposes all configuration locations where startup macros may be defined, making it easy to understand why a macro is being executed. You can add or remove items directly from each location using context actions or by simply dragging and dropping them into the desired section.

The **Macros: Show Startup Macros** command can be used to bring it into view.

[↑ Back to top](#table-of-contents)

## Macro REPL

The REPL is one of the more powerful out-of-box tools offered by the extension. It lets you evaluate JavaScript or TypeScript code interactively, in a context set up just like any macro, without resorting to disconnected experiences like the **Developer Tools** console.

* **Debug**: Easily inspect the current context, evaluate any statement, or `.load` any macro into context.

* **Develop**: Build full logic step by step, then `.save` your history to a macro file.

* **Experiment**: Run any JavaScript or TypeScript snippet and see the result instantly.

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
  <img width="700" alt="Macro REPL demo" src="https://github.com/user-attachments/assets/29502571-a18a-41f2-a2b7-7e50f9c7496d" />
</p>

[↑ Back to top](#table-of-contents)

## AI Assistance

Macro development can be assisted by AI in two different ways, depending on whether you are using VS Code or Cursor. Each environment exposes a different AI surface, so the extension provides different experiences.

### Chat Participant (VS Code)

In VS Code, the extension provides the `@macros` [chat particpant](https://code.visualstudio.com/api/extension-guides/ai/chat). This assistant is a domain expert in macro development and understands the constraints of the macro runtime, such as avoiding export, not using top‑level await, selecting the correct language, and respecting macro directives.

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

| Command | Description |
|--------|-------------|
| **Debug Active File as Macro** | Debug the current editor as a macro (the document will be saved before running). |
| **Debug Macro** | Select a macro file to debug. |

### Development

| Command | Description |
|--------|-------------|
| **Create REPL** | Create a REPL terminal to evaluate JavaScript or TypeScript code in the same context used by running macros. |
| **Setup Folder for Development** | Add or update optional files that improve IntelliSense for macro files. This runs automatically when saving a `.macro.js` or `.macro.ts` file if `macros.sourceDirectories.verify` is enabled. |

### Manage Macros

| Command | Description |
|--------|-------------|
| **Fill File with Template** | Initialize an existing file with example macro content. |
| **New Macro** | Create a new file pre-filled with example macro content. |
| **Show Running Macros** | View and manage currently running macros. |

### Run Macros

| Command | Description |
|--------|-------------|
| **Run Active File as Macro** | Run the current editor as a macro (the document will be saved before running). |
| **Rerun Last Macro** | Execute the most recently run macro. |
| **Run Macro…** | Select a macro to run. Provides access to macros in configured `macros.sourceDirectories`. |

[↑ Back to top](#table-of-contents)

## IntelliSense

JavaScript and TypeScript macro files get [IntelliSense](https://code.visualstudio.com/docs/editing/intellisense) support, if they have been saved to a [macro library](#macro-libraries). The features requires the library to be fully set up for development which means a `global.d.ts` and `jsconfig.json` have been added to it. The extension verifies these files the first time a file from a library is opened in a session and updates them whenever newer versions are available. This update-logic means it is currently not recommended to customize them.

> ⚠️ Untitled documents will not show proper IntelliSense until saved to disk, because a `global.d.ts` file is needed to describe the global context. This is particular visible in TypeScript editors, which will incorrectly report several missing references.

There is custom autocomplete for command IDs provided to `vscode.commands.executeCommand`, as well as for `@macros` [options](#macro-options).

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

* `commands`: Namespace providing command APIs.

  * `executeCommands(...cmds: (string | [id: string, ...args: any[]])[]): Promise<void>`:  Executes one or more commands in sequence, defined as the command ID or a command ID and args tuple. Returns a promise that resolves after all commands have completed.

* `window`: Namespace providing window and UI APIs.

  * `getTreeViewId(id: string): string | undefined`: Claims an available tree view ID for the given macro run. Returns `undefined` if none are available.

  * `getWebviewId(id: string): string | undefined`: Claims an available webview ID for the given macro run. Returns `undefined` if none are available.

  * `releaseTreeViewId(id: string): boolean`: Releases a previously claimed tree view ID. Returns `true` if successful.

  * `releaseWebviewId(id: string): boolean`: Releases a previously claimed webview ID. Returns `true` if successful.

[↑ Back to top](#table-of-contents)

### Special Variables

  These tokens do not form part of contexts shared when `@macro:persistent` is used as they are different from session to session.
  * `__cancellationToken`: a [CancellationToken](https://code.visualstudio.com/api/references/vscode-api#CancellationToken) used by the extension to notify about a stop request. See [Stopping a Macro](#stopping-a-macro).
  * `__disposables`: an array for adding [Disposable](https://code.visualstudio.com/api/references/vscode-api#Disposable) instances, which will be automatically disposed of when the macro completes.
  * `__runId`: Id of the current macro execution session.
  * `__startup`: Whether current macro execution session was triggered during startup.

[↑ Back to top](#table-of-contents)

## Predefined Views and View Container

Views such as sidebars and panels cannot be created dynamically; they must be declared in the extension's `package.json` manifest. To work around this limitation, the extension predefines a **Macros** view container (`macrosViews`) that includes a fixed set of generic `treeview` and `webview` views.

**Example**: Macro-backed tree view
<p align=center>
   <img width="600" alt="TreeView example" src="https://github.com/user-attachments/assets/b69089a7-3de1-442f-be7b-eff7bbb547a1" />
</p>

[↑ Back to top](#table-of-contents)

## Available View IDs

The following views are statically registered and available for use:

* `macrosView.treeview1` through `macrosView.treeview5` for tree views
* `macrosView.webview1` through `macrosView.webview5` for webviews

Avoid hardcoding view IDs unless necessary, there is no enforcement mechanism, so conflicts between macros may occur. Additionally, the predefined ID pool may expand in the future, meaning macros with hardcoded values could end up competing for a limited subset.

[↑ Back to top](#table-of-contents)

### Dynamic View ID Claiming

While macros can hardcode and use these IDs directly, this approach becomes fragile as macro libraries grow and multiple macros may attempt to use the same view, causing conflicts.

To avoid this, macros can dynamically claim an available view ID using the following APIs:

  ```typescript
  macros.window.getTreeViewId(): string | undefined
  macros.window.getWebviewId(): string | undefined
  ```

If no view ID is available, these methods return `undefined` so make sure to account for such case.

Once a macro is finished using a view, it can release the ID explicitly using the following APIs:

  ```typescript
  macros.window.releaseTreeViewId(id: string): boolean
  macros.window.releaseWebviewId(id: string): boolean
  ```

Claimed IDs are automatically released when the macro completes **only** for non‑persistent and non‑retained macros. Persistent or retained macros must explicitly call the appropriate `release…Id` method.

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
* `persistent`: All invocations of the macro use the same [execution context](https://nodejs.org/api/vm.html#scriptrunincontextcontextifiedobject-options) so global variables persist across runs. Use the **Reset Context** CodeLens to reinitialize context.
* `retained`: An instance of the macro will remain active until explicitly stopped, e.g., using the **Macros: Show Running Macros** command. This removes the need to await `__cancellationToken.onCancellationRequested` (or similar signal) to keep the macro's services and listeners running.
* `singleton`: Only one instance of the macro may run at a time; additional invocations fail.

**Example**: Using the `singleton` option
```javascript
// @macro:singleton
vscode.window.showInformationMessage('There can only be one!');
```

[↑ Back to top](#table-of-contents)

## Download Definition Files

Any URL-like string in a macro file pointing to a `.d.ts` file will automatically receive a code action, **Download .d.ts**, enabling you to download the file directly to the macro's parent folder. This simplifies adding type definitions to support [IntelliSense](#intellisense) in your macros.

GitHub URLs containing matching `*/blob/*` are automatically converted to their `*/raw/*` equivalent. For example: `https://github.com/Microsoft/vscode/blob/main/extensions/git/src/api/git.d.ts` is automatically handled as `https://github.com/Microsoft/vscode/raw/refs/heads/main/extensions/git/src/api/git.d.ts`. Files are downloaded using a standard HTTP GET request.

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
* Use the [Developer: Set Log Level...](https://code.visualstudio.com/updates/v1_73#_setting-log-level-per-output-channel) command to control the granularity of logs for the **Macros** extension. This is a global setting for the extension and all macro instances.
* Use the **Output: Show Output Channels...** command to bring the **Macros** output channel into view, if needed.

[↑ Back to top](#table-of-contents)

### REPL
The [Macro REPL](#macro-repl) is a great way to verify your logic step-by-step, or to verify the current context as the extension sees it.

[↑ Back to top](#table-of-contents)
