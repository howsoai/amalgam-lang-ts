/* eslint-disable @typescript-eslint/no-empty-interface */
import { Amalgam, AmalgamModule, type AmalgamOptions } from "../api";
import { AmalgamError } from "../errors";
import { Logger, nullLogger } from "../utilities";
import { isRequest, MessageEventLike, ProtocolMessage, Request, Response } from "./messages";

export type AmalgamOperation =
  | "loadEntity"
  | "verifyEntity"
  | "cloneEntity"
  | "storeEntity"
  | "executeEntity"
  | "executeEntityJson"
  | "destroyEntity"
  | "getEntities"
  | "setRandomSeed"
  | "setJsonToLabel"
  | "getJsonFromLabel"
  | "setSBFDatastoreEnabled"
  | "isSBFDatastoreEnabled"
  | "getVersion"
  | "setMaxNumThreads"
  | "getMaxNumThreads"
  | "getConcurrencyType";

export type AmalgamCommand = "initialize" | AmalgamOperation | string;

export type AmalgamRequestParameters<T extends AmalgamCommand> = T extends AmalgamOperation
  ? Parameters<Amalgam[T]>
  : T extends "initialize"
    ? [options?: AmalgamOptions]
    : [];

export type AmalgamResponseBody<T extends AmalgamCommand> = T extends AmalgamOperation
  ? ReturnType<Amalgam[T]>
  : T extends "initialize"
    ? boolean
    : void;

export interface AmalgamRequest<T extends AmalgamCommand = AmalgamCommand> extends Request {
  command: T;
  parameters: AmalgamRequestParameters<T>;
}

export interface AmalgamResponse<T extends AmalgamCommand = AmalgamCommand> extends Response {
  command: T;
  body: AmalgamResponseBody<T>;
}

/* Typed Responses */

export interface ExecuteEntityJsonResponse<R = unknown> extends AmalgamResponse<"executeEntityJson"> {
  body: R | null;
}

export interface JsonFromLabelResponse<R = unknown> extends AmalgamResponse<"getJsonFromLabel"> {
  body: R | null;
}

/* Amalgam Service */

export function isAmalgamOperation(command: string): command is AmalgamOperation {
  if (command == null) {
    return false;
  }
  switch (command) {
    case "loadEntity":
    case "verifyEntity":
    case "cloneEntity":
    case "storeEntity":
    case "executeEntity":
    case "executeEntityJson":
    case "destroyEntity":
    case "getEntities":
    case "setRandomSeed":
    case "setJsonToLabel":
    case "getJsonFromLabel":
    case "setSBFDatastoreEnabled":
    case "isSBFDatastoreEnabled":
    case "getVersion":
    case "setMaxNumThreads":
    case "getMaxNumThreads":
    case "getConcurrencyType":
      return true;
    default:
      return false;
  }
}

export interface AmalgamWorkerServiceOptions {
  logger?: Logger;
}

export class AmalgamWorkerService<T extends AmalgamModule = AmalgamModule> {
  protected amlg?: Amalgam<T>;
  protected initialized = false;
  protected logger: Logger;

  constructor(
    protected readonly initializer: (options?: AmalgamOptions) => Promise<Amalgam<T>>,
    protected readonly options: AmalgamWorkerServiceOptions = {},
  ) {
    this.logger = options.logger || nullLogger;
  }

  /**
   * Dispatch a message.
   * @param ev The message event.
   */
  public async dispatch(ev: MessageEventLike<ProtocolMessage>): Promise<void> {
    const channel = ev.ports?.[0];
    if (!channel) {
      return;
    }
    if (isRequest(ev.data)) {
      if (ev.data.command === "initialize") {
        if (this.initialized) {
          // Send true to designate that the service is already initialized
          this.sendResponse(true, ev.data, channel);
        } else {
          try {
            this.amlg = await this.initializer(ev.data.parameters?.[0] || {});
            this.initialized = true;
            // Send false to designate it was not already initialized
            this.sendResponse(false, ev.data, channel);
          } catch (error) {
            this.sendError(error as string | Error, ev.data, channel);
          }
        }
      } else {
        await this.processRequest(ev.data, channel);
      }
    } else {
      this.sendError("Malformed Amalgam request.", null, channel);
    }
  }

  /**
   * Send error response over message channel.
   * @param error The error to return.
   * @param request The request the response is for.
   * @param channel The message channel.
   */
  public sendError(error: Error | string, request: Request | null, channel: MessagePort): void {
    this.logger.error(error);

    let instance: AmalgamError;
    if (error instanceof AmalgamError) {
      instance = error;
    } else if (error instanceof Error) {
      instance = new AmalgamError(error.message);
      instance.stack = error.stack;
    } else {
      instance = new AmalgamError(String(error));
    }

    const msg: Response = {
      type: "response",
      command: request?.command || "",
      success: false,
      // Include serialized form since we cannot transfer custom error class across boundary
      body: instance.serialize(),
      error: instance,
    };
    channel.postMessage(msg);
  }

  /**
   * Send response over message channel.
   * @param body The body of the response.
   * @param request The request the response is for.
   * @param channel The message channel.
   */
  public sendResponse(body: unknown, { command }: Request, channel: MessagePort): void {
    const msg: Response = {
      type: "response",
      success: true,
      command,
      body,
    };
    channel.postMessage(msg);
  }

  /**
   * Process a request.
   * @param request The request to handle.
   * @param channel The message channel.
   */
  protected async processRequest(request: Request, channel: MessagePort): Promise<void> {
    if (this.amlg == null) {
      this.sendError("Runtime not initialized.", request, channel);
      return;
    }

    if (isAmalgamOperation(request?.command)) {
      const { command, parameters = [] } = request;
      try {
        const body = (this.amlg[command] as CallableFunction)(...parameters);
        this.sendResponse(body, request, channel);
      } catch (error) {
        this.sendError(error as string | Error, request, channel);
      }
    } else {
      await this.handle(this.amlg, request, channel);
    }
  }

  /**
   * Override to handle additional request commands.
   * @param amlg The amalgam instance.
   * @param request The request to handle.
   * @param channel The message channel.
   */
  protected async handle(_amlg: Amalgam<T>, request: Request, channel: MessagePort): Promise<void> {
    this.sendError("Invalid amalgam operation.", request, channel);
  }
}
