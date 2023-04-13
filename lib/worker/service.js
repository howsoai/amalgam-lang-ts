var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { AmalgamError } from "../errors.js";
import { isRequest } from "./messages.js";
export function isAmalgamOperation(command) {
    if (command == null) {
        return false;
    }
    switch (command) {
        case "loadEntity":
        case "storeEntity":
        case "executeEntity":
        case "executeEntityJson":
        case "deleteEntity":
        case "getEntities":
        case "setRandomSeed":
        case "setJsonToLabel":
        case "getJsonFromLabel":
        case "setSBFDatastoreEnabled":
        case "isSBFDatastoreEnabled":
        case "getVersion":
        case "setMaxNumThreads":
        case "getMaxNumThreads":
            return true;
        default:
            return false;
    }
}
export class AmalgamWorkerService {
    constructor(initializer, options = {}) {
        this.initializer = initializer;
        this.options = options;
        this.initialized = false;
    }
    dispatch(ev) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const channel = (_a = ev.ports) === null || _a === void 0 ? void 0 : _a[0];
            if (!channel) {
                return;
            }
            if (isRequest(ev.data)) {
                if (ev.data.command === "initialize") {
                    if (this.initialized) {
                        this.sendResponse(true, ev.data, channel);
                    }
                    else {
                        try {
                            this.amlg = yield this.initializer(((_b = ev.data.parameters) === null || _b === void 0 ? void 0 : _b[0]) || {});
                            this.initialized = true;
                            this.sendResponse(false, ev.data, channel);
                        }
                        catch (error) {
                            this.sendError(error, ev.data, channel);
                        }
                    }
                }
                else {
                    yield this.processRequest(ev.data, channel);
                }
            }
            else {
                this.sendError("Malformed Amalgam request.", null, channel);
            }
        });
    }
    sendError(error, request, channel) {
        if (this.options.debug) {
            console.error(error);
        }
        const msg = {
            type: "response",
            command: (request === null || request === void 0 ? void 0 : request.command) || "",
            success: false,
            error: error instanceof AmalgamError
                ? error
                : error instanceof Error
                    ? new AmalgamError(error.message)
                    : new AmalgamError(String(error)),
        };
        channel.postMessage(msg);
    }
    sendResponse(body, { command }, channel) {
        const msg = {
            type: "response",
            success: true,
            command,
            body,
        };
        channel.postMessage(msg);
    }
    processRequest(request, channel) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.amlg == null) {
                this.sendError("Runtime not initialized.", request, channel);
                return;
            }
            if (isAmalgamOperation(request === null || request === void 0 ? void 0 : request.command)) {
                const { command, parameters = [] } = request;
                try {
                    const body = this.amlg[command](...parameters);
                    this.sendResponse(body, request, channel);
                }
                catch (error) {
                    this.sendError(error, request, channel);
                }
            }
            else {
                yield this.handle(this.amlg, request, channel);
            }
        });
    }
    handle(_amlg, request, channel) {
        return __awaiter(this, void 0, void 0, function* () {
            this.sendError("Invalid amalgam operation.", request, channel);
        });
    }
}
