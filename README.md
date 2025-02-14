# Introduction

Provides a package around [@howso/amalgam](https://github.com/howsoai/amalgam) releases.

Amalgam version: [60.0.0](https://github.com/howsoai/amalgam/releases/tag/60.0.0)

## Usage

```bash
npm i @howso/amalgam-lang
npm i --save-dev @types/emscripten
```

We highly suggest the use of a Worker. Create one that can be handed to `@howso/engine`.

`@/workers/AmalgamWorker`:

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

## Development

### Syncing with new Amalgam releases

Anytime a new release is created in [@howso/amalgam](https://github.com/howsoai/amalgam) package's
`amalgam-st.wasm`, update the entire `src/webassembly` directory's contents.

### Update the interfaces

In most releases the Amalgam language's interfaces will not change. When it does, update the other files.

## Publishing

Actions are available through GitHub.
