import type { Amalgam } from "../api.js";
import type { AmalgamEmscriptenModule } from "./runtime.js";
import { AmalgamWorkerService, Request } from "../worker/index.js";
export declare class AmalgamWasmService extends AmalgamWorkerService<AmalgamEmscriptenModule> {
    protected handle(amlg: Amalgam<AmalgamEmscriptenModule>, request: Request, channel: MessagePort): Promise<void>;
}
