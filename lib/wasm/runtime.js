var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Amalgam } from "../api";
import { AmalgamRuntimeError } from "../errors";
import AmalgamRuntime from "../../webassembly/amalgam-st.js";
export function initRuntime(options, runtimeOverrides) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const amlg = yield AmalgamRuntime(runtimeOverrides);
            amlg.pointerToString = function (ptr) {
                let value;
                try {
                    value = amlg.UTF8ToString(Number(ptr));
                }
                finally {
                    amlg._free(ptr);
                }
                return value;
            };
            amlg.loadEntity = function (...args) {
                const status = amlg.ccall("LoadEntityLegacy", "boolean", ["string", "string", "boolean", "boolean", "string", "string"], args);
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
                const sizePtr = amlg._malloc(8);
                const entitiesPtr = amlg.ccall("GetEntities", "number", ["number"], [BigInt(sizePtr)]);
                const entityPointers = [];
                try {
                    const numEntities = Number(amlg.getValue(sizePtr, "i64"));
                    const entities = [];
                    for (let i = 0; i < numEntities; i++) {
                        const indexPtr = BigInt(entitiesPtr) + BigInt(i * 8);
                        const valuePtr = amlg.getValue(Number(indexPtr), "i64");
                        const value = amlg.UTF8ToString(Number(valuePtr));
                        entities.push(value);
                        entityPointers.push(Number(valuePtr));
                    }
                    return entities;
                }
                finally {
                    entityPointers.forEach((ptr) => amlg._free(ptr));
                    amlg._free(sizePtr);
                    amlg._free(entitiesPtr);
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
        }
        catch (e) {
            throw new AmalgamRuntimeError("Failed to instantiate Amalgam runtime.", "1000");
        }
    });
}
