# Changelog

## 0.4.4
- Use natural sorting in UI lists. 
- `Macro Explorer` view:
  - Add `New REPL Terminal` command.
  - Update handling change events.

## 0.4.3
- `Macro Explorer` view:
  - Library nodes use `~/` on descriptions for simplicity in non-Windows platforms.
  - Fix: Drag-and-drop broken on 0.4.2 with introduction of the `Temporary` node.
  - Fix: `Delete` fails under WSL (and other remote scenarios).
  - Fix: `Reveal in File Explorer` does not show nor work under WSL.
- Update `Git` template.
- Fix: 'Download .d.ts file' is not a QuickFix.

## 0.4.2
- `Macro Explorer` view:
  - `Temporary` virtual library tracks untitled macros created with `New Macro` command. 
  - Fix: Untitled files removed on run stop when editor still open.
- More interesting `Cancellation` template. 

## 0.4.1
- `Macro Explorer` view:
  - Add `Temporary` node to complete macro-management. 
  - Display parent path as description for library nodes to disambiguate duplicate names.
  - Hide `Reveal` commands in Remote scenarios.
- Fix: `Cancellation` template incorrect use of `withProgress` API. 

## 0.4.0
- Add `Macro Explorer` view. 

## 0.3.5
- Automatically set up target directory when saving a `.macro.js` file, provided that `macros.sourceDirectories.verify` is enabled.
- Security: Startup macros are disabled in untrusted workspaces.
- Fix: `Macros: Open` » `Open …` drop down entry does not open selected file.

## 0.3.4
- Upgrade minimum VS Code version to 1.99.
- `@macro` supports multiple comma-separated options.
- Add new `retained` macro option.
- Update `macros` agent prompt to improve code generation quality.
- Fix: TreeView example does not load in case-sensitive file-systems.

## 0.3.3
- Upgrade minimum VS Code version to 1.96.
- Add startup macros.
- Add `Macros` output channel.
  - Introduce `macros.log` accessor for macro-specific logging.
- Fix: `sourceDirectories` ignores non-tokenized paths.

## 0.3.2
- Fix: Trailing `/` affecting `vscode-remote` execution.
- Fix: Missing source directories lead to error.

## 0.3.1
- Support multi-root workspaces.
- Simplify `Run Macro…` behavior when no libraries have been configured.
- `Run|Debug Macro` actions available from context menu on `.macro.js` files.

## 0.3.0
- General logic review and code clean-up.
  - Better tracking of macro documents.
  - Download `.d.ts` supports any FS.
- New `Fill File with Template` command replaces `Initialize` CodeLens.
- Updated templates.

## 0.2.6
- Updated templates and documentation.

## 0.2.5
- Fix: Duplicate capture group name.

## 0.2.4
- `macros` chat agent uses history as context.
- Add autocomplete support for `executeCommand` method (command id -only).
- Macro templates are grouped by category.

## 0.2.3
- New `Macros` view container on the Activity Bar allows to create a new type of webview.
- New `Language Model`, `Tree View (Sidebar)`, `Webview (Sidebar)` templates.
- Update `Webview` template:
   - Renamed to `Webview (Editor)` and style changes.
   - Fix: stopping macro disposes view correctly.
- Add a `macros` chat agent (experimental).

## 0.2.2
- Add `Download .d.ts` code action on `.d.ts` URLs.
- New `Git` template.

## 0.2.1
- Updated templates.

## 0.2.0
- Remove `javascriptmacro` language and lean on `.macro.js` whenever surfacing a feature would cause confusion with standard JavaScript files (e.g. UI buttons).
- Add `__disposable` API. Check README and example template.
- Add`.load` and `.save` commands in REPL, fully leveraging VS Code integration.
- Add `Reset Context` CodeLens on `@macro:persistent` macros.
- Add autocomplete support for `@macro` options.
- Updated and new macro templates.
- Statusbar item shows running macros on click.
- Fix: Error line location for Error dialogs was calculated incorrectly in some cases.

## 0.1.10
- Rewrite Macro REPL to use Node.js' `repl`, providing a fully functional REPL.

## 0.1.9
- Update REPL to use Node.js' `inspect` to print results and handle incomplete new-line when writing results.

## 0.1.8
- Update REPL:
  - Add history support (UP/DOWN) and clear line (ESC).
  - Object expressions (e.g., `{a: 1}`) are evaluated as such, not as blocks.
  - Object results are printed closer to their expected representation.
- Fix: `persistent` does not update saved root-scoped variables.

## 0.1.7
- Add initialization CodeLens for `javascriptmacro` editors:
  - Initial implementation, missing escape actions.
- Add `Create New REPL Terminal` command and REPL Terminal.
- Update macro selection picker.
- Fix: `persistent` does not save root-scoped variables.

## 0.1.6
- Define `javascriptmacro` language using the `.macro.js` extension:
  - Initial implementation, missing language server.
- Document macro keybindings.
- Add support for tokens in macro paths to improve keybinding scenarios.
- Add `References` macro example.
- Update existing macro examples.
- Update development files.

## 0.1.5
- Improve supporting development files.

## 0.1.4
- Fix: `WorkspaceEditor` unexpected behavior where no files are updated by `Setup Source Directory for Development`.

## 0.1.3
- Add `Setup Source Directory for Development` command to add optional files to support macro development.

## 0.1.2
- Prefer `TextDocument` version of macro content (over file-system version):
  - Allows running untitled editors rather than forcing a save.
- Improve extension package:
  - Minifying reduces it to 17KB.
  - Exclude dev-only files.

## 0.1.1
- Ignore `FileNotFound` on missing source directories.

## 0.1.0
- Complete basic scenarios.
- `.cjs` is now supported.

## 0.0.9
- Macro selection dropdown remembers the last selection.
- Error dialog for `persistent` macros allows `Reset State`.
- Add support for cooperative macro stop via a `CancellationToken`.

## 0.0.8
- Add `Open Macro…` command.
- Fix: incorrect tracking of running macros in case of error.
- Open-macro dropdown is configurable.

## 0.0.7
- `[Run|Debug] Macro…` commands take an optional `pathOrUri` argument.
- Better error dialog: `Rerun`, `Details`, and navigation to the error location.

## 0.0.6
- `[Run|Debug] Macro…` commands subsume `[Run|Debug] Macro (Source Directories)` commands to simplify UX.

## 0.0.5
- Initial `macros` API definition.
- Fix handling of untitled JavaScript documents.
- Command updates:
  - Add `New Macro…` command.
  - Add `Debug *` family of commands.

## 0.0.4
- Fix packaging issue (stale file name).

## 0.0.3
- Make `extensionKind: workspace` only.
- Add support for `${userHome}` and `${workspaceFolder}` variables in the `macros.sourceDirectories` setting.

## 0.0.2
- Add "Source Directories" concept to create macro libraries.

## 0.0.1
- Initial MVP version.