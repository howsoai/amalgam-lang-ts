import fs from "node:fs";
import path from "node:path";
import { describe, expect, test, beforeAll } from "@jest/globals";
import { initRuntime } from "./runtime";
import server from "semver";
import { type Logger } from "../utilities";

const AMALGAM_WASM_DIR = "./src/webassembly/";
const TESTS_DIR = "./tests/";

describe("Test Amalgam Runtime ST", () => {
  let amlg: Awaited<ReturnType<typeof initRuntime>>;
  let logger: Logger;

  beforeAll(async () => {
    const error = jest.fn();
    const warn = jest.fn();
    const info = jest.fn();
    const debug = jest.fn();
    logger = { error, warn, info, debug };

    // Setup AmalgamRuntime
    amlg = await initRuntime(
      { logger },
      {
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
      },
    );
    // Prepare amalgam entity test file in virtual filesystem at root
    const entity = fs.readFileSync(path.resolve(TESTS_DIR, "entity.amlg"));
    amlg.runtime.FS.createDataFile("", "entity.amlg", entity, true, false, false);
    const childEntity = fs.readFileSync(path.resolve(TESTS_DIR, "child.amlg"));
    amlg.runtime.FS.createDataFile("", "child.amlg", childEntity, true, false, false);
  });

  test("verify entity", async () => {
    // Test verify entity status response
    // Since this is a plain amlg file, verify should fail with a message
    const status = amlg.verifyEntity("entity.amlg");
    expect(typeof status.loaded).toBe("boolean");
    expect(status.loaded).toEqual(true);
    expect(typeof status.message).toBe("string");
    expect(status.message).toBe(""); // When loaded is true, message should be blank
    expect(typeof status.version).toBe("string");
    expect(status.version).toBe(""); // No header in test amlg file, so this will be blank
  });

  test("load entity", async () => {
    // Test load entity status response
    try {
      const status = amlg.loadEntity({ handle: "load_test", filePath: "entity.amlg" });
      expect(typeof status.loaded).toBe("boolean");
      expect(status.loaded).toEqual(true);
      expect(typeof status.message).toBe("string");
      expect(status.message.length).toBe(0);
      expect(typeof status.version).toBe("string");
    } finally {
      // cleanup loaded entity
      amlg.destroyEntity("load_test");
    }
  });

  test("load-store sub-entity", async () => {
    // Test load and store of a sub-entity
    const handle = "load_store_sub_entity";
    const entityPath = ["child"];
    try {
      const parentStatus = amlg.loadEntity({ handle, filePath: "entity.amlg" });
      expect(typeof parentStatus.loaded).toBe("boolean");
      expect(parentStatus.loaded).toEqual(true);
      expect(parentStatus.entityPath).toEqual([]);

      // load the child entity
      const childStatus = amlg.loadEntity({ handle, filePath: "child.amlg", entityPath });
      expect(typeof childStatus.loaded).toBe("boolean");
      expect(childStatus.loaded).toEqual(true);
      expect(Array.isArray(childStatus.entityPath)).toBe(true);
      expect(childStatus.entityPath).toEqual(entityPath);

      // check child is not a top level entity
      const entities = amlg.getEntities();
      expect(entities).toEqual([handle]);

      // store the child entity
      amlg.storeEntity({ handle, filePath: "stored_child.amlg", entityPath });
      const files = amlg.runtime.FS.readdir("/");
      expect(files).toContain("stored_child.amlg");
      const fileContent = amlg.runtime.FS.readFile("stored_child.amlg", { encoding: "utf8" });
      expect(fileContent).toContain("#is_child (true)");
    } finally {
      // cleanup loaded entity
      amlg.destroyEntity(handle);
    }
  });

  test("clone entity", async () => {
    // Test cloning entities
    try {
      const status1 = amlg.loadEntity({ handle: "entity_1", filePath: "entity.amlg" });
      expect(status1.loaded).toEqual(true);
      const status2 = amlg.cloneEntity({ handle: "entity_1", cloneHandle: "entity_2" });
      expect(status2).toEqual(true);
      const entities = amlg.getEntities();
      expect(Array.isArray(entities)).toBe(true);
      expect(entities.length).toBe(2);
      expect(entities).toContain("entity_1");
      expect(entities).toContain("entity_2");
    } finally {
      // cleanup loaded entities
      amlg.destroyEntity("entity_1");
      amlg.destroyEntity("entity_2");
    }
  });

  test("store entity", async () => {
    // Test cloning entities
    try {
      const status1 = amlg.loadEntity({ handle: "store_test", filePath: "entity.amlg" });
      expect(status1.loaded).toEqual(true);
      amlg.storeEntity({ handle: "store_test", filePath: "new_entity.amlg" });
      const files = amlg.runtime.FS.readdir("/");
      expect(files).toContain("entity.amlg");
      expect(files).toContain("new_entity.amlg");
      const fileContent = amlg.runtime.FS.readFile("new_entity.amlg", { encoding: "utf8" });
      expect(fileContent).toContain(";Simple Amalgam entity");
    } finally {
      // cleanup loaded entities
      amlg.destroyEntity("store_test");
    }
  });

  test("execute entity json", async () => {
    // Test execute entity json
    try {
      amlg.loadEntity({ handle: "execute_test", filePath: "entity.amlg" });
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
      amlg.loadEntity({ handle: "label_test", filePath: "entity.amlg" });
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
      amlg.loadEntity({ handle: "tester", filePath: "entity.amlg" });
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

  test("entity permissions", async () => {
    // Test setting and getting entity permissions
    const handle = "permissions_test";
    try {
      const status = amlg.loadEntity({ handle: handle, filePath: "entity.amlg" });
      expect(status.loaded).toEqual(true);

      const initial_perms = amlg.getEntityPermissions(handle);
      expect(initial_perms).not.toBe(null);
      expect(initial_perms.load).toBe(false);
      expect(initial_perms.store).toBe(false);
      expect(initial_perms.system).toBe(false);
      expect(initial_perms.environment).toBe(false);

      const is_set = amlg.setEntityPermissions(handle, { load: true, store: true, system: false });
      expect(is_set).toBe(true);

      const updated_perms = amlg.getEntityPermissions(handle);
      expect(updated_perms.load).toBe(true);
      expect(updated_perms.store).toBe(true);
      expect(updated_perms.system).toBe(false);
      expect(updated_perms.environment).toBe(false);
    } finally {
      // cleanup loaded entity
      amlg.destroyEntity(handle);
    }
  });

  test("execute json", async () => {
    // Test executing an entity label
    const handle = "execute_json_test";
    try {
      const status = amlg.loadEntity({ handle: handle, filePath: "entity.amlg" });
      expect(status.loaded).toEqual(true);

      const value = "this is a test";
      const result = amlg.executeEntityJson<{ foo?: string }, { foo: string }>(handle, "echo", { foo: value });
      expect(result?.foo).toBe(value);

      const result2 = amlg.executeEntityJson<{ foo?: string }, { foo: string }>(handle, "echo", {});
      expect(result2?.foo).toBe("bar");
    } finally {
      // cleanup loaded entity
      amlg.destroyEntity(handle);
    }
  });
});
