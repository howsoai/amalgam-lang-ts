import { AmalgamTrace } from "./trace";
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
        const payload = JSON.stringify(data !== null && data !== void 0 ? data : null);
        this.trace.log_time("EXECUTION START");
        this.trace.log_command("EXECUTE_ENTITY_JSON", handle, label, payload);
        const result = this.runtime.executeEntityJson(handle, label, payload);
        this.trace.log_time("EXECUTION STOP");
        this.trace.log_reply(result);
        if (!result)
            return null;
        return JSON.parse(result);
    }
    destroyEntity(handle) {
        this.trace.log_comment("CALL > DestroyEntity");
        this.runtime.destroyEntity(handle);
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
        const payload = JSON.stringify(data !== null && data !== void 0 ? data : null);
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
        return Number(this.runtime.getMaxNumThreads());
    }
    getConcurrencyType() {
        return this.runtime.getConcurrencyType();
    }
}
