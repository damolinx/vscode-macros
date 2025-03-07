# Changelog

## 0.1.5
- Improve supporting development files.

## 0.1.4
- Fix: `WorkspaceEditor` unexpected behavior means no files are updated by `Setup Source Directory for Development`.

## 0.1.3
- Add `Setup Source Directory for Development` command to add optional files to support macro development.

## 0.1.2
- Prefer `TextDocument` version of macro content (over file-system version).
  - Allows to run untitled editors rather than forcing a save. 
- Improve extension package: 
  - Minifying makes it 17KB.
  - Exclude dev-only files. 

## 0.1.1
- Ignore FileNotFound on missing source directories.

## 0.1.0
- Completes basic scenarios.
- `.cjs` is now supported.

## 0.0.9
- Macro selection dropdown remembers last selection.
- Error dialog for `persistent` macros allows to `Reset State`.
- Add support for cooperative macro stop via a `CancellationToken`.

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