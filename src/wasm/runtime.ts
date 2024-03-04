import { Amalgam, type AmalgamModule, type AmalgamOptions } from "../api";
import { AmalgamRuntimeError } from "../errors";
import AmalgamRuntime from "../../webassembly/amalgam-st.js";

export type { AmalgamOptions } from "../api";

export interface AmalgamEmscriptenModule extends EmscriptenModule, AmalgamModule {
  cwrap: typeof cwrap;
  ccall: typeof ccall;
  UTF8ToString: typeof UTF8ToString;
  getValue: typeof getValue;
  setValue: typeof setValue;
  pointerToString: (ptr: number | bigint) => string;
  FS: typeof FS;
  mainScriptUrlOrBlob: string | URL; // Used to manually set url for multithreaded workers (amalgam-mt.cjs)
}

export async function initRuntime(
  options?: AmalgamOptions,
  runtimeOverrides?: Partial<AmalgamEmscriptenModule>,
): Promise<Amalgam<AmalgamEmscriptenModule>> {
  try {
    // Note: Due to Memory64 most pointers will be BigInt, but not all methods are typed correctly so we cast

    const amlg = await AmalgamRuntime<AmalgamEmscriptenModule>(runtimeOverrides);

    amlg.pointerToString = function (ptr: number | bigint) {
      // Convert pointer to UTF-8 string value and free memory
      let value: string;
      try {
        value = amlg.UTF8ToString(Number(ptr));
      } finally {
        amlg._free(ptr as unknown as number);
      }
      return value;
    };

    amlg.loadEntity = function (...args) {
      // TODO #19512: Support LoadEntityStatus struct of LoadEntity
      const status = amlg.ccall(
        "LoadEntityLegacy",
        "boolean",
        ["string", "string", "boolean", "boolean", "string", "string"],
        args,
      );
      return status;
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
  } catch (e) {
    throw new AmalgamRuntimeError("Failed to instantiate Amalgam runtime.", "1000");
  }
}
