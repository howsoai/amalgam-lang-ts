# Migration guide

## 57.0.0

Debugging initialization options have changed. You may now pass any `Logger` shaped object when initializing
to provide additional handling. It's methods will be called automatically.

For simple applications, replacing `{logger: console}` may be sufficient as in the following:

```ts
import { AmalgamWasmService, initRuntime } from "@howso/amalgam-lang";
import wasmDataUri from "@howso/amalgam-lang/lib/amalgam-st.data?url";
import wasmUri from "@howso/amalgam-lang/lib/amalgam-st.wasm?url";

(async function () {
  const svc = new AmalgamWasmService((options) => {
    return initRuntime(
      options,
      {
        locateFile: (path: string) => {
          // Override file paths so we can use hashed version in build
          if (path.endsWith("amalgam-st.wasm")) {
            return wasmUri;
          } else if (path.endsWith("amalgam-st.data")) {
            return wasmDataUri;
          }
          return self.location.href + path;
        },
      },
      { logger: console },
    );
  });
  self.onmessage = async (ev) => {
    svc.dispatch(ev);
  };
  self.postMessage({ type: "event", event: "ready" });
})();
```

## 56.0.0

This breaking change modifies the signature to loadEntity, storeEntity, and cloneEntity. Instead of multiple individual
parameters, an object is now accepted allowing easier configuration only the options you need. New file parameters
have been added to support different sets of options based on the type of file. The contained entity and filename
escape parameters for `caml` files have been moved to the new fileParams parameter.

```ts
import { initRuntime } from "@howso/amalgam-lang";
const amlg = await initRuntime();
await amlg.loadEntity({
  handle: "my-handle",
  filePath: "filename.caml",
  // The properties below are optional:
  fileType: "caml", // defaults to file extension
  fileParams: { transactional: true },
  persistent: false,
  writeLog: "write.log",
  printLog: "print.log",
});
```

Additionally, functions of the class `AmalgamTrace` have been re-named, changing from snake case to camel case.

## 55.0.0

This breaking change modifies the parameters and return of Amalgam.loadEntity. Two new boolean parameters have been
introduced for escapeFilename and escapeContainedFilenames. The return object is no longer a boolean but an object that
includes a boolean property "loaded" along with a "message" if there was an error during load.

```ts
import { type EntityStatus, initRuntime } from "@howso/amalgam-lang";
const amlg = await initRuntime();
const status: EntityStatus = amlg.loadEntity("handle", "filename.caml", false, false, false, false, "", "");
if (status.loaded) {
    ...
}
```

## 54.3.17+rollup

We have updated our packaging methods to introduce top level imports for most items.

All previous deep imports should be updated to the root of the package except for
the `amalgam-st.data` and `amalgam-st.wasm` files:

```ts
import { AmalgamWasmService, initRuntime } from "@howso/amalgam-lang";
import wasmDataUri from "@howso/amalgam-lang/lib/amalgam-st.data?url";
import wasmUri from "@howso/amalgam-lang/lib/amalgam-st.wasm?url";
```
