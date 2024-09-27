import type { AmalgamEmscriptenModule, AmalgamOptions } from "../../api";
import AmalgamRuntime from "../../webassembly/amalgam-st.cjs";
import { initCoreRuntime } from "./core";

export const initRuntime = async (options?: AmalgamOptions, runtimeOverrides?: Partial<AmalgamEmscriptenModule>) => {
  const amlg = await AmalgamRuntime<AmalgamEmscriptenModule>(runtimeOverrides);
  return initCoreRuntime(amlg, options);
};
