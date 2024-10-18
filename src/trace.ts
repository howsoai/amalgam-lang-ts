import { Logger, nullLogger } from "./utilities";

export class AmalgamTrace {
  constructor(protected readonly logger: Logger = nullLogger) {}

  public log(...msg: string[]): void {
    this.logger.info(...msg);
  }

  public logTime(label: string): void {
    const timestamp = new Date();
    this.logger.debug(`# TIME ${label} ${timestamp.toISOString()}`);
  }

  public logComment(...comments: string[]): void {
    this.logger.debug("#", ...comments);
  }

  public logReply(reply: unknown): void {
    this.logger.debug("# REPLY >", JSON.stringify(reply));
  }

  public logCommand(type: AmalgamTraceCommand, ...parts: unknown[]): void {
    this.logger.debug(type, ...parts.map(this.serializePart));
  }

  protected serializePart(part: unknown) {
    if (part == null || ["number", "string", "boolean"].includes(typeof part)) {
      return JSON.stringify(part);
    }
    // If we have an object we need to serialize it twice so its wrapped in
    // quotes and inner quotes are escaped
    return JSON.stringify(JSON.stringify(part));
  }
}

export type AmalgamTraceCommand =
  | "LOAD_ENTITY"
  | "VERIFY_ENTITY"
  | "CLONE_ENTITY"
  | "STORE_ENTITY"
  | "EXECUTE_ENTITY_JSON"
  | "SET_JSON_TO_LABEL"
  | "GET_JSON_FROM_LABEL"
  | "SET_RANDOM_SEED"
  | "VERSION"
  | "EXIT";
