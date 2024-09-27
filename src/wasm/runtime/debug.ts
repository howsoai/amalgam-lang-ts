import type { AmalgamEmscriptenModule, AmalgamOptions } from "../../api";
import AmalgamDebugRuntime from "../../webassembly/amalgam-st-debug.cjs";
import { initCoreRuntime } from "./core";

export const initDebugRuntime = async (
  options?: AmalgamOptions,
  runtimeOverrides?: Partial<AmalgamEmscriptenModule>,
) => {
  const amlg = await AmalgamDebugRuntime<AmalgamEmscriptenModule>(runtimeOverrides);
  return initCoreRuntime(amlg, options);
};
