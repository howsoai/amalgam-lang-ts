/// <reference types="emscripten" />
import { Amalgam, type AmalgamModule, type AmalgamOptions } from "../api";
export type { AmalgamOptions } from "../api";
export interface AmalgamEmscriptenModule extends EmscriptenModule, AmalgamModule {
    cwrap: typeof cwrap;
    ccall: typeof ccall;
    UTF8ToString: typeof UTF8ToString;
    getValue: typeof getValue;
    setValue: typeof setValue;
    pointerToString: (ptr: number | bigint) => string;
    FS: typeof FS;
    mainScriptUrlOrBlob: string | URL;
}
export declare function initRuntime(options?: AmalgamOptions, runtimeOverrides?: Partial<AmalgamEmscriptenModule>): Promise<Amalgam<AmalgamEmscriptenModule>>;
