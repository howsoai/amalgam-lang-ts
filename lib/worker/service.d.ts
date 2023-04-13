import { Amalgam, AmalgamModule, AmalgamCoreResponse, AmalgamOptions } from "../api.js";
import { MessageEventLike, ProtocolMessage, Request, Response } from "./messages.js";
export { AmalgamCoreResponse };
export type AmalgamOperation = "loadEntity" | "storeEntity" | "executeEntity" | "executeEntityJson" | "deleteEntity" | "getEntities" | "setRandomSeed" | "setJsonToLabel" | "getJsonFromLabel" | "setSBFDatastoreEnabled" | "isSBFDatastoreEnabled" | "getVersion" | "setMaxNumThreads" | "getMaxNumThreads";
export type AmalgamCommand = "initialize" | AmalgamOperation | string;
export type AmalgamRequestParameters<T extends AmalgamCommand> = T extends AmalgamOperation ? Parameters<Amalgam[T]> : T extends "initialize" ? [options?: AmalgamOptions] : [];
export type AmalgamResponseBody<T extends AmalgamCommand> = T extends AmalgamOperation ? ReturnType<Amalgam[T]> : T extends "initialize" ? boolean : void;
export interface AmalgamRequest<T extends AmalgamCommand = AmalgamCommand> extends Request {
    command: T;
    parameters: AmalgamRequestParameters<T>;
}
export interface AmalgamResponse<T extends AmalgamCommand = AmalgamCommand> extends Response {
    command: T;
    body: AmalgamResponseBody<T>;
}
export interface ExecuteEntityJsonResponse<R = unknown> extends AmalgamResponse<"executeEntityJson"> {
    body: AmalgamCoreResponse<R>;
}
export interface JsonFromLabelResponse<R = unknown> extends AmalgamResponse<"getJsonFromLabel"> {
    body: R | null;
}
export declare function isAmalgamOperation(command: string): command is AmalgamOperation;
export interface AmalgamWorkerServiceOptions {
    debug?: boolean;
}
export declare class AmalgamWorkerService<T extends AmalgamModule = AmalgamModule> {
    protected readonly initializer: (options?: AmalgamOptions) => Promise<Amalgam<T>>;
    protected readonly options: AmalgamWorkerServiceOptions;
    protected amlg?: Amalgam<T>;
    protected initialized: boolean;
    constructor(initializer: (options?: AmalgamOptions) => Promise<Amalgam<T>>, options?: AmalgamWorkerServiceOptions);
    dispatch(ev: MessageEventLike<ProtocolMessage>): Promise<void>;
    sendError(error: Error | string, request: Request | null, channel: MessagePort): void;
    sendResponse(body: unknown, { command }: Request, channel: MessagePort): void;
    protected processRequest(request: Request, channel: MessagePort): Promise<void>;
    protected handle(_amlg: Amalgam<T>, request: Request, channel: MessagePort): Promise<void>;
}
