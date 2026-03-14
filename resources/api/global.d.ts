import * as _vscode from 'vscode';

declare global {
  /**
   * Visual Studio Code Extension API.
   * See https://code.visualstudio.com/api for more information.
   */
  const vscode: typeof _vscode;

  /**
   * A [CancellationToken](https://code.visualstudio.com/api/references/vscode-api#CancellationToken)
   * used by the extension to notify about a stop request.
   */
  const __cancellationToken: _vscode.CancellationToken;

  /**
   * Array of [disposables](https://code.visualstudio.com/api/references/vscode-api#Disposable) to release when macro completes.
   */
  const __disposables: _vscode.Disposable[];

  /**
   * ID of macro run.
   */
  const __runId: string;

  /**
   * Macro run was triggered on startup.
   */
  const __startup: true | undefined;

  /**
   * Macros Extension for Visual Studio Code API.
   * See https://github.com/damolinx/vscode-macros#readme for more information.
   */
  const macros: {
    /**
     * [Extension context](https://code.visualstudio.com/api/references/vscode-api#ExtensionContext).
     */
    readonly extensionContext: _vscode.ExtensionContext;
    /**
     * **Macros** [log output channel](https://code.visualstudio.com/api/references/vscode-api#LogOutputChannel).
     */
    readonly log: _vscode.LogOutputChannel;
    /**
     * Current macro.
     */
    readonly macro: {
      /**
       * URI of current macro. It can be undefined if running from an in-memory buffer.
       */
      readonly uri: _vscode.Uri | undefined;
    };

    /**
     * Namespace providing command APIs.
     */
    readonly commands: {
      /**
       * Executes one or more commands in sequence.
       * @param cmds Commands to execute. Each command may be specified as either:
       * - a string command ID
       * - a `[id, ...args]` tuple providing the command ID and its arguments.
       * @returns A promise resolving to an array of results, one per command.
       */
      executeCommands(...cmds: (string | [id: string, ...args: any[]])[]): Promise<any[]>;
    };

    /**
     * Namespace providing window and UI APIs.
     */
    readonly window: {
      /**
       * Returns an available TreeView ID for the caller.
       */
      getTreeViewId(): string | undefined;

      /**
       * Returns an available Webview ID for the caller.
       */
      getWebviewId(): string | undefined;

      /**
       * Releases a previously assigned TreeView ID.
       */
      releaseTreeViewId(id: string): boolean;

      /**
       * Releases a previously assigned Webview ID.
       */
      releaseWebviewId(id: string): boolean;

      readonly ui: {
        attr(name: string, value: macros.ui.AttributeValue): macros.ui.Attribute;
        button(...nodes: (macros.ui.EventNode | macros.ui.Text)[]): macros.ui.Button;
        button(
          options: macros.ui.ButtonOptions,
          ...nodes: (macros.ui.EventNode | macros.ui.Text)[]
        ): macros.ui.Button;
        container(...nodes: (macros.ui.Container | macros.ui.Node)[]): macros.ui.Container;
        container(
          options: macros.ui.ContainerOptions,
          ...nodes: macros.ui.Node[]
        ): macros.ui.Container;
        handler(name: string, code: macros.ui.EventHandlerCode): macros.ui.EventHandler;
        input(...nodes: (macros.ui.EventNode | macros.ui.Button)[]): macros.ui.Input;
        input(
          options: macros.ui.InputOptions,
          ...nodes: (macros.ui.EventNode | macros.ui.Button)[]
        ): macros.ui.Input;
        on(eventName: string, handlerName: string): macros.ui.Event;
        onHandle(eventName: string, code: macros.ui.EventHandlerCode): macros.ui.BoundEvent;
        root(
          options: macros.ui.RootOptions,
          ...nodes: (macros.ui.Container | macros.ui.Node)[]
        ): macros.ui.Root;
        root(...nodes: (macros.ui.Container | macros.ui.Node)[]): macros.ui.Root;
        script(code: string): macros.ui.Script;
        text(text: string): macros.ui.Text;
        tree(...children: macros.ui.EventNode[]): macros.ui.Tree;
        tree(options: macros.ui.TreeOptions, ...children: macros.ui.EventNode[]): macros.ui.Tree;
      };
    };
  };
}

export declare namespace macros.ui {
  export interface NodeOptions {
    readonly id?: string;
  }

  interface BaseNode {
    readonly id?: string;
    readonly kind: string;
    readonly options?: NodeOptions;
    /** @internal */
    readonly __brand: never;
  }

  export type AttributeValue = string | number | boolean | null | undefined;

  export type EventHandlerCode = string | ((detail: EventDetail) => any);

  export interface Attribute extends BaseNode {
    readonly kind: 'attribute';
    readonly name: string;
    readonly value: AttributeValue;
  }

  export interface ButtonOptions extends NodeOptions {
    readonly label?: string;
    readonly tabIndex?: number;
    readonly toggle?: boolean;
  }

  export interface Button extends BaseNode {
    readonly kind: 'button';
  }

  export interface ContainerOptions extends NodeOptions {
    readonly mode: 'fixed' | 'scrollable';
  }

  export interface Container extends BaseNode {
    readonly kind: 'container';
  }

  export interface BoundEvent extends Attribute {
    readonly kind: 'boundEvent';
    readonly eventName: string;
  }

  export interface Event extends Attribute {
    readonly kind: 'event';
    readonly eventName: string;
    readonly handlerName: string;
  }

  export interface EventDetail {
    eventName: string;
    handlerName: string;
    target: any;
    [key: string]: any;
  }

  export interface EventHandler extends BaseNode {
    readonly kind: 'eventHandler';
    readonly code: EventHandlerCode;
    readonly handlerName: string;
  }

  export interface InputOptions extends NodeOptions {
    readonly placeholder?: string;
    readonly tabIndex?: number;
    readonly type?: 'text' | 'password' | 'number' | 'email';
    readonly value?: string;
  }

  export interface Input extends BaseNode {
    readonly kind: 'input';
  }

  export interface Root {
    readonly errorRelay?: boolean;
    readonly progress?: boolean;
  }

  export interface Root extends Container {
    toHtml(): string;
  }

  export interface Script extends BaseNode {
    readonly code: string;
  }

  export interface Text extends BaseNode {
    readonly text: string;
  }

  export interface TreeNode {
    readonly action?: { handlerName: string };
    readonly children?: TreeNode[];
    readonly id: string;
    readonly label: string;
  }

  export interface TreeOptions extends NodeOptions {
    readonly remove?: boolean;
    readonly initialItems?: macros.ui.TreeNode[];
  }

  export interface Tree extends BaseNode {
    readonly kind: 'tree';
  }

  export type Node = Attribute | Button | Event | EventHandler | Input | Script | Text | Tree;

  export type EventNode = BoundEvent | Event | EventHandler;
}

export {};
