# Changelog

## 0.5.9
- **Macro Explorer** view:
  - Add **Set as Startup Macro** action on macro nodes.
- Fix: Startup macros can block extension activation.

## 0.5.8
- Support sourcemaps in transpiled TypeScript code for better error reporting.
- Further clean-up error stack traces.
- Add **Create REPL** back in the **Macro Explorer** titlebar.

## 0.5.7
- Add **CodeLens** template.
- Improve error location parsing.

## 0.5.6
- Add **Delete** action to macro library nodes to unregister them.
- Fix: Path tokenization for deep folders in `${userHome}` now works correctly.

## 0.5.5
- Improve macro and library creation:
  - Add **(empty)** template for quick macro setup.
  - Replace **Configure Source Directories** button with **Add Library Folder…**:
    - Automatically tokenizes paths when possible.
    - Choose User or Workspace settings based on library location.
    - Set up development files in newly added folders.

## 0.5.4
- Improve handling of **Source Directories**:
  - Workspace setting now appends to, rather than overrides, the User setting.
  - Resolved paths are now fully normalized to prevent duplicate entries.
- **Macro Explorer** view:
  - Update add icon, and title actions.
  - Improve keyboard bindings.
  - Library tooltips now display Source metadata, showing path configuration provenance.
- **Startup Macros** setting should allow `.ts` file for consistency.
- Update `@macros` agent to support TypeScript macros.

## 0.5.3
- Fix: Missed `replace` to `replaceAll` conversation when removing regex.

## 0.5.2
- Tokenized library paths are now cross-platform—e.g. `${userHome}/macros` resolves correctly on both Windows and Linux when using WSL.
- **Macro Explorer** view:
  - Add **Refresh Macro Explorer** action to workaround so edge cases on FS events.
  - Macro nodes support **Rename…** action.
  - Keybindings for **Rename…** and **Delete**.
  - Run nodes support **View** action.
- REPL:
  - New terminal icon.
  - New evaluation logic matches macro "top-level" evaluation
    - Promises are evaluated directly; top-level `await` is redundant and unsupported.
    - Fix: Avoids cases leading to  REPL freezing.
  - `.ts` / `.js` enable TypeScript / JavaScript evaluation.
    - `.tsv` is deprecated.
  - Improved error reporting and handling.

## 0.5.1
- **Macro Explorer** view:
  - New sidebar view icon.
  - Resource nodes support **Copy Path** and **Copy Name** actions.
  - Run nodes:
    - Show started and document version information.
    - Support **View Running Version** action to open/compare running code with current one.
- Fix: Stackframe clean-up not working as expected.
- Fix: `.ts` / `.tsv` do not interact correctly with command history.

## 0.5.0
- New extension icon.
- Support **TypeScript** macros:
  - Support `typescript` documents and `.macro.ts` and `.ts` files.
  - Add REPL support via `.ts` and `.tsv` commands.
  - Leverage the `transpileModule` API for fast transpilation (MVP).
  - TypeScript-specific templates, when using **Macros: Fill File with Template** on `typescript` documents.
  - Provide TypeScript-specific templates when using **Macros: Fill File with Template** on `typescript` documents.
- **Macro Explorer** view:
  - Icon theming consistent with `vs-seti`.
  - Improve descriptions for libraries located in the user directory in Windows.
- **Source Directories Verification** setting:
  - Changes apply immediately—no restart needed anymore.
  - Verification now occurs once per file or library on editor change (previously triggered on every `TextDocument` save, which was unnecessarily noisy).
  - Accessible via context menus for libraries.
- Error reporting omits internal stack frames and noisy messages for cleaner diagnostics.
- Debugging UX improvements:
  - Available only for macros saved to disk (`file` scheme).
  - Disabled when the current VS Code instance is being debugged to prevent recursive debugging confusion.
- Fix: Prevent orphaned macro runs when the backing untitled editor is closed.

## 0.4.5
- REPL:
  - Rename **New REPL Terminal** command to **New REPL**.
  - Help header.
  - `.save` includes a time hint.
  - Fix: `.save` opens up the template selector instead of an editor with the command history.
  - Fix: leading spaces leads to internal commands being saved.

## 0.4.4
- Improve `@macros` chat agent accuracy when supporting macros.
  - `/create` tool is a shortcut for template-based creation.
- **Macro Explorer** view:
  - Add **New REPL Terminal** command.
  - Update handling change events.
- Use natural sorting in UI lists.

## 0.4.3
- **Macro Explorer** view:
  - Library nodes use `~/` on descriptions for simplicity in non-Windows platforms.
  - Fix: Drag-and-drop broken on 0.4.2 with introduction of the **Temporary** node.
  - Fix: **Delete** fails under WSL, and other remote scenarios.
  - Fix: **Reveal in File Explorer** does not work under WSL.
- Update `Git` template.
- Fix: **Download .d.ts file** is not a QuickFix.

## 0.4.2
- **Macro Explorer** view:
  - **Temporary** virtual library tracks untitled macros created with **New Macro** command.
  - Fix: Untitled files are removed when a run stops, even if the editor is still open.
- More interesting `Cancellation` template.

## 0.4.1
- **Macro Explorer** view:
  - Add **Temporary** node to complete macro-management.
  - Display parent path as description for library nodes to disambiguate duplicate names.
  - Hide **Reveal …** commands in Remote scenarios.
- Fix: `Cancellation` template incorrect use of `withProgress` API.

## 0.4.0
- Add **Macro Explorer** view.

## 0.3.5
- Automatically set up target directory when saving a `.macro.js` file, provided that `macros.sourceDirectories.verify` is enabled.
- Security: Startup macros are disabled in untrusted workspaces.
- Fix: **Macros: Open**'s **Open …** dropdown-entry does not open selected file.

## 0.3.4
- Upgrade minimum VS Code version to 1.99.
- `@macro` supports multiple comma-separated options.
- Add new `retained` macro option.
- Update `macros` agent prompt to improve code generation quality.
- Fix: TreeView example does not load in case-sensitive file-systems.

## 0.3.3
- Upgrade minimum VS Code version to 1.96.
- Add startup macros.
- Add **Macros** output channel.
  - Introduce `macros.log` accessor for macro-specific logging.
- Fix: `sourceDirectories` ignores non-tokenized paths.

## 0.3.2
- Fix: Trailing `/` affecting `vscode-remote` execution.
- Fix: Missing source directories lead to error.

## 0.3.1
- Support multi-root workspaces.
- Simplify **Run Macro…** behavior when no libraries have been configured.
- **Run Macro…** and **Debug Macro…** actions available from context menu on `.macro.js` files.

## 0.3.0
- General logic review and code clean-up.
  - Better tracking of macro documents.
  - Download `.d.ts` supports any FS.
- New **Fill File with Template** command replaces **Initialize** CodeLens.
- Updated templates.

## 0.2.6
- Updated templates and documentation.

## 0.2.5
- Fix: Duplicate capture group name.

## 0.2.4
- `@macros` chat agent uses history as context.
- Add autocomplete support for `executeCommand` method (command ID -only).
- Macro templates are grouped by category.

## 0.2.3
- New **Macros** view container on the Activity Bar allows to create a new type of webview.
- New `Language Model`, `Tree View (Sidebar)`, `Webview (Sidebar)` templates.
- Update `Webview` template:
   - Renamed to `Webview (Editor)` and style changes.
   - Fix: stopping macro disposes view correctly.
- Add a `@macros` chat agent (experimental).

## 0.2.2
- Add **Download .d.ts** code action on `.d.ts` URLs.
- New `Git` template.

## 0.2.1
- Updated templates.

## 0.2.0
- Remove `javascriptmacro` language and lean on `.macro.js` whenever surfacing a feature would cause confusion with standard JavaScript files (e.g. UI buttons).
- Add `__disposable` API. Check README and example template.
- Add`.load` and `.save` commands in REPL, fully leveraging VS Code integration.
- Add **Reset Context** CodeLens on `@macro:persistent` macros.
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
- Add **Create New REPL Terminal** command and REPL Terminal.
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
- Fix: Unexpected behavior where no files are updated by **Setup Source Directory for Development**.

## 0.1.3
- Add **Setup Source Directory for Development** command to add optional files to support macro development.

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
- Error dialog for `persistent` macros allows **Reset State**.
- Add support for cooperative macro stop via a `CancellationToken`.

## 0.0.8
- Add **Open Macro…** command.
- Fix: incorrect tracking of running macros in case of error.
- Open-macro dropdown is configurable.

## 0.0.7
- **Run Macro…** and **Debug Macro…** commands take an optional `pathOrUri` argument.
- Better error dialog: `Rerun`, `Details`, and navigation to the error location.

## 0.0.6
- **Run Macro…** and **Debug Macro…** commands subsume **Run Macro (Source Directories)** and **Debug Macro (Source Directories)** commands to simplify UX.

## 0.0.5
- Initial `macros` API definition.
- Fix handling of untitled JavaScript documents.
- Command updates:
  - Add **New Macro…** command.
  - Add **Debug …** family of commands.

## 0.0.4
- Fix packaging issue (stale file name).

## 0.0.3
- Make `extensionKind: workspace` only.
- Add support for `${userHome}` and `${workspaceFolder}` variables in the `macros.sourceDirectories` setting.

## 0.0.2
- Add "Source Directories" concept to create macro libraries.

## 0.0.1
- Initial version.