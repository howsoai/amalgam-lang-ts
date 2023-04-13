var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Amalgam } from "../api.js";
import { AmalgamRuntimeError } from "../errors.js";
import AmalgamRuntime from "../../webassembly/amalgam-st.cjs";
export function initRuntime(options) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const amlg = yield AmalgamRuntime();
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
        }
        catch (e) {
            throw new AmalgamRuntimeError("Failed to instantiate Amalgam runtime.", "1000");
        }
    });
}
