import { initRuntime } from "../wasm";
import { AmalgamWorkerService } from "./service";

describe("AmalgamWorkerService", () => {
  describe("constructor", () => {
    it("should create a the service with default options", () => {
      new AmalgamWorkerService((options) => initRuntime(options, {}));
    });

    it("should create teh service with custom options", () => {
      new AmalgamWorkerService((options) => initRuntime(options, {}), { logger: console });
    });
  });
});
