import { AmalgamTrace } from "./trace";
// Add cloneEntity,

export interface AmalgamModule {
  loadEntity(
    handle: string,
    uri: string,
    persistent: boolean,
    loadContainedEntities: boolean,
    escapeFilename: boolean,
    escapeContainedFilenames: boolean,
    writeLog: string,
    printLog: string,
  ): boolean;
  storeEntity(handle: string, uri: string, updatePersistenceLocation?: boolean, storeContainedEntities?: boolean): void;
  executeEntity(handle: string, label: string): void;
  executeEntityJson(handle: string, label: string, json: string): string;
  destroyEntity(handle: string): void;
  getEntities(): string[];
  setRandomSeed(handle: string, seed: string): boolean;
  setJsonToLabel(handle: string, label: string, json: string): void;
  getJsonFromLabel(handle: string, label: string): string;
  setSBFDatastoreEnabled(enabled: boolean): void;
  isSBFDatastoreEnabled(): boolean;
  getVersion(): string;
  setMaxNumThreads(threads: number): void;
  getMaxNumThreads(): number;
  getConcurrencyType(): string;
}

export interface AmalgamOptions {
  trace?: boolean | AmalgamTrace;
  sbfDatastoreEnabled?: boolean;
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
    escapeFilename = false,
    escapeContainedFilenames = false,
    writeLog = "",
    printLog = "",
  ): boolean {
    this.trace.log_command("LOAD_ENTITY", handle, uri, persistent, loadContainedEntities, writeLog, printLog);
    const result = this.runtime.loadEntity(
      handle,
      uri,
      persistent,
      loadContainedEntities,
      escapeFilename,
      escapeContainedFilenames,
      writeLog,
      printLog,
    );
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

  public executeEntityJson<D = unknown, R = unknown>(handle: string, label: string, data: D): R | null {
    const payload = JSON.stringify(data ?? null);
    this.trace.log_time("EXECUTION START");
    this.trace.log_command("EXECUTE_ENTITY_JSON", handle, label, payload);
    const result = this.runtime.executeEntityJson(handle, label, payload);
    this.trace.log_time("EXECUTION STOP");
    this.trace.log_reply(result);
    if (!result) return null;
    return JSON.parse(result);
  }

  public destroyEntity(handle: string): void {
    this.trace.log_comment("CALL > DestroyEntity");
    this.runtime.destroyEntity(handle);
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
    const payload = JSON.stringify(data ?? null);
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
    return Number(this.runtime.getMaxNumThreads());
  }

  public getConcurrencyType(): string {
    return this.runtime.getConcurrencyType();
  }
}
