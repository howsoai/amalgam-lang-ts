export declare class AmalgamError extends Error {
    readonly code?: string;
    constructor(message?: string, code?: string);
    get detail(): string;
}
export declare class AmalgamRuntimeError extends AmalgamError {
    constructor(message?: string, code?: string);
}
export declare class AmalgamCoreError extends AmalgamError {
    constructor(message?: string, code?: string);
}
