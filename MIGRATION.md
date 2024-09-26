# Migration guide

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
