# Introduction

Provides a package around [@howso/amalgam](https://github.com/howsoai/amalgam) releases.

## Usage

```bash
npm i @howso/amalgam-lang
```

## Versioning

Semantic versioning's `MAJOR.MINOR.PATCH` components match the Amalgam release through manual processes.
Additional releases for this package will be identified through `BUILD` segments.

## Development

### Syncing with new Amalgam releases

Anytime a new release is created in [@howso/amalgam](https://github.com/howsoai/amalgam) package's
`amalgam-st.wasm` file should be synced to the `webassembly` directory and the `version.json` updated.

### Update the interfaces

In most releases the Amalgam language's interfaces will not change. When it does, update the other files.

### Publishing

Actions are available through GitHub.
