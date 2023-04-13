export declare class AmalgamWarning {
    readonly detail: string;
    readonly code?: string | undefined;
    constructor(detail?: string, code?: string | undefined);
    get message(): string;
}
export declare class AmalgamCoreWarning extends AmalgamWarning {
}
