export class AmalgamTrace {
  constructor(
    public enabled: boolean,
    public logger: (...msg: string[]) => void = console.log,
  ) {}

  public log(...msg: string[]): void {
    if (this.enabled) {
      this.logger(...msg);
    }
  }

  public logTime(label: string): void {
    if (this.enabled) {
      const timestamp = new Date();
      this.log(`# TIME ${label} ${timestamp.toISOString()}`);
    }
  }

  public logComment(...comments: string[]): void {
    if (this.enabled) {
      this.log("#", ...comments);
    }
  }

  public logReply(reply: unknown): void {
    if (this.enabled) {
      this.log("# RESULT >b'" + JSON.stringify(reply) + "'");
    }
  }

  public logCommand(type: AmalgamTraceCommand, ...parts: unknown[]): void {
    if (this.enabled) {
      this.log(type, ...parts.map(this.serializePart));
    }
  }

  protected serializePart(part: unknown): string {
    if (part == null) return "null";
    return JSON.stringify(part);
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
