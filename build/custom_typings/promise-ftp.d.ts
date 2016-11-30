declare module 'promise-ftp' {
  module PromiseFtp {
    export interface ConnectOptions {
      host?: string;
      port?: number,
      secure?: boolean | 'control' | 'implicit',
      secureOptions?: any,
      user?: string,
      password?: string,
      connTimeout?: number,
      pasvTimeout?: number,
      keepalive?: number,
      autoReconnect?: boolean,
      preserveCwd?: boolean
    }

    export interface FtpConnectionError extends Error {
      name: string;
      message: string;
    }

    export interface FtpReconnectError extends Error {
      name: string;
      message: string;
      disconnectError: string;
      connectError: string;
    }

    export interface ListEntry {
      type: '' | 'd' | '-';
      name: string;
      size: string;
      date: Date;
      rights: { user: string, group: string, other: string };
      owner: string;
      group: string;
      target: string;
      sticky: boolean;
    }

    export type ConnectionStatus = 'not yet connected' | 'connecting' | 'connected' | 'logging out' | 'disconnecting' | 'disconnected' | 'reconnecting';
  }

  class PromiseFtp {
    connect(config?: PromiseFtp.ConnectOptions): Promise<string>;
    reconnect(): Promise<string>;
    end(): Promise<Error | boolean>;
    destroy(): boolean;
    getConnectionStatus(): PromiseFtp.ConnectionStatus;
    // Required commands (RFC 959)
    list(path?: string, useCompression?: boolean): Promise<Array<PromiseFtp.ListEntry>>;
    get(path?: string, useCompression?: boolean): Promise<NodeJS.ReadableStream>;
    put(input: any, destPath: string, useCompression?: boolean): Promise<undefined>;
    append(input: any, destPath: string, useCompression?: boolean): Promise<undefined>;
    rename(oldPath: string, newPath: string): Promise<undefined>;
    logout(): Promise<undefined>;
    delete(path: string): Promise<undefined>;
    cwd(path: string): Promise<undefined>;
    abort(): Promise<undefined>;
    site(command: string): Promise<{ text: string, code: number }>;
    status(): Promise<string>;
    ascii(): Promise<undefined>;
    binary(): Promise<undefined>;
    // Optinal commands (RFC 959)
    mkdir(path: string, recursive?: boolean): Promise<undefined>;
    rmdir(path: string, includeContents?: boolean): Promise<undefined>;
    cdup(): Promise<undefined>;
    pwd(): Promise<string>;
    system(): Promise<string>;
    listSafe(path?: string, useCompression?: string): Promise<Array<PromiseFtp.ListEntry>>;
    // Extended commands (RFC 3659)
    size(path: string): Promise<number>;
    lasMode(path: string): Promise<Date>;
    restart(byteOffset: number): Promise<undefined>;
  }

  export = PromiseFtp;
}
