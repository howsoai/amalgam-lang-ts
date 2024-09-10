import fs from "node:fs";
import path from "node:path";
import { describe, expect, test, beforeAll } from "@jest/globals";
import { initRuntime } from "./runtime";
import server from "semver";

const AMALGAM_WASM_DIR = "./src/webassembly/";
const TESTS_DIR = "./tests/";

describe("Test Amalgam Runtime ST", () => {
  let amlg: Awaited<ReturnType<typeof initRuntime>>;

  beforeAll(async () => {
    // Setup AmalgamRuntime
    amlg = await initRuntime(undefined, {
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

  test("load entity status", async () => {
    // Test load entity status response
    try {
      const status = amlg.loadEntity("load_test", "entity.amlg");
      expect(typeof status).toBe("boolean");
      expect(status).toEqual(true);
    } finally {
      // cleanup loaded entity
      amlg.destroyEntity("load_test");
    }
  });

  test("execute entity json", async () => {
    // Test execute entity json
    try {
      amlg.loadEntity("execute_test", "entity.amlg");
      // This label should reply with what is input
      const result = amlg.executeEntityJson("execute_test", "echo", { foo: 123 });
      expect(result).toEqual({ foo: 123 });
    } finally {
      // cleanup loaded entity
      amlg.destroyEntity("execute_test");
    }
  });

  test("json label", async () => {
    // Test setting and getting label json
    try {
      amlg.loadEntity("label_test", "entity.amlg");
      // Test string value
      expect(amlg.getJsonFromLabel("label_test", "test_string")).toBe("abc123");
      // Test updating number value
      expect(amlg.getJsonFromLabel("label_test", "test_number")).toBe(1);
      amlg.setJsonToLabel("label_test", "test_number", 12345);
      expect(amlg.getJsonFromLabel("label_test", "test_number")).toBe(12345);
    } finally {
      // cleanup loaded entity
      amlg.destroyEntity("label_test");
    }
  });

  test("get entities", async () => {
    // Test GetEntities contains loaded entities
    try {
      let entities: string[];

      // Check starts with no entities
      entities = amlg.getEntities();
      expect(Array.isArray(entities)).toBe(true);
      expect(entities.length).toBe(0);

      // Load an entity and check response contains it
      amlg.loadEntity("tester", "entity.amlg");
      entities = amlg.getEntities();
      expect(Array.isArray(entities)).toBe(true);
      expect(entities.length).toBe(1);
      expect(entities).toContainEqual("tester");

      // Destroy entity and check response empty
      amlg.destroyEntity("tester");
      entities = amlg.getEntities();
      expect(Array.isArray(entities)).toBe(true);
      expect(entities.length).toBe(0);
    } finally {
      // ensure entity deleted
      amlg.destroyEntity("tester");
    }
  });

  test("get version", async () => {
    // Test version is valid semver value
    const version = amlg.getVersion();
    expect(typeof version).toBe("string");
    expect(server.valid(version)).not.toBeNull();
  });

  test("get concurrency type", async () => {
    // Test concurrency type is SingleThreaded
    const value = amlg.getConcurrencyType();
    expect(typeof value).toBe("string");
    expect(value).toMatch("SingleThreaded");
  });

  test("get max threads", async () => {
    // Test max threads is 1
    const value = amlg.getMaxNumThreads();
    expect(typeof value).toBe("number");
    expect(value).toEqual(1);
  });
});
