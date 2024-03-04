import type { Amalgam } from "../api";
import type { AmalgamEmscriptenModule } from "./runtime";
import { AmalgamWorkerService, type Request } from "../worker/index";
export declare class AmalgamWasmService extends AmalgamWorkerService<AmalgamEmscriptenModule> {
    protected handle(amlg: Amalgam<AmalgamEmscriptenModule>, request: Request, channel: MessagePort): Promise<void>;
}
