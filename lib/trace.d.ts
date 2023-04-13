export declare class AmalgamTrace {
    enabled: boolean;
    constructor(enabled: boolean);
    log(...msg: string[]): void;
    log_time(label: string): void;
    log_comment(...comments: string[]): void;
    log_reply(reply: unknown): void;
    log_command(type: AmalgamTraceCommand, ...parts: unknown[]): void;
}
export type AmalgamTraceCommand = "LOAD_ENTITY" | "EXECUTE_ENTITY_JSON" | "SET_JSON_TO_LABEL" | "GET_JSON_FROM_LABEL" | "SET_RANDOM_SEED" | "VERSION" | "EXIT";
