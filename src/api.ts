import { AmalgamTrace } from "./trace";

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
  ): EntityStatus;
  cloneEntity(
    handle: string,
    cloneHandle: string,
    amlgPath: string,
    persist: boolean,
    writeLog: string,
    printLog: string,
  ): boolean;
  verifyEntity(uri: string): EntityStatus;
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

export interface EntityStatus {
  loaded: boolean;
  message: string;
  version: string;
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

  /**
   * Get the version of Amalgam.
   * @returns The Amalgam version string.
   */
  public getVersion(): string {
    const version = this.runtime.getVersion();
    this.trace.log_comment("VERSION >", version);
    return version;
  }

  /**
   * Load an entity from file.
   * @param handle The handle to use for the entity.
   * @param uri The file path to the entity.
   * @param persistent If true, all transactions will trigger the entity to be persisted at the source uri.
   * @param loadContainedEntities If set to true, contained entities will be loaded.
   * @param escapeFilename If set to true, the file name will be aggressively escaped.
   * @param escapeContainedFilenames If set to true, file names of contained entities will be aggressively escaped.
   * @param writeLog File path for writing a write log. Empty string disables this feature.
   * @param printLog File path for writing a print log. Empty string disables this feature.
   * @returns True if the entity was loaded successfully.
   */
  public loadEntity(
    handle: string,
    uri: string,
    persistent = false,
    loadContainedEntities = false,
    escapeFilename = false,
    escapeContainedFilenames = false,
    writeLog = "",
    printLog = "",
  ): EntityStatus {
    this.trace.log_command(
      "LOAD_ENTITY",
      handle,
      uri,
      persistent,
      loadContainedEntities,
      escapeFilename,
      escapeContainedFilenames,
      writeLog,
      printLog,
    );
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

  /**
   * Verify an entity from an Amalgam source file.
   * @param uri The file path to the entity.
   * @returns The status of the entity.
   */
  public verifyEntity(uri: string): EntityStatus {
    this.trace.log_command("VERIFY_ENTITY", uri);
    const result = this.runtime.verifyEntity(uri);
    this.trace.log_reply(result);
    return result;
  }

  /**
   * Clone an existing entity to a new handle.
   * @param handle The source entity handle.
   * @param cloneHandle The new entity handle.
   * @param uri A file path to persist the new entity to. Ignored unless persistent is true.
   * @param persistent If true, all transactions will trigger the entity to be persisted at the given uri.
   * @param writeLog File path for writing a write log. An empty string disables this feature.
   * @param printLog File path for writing a print log. An empty string disables this feature.
   * @returns True if the entity was cloned successfully.
   */
  public cloneEntity(
    handle: string,
    cloneHandle: string,
    uri = "",
    persistent = false,
    writeLog = "",
    printLog = "",
  ): boolean {
    this.trace.log_command("CLONE_ENTITY", handle, cloneHandle, uri, persistent, writeLog, printLog);
    const result = this.runtime.cloneEntity(handle, cloneHandle, uri, persistent, writeLog, printLog);
    this.trace.log_reply(result);
    return result;
  }

  /**
   * Store an entity to file.
   * @param handle The handle of the entity.
   * @param uri The file path to persist to.
   * @param updatePersistenceLocation If true, updates location entity is persisted to.
   * @param storeContainedEntities If true, contained entities will also be persisted.
   */
  public storeEntity(
    handle: string,
    uri: string,
    updatePersistenceLocation = false,
    storeContainedEntities = true,
  ): void {
    this.trace.log_comment("CALL > StoreEntity");
    this.runtime.storeEntity(handle, uri, updatePersistenceLocation, storeContainedEntities);
  }

  /**
   * Execute a label on an entity.
   * @param handle The entity handle.
   * @param label The label to execute.
   */
  public executeEntity(handle: string, label: string): void {
    this.trace.log_comment("CALL > ExecuteEntity");
    this.runtime.executeEntity(handle, label);
  }

  /**
   * Execute a label on an entity with parameters.
   * @param handle The entity handle.
   * @param label The label to execute.
   * @param data The parameter data to pass to the label.
   * @returns The result of the label execution.
   */
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

  /**
   * Unloads an entity.
   * @param handle The entity handle.
   */
  public destroyEntity(handle: string): void {
    this.trace.log_comment("CALL > DestroyEntity");
    this.runtime.destroyEntity(handle);
  }

  /**
   * Get handles of all loaded entities.
   * @returns A list of entity handles.
   */
  public getEntities(): string[] {
    this.trace.log_comment("CALL > GetEntities");
    return this.runtime.getEntities();
  }

  /**
   * Set the random seed.
   * @param handle The entity handle.
   * @param seed The new seed.
   * @returns True if the set was successful.
   */
  public setRandomSeed(handle: string, seed: string): boolean {
    this.trace.log_command("SET_RANDOM_SEED", seed);
    const result = this.runtime.setRandomSeed(handle, seed);
    this.trace.log_reply(result);
    return result;
  }

  /**
   * Set a label in Amalgam using json.
   * @param handle The entity handle.
   * @param label The label name.
   * @param data The data to assign to the label.
   */
  public setJsonToLabel<D = unknown>(handle: string, label: string, data: D): void {
    const payload = JSON.stringify(data ?? null);
    this.trace.log_command("SET_JSON_TO_LABEL", handle, label, payload);
    this.runtime.setJsonToLabel(handle, label, payload);
  }

  /**
   * Get a label from Amalgam and returns it in json format.
   * @param handle The entity handle.
   * @param label The label name.
   * @returns The label data.
   */
  public getJsonFromLabel<R = unknown>(handle: string, label: string): R | null {
    this.trace.log_command("GET_JSON_FROM_LABEL", handle, label);
    const result = this.runtime.getJsonFromLabel(handle, label);
    this.trace.log_reply(result);
    if (!result) return null;
    return JSON.parse(result);
  }

  /**
   * Set if SBF datastore is enabled.
   * @param enabled If SBF tree structures should be enabled.
   */
  public setSBFDatastoreEnabled(enabled: boolean): void {
    this.runtime.setSBFDatastoreEnabled(enabled);
  }

  /**
   * Get if SBF datastore is enabled.
   * @returns True if SBF tree structures are currently enabled.
   */
  public isSBFDatastoreEnabled(): boolean {
    return this.runtime.isSBFDatastoreEnabled();
  }

  /**
   * Set the maximum number of threads Amalgam may utilize.
   * @param threads The number of threads.
   */
  public setMaxNumThreads(threads: number): void {
    this.runtime.setMaxNumThreads(threads);
  }

  /**
   * Get the maximum number of threads Amalgam may utilize.
   * @returns The number of threads.
   */
  public getMaxNumThreads(): number {
    return Number(this.runtime.getMaxNumThreads());
  }

  /**
   * Get the concurrency type used by the loaded Amalgam library.
   * @returns The library concurrency type.
   */
  public getConcurrencyType(): string {
    return this.runtime.getConcurrencyType();
  }
}
