# Macros for VS Code

A **macro** is a JavaScript or TypeScript script executed within the context of a VS Code extension, with full access to the [VS Code extensibility APIs](https://code.visualstudio.com/api/references/vscode-api). Macros let you automate tasks, customize your development workflow, or prototype extension behavior—all without the overhead of building and maintaining a full extension. 

Under the hood, macros run inside [Node.js VM sandboxes](https://nodejs.org/api/vm.html#class-vmscript). Each macro executes in its own isolated data context but shares the same process. A limitation of this model is that macros can't be forcefully terminated; instead, cancellation tokens provide a cooperative mechanism for graceful shutdown.

TypeScript transpilation is transparent and performed on-demand, designed to provide a low‑friction experience.

<p align=center>
  <img width="600" alt="VS Code with Macro Explorer view and a macro editor open" src="https://github.com/user-attachments/assets/34637385-782a-4578-863e-35d8e3caa2c7" />
</p>

## Table of Contents
- [Getting Started](#getting-started)
  - [Creating a Macro](#creating-a-macro)
  - [Writing Macro Code](#writing-macro-code)
  - [Running a Macro](#running-a-macro)
  - [Stopping a Macro](#stopping-a-macro)
  - [Running a Macro on Startup](#running-a-macro-on-startup)
  - [Keybinding a Macro](#keybinding-a-macro)
  - [Macro Libraries](#macro-libraries)
    - [Adding a Library](#adding-a-library)
    - [Removing a Library](#removing-a-library)
- [User Interface](#user-interface)
  - [Macro Explorer View](#macro-explorer-view)
  - [Macro REPL](#macro-repl)
  - [`@macros` Chat Participant](#macros-chat-participant)
  - [Commands](#commands)
    - [Debugging](#debugging)
    - [Development](#development)
    - [Manage Macros](#manage-macros)
    - [Run Macros](#run-macros)
   - [IntelliSense](#intellisense)
- [Development](#development-1)
  - [Available Code References](#available-code-references)
  - [`macros` API](#macros-api)
    - [Special Variables](#special-variables)
  - [Predefined Views and View Container](#predefined-views-and-view-container)
  - [`@macro` Options](#macro-options)
  - [Download Definition Files](#download-definition-files)
  - [Debugging a Macro](#debugging-a-macro)
    - [Debugger](#debugger)
    - [Logs](#logs)
    - [REPL](#repl)

# Getting Started

Any JavaScript or TypeScript document can be treated as a macro, even if it hasn't been saved to disk—i.e. *untitled* documents. Once saved, certain tools—in particular UI ones such as CodeLens actions or custom IntelliSense—are enabled only if the file is either saved in a registered [macro library](#macro-libraries) or if its name matches the `*.macro.*` pattern (special exclusions include `.d.ts` files). This restriction prevents confusion when working in workspaces containing JavaScript or TypeScript files

## Creating a Macro

* **Option 1**: Use the **Macros: New Macro** command to create a new macro document.
  * You'll be prompted to choose from a list of templates to populate your macro including non-content.
  * By default, the template creates `JavaScript` code but you can change this behavior via the **Macros: Template Default Language** setting.

* **Option 2**: Use the **New Macro** action on the **Temporary** node on the [**Macro Explorer**](#macro-explorer-view).
  * The action is a shortcut for the **Macros: New Macro** command experience described above.

* **Option 3**: Create a new *untitled* document using your preferred method—for example, via the **Create: New File...** or **Create: New Untitled Text File** commands, or by double-clicking an empty area in the editor bar.
  * Change the document language to `JavaScript` or `TypeScript`.
  * Use the **Macros: Fill File with Template** command to add macro content from a template. The command respects your selected document language.

* **Option 4**: Ask the `@macros` chat agent to create a macro for you. 

[↑ Back to top](#table-of-contents)

## Writing Macro Code

The **Macros: Fill File with Template** command, or the **Apply Template** CodeLens on empty files, can jumpstart your development by adding sample to code to a given editor. To generate custom code, however, you can ask the [`@macros` chat agent](#macros-agent) for help.
You can write your own code macros—see [Development](#development) for available APIs. When doing so, keep these basic rules in mind:
- Macros are standalone JavaScript or TypeScript files run in a Node.js sandbox with VS Code APIs.
- Use CommonJS syntax (JavaScript) and avoid `export`, top-level `await` or `return`—the result of last statement be a `Promise` when running async work.
- Macros have access to globals like `vscode` and `macros`, and they can import Node.js libraries, but there is no built-in path to include arbitrary libraries.
- Macros cannot be forcefully stopped. They must either complete on their own or handle the cancellation request sent via the provided `__cancellationToken`.

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

[↑ Back to top](#table-of-contents)

## Running a Macro

* **Option 1**: From the [Command Palette](https://code.visualstudio.com/api/references/contribution-points#contributes.commands), use the **Macros: Run Active Editor as Macro** or **Macros: Run Macro** commands. 

* **Option 2**: On supported editors, i.e. those matching `*.macro.*` or saved in a macro library, use the equivalent **Run Macro** or **Debug Macro** buttons available on the editor title bar.

   <p align=center>
      <img width="400" alt=""Macro editor showing the Debug Macro button" src="https://github.com/user-attachments/assets/78acb656-8c1c-4939-823f-72fbd84c13ea" />
   </p>

* **Option 3**: Use the **Run Macro** button on the macro node on the [**Macro Explorer**](#macro-explorer-view).

* **Option 4**: If you asked the `@macros` chat agent to create a macro for you, you could ask it to run it for you. Current LLM tooling works on its generated code well because a new editor is created and run.

[↑ Back to top](#table-of-contents)

## Stopping a Macro

* **Option 1**: Use **Request to Stop** button on the macro node (all running instances) or the given run instance from the [**Macro Explorer**](#macro-explorer-view) to stop a macro.

* **Option 2**: Use the **Macros: Show Running Macros** command to select a specific instance to stop.
  * This is also available from the status bar item show when there are active macros instances.  

> ℹ️ A macro **cannot** be forcefully terminated - a cancellation request is sent via the unique [`__cancellationToken`](https://code.visualstudio.com/api/references/vscode-api#CancellationToken) token provided to every macro instance. To support cancellation, this token must be explicitly wired into all asynchronous code and logic.

If a macro does not respond to a cancellation request, it will continue running. In such cases, you can use the **Developer: Restart Extension Host** command to restart all extensions, or restart VS Code to stop the macro. While this is not ideal, it provides a way to recover from unresponsive or runaway macros. Note that this approach does not implicitly terminate external processes started by the macro.

[↑ Back to top](#table-of-contents)

### Running a Macro on Startup

> ⚠️ **Workspace Trust**: Startup macros are disabled in [untrusted workspaces](https://code.visualstudio.com/docs/editing/workspaces/workspace-trust).

Startup macros allow you to customize your environment as soon as the environment launches. Because extensions restart when switching workspaces, these macros can be scoped to apply per workspace, enabling tailored setups across projects.

Startup macros let you define behavior similar to an extension's `activate` method. For teardown support, use the `__disposables` global variable to ensure proper disposal when the workspace changes or the extension reloads.

Startup macros are defined via the `macros.startupMacros` setting in your workspace or user settings. You can edit this settings manually, or from the [**Macro Explorer**](#macro-explorer-view), right-click on macro node and select **Set as Startup Macro** or **Unset as Startup Macro** from the context menu. The commands handle cases were user and workspace settings are defined. 

The `macros.startupMacros` setting is additive across Global, Workspace, and Workspace Folder scopes, all defined macros will be run. The system deduplicates macros before execution so only one execution instance of any given startup macro file is ever run. 

Startup macro paths may be defined using tokens like `${workspaceFolder}` or `${userHome}` for dynamic resolution. This allows you to define user settings that automatically start a macro using equivalent patterns across different workspaces. Any paths that do not resolve to existing files are silently ignored.

[↑ Back to top](#table-of-contents)

### Keybinding a Macro

Bind the `macros.run` command to a keyboard shortcut, passing as argument the path to the macro to run. This must be configured directly in your `keybindings.json` file. See the VS Code [documentation](https://code.visualstudio.com/docs/editor/keybindings#_advanced-customization) for details.

1. Use the **Preferences: Open Keyboard Shortcuts (JSON)** command to open the `keybindings.json` file.

2. Add a keybinding for the `macros.run` command:
    - Add the path to the macro file as argument, with `${userhome}` and `${workspaceFolder}` tokens being supported.

**Example: Macro keybinding definition**
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

## Macro Libraries

A *macro library* is simply a folder registered in the `macros.sourceDirectories` setting. Any JavaScript or TypeScript file directly under these folders (no recursive discovery) is considered a macro. Additionally, the extension automatically adds files (e.g. `jsconfig.json`, `global.d.ts`) to support development.

Macro libraries are the core of managing your macros, and the [**Macro Explorer**](#macro-explorer-view) itself, with a *virtual* **Temporary** library used to manage all *untitled* documents. 

When a macro file is saved to disk, and it does not belong to a registered library, it will cause for some features to be automatically disabled for them.

[↑ Back to top](#table-of-contents)

### Adding a Library 

* **Option 1**: Use the **Add Library Folder** action from [**Macro Explorer**](#macro-explorer-view) title bar.

* **Option 2**: Use the **Macros: Add Library Folder** command the [Command Palette](https://code.visualstudio.com/api/references/contribution-points#contributes.commands).

* **Option 3**: Edit the `macros.sourceDirectories` setting. You can use the **Macros: Source Directories** entry in the [Settings editor](https://code.visualstudio.com/docs/configure/settings).

The `macros.sourceDirectories` setting supports using tokens like `${workspaceFolder}` or `${userHome}` for dynamic resolution, e.g. `${workspaceFolder}/.macros` if you use that pattern to save macros in your workspaces. A missing folder won't lead to any error.

[↑ Back to top](#table-of-contents)

### Removing a Library 

* **Option 1**: Use the **Delete** action on the context menu of the given library from [**Macro Explorer**](#macro-explorer-view).
  - This only deletes the corresponding entry from the `macros.sourceDirectories` setting, it does not delete the folder. 

* **Option 2**: Edit the `macros.sourceDirectories` setting. You can use the **Macros: Source Directories** entry in the [Settings editor](https://code.visualstudio.com/docs/configure/settings).

[↑ Back to top](#table-of-contents)

# User Interface

## Macro Explorer View

The **Macro Explorer** provides a central management hub for all macros and [macro libraries](#macro-libraries) actions.

* **Macro Library Folders**: configure macro folders, browse their contents, and quickly add, delete, or move macro files around using drag-and-drop.
  * **"Temporary"**: this is a virtual library node that shows all *untitled* macro documents allowing to easily manage in-memory macros.

* **Macros**: edit, run, or debug macros with one-click.

* **Macro Run Instances**: see active runs and stop existing ones from the view.

The **Macros: Show Macro Explorer** command can be used to bring it into view.
<p align=center>
   <img width="400" alt="Macro Explorer View with diff" src="https://github.com/user-attachments/assets/bc684a9a-6641-455a-aba9-e2df2680e076" />
</p>

[↑ Back to top](#table-of-contents)

## Macro REPL

The REPL is one of the more powerful out-of-box components offered by the extension, as it lets you evaluate JavaScript or TypeScript code interactively, in the same context as any other macro, or the extension itself runs, without resorting to more complex, and somewhat limited, experiences such as the **Developer Tools** console. 
* **Debug**: easily check current context and result of any statements.
* **Develop**: try out full logic, one step at a time, and then save all your statements to a new macro file.
* **Experiment**: run any JavaScript or TypeScript statement and see the result immediately.

 You can start a new REPL using the **Macros: Create REPL** from the [Command Palette](https://code.visualstudio.com/api/references/contribution-points#contributes.commands) or using the corresponding icon on the [**Macro Explorer**](#macro-explorer-view) view. You can have as many REPL instances as you need, each one being run in full isolation.

Some useful commands: 
- Use `.ts` or `.js` to switch between TypeScript and JavaScript modes
- Use `.save` to save your command history to macro editor
- Use `.help` to view all available REPL commands and utilities

<p align=center>
  <img width="400" alt="REPL showing a modal dialog" src="https://github.com/user-attachments/assets/bb03bc5d-a946-4c7d-b714-499ca9d9f378" />
</p>

[↑ Back to top](#table-of-contents)

## `@macros` Chat Participant

The `@macros` [chat particpant](https://code.visualstudio.com/api/extension-guides/ai/chat) supports your macro development by being a domain expert on macro code writing, avoiding common mistakes generic LLMs would make when authoring macros such as adding `export` statements or top-level `await` statements (or just picking the wrong language) but still being able to combine this knowledge with that of developing standard extension code.

The participant can save the sample code to an editor and run in on request, streamlining exploratory workflows,

**Example: Short chat with @macros to create and run a macro**
```
> @macros create a hello world macro

    Save as hello-world.macro.ts and run it with the Macros extension.
    // hello-world.macro.ts
    export default async function main() {
    // show greeting
    ...

> @macros run that macro

    Created untitled:Untitled-4 and ran it as a macro
```

[↑ Back to top](#table-of-contents)

## Commands

### Debugging

See [Debugging a Macro](#debugging-a-macro) for additional information.
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
* **Macros: Run Macro**: select a macro to run. Provides access to macros in configured `macros.sourceDirectories` directories.

[↑ Back to top](#table-of-contents)

### IntelliSense

JavaScript and TypeScript macro files get [IntelliSense](https://code.visualstudio.com/docs/editing/intellisense) support, as long as files have been saved to a macro library. The features can be made more accurate when the library is fully setup for development which means `global.d.ts` and `jsconfig.json` have been added to it. The extension verifies these files them when an editor for a file a library is opened for the first time in a given session, and updates them when new versions are available. 

> ⚠️Automatic updating of `global.d.ts` and `jsconfig.json` means it is not recommended to customizing in any way.

> ⚠️ Untitled documents will not show proper IntelliSense until saved to disk as `global.d.ts` is needed to describe the global context. 

Some custom features that the extension provides is autocomplete on `vscode.commands.executeCommand` showing all currently registered command IDs in your box, or on `@macros` [options](#macro-options).

[↑ Back to top](#table-of-contents)

# Development

## Available Code References

The following references are available from the global context of your macro:
* `vscode`: symbol that provides access to the [VS Code APIs](https://code.visualstudio.com/api/references/vscode-api).
* `macros`: symbol that provides access to this extension's API (see [Macros API](#macros-api)).
* `require`: method that allows load [Node.js libraries](https://nodejs.org/api/all.html). Version is same as your installed VS Code's (see `About` option).
* Other: `atob`, `btoa`, `clearInterval`, `clearTimeout`, `crypto`, `fetch`, `global`, `require`, `setInterval`, `setTimeout`.

[↑ Back to top](#table-of-contents)

## `macros` API

* `log`: Provides access to the **Macros** log output channel, allowing macros to write log entries as needed.

* `macro`: Current macro.
  - `uri`: URI of the current macro instance. It can be `undefined` if running from an in-memory buffer.

* `window`: Provides access to UI-related APIs. 
  Provides access to UI-related APIs for managing predefined macro views.

  - `getTreeViewId(id: string): string | undefined`: Claims an available `treeview` ID for the given macro run. Returns `undefined` if none are available.

  - `getWebviewId(id: string): string | undefined`: Claims an available `webview` ID for the given macro run. Returns `undefined` if none are available.

  - `releaseTreeViewId(id: string): boolean`: Releases a previously claimed `treeview` ID. Returns `true` if successful.

  - `releaseWebviewId(id: string): boolean`: Releases a previously claimed `webview` ID. Returns `true` if successful.

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
   <img width="400" alt="TreeView example" src="https://github.com/user-attachments/assets/b69089a7-3de1-442f-be7b-eff7bbb547a1" />
</p>

[↑ Back to top](#table-of-contents)

## Available View IDs

The following views are statically registered and available for use:

- `macrosView.treeview1` through `macrosView.treeview5` — for `treeview`-based UIs
- `macrosView.webview1` through `macrosView.webview5` — for `webview`-based UIs

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

  **Example: Showing a view**
  ```
  const viewId = macros.window.getTreeViewId();
  ...
  vscode.commands.executeCommand('setContext', `${viewId}.show`, true);
  ```

Be sure to reset the context when the macro finishes, there is no automatic tracking and any leftover context values will be effective until VS Code is restarted.
  
  **Example: Hiding a view**
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

**Example: Using the `singleton` option**
```javascript
// @macro:singleton
vscode.window.showInformationMessage("Hello, world!");
```

[↑ Back to top](#table-of-contents)

## Download Definition Files

Any URL-like string in a macro file pointing to a `.d.ts` file will automatically receive a code action, **Download .d.ts**, enabling you to download the file directly to the macro's parent folder. This simplifies adding type definitions to support [IntelliSense](#intellisense) in your macros.

GitHub URLs containing matching `*/blob/*` are automatically converted to their `raw` equivalent. For example: `https://github.com/Microsoft/vscode/blob/main/extensions/git/src/api/git.d.ts` is automatically handled as `https://github.com/Microsoft/vscode/raw/refs/heads/main/extensions/git/src/api/git.d.ts`.

All URLs use a standard HTTP GET to download the file, which is not customizable at this time.

[↑ Back to top](#table-of-contents)

## Debugging a Macro

### Debugger
Using a debugger leverages the default [debugging workflow for extensions](https://code.visualstudio.com/api/get-started/your-first-extension#debugging-the-extension). In this workflow, you start with a VS Code instance that is used to launch a second **Extension Development Host** instance. The debugger attaches to that host, and you run your debug scenario there, while the debugger itself remains in the original VS Code instance. The **Debug Macro** command automates the setup flow.

There are a couple of details to keep in mind:

- You cannot open the same workspace at the same time in two different VS Code instances. This may require you to reopen the workspace for your scenario in the **Extension Development Host** instance.

- The macro you start the **Debug Macro** command on is not run automatically in the new instance unless it is defined as a startup macro, because the execution / repro context is unknown.

Currently, there is no clear path to streamline this debugging flow. Ideally, the second instance would debug macros running in the first one, allowing you to debug macros without disturbing the current setup.

[↑ Back to top](#table-of-contents)

### Logs
The `macros.log`API (see [Macros API](#macros-api)) writes messages directly to the **Macros** output channel. Every log entry is prefixed with the run-id specific to the instance of your macro you are logging from.

[↑ Back to top](#table-of-contents)

### REPL
The [Macro REPL](#macro-repl) is a great way to verify your logic step-by-step, or to verify the current context as the extension sees it.

[↑ Back to top](#table-of-contents)