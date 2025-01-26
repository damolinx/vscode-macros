# Changelog

## 0.0.8
- Add `Open Macro…` command.
- Fix: incorrect tracking of running macros in case of error.
- Open-macro dropdown is configurable.

## 0.0.7
- `[Run|Debug] Macro…` commands take in an optional `pathOrUri` argument.
- Better error dialog: `Rerun`, `Details`, navigation to error location.

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
- Add support for `${userHome}` and `${workspaceFolder}` variables in `macros.sourceDirectories` setting

## 0.0.2
- Add "Source Directories" concept create macro libraries.

## 0.0.1
- Initial MVP version.