# Migration guide

## 54.3.17+rollup

We have updated our packaging methods to introduce top level imports for most items.

All previous deep imports should be updated to the root of the package except for
the `amalgam-st.data` and `amalgam-st.wasm` files:

```ts
import { AmalgamWasmService, initRuntime } from "@howso/amalgam-lang";
import wasmDataUri from "@howso/amalgam-lang/lib/amalgam-st.data?url";
import wasmUri from "@howso/amalgam-lang/lib/amalgam-st.wasm?url";
```
