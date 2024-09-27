import { Amalgam, AmalgamEmscriptenModule, type AmalgamOptions } from "../../api";
import { AmalgamRuntimeError } from "../../errors";

export async function initCoreRuntime(
  amlg: AmalgamEmscriptenModule,
  options?: AmalgamOptions,
): Promise<Amalgam<AmalgamEmscriptenModule>> {
  try {
    // Note: Due to Memory64 most pointers will be BigInt, but not all methods are typed correctly so we cast

    amlg.pointerToString = function (ptr: number | bigint) {
      // Convert pointer to UTF-8 string value and free memory
      try {
        return amlg.UTF8ToString(Number(ptr));
      } finally {
        amlg._free(BigInt(ptr) as unknown as number);
      }
    };

    amlg.loadEntity = function (...args) {
      // Since the return value is a struct, we must preallocate a pointer for it and pass it in
      // 1 byte (loaded) + 7 bytes (padding) + 8 bytes (message) + 8 bytes (version)
      const structPtr = amlg._malloc(24);
      try {
        amlg.ccall(
          "LoadEntity",
          null,
          [
            "number", // struct pointer
            "string", // handle
            "string", // path
            "boolean", // persistent
            "boolean", // load_contained
            "boolean", // escape_filename
            "boolean", // escape_contained_filenames
            "string", // write_log
            "string", // print_log
          ],
          [BigInt(structPtr) as unknown as number, ...args],
        );
        const messagePtr = amlg.getValue(structPtr + 8, "i64");
        const versionPtr = amlg.getValue(structPtr + 16, "i64");
        return {
          loaded: Boolean(amlg.getValue(structPtr, "i8")),
          message: amlg.pointerToString(messagePtr),
          version: amlg.pointerToString(versionPtr),
        };
      } finally {
        amlg._free(structPtr);
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
          "boolean", // persistent
          "string", // write_log
          "string", // print_log
        ],
        args,
      );
      return status;
    };

    amlg.verifyEntity = function (...args) {
      // Since the return value is a struct, we must preallocate a pointer for it and pass it in
      // 1 byte (loaded) + 7 bytes (padding) + 8 bytes (message) + 8 bytes (version)
      const structPtr = amlg._malloc(24);
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
        return {
          loaded: Boolean(amlg.getValue(structPtr, "i8")),
          message: amlg.pointerToString(messagePtr),
          version: amlg.pointerToString(versionPtr),
        };
      } finally {
        amlg._free(structPtr);
      }
    };

    amlg.storeEntity = amlg.cwrap("StoreEntity", null, ["string", "string", "boolean", "boolean"]);
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

    amlg.getVersion = function () {
      const ptr = amlg.ccall("GetVersionString", "number", [], []);
      return amlg.pointerToString(ptr);
    };
    amlg.getConcurrencyType = function () {
      const ptr = amlg.ccall("GetConcurrencyTypeString", "number", [], []);
      return amlg.pointerToString(ptr);
    };

    return new Amalgam(amlg, options);
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : `${reason}`;
    throw new AmalgamRuntimeError(`Failed to instantiate Amalgam runtime: ${message}`, "1000");
  }
}
