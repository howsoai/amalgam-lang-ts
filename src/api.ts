import { AmalgamError, AmalgamCoreError } from "./errors.js";
import { AmalgamTrace } from "./trace.js";
import { AmalgamCoreWarning } from "./warnings.js";

export interface AmalgamModule {
  loadEntity(
    handle: string,
    uri: string,
    persistent: boolean,
    loadContainedEntities: boolean,
    writeLog: string,
    printLog: string,
  ): boolean;
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

export class Amalgam<T extends AmalgamModule = AmalgamModule> {
  private readonly trace: AmalgamTrace;

  constructor(
    readonly runtime: T,
    readonly options: AmalgamOptions = {},
  ) {
    const { sbfDatastoreEnabled = true, trace = false } = options;
    if (trace == null || typeof trace === "boolean") {
      this.trace = new AmalgamTrace(trace);
    } else {
      this.trace = trace;
    }
    this.setSBFDatastoreEnabled(sbfDatastoreEnabled);
  }

  public getVersion(): string {
    const version = this.runtime.getVersion();
    this.trace.log_comment("VERSION >", version);
    return version;
  }

  public loadEntity(
    handle: string,
    uri: string,
    persistent = false,
    loadContainedEntities = false,
    writeLog = "",
    printLog = "",
  ): boolean {
    this.trace.log_command("LOAD_ENTITY", handle, uri, persistent, loadContainedEntities, writeLog, printLog);
    const result = this.runtime.loadEntity(handle, uri, persistent, loadContainedEntities, writeLog, printLog);
    this.trace.log_reply(result);
    return result;
  }

  public storeEntity(
    handle: string,
    uri: string,
    updatePersistenceLocation = false,
    storeContainedEntities = true,
  ): void {
    this.trace.log_comment("CALL > StoreEntity");
    this.runtime.storeEntity(handle, uri, updatePersistenceLocation, storeContainedEntities);
  }

  public executeEntity(handle: string, label: string): void {
    this.trace.log_comment("CALL > ExecuteEntity");
    this.runtime.executeEntity(handle, label);
  }

  public executeEntityJson<D = unknown, R = unknown>(handle: string, label: string, data: D): AmalgamCoreResponse<R> {
    const payload = this.serialize<D>(data);
    const result = this.executeEntityJsonRaw(handle, label, payload);
    return this.deserialize<R>(result);
  }

  public executeEntityJsonRaw(handle: string, label: string, payload: string): string {
    this.trace.log_time("EXECUTION START");
    this.trace.log_command("EXECUTE_ENTITY_JSON", handle, label, payload);
    const result = this.runtime.executeEntityJson(handle, label, payload);
    this.trace.log_time("EXECUTION STOP");
    this.trace.log_reply(result);
    return result;
  }

  public deleteEntity(handle: string): void {
    this.trace.log_comment("CALL > DeleteEntity");
    this.runtime.deleteEntity(handle);
  }

  public getEntities(): string[] {
    this.trace.log_comment("CALL > GetEntities");
    return this.runtime.getEntities();
  }

  public setRandomSeed(handle: string, seed: string): boolean {
    this.trace.log_command("SET_RANDOM_SEED", seed);
    const result = this.runtime.setRandomSeed(handle, seed);
    this.trace.log_reply(result);
    return result;
  }

  public setJsonToLabel<D = unknown>(handle: string, label: string, data: D): void {
    const payload = this.serialize<D>(data);
    this.trace.log_command("SET_JSON_TO_LABEL", handle, label, payload);
    this.runtime.setJsonToLabel(handle, label, payload);
  }

  public getJsonFromLabel<R = unknown>(handle: string, label: string): R | null {
    this.trace.log_command("GET_JSON_FROM_LABEL", handle, label);
    const result = this.runtime.getJsonFromLabel(handle, label);
    this.trace.log_reply(result);
    if (!result) return null;
    return JSON.parse(result);
  }

  public setSBFDatastoreEnabled(enabled: boolean): void {
    this.runtime.setSBFDatastoreEnabled(enabled);
  }

  public isSBFDatastoreEnabled(): boolean {
    return this.runtime.isSBFDatastoreEnabled();
  }

  public setMaxNumThreads(threads: number): void {
    this.runtime.setMaxNumThreads(threads);
  }

  public getMaxNumThreads(): number {
    return this.runtime.getMaxNumThreads();
  }

  /**
   * Serialize a core request.
   * @param payload The core payload to serialize.
   * @returns The core payload as JSON.
   */
  protected serialize<D = unknown>(payload: D): string {
    if (!payload) {
      return JSON.stringify({});
    }

    // Remove null properties from payload
    const filtered = { ...payload };
    for (const key in filtered) {
      if (filtered[key] == null) {
        delete filtered[key];
      }
    }

    return JSON.stringify(filtered);
  }

  /**
   * Deserialize a core response.
   * @param payload The core JSON payload to deserialize.
   * @returns The deserialized value.
   */
  protected deserialize<R = unknown>(payload: string | null): AmalgamCoreResponse<R> {
    if (!payload) {
      throw new AmalgamError("Null or empty response received from core.");
    }

    const deserialized_payload = JSON.parse(payload);

    if (deserialized_payload?.constructor == Object) {
      const errors: AmalgamCoreError[] = [];
      const warnings: AmalgamCoreWarning[] = [];

      // Collect warnings
      if (deserialized_payload.warnings?.length > 0) {
        for (const w of deserialized_payload.warnings) {
          warnings.push(new AmalgamCoreWarning(w?.detail, w?.code));
        }
      }

      // Collect errors
      if (deserialized_payload.status !== "ok") {
        if (deserialized_payload.errors?.length > 0) {
          for (const e of deserialized_payload.errors) {
            errors.push(new AmalgamCoreError(e?.detail, e?.code));
          }
        } else {
          errors.push(new AmalgamCoreError("An unknown error occurred."));
        }
        return { errors, warnings, content: deserialized_payload.payload };
      }

      return {
        errors,
        warnings,
        content: deserialized_payload.payload,
      };
    } else if (["string", "number", "bigint", "boolean"].indexOf(typeof deserialized_payload) != -1) {
      return { errors: [], warnings: [], content: deserialized_payload };
    }

    throw new AmalgamError("Malformed response received from core.");
  }
}
