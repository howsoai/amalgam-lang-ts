import { initRuntime } from "../wasm";
import { AmalgamWorkerService } from "./service";

describe("AmalgamWorkerService", () => {
  describe("constructor", () => {
    it("should create a the service without options", () => {
      new AmalgamWorkerService((options) => initRuntime(options, {}));
    });

    it("should create the service with custom options", () => {
      new AmalgamWorkerService((options) => initRuntime(options, {}), { logger: console });
    });
  });
});
