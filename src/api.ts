import { AmalgamTrace } from "./trace";
import { Logger, nullLogger } from "./utilities";

export interface AmalgamModule {
  loadEntity(
    handle: string,
    filePath: string,
    fileType: string,
    persistent: boolean,
    fileParams: string,
    writeLog: string,
    printLog: string,
  ): EntityStatus;
  cloneEntity(
    handle: string,
    cloneHandle: string,
    filePath: string,
    fileType: string,
    persistent: boolean,
    fileParams: string,
    writeLog: string,
    printLog: string,
  ): boolean;
  verifyEntity(filePath: string): EntityStatus;
  storeEntity(handle: string, filePath: string, fileType: string, persistent: boolean, fileParams: string): void;
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
  /**
   * This options may be used to create a custom AmalgamTrace handler, such as a file logger.
   * If not supplied an AmalgamTrace will be created automatically and enabled only if true.
   * This automatic logger will use the `logger` option's `debug` method automatically. */
  trace?: boolean | AmalgamTrace;
  sbfDatastoreEnabled?: boolean;
  /**
   * A common set of logging interfaces. For most applications, simple `console` may suffice.
   * Default: A set of null functions.
   */
  logger?: Logger;
}

/** Base options for entity files.  */
export type EntityFileOptions = {
  /** The path to the entity file. */
  filePath: string;
  /** The type of file. Defaults to using file extension if not set. */
  fileType?: string;
  /**
   * A mapping of key-value pairs which are parameters specific to the file type.
   * See Amalgam documentation for details of allowed parameters.
   */
  fileParams?: Record<string, unknown>;
  /** If true, all transactions will trigger the entity to be persisted at the source file path. */
  persistent?: boolean;
};

/** Parameters for loadEntity. */
export type LoadEntityOptions = EntityFileOptions & {
  /** A unique handle to assign to this entity. */
  handle: string;
  /** File path for writing a write log. */
  writeLog?: string;
  /** File path for writing a print log. */
  printLog?: string;
};

/** Parameters for storeEntity. */
export type StoreEntityOptions = EntityFileOptions & {
  /** The entity handle. */
  handle: string;
};

/** Parameters for cloneEntity. */
export type CloneEntityOptions = Partial<EntityFileOptions> & {
  /** The source entity handle. */
  handle: string;
  /** The cloned entity handle. */
  cloneHandle: string;
  /** File path for writing a write log. */
  writeLog?: string;
  /** File path for writing a print log. */
  printLog?: string;
};

export class Amalgam<T extends AmalgamModule = AmalgamModule> {
  private readonly trace: AmalgamTrace;
  protected readonly logger: Logger;

  constructor(
    readonly runtime: T,
    readonly options: AmalgamOptions = {},
  ) {
    this.logger = options.logger || nullLogger;
    const { sbfDatastoreEnabled = true, trace = false } = options;
    if (trace == null || typeof trace === "boolean") {
      this.trace = new AmalgamTrace(trace, this.logger.debug);
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
    this.trace.logComment("VERSION >", version);
    return version;
  }

  /**
   * Load an entity from file.
   * @param options The load parameters.
   * @returns True if the entity was loaded successfully.
   */
  public loadEntity(options: LoadEntityOptions): EntityStatus {
    const { handle, filePath, fileType = "", persistent = false, writeLog = "", printLog = "" } = options;
    const fileParams = this.serializeParams(options.fileParams);
    this.trace.logCommand("LOAD_ENTITY", handle, filePath, fileType, persistent, fileParams, writeLog, printLog);
    const result = this.runtime.loadEntity(handle, filePath, fileType, persistent, fileParams, writeLog, printLog);
    this.trace.logReply(result);
    return result;
  }

  /**
   * Verify an entity from an Amalgam source file.
   * @param filePath The file path to the entity.
   * @returns The status of the entity.
   */
  public verifyEntity(filePath: string): EntityStatus {
    this.trace.logCommand("VERIFY_ENTITY", filePath);
    const result = this.runtime.verifyEntity(filePath);
    this.trace.logReply(result);
    return result;
  }

  /**
   * Clone an existing entity to a new handle.
   * @param options The clone parameters.
   * @returns True if the entity was cloned successfully.
   */
  public cloneEntity(options: CloneEntityOptions): boolean {
    const {
      handle,
      cloneHandle,
      filePath = "",
      fileType = "",
      persistent = false,
      writeLog = "",
      printLog = "",
    } = options;
    const fileParams = this.serializeParams(options.fileParams);
    this.trace.logCommand(
      "CLONE_ENTITY",
      handle,
      cloneHandle,
      filePath,
      fileType,
      persistent,
      fileParams,
      writeLog,
      printLog,
    );
    const result = this.runtime.cloneEntity(
      handle,
      cloneHandle,
      filePath,
      fileType,
      persistent,
      fileParams,
      writeLog,
      printLog,
    );
    this.trace.logReply(result);
    return result;
  }

  /**
   * Store an entity to file.
   * @param options The store parameters.
   */
  public storeEntity(options: StoreEntityOptions): void {
    const { handle, filePath, fileType = "", persistent = false } = options;
    const fileParams = this.serializeParams(options.fileParams);
    this.trace.logCommand("STORE_ENTITY", handle, filePath, fileType, persistent, fileParams);
    this.runtime.storeEntity(handle, filePath, fileType, persistent, fileParams);
  }

  /**
   * Execute a label on an entity.
   * @param handle The entity handle.
   * @param label The label to execute.
   */
  public executeEntity(handle: string, label: string): void {
    this.trace.logComment("CALL > ExecuteEntity");
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
    const payload = data ?? null;
    this.trace.logTime("EXECUTION START");
    this.trace.logCommand("EXECUTE_ENTITY_JSON", handle, label, payload);
    const result = this.runtime.executeEntityJson(handle, label, JSON.stringify(payload));
    this.trace.logTime("EXECUTION STOP");
    this.trace.logReply(result);
    if (!result) return null;
    return JSON.parse(result);
  }

  /**
   * Unloads an entity.
   * @param handle The entity handle.
   */
  public destroyEntity(handle: string): void {
    this.trace.logComment("CALL > DestroyEntity");
    this.runtime.destroyEntity(handle);
  }

  /**
   * Get handles of all loaded entities.
   * @returns A list of entity handles.
   */
  public getEntities(): string[] {
    this.trace.logComment("CALL > GetEntities");
    return this.runtime.getEntities();
  }

  /**
   * Set the random seed.
   * @param handle The entity handle.
   * @param seed The new seed.
   * @returns True if the set was successful.
   */
  public setRandomSeed(handle: string, seed: string): boolean {
    this.trace.logCommand("SET_RANDOM_SEED", seed);
    const result = this.runtime.setRandomSeed(handle, seed);
    this.trace.logReply(result);
    return result;
  }

  /**
   * Set a label in Amalgam using json.
   * @param handle The entity handle.
   * @param label The label name.
   * @param data The data to assign to the label.
   */
  public setJsonToLabel<D = unknown>(handle: string, label: string, data: D): void {
    const payload = data ?? null;
    this.trace.logCommand("SET_JSON_TO_LABEL", handle, label, payload);
    this.runtime.setJsonToLabel(handle, label, JSON.stringify(payload));
  }

  /**
   * Get a label from Amalgam and returns it in json format.
   * @param handle The entity handle.
   * @param label The label name.
   * @returns The label data.
   */
  public getJsonFromLabel<R = unknown>(handle: string, label: string): R | null {
    this.trace.logCommand("GET_JSON_FROM_LABEL", handle, label);
    const result = this.runtime.getJsonFromLabel(handle, label);
    this.trace.logReply(result);
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

  /**
   * Serialize JSON parameter value for passing to Amalgam runtime.
   * @param params The parameters to serialize.
   * @returns The stringified parameter value.
   */
  protected serializeParams(params: Record<string, unknown> | null | undefined): string {
    if (params != null) {
      return JSON.stringify(params);
    }
    return JSON.stringify(null);
  }
}
