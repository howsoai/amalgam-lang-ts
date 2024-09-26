import type { Request, Response } from "./messages";

export interface IFileSystem {
  createLazyFile(parent: string, name: string, url: string, canRead?: boolean, canWrite?: boolean): Promise<void>;
  writeFile(
    path: string,
    data: string | ArrayBufferView | DataView,
    opts?: { flags?: string | undefined },
  ): Promise<void>;
  readFile(path: string, opts: { encoding: "binary" }): Promise<Uint8Array>;
  readFile(path: string, opts: { encoding: "utf8" }): Promise<string>;
  readFile(path: string): Promise<Uint8Array>;
  readFile(path: string, opts?: { encoding: "utf8" | "binary" }): Promise<Uint8Array | string>;
  unlink(path: string): Promise<void>;
  mkdir(path: string, mode?: number): Promise<void>;
  rmdir(path: string): Promise<void>;
  readdir(path: string): Promise<string[]>;
}

export type FileSystemOperation =
  | "createLazyFile"
  | "writeFile"
  | "readFile"
  | "unlink"
  | "mkdir"
  | "rmdir"
  | "readdir";

export type FileSystemRequestParameters<T extends FileSystemOperation> = Parameters<IFileSystem[T]>;

export type FileSystemResponseBody<T extends FileSystemOperation> = T extends "readFile"
  ? Uint8Array | string
  : T extends "readdir"
    ? string[]
    : void;

export interface FileSystemRequest<T extends FileSystemOperation = FileSystemOperation> extends Request {
  command: T;
  parameters: FileSystemRequestParameters<T>;
}

export interface FileSystemResponse<T extends FileSystemOperation = FileSystemOperation> extends Response {
  command: T;
  body: FileSystemResponseBody<T>;
}

export function isFileSystemRequest(command: string): command is FileSystemOperation {
  if (command == null) {
    return false;
  }
  switch (command) {
    case "createLazyFile":
    case "writeFile":
    case "readFile":
    case "unlink":
    case "mkdir":
    case "rmdir":
    case "readdir":
      return true;
    default:
      return false;
  }
}
