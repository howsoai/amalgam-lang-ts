import type { Amalgam } from "../api.js";
import type { AmalgamEmscriptenModule } from "./runtime.js";
import { AmalgamWorkerService, Request, isFileSystemRequest } from "../worker/index.js";

export class AmalgamWasmService extends AmalgamWorkerService<AmalgamEmscriptenModule> {
  protected async handle(
    amlg: Amalgam<AmalgamEmscriptenModule>,
    request: Request,
    channel: MessagePort,
  ): Promise<void> {
    if (isFileSystemRequest(request?.command)) {
      const { command, parameters = [] } = request;
      try {
        const body = (amlg.runtime.FS[command] as CallableFunction)(...parameters);
        switch (request.command) {
          case "readdir":
          case "readFile":
            this.sendResponse(body, request, channel);
            break;
          default:
            this.sendResponse(undefined, request, channel);
            break;
        }
      } catch (error) {
        this.sendError(error as Error, request, channel);
      }
    } else {
      await super.handle(amlg, request, channel);
    }
  }
}
