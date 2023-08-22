/// <reference types="emscripten" />
import { Amalgam, AmalgamModule, AmalgamOptions } from "../api.js";
export { AmalgamOptions } from "../api.js";
export interface AmalgamEmscriptenModule extends EmscriptenModule, AmalgamModule {
    cwrap: typeof cwrap;
    ccall: typeof ccall;
    FS: typeof FS;
    mainScriptUrlOrBlob: string | URL;
}
export declare function initRuntime(options?: AmalgamOptions, runtimeOverrides?: Partial<AmalgamEmscriptenModule>): Promise<Amalgam<AmalgamEmscriptenModule>>;
