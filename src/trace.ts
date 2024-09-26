export class AmalgamTrace {
  constructor(public enabled: boolean) {}

  public log(...msg: string[]): void {
    if (this.enabled) {
      console.log(...msg);
    }
  }

  public log_time(label: string): void {
    if (this.enabled) {
      const timestamp = new Date();
      this.log(`# TIME ${label} ${timestamp.toISOString()}`);
    }
  }

  public log_comment(...comments: string[]): void {
    if (this.enabled) {
      this.log("#", ...comments);
    }
  }

  public log_reply(reply: unknown): void {
    if (this.enabled) {
      this.log("# REPLY >", JSON.stringify(reply));
    }
  }

  public log_command(type: AmalgamTraceCommand, ...parts: unknown[]): void {
    if (this.enabled) {
      this.log(type, ...parts.map((p) => String(p)));
    }
  }
}

export type AmalgamTraceCommand =
  | "LOAD_ENTITY"
  | "VERIFY_ENTITY"
  | "CLONE_ENTITY"
  | "EXECUTE_ENTITY_JSON"
  | "SET_JSON_TO_LABEL"
  | "GET_JSON_FROM_LABEL"
  | "SET_RANDOM_SEED"
  | "VERSION"
  | "EXIT";
