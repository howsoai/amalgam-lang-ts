import { Amalgam, type AmalgamModule, type AmalgamOptions } from "../api";
import { AmalgamRuntimeError } from "../errors";
import AmalgamRuntime from "../webassembly/amalgam-st.cjs";
import AmalgamDebugRuntime from "../webassembly/amalgam-st-debug.cjs";

export type { AmalgamOptions } from "../api";

export type CharPtrArray = { basePtr: bigint; ptrs: bigint[]; size: bigint; free: () => void };

export interface AmalgamEmscriptenModule extends EmscriptenModule, AmalgamModule {
  cwrap: typeof cwrap;
  ccall: typeof ccall;
  UTF8ToString: typeof UTF8ToString;
  stringToUTF8: typeof stringToUTF8;
  lengthBytesUTF8: typeof lengthBytesUTF8;
  getValue: typeof getValue;
  setValue: typeof setValue;
  pointerToString: (ptr: number | bigint) => string;
  stringToPointer: (value: string) => bigint;
  allocCharPtrArray: (values: string[] | null) => CharPtrArray;
  FS: typeof FS;
  mainScriptUrlOrBlob: string | URL; // Used to manually set url for multithreaded workers (amalgam-mt.cjs)
}

export async function initRuntime(
  options?: AmalgamOptions,
  runtimeOverrides?: Partial<AmalgamEmscriptenModule>,
): Promise<Amalgam<AmalgamEmscriptenModule>> {
  try {
    const amlg = await AmalgamRuntime<AmalgamEmscriptenModule>(runtimeOverrides);
    assignRuntimeMethods(amlg);
    return new Amalgam(amlg, options);
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : `${reason}`;
    throw new AmalgamRuntimeError(`Failed to instantiate Amalgam runtime: ${message}`, "1000");
  }
}

export async function initDebugRuntime(
  options?: AmalgamOptions,
  runtimeOverrides?: Partial<AmalgamEmscriptenModule>,
): Promise<Amalgam<AmalgamEmscriptenModule>> {
  try {
    const amlg = await AmalgamDebugRuntime<AmalgamEmscriptenModule>(runtimeOverrides);
    assignRuntimeMethods(amlg);
    return new Amalgam(amlg, options);
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : `${reason}`;
    throw new AmalgamRuntimeError(`Failed to instantiate Amalgam debug runtime: ${message}`, "1000");
  }
}

function assignRuntimeMethods(amlg: AmalgamEmscriptenModule) {
  // Note: Due to Memory64 most pointers will be BigInt, but not all methods are typed correctly so we cast
  amlg.pointerToString = function (ptr: number | bigint) {
    // Convert pointer to UTF-8 string value and free memory
    try {
      return amlg.UTF8ToString(Number(ptr));
    } finally {
      amlg._free(BigInt(ptr) as unknown as number);
    }
  };

  amlg.stringToPointer = function (value: string): bigint {
    // Convert UTF-8 string to pointer
    const n = amlg.lengthBytesUTF8(value) + 1;
    const ptr = amlg._malloc(n);
    amlg.stringToUTF8(value, ptr, n);
    return BigInt(ptr);
  };

  amlg.allocCharPtrArray = function (values: string[] | null): CharPtrArray {
    if (values == null) {
      // No array to allocate
      return { basePtr: 0n, ptrs: [], size: 0n, free: () => {} };
    }
    if (values.length == 0) {
      // Allocate empty array
      const basePtr = BigInt(amlg._malloc(8));
      const free = () => {
        amlg._free(basePtr as unknown as number);
      };
      return { basePtr, ptrs: [], size: 0n, free };
    } else {
      // Allocate array with values
      const ptrs = values.map(amlg.stringToPointer);
      const basePtr = BigInt(amlg._malloc(ptrs.length * 8));
      amlg.HEAPU64.set(ptrs, Number(basePtr >> 3n));

      const free = () => {
        ptrs.forEach((p) => amlg._free(p as unknown as number));
        amlg._free(basePtr as unknown as number);
      };
      return { basePtr, ptrs, size: BigInt(ptrs.length), free };
    }
  };

  amlg.loadEntity = function (
    handle: string,
    filePath: string,
    fileType: string,
    persistent: boolean,
    fileParams: string,
    writeLog: string,
    printLog: string,
    entityPath: string[] | null,
  ) {
    // Since the return value is a struct, we must preallocate a pointer for it and pass it in
    // bytes: 1 (loaded) + 7 (padding) + 8 (message) + 8 (version) + 8 (entity_path) + 8 (entity_path_len)
    const structPtr = amlg._malloc(40);
    const {
      basePtr: entityPathInputPtr,
      size: entityPathInputLen,
      free: freeEntityPathInput,
    } = amlg.allocCharPtrArray(entityPath);

    try {
      amlg.ccall(
        "LoadEntity",
        null,
        [
          "number", // struct pointer
          "string", // handle
          "string", // path
          "string", // file_type
          "boolean", // persistent
          "string", // json_file_params
          "string", // write_log
          "string", // print_log
          "number", // entity_path pointer
          "number", // entity_path length
        ],
        [
          BigInt(structPtr) as unknown as number,
          handle,
          filePath,
          fileType,
          persistent,
          fileParams,
          writeLog,
          printLog,
          entityPathInputPtr as unknown as number,
          entityPathInputLen as unknown as number,
        ],
      );
      const messagePtr = amlg.getValue(structPtr + 8, "i64");
      const versionPtr = amlg.getValue(structPtr + 16, "i64");
      const entityPathPtr = amlg.getValue(structPtr + 24, "i64");
      const entityPathLen = amlg.getValue(structPtr + 32, "i64");

      const entityPath: string[] = [];
      for (let i = 0; i < entityPathLen; i++) {
        const indexPtr = BigInt(entityPathPtr) + BigInt(i * 8);
        const valuePtr = amlg.getValue(Number(indexPtr), "i64");
        entityPath.push(amlg.pointerToString(Number(valuePtr)));
      }
      amlg._free(entityPathPtr);

      return {
        loaded: Boolean(amlg.getValue(structPtr, "i8")),
        message: amlg.pointerToString(messagePtr),
        version: amlg.pointerToString(versionPtr),
        entityPath,
      };
    } finally {
      amlg._free(structPtr);
      freeEntityPathInput();
    }
  };

  amlg.cloneEntity = function (...args) {
    const status = amlg.ccall(
      "CloneEntity",
      "boolean",
      [
        "string", // handle
        "string", // clone_handle
        "string", // path
        "string", // file_type
        "boolean", // persistent
        "string", // json_file_params
        "string", // write_log
        "string", // print_log
      ],
      args,
    );
    return status;
  };

  amlg.verifyEntity = function (...args) {
    // Since the return value is a struct, we must preallocate a pointer for it and pass it in
    // bytes: 1 (loaded) + 7 (padding) + 8 (message) + 8 (version) + 8 (entity_path) + 8 (entity_path_len)
    const structPtr = amlg._malloc(40);
    try {
      amlg.ccall(
        "VerifyEntity",
        null,
        [
          "number", // struct pointer
          "string", // path
        ],
        [BigInt(structPtr) as unknown as number, ...args],
      );
      const messagePtr = amlg.getValue(structPtr + 8, "i64");
      const versionPtr = amlg.getValue(structPtr + 16, "i64");
      const entityPathPtr = amlg.getValue(structPtr + 24, "i64");
      const entityPathLen = amlg.getValue(structPtr + 32, "i64");

      const entityPath: string[] = [];
      for (let i = 0; i < entityPathLen; i++) {
        const indexPtr = BigInt(entityPathPtr) + BigInt(i * 8);
        const valuePtr = amlg.getValue(Number(indexPtr), "i64");
        entityPath.push(amlg.pointerToString(Number(valuePtr)));
      }
      amlg._free(entityPathPtr);

      return {
        loaded: Boolean(amlg.getValue(structPtr, "i8")),
        message: amlg.pointerToString(messagePtr),
        version: amlg.pointerToString(versionPtr),
        entityPath,
      };
    } finally {
      amlg._free(structPtr);
    }
  };

  amlg.storeEntity = function (
    handle: string,
    filePath: string,
    fileType: string,
    persistent: boolean,
    fileParams: string,
    entityPath: string[] | null,
  ): void {
    const { basePtr: entityPathPtr, size: entityPathLen, free: freeEntityPath } = amlg.allocCharPtrArray(entityPath);
    try {
      amlg.ccall(
        "StoreEntity",
        null,
        [
          "string", // handle
          "string", // path
          "string", // file_type
          "boolean", // persistent
          "string", // json_file_params
          "number", // entity_path pointer
          "number", // entity_path length
        ],
        [
          handle,
          filePath,
          fileType,
          persistent,
          fileParams,
          entityPathPtr as unknown as number,
          entityPathLen as unknown as number,
        ],
      );
    } finally {
      freeEntityPath();
    }
  };
  amlg.executeEntity = amlg.cwrap("ExecuteEntity", null, ["string", "string"]);
  amlg.executeEntityJson = function (...args) {
    const ptr = amlg.ccall("ExecuteEntityJsonPtr", "number", ["string", "string", "string"], args);
    return amlg.pointerToString(ptr);
  };
  amlg.destroyEntity = amlg.cwrap("DestroyEntity", null, ["string"]);
  amlg.getEntities = function () {
    const sizePtr = amlg._malloc(8); // allocate for uint64_t
    const entitiesPtr = amlg.ccall(
      "GetEntities",
      "number",
      ["number"],
      [BigInt(sizePtr) as unknown as number],
    ) as unknown as bigint;
    const entityPointers: number[] = [];

    try {
      // Get array size from pointer
      const numEntities = Number(amlg.getValue(sizePtr, "i64"));

      // Get array values
      const entities: string[] = [];
      for (let i = 0; i < numEntities; i++) {
        const indexPtr = BigInt(entitiesPtr) + BigInt(i * 8);
        const valuePtr = amlg.getValue(Number(indexPtr), "i64");
        const value = amlg.UTF8ToString(Number(valuePtr));
        entities.push(value);
        entityPointers.push(Number(valuePtr));
      }

      return entities;
    } finally {
      // Free memory
      entityPointers.forEach((ptr) => amlg._free(ptr));
      amlg._free(sizePtr);
      amlg._free(entitiesPtr as unknown as number);
    }
  };

  amlg.setRandomSeed = amlg.cwrap("SetRandomSeed", "boolean", ["string", "string"]);

  amlg.setJsonToLabel = amlg.cwrap("SetJSONToLabel", null, ["string", "string", "string"]);
  amlg.getJsonFromLabel = function (...args) {
    const ptr = amlg.ccall("GetJSONPtrFromLabel", "number", ["string", "string"], args);
    return amlg.pointerToString(ptr);
  };

  amlg.setSBFDatastoreEnabled = amlg.cwrap("SetSBFDataStoreEnabled", null, ["boolean"]);
  amlg.isSBFDatastoreEnabled = amlg.cwrap("IsSBFDataStoreEnabled", "boolean", []);

  amlg.setMaxNumThreads = amlg.cwrap("SetMaxNumThreads", null, ["number"]);
  amlg.getMaxNumThreads = amlg.cwrap("GetMaxNumThreads", "number", []);

  amlg.setEntityPermissions = amlg.cwrap("SetEntityPermissions", "boolean", ["string", "string"]);
  amlg.getEntityPermissions = function (...args) {
    const ptr = amlg.ccall("GetEntityPermissions", "number", ["string"], args);
    return amlg.pointerToString(ptr);
  };

  amlg.getVersion = function () {
    const ptr = amlg.ccall("GetVersionString", "number", [], []);
    return amlg.pointerToString(ptr);
  };
  amlg.getConcurrencyType = function () {
    const ptr = amlg.ccall("GetConcurrencyTypeString", "number", [], []);
    return amlg.pointerToString(ptr);
  };
}
