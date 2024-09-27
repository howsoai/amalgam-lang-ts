import { type Amalgam } from "../../api";
import semver from "semver";

it.todo("Implement a core test");

export const testVerifyEntity = async (amlg: Amalgam) => {
  // Test verify entity status response
  // Since this is a plain amlg file, verify should fail with a message
  const status = amlg.verifyEntity("entity.amlg");
  expect(typeof status.loaded).toBe("boolean");
  expect(status.loaded).toEqual(false);
  expect(typeof status.message).toBe("string");
  expect(status.message).toBe("CAML does not contain a valid header");
  expect(typeof status.version).toBe("string");
  expect(status.version).toBe(""); // No header in amlg files so this will be blank
};

export const testLoadEntity = async (amlg: Amalgam) => {
  // Test load entity status response
  try {
    const status = amlg.loadEntity("load_test", "entity.amlg");
    expect(typeof status.loaded).toBe("boolean");
    expect(status.loaded).toEqual(true);
    expect(typeof status.message).toBe("string");
    expect(status.message.length).toBe(0);
    expect(typeof status.version).toBe("string");
  } finally {
    // cleanup loaded entity
    amlg.destroyEntity("load_test");
  }
};

export const testCloneEntity = async (amlg: Amalgam) => {
  // Test cloning entities
  try {
    const status1 = amlg.loadEntity("entity_1", "entity.amlg");
    expect(status1.loaded).toEqual(true);
    const status2 = amlg.cloneEntity("entity_1", "entity_2");
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
};

export const testExecuteEntityJson = async (amlg: Amalgam) => {
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
};

export const testJsonLabel = async (amlg: Amalgam) => {
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
};

export const testGetEntity = async (amlg: Amalgam) => {
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
};

export const testGetVersion = async (amlg: Amalgam) => {
  // Test version is valid semver value
  const version = amlg.getVersion();
  expect(typeof version).toBe("string");
  expect(semver.valid(version)).not.toBeNull();
};

export const testConcurrencyType = async (amlg: Amalgam) => {
  // Test concurrency type is SingleThreaded
  const value = amlg.getConcurrencyType();
  expect(typeof value).toBe("string");
  expect(value).toMatch("SingleThreaded");
};

export const testMaxThreads = async (amlg: Amalgam) => {
  // Test max threads is 1
  const value = amlg.getMaxNumThreads();
  expect(typeof value).toBe("number");
  expect(value).toEqual(1);
};
