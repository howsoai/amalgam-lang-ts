import { AmalgamCoreError } from "./errors.js";
import { AmalgamTrace } from "./trace.js";
import { AmalgamCoreWarning } from "./warnings.js";
export interface AmalgamModule {
    loadEntity(handle: string, uri: string, persistent: boolean, loadContainedEntities: boolean, writeLog: string, printLog: string): boolean;
    storeEntity(handle: string, uri: string, updatePersistenceLocation?: boolean, storeContainedEntities?: boolean): void;
    executeEntity(handle: string, label: string): void;
    executeEntityJson(handle: string, label: string, json: string): string;
    deleteEntity(handle: string): void;
    getEntities(): string[];
    setRandomSeed(handle: string, seed: string): boolean;
    setJsonToLabel(handle: string, label: string, json: string): void;
    getJsonFromLabel(handle: string, label: string): string;
    setSBFDatastoreEnabled(enabled: boolean): void;
    isSBFDatastoreEnabled(): boolean;
    getVersion(): string;
    setMaxNumThreads(threads: number): void;
    getMaxNumThreads(): number;
}
export interface AmalgamOptions {
    trace?: boolean | AmalgamTrace;
    sbfDatastoreEnabled?: boolean;
}
export interface AmalgamCoreResponse<R = unknown> {
    content: R;
    errors: AmalgamCoreError[];
    warnings: AmalgamCoreWarning[];
}
export declare class Amalgam<T extends AmalgamModule = AmalgamModule> {
    readonly runtime: T;
    readonly options: AmalgamOptions;
    private readonly trace;
    constructor(runtime: T, options?: AmalgamOptions);
    getVersion(): string;
    loadEntity(handle: string, uri: string, persistent?: boolean, loadContainedEntities?: boolean, writeLog?: string, printLog?: string): boolean;
    storeEntity(handle: string, uri: string, updatePersistenceLocation?: boolean, storeContainedEntities?: boolean): void;
    executeEntity(handle: string, label: string): void;
    executeEntityJson<D = unknown, R = unknown>(handle: string, label: string, data: D): AmalgamCoreResponse<R>;
    executeEntityJsonRaw(handle: string, label: string, payload: string): string;
    deleteEntity(handle: string): void;
    getEntities(): string[];
    setRandomSeed(handle: string, seed: string): boolean;
    setJsonToLabel<D = unknown>(handle: string, label: string, data: D): void;
    getJsonFromLabel<R = unknown>(handle: string, label: string): R | null;
    setSBFDatastoreEnabled(enabled: boolean): void;
    isSBFDatastoreEnabled(): boolean;
    setMaxNumThreads(threads: number): void;
    getMaxNumThreads(): number;
    protected serialize<D = unknown>(payload: D): string;
    protected deserialize<R = unknown>(payload: string | null): AmalgamCoreResponse<R>;
}
