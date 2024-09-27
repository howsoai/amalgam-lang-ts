import fs from "node:fs";
import path from "node:path";
import { initDebugRuntime } from "./debug";
import {
  testCloneEntity,
  testConcurrencyType,
  testExecuteEntityJson,
  testGetEntity,
  testGetVersion,
  testJsonLabel,
  testMaxThreads,
  testVerifyEntity,
} from "./core.test";

const AMALGAM_WASM_DIR = "./src/webassembly/";
const TESTS_DIR = "./tests/";

describe("Test Amalgam Runtime ST", () => {
  let amlg: Awaited<ReturnType<typeof initDebugRuntime>>;

  beforeAll(async () => {
    // Setup AmalgamRuntime
    amlg = await initDebugRuntime(undefined, {
      wasmBinary: fs.readFileSync(path.resolve(AMALGAM_WASM_DIR, "amalgam-st.wasm")),
      getPreloadedPackage: function (packagePath) {
        // Manually load package data from file system
        const data = fs.readFileSync(packagePath);
        return data.buffer;
      },
      locateFile: function (filepath) {
        // Override the local file method to use local file system
        return path.resolve(AMALGAM_WASM_DIR, filepath);
      },
    });
    // Prepare amalgam entity test file in virtual filesystem at root
    const entity = fs.readFileSync(path.resolve(TESTS_DIR, "entity.amlg"));
    amlg.runtime.FS.createDataFile("", "entity.amlg", entity, true, false, false);
  });

  test("verify entity", async () => {
    await testVerifyEntity(amlg);
  });

  test("load entity", async () => {
    await testVerifyEntity(amlg);
  });

  test("clone entity", async () => {
    await testCloneEntity(amlg);
  });

  test("execute entity json", async () => {
    await testExecuteEntityJson(amlg);
  });

  test("json label", async () => {
    await testJsonLabel(amlg);
  });

  test("get entities", async () => {
    await testGetEntity(amlg);
  });

  test("get version", async () => {
    await testGetVersion(amlg);
  });

  test("get concurrency type", async () => {
    await testConcurrencyType(amlg);
  });

  test("get max threads", async () => {
    await testMaxThreads(amlg);
  });
});
