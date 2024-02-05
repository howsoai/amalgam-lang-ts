import { Amalgam, AmalgamModule, AmalgamOptions } from "../api.js";
import { AmalgamRuntimeError } from "../errors.js";
import AmalgamRuntime from "../../webassembly/amalgam-st.js";

export { AmalgamOptions } from "../api.js";

export interface AmalgamEmscriptenModule extends EmscriptenModule, AmalgamModule {
  cwrap: typeof cwrap;
  ccall: typeof ccall;
  FS: typeof FS;
  mainScriptUrlOrBlob: string | URL; // Used to manually set url for multithreaded workers (amalgam-mt.cjs)
}

export async function initRuntime(
  options?: AmalgamOptions,
  runtimeOverrides?: Partial<AmalgamEmscriptenModule>,
): Promise<Amalgam<AmalgamEmscriptenModule>> {
  try {
    const amlg = await AmalgamRuntime<AmalgamEmscriptenModule>(runtimeOverrides);

    // eslint-disable-next-line prettier/prettier
    amlg.loadEntity = amlg.cwrap("LoadEntity", "boolean", ["string", "string", "boolean", "boolean", "string", "string"]);
    amlg.storeEntity = amlg.cwrap("StoreEntity", null, ["string", "string", "boolean", "boolean"]);
    amlg.executeEntity = amlg.cwrap("ExecuteEntity", null, ["string", "string"]);
    amlg.executeEntityJson = amlg.cwrap("ExecuteEntityJsonPtr", "string", ["string", "string", "string"]);
    amlg.deleteEntity = amlg.cwrap("DeleteEntity", null, ["string"]);
    amlg.getEntities = function () {
      throw new Error("Method 'getEntities' not implemented");
    };
    amlg.setRandomSeed = amlg.cwrap("SetRandomSeed", "boolean", ["string", "string"]);

    amlg.setJsonToLabel = amlg.cwrap("SetJSONToLabel", null, ["string", "string", "string"]);
    amlg.getJsonFromLabel = amlg.cwrap("GetJSONPtrFromLabel", "string", ["string", "string"]);

    amlg.setSBFDatastoreEnabled = amlg.cwrap("SetSBFDataStoreEnabled", null, ["boolean"]);
    amlg.isSBFDatastoreEnabled = amlg.cwrap("IsSBFDataStoreEnabled", "boolean", []);

    amlg.getVersion = amlg.cwrap("GetVersionString", "string", []);
    amlg.setMaxNumThreads = amlg.cwrap("SetMaxNumThreads", null, ["number"]);
    amlg.getMaxNumThreads = amlg.cwrap("GetMaxNumThreads", "number", []);

    return new Amalgam(amlg, options);
  } catch (e) {
    throw new AmalgamRuntimeError("Failed to instantiate Amalgam runtime.", "1000");
  }
}
