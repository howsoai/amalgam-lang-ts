import { AmalgamError, AmalgamCoreError } from "./errors.js";
import { AmalgamTrace } from "./trace.js";
import { AmalgamCoreWarning } from "./warnings.js";
export class Amalgam {
    constructor(runtime, options = {}) {
        this.runtime = runtime;
        this.options = options;
        const { sbfDatastoreEnabled = true, trace = false } = options;
        if (trace == null || typeof trace === "boolean") {
            this.trace = new AmalgamTrace(trace);
        }
        else {
            this.trace = trace;
        }
        this.setSBFDatastoreEnabled(sbfDatastoreEnabled);
    }
    getVersion() {
        const version = this.runtime.getVersion();
        this.trace.log_comment("VERSION >", version);
        return version;
    }
    loadEntity(handle, uri, persistent = false, loadContainedEntities = false, writeLog = "", printLog = "") {
        this.trace.log_command("LOAD_ENTITY", handle, uri, persistent, loadContainedEntities, writeLog, printLog);
        const result = this.runtime.loadEntity(handle, uri, persistent, loadContainedEntities, writeLog, printLog);
        this.trace.log_reply(result);
        return result;
    }
    storeEntity(handle, uri, updatePersistenceLocation = false, storeContainedEntities = true) {
        this.trace.log_comment("CALL > StoreEntity");
        this.runtime.storeEntity(handle, uri, updatePersistenceLocation, storeContainedEntities);
    }
    executeEntity(handle, label) {
        this.trace.log_comment("CALL > ExecuteEntity");
        this.runtime.executeEntity(handle, label);
    }
    executeEntityJson(handle, label, data) {
        const payload = this.serialize(data);
        const result = this.executeEntityJsonRaw(handle, label, payload);
        return this.deserialize(result);
    }
    executeEntityJsonRaw(handle, label, payload) {
        this.trace.log_time("EXECUTION START");
        this.trace.log_command("EXECUTE_ENTITY_JSON", handle, label, payload);
        const result = this.runtime.executeEntityJson(handle, label, payload);
        this.trace.log_time("EXECUTION STOP");
        this.trace.log_reply(result);
        return result;
    }
    deleteEntity(handle) {
        this.trace.log_comment("CALL > DeleteEntity");
        this.runtime.deleteEntity(handle);
    }
    getEntities() {
        this.trace.log_comment("CALL > GetEntities");
        return this.runtime.getEntities();
    }
    setRandomSeed(handle, seed) {
        this.trace.log_command("SET_RANDOM_SEED", seed);
        const result = this.runtime.setRandomSeed(handle, seed);
        this.trace.log_reply(result);
        return result;
    }
    setJsonToLabel(handle, label, data) {
        const payload = this.serialize(data);
        this.trace.log_command("SET_JSON_TO_LABEL", handle, label, payload);
        this.runtime.setJsonToLabel(handle, label, payload);
    }
    getJsonFromLabel(handle, label) {
        this.trace.log_command("GET_JSON_FROM_LABEL", handle, label);
        const result = this.runtime.getJsonFromLabel(handle, label);
        this.trace.log_reply(result);
        if (!result)
            return null;
        return JSON.parse(result);
    }
    setSBFDatastoreEnabled(enabled) {
        this.runtime.setSBFDatastoreEnabled(enabled);
    }
    isSBFDatastoreEnabled() {
        return this.runtime.isSBFDatastoreEnabled();
    }
    setMaxNumThreads(threads) {
        this.runtime.setMaxNumThreads(threads);
    }
    getMaxNumThreads() {
        return this.runtime.getMaxNumThreads();
    }
    serialize(payload) {
        if (!payload) {
            return JSON.stringify({});
        }
        const filtered = Object.assign({}, payload);
        for (const key in filtered) {
            if (filtered[key] == null) {
                delete filtered[key];
            }
        }
        return JSON.stringify(filtered);
    }
    deserialize(payload) {
        var _a, _b;
        if (!payload) {
            throw new AmalgamError("Null or empty response received from core.");
        }
        const deserialized_payload = JSON.parse(payload);
        if ((deserialized_payload === null || deserialized_payload === void 0 ? void 0 : deserialized_payload.constructor) == Object) {
            const errors = [];
            const warnings = [];
            if (((_a = deserialized_payload.warnings) === null || _a === void 0 ? void 0 : _a.length) > 0) {
                for (const w of deserialized_payload.warnings) {
                    warnings.push(new AmalgamCoreWarning(w === null || w === void 0 ? void 0 : w.detail, w === null || w === void 0 ? void 0 : w.code));
                }
            }
            if (deserialized_payload.status !== "ok") {
                if (((_b = deserialized_payload.errors) === null || _b === void 0 ? void 0 : _b.length) > 0) {
                    for (const e of deserialized_payload.errors) {
                        errors.push(new AmalgamCoreError(e === null || e === void 0 ? void 0 : e.detail, e === null || e === void 0 ? void 0 : e.code));
                    }
                }
                else {
                    errors.push(new AmalgamCoreError("An unknown error occurred."));
                }
                return { errors, warnings, content: deserialized_payload.payload };
            }
            return {
                errors,
                warnings,
                content: deserialized_payload.payload,
            };
        }
        else if (["string", "number", "bigint", "boolean"].indexOf(typeof deserialized_payload) != -1) {
            return { errors: [], warnings: [], content: deserialized_payload };
        }
        throw new AmalgamError("Malformed response received from core.");
    }
}
